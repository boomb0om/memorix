from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from users.dao.models import User


class UserDAO:

    @classmethod
    async def get_by_email(cls, session: AsyncSession, email: str) -> User:
        result = await session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_username(cls, session: AsyncSession, username: str) -> User:
        result = await session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @classmethod
    async def get_by_id(cls, session: AsyncSession, user_id: int) -> User:
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @classmethod
    async def create(cls, session: AsyncSession, email: str, username: str, hashed_password: str) -> User:
        db_user = User(
            email=email,
            username=username,
            hashed_password=hashed_password
        )
        session.add(db_user)
        await session.commit()
        await session.refresh(db_user)
        return db_user

    @classmethod
    async def update(cls, session: AsyncSession, user_id: int, **kwargs) -> User:
        stmt = update(User).where(User.id == user_id).values(**kwargs)
        await session.execute(stmt)
        await session.commit()
        return await cls.get_by_id(session, user_id)

    @classmethod
    async def delete(cls, session: AsyncSession, user_id: int) -> bool:
        stmt = delete(User).where(User.id == user_id)
        await session.execute(stmt)
        await session.commit()
        return True

    @classmethod
    async def get_all(cls, session: AsyncSession) -> list[User]:
        """Получить всех пользователей"""
        result = await session.execute(select(User))
        return list(result.scalars().all())
