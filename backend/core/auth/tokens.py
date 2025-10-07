from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from users.dao import UserDAO
from users.schema import TokenData

from core.configs.auth import jwt_settings


security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=jwt_settings.access_token_expire_minutes)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, jwt_settings.secret_key, algorithm=jwt_settings.algorithm)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=jwt_settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, jwt_settings.refresh_secret_key, algorithm=jwt_settings.algorithm)
    return encoded_jwt


def create_tokens(data: dict) -> Tuple[str, str]:
    access_token_expires = timedelta(minutes=jwt_settings.access_token_expire_minutes)
    refresh_token_expires = timedelta(days=jwt_settings.refresh_token_expire_days)
    
    access_token = create_access_token(data, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(data, expires_delta=refresh_token_expires)
    
    return access_token, refresh_token


def verify_token(token: str, credentials_exception, token_type: str = "access"):
    try:
        secret_key = jwt_settings.secret_key if token_type == "access" else jwt_settings.refresh_secret_key
        
        payload = jwt.decode(token, secret_key, algorithms=[jwt_settings.algorithm])
        
        token_type_in_payload = payload.get("type")
        if token_type_in_payload != token_type:
            raise credentials_exception
            
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, token_type=token_type)
    except JWTError:
        raise credentials_exception
    return token_data


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    token_data = verify_token(token, credentials_exception, "access")
    
    user = await UserDAO.get_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def refresh_access_token(refresh_token: str, db: AsyncSession):
    """Обновляет access токен используя refresh токен"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(refresh_token, credentials_exception, "refresh")
    
    user = await UserDAO.get_by_email(db, token_data.email)
    if user is None:
        raise credentials_exception
    
    # Создаем новый access токен
    access_token_expires = timedelta(minutes=jwt_settings.access_token_expire_minutes)
    new_access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )
    
    return new_access_token
