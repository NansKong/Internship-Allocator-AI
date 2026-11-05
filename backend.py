import hmac
import json
import os
import secrets
import sqlite3
from contextlib import closing
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator
from starlette.responses import JSONResponse

from allocator import allocate

app = FastAPI(title="AllocateAI Operations API", docs_url=None, redoc_url=None)
database = Path(os.getenv("ALLOCATEAI_DB", "data/rounds.sqlite3"))
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Count = Annotated[int, Field(strict=True, ge=0, le=100000)]
Score = Annotated[int, Field(strict=True, ge=-1000000, le=1000000)]


class Match(BaseModel):
    model_config = ConfigDict(extra="forbid")
    candidate: Name
    opportunity: Name
    score: Score
    groups: list[Name] = Field(max_length=32)


class Scenario(BaseModel):
    model_config = ConfigDict(extra="forbid")
    capacities: dict[Name, Count] = Field(max_length=300)
    minimums: dict[Name, Count] = Field(max_length=100)
    eligible_matches: list[Match] = Field(max_length=3000)

    @model_validator(mode="after")
    def check_matches(self):
        keys = set()
        for match in self.eligible_matches:
            key = (match.candidate, match.opportunity)
            if key in keys or match.opportunity not in self.capacities:
                raise ValueError("Matches must be unique and reference an existing opportunity.")
            keys.add(key)
        return self


@app.middleware("http")
async def protect_requests(request: Request, call_next):
    if request.method == "POST":
        length = request.headers.get("content-length", "")
        if not length.isdecimal() or not 0 < int(length) <= 2_000_000:
            return JSONResponse({"error": "Provide a scenario under 2 MB."}, status_code=413)
        if request.headers.get("content-type", "").split(";")[0] != "application/json":
            return JSONResponse({"error": "Send the scenario as JSON."}, status_code=415)
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


def authorize(authorization: str = Header(default="")):
    token = os.getenv("ALLOCATEAI_TOKEN", "")
    if len(token) < 24:
        raise HTTPException(503, "The operator credential is not configured.")
    if not hmac.compare_digest(authorization.encode(), ("Bearer " + token).encode()):
        raise HTTPException(401, "Enter a valid operator access token.")


def connect():
    database.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(database, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("""
        CREATE TABLE IF NOT EXISTS rounds (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
            scenario TEXT NOT NULL,
            result TEXT NOT NULL
        )
    """)
    return connection


@app.post("/api/allocate", dependencies=[Depends(authorize)], status_code=201)
def run_round(scenario: Scenario):
    payload = scenario.model_dump()
    result = allocate(**payload)
    round_id = secrets.token_hex(12)
    with closing(connect()) as connection, connection:
        connection.execute("INSERT INTO rounds (id, scenario, result) VALUES (?, ?, ?)",
                           (round_id, json.dumps(payload), json.dumps(result)))
    return {"id": round_id, **result}


@app.get("/api/rounds", dependencies=[Depends(authorize)])
def list_rounds():
    with closing(connect()) as connection:
        rows = connection.execute(
            "SELECT id, created_at, result FROM rounds ORDER BY created_at DESC, rowid DESC LIMIT 25"
        ).fetchall()
    return [{"id": row["id"], "created_at": row["created_at"], **json.loads(row["result"])}
            for row in rows]
