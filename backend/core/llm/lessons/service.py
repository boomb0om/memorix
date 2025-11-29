import asyncio
from typing import Optional

from .base_generator import BaseLessonsGenerator
from .openai_generator import get_mistral_lessons_generator
from .schema import LessonBlocksGenerateContext, GeneratedLessonContent

_generator: Optional[BaseLessonsGenerator] = None
_generator_lock = asyncio.Lock()


async def get_lessons_generator() -> BaseLessonsGenerator:
    """Ленивое получение генератора, чтобы переиспользовать соединение."""
    global _generator
    if _generator is None:
        async with _generator_lock:
            if _generator is None:
                _generator = await get_mistral_lessons_generator()
    return _generator


async def generate_lesson_blocks(
    context: LessonBlocksGenerateContext,
    generator: BaseLessonsGenerator | None = None,
) -> GeneratedLessonContent:
    """Сгенерировать блоки урока, используя доступный генератор."""
    lesson_generator = generator or await get_lessons_generator()
    return await lesson_generator.generate_blocks(context)

