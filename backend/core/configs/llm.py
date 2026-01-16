from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, BaseModel
from enum import Enum


class ModelProvider(Enum):
    MISTRAL = "mistral"
    DEEPSEEK = "deepseek"
    AITUNNEL = "aitunnel"


class ModelProviderData(BaseModel):
    base_url: str
    default_model_name: str


MODEL_PROVIDER_DATA_MAP: dict[ModelProvider, ModelProviderData] = {
    ModelProvider.MISTRAL: ModelProviderData(
        base_url="https://api.mistral.ai/v1",
        default_model_name="mistral-large-latest"
    ),
    ModelProvider.DEEPSEEK: ModelProviderData(
        base_url="https://api.deepseek.com/v1",
        default_model_name="deepseek-chat"
    ),
    ModelProvider.AITUNNEL: ModelProviderData(
        base_url="https://api.aitunnel.ru/v1/",
        default_model_name="gemini-3-flash-preview"
    ),
}


class LLMSettings(BaseSettings):
    model_provider: ModelProvider = Field(default=ModelProvider.MISTRAL)
    model_name: str = Field(default=None)
    api_key: str = Field(default=None)

    model_config = SettingsConfigDict(env_prefix="LLM_")


llm_settings = LLMSettings()
