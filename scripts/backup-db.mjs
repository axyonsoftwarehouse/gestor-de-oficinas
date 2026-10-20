import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  ROOT,
  describeDatabase,
  encryptFile,
  findExecutable,
  formatBytes,
  keyId,
  loadEnvFile,
  parseInteger,
  pgEnvFromUrl,
  run,
  writeChecksum,
} from "./lib/backup-lib.mjs";

if (process.platform !== "win32") process.umask(0o077);

const args = new Set(process.argv.slice(2));
const known = new Set([
  "--upload",
  "--prune",
  "--no-encrypt",
  "--keep-plain",
  "--dry-run",
  "--help",
  "-h",
]);

function usage() {
  console.log(`Uso: node scripts/backup-db.mjs [opções]

Gera um dump custom do PostgreSQL, cifra com AES-256-GCM e opcionalmente
envia para um bucket S3-compatível.

Variáveis:
  BACKUP_DATABASE_URL       URL direta do banco (fallback: DIRECT_URL, DATABASE_URL)
  BACKUP_ENCRYPTION_KEY     frase secreta com 32+ caracteres (obrigatória sem --no-encrypt)
  BACKUP_DIR                diretório local (padrão: .backups)
  BACKUP_S3_BUCKET          bucket de destino
  BACKUP_S3_ENDPOINT        endpoint S3-compatível (R2, B2, MinIO...)
  BACKUP_S3_REGION          região do bucket (padrão: auto)
  BACKUP_S3_PREFIX          prefixo das chaves (padrão: gestor-oficinas)
  AWS_ACCESS_KEY_ID         credencial de upload
  AWS_SECRET_ACCESS_KEY     credencial de upload
  BACKUP_RETENTION_DAYS     retenção diária (padrão: 30)
  BACKUP_MONTHLY_RETENTION_DAYS  retenção mensal (padrão: 365)
  PG_DUMP / PG_RESTORE      caminhos opcionais dos binários

Opções:
  --upload      envia dump, checksum e manifesto ao bucket
  --prune       remove backups fora da retenção (exige --upload)
  --no-encrypt  gera dump sem cifra (apenas local/teste)
  --keep-plain  mantém o .dump sem cifra após cifrar
  --dry-run     simula upload e remoção
  --help        mostra esta ajuda`);
}

function fail(message) {
  throw new Error(message);
}

function backupBaseFromKey(key) {
  const name = key.split("/").pop() ?? "";
  const match = name.match(
    /^(gestor-oficinas_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\./,
  );
  return match ? match[1] : null;
}

function dateFromBase(base) {
  const match = base.match(
    /^gestor-oficinas_(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/,
  );
  if (!match) return null;
  return new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6]),
    ),
  );
}

async function pruneBackups({
  aws,
  awsEnv,
  bucket,
  prefix,
  endpointArgs,
  dailyDays,
  monthlyDays,
  dryRun,
}) {
  const { stdout } = await run(
    aws,
    [
      "s3api",
      "list-objects-v2",
      "--bucket",
      bucket,
      "--prefix",
      `${prefix}/`,
      "--paginate",
      "--query",
      "Contents[].[Key,LastModified]",
      "--output",
      "text",
      ...endpointArgs,
    ],
    { env: awsEnv },
  );
  const groups = new Map();
  for (const line of stdout
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)) {
    const [key] = line.split("\t");
    const base = backupBaseFromKey(key);
    const date = base ? dateFromBase(base) : null;
    if (!base || !date) continue;
    if (!groups.has(base)) groups.set(base, { date, keys: [] });
    groups.get(base).keys.push(key);
  }

  const now = Date.now();
  let removed = 0;
  for (const group of groups.values()) {
    const ageDays = (now - group.date.getTime()) / 86_400_000;
    const monthly = group.date.getUTCDate() === 1;
    const limit = monthly ? monthlyDays : dailyDays;
    if (ageDays <= limit) continue;
    for (const key of group.keys) {
      if (dryRun) {
        console.log(`[dry-run] removeria s3://${bucket}/${key}`);
      } else {
        await run(
          aws,
          [
            "s3",
            "rm",
            `s3://${bucket}/${key}`,
            ...endpointArgs,
            "--only-show-errors",
          ],
          { env: awsEnv },
        );
      }
      removed++;
    }
  }
  return { groups: groups.size, removed };
}

async function main() {
  for (const arg of args) {
    if (!known.has(arg)) fail(`opção desconhecida: ${arg}`);
  }
  if (args.has("--help") || args.has("-h")) {
    usage();
    return;
  }

  loadEnvFile();

  const upload = args.has("--upload");
  const prune = args.has("--prune");
  const dryRun = args.has("--dry-run");
  const noEncrypt = args.has("--no-encrypt");
  const keepPlain = args.has("--keep-plain");

  if (prune && !upload) fail("--prune exige --upload.");
  if (upload && noEncrypt)
    fail("não envie backup sem cifra; remova --no-encrypt.");
  if (upload && dryRun)
    console.log("Modo dry-run: nenhum objeto será enviado ou removido.");

  const dbUrl =
    process.env.BACKUP_DATABASE_URL ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL;
  if (!dbUrl) {
    fail(
      "defina BACKUP_DATABASE_URL (recomendado), DIRECT_URL ou DATABASE_URL.",
    );
  }
  const connection = pgEnvFromUrl(dbUrl);
  if (connection.host.includes("-pooler.")) {
    console.warn(
      "Aviso: host de pooler detectado; para pg_dump use a conexão direta (porta 5432).",
    );
  }

  const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (!encryptionKey && !noEncrypt) {
    fail(
      "defina BACKUP_ENCRYPTION_KEY com 32+ caracteres (ou use --no-encrypt em teste local).",
    );
  }
  if (encryptionKey && encryptionKey.length < 32) {
    console.warn("Aviso: BACKUP_ENCRYPTION_KEY tem menos de 32 caracteres.");
  }

  const pgDump = findExecutable("pg_dump", "PG_DUMP", true);
  const pgRestore = findExecutable("pg_restore", "PG_RESTORE", true);
  const outDir = path.resolve(
    process.env.BACKUP_DIR || path.join(ROOT, ".backups"),
  );
  mkdirSync(outDir, { recursive: true });

  const now = new Date();
  const stamp = now
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/:/g, "-");
  const baseName = `gestor-oficinas_${stamp}`;
  const dumpPath = path.join(outDir, `${baseName}.dump`);

  console.log(`Banco: ${describeDatabase(connection)}`);
  console.log(`Saída: ${outDir}`);

  const dumpVersion = (await run(pgDump, ["--version"])).stdout.trim();
  console.log(`${dumpVersion}`);
  console.log("Gerando dump custom...");
  await run(
    pgDump,
    [
      "--format=custom",
      "--compress=9",
      "--no-owner",
      "--no-privileges",
      "--no-password",
      "--file",
      dumpPath,
    ],
    { env: connection.env },
  );
  if (!existsSync(dumpPath) || statSync(dumpPath).size === 0) {
    fail("pg_dump não produziu um arquivo válido.");
  }

  const toc = await run(pgRestore, ["--list", dumpPath]);
  const tocEntries = toc.stdout
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith(";")).length;
  console.log(`Dump verificado: ${tocEntries} entradas no TOC.`);

  let finalPath = dumpPath;
  let encrypted = false;
  let keyFingerprint = null;
  if (!noEncrypt) {
    finalPath = `${dumpPath}.enc`;
    keyFingerprint = await keyId(encryptionKey);
    console.log("Cifrando com AES-256-GCM...");
    await encryptFile(dumpPath, finalPath, encryptionKey);
    if (!keepPlain) rmSync(dumpPath, { force: true });
    encrypted = true;
  } else {
    console.warn("Backup sem cifra. Use apenas para teste local.");
  }

  const sha256 = await writeChecksum(finalPath);
  const size = statSync(finalPath).size;

  let aws = null;
  let awsEnv = null;
  let endpointArgs = [];
  let s3Info = null;
  const bucket = process.env.BACKUP_S3_BUCKET?.trim();

  if (upload || prune) {
    if (!bucket) fail("defina BACKUP_S3_BUCKET para enviar ou podar backups.");
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      fail("defina AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.");
    }
    aws = findExecutable("aws", "AWS_CLI");
    const region =
      process.env.BACKUP_S3_REGION || process.env.AWS_REGION || "auto";
    awsEnv = { ...process.env, AWS_DEFAULT_REGION: region };
    const endpoint = process.env.BACKUP_S3_ENDPOINT?.trim();
    if (!endpoint && region === "auto") {
      console.warn(
        "Aviso: região auto só é válida em R2; configure BACKUP_S3_REGION para AWS S3.",
      );
    }
    endpointArgs = endpoint ? ["--endpoint-url", endpoint] : [];
    const prefix = (process.env.BACKUP_S3_PREFIX || "gestor-oficinas").replace(
      /^\/+|\/+$/g,
      "",
    );
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const keyPrefix = `${prefix}/${year}/${month}`;
    s3Info = {
      bucket,
      prefix,
      keyPrefix,
      endpoint: endpoint || null,
      region,
      key: `${keyPrefix}/${path.basename(finalPath)}`,
    };
  }

  const manifest = {
    formatVersion: 1,
    createdAt: now.toISOString(),
    baseName,
    database: {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      user: connection.user,
    },
    pgDumpVersion: dumpVersion,
    encrypted,
    encryption: encrypted
      ? { algorithm: "aes-256-gcm", kdf: "scrypt", keyId: keyFingerprint }
      : null,
    file: {
      name: path.basename(finalPath),
      sizeBytes: size,
      sha256,
    },
    git: {
      sha: process.env.GITHUB_SHA || null,
      ref: process.env.GITHUB_REF_NAME || null,
    },
    s3: s3Info,
  };
  const manifestPath = `${finalPath}.manifest.json`;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (upload) {
    const files = [finalPath, `${finalPath}.sha256`, manifestPath];
    for (const file of files) {
      const key = `${s3Info.keyPrefix}/${path.basename(file)}`;
      if (dryRun) {
        console.log(
          `[dry-run] enviaria ${path.basename(file)} para s3://${bucket}/${key}`,
        );
        continue;
      }
      await run(
        aws,
        [
          "s3",
          "cp",
          file,
          `s3://${bucket}/${key}`,
          ...endpointArgs,
          "--only-show-errors",
        ],
        { env: awsEnv },
      );
      console.log(`Enviado: s3://${bucket}/${key}`);
    }
  }

  let pruned = null;
  if (prune) {
    const dailyDays = parseInteger(
      process.env.BACKUP_RETENTION_DAYS,
      30,
      "BACKUP_RETENTION_DAYS",
    );
    const monthlyDays = parseInteger(
      process.env.BACKUP_MONTHLY_RETENTION_DAYS,
      365,
      "BACKUP_MONTHLY_RETENTION_DAYS",
    );
    pruned = await pruneBackups({
      aws,
      awsEnv,
      bucket,
      prefix: s3Info.prefix,
      endpointArgs,
      dailyDays,
      monthlyDays,
      dryRun,
    });
    console.log(
      `Retenção: ${pruned.groups} backups avaliados, ${pruned.removed} objeto(s) ${dryRun ? "seriam removidos" : "removidos"}.`,
    );
  }

  console.log("");
  console.log(`Backup: ${finalPath}`);
  console.log(`Tamanho: ${formatBytes(size)}`);
  console.log(`SHA-256: ${sha256}`);
  if (encrypted) console.log(`Chave (fingerprint): ${keyFingerprint}`);
  if (s3Info) console.log(`Destino: s3://${s3Info.bucket}/${s3Info.key}`);
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
