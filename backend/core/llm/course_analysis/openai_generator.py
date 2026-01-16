from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseCourseAnalysisGenerator
from .schema import CourseAnalysisContext, CourseAnalysisReport
from .prompts import COURSE_ANALYSIS_PROMPT


class OpenAICourseAnalysisGenerator(BaseCourseAnalysisGenerator):
    """Генератор анализа курсов на базе OpenAI совместимого API."""

    def __init__(
        self,
        client: MonitoredOpenAIClient,
        log_task_type: str = "analyze_course",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def analyze_course(
        self, context: CourseAnalysisContext
    ) -> CourseAnalysisReport:
        """Проанализировать курс и вернуть отчёт."""
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": COURSE_ANALYSIS_PROMPT},
                {"role": "user", "content": self._build_user_prompt(context)},
            ],
            temperature=0.7,
            log_task_type=self.log_task_type,
        )

        report_text = response.choices[0].message.content.strip()
        return CourseAnalysisReport(report=report_text)

    @staticmethod
    def _build_user_prompt(context: CourseAnalysisContext) -> str:
        """Построить промпт для анализа курса."""
        sections: list[str] = []

        # Информация о курсе
        sections.append(f"# Курс: {context.course_name}")
        sections.append(f"Описание: {context.course_description}")
        sections.append(f"Количество уроков: {context.lessons_count}")

        # Информация об уроках
        sections.append("\n# Структура курса:")
        for lesson in context.lessons:
            lesson_info = [
                f"Урок {lesson.position + 1}: {lesson.name}",
            ]

            if lesson.description:
                lesson_info.append(f"  Описание: {lesson.description}")

            if lesson.goal:
                lesson_info.append(f"  Цель: {lesson.goal}")

            lesson_info.append(f"  Блоков: {lesson.blocks_count}")

            # Типы блоков
            block_types_str = ", ".join(
                f"{block_type}: {count}"
                for block_type, count in lesson.block_types.items()
            )
            lesson_info.append(f"  Типы блоков: {block_types_str}")

            # Краткое содержание блоков
            if lesson.blocks_summary:
                lesson_info.append("  Содержание блоков:")
                for block_summary in lesson.blocks_summary:
                    lesson_info.append(f"    - {block_summary}")

            sections.append("\n".join(lesson_info))

        return "\n\n".join(sections)


async def get_course_analysis_generator() -> OpenAICourseAnalysisGenerator:
    """Создать генератор анализа курсов"""
    return OpenAICourseAnalysisGenerator(
        client=get_monitored_openai_client(llm_settings),
    )
