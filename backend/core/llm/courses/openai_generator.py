import os
import asyncio
import json
import re

from core.llm.openai_client import MonitoredOpenAIClient
from .base_generator import BaseCourseGenerator
from .schema import CourseSummaryGenerateContext, CourseSummary
from .prompts import MISTRAL_COURSE_SUMMARY_PROMPT


class OpenAICourseGenerator(BaseCourseGenerator):

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

    async def generate_plan(self, context: CourseSummaryGenerateContext) -> CourseSummary:
        user_prompt =  f"# Цель курса:\n{context.goal}\n\n# Начальные знания:\n{context.start_knowledge}\n\n# Конечные знания:\n{context.target_knowledge}\n\n# Целевая аудитория:\n{context.target_audience}\n\n"
        if context.topics:
            user_prompt += f"# Темы курса, которые обязательно нужно включить в программу:\n{context.topics}\n\n"
        user_prompt += "# ответ в формате JSON:\n"
        response = await self.client.completions_create(
            model=self.model, 
            messages=[
                {"role": "system", "content": MISTRAL_COURSE_SUMMARY_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content.strip('`').strip('json').strip(' \n')
        match = re.search(r"(\{.*\})", content, re.DOTALL)
        if not match:
            raise ValueError("Cannot find JSON in model's response")

        course_summary = json.loads(match.group(1))
        return CourseSummary.model_validate(course_summary)


async def get_mistral_course_generator(api_key: str | None = None) -> OpenAICourseGenerator:
    return OpenAICourseGenerator(
        api_key=api_key or os.getenv("MISTRAL_API_KEY"),
        model="mistral-medium-latest",
        base_url="https://api.mistral.ai/v1"
    )


if __name__ == "__main__":
    async def main():
        generator = await get_mistral_course_generator()

        course_summary = await generator.generate_plan(
            CourseSummaryGenerateContext(
                goal="Научиться программировать на Python",
                start_knowledge="Базовые знания о программировании",
                target_knowledge="Профессиональные навыки в Python",
                target_audience="Начинающие программисты",
                topics=["декораторы"]
            )
        )

        with open("course_summary_generated.json", "w", encoding="utf-8") as file:
            json.dump(course_summary.model_dump(), file, indent=4, ensure_ascii=False)

    asyncio.run(main())