from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from courses.schema import LessonCreate, LessonUpdate, LessonResponse, LessonListItem
from courses.schema.blocks import LessonBlock
from pydantic import BaseModel, Field
from uuid import UUID
import courses.service.lessons as lesson_service


router = APIRouter(prefix="/{course_id}/lessons", tags=["lessons"])


class ReorderRequest(BaseModel):
    """Схема для изменения позиции урока"""
    new_position: int = Field(description="Новая позиция урока", ge=0)


class CheckAnswerRequest(BaseModel):
    """Схема для проверки ответа на вопрос"""
    answer: int | list[int] = Field(description="Ответ пользователя (int для single_choice, list[int] для multiple_choice)")


@router.post("", response_model=LessonResponse, status_code=201)
async def create_lesson(
    course_id: int,
    lesson: LessonCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Создать новый урок"""
    user_id = request.state.user_id
    # Убеждаемся, что course_id в запросе соответствует переданному в URL
    lesson.course_id = course_id
    return await lesson_service.create_lesson(db, lesson, user_id)


@router.get("", response_model=list[LessonListItem])
async def get_course_lessons(
    course_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить все уроки курса"""
    user_id = request.state.user_id
    return await lesson_service.get_course_lessons(db, course_id, user_id)


@router.get("/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    course_id: int,
    lesson_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить урок по ID"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.get_lesson_response(db, lesson_id, user_id)


@router.patch("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    course_id: int,
    lesson_id: int,
    lesson_update: LessonUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Обновить урок"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.update_lesson(db, lesson_id, lesson_update, user_id)


@router.delete("/{lesson_id}")
async def delete_lesson(
    course_id: int,
    lesson_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Удалить урок"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.delete_lesson(db, lesson_id, user_id)


@router.post("/{lesson_id}/reorder", response_model=LessonResponse)
async def reorder_lesson(
    course_id: int,
    lesson_id: int,
    reorder_request: ReorderRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Изменить позицию урока"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.reorder_lesson(
        db,
        lesson_id,
        reorder_request.new_position,
        user_id
    )


@router.patch("/{lesson_id}/blocks/{block_id}", response_model=LessonResponse)
async def update_block(
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    block_update: LessonBlock,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Обновить отдельный блок урока"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    
    # Конвертируем блок в словарь для обновления
    block_dict = block_update.model_dump(exclude={"block_id"})
    block_dict["type"] = block_update.type
    
    return await lesson_service.update_block(
        db,
        lesson_id,
        block_id,
        block_dict,
        user_id
    )


@router.post("/{lesson_id}/blocks/{block_id}/reorder", response_model=LessonResponse)
async def reorder_block(
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    reorder_request: ReorderRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Изменить позицию блока в уроке"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.reorder_block(
        db,
        lesson_id,
        block_id,
        reorder_request.new_position,
        user_id
    )


@router.post("/{lesson_id}/blocks", response_model=LessonResponse)
async def add_block(
    course_id: int,
    lesson_id: int,
    block: LessonBlock,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Добавить новый блок к уроку"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    
    # Конвертируем блок в словарь
    block_dict = block.model_dump(exclude={"block_id"})
    block_dict["type"] = block.type
    
    return await lesson_service.add_block_to_lesson(
        db,
        lesson_id,
        block_dict,
        user_id
    )


@router.delete("/{lesson_id}/blocks/{block_id}", response_model=LessonResponse)
async def delete_block(
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.delete_block(
        db,
        lesson_id,
        block_id,
        user_id
    )


@router.post("/{lesson_id}/blocks/{block_id}/check-answer")
async def check_answer(
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    check_request: CheckAnswerRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Проверить ответ пользователя на вопрос"""
    user_id = request.state.user_id
    await lesson_service.verify_lesson_belongs_to_course(db, lesson_id, course_id, user_id)
    return await lesson_service.check_question_answer(
        db,
        lesson_id,
        block_id,
        check_request.answer,
        user_id
    )

