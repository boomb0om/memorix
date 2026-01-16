import asyncio
import json
import re

from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseTestsGenerator
from .schema import TestGenerateContext, BaseQuestion, ChoiceQuestion
from .prompts import MISTRAL_TESTS_PROMPT


class OpenAITestsGenerator(BaseTestsGenerator):

    def __init__(
        self, 
        client: MonitoredOpenAIClient,
        log_task_type: str = "generate_test",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def generate_test(self, context: TestGenerateContext) -> list[BaseQuestion]:
        user_prompt =  f"# Конспект:\n{context.notes}\n\n# Тема теста: {context.topic}\n\n"
        if context.num_questions:
            user_prompt += f"# В тесте должно быть {context.num_questions} вопросов\n\n"
        user_prompt += "# Тест:\n"
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": MISTRAL_TESTS_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            log_task_type=self.log_task_type,
        )

        match = re.search(r"(\[.*\])", response.choices[0].message.content, re.DOTALL)
        if not match:
            raise ValueError("Cannot find JSON in model's response")

        questions = json.loads(match.group(1))
        return [ChoiceQuestion.model_validate(question) for question in questions]


async def get_tests_generator() -> OpenAITestsGenerator:
    return OpenAITestsGenerator(
        client=get_monitored_openai_client(llm_settings),
    )


if __name__ == "__main__":
    async def main():
        generator = await get_tests_generator()

        with open("assets/notes/kaban.md", "r", encoding="utf-8") as file:
            notes = file.read()

        tests = await generator.generate_test(
            TestGenerateContext(
                notes=notes, 
                topic="Типы форматов кодирования данных",
                num_questions=3
            )
        )

        with open("tests_generated.json", "w", encoding="utf-8") as file:
            json.dump([question.model_dump() for question in tests], file, indent=4, ensure_ascii=False)

    asyncio.run(main())