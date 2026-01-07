from abc import ABC, abstractmethod

from .schema import GeneratedLessonBlockContent, LessonBlockGenerateContext


class BaseBlockGenerator(ABC):
    """Интерфейс генераторов отдельных блоков уроков."""

    @abstractmethod
    async def generate_block(
        self, context: LessonBlockGenerateContext
    ) -> GeneratedLessonBlockContent:
        """Сгенерировать контент одного блока урока."""
        pass
