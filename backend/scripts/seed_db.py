"""
Seeder для базы данных.
Создает пользователя по умолчанию и курс с примерами уроков.
"""
import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from core.db.sqlalchemy import AsyncSessionLocal
from users.dao.users import UserDAO
from courses.dao.courses import CourseDAO
from courses.dao.lessons import LessonDAO
from core.auth.password import hash_password

logger = logging.getLogger(__name__)


async def seed_database():
    """Заполнить базу данных начальными данными"""
    async with AsyncSessionLocal() as session:
        try:
            # 1. Создаем пользователя по умолчанию, если его нет
            default_user = await UserDAO.get_by_username(session, "default")
            if not default_user:
                logger.info("Creating default user...")
                default_user = await UserDAO.create(
                    session,
                    email="default@memorix.local",
                    username="default",
                    hashed_password=hash_password("default123")
                )
                logger.info(f"Default user created with ID: {default_user.id}")
            else:
                logger.info(f"Default user already exists with ID: {default_user.id}")

            # 2. Создаем курс по умолчанию, если его нет
            default_course = await CourseDAO.get_by_name(session, "Default Course")
            if not default_course:
                logger.info("Creating default course...")
                default_course = await CourseDAO.create(
                    session,
                    name="Default Course",
                    description="Пример курса с демонстрационными уроками и блоками различных типов",
                    author_id=default_user.id
                )
                await session.commit()
                logger.info(f"Default course created with ID: {default_course.id}")

                # 3. Создаем примеры уроков
                await create_sample_lessons(session, default_course.id)
                await session.commit()
            else:
                logger.info(f"Default course already exists with ID: {default_course.id}")

            # 4. Даем всем пользователям доступ на чтение к курсу через публичный ACL
            await grant_public_access(session, default_course.id)
            await session.commit()

            logger.info("Database seeding completed successfully")
        except Exception as e:
            logger.error(f"Error during database seeding: {e}", exc_info=True)
            await session.rollback()
            raise


async def create_sample_lessons(session: AsyncSession, course_id: int):
    """Создать примеры уроков для курса"""
    logger.info("Creating sample lessons...")

    # Урок 1: Введение
    lesson1_blocks = [
        {
            "type": "theory",
            "title": "Добро пожаловать!",
            "content": "# Введение в курс\n\nЭто демонстрационный курс, который показывает различные типы блоков, доступных в системе.\n\nВы можете использовать этот курс как пример для создания своих собственных курсов."
        },
        {
            "type": "note",
            "note_type": "info",
            "content": "Это информационное сообщение. Вы можете использовать заметки для выделения важной информации."
        },
        {
            "type": "code",
            "title": "Пример кода",
            "code": "print('Hello, World!')\nprint('Добро пожаловать в Memorix!')",
            "language": "python",
            "explanation": "Это простой пример кода на Python"
        }
    ]

    await LessonDAO.create(
        session,
        course_id=course_id,
        position=0,
        name="Введение",
        description="Первый урок курса с примерами различных блоков",
        content={"blocks": lesson1_blocks}
    )

    # Урок 2: Теория и вопросы
    lesson2_blocks = [
        {
            "type": "theory",
            "title": "Основы программирования",
            "content": "## Переменные\n\nПеременные используются для хранения данных.\n\n```python\nx = 10\ny = \"Hello\"\n```\n\n## Типы данных\n\n- Числа (int, float)\n- Строки (str)\n- Списки (list)\n- Словари (dict)"
        },
        {
            "type": "code",
            "title": "Работа с переменными",
            "code": "# Пример работы с переменными\nname = \"Memorix\"\nage = 2024\nprint(f\"{name} создан в {age} году\")",
            "language": "python",
            "explanation": "Пример использования переменных и f-строк"
        },
        {
            "type": "single_choice",
            "question": "Что такое переменная?",
            "options": [
                "Контейнер для хранения данных",
                "Тип данных",
                "Функция",
                "Оператор"
            ],
            "correct_answer": 0,
            "explanation": "Переменная - это именованный контейнер для хранения данных в памяти."
        },
        {
            "type": "note",
            "note_type": "tip",
            "content": "Совет: используйте понятные имена для переменных, чтобы код был читаемым."
        }
    ]

    await LessonDAO.create(
        session,
        course_id=course_id,
        position=1,
        name="Основы программирования",
        description="Урок о переменных и типах данных",
        content={"blocks": lesson2_blocks}
    )

    # Урок 3: Вопросы с множественным выбором
    lesson3_blocks = [
        {
            "type": "theory",
            "title": "Управляющие конструкции",
            "content": "## Условные операторы\n\nУсловные операторы позволяют выполнять код в зависимости от условий.\n\n```python\nif x > 0:\n    print(\"Положительное\")\nelif x < 0:\n    print(\"Отрицательное\")\nelse:\n    print(\"Ноль\")\n```\n\n## Циклы\n\nЦиклы позволяют повторять выполнение кода."
        },
        {
            "type": "code",
            "title": "Пример цикла",
            "code": "# Цикл for\nfor i in range(5):\n    print(f\"Итерация {i}\")\n\n# Цикл while\ncount = 0\nwhile count < 3:\n    print(f\"Счет: {count}\")\n    count += 1",
            "language": "python",
            "explanation": "Примеры использования циклов for и while"
        },
        {
            "type": "multiple_choice",
            "question": "Какие из следующих операторов используются для управления потоком выполнения?",
            "options": [
                "if",
                "for",
                "while",
                "print"
            ],
            "correct_answers": [0, 1, 2],
            "explanation": "if, for и while - это управляющие конструкции. print - это функция для вывода."
        },
        {
            "type": "note",
            "note_type": "warning",
            "content": "Внимание: не забывайте об отступах в Python! Они определяют структуру кода."
        }
    ]

    await LessonDAO.create(
        session,
        course_id=course_id,
        position=2,
        name="Управляющие конструкции",
        description="Урок об условных операторах и циклах",
        content={"blocks": lesson3_blocks}
    )

    logger.info("Sample lessons created successfully")


async def grant_public_access(session: AsyncSession, course_id: int):
    """Дать всем пользователям доступ на чтение к курсу через групповой ACL"""
    logger.info("Granting public access to course...")
    
    # Получаем курс
    course = await CourseDAO.get_by_id(session, course_id)
    if not course:
        logger.warning(f"Course {course_id} not found, skipping ACL creation")
        return
    
    # Создаем групповой ACL (group = "all" означает доступ для всех пользователей)
    from courses.schema.acl import CourseACLRole, CourseACLGroup
    
    await CourseDAO.create_acl(
        session,
        course_id=course_id,
        role=CourseACLRole.VIEWER.value,
        group=CourseACLGroup.ALL.value  # "all" означает доступ для всех пользователей
    )
    
    logger.info(f"Public access (viewer) granted to course {course_id} for all users via group '{CourseACLGroup.ALL.value}'")


async def main():
    """Главная функция для запуска seeder"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        await seed_database()
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during database seeding: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())

