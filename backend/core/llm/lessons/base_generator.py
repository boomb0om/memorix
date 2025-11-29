from abc import ABC, abstractmethod
from .schema import LessonBlocksGenerateContext, GeneratedLessonContent


class BaseLessonsGenerator(ABC):
    """Интерфейс генераторов уроков."""

    @abstractmethod
    async def generate_blocks(self, context: LessonBlocksGenerateContext) -> GeneratedLessonContent:
        """Сгенерировать контент урока из блоков."""
        pass
