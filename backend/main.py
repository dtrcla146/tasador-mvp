import json
import sqlite3
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware


DB_PATH = Path(__file__).with_name("tasador.db")

app = FastAPI(title="Tasador MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

class Assessment(BaseModel):
    id: str
    createdAt: str
    updatedAt: str
    data: dict
    comparables: list[dict] = Field(default_factory=list)


def init_db():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                data TEXT NOT NULL,
                comparables TEXT NOT NULL
            )
        """)


init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/assessments")
def save_assessment(assessment: Assessment):
    item = assessment.model_dump()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT INTO assessments (id, created_at, updated_at, data, comparables)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                created_at = excluded.created_at,
                updated_at = excluded.updated_at,
                data = excluded.data,
                comparables = excluded.comparables
            """,
            (
                item["id"],
                item["createdAt"],
                item["updatedAt"],
                json.dumps(item["data"], ensure_ascii=False),
                json.dumps(item["comparables"], ensure_ascii=False),
            ),
        )

    return item


@app.get("/assessments")
def list_assessments():
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            """
            SELECT id, created_at, updated_at, data, comparables
            FROM assessments
            ORDER BY updated_at DESC
            """
        ).fetchall()

    return [
        {
            "id": row[0],
            "createdAt": row[1],
            "updatedAt": row[2],
            "data": json.loads(row[3]),
            "comparables": json.loads(row[4]),
        }
        for row in rows
    ]
