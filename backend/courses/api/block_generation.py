from uuid import UUID

from core.db import get_db
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

import courses.service.block_generation as block_generation_service
from courses.schema.blocks import (
    GenerateLessonBlockContentRequest,
    GenerateLessonBlockContentResponse,
)
from users.service.users import check_user_plan_for_llm

router = APIRouter(prefix="/{course_id}/lessons", tags=["block-generation"])


@router.post(
    "/{lesson_id}/blocks/{block_id}/generate-content",
    response_model=GenerateLessonBlockContentResponse,
    status_code=200,
)
async def generate_block_content(
    course_id: int,
    lesson_id: int,
    block_id: UUID,
    request: Request,
    generate_request: GenerateLessonBlockContentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Сгенерировать контент или переформулировать содержимое для отдельного блока урока"""
    user_id = request.state.user_id
    
    # Проверяем тариф пользователя
    await check_user_plan_for_llm(db, user_id)

    block = await block_generation_service.generate_lesson_block_content(
        db=db,
        course_id=course_id,
        lesson_id=lesson_id,
        block_id=block_id,
        user_id=user_id,
        user_request=generate_request.user_request,
        context=generate_request.context,
    )

    return GenerateLessonBlockContentResponse(block=block)
