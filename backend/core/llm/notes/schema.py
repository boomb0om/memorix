from pydantic import BaseModel, Field


class NotesGenerateContext(BaseModel):
    user_notes: str = Field(description="Записи пользователя")


class Note(BaseModel):
    title: str = Field(description="Заголовок записи")
    content: str = Field(description="Содержимое записи")