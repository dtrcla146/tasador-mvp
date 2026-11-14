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

1. Pulsa **Crear cuenta** e introduce el correo, una contraseña de al menos 12 caracteres, el primer nombre y el primer apellido. Los segundos nombres y apellidos son opcionales.
2. La aplicación inicia sesión automáticamente. En visitas posteriores, usa **Iniciar sesión**.
3. En **Resumen** puedes consultar el número de tasaciones por estado, las entregas y devoluciones, el cumplimiento de plazos, los motivos de eliminación y los importes cobrados o pendientes en UF.
4. En **Tasaciones** puedes filtrar la cartera por estado. Usa **Nueva tasación** para crear o editar una ficha, añadir comparables y adjuntar documentos o fotos.
5. En **Configuración** puedes definir la tarifa y el plazo predeterminados, elegir plazo por días o una fecha manual, ajustar la calidad de compresión de las fotos y consultar el promedio de UF del mes anterior. La consulta requiere conexión con mindicador.cl; también puedes introducir la UF manualmente.
6. Pulsa **Cerrar sesión** para volver al formulario de acceso.
7. Para detener los servidores, pulsa `Ctrl+C` en cada ventana CMD.

Las imágenes compatibles se convierten a WebP en el navegador usando la calidad elegida; el original se conserva en el almacenamiento local del navegador. La aplicación sigue siendo local: no publiques el servidor ni abras sus puertos a Internet.

Las rutas de tasaciones y adjuntos requieren sesión y solo devuelven registros de la cuenta autenticada. El frontend guarda las tasaciones, colas de sincronización y archivos locales separadas por cuenta. CORS permite el acceso desde el servidor local del frontend en el puerto 5500.
