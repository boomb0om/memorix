from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .models import CourseAnalysisHistory


class CourseAnalysisHistoryDAO:
    """DAO для работы с историей анализов курсов"""

    @classmethod
    async def create(
        cls,
        session: AsyncSession,
        course_id: int,
        user_id: int,
        report: str,
    ) -> CourseAnalysisHistory:
        """Создать запись в истории анализа курса"""
        history_entry = CourseAnalysisHistory(
            course_id=course_id,
            user_id=user_id,
            report=report,
        )
        session.add(history_entry)
        await session.flush()
        await session.refresh(history_entry)
        return history_entry

    @classmethod
    async def get_by_course_id(
        cls,
        session: AsyncSession,
        course_id: int,
    ) -> list[CourseAnalysisHistory]:
        """Получить всю историю анализов для курса, отсортированную по дате (новые первыми)"""
        result = await session.execute(
            select(CourseAnalysisHistory)
            .where(CourseAnalysisHistory.course_id == course_id)
            .order_by(CourseAnalysisHistory.created_at.desc())
        )
        return list(result.scalars().all())
