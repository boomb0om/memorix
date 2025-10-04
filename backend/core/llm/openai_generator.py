import openai
import os
import asyncio
import json
import re

from .base_generator import BaseLLMGenerator
from .prompts import MISTRAL_NOTES_PROMPT, MISTRAL_TESTS_PROMPT


class OpenAILLMGenerator(BaseLLMGenerator):

    def __init__(
        self, 
        api_key: str,
        model: str,
        base_url: str | None = None
    ):
        self.api_key = api_key
        self.model = model
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )

    async def generate_notes(self, user_notes: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model, 
            messages=[
                {"role": "system", "content": MISTRAL_NOTES_PROMPT},
                {"role": "user", "content": f"Записи:\n{user_notes}\n\n# Конспект:\n"},
            ],
            temperature=0.7
        )
        return response.choices[0].message.content

    async def generate_test(self, notes: str) -> list[dict]:
        response = await self.client.chat.completions.create(
            model=self.model, 
            messages=[
                {"role": "system", "content": MISTRAL_TESTS_PROMPT},
                {"role": "user", "content": f"Конспект:\n{notes}\n\n# Тест:\n"},
            ],
        )

        match = re.search(r"(\[.*\])", response.choices[0].message.content, re.DOTALL)
        if not match:
            raise ValueError("Cannot find JSON in model's response")

        questions = json.loads(match.group(1))
        return questions


async def get_mistral_generator(api_key: str | None = None) -> OpenAILLMGenerator:
    return OpenAILLMGenerator(
        api_key=api_key or os.getenv("MISTRAL_API_KEY"),
        model="mistral-medium",
        base_url="https://api.mistral.ai/v1"
    )


if __name__ == "__main__":
    async def main():
        generator = await get_mistral_generator()
        with open("notes.md", "r") as file:
            notes = file.read()

        summary_notes = await generator.generate_notes(notes)

        with open("notes_generated.md", "w") as file:
            file.write(summary_notes)

        tests = await generator.generate_test(summary_notes)

        with open("tests_generated.json", "w", encoding="utf-8") as file:
            json.dump(tests, file, indent=4, ensure_ascii=False)

    asyncio.run(main())