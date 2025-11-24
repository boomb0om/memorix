from pydantic import BaseModel, Field


class CourseSummaryGenerateContext(BaseModel):
    goal: str = Field(description="Цель курса")
    start_knowledge: str = Field(description="Начальные знания")
    target_knowledge: str = Field(description="Конечные знания")
    target_audience: str = Field(description="Целевая аудитория")
    topics: list[str] | None = Field(default=None, description="Темы, которые нужно включить в программу курса")


class CourseTopic(BaseModel):
    title: str = Field(description="Название темы")
    info: str = Field(description="Что будет изучаться в теме")


class CourseSummary(BaseModel):
    title: str = Field(description="Название курса")
    goal: str = Field(description="Цель курса")
    description: str = Field(description="Описание курса")
    topics: list[CourseTopic] = Field(description="Темы курса")
