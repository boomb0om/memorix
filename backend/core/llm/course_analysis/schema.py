from pydantic import BaseModel, Field
from typing import Optional


class LessonSummary(BaseModel):
    """Краткое описание урока для анализа"""

    position: int = Field(description="Позиция урока в курсе")
    name: str = Field(description="Название урока")
    description: Optional[str] = Field(default=None, description="Описание урока")
    goal: Optional[str] = Field(default=None, description="Цель урока")
    blocks_count: int = Field(description="Количество блоков в уроке")
    block_types: dict[str, int] = Field(description="Количество блоков каждого типа")
    blocks_summary: list[str] = Field(
        description="Краткое описание каждого блока (1-2 предложения)"
    )


class CourseAnalysisContext(BaseModel):
    """Контекст курса для анализа методологии"""

    course_name: str = Field(description="Название курса")
    course_description: str = Field(description="Описание курса")
    lessons_count: int = Field(description="Количество уроков в курсе")
    lessons: list[LessonSummary] = Field(
        description="Список уроков с их кратким описанием"
    )


class CourseAnalysisReport(BaseModel):
    """Отчёт анализа курса"""

    report: str = Field(description="Текстовый отчёт с анализом и рекомендациями")
