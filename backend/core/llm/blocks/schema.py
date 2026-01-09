from typing import Optional

from courses.schema.blocks import LessonBlock
from pydantic import BaseModel, Field


class LessonBlockGenerateContext(BaseModel):
    """Данные, которые используются моделью для генерации контента блока урока."""

    # Информация о курсе
    course_name: str = Field(description="Название курса")
    course_description: str | None = Field(default=None, description="Описание курса")

    # Информация об уроке
    lesson_topic: str = Field(description="Название темы урока")
    lesson_description: str | None = Field(default=None, description="Описание урока")

    # Контекст для генерации
    user_request: str | None = Field(
        default=None,
        description="Запрос пользователя для генерации или переформулирования блока",
    )
    context: str | None = Field(
        default=None,
        description="Конспект или материалы, на основе которых нужно создать/переформулировать блок",
    )

    # Соседние блоки для контекста
    previous_block: Optional[dict] = Field(
        default=None, description="Содержимое предыдущего блока (если есть)"
    )
    current_block: Optional[dict] = Field(
        default=None, description="Текущее содержимое блока (для переформулирования)"
    )
    next_block: Optional[dict] = Field(
        default=None, description="Содержимое следующего блока (если есть)"
    )

    # Тип блока, который нужно сгенерировать
    block_type: str | None = Field(
        default=None,
        description="Тип блока для генерации (theory, code, note, single_choice, multiple_choice)",
    )


class GeneratedLessonBlockContent(BaseModel):
    """Результат генерации отдельного блока урока."""

    block: LessonBlock = Field(description="Сгенерированный блок урока")
