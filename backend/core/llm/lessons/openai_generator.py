import asyncio
import json
import pydantic

from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseLessonsGenerator
from .schema import LessonBlocksGenerateContext, GeneratedLessonContent
from .prompts import MISTRAL_LESSON_BLOCKS_PROMPT


class OpenAILessonsGenerator(BaseLessonsGenerator):
    """Генератор уроков на базе OpenAI совместимого API."""

    def __init__(
        self,
        client: MonitoredOpenAIClient,
        log_task_type: str = "generate_lesson_blocks",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def generate_blocks(self, context: LessonBlocksGenerateContext) -> GeneratedLessonContent:
        """Собрать урок в виде блоков."""
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": MISTRAL_LESSON_BLOCKS_PROMPT},
                {"role": "user", "content": self._build_user_prompt(context)},
            ],
            response_format={'type': 'json_object'},
            log_task_type=self.log_task_type,
        )

        content = response.choices[0].message.content.strip('```json').strip('```').strip(' \n')
        try:
            data = json.loads(content)
            return GeneratedLessonContent.model_validate({"blocks": data})
        except pydantic.ValidationError as e:
            print("Validation error:", e)
            raise

    @staticmethod
    def _build_user_prompt(context: LessonBlocksGenerateContext) -> str:
        sections: list[str] = [
            f"# Тема урока:\n{context.topic}",
        ]

        if context.description:
            sections.append(f"# Описание урока:\n{context.description}")
        if context.goal:
            sections.append(f"# Цель урока:\n{context.goal}")
        if context.context:
            sections.append(f"# Конспект/материалы:\n{context.context}")
        if context.focus_points:
            focus_block = "\n".join(f"- {point}" for point in context.focus_points)
            sections.append(f"# Обязательные акценты:\n{focus_block}")

        sections.append("# Выведи строго JSON, соответствующий схеме ответа.")
        return "\n\n".join(section for section in sections if section.strip())


async def get_lessons_generator() -> OpenAILessonsGenerator:
    """Создать генератор уроков"""
    return OpenAILessonsGenerator(
        client=get_monitored_openai_client(llm_settings),
    )


if __name__ == "__main__":
    async def main():
        generator = await get_lessons_generator()
        context = LessonBlocksGenerateContext(
            topic="Работа с файлами в Python",
            description="Python предоставляет встроенные функции open/read/write.",
            #focus_points=["Пример чтения файла", "Пример записи"],
            #preferred_block_types=["theory", "code", "single_choice"],
        )
        lesson = await generator.generate_blocks(context)

        with open("lesson_blocks_generated.json", "w", encoding="utf-8") as fp:
            json.dump(lesson.model_dump(), fp, indent=4, ensure_ascii=False)

    asyncio.run(main())

