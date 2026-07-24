"""Consistent RFC 7807-inspired application errors."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from current_alchemy.domain.common.models import ApiModel


class ProblemError(ApiModel):
    location: list[str | int] = Field(default_factory=list)
    message: str
    error_type: str


class ProblemDetail(ApiModel):
    type: str
    title: str
    status: int
    code: str
    detail: str
    request_id: str
    errors: list[ProblemError] = Field(default_factory=list)


class ApiProblem(Exception):
    def __init__(
        self,
        *,
        status: int,
        code: str,
        title: str,
        detail: str,
        errors: list[ProblemError] | None = None,
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.code = code
        self.title = title
        self.detail = detail
        self.errors = errors or []


def _request_id(request: Request) -> str:
    value = getattr(request.state, "request_id", None)
    return value if isinstance(value, str) else "unavailable"


def _response(problem: ProblemDetail) -> JSONResponse:
    return JSONResponse(
        status_code=problem.status,
        content=problem.model_dump(mode="json", by_alias=True),
        media_type="application/problem+json",
        headers={"X-Request-ID": problem.request_id},
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiProblem)
    async def api_problem_handler(request: Request, exc: ApiProblem) -> JSONResponse:
        problem = ProblemDetail(
            type=f"https://current-flow.net/problems/{exc.code}",
            title=exc.title,
            status=exc.status,
            code=exc.code,
            detail=exc.detail,
            request_id=_request_id(request),
            errors=exc.errors,
        )
        return _response(problem)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            ProblemError(
                location=[
                    str(item) if not isinstance(item, int) else item for item in error["loc"]
                ],
                message=str(error["msg"]),
                error_type=str(error["type"]),
            )
            for error in exc.errors()
        ]
        return _response(
            ProblemDetail(
                type="https://current-flow.net/problems/validation-error",
                title="Request validation failed",
                status=422,
                code="validation_error",
                detail="One or more request fields are invalid.",
                request_id=_request_id(request),
                errors=errors,
            )
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code == 404 else "http_error"
        return _response(
            ProblemDetail(
                type=f"https://current-flow.net/problems/{code}",
                title="Resource not found" if exc.status_code == 404 else "HTTP error",
                status=exc.status_code,
                code=code,
                detail=str(exc.detail),
                request_id=_request_id(request),
            )
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
        del exc
        return _response(
            ProblemDetail(
                type="https://current-flow.net/problems/internal-error",
                title="Internal server error",
                status=500,
                code="internal_error",
                detail="The service could not complete the request.",
                request_id=_request_id(request),
            )
        )
