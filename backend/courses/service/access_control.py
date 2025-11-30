"""Модуль для проверки доступа к курсам"""
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from courses.dao import CourseDAO
from courses.dao.models import Course, CourseACL
from courses.schema.acl import CourseACLGroup


async def check_course_access(
    db: AsyncSession,
    course_id: int,
    user_id: int,
    require_author: bool = False
) -> tuple[bool, Course | None]:
    """
    Проверить доступ пользователя к курсу
    
    Args:
        db: Сессия базы данных
        course_id: ID курса
        user_id: ID пользователя
        require_author: Требовать, чтобы пользователь был автором
    
    Returns:
        Tuple[bool, Course | None]: (имеет_доступ, курс)
    """
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        return False, None
    
    # Если требуется автор, проверяем только авторство
    if require_author:
        return course.author_id == user_id, course
    
    # Автор всегда имеет доступ
    if course.author_id == user_id:
        return True, course
    
    # Проверяем ACL для других пользователей
    # Сначала проверяем персональный ACL (user_id = конкретный пользователь)
    result = await db.execute(
        select(CourseACL)
        .where(
            CourseACL.course_id == course_id,
            CourseACL.user_id == user_id
        )
    )
    acl_entry = result.scalar_one_or_none()
    if acl_entry is not None:
        return True, course
    
    # Затем проверяем групповой ACL (group = "all" означает доступ для всех)
    result = await db.execute(
        select(CourseACL)
        .where(
            CourseACL.course_id == course_id,
            CourseACL.group == CourseACLGroup.ALL.value
        )
    )
    group_acl = result.scalar_one_or_none()
    
    return group_acl is not None, course


async def ensure_course_access(
    db: AsyncSession,
    course_id: int,
    user_id: int,
    require_author: bool = False
) -> Course:
    """
    Проверить доступ и вернуть курс или выбросить исключение
    
    Args:
        db: Сессия базы данных
        course_id: ID курса
        user_id: ID пользователя
        require_author: Требовать, чтобы пользователь был автором
    
    Returns:
        Course: Курс с доступом
    
    Raises:
        HTTPException: Если курс не найден или доступ запрещен
    """
    has_access, course = await check_course_access(db, course_id, user_id, require_author)
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not has_access:
        if require_author:
            raise HTTPException(
                status_code=403,
                detail="Only course author can perform this action"
            )
        raise HTTPException(status_code=403, detail="Access denied")
    
    return course

