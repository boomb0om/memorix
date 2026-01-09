from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from .models import LessonBlock


class LessonBlockDAO:
    """DAO для работы с блоками уроков"""

    @classmethod
    async def get_by_id(cls, session: AsyncSession, block_id: UUID) -> LessonBlock | None:
        """Получить блок по ID"""
        result = await session.execute(
            select(LessonBlock).where(LessonBlock.id == block_id)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_lesson(
        cls,
        session: AsyncSession,
        lesson_id: int
    ) -> list[LessonBlock]:
        """Получить все блоки урока, отсортированные по позиции"""
        result = await session.execute(
            select(LessonBlock)
            .where(LessonBlock.lesson_id == lesson_id)
            .order_by(LessonBlock.position)
        )
        return result.scalars().all()

    @classmethod
    async def get_by_position(
        cls,
        session: AsyncSession,
        lesson_id: int,
        position: int
    ) -> LessonBlock | None:
        """Получить блок по позиции в уроке"""
        result = await session.execute(
            select(LessonBlock)
            .where(LessonBlock.lesson_id == lesson_id, LessonBlock.position == position)
        )
        return result.scalar_one_or_none()

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        lesson_id: int,
        position: int,
        block_type: str,
        data: dict
    ) -> LessonBlock:
        """Создать блок"""
        db_block = LessonBlock(
            lesson_id=lesson_id,
            position=position,
            type=block_type,
            data=data
        )
        session.add(db_block)
        await session.flush()
        await session.refresh(db_block)
        return db_block

    @classmethod
    async def create_bulk(
        cls,
        session: AsyncSession,
        lesson_id: int,
        blocks: list[dict]  # Список словарей с ключами: position, type, data
    ) -> list[LessonBlock]:
        """Создать несколько блоков за раз"""
        db_blocks = [
            LessonBlock(
                lesson_id=lesson_id,
                position=block["position"],
                type=block["type"],
                data=block["data"]
            )
            for block in blocks
        ]
        session.add_all(db_blocks)
        await session.flush()
        for block in db_blocks:
            await session.refresh(block)
        return db_blocks

    @classmethod
    async def update(
        cls,
        session: AsyncSession,
        block_id: UUID,
        **kwargs
    ) -> LessonBlock | None:
        """Обновить блок"""
        stmt = update(LessonBlock).where(LessonBlock.id == block_id).values(**kwargs)
        await session.execute(stmt)
        await session.flush()
        return await cls.get_by_id(session, block_id)

    @classmethod
    async def update_in_transaction(
        cls,
        session: AsyncSession,
        block_id: UUID,
        **kwargs
    ) -> None:
        """Обновить блок в рамках существующей транзакции"""
        stmt = update(LessonBlock).where(LessonBlock.id == block_id).values(**kwargs)
        await session.execute(stmt)

    @classmethod
    async def delete(cls, session: AsyncSession, block_id: UUID) -> bool:
        """Удалить блок"""
        stmt = delete(LessonBlock).where(LessonBlock.id == block_id)
        await session.execute(stmt)
        await session.flush()
        return True

    @classmethod
    async def delete_all_by_lesson(cls, session: AsyncSession, lesson_id: int) -> bool:
        """Удалить все блоки урока"""
        stmt = delete(LessonBlock).where(LessonBlock.lesson_id == lesson_id)
        await session.execute(stmt)
        await session.flush()
        return True

    @classmethod
    async def get_next_position(
        cls,
        session: AsyncSession,
        lesson_id: int
    ) -> int:
        """Получить следующую доступную позицию для блока"""
        result = await session.execute(
            select(LessonBlock.position)
            .where(LessonBlock.lesson_id == lesson_id)
            .order_by(LessonBlock.position.desc())
            .limit(1)
        )
        max_position = result.scalar_one_or_none()
        return (max_position + 1) if max_position is not None else 0
    
    @classmethod
    async def shift_positions_bulk(
        cls,
        session: AsyncSession,
        lesson_id: int,
        from_position: int,
        offset: int,
        to_position: int | None = None
    ) -> None:
        """
        Массово сдвинуть позиции блоков, избегая конфликтов уникального ограничения
        
        Args:
            session: Сессия БД
            lesson_id: ID урока
            from_position: Начальная позиция (включительно)
            offset: На сколько сдвинуть (положительное - вправо, отрицательное - влево)
            to_position: Конечная позиция (включительно, опционально)
        """
        # Двухшаговый подход для избежания конфликтов уникального ограничения:
        # 1. Сдвигаем в отрицательную зону с большим смещением (временные позиции)
        # 2. Возвращаем в положительную зону с нужным смещением
        
        # Используем большое отрицательное число как базу для временных позиций
        TEMP_OFFSET = 10000
        
        # Шаг 1: Сдвигаем в отрицательную зону с большим смещением
        stmt1 = update(LessonBlock).where(
            LessonBlock.lesson_id == lesson_id,
            LessonBlock.position >= from_position
        )
        if to_position is not None:
            stmt1 = stmt1.where(LessonBlock.position <= to_position)
        
        stmt1 = stmt1.values(position=-(LessonBlock.position + TEMP_OFFSET))
        await session.execute(stmt1)
        
        # Шаг 2: Возвращаем в положительную зону с нужным смещением
        stmt2 = update(LessonBlock).where(
            LessonBlock.lesson_id == lesson_id,
            LessonBlock.position < 0
        ).values(position=-LessonBlock.position - TEMP_OFFSET + offset)
        await session.execute(stmt2)