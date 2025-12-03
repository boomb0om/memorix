from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from .models import Lesson


class LessonDAO:
    """DAO для работы с уроками"""

    @classmethod
    async def get_by_id(cls, session: AsyncSession, lesson_id: int) -> Lesson | None:
        """Получить урок по ID"""
        result = await session.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_course(
        cls, 
        session: AsyncSession, 
        course_id: int
    ) -> list[Lesson]:
        """Получить все уроки курса"""
        result = await session.execute(
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.position)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_position(
        cls,
        session: AsyncSession,
        course_id: int,
        position: int
    ) -> Lesson | None:
        """Получить урок по позиции в курсе"""
        result = await session.execute(
            select(Lesson)
            .where(Lesson.course_id == course_id, Lesson.position == position)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        course_id: int,
        position: int,
        name: str,
        description: str | None
    ) -> Lesson:
        """Создать урок"""
        db_lesson = Lesson(
            course_id=course_id,
            position=position,
            name=name,
            description=description
        )
        session.add(db_lesson)
        await session.flush()
        await session.refresh(db_lesson)
        return db_lesson

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        lesson_id: int,
        **kwargs
    ) -> Lesson | None:
        """Обновить урок"""
        stmt = update(Lesson).where(Lesson.id == lesson_id).values(**kwargs)
        await session.execute(stmt)
        await session.flush()
        return await cls.get_by_id(session, lesson_id)

    @classmethod
    async def update_in_transaction(
        cls,
        session: AsyncSession,
        lesson_id: int,
        **kwargs
    ) -> None:
        """Обновить урок в рамках существующей транзакции"""
        stmt = update(Lesson).where(Lesson.id == lesson_id).values(**kwargs)
        await session.execute(stmt)


    @classmethod
    async def delete(cls, session: AsyncSession, lesson_id: int) -> bool:
        """Удалить урок"""
        stmt = delete(Lesson).where(Lesson.id == lesson_id)
        await session.execute(stmt)
        await session.flush()
        return True

    @classmethod
    async def reorder(
        cls,
        session: AsyncSession,
        lesson_id: int,
        new_position: int
    ) -> Lesson | None:
        """Изменить позицию урока (устаревший метод, используйте reorder_lesson в сервисе)"""
        return await cls.update(session, lesson_id, position=new_position)

    @classmethod
    async def get_next_position(
        cls,
        session: AsyncSession,
        course_id: int
    ) -> int:
        """Получить следующую доступную позицию для урока"""
        result = await session.execute(
            select(Lesson.position)
            .where(Lesson.course_id == course_id)
            .order_by(Lesson.position.desc())
            .limit(1)
        )
        max_position = result.scalar_one_or_none()
        return (max_position + 1) if max_position is not None else 0

