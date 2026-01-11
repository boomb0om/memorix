from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from courses.schema.lessons import GenerateLessonContentRequest, GenerateLessonContentResponse
import courses.service.lesson_generation as lesson_generation_service
from users.service.users import check_user_plan_for_llm


router = APIRouter(prefix="/{course_id}/lessons", tags=["lesson-generation"])


@router.post("/{lesson_id}/generate-content", response_model=GenerateLessonContentResponse, status_code=200)
async def generate_lesson_content(
    course_id: int,
    lesson_id: int,
    request: Request,
    generate_request: GenerateLessonContentRequest,
    db: AsyncSession = Depends(get_db)
):
    user_id = request.state.user_id
    
    # Проверяем тариф пользователя
    await check_user_plan_for_llm(db, user_id)
    
    blocks = await lesson_generation_service.generate_lesson_content(
        db=db,
        course_id=course_id,
        lesson_id=lesson_id,
        user_id=user_id,
        context=generate_request.context,
        goal=generate_request.goal,
        focus_points=generate_request.focus_points,
    )
    
    return GenerateLessonContentResponse(blocks=blocks)

