import logging
from io import BytesIO
from typing import Literal
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from courses.dao import CourseDAO, LessonDAO
from courses.service.access_control import ensure_course_access, check_course_access
from courses.schema.blocks import db_block_to_schema

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


async def export_course_to_markdown(
    db: AsyncSession, course_id: int, user_id: int
) -> str:
    """Экспортировать курс в Markdown"""
    # Проверка доступа
    await ensure_course_access(db, course_id, user_id, require_author=False)

    # Проверяем, является ли пользователь автором (для показа правильных ответов)
    is_author, _ = await check_course_access(
        db, course_id, user_id, require_author=True
    )

    # Загружаем блоки для каждого урока
    from courses.dao.models import Course, Lesson

    result = await db.execute(
        select(Course)
        .where(Course.id == course_id)
        .options(selectinload(Course.lessons).selectinload(Lesson.blocks))
    )
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Начинаем формировать Markdown
    md_content = f"# {course.name}\n\n"

    if course.description:
        md_content += f"{course.description}\n\n"

    md_content += "---\n\n"
    md_content += "## Оглавление\n\n"

    # Оглавление
    for lesson in course.lessons:
        md_content += f"{lesson.position + 1}. {lesson.name}\n"
    md_content += "\n"

    # Содержимое уроков
    for lesson in course.lessons:
        md_content += "---\n\n"  # Page break для Markdown
        md_content += f"## Урок {lesson.position + 1}: {lesson.name}\n\n"

        if lesson.description:
            md_content += f"*{lesson.description}*\n\n"

        # Рендерим блоки
        for block in lesson.blocks:
            block_dict = db_block_to_schema(block)
            # Если пользователь не автор, скрываем правильные ответы
            if not is_author:
                if block_dict.get("type") == "single_choice":
                    block_dict.pop("correct_answer", None)
                    block_dict.pop("explanation", None)
                elif block_dict.get("type") == "multiple_choice":
                    block_dict.pop("correct_answers", None)
                    block_dict.pop("explanation", None)
            md_content += render_block_to_markdown(block_dict)

    return md_content


def markdown_to_pdf(markdown_content: str) -> bytes:
    """Конвертировать Markdown в PDF"""
    try:
        import markdown
        from weasyprint import HTML
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF generation requires 'markdown' and 'weasyprint' packages",
        )

    # Удаляем "---" из markdown, так как page break будет через CSS
    import re

    markdown_cleaned = re.sub(r"^---\s*$", "", markdown_content, flags=re.MULTILINE)

    # Конвертируем Markdown в HTML
    html_content = markdown.markdown(
        markdown_cleaned, extensions=["extra", "codehilite", "tables"]
    )

    # Добавляем page break перед каждым h2, который является заголовком урока
    # Находим все h2 с "Урок" и добавляем page break (кроме первого)
    lesson_headers = re.finditer(r"<h2>Урок \d+:", html_content)
    positions = [m.start() for m in lesson_headers]

    # Добавляем стиль page-break-before к каждому h2 урока (кроме первого)
    if len(positions) > 1:
        # Идем с конца, чтобы не сбить позиции
        for pos in reversed(positions[1:]):
            html_content = (
                html_content[: pos + 4]
                + ' style="page-break-before: always;"'
                + html_content[pos + 4 :]
            )

    # Добавляем базовые стили
    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            h1 {{
                color: #2c3e50;
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
            }}
            h2 {{
                color: #34495e;
                margin-top: 30px;
            }}
            h3 {{
                color: #555;
                margin-top: 20px;
            }}
            code {{
                background-color: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }}
            pre {{
                background-color: #f4f4f4;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
                page-break-inside: avoid;
            }}
            blockquote {{
                border-left: 4px solid #3498db;
                margin: 20px 0;
                padding: 10px 20px;
                background-color: #f8f9fa;
                page-break-inside: avoid;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """

    # Используем weasyprint для генерации PDF
    pdf_bytes = HTML(string=full_html).write_pdf()
    return pdf_bytes


async def export_course(
    db: AsyncSession, course_id: int, user_id: int, format: Literal["markdown", "pdf"]
) -> tuple[bytes, str, str]:
    """
    Экспортировать курс в указанном формате

    Returns:
        tuple: (content_bytes, content_type, filename)
    """
    # Генерируем Markdown
    markdown_content = await export_course_to_markdown(db, course_id, user_id)

    # Получаем название курса для имени файла
    course = await CourseDAO.get_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Очищаем название курса для имени файла
    safe_filename = "".join(
        c for c in course.name if c.isalnum() or c in (" ", "-", "_")
    ).strip()
    safe_filename = safe_filename.replace(" ", "_")

    if format == "markdown":
        content_bytes = markdown_content.encode("utf-8")
        content_type = "text/markdown; charset=utf-8"
        filename = f"{safe_filename}.md"
    elif format == "pdf":
        content_bytes = markdown_to_pdf(markdown_content)
        content_type = "application/pdf"
        filename = f"{safe_filename}.pdf"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")

    return content_bytes, content_type, filename
