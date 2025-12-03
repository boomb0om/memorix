from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from core.db import Base
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID as PGUUID


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String())
    description: Mapped[str] = mapped_column(Text())
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson", 
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Lesson.position"
    )


class CourseACL(Base):
    __tablename__ = "course_acl"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    group: Mapped[Optional[str]] = mapped_column(String(), nullable=True)
    # Если group указан (например, "all"), то доступ для группы пользователей
    # Если user_id указан, то доступ для конкретного пользователя
    # Одно из полей (user_id или group) должно быть заполнено
    role: Mapped[str] = mapped_column(String())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (
        Index("ux_lessons_course_id_position", "course_id", "position", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    position: Mapped[int] = mapped_column(Integer(), nullable=False)
    name: Mapped[str] = mapped_column(String(), nullable=False)
    description: Mapped[str] = mapped_column(Text(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    course: Mapped["Course"] = relationship("Course", back_populates="lessons")
    blocks: Mapped[list["LessonBlock"]] = relationship(
        "LessonBlock",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="LessonBlock.position"
    )


class LessonBlock(Base):
    __tablename__ = "lesson_blocks"
    __table_args__ = (
        Index("ux_lesson_blocks_lesson_id_position", "lesson_id", "position", unique=True),
        Index("ix_lesson_blocks_id", "id", unique=True),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False)
    position: Mapped[int] = mapped_column(Integer(), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # theory, single_choice, multiple_choice, code, note
    data: Mapped[dict] = mapped_column(postgresql.JSONB(), nullable=False)  # Специфичные данные блока
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="blocks")
