import asyncio
import json

import pydantic
from pydantic import TypeAdapter

from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseBlockGenerator
from .prompts import MISTRAL_SINGLE_BLOCK_PROMPT
from .schema import (
    GeneratedLessonBlockContent,
    LessonBlock,
    LessonBlockGenerateContext,
)


class OpenAIBlockGenerator(BaseBlockGenerator):
    """Генератор отдельного блока на базе OpenAI совместимого API."""

    def __init__(
        self,
        client: MonitoredOpenAIClient,
        log_task_type: str = "generate_lesson_block",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def generate_block(
        self, context: LessonBlockGenerateContext
    ) -> GeneratedLessonBlockContent:
        """Сгенерировать один блок урока."""
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": MISTRAL_SINGLE_BLOCK_PROMPT},
                {"role": "user", "content": self._build_user_prompt(context)},
            ],
            response_format={"type": "json_object"},
            log_task_type=self.log_task_type,
        )

        content = (
            response.choices[0]
            .message.content.strip("```json")
            .strip("```")
            .strip(" \n")
        )
        try:
            data = json.loads(content)
            # Валидируем блок через Pydantic
            block = TypeAdapter(LessonBlock).validate_python(data)
            return GeneratedLessonBlockContent(block=block)
        except (pydantic.ValidationError, json.JSONDecodeError) as e:
            print("Validation error:", e)
            raise

    @staticmethod
    def _build_user_prompt(context: LessonBlockGenerateContext) -> str:
        """Построить промпт для генерации блока."""
        sections: list[str] = []

        # Информация о курсе
        sections.append(f"# Курс:\n{context.course_name}")
        if context.course_description:
            sections.append(f"Описание курса: {context.course_description}")

        # Информация об уроке
        sections.append(f"\n# Урок:\n{context.lesson_topic}")
        if context.lesson_description:
            sections.append(f"Описание урока: {context.lesson_description}")

        # Запрос пользователя (приоритетный)
        if context.user_request:
            sections.append(f"\n# Запрос пользователя:\n{context.user_request}")

        # Тип блока
        if context.block_type:
            sections.append(f"\n# Тип блока для генерации:\n{context.block_type}")

        # Предыдущий блок
        if context.previous_block:
            prev_content = json.dumps(
                context.previous_block, ensure_ascii=False, indent=2
            )
            sections.append(f"\n# Предыдущий блок:\n{prev_content}")

        # Текущий блок (для переформулирования)
        if context.current_block:
            curr_content = json.dumps(
                context.current_block, ensure_ascii=False, indent=2
            )
            sections.append(f"\n# Текущий блок (переформулировать):\n{curr_content}")

        # Следующий блок
        if context.next_block:
            next_content = json.dumps(context.next_block, ensure_ascii=False, indent=2)
            sections.append(f"\n# Следующий блок:\n{next_content}")

        # Дополнительный контекст
        if context.context:
            sections.append(
                f"\n# Дополнительный контекст/материалы:\n{context.context}"
            )

        sections.append(
            "\n# Выведи строго JSON одного блока, соответствующий схеме ответа."
        )
        return "\n".join(section for section in sections if section.strip())


async def get_block_generator() -> OpenAIBlockGenerator:
    """Создать генератор блоков, настроенный на Mistral."""
    return OpenAIBlockGenerator(
        client=get_monitored_openai_client(llm_settings),
    )


if __name__ == "__main__":

    async def main():
        generator = await get_block_generator()
        context = LessonBlockGenerateContext(
            course_name="Программирование на Python",
            course_description="Курс предназначен для изучения основ программирования на Python.",
            lesson_topic="Работа с файлами в Python",
            lesson_description="В этом уроке мы рассмотрим основы работы с файлами в Python.",
            user_request="Генерируй блок с теоретическим материалом о работе с файлами в Python.",
            block_type="theory",
            previous_block=None,
            current_block=None,
            next_block=None,
            context="Python предоставляет встроенные функции open/read/write.",
        )
        block = await generator.generate_block(context)

        with open("block_generated.json", "w", encoding="utf-8") as fp:
            json.dump(block.model_dump(), fp, indent=4, ensure_ascii=False)

    asyncio.run(main())
