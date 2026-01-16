from .base_generator import BaseLessonsGenerator
from .openai_generator import get_lessons_generator
from .schema import LessonBlocksGenerateContext, GeneratedLessonContent


async def generate_lesson_blocks(
    context: LessonBlocksGenerateContext,
    generator: BaseLessonsGenerator | None = None,
) -> GeneratedLessonContent:
    """Сгенерировать блоки урока, используя доступный генератор."""
    lesson_generator = generator or await get_lessons_generator()
    return await lesson_generator.generate_blocks(context)
