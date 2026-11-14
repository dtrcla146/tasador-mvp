import argparse
from contextlib import closing
import hashlib
import json
import shutil
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
        description="Restaura una copia a una carpeta de datos nueva y vacía."
    )
    parser.add_argument("backup", type=Path, help="Carpeta creada por backend.backup.")
    parser.add_argument(
        "--destination",
        required=True,
        type=Path,
        help="Carpeta nueva, vacía y fuera de la carpeta de la copia.",
    )
    args = parser.parse_args()
    backup = args.backup.expanduser().resolve()
    destination = args.destination.expanduser().resolve()
    database = backup / "tasador.db"
    attachments_archive = backup / "attachments.zip"
    manifest_path = backup / "manifest.json"
    if not all(path.is_file() for path in (database, attachments_archive, manifest_path)):
        parser.error("La copia debe contener tasador.db, attachments.zip y manifest.json.")
    if destination == backup or backup in destination.parents:
        parser.error("El destino no puede estar dentro de la carpeta de la copia.")
    if destination.exists():
        parser.error("El destino de restauración no debe existir todavía.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if sha256_file(database) != manifest.get("database_sha256"):
        parser.error("El hash de la base no coincide con el manifiesto.")
    if sha256_file(attachments_archive) != manifest.get("attachments_sha256"):
        parser.error("El hash de los adjuntos no coincide con el manifiesto.")

    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        dir=destination.parent, prefix=".tasador-restore-"
    ) as temporary:
        staging = Path(temporary) / "restored"
        staging.mkdir()
        staged_database = staging / "tasador.db"
        staged_attachments = staging / "attachments"
        shutil.copy2(database, staged_database)
        with zipfile.ZipFile(attachments_archive) as archive:
            for entry in archive.infolist():
                target = (staged_attachments / entry.filename).resolve()
                if (
                    staged_attachments.resolve() not in target.parents
                    or stat.S_ISLNK(entry.external_attr >> 16)
                ):
                    parser.error("El archivo comprimido contiene una entrada no permitida.")
            archive.extractall(staged_attachments)

        with closing(sqlite3.connect(staged_database)) as connection:
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
        staging.rename(destination)

    print(
        f"Restauración verificada en {destination}: {account_count} cuentas, "
        f"{assessment_count} tasaciones."
    )


if __name__ == "__main__":
    main()
