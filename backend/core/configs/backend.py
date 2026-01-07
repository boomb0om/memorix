from pydantic_settings import BaseSettings
from pydantic import Field
import os


class BackendSettings(BaseSettings):
    max_file_size: int = Field(
        default=5 * 1024 * 1024,
        env="MAX_FILE_SIZE"
    )


backend_settings = BackendSettings()