import time

import psutil
from cachetools import TTLCache, cached
from fastapi import Request
from prometheus_client import Counter, Gauge, Histogram, start_http_server
from core.configs.deployment import deployment_settings as config


REQUEST_COUNT = Counter(
    f"backend_request_total",
    "Total HTTP Requests",
    ["service", "method", "status", "path"],
)
REQUEST_LATENCY = Histogram(
    f"backend_request_duration_seconds",
    "HTTP Request Duration",
    ["service", "method", "status", "path"],
)
REQUEST_IN_PROGRESS = Gauge(
    f"backend_requests_in_progress",
    "HTTP Requests in progress",
    ["service", "method", "path"],
)
CPU_USAGE = Gauge(
    "process_cpu_usage", 
    "Current CPU usage in percent",
    ["service"]
)
MEMORY_USAGE = Gauge(
    "process_memory_usage_bytes", 
    "Current memory usage in bytes",
    ["service"]
)


async def update_request_metrics_middleware(request: Request, call_next):
    method = request.method
    path = request.url.path
    REQUEST_IN_PROGRESS.labels(service=config.service_name, method=method, path=path).inc()
    try:
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time
        status = response.status_code
        REQUEST_COUNT.labels(service=config.service_name, method=method, status=status, path=path).inc()
        REQUEST_LATENCY.labels(service=config.service_name, method=method, status=status, path=path).observe(
            duration
        )
        return response
    finally:
        REQUEST_IN_PROGRESS.labels(service=config.service_name, method=method, path=path).dec()


@cached(cache=TTLCache(maxsize=1, ttl=1))
def update_system_metrics():
    CPU_USAGE.labels(service=config.service_name).set(psutil.cpu_percent())
    MEMORY_USAGE.labels(service=config.service_name).set(psutil.Process().memory_info().rss)


def start_metrics_server(port: int = 9200):
    start_http_server(port)
