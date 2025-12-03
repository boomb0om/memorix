from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import UserQuestionAnswer


class UserQuestionAnswerDAO:
    """DAO для работы с ответами пользователей на вопросы"""

    @classmethod
    async def get_by_user_and_block(
        cls,
        session: AsyncSession,
        user_id: int,
        block_id: UUID
    ) -> UserQuestionAnswer | None:
        """Получить ответ пользователя на конкретный вопрос"""
        result = await session.execute(
            select(UserQuestionAnswer)
            .where(
                UserQuestionAnswer.user_id == user_id,
                UserQuestionAnswer.block_id == block_id
            )
        )
        return result.scalar_one_or_none()

    @classmethod
    async def get_all_by_user_and_lesson(
        cls,
        session: AsyncSession,
        user_id: int,
        lesson_id: int
    ) -> list[UserQuestionAnswer]:
        """Получить все ответы пользователя на вопросы урока"""
        from .models import LessonBlock
        
        result = await session.execute(
            select(UserQuestionAnswer)
            .join(LessonBlock, UserQuestionAnswer.block_id == LessonBlock.id)
            .where(
                UserQuestionAnswer.user_id == user_id,
                LessonBlock.lesson_id == lesson_id
            )
        )
        return result.scalars().all()

    @classmethod
    async def create_or_update(
        cls,
        session: AsyncSession,
        user_id: int,
        block_id: UUID,
        answer: int | list[int]
    ) -> UserQuestionAnswer:
        """Создать или обновить ответ пользователя"""
        # Проверяем, существует ли уже ответ
        existing = await cls.get_by_user_and_block(session, user_id, block_id)
        
        # Конвертируем ответ в JSON-совместимый формат
        # Для single_choice это будет int, для multiple_choice - list[int]
        # PostgreSQL JSONB может хранить оба типа напрямую
        answer_data = answer
        
        if existing:
            # Обновляем существующий ответ
            existing.answer = answer_data
            await session.flush()
            await session.refresh(existing)
            return existing
        else:
            # Создаем новый ответ
            db_answer = UserQuestionAnswer(
                user_id=user_id,
                block_id=block_id,
                answer=answer_data
            )
            session.add(db_answer)
            await session.flush()
            await session.refresh(db_answer)
            return db_answer

