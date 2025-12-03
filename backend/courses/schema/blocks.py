from typing import Literal, Union
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# Базовый класс для всех блоков
class BaseBlock(BaseModel):
    """Базовый класс для блоков урока"""
    block_id: UUID | None = Field(default=None, description="Уникальный идентификатор блока (UUID)")
    type: str = Field(description="Тип блока")


# Блок с теорией
class TheoryBlock(BaseBlock):
    """Блок с теоретическим материалом"""
    type: Literal["theory"] = "theory"
    title: str = Field(description="Заголовок блока теории")
    content: str = Field(description="Теоретический материал в markdown")


# Блок с вопросом (одиночный выбор)
class SingleChoiceQuestionBlock(BaseBlock):
    """Вопрос с одним правильным ответом"""
    type: Literal["single_choice"] = "single_choice"
    question: str = Field(description="Формулировка вопроса")
    options: list[str] = Field(description="Варианты ответов", min_length=2)
    correct_answer: int = Field(description="Индекс правильного ответа (0-based)", ge=0)
    explanation: str | None = Field(default=None, description="Пояснение к ответу")


# Блок с вопросом (множественный выбор)
class MultipleChoiceQuestionBlock(BaseBlock):
    """Вопрос с несколькими правильными ответами"""
    type: Literal["multiple_choice"] = "multiple_choice"
    question: str = Field(description="Формулировка вопроса")
    options: list[str] = Field(description="Варианты ответов", min_length=2)
    correct_answers: list[int] = Field(description="Индексы правильных ответов (0-based)", min_length=1)
    explanation: str | None = Field(default=None, description="Пояснение к ответу")


# Блок с кодом
class CodeBlock(BaseBlock):
    """Блок с примером кода"""
    type: Literal["code"] = "code"
    title: str | None = Field(default=None, description="Заголовок блока кода")
    code: str = Field(description="Код")
    language: str = Field(default="python", description="Язык программирования")
    explanation: str | None = Field(default=None, description="Пояснение к коду")


# Блок с заметкой/предупреждением
class NoteBlock(BaseBlock):
    """Блок с важной информацией, заметкой или предупреждением"""
    type: Literal["note"] = "note"
    note_type: Literal["info", "warning", "tip", "important"] = Field(
        default="info",
        description="Тип заметки"
    )
    content: str = Field(description="Текст заметки")


# Union тип для всех блоков
LessonBlock = Union[
    TheoryBlock,
    SingleChoiceQuestionBlock,
    MultipleChoiceQuestionBlock,
    CodeBlock,
    NoteBlock
]


# Модель для содержимого урока
class LessonContent(BaseModel):
    """Содержимое урока в виде списка блоков"""
    blocks: list[LessonBlock] = Field(description="Список блоков урока")

    class Config:
        json_schema_extra = {
            "example": {
                "blocks": [
                    {
                        "block_id": "550e8400-e29b-41d4-a716-446655440000",
                        "type": "theory",
                        "title": "Введение в Python",
                        "content": "Python - это высокоуровневый язык программирования..."
                    },
                    {
                        "block_id": "550e8400-e29b-41d4-a716-446655440001",
                        "type": "code",
                        "title": "Пример Hello World",
                        "code": "print('Hello, World!')",
                        "language": "python",
                        "explanation": "Функция print выводит текст на экран"
                    },
                    {
                        "block_id": "550e8400-e29b-41d4-a716-446655440002",
                        "type": "single_choice",
                        "question": "Что выведет этот код?",
                        "options": ["Hello, World!", "Hello World", "Ошибка"],
                        "correct_answer": 0,
                        "explanation": "print() выводит строку как есть"
                    }
                ]
            }
        }


# Функции для конвертации между схемами блоков и моделями БД
def block_schema_to_dict(block: LessonBlock) -> dict:
    """Конвертировать блок из схемы в словарь для БД"""
    block_dict = block.model_dump(exclude={"block_id"})
    return block_dict


def db_block_to_schema(db_block) -> dict:
    """Конвертировать блок из БД в схему"""
    block_dict = {
        "block_id": str(db_block.id),  # Конвертируем UUID в строку для JSON
        "type": db_block.type,
    }
    # Добавляем данные блока
    if db_block.data:
        block_dict.update(db_block.data)
    return block_dict

