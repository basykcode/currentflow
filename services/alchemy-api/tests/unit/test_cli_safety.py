from typer.testing import CliRunner

from current_alchemy.cli.main import app
from current_alchemy.config import get_settings


def test_demo_reset_refuses_production_even_with_confirmation() -> None:
    get_settings.cache_clear()
    result = CliRunner().invoke(
        app,
        ["db", "reset-demo", "--confirm-reset-demo"],
        env={
            "ALCHEMY_ENV": "production",
            "ALCHEMY_ALLOWED_ORIGINS": '["https://current-flow.net"]',
            "NEO4J_URI": "bolt://production.invalid:7687",
            "NEO4J_USERNAME": "neo4j",
            "NEO4J_PASSWORD": "test-only",
            "PUBCHEM_USER_AGENT": "CurrentAlchemy-tests/0.1",
        },
    )
    assert result.exit_code == 2
    assert "forbidden in production" in result.output


def test_demo_reset_requires_explicit_confirmation() -> None:
    get_settings.cache_clear()
    result = CliRunner().invoke(
        app,
        ["db", "reset-demo"],
        env={
            "ALCHEMY_ENV": "development",
            "NEO4J_URI": "bolt://test.invalid:7687",
            "NEO4J_USERNAME": "neo4j",
            "NEO4J_PASSWORD": "test-only",
            "PUBCHEM_USER_AGENT": "CurrentAlchemy-tests/0.1",
        },
    )
    assert result.exit_code == 2
    assert "--confirm-reset-demo" in result.output
