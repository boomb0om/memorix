from datetime import datetime
from typing import Optional
from enum import Enum
from core.db import Base
from sqlalchemy import String, DateTime, func, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column


class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    INDEXING = "indexing"
    FINISHED = "finished"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(), nullable=False)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    s3_path: Mapped[str] = mapped_column(String(), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(SQLEnum(DocumentStatus), nullable=False, default=DocumentStatus.UPLOADED)
    indexed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

