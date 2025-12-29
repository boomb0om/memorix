from pydantic_settings import BaseSettings, SettingsConfigDict


class JWTSettings(BaseSettings):
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    refresh_secret_key: str = "your-refresh-secret-key-change-in-production"

    model_config = SettingsConfigDict(env_prefix="JWT_")


class PasswordSettings(BaseSettings):
    time_cost: int = 3
    memory_cost: int = 65536
    pepper: str = "pepper"

    model_config = SettingsConfigDict(env_prefix="PWD_")


jwt_settings = JWTSettings()
password_settings = PasswordSettings()