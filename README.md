# Tasador MVP

Aplicación local para gestionar tasaciones y sus archivos adjuntos. El backend usa FastAPI y SQLite; el frontend se sirve por separado.

## Iniciar desde CMD

Instala Node.js LTS si aún no está instalado. Desde la raíz del proyecto instala las dependencias del frontend una vez:

```cmd
cd /d "C:\ruta\al\proyecto"
npm ci
```

Abre dos ventanas de **Símbolo del sistema (CMD)**. Sustituye `C:\ruta\al\proyecto` por la ubicación donde guardaste el proyecto.

### Ventana 1: backend

Pega estos comandos, uno por uno. El entorno virtual está en la raíz del proyecto:

```cmd
cd /d "C:\ruta\al\proyecto"
call .venv\Scripts\activate.bat
for /f %i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set "TASADOR_SECRET_KEY=%i"
set "TASADOR_MAX_USERS=10"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Deja esta ventana abierta. La clave se crea solo en esa ventana y no se guarda en el proyecto. Si reinicias el backend, tendrás que iniciar sesión otra vez; las cuentas y tasaciones guardadas en SQLite se conservan. En Windows, los datos quedan en `%LOCALAPPDATA%\TasadorMVP`, fuera del repositorio. Al iniciar el backend, los datos antiguos de `backend` se trasladan allí automáticamente; detén primero cualquier backend que siga usando la base. En el piloto remoto usa una clave persistente de al menos 32 caracteres, generada y guardada en el gestor de secretos del proveedor, no una clave temporal ni un archivo dentro del repositorio.

La documentación de la API está en <http://127.0.0.1:8000/docs>.

### Ventana 2: frontend

El servidor de desarrollo de Vite publica solo la aplicación web:

```cmd
cd /d "C:\ruta\al\proyecto"
npm run dev
```

Abre <http://127.0.0.1:5173>. No abras `index.html` directamente como archivo: el navegador necesita que la aplicación se sirva por HTTP para comunicarse con el backend. Este servidor es solo para desarrollo local.

**Importante:** nunca sirvas la raíz del repositorio con un servidor estático. Para detener un servidor anterior, usa `Ctrl+C` en su terminal o el control de la extensión que lo administra; no finalices `Code.exe`.

## Crear una cuenta y probar

1. Con el backend iniciado una vez, abre otro CMD en la raíz del proyecto y crea una invitación:

   ```cmd
   cd /d "C:\ruta\al\proyecto"
   call .venv\Scripts\activate.bat
   python -m backend.pilot_invites 1
   ```

   Copia el código que aparece en la consola; se guarda solo su hash y no se puede volver a consultar.
2. Pulsa **Crear cuenta** e introduce el código, el correo, una contraseña de al menos 12 caracteres, el primer nombre y el primer apellido. Los segundos nombres y apellidos son opcionales.
3. La aplicación inicia sesión automáticamente. En visitas posteriores, usa **Iniciar sesión**.
4. En **Resumen** puedes consultar el número de tasaciones por estado, las entregas y devoluciones, el cumplimiento de plazos, los motivos de eliminación y los importes cobrados o pendientes en UF.
5. En **Tasaciones** puedes filtrar la cartera por estado. Usa **Nueva tasación** para crear o editar una ficha, añadir comparables y adjuntar documentos o fotos. El formulario incluye viviendas, terrenos, parcelas y predios agrícolas/forestales, inmuebles comerciales, industriales, hoteleros y otros usos especializados, además de una opción para otros tipos. En Android, **Tomar foto** abre la cámara nativa; en la web abre la cámara o el selector de fotos que ofrezca el navegador.
6. En **Configuración** puedes definir la tarifa y el plazo predeterminados, elegir plazo por días o una fecha manual, ajustar la calidad, resolución máxima y peso objetivo de las copias optimizadas, además de consultar el promedio de los valores diarios de UF disponibles durante los últimos 30 días (incluido hoy). La consulta requiere conexión con mindicador.cl; también puedes introducir la UF manualmente.
7. Pulsa **Cerrar sesión** para volver al formulario de acceso.
8. Para detener los servidores, pulsa `Ctrl+C` en cada ventana CMD.

Las imágenes JPEG, PNG y WebP compatibles se optimizan en el navegador según el peso objetivo, la calidad y la resolución máxima. El original y la copia optimizada se conservan en el almacenamiento local del navegador; cada archivo muestra los pesos y permite descargar o compartir la copia. Si el navegador no puede convertir un formato, conserva el archivo original.

## Web, Android y escritorio

La aplicación comparte el mismo frontend adaptable entre web, Android y escritorio. Conserva la web como acceso principal para el piloto y las actualizaciones inmediatas; Capacitor empaqueta ese frontend para Android y habilita la cámara nativa. Tauri se reserva para una aplicación de escritorio; no se usa Tauri para Android, así evitamos mantener dos aplicaciones nativas para el mismo teléfono.

La cámara de Android no guarda la foto en la galería. La imagen se conserva primero en el almacenamiento local de la aplicación y sigue el flujo existente: se puede revisar, comprimir, guardar y sincronizar con su tasación. Si Android cierra la aplicación mientras la cámara está abierta, se intenta recuperar el resultado al reabrirla.

### Android con Capacitor

Requiere Android Studio con Android SDK. Configura una URL HTTPS pública del backend y permite los orígenes nativos correspondientes en `TASADOR_CORS_ORIGINS`:

```cmd
cd /d "C:\ruta\al\proyecto"
set "VITE_API_BASE_URL=https://tu-subdominio.duckdns.org"
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

`npm run cap:add:android` se ejecuta una sola vez. Después de cambios web, usa `npm run cap:sync` y vuelve a compilar/ejecutar desde Android Studio. La aplicación instalada exige que `VITE_API_BASE_URL` esté configurada para no intentar conectarse por error a `localhost`. Para Android, el origen local de Capacitor suele ser `https://localhost`; confirma el origen de la versión generada y agrégalo explícitamente a `TASADOR_CORS_ORIGINS`. No conectes una app publicada a `127.0.0.1`: en un teléfono esa dirección apunta al propio teléfono, no al servidor.

En un despliegue Docker, define en el `.env` del servidor `TASADOR_CORS_ORIGINS=https://localhost,http://tauri.localhost` y recrea el servicio API. El dominio web/API compartido no necesita CORS. Para desarrollo local, define la misma variable en la ventana CMD del backend antes de iniciarlo. No agregues comodines a CORS.

### Escritorio con Tauri

Requiere Rust, Microsoft C++ Build Tools y WebView2 en Windows. Configura el backend HTTPS y los permisos CORS del origen Tauri antes de iniciar:

```cmd
cd /d "C:\ruta\al\proyecto"
set "VITE_API_BASE_URL=https://tu-subdominio.duckdns.org"
npm run tauri -- dev
```

Para empaquetar la aplicación, ejecuta `npm run tauri -- build`. La cámara en el escritorio no usa el plugin móvil; se mantiene disponible el selector de archivos del sistema.

### Compilar la web

`npm run build` genera la web estática en `dist`. El servidor web de producción debe publicar solo `dist` y reenviar las rutas de la API a FastAPI. No publiques los fuentes privados del backend. La compilación de Android y escritorio debe realizarse con una URL de API HTTPS; no uses secretos ni datos reales ficticios dentro de las variables del frontend.

Las rutas de tasaciones y adjuntos requieren sesión y solo devuelven registros de la cuenta autenticada. El frontend guarda las tasaciones, colas de sincronización y archivos locales separadas por cuenta. CORS permite el acceso desde el servidor local de Vite en el puerto 5173. El almacenamiento local de cada navegador, Android y escritorio es independiente: solo los datos que se hayan sincronizado con el backend aparecen en los otros dispositivos.

### Preparar paquetes firmados para el piloto

La firma de Android debe crearse una sola vez y conservarse para todas las actualizaciones de esa aplicación. En CMD, crea el almacén privado fuera de OneDrive y del repositorio:

```cmd
mkdir "%LOCALAPPDATA%\TasadorMVP\signing"
keytool -genkeypair -v -keystore "%LOCALAPPDATA%\TasadorMVP\signing\tasador-pilot.jks" -alias tasador-pilot -keyalg RSA -keysize 3072 -validity 10000
copy deploy\android-signing.properties.example "%LOCALAPPDATA%\TasadorMVP\signing\android-signing.properties"
notepad "%LOCALAPPDATA%\TasadorMVP\signing\android-signing.properties"
```

`keytool` pedirá las contraseñas; guárdalas en un gestor seguro. Completa `storePassword` y `keyPassword` en el archivo privado y deja `keyAlias=tasador-pilot`. No compartas, sincronices ni subas el `.jks` o el archivo de contraseñas. Sin una copia segura de esta clave no se podrán publicar actualizaciones compatibles del APK.

Después de desplegar y verificar el backend HTTPS, prepara ambos paquetes desde la raíz del proyecto:

```cmd
cd /d "C:\ruta\al\proyecto"
set "VITE_API_BASE_URL=https://tu-subdominio.duckdns.org"
npm run package:pilot
```

El comando comprueba `/health` y la firma antes de compilar Android Release y el instalador Windows NSIS. Deja los dos ejecutables, `INSTALACION.txt` y sus hashes SHA-256 en `release-pilot`. Si `release-pilot` ya existe, archívalo antes de volver a empaquetar. El APK queda firmado con la clave privada del piloto; el instalador Windows aún no tiene certificado comercial y el sistema puede bloquearlo o advertir que el editor es desconocido. No indiques a los tasadores que ignoren advertencias del sistema operativo; si Windows bloquea la instalación, no distribuyas ese instalador hasta resolver la firma. Para Android, la instalación externa requiere que el propio usuario autorice esa fuente en su dispositivo.

El frontend empaquetado incluye JavaScript que se puede inspeccionar o extraer; no hay una forma fiable de ocultar la lógica ejecutada en el cliente. Mantén en el backend la lógica sensible y nunca incluyas secretos en los binarios.

### Publicar solo la web en Vercel

El archivo `vercel.json` configura Vercel para instalar con `npm ci`, ejecutar `npm run build` y publicar únicamente `dist`. No configura ni despliega FastAPI, SQLite o los adjuntos. La carpeta de salida pública contiene el HTML, CSS y JavaScript del navegador; no se puede ocultar la lógica que corre en el cliente.

Para una demostración visual con datos ficticios, importa el repositorio en Vercel y deja el directorio raíz del proyecto vacío (raíz del repositorio). No conectes el servicio del backend ni pegues secretos en variables `VITE_*`: esas variables se incorporan al JavaScript visible del cliente. El plan Hobby de Vercel está limitado por sus términos actuales a uso personal y no comercial, y esos términos también contemplan el uso del contenido de Hobby para entrenamiento de modelos. No uses ese plan para un piloto comercial ni cargues datos personales, tasaciones reales o fotos de clientes sin revisar primero los términos, privacidad y tratamiento de datos.

Cuando frontend y API se sirven desde el mismo dominio con Caddy, el navegador usa la ruta relativa `/api` y Caddy la reenvía a FastAPI quitando ese prefijo. Para Vercel o apps nativas, configura `VITE_API_BASE_URL` con una URL HTTPS absoluta de la API; el origen del backend debe autorizar el origen web exacto en `TASADOR_CORS_ORIGINS` o `ALLOWED_ORIGINS`. No intentes usar el FastAPI actual como función en Vercel: su SQLite y carpeta de adjuntos requieren almacenamiento persistente que el filesystem de funciones no ofrece. Hasta elegir y configurar una base de datos y almacenamiento persistentes para la API, Vercel solo sirve para presentar la web; registro, inicio de sesión, sincronización e informes remotos no estarán disponibles. No publiques todavía ejecutables para usuarios con esta configuración de solo frontend.

Pasos desde CMD para preparar la salida que Vercel publicará:

```cmd
cd /d "C:\ruta\al\proyecto"
npm ci
npm run build
```

La salida queda en `dist`. Para desplegarla, inicia sesión en el panel de Vercel, crea un proyecto desde el repositorio, selecciona la raíz del repositorio como directorio y confirma estos valores: Framework Preset **Vite**, Install Command `npm ci`, Build Command `npm run build`, Output Directory `dist`. Revisa la vista previa usando solo datos ficticios. El despliegue externo requiere que tú autorices la conexión de GitHub con Vercel y aceptes los términos del proveedor.

### Piloto remoto temporal sin comprar dominio

Para que hasta diez invitados prueben el flujo completo sin pagar un dominio, puedes servir el frontend estático desde Vercel y mantener temporalmente la API y una base de datos aislada en tu PC mediante un Cloudflare Quick Tunnel. Para esta modalidad Vercel compila la URL absoluta del túnel en `VITE_API_BASE_URL`; la ruta relativa `/api` se usa solo en la modalidad Caddy de mismo origen. No combines las dos configuraciones. No es un despliegue de producción: Cloudflare asigna un hostname aleatorio de `trycloudflare.com`, no garantiza disponibilidad y lo cambia cuando reinicias el túnel. Tu PC y su conexión deben permanecer activos. No abras puertos del router ni ejecutes este túnel contra el servidor de desarrollo de Vite.

Cloudflare indica que Quick Tunnels son para pruebas/desarrollo, admiten hasta 200 solicitudes simultáneas y cualquiera que conozca la URL puede llegar al servicio. La API solo expone sus rutas FastAPI en `127.0.0.1:8000`; las tasaciones/adjuntos requieren autenticación, y el registro requiere una invitación de un solo uso. Usa únicamente datos ficticios: la base y las fotos permanecen en la computadora anfitriona y no hay respaldo remoto automático. Evita datos personales o documentos reales de clientes.

1. Publica el frontend estático en Vercel como se indica arriba. Todavía no compartas la URL: primero configurarás la URL real del túnel como `VITE_API_BASE_URL` y volverás a desplegar.
2. Descarga `cloudflared` únicamente desde la [página oficial de Cloudflare](https://developers.cloudflare.com/tunnel/downloads/) o desde las versiones oficiales de su [repositorio](https://github.com/cloudflare/cloudflared/releases). No uses binarios enviados por terceros. Si Windows muestra una advertencia de seguridad, no la evadas: verifica el origen o cancela.
3. En una CMD nueva, ejecuta `deploy\local-pilot.cmd` desde la raíz del repositorio. Cuando lo pida, pega el origen exacto de producción, por ejemplo `https://tasador-mvp.vercel.app`. El script guarda el secreto y los datos de prueba fuera del repositorio, en `%LOCALAPPDATA%\TasadorMVP-Pilot`, y escucha solo en `127.0.0.1:8000`. Conserva abierta esta ventana.
4. En otra CMD, inicia el túnel hacia **solo** la API:

   ```cmd
   "%USERPROFILE%\Downloads\cloudflared-windows-amd64.exe" tunnel --url http://127.0.0.1:8000
   ```

   Usa la ruta real donde guardaste el ejecutable. Copia la URL `https://....trycloudflare.com` que imprime cloudflared; no cierres esta ventana.
5. En Vercel, cambia `VITE_API_BASE_URL` a esa URL HTTPS del túnel y vuelve a desplegar el entorno **Production**. Comprueba `<URL-del-túnel>/health` y que responda `{"status":"ok"}`. Luego inicia una segunda ventana CMD y ejecuta `deploy\local-pilot.cmd invites 10`; vuelve a introducir el mismo origen Vercel y reparte cada invitación individualmente. Los códigos se muestran una sola vez.
6. Comparte con los invitados la URL de producción `https://<proyecto>.vercel.app` y su código individual. Verifica primero con dos cuentas de prueba que cada usuario solo acceda a sus propios datos.

El hostname del túnel debe seguir igual durante el ensayo. Si detienes o reinicias cloudflared, su URL aleatoria cambiará: actualiza `VITE_API_BASE_URL` en Vercel, vuelve a desplegar y comparte la URL de producción estable. Si se detiene la PC, el backend o el túnel, el inicio de sesión y la sincronización remota dejarán de funcionar; los datos guardados en la base aislada permanecen en el disco local.

Esta modalidad es solo para una demostración controlada y temporal, no para el servicio comercial. Además, el plan Hobby de Vercel está sujeto a uso personal/no comercial; confirma que tu evaluación cumple sus términos actuales antes de elegirlo para una prueba profesional. Si no corresponde, no uses Hobby para ese piloto: será necesario seleccionar un plan/proveedor cuyos términos permitan ese uso. No se deben cargar tasaciones reales hasta disponer de infraestructura persistente y revisar privacidad, copias de seguridad y recuperación.

## Importar información de un correo

En **Importar**, usa **Copiar modelo** para compartir una solicitud de antecedentes por correo o mensaje. Pega la respuesta y pulsa **Detectar información**. La aplicación reconoce campos con etiquetas explícitas, presenta una propuesta editable y no crea una tasación hasta que confirmes su aplicación a una ficha nueva. Los campos ausentes o contradictorios se señalan para revisión.

Esta primera etapa funciona en el navegador, sin conectar una cuenta de correo, usar una API de IA ni enviar el mensaje a un servicio externo. La ficha solo recibe los valores cuando confirmas su aplicación; luego puedes corregirlos y completar el flujo normal de tasación.

## Búsqueda asistida de comparables

En **Comparables**, abre las búsquedas web sugeridas, revisa los anuncios y registra manualmente el enlace y los datos que quieras investigar. La aplicación no extrae automáticamente contenido de Yapo ni de otros portales. Las propuestas se muestran en una tabla; marca **Revisada** antes de seleccionar **Incorporar**. También puedes corregir, descartar, reabrir o retirar una propuesta. Solo las incorporadas expresamente pasan al estudio.

Las coordenadas se ingresan manualmente y la distancia se calcula en línea recta. El radio configurable solo sirve para señalar si un anuncio queda fuera del rango que ingresaste: no restringe las búsquedas web. La aplicación guarda esos criterios como información ingresada por el usuario, pero no los incluye en el informe final.

En la ficha de tasación puedes elegir media, mediana, cuartiles o media ponderada para el resumen comercial. Cada comparable aceptado admite un peso (0,1–10) y un ajuste ingresados por el tasador (-90 % a 100 %); el informe expone estos valores y presenta el resultado como análisis estadístico preliminar, no como una fórmula oficial ni una conclusión profesional. Los comparables pendientes no participan en el cálculo.

La ficha también permite incorporar separadamente una referencia calculada con factores fiscales SII 2022, que el tasador transcribe y confirma desde documentos oficiales, o un avalúo fiscal vigente consultado e ingresado manualmente por el usuario. La referencia aplica parámetros de 2022 a los antecedentes de la ficha; no reconstruye el avalúo individual original de la propiedad ni es un avalúo actual. Siempre requiere identificar comuna/área homogénea, revisar la fuente y confirmar los datos antes de incluirla en el informe. La [Guía del SII](https://www.sii.cl/destacados/reavaluo/2022/guia_calculo_avaluo.pdf) y la [Resolución Ex. SII N°143](https://www.sii.cl/normativa_legislacion/resoluciones/2021/reso143.pdf) documentan el avalúo fiscal general no agrícola del reavalúo 2022, con vigencia desde el 1 de enero de 2022; no son una fórmula general para el valor comercial. El [archivo de reavalúos anteriores del SII](https://www.sii.cl/destacados/reavaluo/reavaluos_anteriores.html) no muestra un reavalúo general no agrícola para 2026; el proceso 2024 publicado por el SII se limita a sitios no edificados, propiedades abandonadas y pozos lastreros. Las tablas de 2022 se ofrecen como PDF por comuna y no encontré un CSV oficial nacional.

El informe permite incluir uno o ambos resultados fiscal/comercial. La [NCh 3658/1:2021 del INN](https://ecommerce.inn.cl/nch36581202178551) establece requisitos generales de proceso e informe, pero su ficha pública no contiene el texto completo ni prescribe una fórmula universal de comparables. No se calcula un porcentaje de coincidencia automática ni se mezclan el avalúo fiscal y el valor comercial.

## Planos e informes

En **Planos**, selecciona una tasación y crea un croquis indicando los vértices X,Y de cada habitación en metros, uno por línea (por ejemplo `Estar: 0,0; 5,0; 5,4; 0,4`). Las puertas y ventanas se anotan por habitación, número de muro, tipo, distancia desde el vértice y ancho. La vista previa muestra medidas, orientación y aberturas; revisa y guarda la distribución en la ficha. Es un croquis esquemático editable, no un plano certificado ni un sustituto de la validación profesional. También puedes importar formatos de archivo diversos de hasta 25 MB; el navegador conserva los formatos que no puede previsualizar para descargarlos posteriormente.

Los informes generados aparecen en **Mis informes**. Se guardan en la cuenta si el servidor está disponible y, en caso contrario, en el navegador del dispositivo para sincronizarse más tarde. Puedes abrir/imprimirlos o descargar el HTML. La plantilla incluye un espacio en blanco para firma y visado: la aplicación no certifica el informe.

## Versión 2.0

La rama `version-2.0-clean` incorpora importación asistida desde mensajes, selección manual y revisión de comparables, croquis medidos editables, archivo de informes y optimización de fotografías en el dispositivo. Los portales inmobiliarios no se consultan automáticamente: antes de automatizar búsquedas hay que confirmar que cada fuente permita ese uso y cómo mantener sus enlaces y datos actualizados sin infringir sus condiciones.

## Preparar el piloto privado (máximo 10 cuentas)

El registro requiere un código de invitación de un solo uso. Inicia el backend una vez para crear o actualizar el esquema y, desde una ventana CMD en la raíz del proyecto, genera los códigos que distribuirás individualmente:

```cmd
cd /d "C:\ruta\al\proyecto"
call .venv\Scripts\activate.bat
set "TASADOR_MAX_USERS=10"
python -m backend.pilot_invites 10
```

La herramienta imprime los códigos una sola vez, guarda solo sus hashes y no permite exceder el límite de cuentas (considera cuentas existentes e invitaciones sin usar). No publiques los códigos. Si la base de datos está en una ubicación externa, define el mismo `TASADOR_DATA_DIR` en cada ventana CMD, en la API y en las herramientas de mantenimiento. El servidor valida el límite de nuevo al registrar cada cuenta.

## Prueba de 10 días y acceso manual

Cada cuenta invitada inicia su periodo de prueba de 10 días al registrarse. Al vencer, el servidor bloquea las rutas de tasaciones, informes, ajustes y adjuntos; la cuenta aún puede consultar su estado y descargar los datos propios guardados en el servidor. La pantalla de vencimiento también permite descargar los registros y archivos del almacenamiento local de ese navegador. La prueba no se renueva al iniciar sesión.

La integración con pagos o emisión automática de licencias está aplazada. Durante la etapa de pruebas, un administrador con acceso directo al servidor puede conceder acceso manual, que se registra en la base de datos:

```cmd
cd /d "C:\ruta\al\proyecto"
call .venv\Scripts\activate.bat
python -m backend.grant_license usuario@ejemplo.cl --days 30 --reason "Piloto autorizado"
```

Define `TASADOR_DATA_DIR` en esa ventana si la API usa una carpeta de datos externa. Este comando no cobra, verifica pago ni emite una clave comercial; no debe exponerse como endpoint público. La política legal y la licencia comercial siguen pendientes de revisión profesional.

## Almacenamiento y copias

En Windows, la base y los adjuntos se guardan por defecto en `%LOCALAPPDATA%\TasadorMVP`; en otros sistemas, bajo `$XDG_DATA_HOME/tasador-mvp` (o `~/.local/share/tasador-mvp`). Al iniciar, el backend migra los datos antiguos de `backend` a esa ubicación privada. Para un servidor, monta una carpeta persistente y privada fuera del directorio web, y define `TASADOR_DATA_DIR` con esa ruta antes de iniciar la API. Publica únicamente los archivos de `frontend`; nunca la raíz del repositorio ni `backend`.

Para una prueba de respaldo, detén temporalmente la API para que la base y los adjuntos representen el mismo momento. Guarda las copias fuera de `TASADOR_DATA_DIR` y del sitio público:

```cmd
cd /d "C:\ruta\al\proyecto"
call .venv\Scripts\activate.bat
python -m backend.backup --destination "D:\TasadorBackups"
python -m backend.verify_backup "D:\TasadorBackups\tasador-AAAAMMDDTHHMMSSZ"
python -m backend.restore_backup "D:\TasadorBackups\tasador-AAAAMMDDTHHMMSSZ" --destination "D:\TasadorRestoreTest"
```

La verificación comprueba hashes, SQLite, claves foráneas y archivos adjuntos; la restauración de ensayo crea una nueva carpeta de destino que debe no existir. Después, se puede probar la API de ensayo apuntando `TASADOR_DATA_DIR` a esa carpeta. Esto no configura copias automáticas, retención ni almacenamiento fuera del servidor: antes del piloto real hay que programar y vigilar copias cifradas fuera del equipo y probar su restauración periódicamente.

## Requisitos para despliegue remoto

No uses `python -m http.server` para alojar el piloto en Internet. El despliegue debe tener un dominio con HTTPS, un servidor web que publique solo `dist` y actúe como proxy hacia FastAPI, una base/adjuntos en almacenamiento persistente privado, y el backend sin acceso público directo. Para que la web llame al API en el mismo dominio, configura el proxy para enviar las rutas de la API a FastAPI; así no hace falta incluir una URL local en el JavaScript. Si el dominio de Namecheap no está habilitado, puedes crear un subdominio gratuito en DuckDNS, por ejemplo `tasador-piloto.duckdns.org`.

Se incluye una configuración de referencia con Docker Compose y Caddy: el proxy publica solo la web, obtiene HTTPS para el dominio y envía las rutas de API al contenedor privado; SQLite y adjuntos persisten en un volumen separado. Para usarla, primero crea una instancia Ubuntu compatible con Docker. Registra en DuckDNS la IP pública asignada a Oracle y permite entrada TCP 80/443; limita SSH (puerto 22) a tu IP y no abras 8000, 5173 ni 5500. La capacidad Always Free de Oracle no está garantizada y puede no haber instancias disponibles. Instala Docker Engine y Compose Plugin siguiendo la [guía oficial de Docker para Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

En la instancia, desde el directorio privado que contiene el proyecto:

```bash
cp .env.example .env
nano .env
```

En `.env`, `APP_DOMAIN` debe ser solo el nombre DNS (sin `https://`), por ejemplo `tasador-piloto.duckdns.org`. Mantén `TASADOR_CORS_ORIGINS=https://localhost,http://tauri.localhost`; añade únicamente el origen HTTPS exacto si también servirás la web desde otro dominio. Sustituye `TASADOR_SECRET_KEY` por un secreto aleatorio de al menos 32 caracteres, generado en el servidor con `openssl rand -hex 32`. No dejes la variable vacía ni uses ese ejemplo literalmente. Luego inicia Caddy, frontend y API:

```bash
docker compose up --build -d
docker compose ps
curl -i https://tasador-piloto.duckdns.org/health
```

`.env` está excluido de Git; no lo compartas ni lo subas. Caddy obtiene el certificado HTTPS automáticamente cuando el DNS público ya resuelve a la instancia y los puertos 80/443 son accesibles. Esta configuración todavía no está desplegada: no hay subdominio DuckDNS, instancia Oracle ni URL HTTPS verificada. En un piloto real hay que configurar copias cifradas fuera del servidor, supervisar su ejecución y ensayar la recuperación antes de cargar tasaciones reales.

Variables requeridas/recomendadas en el servicio:

- `TASADOR_SECRET_KEY`: secreto persistente, aleatorio, mínimo 32 caracteres.
- `TASADOR_DATA_DIR`: volumen persistente privado, fuera de la raíz web.
- `TASADOR_MAX_USERS=10`: tope de cuentas del piloto.
- `TASADOR_CORS_ORIGINS=https://localhost,http://tauri.localhost`: orígenes nativos explícitos; agrega solo otros orígenes exactos que uses, nunca `*`.

La API debe escuchar solo en `127.0.0.1` si el proxy corre en la misma máquina, o en una red privada si corre en otro servicio. No habilites `--reload` en producción; Docker lo desactiva y oculta `/docs` y OpenAPI. La URL de mindicador.cl debe tener salida a Internet para actualizar la UF. El cliente recibe HTML y JavaScript: no es posible ocultar por completo la lógica que se ejecuta en el navegador.

## Antes de invitar usuarios reales

1. Acordar proveedor, dominio, ubicación de datos, retención, soporte y responsable de restaurar copias; ninguno se publica automáticamente desde este repositorio.
2. Desplegar primero un entorno de ensayo con datos ficticios y HTTPS. Ejecutar los recorridos de registro/inicio, tasaciones, informes y adjuntos con dos cuentas, verificando que la segunda no pueda leer, descargar ni borrar los datos de la primera.
3. Realizar una restauración de ensayo y validar que la aplicación inicia y que los registros/archivos esperados están disponibles.
4. Preparar aviso de privacidad, consentimiento, canal de soporte y procedimiento para exportar/eliminar datos. Revisar requisitos legales y tributarios en Chile antes de cobrar.
5. Elegir y validar un proveedor de pagos antes de implementar suscripciones; no almacenar datos de tarjetas en Tasador. El borrador de condiciones está en [PILOT-TERMS-DRAFT.md](./PILOT-TERMS-DRAFT.md) y no debe presentarse como licencia legal aprobada.

El repositorio todavía no define una licencia de distribución aprobada. No presentar el programa como producto comercial ni aceptar pagos hasta acordar y documentar sus condiciones de licencia. Los servicios gratuitos pueden tener límites, suspensión, almacenamiento efímero o cargos; verificar precios y términos vigentes del proveedor antes de contratar o cargar datos reales.
