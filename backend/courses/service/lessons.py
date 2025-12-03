import logging
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from courses.schema import LessonCreate, LessonUpdate, LessonResponse, LessonListItem
from courses.dao import CourseDAO, LessonDAO, LessonBlockDAO
from courses.dao.models import Lesson
from courses.service.access_control import ensure_course_access
from courses.schema.blocks import block_schema_to_dict, db_block_to_schema

logger = logging.getLogger(__name__)


async def create_lesson(db: AsyncSession, lesson: LessonCreate, user_id: int) -> LessonResponse:
    """Создать урок и вернуть в формате LessonResponse"""
    # Проверка, что курс существует и пользователь - его автор
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Если позиция не указана (None) или отрицательная, назначаем следующую доступную
    position = lesson.position
    if position is None or position < 0:
        position = await LessonDAO.get_next_position(db, lesson.course_id)
        logger.debug(f"Auto-assigning position {position} for new lesson in course {lesson.course_id}")
    else:
        # Проверка уникальности позиции
        existing_lesson = await LessonDAO.get_by_position(db, lesson.course_id, position)
        if existing_lesson:
            raise HTTPException(
                status_code=400,
                detail=f"Lesson with position {position} already exists. Use position=None for automatic assignment."
            )
    
    logger.info(f"User {user_id} creating lesson '{lesson.name}' in course {lesson.course_id} at position {position}")
    # Создаем урок без блоков сначала
    created_lesson = await LessonDAO.create(
        db,
        course_id=lesson.course_id,
        position=position,
        name=lesson.name,
        description=lesson.description
    )
    await db.flush()
    
    # Создаем блоки
    if lesson.blocks:
        blocks_to_create = []
        for pos, block in enumerate(lesson.blocks):
            # Конвертируем блок в словарь
            if isinstance(block, dict):
                block_dict = block.copy()
                block_type = block_dict.pop("type")
            else:
                block_dict = block_schema_to_dict(block)
                block_type = block.type
            
            blocks_to_create.append({
                "position": pos,
                "type": block_type,
                "data": block_dict
            })
        
        await LessonBlockDAO.create_bulk(db, created_lesson.id, blocks_to_create)
    
    await db.commit()
    
    # Загружаем урок с блоками для ответа
    created_lesson = await load_lesson_with_blocks(db, created_lesson.id)
    if not created_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after creation")
    
    blocks = convert_blocks_for_response(created_lesson)
    logger.info(f"Lesson {created_lesson.id} created successfully")
    
    return LessonResponse(
        id=created_lesson.id,
        course_id=created_lesson.course_id,
        position=created_lesson.position,
        name=created_lesson.name,
        description=created_lesson.description,
        blocks=blocks,
        created_at=created_lesson.created_at,
        updated_at=created_lesson.updated_at
    )


def convert_blocks_for_response(lesson, is_author: bool = True):
    """Конвертировать блоки из БД в формат для ответа
    
    Args:
        lesson: Урок с блоками
        is_author: Является ли пользователь автором курса. Если False, скрывает правильные ответы
    """
    blocks = []
    if lesson.blocks:
        for db_block in lesson.blocks:
            block_dict = db_block_to_schema(db_block)
            # Если пользователь не автор, скрываем правильные ответы
            if not is_author:
                if block_dict.get("type") == "single_choice":
                    block_dict.pop("correct_answer", None)
                    block_dict.pop("explanation", None)
                elif block_dict.get("type") == "multiple_choice":
                    block_dict.pop("correct_answers", None)
                    block_dict.pop("explanation", None)
            blocks.append(block_dict)
    return blocks


async def load_lesson_with_blocks(db: AsyncSession, lesson_id: int) -> Lesson | None:
    """Загрузить урок с блоками через relationship"""
    result = await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(selectinload(Lesson.blocks))
    )
    return result.scalar_one_or_none()


async def get_lesson(db: AsyncSession, lesson_id: int, user_id: int):
    """Получить урок по ID"""
    lesson = await load_lesson_with_blocks(db, lesson_id)
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка доступа к курсу
    await ensure_course_access(db, lesson.course_id, user_id, require_author=False)
    
    return lesson


async def get_lesson_response(db: AsyncSession, lesson_id: int, user_id: int) -> LessonResponse:
    """Получить урок по ID и вернуть в формате LessonResponse"""
    lesson = await get_lesson(db, lesson_id, user_id)
    
    # Проверяем, является ли пользователь автором курса
    from courses.service.access_control import check_course_access
    is_author, _ = await check_course_access(db, lesson.course_id, user_id, require_author=False)
    # is_author будет True только если пользователь - автор курса
    
    blocks = convert_blocks_for_response(lesson, is_author=is_author)
    
    return LessonResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        position=lesson.position,
        name=lesson.name,
        description=lesson.description,
        blocks=blocks,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at
    )


async def get_course_lessons(db: AsyncSession, course_id: int, user_id: int) -> list[LessonListItem]:
    """Получить все уроки курса в формате LessonListItem"""
    # Проверка доступа к курсу
    await ensure_course_access(db, course_id, user_id, require_author=False)
    
    # Для списка уроков блоки не нужны, загружаем без них
    lessons = await LessonDAO.get_all_by_course(db, course_id)
    
    return [
        LessonListItem(
            id=lesson.id,
            course_id=lesson.course_id,
            position=lesson.position,
            name=lesson.name,
            description=lesson.description,
            created_at=lesson.created_at
        )
        for lesson in lessons
    ]


async def update_lesson(
    db: AsyncSession,
    lesson_id: int,
    lesson_update: LessonUpdate,
    user_id: int
) -> LessonResponse:
    """Обновить урок и вернуть в формате LessonResponse"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Собираем данные для обновления
    update_data = lesson_update.model_dump(exclude_unset=True)
    if not update_data:
        # Если нет изменений, просто возвращаем текущий урок
        updated_lesson = await load_lesson_with_blocks(db, lesson_id)
        if not updated_lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        blocks = convert_blocks_for_response(updated_lesson)
        return LessonResponse(
            id=updated_lesson.id,
            course_id=updated_lesson.course_id,
            position=updated_lesson.position,
            name=updated_lesson.name,
            description=updated_lesson.description,
            blocks=blocks,
            created_at=updated_lesson.created_at,
            updated_at=updated_lesson.updated_at
        )
    
    # Если обновляется позиция, проверяем уникальность
    if "position" in update_data and update_data["position"] != lesson.position:
        existing = await LessonDAO.get_by_position(
            db,
            lesson.course_id,
            update_data["position"]
        )
        if existing and existing.id != lesson_id:
            raise HTTPException(
                status_code=400,
                detail=f"Lesson with position {update_data['position']} already exists"
            )
    
    # Обновляем остальные поля урока
    if update_data:
        updated_lesson = await LessonDAO.update(db, lesson_id, **update_data)
        if not updated_lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
    else:
        updated_lesson = lesson
    
    await db.commit()
    
    # Загружаем урок с блоками для ответа
    updated_lesson = await load_lesson_with_blocks(db, lesson_id)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after update")
    
    blocks = convert_blocks_for_response(updated_lesson)
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )


async def delete_lesson(db: AsyncSession, lesson_id: int, user_id: int):
    """Удалить урок"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    logger.warning(f"User {user_id} deleting lesson {lesson_id} from course {lesson.course_id}")
    await LessonDAO.delete(db, lesson_id)
    await db.commit()
    logger.info(f"Lesson {lesson_id} deleted successfully by user {user_id}")
    return {"message": "Lesson deleted successfully"}


async def reorder_lesson(
    db: AsyncSession,
    lesson_id: int,
    new_position: int,
    user_id: int
) -> LessonResponse:
    """Изменить позицию урока (с защитой от race conditions) и вернуть в формате LessonResponse"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    old_position = lesson.position
    if new_position == old_position:
        # Позиция не изменилась, просто возвращаем урок
        updated_lesson = await load_lesson_with_blocks(db, lesson_id)
        if not updated_lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        blocks = convert_blocks_for_response(updated_lesson)
        return LessonResponse(
            id=updated_lesson.id,
            course_id=updated_lesson.course_id,
            position=updated_lesson.position,
            name=updated_lesson.name,
            description=updated_lesson.description,
            blocks=blocks,
            created_at=updated_lesson.created_at,
            updated_at=updated_lesson.updated_at
        )
    
    # Получаем все уроки курса для актуальных данных
    all_lessons = await LessonDAO.get_all_by_course(db, lesson.course_id)
    
    # Проверяем, что новая позиция валидна
    max_position = max((l.position for l in all_lessons), default=-1)
    if new_position < 0 or new_position > max_position + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Position {new_position} is out of range. Valid range: 0-{max_position + 1}"
        )
    
    # Создаем временную позицию для избежания конфликтов
    # Используем отрицательное значение, которое точно не конфликтует
    temp_position = -1
    await LessonDAO.update_in_transaction(db, lesson_id, position=temp_position)
    await db.flush()
    
    # Перезагружаем уроки после перемещения во временную позицию
    all_lessons = await LessonDAO.get_all_by_course(db, lesson.course_id)
    
    # Сдвигаем остальные уроки
    if new_position < old_position:
        # Сдвигаем вправо (увеличиваем позиции)
        # Важно: делаем это в порядке УБЫВАНИЯ позиций, чтобы избежать конфликтов
        lessons_to_shift = [l for l in all_lessons 
                           if old_position > l.position >= new_position and l.id != lesson_id]
        lessons_to_shift.sort(key=lambda x: x.position, reverse=True)
        for l in lessons_to_shift:
            await LessonDAO.update_in_transaction(db, l.id, position=l.position + 1)
    else:
        # Сдвигаем влево (уменьшаем позиции)
        # Важно: делаем это в порядке ВОЗРАСТАНИЯ позиций, чтобы избежать конфликтов
        lessons_to_shift = [l for l in all_lessons 
                           if old_position < l.position <= new_position and l.id != lesson_id]
        lessons_to_shift.sort(key=lambda x: x.position)
        for l in lessons_to_shift:
            await LessonDAO.update_in_transaction(db, l.id, position=l.position - 1)
    
    await db.flush()
    
    # Устанавливаем новую позицию
    await LessonDAO.update_in_transaction(db, lesson_id, position=new_position)
    await db.commit()
    
    # Загружаем обновленный урок с блоками
    updated_lesson = await load_lesson_with_blocks(db, lesson_id)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after reorder")
    
    blocks = convert_blocks_for_response(updated_lesson)
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )


async def add_block_to_lesson(
    db: AsyncSession,
    lesson_id: int,
    block_data: dict,
    user_id: int
) -> LessonResponse:
    """Добавить новый блок к уроку"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Получаем текущие блоки урока
    existing_blocks = await LessonBlockDAO.get_all_by_lesson(db, lesson_id)
    
    # Определяем следующую позицию
    next_position = len(existing_blocks)
    
    # Извлекаем тип блока
    block_type = block_data.pop("type")
    
    # Создаем новый блок
    await LessonBlockDAO.create(
        db,
        lesson_id=lesson_id,
        position=next_position,
        block_type=block_type,
        data=block_data
    )
    
    await db.commit()
    
    # Загружаем обновленный урок с блоками
    updated_lesson = await load_lesson_with_blocks(db, lesson_id)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after adding block")
    
    blocks = convert_blocks_for_response(updated_lesson)
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )


async def verify_lesson_belongs_to_course(db: AsyncSession, lesson_id: int, course_id: int, user_id: int):
    """Проверить, что урок принадлежит указанному курсу"""
    lesson = await get_lesson(db, lesson_id, user_id)
    if lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found in this course")
    return lesson


async def update_block(
    db: AsyncSession,
    lesson_id: int,
    block_id: UUID,
    block_update: dict,
    user_id: int
) -> LessonResponse:
    """Обновить отдельный блок урока"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Проверяем, что блок существует и принадлежит уроку
    block = await LessonBlockDAO.get_by_id(db, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block does not belong to this lesson")
    
    # Обновляем блок
    block_type = block_update.get("type", block.type)
    block_data = block_update.copy()
    block_data.pop("type", None)
    block_data.pop("block_id", None)  # Убираем block_id, если он есть
    
    await LessonBlockDAO.update(
        db,
        block_id,
        type=block_type,
        data=block_data
    )
    
    await db.commit()
    
    # Загружаем обновленный урок с блоками
    updated_lesson = await load_lesson_with_blocks(db, lesson_id)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after update")
    
    blocks = convert_blocks_for_response(updated_lesson)
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )


async def check_question_answer(
    db: AsyncSession,
    lesson_id: int,
    block_id: UUID,
    user_answer: int | list[int],
    user_id: int
) -> dict:
    """
    Проверить ответ пользователя на вопрос
    
    Args:
        db: Сессия базы данных
        lesson_id: ID урока
        block_id: ID блока с вопросом
        user_answer: Ответ пользователя (int для single_choice, list[int] для multiple_choice)
        user_id: ID пользователя
    
    Returns:
        dict: {
            "is_correct": bool,
            "correct_answer": int | list[int] | None,  # Правильный ответ (только если ответ правильный)
            "explanation": str | None  # Пояснение (только если ответ правильный)
        }
    """
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка доступа к курсу (не требуется быть автором)
    await ensure_course_access(db, lesson.course_id, user_id, require_author=False)
    
    # Проверяем, что блок существует и принадлежит уроку
    block = await LessonBlockDAO.get_by_id(db, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block does not belong to this lesson")
    
    if block.type not in ["single_choice", "multiple_choice"]:
        raise HTTPException(status_code=400, detail="Block is not a question")
    
    block_data = block.data
    
    if block.type == "single_choice":
        correct_answer = block_data.get("correct_answer")
        if not isinstance(user_answer, int):
            raise HTTPException(status_code=400, detail="Invalid answer format for single_choice question")
        
        is_correct = user_answer == correct_answer
        
        return {
            "is_correct": is_correct,
            "correct_answer": correct_answer if is_correct else None,
            "explanation": block_data.get("explanation") if is_correct else None
        }
    
    elif block.type == "multiple_choice":
        correct_answers = block_data.get("correct_answers", [])
        if not isinstance(user_answer, list):
            raise HTTPException(status_code=400, detail="Invalid answer format for multiple_choice question")
        
        # Сортируем для сравнения
        user_answer_sorted = sorted(user_answer)
        correct_answers_sorted = sorted(correct_answers)
        
        is_correct = user_answer_sorted == correct_answers_sorted
        
        return {
            "is_correct": is_correct,
            "correct_answers": correct_answers if is_correct else None,
            "explanation": block_data.get("explanation") if is_correct else None
        }
    
    raise HTTPException(status_code=400, detail="Unsupported question type")


async def reorder_block(
    db: AsyncSession,
    lesson_id: int,
    block_id: UUID,
    new_position: int,
    user_id: int
) -> LessonResponse:
    """Изменить позицию блока в уроке"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Проверяем, что блок существует и принадлежит уроку
    block = await LessonBlockDAO.get_by_id(db, block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block does not belong to this lesson")
    
    old_position = block.position
    if new_position == old_position:
        # Позиция не изменилась, просто возвращаем урок
        updated_lesson = await load_lesson_with_blocks(db, lesson_id)
        if not updated_lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        blocks = convert_blocks_for_response(updated_lesson)
        return LessonResponse(
            id=updated_lesson.id,
            course_id=updated_lesson.course_id,
            position=updated_lesson.position,
            name=updated_lesson.name,
            description=updated_lesson.description,
            blocks=blocks,
            created_at=updated_lesson.created_at,
            updated_at=updated_lesson.updated_at
        )
    
    # Получаем все блоки урока
    all_blocks = await LessonBlockDAO.get_all_by_lesson(db, lesson_id)
    
    # Проверяем, что новая позиция валидна
    max_position = max((b.position for b in all_blocks), default=-1)
    if new_position < 0 or new_position > max_position:
        raise HTTPException(
            status_code=400,
            detail=f"Position {new_position} is out of range. Valid range: 0-{max_position}"
        )
    
    # Создаем временную позицию для избежания конфликтов
    # Используем отрицательное значение, которое точно не конфликтует
    temp_position = -1
    await LessonBlockDAO.update_in_transaction(db, block_id, position=temp_position)
    await db.flush()
    
    # Перезагружаем блоки после перемещения во временную позицию
    all_blocks = await LessonBlockDAO.get_all_by_lesson(db, lesson_id)
    
    # Сдвигаем остальные блоки
    if new_position < old_position:
        # Сдвигаем вправо (увеличиваем позиции)
        # Важно: делаем это в порядке УБЫВАНИЯ позиций, чтобы избежать конфликтов
        blocks_to_shift = [b for b in all_blocks 
                          if old_position > b.position >= new_position and b.id != block_id]
        blocks_to_shift.sort(key=lambda x: x.position, reverse=True)
        for b in blocks_to_shift:
            await LessonBlockDAO.update_in_transaction(db, b.id, position=b.position + 1)
    else:
        # Сдвигаем влево (уменьшаем позиции)
        # Важно: делаем это в порядке ВОЗРАСТАНИЯ позиций, чтобы избежать конфликтов
        blocks_to_shift = [b for b in all_blocks 
                          if old_position < b.position <= new_position and b.id != block_id]
        blocks_to_shift.sort(key=lambda x: x.position)
        for b in blocks_to_shift:
            await LessonBlockDAO.update_in_transaction(db, b.id, position=b.position - 1)
    
    await db.flush()
    
    # Устанавливаем новую позицию
    await LessonBlockDAO.update_in_transaction(db, block_id, position=new_position)
    await db.commit()
    
    # Загружаем обновленный урок с блоками
    updated_lesson = await load_lesson_with_blocks(db, lesson_id)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found after reorder")
    
    blocks = convert_blocks_for_response(updated_lesson)
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )

