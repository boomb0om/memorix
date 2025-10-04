from pydantic import Field
from pydantic_settings import BaseSettings


class JWTSettings(BaseSettings):
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    algorithm: str = Field(
        default="HS256",
        env="ALGORITHM"
    )
    access_token_expire_minutes: int = Field(
        default=30,
        env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    refresh_token_expire_days: int = Field(
        default=7,
        env="REFRESH_TOKEN_EXPIRE_DAYS"
    )
    refresh_secret_key: str = Field(
        default="your-refresh-secret-key-change-in-production",
        env="REFRESH_SECRET_KEY"
    )


class PasswordSettings(BaseSettings):
    time_cost: int = Field(
        default=3,
        env="PWD_TIME_COST"
    )
    memory_cost: int = Field(
        default=65536,
        env="PWD_MEMORY_COST"
    )
    pepper: str = Field(
        default="pepper",
        env="PWD_PEPPER"
    )


password_settings = PasswordSettings()
jwt_settings = JWTSettings()