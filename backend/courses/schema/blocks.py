from typing import Literal, Union
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# Базовый класс для всех блоков
class BaseBlock(BaseModel):
    """Базовый класс для блоков урока"""

    block_id: UUID | None = Field(
        default=None, description="Уникальный идентификатор блока (UUID)"
    )
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
    correct_answers: list[int] = Field(
        description="Индексы правильных ответов (0-based)", min_length=1
    )
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
        default="info", description="Тип заметки"
    )
    content: str = Field(description="Текст заметки")


# Блок с презентацией
class PresentationBlock(BaseBlock):
    """Блок с презентацией (Google Slides)"""

    type: Literal["presentation"] = "presentation"
    url: str = Field(description="Ссылка на Google Презентацию")


# Блок с видео
class VideoBlock(BaseBlock):
    """Блок с видео (YouTube или VK Video)"""

    type: Literal["video"] = "video"
    video_type: Literal["youtube", "vk"] = Field(description="Тип видео: youtube или vk")
    url: str = Field(description="Ссылка на видео")


# Union тип для всех блоков
LessonBlock = Union[
    TheoryBlock,
    SingleChoiceQuestionBlock,
    MultipleChoiceQuestionBlock,
    CodeBlock,
    NoteBlock,
    PresentationBlock,
    VideoBlock,
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
                        "content": "Python - это высокоуровневый язык программирования...",
                    },
                    {
                        "block_id": "550e8400-e29b-41d4-a716-446655440001",
                        "type": "code",
                        "title": "Пример Hello World",
                        "code": "print('Hello, World!')",
                        "language": "python",
                        "explanation": "Функция print выводит текст на экран",
                    },
                    {
                        "block_id": "550e8400-e29b-41d4-a716-446655440002",
                        "type": "single_choice",
                        "question": "Что выведет этот код?",
                        "options": ["Hello, World!", "Hello World", "Ошибка"],
                        "correct_answer": 0,
                        "explanation": "print() выводит строку как есть",
                    },
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


def build_block_context(block_dict: dict | None) -> dict | None:
    """Извлечь полезный контекст из блока в зависимости от его типа.

    Возвращает только нужную информацию для контекста генерации,
    исключая технические детали (block_id, correct_answer и т.д.)
    Если блок пустой или None, возвращает None.
    """
    if not block_dict:
        return None

    block_type = block_dict.get("type")
    if not block_type:
        return None

    context = {"type": block_type}

    if block_type == "theory":
        # Для теории: заголовок и содержимое
        if "title" in block_dict:
            context["title"] = block_dict["title"]
        if "content" in block_dict:
            context["content"] = block_dict["content"]

    elif block_type == "code":
        # Для кода: заголовок, код, язык, объяснение
        if "title" in block_dict:
            context["title"] = block_dict["title"]
        if "code" in block_dict:
            context["code"] = block_dict["code"]
        if "language" in block_dict:
            context["language"] = block_dict["language"]
        if "explanation" in block_dict:
            context["explanation"] = block_dict["explanation"]

    elif block_type == "note":
        # Для заметки: тип заметки и содержимое
        if "note_type" in block_dict:
            context["note_type"] = block_dict["note_type"]
        if "content" in block_dict:
            context["content"] = block_dict["content"]

    elif block_type == "single_choice":
        # Для вопроса с одним ответом: вопрос, варианты, объяснение (без правильного ответа)
        if "question" in block_dict:
            context["question"] = block_dict["question"]
        if "options" in block_dict:
            context["options"] = block_dict["options"]
        if "explanation" in block_dict:
            context["explanation"] = block_dict["explanation"]

    elif block_type == "multiple_choice":
        # Для вопроса с несколькими ответами: вопрос, варианты, объяснение (без правильных ответов)
        if "question" in block_dict:
            context["question"] = block_dict["question"]
        if "options" in block_dict:
            context["options"] = block_dict["options"]
        if "explanation" in block_dict:
            context["explanation"] = block_dict["explanation"]

    elif block_type == "presentation":
        # Блок презентации не включается в контекст генерации
        return None

    elif block_type == "video":
        # Блок видео не включается в контекст генерации
        return None

    # Если контекст содержит только тип, возвращаем None
    if len(context) == 1:
        return None

    return context


class GenerateLessonBlockContentRequest(BaseModel):
    """Схема запроса для генерации контента блока урока"""

    user_request: str | None = Field(
        default=None,
        description="Запрос пользователя для генерации или переформулирования блока",
    )
    context: str | None = Field(
        default=None,
        description="Конспект или материалы, на основе которых нужно создать урок",
    )


class GenerateLessonBlockContentResponse(BaseModel):
    """Схема ответа со сгенерированным контентом блока урока"""

    block: LessonBlock = Field(description="Сгенерированный блок урока")


class AddBlockRequest(BaseModel):
    """Схема для добавления блока с указанием позиции"""
    block: LessonBlock = Field(description="Данные блока")
    position: int | None = Field(default=None, description="Позиция для вставки блока (None - добавить в конец)")
    
    @field_validator('position')
    @classmethod
    def validate_position(cls, v):
        # Явно проверяем, что position либо None, либо неотрицательное число
        # 0 - это валидная позиция (вставка в начало)
        if v is not None:
            if not isinstance(v, int):
                raise ValueError('Position must be an integer')
            if v < 0:
                raise ValueError('Position must be >= 0')
        return v
