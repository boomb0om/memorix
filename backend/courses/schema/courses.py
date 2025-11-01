from datetime import datetime
from pydantic import BaseModel, Field
from .lessons import LessonListItem, LessonResponse


class CourseCreate(BaseModel):
    """Схема для создания курса"""
    name: str = Field(description="Название курса", min_length=1)
    description: str = Field(description="Описание курса")


class CourseUpdate(BaseModel):
    """Схема для обновления курса"""
    name: str | None = Field(default=None, description="Название курса")
    description: str | None = Field(default=None, description="Описание курса")


class CourseResponse(BaseModel):
    """Схема для ответа с курсом (без уроков)"""
    id: int
    name: str
    description: str
    author_id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class CourseWithLessons(CourseResponse):
    """Схема для курса с уроками"""
    lessons: list[LessonListItem] = Field(default_factory=list)


class CourseDetailResponse(CourseResponse):
    """Схема для детального просмотра курса с полными уроками"""
    lessons: list[LessonResponse] = Field(default_factory=list)
