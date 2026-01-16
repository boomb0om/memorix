from .base_generator import BaseBlockGenerator
from .openai_generator import get_block_generator
from .schema import GeneratedLessonBlockContent, LessonBlockGenerateContext


async def generate_lesson_block(
    context: LessonBlockGenerateContext,
    generator: BaseBlockGenerator | None = None,
) -> GeneratedLessonBlockContent:
    """Сгенерировать один блок урока, используя доступный генератор."""
    block_generator = generator or await get_block_generator()
    return await block_generator.generate_block(context)
