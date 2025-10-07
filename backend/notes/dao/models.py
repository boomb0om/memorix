from core.db import Base
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    path: Mapped[str] = mapped_column(String(), unique=True, index=True)
    title: Mapped[str] = mapped_column(String())
    content: Mapped[str] = mapped_column(Text())
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
