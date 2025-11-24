import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.schema import CourseCreate, CourseUpdate
from courses.dao import CourseDAO, LessonDAO
from courses.service.access_control import ensure_course_access
from core.llm.courses.openai_generator import get_mistral_course_generator
from core.llm.courses.schema import CourseSummaryGenerateContext

logger = logging.getLogger(__name__)


async def create_course(db: AsyncSession, course: CourseCreate, author_id: int):
    """Создать курс"""
    logger.info(f"User {author_id} creating course: {course.name}")
    created_course = await CourseDAO.create(
        db,
        name=course.name,
        description=course.description,
        author_id=author_id
    )
    await db.commit()
    logger.info(f"Course {created_course.id} created successfully by user {author_id}")
    return created_course


async def get_course(db: AsyncSession, course_id: int, user_id: int):
    """Получить курс по ID"""
    return await ensure_course_access(db, course_id, user_id, require_author=False)


async def get_course_with_lessons(db: AsyncSession, course_id: int, user_id: int):
    """Получить курс с уроками"""
    # Проверяем доступ
    await ensure_course_access(db, course_id, user_id, require_author=False)
    
    # Получаем курс с уроками
    course = await CourseDAO.get_by_id_with_lessons(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course


async def get_user_courses(db: AsyncSession, user_id: int):
    """Получить все курсы пользователя (автор или есть доступ)"""
    return await CourseDAO.get_all_accessible_by_user(db, user_id)


async def get_my_courses(db: AsyncSession, author_id: int):
    """Получить курсы, созданные пользователем"""
    return await CourseDAO.get_all_by_author(db, author_id)


async def update_course(
    db: AsyncSession,
    course_id: int,
    course_update: CourseUpdate,
    user_id: int
):
    """Обновить курс"""
    # Проверка, что пользователь - автор курса
    await ensure_course_access(db, course_id, user_id, require_author=True)
    
    # Собираем только те поля, которые были переданы
    update_data = course_update.model_dump(exclude_unset=True)
    if not update_data:
        # Если ничего не передано, просто возвращаем курс
        return await CourseDAO.get_by_id(db, course_id)
    
    logger.info(f"User {user_id} updating course {course_id} with fields: {list(update_data.keys())}")
    updated_course = await CourseDAO.update(db, course_id, **update_data)
    if not updated_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    await db.commit()
    logger.info(f"Course {course_id} updated successfully by user {user_id}")
    return updated_course


async def delete_course(db: AsyncSession, course_id: int, user_id: int):
    """Удалить курс"""
    # Проверка, что пользователь - автор курса
    course = await ensure_course_access(db, course_id, user_id, require_author=True)
    
    # Загружаем курс с уроками для подсчета
    course_with_lessons = await CourseDAO.get_by_id_with_lessons(db, course_id)
    lessons_count = len(course_with_lessons.lessons) if course_with_lessons and course_with_lessons.lessons else 0
    
    logger.warning(f"User {user_id} deleting course {course_id} with {lessons_count} lessons")
    await CourseDAO.delete(db, course_id)
    await db.commit()
    logger.info(f"Course {course_id} deleted successfully by user {user_id}")
    
    return {
        "message": "Course deleted successfully",
        "lessons_deleted": lessons_count
    }


async def generate_lessons_plan(
    db: AsyncSession,
    course_id: int,
    user_id: int,
    goal: str | None = None,
    start_knowledge: str | None = None,
    target_knowledge: str | None = None,
    target_audience: str | None = None,
    topics: list[str] | None = None
):
    # Проверка, что пользователь - автор курса
    course = await ensure_course_access(db, course_id, user_id, require_author=True)
    
    # Удаляем существующие уроки, если они есть
    existing_lessons = await LessonDAO.get_all_by_course(db, course_id)
    if existing_lessons:
        logger.info(f"Deleting {len(existing_lessons)} existing lessons before generating new plan")
        for lesson in existing_lessons:
            await LessonDAO.delete(db, lesson.id)
        await db.flush()
    
    # Подготавливаем контекст для генерации
    # Используем информацию из курса, если параметры не переданы
    context = CourseSummaryGenerateContext(
        goal=goal or f"Изучить курс: {course.name}",
        start_knowledge=start_knowledge or "Базовые знания",
        target_knowledge=target_knowledge or course.description or "Успешное завершение курса",
        target_audience=target_audience or "Студенты",
        topics=topics
    )
    
    # Генерируем план курса
    logger.info(f"User {user_id} generating lessons plan for course {course_id}")
    generator = await get_mistral_course_generator()
    course_summary = await generator.generate_plan(context)
    
    # Создаем уроки на основе тем из плана
    created_lessons = []
    for idx, topic in enumerate(course_summary.topics):
        lesson = await LessonDAO.create(
            db,
            course_id=course_id,
            position=idx,
            name=topic.title,
            description=topic.info,
            content={"blocks": []}  # Пустые блоки, только план
        )
        created_lessons.append(lesson)
    
    await db.commit()
    logger.info(f"Generated {len(created_lessons)} lessons for course {course_id}")
    
    return {
        "message": f"Generated {len(created_lessons)} lessons",
        "lessons_count": len(created_lessons),
        "lessons": created_lessons
    }

