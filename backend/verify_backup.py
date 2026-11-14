import argparse
from contextlib import closing
import hashlib
import json
import sqlite3
import stat
import tempfile
import zipfile
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(
        description="Restaura una copia en una carpeta temporal y verifica sus datos."
    )
    parser.add_argument("backup", type=Path, help="Carpeta creada por backend.backup.")
    args = parser.parse_args()
    backup = args.backup.expanduser().resolve()
    database = backup / "tasador.db"
    attachments = backup / "attachments.zip"
    manifest_path = backup / "manifest.json"
    if not all(path.is_file() for path in (database, attachments, manifest_path)):
        parser.error("La copia debe contener tasador.db, attachments.zip y manifest.json.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if sha256_file(database) != manifest.get("database_sha256"):
        parser.error("El hash de la base no coincide con el manifiesto.")
    if sha256_file(attachments) != manifest.get("attachments_sha256"):
        parser.error("El hash de los adjuntos no coincide con el manifiesto.")

    with tempfile.TemporaryDirectory(prefix="tasador-restore-check-") as temporary:
        restored_attachments = Path(temporary) / "attachments"
        with zipfile.ZipFile(attachments) as archive:
            for entry in archive.infolist():
                target = (restored_attachments / entry.filename).resolve()
                if (
                    restored_attachments.resolve() not in target.parents
                    or stat.S_ISLNK(entry.external_attr >> 16)
                ):
                    parser.error("El archivo comprimido contiene una entrada no permitida.")
            archive.extractall(restored_attachments)

        with closing(sqlite3.connect(database)) as connection:
            integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
            foreign_key_errors = connection.execute("PRAGMA foreign_key_check").fetchall()
            if integrity != "ok" or foreign_key_errors:
                parser.error(
                    f"Restauración no válida: integrity={integrity}, "
                    f"errores de claves foráneas={len(foreign_key_errors)}."
                )
            account_count = connection.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            assessment_count = connection.execute(
                "SELECT COUNT(*) FROM assessments"
            ).fetchone()[0]

    print(
        "Restauración temporal verificada: "
        f"{account_count} cuentas, {assessment_count} tasaciones, "
        f"{manifest.get('attachment_count', 0)} adjuntos."
    )


if __name__ == "__main__":
    main()
