import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.schema import LessonCreate, LessonUpdate
from courses.dao import CourseDAO, LessonDAO
from courses.service.access_control import ensure_course_access

logger = logging.getLogger(__name__)


async def create_lesson(db: AsyncSession, lesson: LessonCreate, user_id: int):
    """Создать урок"""
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
    
    # Преобразуем блоки в dict для хранения
    # Блоки могут быть уже словарями или Pydantic моделями
    blocks_list = []
    for block in lesson.blocks:
        if isinstance(block, dict):
            blocks_list.append(block)
        else:
            blocks_list.append(block.model_dump() if hasattr(block, 'model_dump') else dict(block))
    content_dict = {"blocks": blocks_list}
    
    logger.info(f"User {user_id} creating lesson '{lesson.name}' in course {lesson.course_id} at position {position}")
    created_lesson = await LessonDAO.create(
        db,
        course_id=lesson.course_id,
        position=position,
        name=lesson.name,
        description=lesson.description,
        content=content_dict
    )
    await db.commit()
    logger.info(f"Lesson {created_lesson.id} created successfully")
    return created_lesson


async def get_lesson(db: AsyncSession, lesson_id: int, user_id: int):
    """Получить урок по ID"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка доступа к курсу
    await ensure_course_access(db, lesson.course_id, user_id, require_author=False)
    
    return lesson


async def get_course_lessons(db: AsyncSession, course_id: int, user_id: int):
    """Получить все уроки курса"""
    # Проверка доступа к курсу
    await ensure_course_access(db, course_id, user_id, require_author=False)
    
    return await LessonDAO.get_all_by_course(db, course_id)


async def update_lesson(
    db: AsyncSession,
    lesson_id: int,
    lesson_update: LessonUpdate,
    user_id: int
):
    """Обновить урок"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    # Собираем данные для обновления
    update_data = lesson_update.model_dump(exclude_unset=True)
    if not update_data:
        return lesson
    
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
    
    # Если обновляются блоки, преобразуем их в dict
    if "blocks" in update_data:
        if not isinstance(update_data["blocks"], list):
            raise HTTPException(status_code=400, detail="Blocks must be a list")
        blocks_list = []
        for block in update_data["blocks"]:
            if isinstance(block, dict):
                blocks_list.append(block)
            else:
                blocks_list.append(block.model_dump() if hasattr(block, 'model_dump') else dict(block))
        update_data["content"] = {"blocks": blocks_list}
        del update_data["blocks"]
    
    updated_lesson = await LessonDAO.update(db, lesson_id, **update_data)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    await db.commit()
    return updated_lesson


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
):
    """Изменить позицию урока (с защитой от race conditions)"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, lesson.course_id, user_id, require_author=True)
    
    old_position = lesson.position
    if new_position == old_position:
        return lesson
    
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
    
    # Сдвигаем остальные уроки
    if new_position < old_position:
        # Сдвигаем вправо (увеличиваем позиции)
        for l in all_lessons:
            if old_position > l.position >= new_position and l.id != lesson_id:
                await LessonDAO.update_in_transaction(db, l.id, position=l.position + 1)
    else:
        # Сдвигаем влево (уменьшаем позиции)
        for l in all_lessons:
            if old_position < l.position <= new_position and l.id != lesson_id:
                await LessonDAO.update_in_transaction(db, l.id, position=l.position - 1)
    
    await db.flush()
    
    # Устанавливаем новую позицию
    await LessonDAO.update_in_transaction(db, lesson_id, position=new_position)
    await db.commit()
    
    # Получаем обновленный урок после коммита
    return await LessonDAO.get_by_id(db, lesson_id)

