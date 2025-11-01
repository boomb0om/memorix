from typing import Literal
from pydantic import BaseModel, Field

from backend.core.llm.tests import BaseQuestion


class TheoryGenerateContext(BaseModel):
    notes: str = Field(description="Конспект учебной темы")
    topic: str = Field(description="По какой именно теме конспекта сгенерировать урок")


class Theory(BaseModel):
    title: str = Field(description="Заголовок теории")
    content: str = Field(description="Теоретический материал")


class Lesson(BaseModel):
    title: str = Field(description="Заголовок урока")
    theory: str = Field(description="Теоретический материал урока")
    questions: list[BaseQuestion] = Field(description="Тест (вопросы) к уроку")