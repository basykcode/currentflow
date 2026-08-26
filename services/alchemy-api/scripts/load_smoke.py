"""Bounded read-only load smoke test for an Alchemy API deployment."""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
from dataclasses import asdict, dataclass
from time import perf_counter
from urllib.parse import urlparse

import httpx

_READ_ONLY_PATHS = (
    "/api/v1/health/live",
    "/api/v1/meta",
    "/api/v1/herbs?limit=5",
)


@dataclass(frozen=True)
class Result:
    path: str
    status: int | None
    duration_ms: float
    error: str | None = None


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(round((len(ordered) - 1) * percentile), len(ordered) - 1)
    return ordered[index]


async def _request(client: httpx.AsyncClient, path: str) -> Result:
    started = perf_counter()
    try:
        response = await client.get(path, headers={"Cache-Control": "no-cache"})
        return Result(
            path=path,
            status=response.status_code,
            duration_ms=round((perf_counter() - started) * 1000, 3),
        )
    except httpx.HTTPError as error:
        return Result(
            path=path,
            status=None,
            duration_ms=round((perf_counter() - started) * 1000, 3),
            error=type(error).__name__,
        )


async def run(base_url: str, requests_per_second: int, duration_seconds: int) -> int:
    total = requests_per_second * duration_seconds
    interval = 1 / requests_per_second
    results: list[Result] = []
    async with httpx.AsyncClient(base_url=base_url, timeout=20.0) as client:
        started = perf_counter()
        pending: set[asyncio.Task[Result]] = set()
        for index in range(total):
            due = started + (index * interval)
            await asyncio.sleep(max(0, due - perf_counter()))
            pending.add(asyncio.create_task(_request(client, _READ_ONLY_PATHS[index % 3])))
        for completed in asyncio.as_completed(pending):
            results.append(await completed)

    latencies = [result.duration_ms for result in results]
    failures = [result for result in results if result.status != 200]
    report = {
        "baseUrl": base_url,
        "requestsPerSecond": requests_per_second,
        "durationSeconds": duration_seconds,
        "requestCount": len(results),
        "failureCount": len(failures),
        "latencyMs": {
            "mean": round(statistics.fmean(latencies), 3) if latencies else 0,
            "p50": _percentile(latencies, 0.5),
            "p95": _percentile(latencies, 0.95),
            "max": max(latencies, default=0),
        },
        "failures": [asdict(result) for result in failures[:10]],
    }
    print(json.dumps(report, indent=2))
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--requests-per-second", type=int, choices=range(1, 51), default=2)
    parser.add_argument("--duration-seconds", type=int, choices=range(1, 301), default=10)
    parser.add_argument(
        "--allow-remote",
        action="store_true",
        help="Required before sending the bounded test to a non-local host.",
    )
    arguments = parser.parse_args()
    hostname = urlparse(arguments.base_url).hostname
    if hostname not in {"127.0.0.1", "localhost"} and not arguments.allow_remote:
        parser.error("--allow-remote is required for a non-local base URL")
    return asyncio.run(
        run(
            arguments.base_url.rstrip("/"),
            arguments.requests_per_second,
            arguments.duration_seconds,
        )
    )


if __name__ == "__main__":
    raise SystemExit(main())
