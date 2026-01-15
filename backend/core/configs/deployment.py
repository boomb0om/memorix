from typing import Literal
from pydantic_settings import BaseSettings
from pydantic import Field


class DeploymentSettings(BaseSettings):
    environment: Literal["dev", "prod"] = Field(
        default="dev",
        env="ENVIRONMENT"
    )
    service_name: str = Field(
        default="backend",
        env="SERVICE_NAME"
    )


deployment_settings = DeploymentSettings()
