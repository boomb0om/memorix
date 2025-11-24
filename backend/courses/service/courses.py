import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.schema import CourseCreate, CourseUpdate
from courses.dao import CourseDAO
from courses.service.access_control import ensure_course_access

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

