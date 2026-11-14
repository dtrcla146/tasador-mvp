import json
import sqlite3
import uuid
import os
import jwt
from fastapi.responses import FileResponse

from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException

from datetime import datetime, timezone
from datetime import timedelta
from pwdlib import PasswordHash
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi import Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

ATTACHMENTS_DIR = Path(__file__).with_name("attachments")
MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
}

DB_PATH = Path(__file__).with_name("tasador.db")

SECRET_KEY = os.environ["TASADOR_SECRET_KEY"]
TOKEN_MINUTES = 30

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)

app = FastAPI(title="Tasador MVP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
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
            CREATE TABLE IF NOT EXISTS assessments (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL REFERENCES users(id),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                data TEXT NOT NULL,
                comparables TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1
            )
        """)
        #Con esto la base ya puede guardar usuarios y propietarios.

        connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        columns = {
            row[1]
            for row in connection.execute("PRAGMA table_info(assessments)").fetchall()
        }

        if "owner_id" not in columns:
            connection.execute("ALTER TABLE assessments ADD COLUMN owner_id TEXT")

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

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_assessments_owner_updated
            ON assessments (owner_id, updated_at DESC)
        """)

init_db()

SECRET_KEY = os.environ["TASADOR_SECRET_KEY"]
TOKEN_MINUTES = 30

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


class RegisterInput(BaseModel):
    email: str
    password: str = Field(min_length=12, max_length=128)


class LoginInput(BaseModel):
    email: str
    password: str


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autenticación requerida.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise unauthorized
    except jwt.InvalidTokenError:
        raise unauthorized

    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        user = connection.execute(
            "SELECT id, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    if user is None:
        raise unauthorized

    return dict(user)


@app.post("/auth/register")
def register_user(body: RegisterInput):
    user_id = str(uuid.uuid4())
    email = normalize_email(body.email)
    hashed = password_hash.hash(body.password)
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(
                """
                INSERT INTO users (id, email, password_hash, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, email, hashed, created_at),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="No se pudo crear la cuenta.",
        )

    return {"id": user_id, "email": email}


@app.post("/auth/login")
def login_user(body: LoginInput):
    email = normalize_email(body.email)

    with sqlite3.connect(DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        user = connection.execute(
            """
            SELECT id, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,),
        ).fetchone()

    if user is None or not password_hash.verify(
        body.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas.",
        )

    return {
        "access_token": create_access_token(user["id"]),
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
        },
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/assessments")
def save_assessment(
    assessment: Assessment,
    current_user: dict = Depends(get_current_user),
):
    item = assessment.model_dump()

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("BEGIN IMMEDIATE")

        current = connection.execute(
            """
            SELECT version, created_at
            FROM assessments
            WHERE id = ? AND owner_id = ?
            """,
            (item["id"], current_user["id"]),
        ).fetchone()

        if current is None:
            # Evita tomar como nueva una tasación cuyo ID ya pertenece a otro usuario.
            existing = connection.execute(
                "SELECT 1 FROM assessments WHERE id = ?",
                (item["id"],),
            ).fetchone()
            if existing is not None:
                raise HTTPException(status_code=404, detail="Tasación no encontrada.")

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
                    (id, owner_id, created_at, updated_at, data, comparables, version)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["id"],
                    current_user["id"],
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
                WHERE id = ? AND owner_id = ?
                """,
                (
                    item["updatedAt"],
                    json.dumps(item["data"], ensure_ascii=False),
                    json.dumps(item["comparables"], ensure_ascii=False),
                    version,
                    item["id"],
                    current_user["id"],
                ),
            )

    return {
        **item,
        "createdAt": created_at,
        "version": version,
    }


@app.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: str,
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("BEGIN IMMEDIATE")

        assessment = connection.execute(
            "SELECT id FROM assessments WHERE id = ? AND owner_id = ?",
            (assessment_id, current_user["id"]),
        ).fetchone()

        if assessment is None:
            raise HTTPException(status_code=404, detail="Tasación no encontrada.")

        attachment_rows = connection.execute(
            """
            SELECT a.storage_name
            FROM attachments AS a
            JOIN assessments AS s ON s.id = a.assessment_id
            WHERE a.assessment_id = ? AND s.owner_id = ?
            """,
            (assessment_id, current_user["id"]),
        ).fetchall()

        connection.execute(
            """
            DELETE FROM attachments
            WHERE assessment_id = ?
              AND assessment_id IN (
                  SELECT id FROM assessments WHERE owner_id = ?
              )
            """,
            (assessment_id, current_user["id"]),
        )
        connection.execute(
            "DELETE FROM assessments WHERE id = ? AND owner_id = ?",
            (assessment_id, current_user["id"]),
        )

    for (storage_name,) in attachment_rows:
        (ATTACHMENTS_DIR / Path(storage_name).name).unlink(missing_ok=True)

    return {"deleted": True}


@app.post("/assessments/{assessment_id}/attachments")
async def upload_assessment_attachment(
    assessment_id: str,
    attachment_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        owned = connection.execute(
            "SELECT 1 FROM assessments WHERE id = ? AND owner_id = ?",
            (assessment_id, current_user["id"]),
        ).fetchone()

    if owned is None:
        raise HTTPException(status_code=404, detail="Tasación no encontrada.")

    original_name = (file.filename or "archivo").replace("\\", "/").split("/")[-1]
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Tipo de archivo no permitido.")

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
            # Recomprueba la propiedad al insertar para reducir el riesgo de una
            # eliminación concurrente de la tasación.
            owned = connection.execute(
                "SELECT 1 FROM assessments WHERE id = ? AND owner_id = ?",
                (assessment_id, current_user["id"]),
            ).fetchone()
            if owned is None:
                raise HTTPException(status_code=404, detail="Tasación no encontrada.")

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
def delete_assessment_attachment(
    assessment_id: str,
    attachment_id: str,
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("BEGIN IMMEDIATE")
        row = connection.execute(
            """
            SELECT a.storage_name
            FROM attachments AS a
            JOIN assessments AS s ON s.id = a.assessment_id
            WHERE a.id = ?
              AND a.assessment_id = ?
              AND s.owner_id = ?
            """,
            (attachment_id, assessment_id, current_user["id"]),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Adjunto no encontrado.")

        connection.execute(
            "DELETE FROM attachments WHERE id = ? AND assessment_id = ?",
            (attachment_id, assessment_id),
        )

    (ATTACHMENTS_DIR / Path(row[0]).name).unlink(missing_ok=True)
    return {"deleted": True}


@app.get("/assessments")
def list_assessments(
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            """
            SELECT id, created_at, updated_at, data, comparables, version
            FROM assessments
            WHERE owner_id = ?
            ORDER BY updated_at DESC
            """,
            (current_user["id"],),
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
def list_assessment_attachments(
    assessment_id: str,
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            """
            SELECT a.id, a.file_name, a.content_type, a.size, a.created_at
            FROM attachments AS a
            JOIN assessments AS s ON s.id = a.assessment_id
            WHERE a.assessment_id = ? AND s.owner_id = ?
            ORDER BY a.created_at DESC
            """,
            (assessment_id, current_user["id"]),
        ).fetchall()

    # Distingue una tasación propia sin adjuntos de una ajena o inexistente.
    if not rows:
        with sqlite3.connect(DB_PATH) as connection:
            owned = connection.execute(
                "SELECT 1 FROM assessments WHERE id = ? AND owner_id = ?",
                (assessment_id, current_user["id"]),
            ).fetchone()
        if owned is None:
            raise HTTPException(status_code=404, detail="Tasación no encontrada.")

    return [
        {
            "id": row[0],
            "assessmentId": assessment_id,
            "name": row[1],
            "type": row[2],
            "size": row[3],
            "createdAt": row[4],
            "downloadUrl": f"/assessments/{assessment_id}/attachments/{row[0]}/file",
        }
        for row in rows
    ]


@app.get("/assessments/{assessment_id}/attachments/{attachment_id}/file")
def download_assessment_attachment(
    assessment_id: str,
    attachment_id: str,
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            """
            SELECT a.file_name, a.content_type, a.storage_name
            FROM attachments AS a
            JOIN assessments AS s ON s.id = a.assessment_id
            WHERE a.id = ?
              AND a.assessment_id = ?
              AND s.owner_id = ?
            """,
            (attachment_id, assessment_id, current_user["id"]),
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
