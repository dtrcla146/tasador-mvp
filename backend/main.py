import json
import sqlite3
import uuid
from fastapi.responses import FileResponse

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException

from datetime import datetime, timezone
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

ATTACHMENTS_DIR = Path(__file__).with_name("attachments")
MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
}

DB_PATH = Path(__file__).with_name("tasador.db")

app = FastAPI(title="Tasador MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

class Assessment(BaseModel):
    id: str
    createdAt: str
    updatedAt: str
    data: dict
    comparables: list[dict] = Field(default_factory=list)
    version: int = 0



def init_db():
    with sqlite3.connect(DB_PATH) as connection:
        # Conserva aquí el CREATE TABLE real de assessments.

        connection.execute("""
            CREATE TABLE IF NOT EXISTS attachments (
                id TEXT PRIMARY KEY,
                assessment_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                content_type TEXT,
                size INTEGER NOT NULL,
                storage_name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_attachments_assessment_id
            ON attachments (assessment_id)
        """)

        columns = {
            row[1]
            for row in connection.execute(
                "PRAGMA table_info(assessments)"
            ).fetchall()
        }

        if "version" not in columns:
            connection.execute("""
                ALTER TABLE assessments
                ADD COLUMN version INTEGER NOT NULL DEFAULT 1
            """)

init_db()


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/assessments")
def save_assessment(assessment: Assessment):
    item = assessment.model_dump()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("BEGIN IMMEDIATE")

        current = connection.execute(
            "SELECT version, created_at FROM assessments WHERE id = ?",
            (item["id"],),
        ).fetchone()

        if current is None:
            if item["version"] != 0:
                raise HTTPException(
                    status_code=409,
                    detail="La tasación ya cambió en el servidor.",
                )

            version = 1
            created_at = item["createdAt"]

            connection.execute(
                """
                INSERT INTO assessments
                    (id, created_at, updated_at, data, comparables, version)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    item["id"],
                    created_at,
                    item["updatedAt"],
                    json.dumps(item["data"], ensure_ascii=False),
                    json.dumps(item["comparables"], ensure_ascii=False),
                    version,
                ),
            )
        else:
            current_version, created_at = current

            if item["version"] != current_version:
                raise HTTPException(
                    status_code=409,
                    detail="La tasación cambió en el servidor. Se conservó la copia local.",
                )

            version = current_version + 1

            connection.execute(
                """
                UPDATE assessments
                SET updated_at = ?, data = ?, comparables = ?, version = ?
                WHERE id = ?
                """,
                (
                    item["updatedAt"],
                    json.dumps(item["data"], ensure_ascii=False),
                    json.dumps(item["comparables"], ensure_ascii=False),
                    version,
                    item["id"],
                ),
            )

    return {
        **item,
        "createdAt": created_at,
        "version": version,
    }

#Endpoint de borrado en FastAPI.
@app.delete("/assessments/{assessment_id}")
def delete_assessment(assessment_id: str):
    with sqlite3.connect(DB_PATH) as connection:
        attachment_rows = connection.execute(
            """
            SELECT storage_name
            FROM attachments
            WHERE assessment_id = ?
            """,
            (assessment_id,),
        ).fetchall()

        assessment = connection.execute(
            "SELECT id FROM assessments WHERE id = ?",
            (assessment_id,),
        ).fetchone()

        if assessment is None:
            return {"deleted": False}

        connection.execute(
            "DELETE FROM attachments WHERE assessment_id = ?",
            (assessment_id,),
        )
        connection.execute(
            "DELETE FROM assessments WHERE id = ?",
            (assessment_id,),
        )

    for (storage_name,) in attachment_rows:
        stored_path = ATTACHMENTS_DIR / Path(storage_name).name
        stored_path.unlink(missing_ok=True)

    return {"deleted": True}


@app.post("/assessments/{assessment_id}/attachments")
async def upload_assessment_attachment(
    assessment_id: str,
    attachment_id: str = Form(...),
    file: UploadFile = File(...),
):
    original_name = (file.filename or "archivo").replace("\\", "/").split("/")[-1]
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Tipo de archivo no permitido.")

    # Hace que un reintento después de una respuesta perdida no duplique el archivo.
    with sqlite3.connect(DB_PATH) as connection:
        existing = connection.execute(
            """
            SELECT assessment_id, file_name, content_type, size, created_at
            FROM attachments
            WHERE id = ?
            """,
            (attachment_id,),
        ).fetchone()

    if existing:
        if existing[0] != assessment_id:
            raise HTTPException(status_code=409, detail="ID de adjunto en conflicto.")

        return {
            "id": attachment_id,
            "assessmentId": existing[0],
            "name": existing[1],
            "type": existing[2],
            "size": existing[3],
            "createdAt": existing[4],
        }

    content = await file.read(MAX_ATTACHMENT_BYTES + 1)

    if len(content) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(status_code=413, detail="El archivo supera 25 MB.")

    ATTACHMENTS_DIR.mkdir(parents=True, exist_ok=True)
    storage_name = f"{uuid.uuid4().hex}{extension}"
    stored_path = ATTACHMENTS_DIR / storage_name
    stored_path.write_bytes(content)

    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(
                """
                INSERT INTO attachments
                    (id, assessment_id, file_name, content_type, size,
                    storage_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    attachment_id,
                    assessment_id,
                    original_name,
                    file.content_type,
                    len(content),
                    storage_name,
                    created_at,
                ),
            )
    except Exception:
        stored_path.unlink(missing_ok=True)
        raise

    return {
        "id": attachment_id,
        "assessmentId": assessment_id,
        "name": original_name,
        "type": file.content_type,
        "size": len(content),
        "createdAt": created_at,
    }

@app.delete("/assessments/{assessment_id}/attachments/{attachment_id}")
def delete_assessment_attachment(assessment_id: str, attachment_id: str):
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            """
            SELECT storage_name
            FROM attachments
            WHERE id = ? AND assessment_id = ?
            """,
            (attachment_id, assessment_id),
        ).fetchone()

        if row is None:
            return {"deleted": False}

        connection.execute(
            """
            DELETE FROM attachments
            WHERE id = ? AND assessment_id = ?
            """,
            (attachment_id, assessment_id),
        )

    stored_path = ATTACHMENTS_DIR / Path(row[0]).name
    stored_path.unlink(missing_ok=True)

    return {"deleted": True}


@app.get("/assessments")
def list_assessments():
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            """
            SELECT id, created_at, updated_at, data, comparables, version
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
            "version": row[5],
        }
        for row in rows
    ]

@app.get("/assessments/{assessment_id}/attachments")
def list_assessment_attachments(assessment_id: str):
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            """
            SELECT id, file_name, content_type, size, created_at
            FROM attachments
            WHERE assessment_id = ?
            ORDER BY created_at DESC
            """,
            (assessment_id,),
        ).fetchall()

    return [
        {
            "id": row[0],
            "assessmentId": assessment_id,
            "name": row[1],
            "type": row[2],
            "size": row[3],
            "createdAt": row[4],
            "downloadUrl": (
                f"/assessments/{assessment_id}/attachments/{row[0]}/file"
            ),
        }
        for row in rows
    ]


@app.get("/assessments/{assessment_id}/attachments/{attachment_id}/file")
def download_assessment_attachment(
    assessment_id: str,
    attachment_id: str,
):
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            """
            SELECT file_name, content_type, storage_name
            FROM attachments
            WHERE id = ? AND assessment_id = ?
            """,
            (attachment_id, assessment_id),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado.")

    file_name, content_type, storage_name = row
    stored_path = ATTACHMENTS_DIR / Path(storage_name).name

    if not stored_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="No se encontró el archivo almacenado.",
        )

    return FileResponse(
        path=stored_path,
        media_type=content_type or "application/octet-stream",
        filename=file_name,
    )


