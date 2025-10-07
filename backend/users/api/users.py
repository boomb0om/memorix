from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from core.auth.tokens import create_tokens, get_current_user
from users.schema import UserCreate, UserLogin, UserResponse, Token, TokenRefresh
import users.service.users as user_service


router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    return await user_service.create_user(db, user)


@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate_user(db, user_credentials)
    access_token, refresh_token = create_tokens(data={"sub": user.email, "user_id": user.id})
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(token_data: TokenRefresh, db: AsyncSession = Depends(get_db)):
    try:
        new_access_token = await user_service.refresh_access_token(db, token_data.refresh_token)
        return {
            "access_token": new_access_token,
            "refresh_token": token_data.refresh_token,
            "token_type": "bearer"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return current_user
