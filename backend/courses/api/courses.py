from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from courses.schema import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseWithLessons,
    CourseSearchResponse,
    LessonListItem,
    GenerateLessonsRequest,
)
import courses.service.courses as course_service
from courses.api.lessons import router as lessons_router


router = APIRouter(prefix="/courses", tags=["courses"])

router.include_router(lessons_router)


@router.post("", response_model=CourseResponse, status_code=201)
async def create_course(
    course: CourseCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Создать новый курс"""
    user_id = request.state.user_id
    return await course_service.create_course(db, course, user_id)


@router.get("", response_model=list[CourseResponse])
async def get_user_courses(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить все доступные курсы пользователя"""
    user_id = request.state.user_id
    return await course_service.get_user_courses(db, user_id)


@router.get("/my", response_model=list[CourseResponse])
async def get_my_courses(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить курсы, созданные пользователем"""
    user_id = request.state.user_id
    return await course_service.get_my_courses(db, user_id)


@router.get("/search", response_model=CourseSearchResponse)
async def search_courses(
    request: Request,
    query: str = Query(..., min_length=1, max_length=200, description="Строка поиска"),
    db: AsyncSession = Depends(get_db)
):
    """Поиск курсов по названию и описанию"""
    user_id = request.state.user_id
    return await course_service.search_courses(db, user_id, query)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить курс по ID"""
    user_id = request.state.user_id
    return await course_service.get_course(db, course_id, user_id)


@router.get("/{course_id}/with-lessons", response_model=CourseWithLessons)
async def get_course_with_lessons(
    course_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получить курс с уроками"""
    user_id = request.state.user_id
    course = await course_service.get_course_with_lessons(db, course_id, user_id)
    
    # Преобразуем в нужный формат
    return CourseWithLessons(
        id=course.id,
        name=course.name,
        description=course.description,
        author_id=course.author_id,
        created_at=course.created_at,
        updated_at=course.updated_at,
        lessons=[
            LessonListItem(
                id=lesson.id,
                course_id=lesson.course_id,
                position=lesson.position,
                name=lesson.name,
                description=lesson.description,
                created_at=lesson.created_at
            )
            for lesson in course.lessons
        ]
    )


@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_update: CourseUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Обновить курс"""
    user_id = request.state.user_id
    return await course_service.update_course(db, course_id, course_update, user_id)


@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Удалить курс"""
    user_id = request.state.user_id
    return await course_service.delete_course(db, course_id, user_id)


@router.post("/{course_id}/generate-lessons")
async def generate_lessons(
    course_id: int,
    request: Request,
    request_data: GenerateLessonsRequest | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Сгенерировать план уроков для курса"""
    user_id = request.state.user_id
    if request_data is None:
        request_data = GenerateLessonsRequest()
    
    return await course_service.generate_lessons_plan(
        db,
        course_id,
        user_id,
        goal=request_data.goal,
        start_knowledge=request_data.start_knowledge,
        target_knowledge=request_data.target_knowledge,
        target_audience=request_data.target_audience,
        topics=request_data.topics
    )

