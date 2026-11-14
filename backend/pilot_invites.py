import argparse
import hashlib
import secrets
import sqlite3
from datetime import datetime, timezone

from .config import DB_PATH, MAX_PILOT_USERS


def main():
    parser = argparse.ArgumentParser(
        description="Genera códigos de invitación de un solo uso para el piloto."
    )
    parser.add_argument("count", type=int, help="Cantidad de invitaciones (1–10).")
    args = parser.parse_args()
    if not 1 <= args.count <= 10:
        parser.error("count debe estar entre 1 y 10.")
    if not DB_PATH.is_file():
        parser.error(f"No existe la base de datos: {DB_PATH}. Inicia el backend primero.")

    codes = [secrets.token_urlsafe(32) for _ in range(args.count)]
    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with sqlite3.connect(DB_PATH) as connection:
            connection.execute("BEGIN IMMEDIATE")
            tables = {
                row[0]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table'"
                )
            }
            if "users" not in tables or "pilot_invites" not in tables:
                parser.error("Inicia el backend una vez para crear el esquema de la base.")
            user_count = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            unused_invites = connection.execute(
                "SELECT COUNT(*) FROM pilot_invites WHERE used_at IS NULL"
            ).fetchone()[0]
            if user_count + unused_invites + args.count > MAX_PILOT_USERS:
                parser.error(
                    f"El límite es {MAX_PILOT_USERS} cuentas; "
                    f"ya hay {user_count} cuentas y {unused_invites} invitaciones vigentes."
                )
            connection.executemany(
                """
                INSERT INTO pilot_invites (code_hash, created_at)
                VALUES (?, ?)
                """,
                [
                    (hashlib.sha256(code.encode("utf-8")).hexdigest(), created_at)
                    for code in codes
                ],
            )
    except sqlite3.Error as exc:
        parser.error(f"No se pudieron guardar las invitaciones: {exc}")

    print("Códigos de un solo uso. Compártelos con sus destinatarios por un canal seguro:")
    for code in codes:
        print(code)


if __name__ == "__main__":
    main()
