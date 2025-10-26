from typing import Literal
from pydantic import BaseModel, Field


class TestGenerateContext(BaseModel):
    notes: str = Field(description="Конспект учебной темы")
    topic: str = Field(description="По какой именно теме конспекта сгенерировать тест")
    num_questions: int | None = Field(default=None, description="Количество вопросов в тесте")


class BaseQuestion(BaseModel):
    pass


class ChoiceQuestion(BaseQuestion):
    type: Literal["single", "multiple"] = Field(description="Тип вопроса (с одним или несколькими верными вариантами ответа)")
    question: str = Field(description="Формулировка вопроса")
    options: list[str] = Field(description="Варианты ответов")
    answer: list[int] = Field(description="Номер верного ответа (или список номеров верных ответов)")
