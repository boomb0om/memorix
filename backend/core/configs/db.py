from pydantic_settings import BaseSettings
from pydantic import Field
import os


class DBSettings(BaseSettings):
    database_uri: str = Field(
        default="postgresql://memorix:hackmemorix@localhost:5432/memorix_backend",
        env="DATABASE_URI"
    )


db_settings = DBSettings()