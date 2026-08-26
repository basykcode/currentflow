"""Structured local logging without request bodies or secrets."""

import json
import logging
from datetime import UTC, datetime


class JsonFormatter(logging.Formatter):
    """Small JSON formatter for container-friendly local logs."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = getattr(record, "request_id", None)
        if isinstance(request_id, str):
            payload["requestId"] = request_id
        for attribute, key in (
            ("method", "method"),
            ("path", "path"),
            ("status_code", "statusCode"),
            ("duration_ms", "durationMs"),
            ("outcome", "outcome"),
            ("pool_size", "poolSize"),
            ("query_timeout_ms", "queryTimeoutMs"),
        ):
            value = getattr(record, attribute, None)
            if isinstance(value, str | int | float):
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
