from abc import ABC, abstractmethod
from .schema import CourseSummaryGenerateContext, CourseSummary


class BaseCourseGenerator(ABC):

    @abstractmethod
    async def generate_plan(self, context: CourseSummaryGenerateContext) -> CourseSummary:
        pass
