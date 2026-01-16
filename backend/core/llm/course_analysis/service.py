from .base_generator import BaseCourseAnalysisGenerator
from .openai_generator import get_course_analysis_generator
from .schema import CourseAnalysisContext, CourseAnalysisReport


async def analyze_course(
    context: CourseAnalysisContext,
    generator: BaseCourseAnalysisGenerator | None = None,
) -> CourseAnalysisReport:
    """Проанализировать курс и вернуть отчёт."""
    analysis_generator = generator or await get_course_analysis_generator()
    return await analysis_generator.analyze_course(context)
