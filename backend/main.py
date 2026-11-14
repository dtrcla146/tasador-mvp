import json
import sqlite3
import uuid
import os
import jwt
import statistics
import urllib.request
from fastapi.responses import FileResponse

from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone, timedelta
from pwdlib import PasswordHash
from fastapi import Depends, Query, status
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
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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
                first_name TEXT NOT NULL DEFAULT '',
                middle_name TEXT NOT NULL DEFAULT '',
                last_name TEXT NOT NULL DEFAULT '',
                second_last_name TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)

        user_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(users)").fetchall()
        }
        for column in ("first_name", "middle_name", "last_name", "second_last_name"):
            if column not in user_columns:
                connection.execute(
                    f"ALTER TABLE users ADD COLUMN {column} TEXT NOT NULL DEFAULT ''"
                )

        connection.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                owner_id TEXT PRIMARY KEY REFERENCES users(id),
                manual_uf_value REAL,
                default_fee_uf REAL NOT NULL DEFAULT 0,
                deadline_mode TEXT NOT NULL DEFAULT 'days',
                default_deadline_days INTEGER NOT NULL DEFAULT 10,
                image_quality REAL NOT NULL DEFAULT 0.65
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS assessment_events (
                id TEXT PRIMARY KEY,
                owner_id TEXT NOT NULL,
                assessment_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                from_status TEXT,
                to_status TEXT,
                occurred_at TEXT NOT NULL,
                reason TEXT,
                due_date TEXT,
                on_time INTEGER,
                fee_uf REAL
            )
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_assessment_events_owner_time
            ON assessment_events (owner_id, occurred_at)
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
        connection.execute("""
            INSERT INTO assessment_events
                (id, owner_id, assessment_id, event_type, to_status, occurred_at)
            SELECT lower(hex(randomblob(16))), a.owner_id, a.id, 'created',
                   json_extract(a.data, '$.status'), a.created_at
            FROM assessments AS a
            WHERE a.owner_id IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM assessment_events AS e
                  WHERE e.owner_id = a.owner_id
                    AND e.assessment_id = a.id
                    AND e.event_type = 'created'
              )
        """)

init_db()

SECRET_KEY = os.environ["TASADOR_SECRET_KEY"]
TOKEN_MINUTES = 30

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


class RegisterInput(BaseModel):
    email: str
    password: str = Field(min_length=12, max_length=128)
    firstName: str = Field(min_length=1, max_length=100)
    middleName: str = Field(default="", max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    secondLastName: str = Field(default="", max_length=100)


class LoginInput(BaseModel):
    email: str
    password: str


class UserSettingsInput(BaseModel):
    manualUfValue: float | None = Field(default=None, gt=0)
    defaultFeeUf: float = Field(default=0, ge=0, le=100000)
    deadlineMode: str = Field(default="days", pattern="^(days|manual)$")
    defaultDeadlineDays: int = Field(default=10, ge=1, le=365)
    imageQuality: float = Field(default=0.65, ge=0.1, le=0.95)


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


def insert_assessment_event(
    connection,
    owner_id: str,
    assessment_id: str,
    event_type: str,
    *,
    from_status: str | None = None,
    to_status: str | None = None,
    reason: str | None = None,
    due_date: str | None = None,
    on_time: bool | None = None,
    fee_uf: float | None = None,
):
    connection.execute(
        """
        INSERT INTO assessment_events
            (id, owner_id, assessment_id, event_type, from_status, to_status,
             occurred_at, reason, due_date, on_time, fee_uf)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            owner_id,
            assessment_id,
            event_type,
            from_status,
            to_status,
            datetime.now(timezone.utc).isoformat(),
            reason,
            due_date,
            None if on_time is None else int(on_time),
            fee_uf,
        ),
    )


def assessment_deadline(data: dict, created_at: str) -> str | None:
    if data.get("deadlineMode") == "manual":
        return data.get("dueDate") or None

    try:
        days = int(data.get("deadlineDays", 0))
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None

    if days <= 0:
        return None
    return (created.date() + timedelta(days=days)).isoformat()


def insert_delivery_event(
    connection, owner_id: str, assessment_id: str, data: dict, created_at: str
):
    now = datetime.now(timezone.utc)
    due_date = assessment_deadline(data, created_at)
    on_time = None
    if due_date:
        on_time = now.date().isoformat() <= due_date

    connection.execute(
        """
        INSERT INTO assessment_events
            (id, owner_id, assessment_id, event_type, to_status, occurred_at,
             due_date, on_time, fee_uf)
        VALUES (?, ?, ?, 'delivered', 'entregada', ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            owner_id,
            assessment_id,
            now.isoformat(),
            due_date,
            None if on_time is None else int(on_time),
            float(data.get("feeUf") or 0),
        ),
    )


@app.post("/auth/register")
def register_user(body: RegisterInput):
    user_id = str(uuid.uuid4())
    email = normalize_email(body.email)
    first_name = body.firstName.strip()
    middle_name = body.middleName.strip()
    last_name = body.lastName.strip()
    second_last_name = body.secondLastName.strip()
    if not first_name or not last_name:
        raise HTTPException(status_code=422, detail="Nombre y primer apellido son obligatorios.")
    hashed = password_hash.hash(body.password)
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute(
                """
                INSERT INTO users
                    (id, email, password_hash, first_name, middle_name,
                     last_name, second_last_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    email,
                    hashed,
                    first_name,
                    middle_name,
                    last_name,
                    second_last_name,
                    created_at,
                ),
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
            SELECT id, email, password_hash, first_name, middle_name,
                   last_name, second_last_name
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
            "firstName": user["first_name"],
            "middleName": user["middle_name"],
            "lastName": user["last_name"],
            "secondLastName": user["second_last_name"],
        },
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/settings")
def get_user_settings(current_user: dict = Depends(get_current_user)):
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            """
            SELECT manual_uf_value, default_fee_uf, deadline_mode,
                   default_deadline_days, image_quality
            FROM user_settings
            WHERE owner_id = ?
            """,
            (current_user["id"],),
        ).fetchone()

    if row is None:
        return UserSettingsInput().model_dump()
    return {
        "manualUfValue": row[0],
        "defaultFeeUf": row[1],
        "deadlineMode": row[2],
        "defaultDeadlineDays": row[3],
        "imageQuality": row[4],
    }


@app.put("/settings")
def update_user_settings(
    body: UserSettingsInput,
    current_user: dict = Depends(get_current_user),
):
    settings = body.model_dump()
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT INTO user_settings
                (owner_id, manual_uf_value, default_fee_uf, deadline_mode,
                 default_deadline_days, image_quality)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(owner_id) DO UPDATE SET
                manual_uf_value = excluded.manual_uf_value,
                default_fee_uf = excluded.default_fee_uf,
                deadline_mode = excluded.deadline_mode,
                default_deadline_days = excluded.default_deadline_days,
                image_quality = excluded.image_quality
            """,
            (
                current_user["id"],
                settings["manualUfValue"],
                settings["defaultFeeUf"],
                settings["deadlineMode"],
                settings["defaultDeadlineDays"],
                settings["imageQuality"],
            ),
        )
    return settings


@app.get("/settings/uf-average")
def get_previous_month_uf_average(
    current_user: dict = Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()
    year = today.year if today.month > 1 else today.year - 1
    month = today.month - 1 if today.month > 1 else 12
    month_key = f"{year:04d}-{month:02d}"
    url = f"https://mindicador.cl/api/uf/{year}"

    try:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "TasadorMVP/1.1 (local valuation app)"},
        )
        with urllib.request.urlopen(request, timeout=8) as response:
            indicator = json.loads(response.read())
        values = [
            float(item["valor"])
            for item in indicator.get("serie", [])
            if item.get("fecha", "").startswith(month_key)
            and isinstance(item.get("valor"), (int, float))
        ]
    except (OSError, ValueError, KeyError) as error:
        raise HTTPException(
            status_code=503,
            detail="No se pudo consultar la serie de UF de mindicador.cl; ingresa el valor manualmente.",
        ) from error

    if not values:
        raise HTTPException(
            status_code=503,
            detail=f"No hay datos de UF disponibles para {month_key}.",
        )

    return {
        "month": month_key,
        "average": round(statistics.mean(values), 2),
        "daysIncluded": len(values),
        "source": "mindicador.cl",
    }


@app.get("/dashboard/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    with sqlite3.connect(DB_PATH) as connection:
        rows = connection.execute(
            "SELECT id, created_at, data FROM assessments WHERE owner_id = ?",
            (current_user["id"],),
        ).fetchall()
        events = connection.execute(
            """
            SELECT event_type, reason, on_time, fee_uf, occurred_at
            FROM assessment_events
            WHERE owner_id = ?
            """,
            (current_user["id"],),
        ).fetchall()

    status_counts = {}
    pending_fee_uf = 0.0
    paid_fee_uf = 0.0
    for _assessment_id, _created_at, data_text in rows:
        data = json.loads(data_text)
        current_status = data.get("status", "pendiente")
        status_counts[current_status] = status_counts.get(current_status, 0) + 1
        if current_status == "entregada" and data.get("paymentStatus") != "paid":
            pending_fee_uf += float(data.get("feeUf") or 0)
        elif current_status == "entregada":
            paid_fee_uf += float(data.get("feeUf") or 0)

    event_counts = {}
    deleted_reasons = {}
    on_time_count = 0
    late_count = 0
    no_deadline_count = 0
    for event_type, reason, on_time, _fee_uf, _occurred_at in events:
        event_counts[event_type] = event_counts.get(event_type, 0) + 1
        if event_type == "deleted":
            normalized_reason = reason or "Sin motivo especificado"
            deleted_reasons[normalized_reason] = (
                deleted_reasons.get(normalized_reason, 0) + 1
            )
        if event_type == "delivered":
            if on_time is None:
                no_deadline_count += 1
            elif on_time:
                on_time_count += 1
            else:
                late_count += 1

    return {
        "statusCounts": status_counts,
        "createdCount": event_counts.get("created", 0),
        "deletedCount": event_counts.get("deleted", 0),
        "deletedReasons": deleted_reasons,
        "deliveredCount": event_counts.get("delivered", 0),
        "returnedCount": event_counts.get("returned", 0),
        "deliveredOnTimeCount": on_time_count,
        "deliveredLateCount": late_count,
        "deliveredWithoutDeadlineCount": no_deadline_count,
        "pendingFeeUf": round(pending_fee_uf, 2),
        "paidFeeUf": round(paid_fee_uf, 2),
    }


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
        SELECT version, created_at, data
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
            insert_assessment_event(
                connection,
                current_user["id"],
                item["id"],
                "created",
                to_status=item["data"].get("status", "pendiente"),
            )
            if item["data"].get("status") == "entregada":
                insert_delivery_event(
                    connection,
                    current_user["id"],
                    item["id"],
                    item["data"],
                    created_at,
                )
        else:
            current_version, created_at, previous_data = current
            previous_status = json.loads(previous_data).get("status", "pendiente")
            next_status = item["data"].get("status", "pendiente")

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
            if previous_status != next_status:
                insert_assessment_event(
                    connection,
                    current_user["id"],
                    item["id"],
                    "status_changed",
                    from_status=previous_status,
                    to_status=next_status,
                )
                if next_status == "revision" and previous_status == "entregada":
                    insert_assessment_event(
                        connection,
                        current_user["id"],
                        item["id"],
                        "returned",
                        from_status=previous_status,
                        to_status=next_status,
                    )
                if next_status == "entregada":
                    insert_delivery_event(
                        connection,
                        current_user["id"],
                        item["id"],
                        item["data"],
                        created_at,
                    )

    return {
        **item,
        "createdAt": created_at,
        "version": version,
    }


@app.delete("/assessments/{assessment_id}")
def delete_assessment(
    assessment_id: str,
    reason: str = Query(default="", max_length=500),
    current_user: dict = Depends(get_current_user),
):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("BEGIN IMMEDIATE")

        assessment = connection.execute(
            "SELECT data FROM assessments WHERE id = ? AND owner_id = ?",
            (assessment_id, current_user["id"]),
        ).fetchone()

        if assessment is None:
            raise HTTPException(status_code=404, detail="Tasación no encontrada.")

        deleted_data = json.loads(assessment[0])
        insert_assessment_event(
            connection,
            current_user["id"],
            assessment_id,
            "deleted",
            from_status=deleted_data.get("status", "pendiente"),
            reason=reason.strip() or "Sin motivo especificado",
        )

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
