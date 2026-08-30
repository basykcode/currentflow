"""Structured local logging without request bodies or secrets."""

import json
import logging
from datetime import UTC, datetime
from os import getpid

from current_alchemy.constants import SERVICE_NAME


class JsonFormatter(logging.Formatter):
    """Small JSON formatter for container-friendly local logs."""

    def __init__(self, *, environment: str, build_sha: str, instance_id: str) -> None:
        super().__init__()
        self._environment = environment
        self._build_sha = build_sha
        self._instance_id = instance_id

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "service": SERVICE_NAME,
            "environment": self._environment,
            "buildSha": self._build_sha,
            "instanceId": self._instance_id,
            "processId": getpid(),
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = getattr(record, "request_id", None)
        if isinstance(request_id, str):
            payload["requestId"] = request_id
        for attribute, key in (
            ("method", "method"),
            ("status_code", "statusCode"),
            ("duration_ms", "durationMs"),
            ("outcome", "outcome"),
            ("pool_size", "poolSize"),
            ("query_timeout_ms", "queryTimeoutMs"),
            ("connection_acquisition_timeout_ms", "connectionAcquisitionTimeoutMs"),
            ("endpoint_template", "endpointTemplate"),
            ("response_size", "responseSize"),
            ("cache_policy", "cachePolicy"),
            ("query_count", "queryCount"),
            ("neo4j_duration_ms", "neo4jDurationMs"),
            ("operation", "queryOperation"),
            ("record_count", "recordCount"),
            ("rate_class", "ratePolicyClass"),
        ):
            value = getattr(record, attribute, None)
            if isinstance(value, str | int | float):
                payload[key] = value
        if record.exc_info and record.exc_info[0] is not None:
            payload["exceptionType"] = record.exc_info[0].__name__
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(
    level: str,
    *,
    environment: str,
    build_sha: str,
    instance_id: str,
) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(
        JsonFormatter(
            environment=environment,
            build_sha=build_sha,
            instance_id=instance_id,
        )
    )
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
