import openai
import os
import asyncio

from .base_generator import BaseNotesGenerator
from .schema import NotesGenerateContext
from .prompts import MISTRAL_NOTES_PROMPT


class OpenAINotesGenerator(BaseNotesGenerator):

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


async def get_mistral_notes_generator(api_key: str | None = None) -> OpenAINotesGenerator:
    return OpenAINotesGenerator(
        api_key=api_key or os.getenv("MISTRAL_API_KEY"),
        model="mistral-medium",
        base_url="https://api.mistral.ai/v1"
    )


if __name__ == "__main__":
    async def main():
        generator = await get_mistral_notes_generator()
        with open("assets/notes/kaban.md", "r", encoding="utf-8") as file:
            notes = file.read()

        summary_notes = await generator.generate_notes(NotesGenerateContext(user_notes=notes))

    asyncio.run(main())