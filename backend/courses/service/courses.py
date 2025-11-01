from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.schema import CourseCreate, CourseUpdate
from courses.dao import CourseDAO


async def create_course(db: AsyncSession, course: CourseCreate, author_id: int):
    """Создать курс"""
    return await CourseDAO.create(
        db,
        name=course.name,
        description=course.description,
        author_id=author_id
    )


async def get_course(db: AsyncSession, course_id: int, user_id: int):
    """Получить курс по ID"""
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Проверка доступа (автор или есть в ACL)
    if not await _check_course_access(db, course_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return course


async def get_course_with_lessons(db: AsyncSession, course_id: int, user_id: int):
    """Получить курс с уроками"""
    course = await CourseDAO.get_by_id_with_lessons(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Проверка доступа
    if not await _check_course_access(db, course_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    
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
    if not await CourseDAO.check_author(db, course_id, user_id):
        raise HTTPException(status_code=403, detail="Only course author can update it")
    
    # Собираем только те поля, которые были переданы
    update_data = course_update.model_dump(exclude_unset=True)
    if not update_data:
        # Если ничего не передано, просто возвращаем курс
        return await CourseDAO.get_by_id(db, course_id)
    
    updated_course = await CourseDAO.update(db, course_id, **update_data)
    if not updated_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return updated_course


async def delete_course(db: AsyncSession, course_id: int, user_id: int):
    """Удалить курс"""
    # Проверка, что пользователь - автор курса
    if not await CourseDAO.check_author(db, course_id, user_id):
        raise HTTPException(status_code=403, detail="Only course author can delete it")
    
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    await CourseDAO.delete(db, course_id)
    return {"message": "Course deleted successfully"}


async def _check_course_access(db: AsyncSession, course_id: int, user_id: int) -> bool:
    """Проверить доступ пользователя к курсу"""
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        return False
    
    # Автор имеет доступ
    if course.author_id == user_id:
        return True
    
    # TODO: Проверить ACL для других пользователей
    # Сейчас доступ только для автора
    return False

