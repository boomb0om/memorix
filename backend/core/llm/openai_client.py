import time
from typing import Optional

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from prometheus_client import Counter, Histogram

from core.configs.deployment import deployment_settings


# Метрики для трекинга использования OpenAI API
OPENAI_REQUESTS_TOTAL = Counter(
    "openai_requests_total",
    "Total number of OpenAI API requests",
    ["service", "model", "status"],
)

OPENAI_TOKENS_USED = Counter(
    "openai_tokens_used_total",
    "Total number of tokens used",
    ["service", "model", "token_type"],  # token_type: prompt, completion, total
)

OPENAI_REQUEST_DURATION = Histogram(
    "openai_request_duration_seconds",
    "OpenAI API request duration in seconds",
    ["service", "model"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
)

OPENAI_REQUEST_ERRORS = Counter(
    "openai_request_errors_total",
    "Total number of OpenAI API errors",
    ["service", "model", "error_type"],
)


class MonitoredOpenAIClient:
    """OpenAI клиент с трекингом метрик использования."""

    def __init__(
        self,
        api_key: str,
        base_url: Optional[str] = None,
    ):
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        self.service_name = deployment_settings.service_name

    async def completions_create(
        self,
        model: str,
        messages: list[dict],
        **kwargs
    ) -> ChatCompletion:
        start_time = time.time()
        status = "success"
        error_type = None

        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                **kwargs
            )

            # Трекинг токенов
            usage = response.usage
            if usage:
                if usage.prompt_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=model,
                        token_type="prompt"
                    ).inc(usage.prompt_tokens)

                if usage.completion_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=model,
                        token_type="completion"
                    ).inc(usage.completion_tokens)

                if usage.total_tokens:
                    OPENAI_TOKENS_USED.labels(
                        service=self.service_name,
                        model=model,
                        token_type="total"
                    ).inc(usage.total_tokens)

            return response

        except Exception as e:
            status = "error"
            error_type = type(e).__name__
            OPENAI_REQUEST_ERRORS.labels(
                service=self.service_name,
                model=model,
                error_type=error_type
            ).inc()
            raise

        finally:
            # Трекинг количества запросов и латентности
            duration = time.time() - start_time
            OPENAI_REQUESTS_TOTAL.labels(
                service=self.service_name,
                model=model,
                status=status
            ).inc()
            OPENAI_REQUEST_DURATION.labels(
                service=self.service_name,
                model=model
            ).observe(duration)
