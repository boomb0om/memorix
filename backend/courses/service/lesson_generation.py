import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from core.llm.lessons.service import generate_lesson_blocks
from core.llm.lessons.schema import LessonBlocksGenerateContext
from courses.service.access_control import ensure_course_access
from courses.dao import LessonDAO
from courses.schema.blocks import LessonBlock

logger = logging.getLogger(__name__)


async def generate_lesson_content(
    db: AsyncSession,
    course_id: int,
    lesson_id: int,
    user_id: int,
    context: str | None = None,
    goal: str | None = None,
    focus_points: list[str] | None = None,
) -> list[LessonBlock]:
    # Проверяем, что пользователь является автором курса
    await ensure_course_access(db, course_id, user_id, require_author=True)
    
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if lesson.course_id != course_id:
        raise HTTPException(status_code=404, detail="Lesson not found in this course")
    
    topic = lesson.name
    description = lesson.description
    
    logger.info(f"User {user_id} generating lesson content for lesson {lesson_id} (topic: {topic}) in course {course_id}")
    
    generate_context = LessonBlocksGenerateContext(
        topic=topic,
        description=description,
        context=context,
        goal=goal,
        focus_points=focus_points,
    )
    generated_content = await generate_lesson_blocks(generate_context)
    
    logger.info(
        f"Successfully generated {len(generated_content.blocks)} blocks "
        f"for lesson {lesson_id} (topic: '{topic}') in course {course_id}"
    )
    
    return generated_content.blocks

