from abc import ABC, abstractmethod
from .schema import TheoryGenerateContext, Theory, Lesson


class BaseLessonsGenerator(ABC):

    @abstractmethod
    async def generate_theory(self, context: TheoryGenerateContext) -> Theory:
        pass
