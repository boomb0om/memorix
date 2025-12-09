from pydantic import BaseModel, Field

from courses.schema.blocks import LessonBlock


class LessonBlocksGenerateContext(BaseModel):
    """Данные, которые используются моделью для сборки урока из блоков."""

    topic: str = Field(description="Название темы урока")
    description: str | None = Field(default=None, description="Описание урока")
    context: str | None = Field(default=None, description="Конспект или материалы, на основе которых нужно создать урок")
    goal: str | None = Field(default=None, description="Что студент должен уметь после урока")
    focus_points: list[str] | None = Field(
        default=None,
        description="Ключевые аспекты, которые обязательно нужно раскрыть",
    )


class GeneratedLessonContent(BaseModel):
    """Результат генерации урока."""
    blocks: list[LessonBlock] = Field(description="Набор блоков, описывающих содержание урока")