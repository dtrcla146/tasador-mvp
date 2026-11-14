import argparse
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from .config import DB_PATH


def main():
    parser = argparse.ArgumentParser(
        description="Concede acceso manual y auditado a una cuenta del piloto."
    )
    parser.add_argument("email", help="Correo de la cuenta que recibirá acceso.")
    parser.add_argument(
        "--days",
        type=int,
        required=True,
        help="Duración de la licencia manual (1–3650 días).",
    )
    parser.add_argument(
        "--reason",
        required=True,
        help="Motivo administrativo para el registro de auditoría.",
    )
    args = parser.parse_args()
    if not 1 <= args.days <= 3650:
        parser.error("--days debe estar entre 1 y 3650.")
    if not args.reason.strip():
        parser.error("--reason no puede estar vacío.")
    if not DB_PATH.is_file():
        parser.error(f"No existe la base de datos: {DB_PATH}. Inicia el backend primero.")

    now = datetime.now(timezone.utc)
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("BEGIN IMMEDIATE")
        user = connection.execute(
            "SELECT id, licensed_until FROM users WHERE email = ?",
            (args.email.strip().lower(),),
        ).fetchone()
        if user is None:
            parser.error("No se encontró la cuenta indicada.")

        current_expiry = (
            datetime.fromisoformat(user[1])
            if user[1]
            else now
        )
        starts_at = max(now, current_expiry)
        valid_until = (starts_at + timedelta(days=args.days)).isoformat()
        connection.execute(
            "UPDATE users SET licensed_until = ? WHERE id = ?",
            (valid_until, user[0]),
        )
        connection.execute(
            """
            INSERT INTO license_events
                (id, owner_id, issued_at, valid_until, duration_days, reason)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                user[0],
                now.isoformat(),
                valid_until,
                args.days,
                args.reason.strip(),
            ),
        )

    print(f"Acceso manual concedido hasta {valid_until}.")
    print("No se procesaron pagos ni se emitió un código de licencia.")


if __name__ == "__main__":
    main()
