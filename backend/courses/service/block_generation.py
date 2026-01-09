import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.llm.blocks.service import generate_lesson_block
from core.llm.blocks.schema import LessonBlockGenerateContext
from courses.service.access_control import ensure_course_access
from courses.dao import LessonDAO, LessonBlockDAO, CourseDAO
from courses.schema.blocks import LessonBlock, db_block_to_schema, build_block_context
from uuid import UUID

logger = logging.getLogger(__name__)


async def generate_lesson_block_content(
    db: AsyncSession,
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    user_id: int,
    user_request: str | None = None,
    context: str | None = None,
) -> LessonBlock:
    """Сгенерировать или переформулировать контент для одного блока урока."""
    # Проверяем, что пользователь является автором курса
    await ensure_course_access(db, course_id, user_id, require_author=True)

    # Получаем курс
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Получаем урок
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found in this course")

    # Получаем текущий блок
    current_block = await LessonBlockDAO.get_by_id(db, block_id)
    if not current_block:
        raise HTTPException(status_code=404, detail="Lesson block not found")
    if current_block.lesson_id != lesson_id:
        raise HTTPException(status_code=404, detail="Block not found in this lesson")

    # Получаем соседние блоки по позиции
    current_position = current_block.position

    # Получаем предыдущий блок (позиция - 1)
    previous_block = None
    if current_position > 0:
        previous_block = await LessonBlockDAO.get_by_position(
            db, lesson_id, current_position - 1
        )

    # Получаем следующий блок (позиция + 1)
    next_block = await LessonBlockDAO.get_by_position(
        db, lesson_id, current_position + 1
    )

    # Конвертируем блоки из БД в схемы и извлекаем только полезный контекст
    previous_block_dict = None
    if previous_block:
        prev_schema = db_block_to_schema(previous_block)
        previous_block_dict = build_block_context(prev_schema)

    current_block_dict = None
    if current_block:
        curr_schema = db_block_to_schema(current_block)
        current_block_dict = build_block_context(curr_schema)

    next_block_dict = None
    if next_block:
        next_schema = db_block_to_schema(next_block)
        next_block_dict = build_block_context(next_schema)

    logger.info(
        f"User {user_id} generating block content for block {block_id} "
        f"in lesson {lesson_id} (topic: {lesson.name}) in course {course_id}"
    )

    # Создаем контекст для генерации
    generate_context = LessonBlockGenerateContext(
        course_name=course.name,
        course_description=course.description,
        lesson_topic=lesson.name,
        lesson_description=lesson.description,
        user_request=user_request,
        context=context,
        previous_block=previous_block_dict,
        current_block=current_block_dict,
        next_block=next_block_dict,
        block_type=current_block.type,  # Сохраняем тип текущего блока
    )

    # Генерируем блок
    generated_content = await generate_lesson_block(generate_context)

    logger.info(
        f"Successfully generated block {block_id} "
        f"for lesson {lesson_id} (topic: '{lesson.name}') in course {course_id}"
    )

    return generated_content.block
