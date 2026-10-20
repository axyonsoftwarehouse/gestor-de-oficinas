import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
} from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  readFileSync,
} from "node:fs";
import { appendFile, mkdir, open, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

const MAGIC = Buffer.from("GESTORDB1", "ascii");
const SALT_SIZE = 16;
const IV_SIZE = 12;
const TAG_SIZE = 16;
const HEADER_SIZE = MAGIC.length + SALT_SIZE + IV_SIZE;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scryptAsync = promisify(scrypt);

export function loadEnvFile(file = path.join(ROOT, ".env")) {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function findExecutable(name, envVar, allowPortablePostgres = false) {
  if (envVar && process.env[envVar]) return process.env[envVar];
  if (allowPortablePostgres) {
    const portable = path.join(
      ROOT,
      ".pgtest",
      "pgsql",
      "bin",
      process.platform === "win32" ? `${name}.exe` : name,
    );
    if (existsSync(portable)) return portable;
  }
  const locator = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(locator, [name], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status === 0) {
    const found = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
    if (found) return found;
  }
  const hint = allowPortablePostgres
    ? " Instale o cliente PostgreSQL ou rode pnpm db:test:up para usar o binário portátil."
    : "";
  throw new Error(`Executável "${name}" não encontrado.${hint}`);
}

export function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    if (options.input !== undefined) child.stdin.end(options.input);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const detail = (stderr || stdout).trim();
      reject(
        new Error(
          `${path.basename(command)} saiu com código ${code}${detail ? `: ${detail}` : ""}`,
        ),
      );
    });
  });
}

export function pgEnvFromUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("URL do PostgreSQL inválida.");
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(
      "A URL do banco deve começar com postgresql:// ou postgres://.",
    );
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !url.username || !database) {
    throw new Error(
      "URL do PostgreSQL incompleta (host, usuário e banco são obrigatórios).",
    );
  }
  const env = { ...process.env };
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  env.PGHOST = url.hostname;
  env.PGPORT = url.port || "5432";
  env.PGUSER = decodeURIComponent(url.username);
  env.PGPASSWORD = decodeURIComponent(url.password);
  env.PGDATABASE = database;
  env.PGSSLMODE =
    url.searchParams.get("sslmode") || (localHost ? "prefer" : "require");
  env.PGCONNECT_TIMEOUT = url.searchParams.get("connect_timeout") || "15";
  const channelBinding = url.searchParams.get("channel_binding");
  if (channelBinding) env.PGCHANNELBINDING = channelBinding;
  delete env.DATABASE_URL;
  delete env.DIRECT_URL;
  delete env.APP_DATABASE_URL;
  return {
    env,
    host: url.hostname,
    port: env.PGPORT,
    database,
    user: env.PGUSER,
    sslmode: env.PGSSLMODE,
  };
}

export function describeDatabase(connection) {
  return `${connection.user}@${connection.host}:${connection.port}/${connection.database}`;
}

export async function keyId(passphrase) {
  const derived = await scryptAsync(
    passphrase,
    "gestor-backup-key-id",
    32,
    SCRYPT_OPTIONS,
  );
  return createHash("sha256").update(derived).digest("hex").slice(0, 12);
}

export async function encryptFile(input, output, passphrase) {
  const salt = randomBytes(SALT_SIZE);
  const iv = randomBytes(IV_SIZE);
  const key = await scryptAsync(passphrase, salt, 32, SCRYPT_OPTIONS);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(MAGIC);
  const stream = createWriteStream(output, { mode: 0o600 });
  stream.write(Buffer.concat([MAGIC, salt, iv]));
  try {
    await pipeline(createReadStream(input), cipher, stream);
    await appendFile(output, cipher.getAuthTag());
  } catch (error) {
    await rm(output, { force: true });
    throw error;
  }
}

export async function decryptFile(input, output, passphrase) {
  const info = await stat(input);
  if (info.size <= HEADER_SIZE + TAG_SIZE) {
    throw new Error("Arquivo cifrado inválido ou truncado.");
  }
  const header = Buffer.alloc(HEADER_SIZE);
  const tag = Buffer.alloc(TAG_SIZE);
  const handle = await open(input, "r");
  try {
    await handle.read(header, 0, HEADER_SIZE, 0);
    await handle.read(tag, 0, TAG_SIZE, info.size - TAG_SIZE);
  } finally {
    await handle.close();
  }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error("Formato de backup não reconhecido.");
  }
  const salt = header.subarray(MAGIC.length, MAGIC.length + SALT_SIZE);
  const iv = header.subarray(MAGIC.length + SALT_SIZE, HEADER_SIZE);
  const key = await scryptAsync(passphrase, salt, 32, SCRYPT_OPTIONS);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(MAGIC);
  decipher.setAuthTag(tag);
  try {
    await pipeline(
      createReadStream(input, {
        start: HEADER_SIZE,
        end: info.size - TAG_SIZE - 1,
      }),
      decipher,
      createWriteStream(output, { mode: 0o600 }),
    );
  } catch (error) {
    await rm(output, { force: true });
    throw new Error(
      `Falha ao decifrar (chave incorreta ou arquivo corrompido): ${error.message}`,
    );
  }
}

export function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

export async function writeChecksum(file) {
  const hash = await sha256File(file);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(`${file}.sha256`, `${hash}  ${path.basename(file)}\n`);
  return hash;
}

export function readChecksum(file) {
  const checksumPath = `${file}.sha256`;
  if (!existsSync(checksumPath)) return null;
  const [hash] = readFileSync(checksumPath, "utf8").trim().split(/\s+/);
  return hash || null;
}

export async function verifyChecksum(file) {
  const expected = readChecksum(file);
  if (!expected) return { ok: false, reason: "arquivo .sha256 não encontrado" };
  const actual = await sha256File(file);
  return {
    ok: actual === expected,
    expected,
    actual,
  };
}

export function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

export function parseInteger(value, fallback, name) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} deve ser um inteiro positivo.`);
  }
  return parsed;
}
