import asyncio
from typing import Optional

from .base_generator import BaseCourseAnalysisGenerator
from .openai_generator import get_mistral_course_analysis_generator
from .schema import CourseAnalysisContext, CourseAnalysisReport

_analysis_generator: Optional[BaseCourseAnalysisGenerator] = None
_analysis_generator_lock = asyncio.Lock()


async def get_course_analysis_generator() -> BaseCourseAnalysisGenerator:
    """Ленивое получение генератора анализа курсов."""
    global _analysis_generator
    if _analysis_generator is None:
        async with _analysis_generator_lock:
            if _analysis_generator is None:
                _analysis_generator = await get_mistral_course_analysis_generator()
    return _analysis_generator


async def analyze_course(
    context: CourseAnalysisContext,
    generator: BaseCourseAnalysisGenerator | None = None,
) -> CourseAnalysisReport:
    """Проанализировать курс и вернуть отчёт."""
    analysis_generator = generator or await get_course_analysis_generator()
    return await analysis_generator.analyze_course(context)
