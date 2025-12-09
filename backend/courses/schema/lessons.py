from datetime import datetime
from pydantic import BaseModel, Field
from .blocks import LessonBlock


class LessonCreate(BaseModel):
    """Схема для создания урока"""
    course_id: int = Field(description="ID курса", gt=0)
    position: int | None = Field(default=None, description="Позиция урока в курсе (None для автоматического назначения)", ge=-1)
    name: str = Field(description="Название урока", min_length=1, max_length=200)
    description: str | None = Field(default=None, description="Описание урока", max_length=1000)
    blocks: list[LessonBlock] = Field(description="Блоки урока", default_factory=list)


class LessonUpdate(BaseModel):
    """Схема для обновления урока"""
    name: str | None = Field(default=None, description="Название урока", min_length=1, max_length=200)
    description: str | None = Field(default=None, description="Описание урока", max_length=1000)
    position: int | None = Field(default=None, description="Позиция урока", ge=0)


class LessonResponse(BaseModel):
    """Схема для ответа с уроком"""
    id: int
    course_id: int
    position: int
    name: str
    description: str | None
    blocks: list[LessonBlock]
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class LessonListItem(BaseModel):
    """Схема для списка уроков (без блоков)"""
    id: int
    course_id: int
    position: int
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateLessonContentRequest(BaseModel):
    """Схема запроса для генерации контента урока"""
    context: str | None = Field(default=None, description="Конспект или материалы, на основе которых нужно создать урок")
    goal: str | None = Field(default=None, description="Что студент должен уметь после урока", max_length=500)
    focus_points: list[str] | None = Field(
        default=None,
        description="Ключевые аспекты, которые обязательно нужно раскрыть"
    )


class GenerateLessonContentResponse(BaseModel):
    """Схема ответа с сгенерированным контентом урока"""
    blocks: list[LessonBlock] = Field(description="Сгенерированные блоки урока")
