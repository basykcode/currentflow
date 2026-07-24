"""Versioned, checksum-protected Neo4j migration runner."""

from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path

from neo4j import AsyncDriver


@dataclass(frozen=True, slots=True)
class Migration:
    id: str
    checksum: str
    statements: tuple[str, ...]


def service_root() -> Path:
    return Path(__file__).resolve().parents[4]


def load_migrations(path: Path | None = None) -> list[Migration]:
    migration_path = path or service_root() / "migrations" / "neo4j"
    migrations: list[Migration] = []
    for file_path in sorted(migration_path.glob("*.cypher")):
        source = file_path.read_text(encoding="utf-8")
        statements = tuple(
            statement.strip() for statement in source.split(";") if statement.strip()
        )
        migrations.append(
            Migration(
                id=file_path.stem,
                checksum=sha256(source.encode("utf-8")).hexdigest(),
                statements=statements,
            )
        )
    return migrations


async def migrate(driver: AsyncDriver, database: str) -> list[str]:
    applied_now: list[str] = []
    async with driver.session(database=database) as session:
        for migration in load_migrations():
            result = await session.run(
                """
                MATCH (m:AlchemyMigration {id: $id})
                RETURN m.checksum AS checksum
                """,
                id=migration.id,
            )
            record = await result.single()
            if record is not None:
                existing = record["checksum"]
                if existing != migration.checksum:
                    raise RuntimeError(f"Applied migration {migration.id} has a different checksum")
                continue
            for statement in migration.statements:
                await (await session.run(statement)).consume()
            await (
                await session.run(
                    """
                    MERGE (m:AlchemyMigration {id: $id})
                    ON CREATE SET m.checksum = $checksum, m.applied_at = datetime()
                    """,
                    id=migration.id,
                    checksum=migration.checksum,
                )
            ).consume()
            applied_now.append(migration.id)
    return applied_now


async def applied_migrations(driver: AsyncDriver, database: str) -> dict[str, str]:
    async with driver.session(database=database) as session:
        result = await session.run(
            """
            MATCH (m:AlchemyMigration)
            RETURN m.id AS id, m.checksum AS checksum
            ORDER BY m.id
            """
        )
        records = await result.data()
    return {str(record["id"]): str(record["checksum"]) for record in records}
