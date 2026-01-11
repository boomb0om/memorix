"""
Скрипт для изменения плана пользователя по email.
Использование: python -m scripts.change_user_plan <email> <plan>
Планы: free, testing
"""
import asyncio
import logging
import sys

from core.db.sqlalchemy import AsyncSessionLocal
from users.dao.users import UserDAO
from users.dao.models import UserPlan

logger = logging.getLogger(__name__)


async def change_user_plan(email: str, plan: str):
    """Изменить план пользователя по email"""
    async with AsyncSessionLocal() as session:
        try:
            # Валидация плана
            try:
                plan_enum = UserPlan(plan.lower())
            except ValueError:
                valid_plans = [p.value for p in UserPlan]
                logger.error(f"Неверный план: {plan}. Доступные планы: {', '.join(valid_plans)}")
                return False

            # Поиск пользователя по email
            user = await UserDAO.get_by_email(session, email)
            if not user:
                logger.error(f"Пользователь с email {email} не найден")
                return False

            # Обновление плана
            old_plan = user.plan.value
            await UserDAO.update(session, user.id, plan=plan_enum)
            logger.info(f"План пользователя {email} изменен с {old_plan} на {plan_enum.value}")
            return True

        except Exception as e:
            logger.error(f"Ошибка при изменении плана пользователя: {e}", exc_info=True)
            await session.rollback()
            return False


async def main():
    """Главная функция для запуска скрипта"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    if len(sys.argv) != 3:
        print("Использование: python -m scripts.change_user_plan <email> <plan>")
        print(f"Доступные планы: {', '.join([p.value for p in UserPlan])}")
        sys.exit(1)

    email = sys.argv[1]
    plan = sys.argv[2]

    try:
        success = await change_user_plan(email, plan)
        if success:
            print(f"План пользователя {email} успешно изменен на {plan}")
            sys.exit(0)
        else:
            print(f"Не удалось изменить план пользователя {email}")
            sys.exit(1)
    except Exception as e:
        print(f"Ошибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

