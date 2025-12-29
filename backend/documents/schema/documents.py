from datetime import datetime
from pydantic import BaseModel
from documents.dao.models import DocumentStatus


class DocumentResponse(BaseModel):
    id: int
    filename: str
    name: str
    s3_path: str
    user_id: int
    status: DocumentStatus
    indexed_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class DocumentCreate(BaseModel):
    name: str

