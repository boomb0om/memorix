from fastapi import Request, status
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from core.configs.auth import jwt_settings
from datetime import datetime, timezone


async def auth_middleware(request: Request, call_next):
    """Middleware для автоматической проверки токенов"""
    
    # Пропускаем публичные endpoints
    public_paths = ["/", "/api/users/login", "/api/users/register", "/api/docs", "/docs", "/openapi.json", "/api/users/refresh", "/metrics"]
    if request.url.path in public_paths:
        response = await call_next(request)
        return response
    
    # Проверяем наличие токена
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Missing or invalid authorization header"},
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Проверяем токен
        payload = jwt.decode(token, jwt_settings.secret_key, algorithms=[jwt_settings.algorithm])
        
        # Проверяем тип токена
        if payload.get("type") != "access":
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid token type"}
            )
        
        # Проверяем срок действия
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token expired", "code": "TOKEN_EXPIRED"}
            )
        
        # Добавляем информацию о пользователе в request state
        request.state.user_email = payload.get("sub")
        request.state.user_id = payload.get("user_id")
        
        # Проверяем наличие user_id
        if not request.state.user_id:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid token: missing user_id"}
            )
        
    except JWTError:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid token"}
        )
    
    response = await call_next(request)
    return response
