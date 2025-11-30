from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_
from sqlalchemy.orm import selectinload
from courses.schema.acl import CourseACLGroup
from .models import Course, CourseACL


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
        result = await session.execute(
            select(Course)
            .outerjoin(CourseACL, Course.id == CourseACL.course_id)
            .where(
                (Course.author_id == user_id) | 
                (CourseACL.user_id == user_id) |
                (CourseACL.group == CourseACLGroup.ALL.value)  # Групповой ACL (доступ для всех)
            )
            .distinct()
            .order_by(Course.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def search_by_author(
        cls,
        session: AsyncSession,
        author_id: int,
        query: str
    ) -> list[Course]:
        """Поиск курсов автора по названию и описанию"""
        pattern = f"%{query}%"
        result = await session.execute(
            select(Course)
            .where(Course.author_id == author_id)
            .where(
                or_(
                    Course.name.ilike(pattern),
                    Course.description.ilike(pattern)
                )
            )
            .order_by(Course.created_at.desc())
        )
        return result.scalars().all()

    @classmethod
    async def search_accessible_by_user(
        cls,
        session: AsyncSession,
        user_id: int,
        query: str
    ) -> list[Course]:
        """Поиск курсов, доступных пользователю"""

        pattern = f"%{query}%"
        result = await session.execute(
            select(Course)
            .outerjoin(CourseACL, Course.id == CourseACL.course_id)
            .where(
                (
                    (Course.author_id == user_id) |
                    (CourseACL.user_id == user_id) |
                    (CourseACL.group == CourseACLGroup.ALL.value)  # Групповой ACL (доступ для всех)
                ) &
                or_(
                    Course.name.ilike(pattern),
                    Course.description.ilike(pattern)
                )
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
        await session.flush()
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
        await session.flush()
        return await cls.get_by_id(session, course_id)

    @classmethod
    async def delete(cls, session: AsyncSession, course_id: int) -> bool:
        """Удалить курс"""
        stmt = delete(Course).where(Course.id == course_id)
        await session.execute(stmt)
        await session.flush()
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

    @classmethod
    async def get_by_name(
        cls,
        session: AsyncSession,
        name: str
    ) -> Course | None:
        """Получить курс по названию"""
        result = await session.execute(
            select(Course).where(Course.name == name)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def create_acl(
        cls,
        session: AsyncSession,
        course_id: int,
        role: str,
        user_id: int | None = None,
        group: str | None = None
    ) -> CourseACL:
        """Создать запись ACL для курса
        
        Args:
            session: Сессия базы данных
            course_id: ID курса
            role: Роль доступа (обязательный)
            user_id: ID пользователя (для персонального ACL)
            group: Тип группы (например, "all" для доступа всем пользователям)
        
        Note:
            Одно из полей (user_id или group) должно быть указано
        """
        if user_id is None and group is None:
            raise ValueError("Either user_id or group must be provided")
        
        if user_id is not None and group is not None:
            raise ValueError("Cannot specify both user_id and group")
        
        # Проверяем, не существует ли уже такая запись
        if group is not None:
            # Для группового ACL проверяем по course_id и group
            result = await session.execute(
                select(CourseACL).where(
                    CourseACL.course_id == course_id,
                    CourseACL.group == group
                )
            )
        else:
            # Для персонального ACL проверяем по course_id и user_id
            result = await session.execute(
                select(CourseACL).where(
                    CourseACL.course_id == course_id,
                    CourseACL.user_id == user_id
                )
            )
        existing = result.scalar_one_or_none()
        if existing:
            return existing
        
        acl_entry = CourseACL(
            course_id=course_id,
            user_id=user_id,
            group=group,
            role=role
        )
        session.add(acl_entry)
        await session.flush()
        await session.refresh(acl_entry)
        return acl_entry
