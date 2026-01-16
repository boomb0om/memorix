import asyncio

from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseNotesGenerator
from .schema import NotesGenerateContext
from .prompts import MISTRAL_NOTES_PROMPT


class OpenAINotesGenerator(BaseNotesGenerator):

    def __init__(
        self, 
        client: MonitoredOpenAIClient,
        log_task_type: str = "generate_notes",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def generate_notes(self, user_notes: str) -> str:
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": MISTRAL_NOTES_PROMPT},
                {"role": "user", "content": f"Записи:\n{user_notes}\n\n# Конспект:\n"},
            ],
            temperature=0.7,
            log_task_type=self.log_task_type,
        )
        return response.choices[0].message.content


async def get_notes_generator() -> OpenAINotesGenerator:
    return OpenAINotesGenerator(
        client=get_monitored_openai_client(llm_settings),
    )


if __name__ == "__main__":
    async def main():
        generator = await get_notes_generator()
        with open("assets/notes/kaban.md", "r", encoding="utf-8") as file:
            notes = file.read()

        summary_notes = await generator.generate_notes(NotesGenerateContext(user_notes=notes))

    asyncio.run(main())