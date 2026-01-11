from core.db import Base
from sqlalchemy import String, DateTime, func, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from enum import Enum


class UserPlan(str, Enum):
    FREE = "free"
    TESTING = "testing"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(), index=True)
    hashed_password: Mapped[str] = mapped_column(String())
    is_active: Mapped[bool] = mapped_column(default=True)
    plan: Mapped[UserPlan] = mapped_column(SQLEnum(UserPlan), nullable=False, default=UserPlan.FREE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
