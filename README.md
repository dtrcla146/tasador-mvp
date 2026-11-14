# Tasador MVP

Aplicación local para gestionar tasaciones y sus archivos adjuntos. El backend usa FastAPI y SQLite; el frontend se sirve por separado.

## Iniciar desde CMD

Abre dos ventanas de **Símbolo del sistema (CMD)** desde la carpeta del proyecto.
En los comandos siguientes, sustituye `C:\ruta\al\proyecto` por la ubicación donde guardaste el proyecto.

### Ventana 1: backend

Pega estos comandos, uno por uno. El entorno virtual está en la raíz del proyecto:

```cmd
cd /d "C:\ruta\al\proyecto"
call .venv\Scripts\activate.bat
for /f %i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "TASADOR_SECRET_KEY=%i"
cd /d "C:\ruta\al\proyecto\backend"
python -m uvicorn main:app --reload
```

Deja esta ventana abierta. La clave se crea solo en esa ventana y no se guarda en el proyecto. Si cierras y vuelves a iniciar el backend, se generará otra clave y tendrás que iniciar sesión otra vez; las cuentas y tasaciones guardadas en SQLite se conservan.

La documentación de la API está en <http://127.0.0.1:8000/docs>.

### Ventana 2: frontend

Desde la carpeta raíz del proyecto, ejecuta:

```cmd
cd /d "C:\ruta\al\proyecto"
.venv\Scripts\python.exe -m http.server 5500
```

Abre <http://127.0.0.1:5500>. No abras `index.html` directamente como archivo: el navegador necesita que la aplicación se sirva por HTTP para comunicarse con el backend.

## Crear una cuenta y probar

1. En la página, escribe un correo y una contraseña de al menos 12 caracteres y pulsa **Crear cuenta**.
2. La aplicación inicia sesión automáticamente. En visitas posteriores, usa **Iniciar sesión**.
3. Crea una tasación, guarda archivos y prueba listarlos, descargarlos y eliminarlos.
4. Pulsa **Cerrar sesión** para volver al formulario de acceso.
5. Para detener los servidores, pulsa `Ctrl+C` en cada ventana CMD.

Las rutas de tasaciones y adjuntos requieren sesión y solo devuelven registros de la cuenta autenticada. El frontend guarda las tasaciones, colas de sincronización y archivos locales separadas por cuenta. CORS permite el acceso desde el servidor local del frontend en el puerto 5500.
