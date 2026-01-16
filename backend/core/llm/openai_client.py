import time
from typing import Optional
from loguru import logger

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from prometheus_client import Counter, Histogram

from core.configs.deployment import deployment_settings
from core.configs.llm import LLMSettings, ModelProvider, MODEL_PROVIDER_DATA_MAP


# Метрики для трекинга использования OpenAI API
OPENAI_REQUESTS_TOTAL = Counter(
    "openai_requests_total",
    "Total number of OpenAI API requests",
    ["service", "model", "status", "task_type"],
)

OPENAI_TOKENS_USED = Counter(
    "openai_tokens_used_total",
    "Total number of tokens used",
    ["service", "model", "token_type", "task_type"],  # token_type: prompt, completion, total
)

OPENAI_REQUEST_DURATION = Histogram(
    "openai_request_duration_seconds",
    "OpenAI API request duration in seconds",
    ["service", "model", "task_type"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

OPENAI_REQUEST_ERRORS = Counter(
    "openai_request_errors_total",
    "Total number of OpenAI API errors",
    ["service", "model", "error_type", "task_type"],
)


class MonitoredOpenAIClient:
    """OpenAI клиент с трекингом метрик использования."""

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
        model_name: str = None,
    ):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        self.base_url = base_url
        self.model_name = model_name
        self.service_name = deployment_settings.service_name

    async def completions_create(
        self,
        messages: list[dict],
        log_task_type: str | None = None,
        **kwargs
    ) -> ChatCompletion:
        start_time = time.time()
        status = "success"
        error_type = None

        try:
            logger.info(f"Sending request to LLM provider {self.base_url}")
            start_time = time.time()
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                **kwargs
            )
            logger.info(f"Got response from LLM provider in {time.time() - start_time} seconds")
            
            # Трекинг токенов
            usage = response.usage
            if usage:
                if usage.prompt_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=self.model_name,
                        token_type="prompt",
                        task_type=log_task_type
                    ).inc(usage.prompt_tokens)

                if usage.completion_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=self.model_name,
                        token_type="completion",
                        task_type=log_task_type
                    ).inc(usage.completion_tokens)

                if usage.total_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=self.model_name,
                        token_type="total",
                        task_type=log_task_type
                    ).inc(usage.total_tokens)

            return response

        except Exception as e:
            status = "error"
            error_type = type(e).__name__
            OPENAI_REQUEST_ERRORS.labels(
                service=self.service_name,
                model=self.model_name,
                error_type=error_type,
                task_type=log_task_type
            ).inc()
            raise

        finally:
            # Трекинг количества запросов и латентности
            duration = time.time() - start_time
            OPENAI_REQUESTS_TOTAL.labels(
                service=self.service_name,
                model=self.model_name,
                status=status,
                task_type=log_task_type
            ).inc()
            OPENAI_REQUEST_DURATION.labels(
                service=self.service_name,
                model=self.model_name,
                task_type=log_task_type
            ).observe(duration)


def get_monitored_openai_client(config: LLMSettings) -> MonitoredOpenAIClient:
    model_provider_data = MODEL_PROVIDER_DATA_MAP[config.model_provider]
    if not config.api_key:
        raise ValueError("API key is required")
    return MonitoredOpenAIClient(
        api_key=config.api_key,
        base_url=model_provider_data.base_url,
        model_name=config.model_name or model_provider_data.default_model_name
    )
