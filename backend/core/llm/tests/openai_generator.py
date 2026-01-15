import os
import asyncio
import json
import re

from core.llm.openai_client import MonitoredOpenAIClient
from .base_generator import BaseTestsGenerator
from .schema import TestGenerateContext, BaseQuestion, ChoiceQuestion
from .prompts import MISTRAL_TESTS_PROMPT


class OpenAITestsGenerator(BaseTestsGenerator):

    def __init__(
        self, 
        api_key: str,
        model: str,
        base_url: str | None = None
    ):
        self.api_key = api_key
        self.model = model
        self.client = MonitoredOpenAIClient(
            api_key=api_key,
            base_url=base_url
        )

    async def generate_test(self, context: TestGenerateContext) -> list[BaseQuestion]:
        user_prompt =  f"# Конспект:\n{context.notes}\n\n# Тема теста: {context.topic}\n\n"
        if context.num_questions:
            user_prompt += f"# В тесте должно быть {context.num_questions} вопросов\n\n"
        user_prompt += "# Тест:\n"
        response = await self.client.completions_create(
            model=self.model, 
            messages=[
                {"role": "system", "content": MISTRAL_TESTS_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )

        match = re.search(r"(\[.*\])", response.choices[0].message.content, re.DOTALL)
        if not match:
            raise ValueError("Cannot find JSON in model's response")

        questions = json.loads(match.group(1))
        return [ChoiceQuestion.model_validate(question) for question in questions]


async def get_mistral_tests_generator(api_key: str | None = None) -> OpenAITestsGenerator:
    return OpenAITestsGenerator(
        api_key=api_key or os.getenv("MISTRAL_API_KEY"),
        model="mistral-medium",
        base_url="https://api.mistral.ai/v1"
    )


if __name__ == "__main__":
    async def main():
        generator = await get_mistral_tests_generator()

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