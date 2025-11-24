from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from courses.schema import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonListItem,
)
from pydantic import BaseModel, Field
import courses.service.lessons as lesson_service


router = APIRouter(prefix="/lessons", tags=["lessons"])


class ReorderRequest(BaseModel):
    """Схема для изменения позиции урока"""
    new_position: int = Field(description="Новая позиция урока", ge=0)


@router.post("", response_model=LessonResponse, status_code=201)
async def create_lesson(
    lesson: LessonCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Создать новый урок"""
    user_id = request.state.user_id
    created_lesson = await lesson_service.create_lesson(db, lesson, user_id)
    
    # Преобразуем content в blocks для ответа с валидацией
    blocks = created_lesson.content.get("blocks", [])
    if not isinstance(blocks, list):
        blocks = []
    
    return LessonResponse(
        id=created_lesson.id,
        course_id=created_lesson.course_id,
        position=created_lesson.position,
        name=created_lesson.name,
        description=created_lesson.description,
        blocks=blocks,
        created_at=created_lesson.created_at,
        updated_at=created_lesson.updated_at
    )


@router.get("/course/{course_id}", response_model=list[LessonListItem])
async def get_course_lessons(
    course_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить все уроки курса"""
    user_id = request.state.user_id
    lessons = await lesson_service.get_course_lessons(db, course_id, user_id)
    
    return [
        LessonListItem(
            id=lesson.id,
            course_id=lesson.course_id,
            position=lesson.position,
            name=lesson.name,
            description=lesson.description,
            created_at=lesson.created_at
        )
        for lesson in lessons
    ]


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить урок по ID"""
    user_id = request.state.user_id
    lesson = await lesson_service.get_lesson(db, lesson_id, user_id)
    
    # Преобразуем content в blocks для ответа с валидацией
    blocks = lesson.content.get("blocks", [])
    if not isinstance(blocks, list):
        blocks = []
    
    return LessonResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        position=lesson.position,
        name=lesson.name,
        description=lesson.description,
        blocks=blocks,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at
    )


@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: int,
    lesson_update: LessonUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Обновить урок"""
    user_id = request.state.user_id
    updated_lesson = await lesson_service.update_lesson(db, lesson_id, lesson_update, user_id)
    
    # Преобразуем content в blocks для ответа с валидацией
    blocks = updated_lesson.content.get("blocks", [])
    if not isinstance(blocks, list):
        blocks = []
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )


@router.delete("/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Удалить урок"""
    user_id = request.state.user_id
    return await lesson_service.delete_lesson(db, lesson_id, user_id)


@router.post("/{lesson_id}/reorder", response_model=LessonResponse)
async def reorder_lesson(
    lesson_id: int,
    reorder_request: ReorderRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Изменить позицию урока"""
    user_id = request.state.user_id
    updated_lesson = await lesson_service.reorder_lesson(
        db,
        lesson_id,
        reorder_request.new_position,
        user_id
    )
    
    # Преобразуем content в blocks для ответа с валидацией
    blocks = updated_lesson.content.get("blocks", [])
    if not isinstance(blocks, list):
        blocks = []
    
    return LessonResponse(
        id=updated_lesson.id,
        course_id=updated_lesson.course_id,
        position=updated_lesson.position,
        name=updated_lesson.name,
        description=updated_lesson.description,
        blocks=blocks,
        created_at=updated_lesson.created_at,
        updated_at=updated_lesson.updated_at
    )

