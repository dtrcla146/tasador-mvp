import os
import shutil
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
REPOSITORY_DIR = BACKEND_DIR.parent
configured_data_dir = os.environ.get("TASADOR_DATA_DIR")
if configured_data_dir is not None and not configured_data_dir.strip():
    raise RuntimeError("TASADOR_DATA_DIR no puede estar vacío.")

if configured_data_dir:
    DATA_DIR = Path(configured_data_dir).expanduser().resolve()
elif os.name == "nt":
    local_app_data = Path(
        os.environ.get("LOCALAPPDATA") or Path.home() / "AppData" / "Local"
    )
    DATA_DIR = (local_app_data / "TasadorMVP").resolve()
else:
    data_home = Path(
        os.environ.get("XDG_DATA_HOME") or Path.home() / ".local" / "share"
    )
    DATA_DIR = (data_home / "tasador-mvp").resolve()

if DATA_DIR == REPOSITORY_DIR or REPOSITORY_DIR in DATA_DIR.parents:
    raise RuntimeError(
        "TASADOR_DATA_DIR debe estar fuera del repositorio para proteger la base y los adjuntos."
    )

DB_PATH = DATA_DIR / "tasador.db"
ATTACHMENTS_DIR = DATA_DIR / "attachments"

try:
    MAX_PILOT_USERS = int(os.environ.get("TASADOR_MAX_USERS", "10"))
except ValueError as exc:
    raise RuntimeError("TASADOR_MAX_USERS debe ser un número entero.") from exc

if not 1 <= MAX_PILOT_USERS <= 10:
    raise RuntimeError("TASADOR_MAX_USERS debe estar entre 1 y 10 para el piloto.")


def migrate_legacy_data(source_dir: Path = BACKEND_DIR) -> None:
    source_dir = source_dir.resolve()
    legacy_db = source_dir / "tasador.db"
    legacy_attachments = source_dir / "attachments"
    sidecar_paths = [
        Path(f"{legacy_db}{suffix}")
        for suffix in ("-wal", "-shm", "-journal")
    ]

    if legacy_db.exists() and DB_PATH.exists():
        raise RuntimeError(
            "Hay bases de datos tanto en TASADOR_DATA_DIR como en backend. "
            "Detén el backend y resuelve la migración sin sobrescribir datos."
        )
    if legacy_db.is_symlink():
        raise RuntimeError("La base de datos antigua no puede ser un enlace simbólico.")
    if any(path.exists() for path in sidecar_paths) and not (legacy_db.exists() or DB_PATH.exists()):
        raise RuntimeError("Hay archivos auxiliares de SQLite sin una base de datos reconocible.")
    if not legacy_db.exists() and not legacy_attachments.exists() and not any(
        path.exists() for path in sidecar_paths
    ):
        return
    if legacy_attachments.exists():
        if not legacy_attachments.is_dir() or legacy_attachments.is_symlink():
            raise RuntimeError("La carpeta antigua de adjuntos no es válida.")
        if ATTACHMENTS_DIR.exists():
            if not ATTACHMENTS_DIR.is_dir():
                raise RuntimeError("La ruta privada de adjuntos no es una carpeta.")
            for path in legacy_attachments.iterdir():
                if path.is_symlink() or (ATTACHMENTS_DIR / path.name).exists():
                    raise RuntimeError(
                        f"No se puede migrar el adjunto sin riesgo de sobrescritura: {path.name}"
                    )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if legacy_db.exists():
        if any((DB_PATH.parent / sidecar.name).exists() for sidecar in sidecar_paths):
            raise RuntimeError("Hay archivos auxiliares SQLite en el destino; no se sobrescribirán.")
        shutil.move(str(legacy_db), str(DB_PATH))
        for sidecar in sidecar_paths:
            if sidecar.exists():
                shutil.move(str(sidecar), str(DB_PATH.parent / sidecar.name))
    elif DB_PATH.exists():
        for sidecar in sidecar_paths:
            target = DB_PATH.parent / sidecar.name
            if sidecar.exists():
                if target.exists():
                    raise RuntimeError(f"No se puede migrar el archivo auxiliar SQLite: {target.name}")
                shutil.move(str(sidecar), str(target))

    if legacy_attachments.exists():
        if not legacy_attachments.is_dir() or legacy_attachments.is_symlink():
            raise RuntimeError("La carpeta antigua de adjuntos no es válida.")
        if ATTACHMENTS_DIR.exists():
            files = list(legacy_attachments.iterdir())
            for path in files:
                shutil.move(str(path), str(ATTACHMENTS_DIR / path.name))
            legacy_attachments.rmdir()
        else:
            shutil.move(str(legacy_attachments), str(ATTACHMENTS_DIR))
