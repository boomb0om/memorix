from sqlalchemy.ext.asyncio import AsyncSession
from users.dao import UserDAO
from users.schema import UserCreate, UserLogin
from core.auth.password import hash_password, verify_password, _FAKE_HASH
from core.auth.tokens import refresh_access_token as refresh_token
from fastapi import HTTPException, status


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def create_user(db: AsyncSession, user_data: UserCreate):
    email = normalize_email(user_data.email)
    # Проверяем, существует ли пользователь с таким email
    existing_user = await UserDAO.get_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Проверяем, существует ли пользователь с таким username
    existing_user = await UserDAO.get_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Создаем пользователя
    hashed_password = hash_password(user_data.password)
    return await UserDAO.create(
        db,
        email=email,
        username=user_data.username,
        hashed_password=hashed_password
    )


async def authenticate_user(db: AsyncSession, login_data: UserLogin):
    email = normalize_email(login_data.email)
    user = await UserDAO.get_by_email(db, email)

    if not user:
        # Сглаживание таймингов, если пользователя нет
        _ = verify_password(_FAKE_HASH, login_data.password)  # всегда False
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user.hashed_password, login_data.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return user


async def get_user_by_email(db: AsyncSession, email: str):
    return await UserDAO.get_by_email(db, email)


async def get_user_by_id(db: AsyncSession, user_id: int):
    return await UserDAO.get_by_id(db, user_id)


async def update_user(db: AsyncSession, user_id: int, **kwargs):
    return await UserDAO.update(db, user_id, **kwargs)


async def delete_user(db: AsyncSession, user_id: int):
    return await UserDAO.delete(db, user_id)


async def refresh_access_token(db: AsyncSession, refresh_token_str: str):
    return await refresh_token(refresh_token_str, db)
