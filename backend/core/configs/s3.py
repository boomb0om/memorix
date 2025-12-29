from pydantic_settings import BaseSettings, SettingsConfigDict


class S3Settings(BaseSettings):
    access_key: str
    secret_key: str
    bucket_name: str
    endpoint_url: str

    model_config = SettingsConfigDict(env_prefix="S3_")


s3_settings = S3Settings()