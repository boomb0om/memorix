import logging
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from courses.dao import CourseDAO, LessonDAO, LessonBlockDAO, CourseAnalysisHistoryDAO
from courses.service.access_control import ensure_course_access
from courses.schema.blocks import db_block_to_schema
from courses.schema.courses import CourseAnalysisHistoryItem
from core.llm.course_analysis import (
    analyze_course,
    CourseAnalysisContext,
    LessonSummary,
)

logger = logging.getLogger(__name__)


def _get_block_summary(block_dict: dict) -> str:
    """Получить краткое описание блока (1-2 предложения)."""
    block_type = block_dict.get("type", "unknown")

    if block_type == "theory":
        title = block_dict.get("title", "")
        content = block_dict.get("content", "")
        # Берем первые 100 символов контента
        content_preview = content[:100] + "..." if len(content) > 100 else content
        if title:
            return f"Теория: {title}. {content_preview}"
        return f"Теория: {content_preview}"

    elif block_type == "code":
        title = block_dict.get("title", "")
        language = block_dict.get("language", "unknown")
        explanation = block_dict.get("explanation", "")
        if title:
            return f"Код ({language}): {title}. {explanation[:80] if explanation else 'Пример кода'}"
        return f"Код ({language}): {explanation[:80] if explanation else 'Пример кода'}"

    elif block_type == "note":
        note_type = block_dict.get("note_type", "info")
        content = block_dict.get("content", "")
        content_preview = content[:80] + "..." if len(content) > 80 else content
        return f"Заметка ({note_type}): {content_preview}"

    elif block_type == "single_choice":
        question = block_dict.get("question", "")
        options_count = len(block_dict.get("options", []))
        return f"Вопрос с одним ответом: {question[:80]}{'...' if len(question) > 80 else ''} ({options_count} вариантов)"

    elif block_type == "multiple_choice":
        question = block_dict.get("question", "")
        options_count = len(block_dict.get("options", []))
        return f"Вопрос с несколькими ответами: {question[:80]}{'...' if len(question) > 80 else ''} ({options_count} вариантов)"

    return f"Блок типа {block_type}"


async def prepare_course_analysis_context(
    db: AsyncSession,
    course_id: int,
) -> CourseAnalysisContext:
    """Подготовить сжатый контекст курса для анализа."""
    # Получаем курс с уроками
    course = await CourseDAO.get_by_id_with_lessons(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Подготавливаем информацию об уроках
    lessons_summary = []

    for lesson in course.lessons:
        # Получаем блоки урока
        blocks = await LessonBlockDAO.get_all_by_lesson(db, lesson.id)

        # Подсчитываем типы блоков
        block_types: dict[str, int] = {}
        blocks_summary: list[str] = []

        for block in blocks:
            block_type = block.type
            block_types[block_type] = block_types.get(block_type, 0) + 1

            # Получаем краткое описание блока
            block_dict = db_block_to_schema(block)
            block_summary = _get_block_summary(block_dict)
            blocks_summary.append(block_summary)

        # Создаем summary урока
        lesson_summary = LessonSummary(
            position=lesson.position,
            name=lesson.name,
            description=lesson.description,
            goal=None,  # Цель урока не хранится отдельно, можно извлечь из описания
            blocks_count=len(blocks),
            block_types=block_types,
            blocks_summary=blocks_summary,
        )
        lessons_summary.append(lesson_summary)

    # Создаем контекст для анализа
    context = CourseAnalysisContext(
        course_name=course.name,
        course_description=course.description,
        lessons_count=len(lessons_summary),
        lessons=lessons_summary,
    )

    return context


async def analyze_course_methodology(
    db: AsyncSession,
    course_id: int,
    user_id: int,
) -> str:
    """Проанализировать курс с точки зрения методологии обучения."""
    # Проверяем доступ
    await ensure_course_access(db, course_id, user_id, require_author=True)

    logger.info(f"User {user_id} analyzing course {course_id}")
    context = await prepare_course_analysis_context(db, course_id)
    # Анализируем курс
    report = await analyze_course(context)
    report_text = report.report

    await CourseAnalysisHistoryDAO.create(db, course_id, user_id, report_text)
    await db.commit()

    logger.info(f"Course {course_id} analysis completed")

    return report_text


async def get_course_analysis_history(
    db: AsyncSession,
    course_id: int,
    user_id: int,
) -> list[CourseAnalysisHistoryItem]:
    """Получить историю анализов курса."""
    # Проверяем доступ
    await ensure_course_access(db, course_id, user_id, require_author=True)

    history = await CourseAnalysisHistoryDAO.get_by_course_id(db, course_id)
    return [CourseAnalysisHistoryItem.model_validate(item) for item in history]
