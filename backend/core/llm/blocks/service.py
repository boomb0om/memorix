import asyncio
from typing import Optional

from .base_generator import BaseBlockGenerator
from .openai_generator import get_mistral_block_generator
from .schema import GeneratedLessonBlockContent, LessonBlockGenerateContext

_block_generator: Optional[BaseBlockGenerator] = None
_block_generator_lock = asyncio.Lock()


async def get_block_generator() -> BaseBlockGenerator:
    """Ленивое получение генератора блоков, чтобы переиспользовать соединение."""
    global _block_generator
    if _block_generator is None:
        async with _block_generator_lock:
            if _block_generator is None:
                _block_generator = await get_mistral_block_generator()
    return _block_generator


async def generate_lesson_block(
    context: LessonBlockGenerateContext,
    generator: BaseBlockGenerator | None = None,
) -> GeneratedLessonBlockContent:
    """Сгенерировать один блок урока, используя доступный генератор."""
    block_generator = generator or await get_block_generator()
    return await block_generator.generate_block(context)
