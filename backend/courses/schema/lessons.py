from datetime import datetime
from pydantic import BaseModel, Field
from .blocks import LessonBlock


class LessonCreate(BaseModel):
    """Схема для создания урока"""
    course_id: int = Field(description="ID курса")
    position: int = Field(description="Позиция урока в курсе", ge=0)
    name: str = Field(description="Название урока", min_length=1)
    description: str | None = Field(default=None, description="Описание урока")
    blocks: list[LessonBlock] = Field(description="Блоки урока")


class LessonUpdate(BaseModel):
    """Схема для обновления урока"""
    name: str | None = Field(default=None, description="Название урока")
    description: str | None = Field(default=None, description="Описание урока")
    position: int | None = Field(default=None, description="Позиция урока", ge=0)
    blocks: list[LessonBlock] | None = Field(default=None, description="Блоки урока")


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

