from datetime import datetime
from pydantic import BaseModel, Field
from .lessons import LessonListItem, LessonResponse


class CourseCreate(BaseModel):
    """Схема для создания курса"""
    name: str = Field(description="Название курса", min_length=1, max_length=200)
    description: str = Field(description="Описание курса", max_length=5000)


class CourseUpdate(BaseModel):
    """Схема для обновления курса"""
    name: str | None = Field(default=None, description="Название курса", min_length=1, max_length=200)
    description: str | None = Field(default=None, description="Описание курса", max_length=5000)


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


class CourseSearchResponse(BaseModel):
    """Схема для ответа поиска курсов"""
    my: list[CourseResponse] = Field(default_factory=list)
    community: list[CourseResponse] = Field(default_factory=list)


class GenerateLessonsRequest(BaseModel):
    """Схема для запроса генерации уроков"""
    goal: str | None = Field(default=None, description="Цель курса")
    start_knowledge: str | None = Field(default=None, description="Начальные знания")
    target_knowledge: str | None = Field(default=None, description="Конечные знания")
    target_audience: str | None = Field(default=None, description="Целевая аудитория")
    topics: list[str] | None = Field(default=None, description="Темы, которые нужно включить")


class ExportCourseRequest(BaseModel):
    """Схема для запроса экспорта курса"""
    format: str = Field(description="Формат экспорта: 'markdown' или 'pdf'", pattern="^(markdown|pdf)$")
