import argparse
from contextlib import closing
import hashlib
import json
import sqlite3
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from .config import ATTACHMENTS_DIR, DATA_DIR, DB_PATH


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    parser = argparse.ArgumentParser(
        description="Crea una copia verificable de SQLite y los adjuntos."
    )
    parser.add_argument(
        "--destination",
        required=True,
        type=Path,
        help="Carpeta de copias, fuera de TASADOR_DATA_DIR.",
    )
    args = parser.parse_args()
    destination = args.destination.expanduser().resolve()
    if not DB_PATH.is_file():
        parser.error(f"No existe la base de datos: {DB_PATH}.")
    if destination == DATA_DIR or DATA_DIR in destination.parents:
        parser.error("La carpeta de copias debe estar fuera de TASADOR_DATA_DIR.")
    destination.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_path = destination / f"tasador-{stamp}"
    if backup_path.exists():
        parser.error(f"Ya existe el destino: {backup_path}.")

    with tempfile.TemporaryDirectory(
        dir=destination, prefix=".tasador-backup-"
    ) as temporary:
        staging = Path(temporary)
        backup_db = staging / "tasador.db"
        with closing(sqlite3.connect(DB_PATH)) as source, closing(
            sqlite3.connect(backup_db)
        ) as target:
            source.backup(target)
            target.commit()
            result = target.execute("PRAGMA integrity_check").fetchone()[0]
            if result != "ok":
                parser.error(f"Falló la verificación SQLite: {result}.")

        attachments_zip = staging / "attachments.zip"
        file_count = 0
        with zipfile.ZipFile(
            attachments_zip, "w", compression=zipfile.ZIP_DEFLATED
        ) as archive:
            if ATTACHMENTS_DIR.exists():
                for path in ATTACHMENTS_DIR.rglob("*"):
                    if path.is_symlink():
                        parser.error(f"No se admite un enlace simbólico: {path}.")
                    if path.is_file():
                        archive.write(path, path.relative_to(ATTACHMENTS_DIR))
                        file_count += 1

        manifest = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "database_sha256": sha256_file(backup_db),
            "attachments_sha256": sha256_file(attachments_zip),
            "attachment_count": file_count,
        }
        (staging / "manifest.json").write_text(
            json.dumps(manifest, indent=2), encoding="utf-8"
        )
        staging.rename(backup_path)

    print(f"Copia creada y SQLite verificado: {backup_path}")
    print(f"Adjuntos incluidos: {file_count}")


if __name__ == "__main__":
    main()
