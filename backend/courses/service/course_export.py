import logging
from typing import Literal

from fastapi import HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from courses.dao import CourseDAO
from courses.schema.blocks import db_block_to_schema
from courses.service.access_control import check_course_access, ensure_course_access

logger = logging.getLogger(__name__)


def render_block_to_markdown(block_dict: dict) -> str:
    """Рендерить блок в Markdown"""
    block_type = block_dict.get("type")

    if block_type == "theory":
        title = block_dict.get("title", "")
        content = block_dict.get("content", "")
        result = ""
        if title:
            result += f"### {title}\n\n"
        result += f"{content}\n\n"
        return result

    elif block_type == "code":
        title = block_dict.get("title")
        code = block_dict.get("code", "")
        language = block_dict.get("language", "python")
        explanation = block_dict.get("explanation")

        result = ""
        if title:
            result += f"### {title}\n\n"
        result += f"```{language}\n{code}\n```\n\n"
        if explanation:
            result += f"*{explanation}*\n\n"
        return result

    elif block_type == "note":
        note_type = block_dict.get("note_type", "info")
        content = block_dict.get("content", "")

        # Используем blockquote для заметок
        note_labels = {
            "info": "ℹ️ Информация",
            "warning": "⚠️ Предупреждение",
            "tip": "💡 Совет",
            "important": "❗ Важно",
        }
        label = note_labels.get(note_type, "ℹ️ Информация")

        return f"> **{label}**\n> \n> {content}\n\n"

    elif block_type == "single_choice":
        question = block_dict.get("question", "")
        options = block_dict.get("options", [])
        correct_answer = block_dict.get("correct_answer")
        explanation = block_dict.get("explanation")

        result = f"**Вопрос:** {question}\n\n"
        for idx, option in enumerate(options):
            marker = (
                "✓" if correct_answer is not None and idx == correct_answer else "-"
            )
            result += f"{marker} {idx + 1}. {option}\n"
        result += "\n"
        if explanation and correct_answer is not None:
            result += f"*Пояснение: {explanation}*\n\n"
        return result

    elif block_type == "multiple_choice":
        question = block_dict.get("question", "")
        options = block_dict.get("options", [])
        correct_answers = block_dict.get("correct_answers", [])
        explanation = block_dict.get("explanation")

        result = f"**Вопрос:** {question}\n\n"
        for idx, option in enumerate(options):
            marker = (
                "✓" if correct_answers is not None and idx in correct_answers else "-"
            )
            result += f"{marker} {idx + 1}. {option}\n"
        result += "\n"
        if explanation and correct_answers is not None:
            result += f"*Пояснение: {explanation}*\n\n"
        return result

    return ""


def build_course_markdown(course, is_author: bool) -> tuple[str, str]:
    safe_filename = (
        "".join(c for c in course.name if c.isalnum() or c in (" ", "-", "_"))
        .strip()
        .replace(" ", "_")
    )

    parts: list[str] = []

    parts.append(f"# {course.name}\n")

    if course.description:
        parts.append(f"{course.description}\n")

    parts.append("---\n\n## Оглавление\n\n")

    for lesson in course.lessons:
        parts.append(f"{lesson.position + 1}. {lesson.name}\n")

    parts.append("\n")

    for lesson in course.lessons:
        parts.append("---\n\n")
        parts.append(f"## Урок {lesson.position + 1}: {lesson.name}\n\n")

        if lesson.description:
            parts.append(f"*{lesson.description}*\n\n")

        for block in lesson.blocks:
            block_dict = db_block_to_schema(block)

            if not is_author:
                if block_dict.get("type") == "single_choice":
                    block_dict.pop("correct_answer", None)
                    block_dict.pop("explanation", None)
                elif block_dict.get("type") == "multiple_choice":
                    block_dict.pop("correct_answers", None)
                    block_dict.pop("explanation", None)

            parts.append(render_block_to_markdown(block_dict))

    return "".join(parts), safe_filename


async def export_course_to_markdown(
    db: AsyncSession, course_id: int, user_id: int
) -> tuple[str, str]:
    """Экспортировать курс в Markdown"""
    # Проверка доступа
    await ensure_course_access(db, course_id, user_id, require_author=False)

    # Проверяем, является ли пользователь автором (для показа правильных ответов)
    is_author, _ = await check_course_access(
        db, course_id, user_id, require_author=True
    )

    course = await CourseDAO.get_by_id_with_lesson_blocks(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    markdown, safe_filename = await run_in_threadpool(
        build_course_markdown,
        course,
        is_author,
    )

    return markdown, safe_filename


async def export_course(
    db: AsyncSession, course_id: int, user_id: int
) -> tuple[bytes, str, str]:
    """
    Экспортировать курс в указанном формате

    Returns:
        tuple: (content_bytes, content_type, filename)
    """
    markdown_content, safe_filename = await export_course_to_markdown(
        db, course_id, user_id
    )

    content_bytes = markdown_content.encode("utf-8")
    content_type = "text/markdown; charset=utf-8"
    filename = f"{safe_filename}.md"

    return content_bytes, content_type, filename
