from typing import Literal
from pydantic_settings import BaseSettings
from pydantic import Field


class DeploymentSettings(BaseSettings):
    environment: Literal["dev", "prod"] = Field(
        default="dev",
        env="ENVIRONMENT"
    )


deployment_settings = DeploymentSettings()
