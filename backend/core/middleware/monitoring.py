from fastapi import Request
from core.monitoring.requests import update_request_metrics_middleware, update_system_metrics


async def update_metrics_middleware(request: Request, call_next):
    response = await update_request_metrics_middleware(request, call_next)
    update_system_metrics()
    return response
