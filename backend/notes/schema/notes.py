from pydantic import BaseModel


class NoteCreate(BaseModel):
    path: str
    title: str
    content: str


class NoteResponse(BaseModel):
    id: int
    path: str
    title: str
    content: str


class NoteUpdateRequest(BaseModel):
    id: int
    path: str
    title: str
    content: str


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]