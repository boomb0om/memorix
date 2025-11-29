from typing import Literal
from pydantic import BaseModel, Field

from backend.courses.schema.blocks import LessonBlock


class LessonBlocksGenerateContext(BaseModel):
    """Данные, которые используются моделью для сборки урока из блоков."""

    topic: str = Field(description="Название темы урока")
    notes: str = Field(description="Конспект или материалы, на основе которых нужно создать урок")
    goal: str | None = Field(default=None, description="Что студент должен уметь после урока")
    audience_level: Literal["beginner", "intermediate", "advanced"] | None = Field(
        default=None,
        description="Уровень подготовленности аудитории",
    )
    focus_points: list[str] | None = Field(
        default=None,
        description="Ключевые аспекты, которые обязательно нужно раскрыть",
    )
    preferred_block_types: list[str] | None = Field(
        default=None,
        description="Желаемые типы блоков (theory, code, note, single_choice, multiple_choice)",
    )


class GeneratedLessonContent(BaseModel):
    """Результат генерации урока."""

    title: str = Field(description="Предложенное название урока")
    summary: str | None = Field(default=None, description="Краткое описание или аннотация урока")
    blocks: list[LessonBlock] = Field(description="Набор блоков, описывающих содержание урока")