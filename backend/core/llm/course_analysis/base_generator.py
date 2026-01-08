from abc import ABC, abstractmethod
from .schema import CourseAnalysisContext, CourseAnalysisReport


class BaseCourseAnalysisGenerator(ABC):
    """Интерфейс генераторов анализа курсов."""

    @abstractmethod
    async def analyze_course(
        self, context: CourseAnalysisContext
    ) -> CourseAnalysisReport:
        """Проанализировать курс и вернуть отчёт."""
        pass
