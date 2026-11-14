import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isIP } from 'node:net';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = join(root, 'release-pilot');
const signingDirectory = process.env.TASADOR_ANDROID_SIGNING_DIR
  ? resolve(process.env.TASADOR_ANDROID_SIGNING_DIR)
  : join(process.env.LOCALAPPDATA || homedir(), 'TasadorMVP', 'signing');
const androidSdkRoot = process.env.ANDROID_HOME
  || process.env.ANDROID_SDK_ROOT
  || join(process.env.LOCALAPPDATA || homedir(), 'Android', 'Sdk');
const buildEnvironment = {
  ...process.env,
  ANDROID_HOME: androidSdkRoot,
  ANDROID_SDK_ROOT: androidSdkRoot,
};
const propertiesPath = join(signingDirectory, 'android-signing.properties');
const keystorePath = join(signingDirectory, 'tasador-pilot.jks');
const androidDirectory = join(root, 'android');
const androidBuildDirectory = join(androidDirectory, 'app', 'build', 'outputs', 'apk', 'release');
const windowsBundleDirectory = join(root, 'src-tauri', 'target', 'release', 'bundle', 'nsis');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function fail(message) {
  console.error(`No se puede preparar el paquete del piloto: ${message}`);
  process.exit(1);
}

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    env: buildEnvironment,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.error) {
    fail(`no se pudo ejecutar ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`falló ${command} ${args.join(' ')}`);
  }
}

async function validateApi() {
  const value = process.env.VITE_API_BASE_URL?.trim();
  if (!value) {
    fail('define VITE_API_BASE_URL con el dominio HTTPS real del piloto.');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    fail('VITE_API_BASE_URL no es una URL válida.');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !url.hostname.includes('.') ||
    isIP(url.hostname) ||
    url.hostname.endsWith('.local') ||
    url.hostname.endsWith('.invalid') ||
    ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
  ) {
    fail('VITE_API_BASE_URL debe ser el origen HTTPS público, sin rutas ni credenciales.');
  }

  let response;
  try {
    response = await fetch(new URL('/health', url), {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    fail(`no se pudo comprobar ${url.origin}/health: ${error.message}`);
  }
  if (!response.ok) {
    fail(`${url.origin}/health respondió HTTP ${response.status}.`);
  }
  let health;
  try {
    health = await response.json();
  } catch {
    fail(`${url.origin}/health no devolvió JSON válido.`);
  }
  if (health.status !== 'ok') {
    fail(`${url.origin}/health no confirmó el estado esperado.`);
  }
  console.log(`API HTTPS verificada: ${url.origin}`);
  return url.origin;
}

async function validateSigning() {
  let propertiesText;
  try {
    propertiesText = await readFile(propertiesPath, 'utf8');
  } catch {
    fail(`crea el archivo de firma privado ${propertiesPath}.`);
  }
  const properties = new Map(
    propertiesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return separator < 0
          ? [line, '']
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
  const missing = ['storePassword', 'keyAlias', 'keyPassword']
    .filter((name) => !properties.get(name));
  if (missing.length) {
    fail(`completa ${missing.join(', ')} en ${propertiesPath}.`);
  }
  try {
    await readFile(keystorePath);
  } catch {
    fail(`no se encuentra el almacén de firma privado ${keystorePath}.`);
  }
}

async function findInstaller() {
  const files = await readdir(windowsBundleDirectory);
  const installers = files.filter((name) => name.toLowerCase().endsWith('.exe'));
  if (installers.length !== 1) {
    fail(`se esperaba un instalador NSIS en ${windowsBundleDirectory}; se encontraron ${installers.length}.`);
  }
  return join(windowsBundleDirectory, installers[0]);
}

if (process.platform !== 'win32') {
  fail('ejecuta este empaquetado conjunto desde Windows para generar el instalador NSIS.');
}
if (!existsSync(androidSdkRoot)) {
  fail(`no se encontró el Android SDK en ${androidSdkRoot}; configura ANDROID_HOME.`);
}
try {
  await access(outputDirectory);
  fail(`${outputDirectory} ya existe; archiva o renombra ese paquete antes de crear otro.`);
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error;
  }
}
const apiOrigin = await validateApi();
await validateSigning();
run(npmCommand, ['run', 'cap:sync']);
run(join(androidDirectory, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'), ['assembleRelease'], androidDirectory);
run(npmCommand, ['run', 'tauri', '--', 'build', '--bundles', 'nsis']);

const apkPath = join(androidBuildDirectory, 'app-release.apk');
const installerPath = await findInstaller();
await mkdir(outputDirectory, { recursive: false }).catch((error) => {
  if (error.code !== 'EEXIST') {
    throw error;
  }
  fail(`${outputDirectory} ya existe; archiva o renombra ese paquete antes de crear otro.`);
});

const apkOutput = join(outputDirectory, 'TasadorMVP-Android-2.0.0.apk');
const installerOutput = join(outputDirectory, 'TasadorMVP-Windows-2.0.0-Setup.exe');
await copyFile(apkPath, apkOutput);
await copyFile(installerPath, installerOutput);

const checksums = [];
for (const path of [apkOutput, installerOutput]) {
  const contents = await readFile(path);
  const digest = createHash('sha256').update(contents).digest('hex');
  checksums.push(`${digest}  ${path.split(/[\\/]/).at(-1)}`);
}
await writeFile(join(outputDirectory, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`, 'utf8');
await writeFile(
  join(outputDirectory, 'INSTALACION.txt'),
  [
    'Tasador MVP 2.0.0 - piloto privado',
    '',
    `Servidor HTTPS del piloto: ${apiOrigin}`,
    '',
    'Android: instala TasadorMVP-Android-2.0.0.apk en un dispositivo Android.',
    'Windows: ejecuta TasadorMVP-Windows-2.0.0-Setup.exe.',
    'Comprueba los archivos con los hashes SHA-256 de SHA256SUMS.txt.',
    '',
    'Windows: el instalador no está firmado con un certificado comercial y puede mostrarse como editor desconocido.',
    'No ignores advertencias de seguridad del sistema operativo; detén la instalación si Windows bloquea el archivo.',
    '',
    'Usa datos ficticios durante el piloto hasta verificar privacidad y copias de seguridad.',
    'No compartas estos paquetes públicamente: son para los tasadores invitados.',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`Paquetes preparados en ${outputDirectory}`);
