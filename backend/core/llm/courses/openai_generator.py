
import asyncio
import json
import re

from core.llm.openai_client import MonitoredOpenAIClient, get_monitored_openai_client
from core.configs.llm import llm_settings
from .base_generator import BaseCourseGenerator
from .schema import CourseSummaryGenerateContext, CourseSummary
from .prompts import MISTRAL_COURSE_SUMMARY_PROMPT


class OpenAICourseGenerator(BaseCourseGenerator):

    def __init__(
        self, 
        client: MonitoredOpenAIClient,
        log_task_type: str = "generate_course_plan",
    ):
        self.client = client
        self.log_task_type = log_task_type

    async def generate_plan(self, context: CourseSummaryGenerateContext) -> CourseSummary:
        user_prompt =  f"# Цель курса:\n{context.goal}\n\n# Начальные знания:\n{context.start_knowledge}\n\n# Конечные знания:\n{context.target_knowledge}\n\n# Целевая аудитория:\n{context.target_audience}\n\n"
        if context.topics:
            user_prompt += f"# Темы курса, которые обязательно нужно включить в программу:\n{context.topics}\n\n"
        user_prompt += "# ответ в формате JSON:\n"
        response = await self.client.completions_create(
            messages=[
                {"role": "system", "content": MISTRAL_COURSE_SUMMARY_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            log_task_type=self.log_task_type,
        )
        content = response.choices[0].message.content.strip('`').strip('json').strip(' \n')
        match = re.search(r"(\{.*\})", content, re.DOTALL)
        if not match:
            raise ValueError("Cannot find JSON in model's response")

        course_summary = json.loads(match.group(1))
        return CourseSummary.model_validate(course_summary)


async def get_course_generator() -> OpenAICourseGenerator:
    return OpenAICourseGenerator(
        client=get_monitored_openai_client(llm_settings),
    )


if __name__ == "__main__":
    async def main():
        generator = await get_course_generator()

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