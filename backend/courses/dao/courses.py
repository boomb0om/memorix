from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from .models import Course, Lesson


class CourseDAO:
    """DAO для работы с курсами"""

    @classmethod
    async def get_by_id(cls, session: AsyncSession, course_id: int) -> Course | None:
        """Получить курс по ID"""
        result = await session.execute(
            select(Course).where(Course.id == course_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_id_with_lessons(
        cls, 
        session: AsyncSession, 
        course_id: int
    ) -> Course | None:
        """Получить курс по ID с уроками"""
        result = await session.execute(
            select(Course)
            .where(Course.id == course_id)
            .options(selectinload(Course.lessons))
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_author(
        cls, 
        session: AsyncSession, 
        author_id: int
    ) -> list[Course]:
        """Получить все курсы автора"""
        result = await session.execute(
            select(Course)
            .where(Course.author_id == author_id)
            .order_by(Course.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def get_all_accessible_by_user(
        cls,
        session: AsyncSession,
        user_id: int
    ) -> list[Course]:
        """Получить все курсы, доступные пользователю (автор или есть в ACL)"""
        from .models import CourseACL
        
        result = await session.execute(
            select(Course)
            .outerjoin(CourseACL, Course.id == CourseACL.course_id)
            .where(
                (Course.author_id == user_id) | 
                (CourseACL.user_id == user_id)
            )
            .distinct()
            .order_by(Course.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        name: str,
        description: str,
        author_id: int
    ) -> Course:
        """Создать курс"""
        db_course = Course(
            name=name,
            description=description,
            author_id=author_id
        )
        session.add(db_course)
        await session.commit()
        await session.refresh(db_course)
        return db_course

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        course_id: int,
        **kwargs
    ) -> Course | None:
        """Обновить курс"""
        stmt = update(Course).where(Course.id == course_id).values(**kwargs)
        await session.execute(stmt)
        await session.commit()
        return await cls.get_by_id(session, course_id)

    @classmethod
    async def delete(cls, session: AsyncSession, course_id: int) -> bool:
        """Удалить курс"""
        stmt = delete(Course).where(Course.id == course_id)
        await session.execute(stmt)
        await session.commit()
        return True

    @classmethod
    async def check_author(
        cls,
        session: AsyncSession,
        course_id: int,
        author_id: int
    ) -> bool:
        """Проверить, является ли пользователь автором курса"""
        result = await session.execute(
            select(Course.id)
            .where(Course.id == course_id, Course.author_id == author_id)
        )
        return result.scalar_one_or_none() is not None
