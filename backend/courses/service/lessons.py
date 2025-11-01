from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.schema import LessonCreate, LessonUpdate
from courses.dao import CourseDAO, LessonDAO


async def create_lesson(db: AsyncSession, lesson: LessonCreate, user_id: int):
    """Создать урок"""
    # Проверка, что курс существует и пользователь - его автор
    course = await CourseDAO.get_by_id(db, lesson.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only course author can create lessons")
    
    # Проверка уникальности позиции
    existing_lesson = await LessonDAO.get_by_position(db, lesson.course_id, lesson.position)
    if existing_lesson:
        raise HTTPException(
            status_code=400,
            detail=f"Lesson with position {lesson.position} already exists"
        )
    
    # Преобразуем блоки в dict для хранения
    content_dict = {"blocks": [block.model_dump() for block in lesson.blocks]}
    
    return await LessonDAO.create(
        db,
        course_id=lesson.course_id,
        position=lesson.position,
        name=lesson.name,
        description=lesson.description,
        content=content_dict
    )


async def get_lesson(db: AsyncSession, lesson_id: int, user_id: int):
    """Получить урок по ID"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка доступа к курсу
    course = await CourseDAO.get_by_id(db, lesson.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.author_id != user_id:
        # TODO: Проверить ACL
        raise HTTPException(status_code=403, detail="Access denied")
    
    return lesson


async def get_course_lessons(db: AsyncSession, course_id: int, user_id: int):
    """Получить все уроки курса"""
    # Проверка доступа к курсу
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.author_id != user_id:
        # TODO: Проверить ACL
        raise HTTPException(status_code=403, detail="Access denied")
    
    return await LessonDAO.get_all_by_course(db, course_id)


async def update_lesson(
    db: AsyncSession,
    lesson_id: int,
    lesson_update: LessonUpdate,
    user_id: int
):
    """Обновить урок"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    course = await CourseDAO.get_by_id(db, lesson.course_id)
    if not course or course.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only course author can update lessons")
    
    # Собираем данные для обновления
    update_data = lesson_update.model_dump(exclude_unset=True)
    if not update_data:
        return lesson
    
    # Если обновляется позиция, проверяем уникальность
    if "position" in update_data and update_data["position"] != lesson.position:
        existing = await LessonDAO.get_by_position(
            db,
            lesson.course_id,
            update_data["position"]
        )
        if existing and existing.id != lesson_id:
            raise HTTPException(
                status_code=400,
                detail=f"Lesson with position {update_data['position']} already exists"
            )
    
    # Если обновляются блоки, преобразуем их в dict
    if "blocks" in update_data:
        update_data["content"] = {"blocks": [block.model_dump() for block in update_data["blocks"]]}
        del update_data["blocks"]
    
    updated_lesson = await LessonDAO.update(db, lesson_id, **update_data)
    if not updated_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return updated_lesson


async def delete_lesson(db: AsyncSession, lesson_id: int, user_id: int):
    """Удалить урок"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    course = await CourseDAO.get_by_id(db, lesson.course_id)
    if not course or course.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only course author can delete lessons")
    
    await LessonDAO.delete(db, lesson_id)
    return {"message": "Lesson deleted successfully"}


async def reorder_lesson(
    db: AsyncSession,
    lesson_id: int,
    new_position: int,
    user_id: int
):
    """Изменить позицию урока"""
    lesson = await LessonDAO.get_by_id(db, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Проверка, что пользователь - автор курса
    course = await CourseDAO.get_by_id(db, lesson.course_id)
    if not course or course.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only course author can reorder lessons")
    
    # Проверка уникальности новой позиции
    if new_position != lesson.position:
        existing = await LessonDAO.get_by_position(db, lesson.course_id, new_position)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Lesson with position {new_position} already exists"
            )
    
    return await LessonDAO.reorder(db, lesson_id, new_position)

