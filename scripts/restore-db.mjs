import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  decryptFile,
  describeDatabase,
  findExecutable,
  loadEnvFile,
  pgEnvFromUrl,
  run,
  verifyChecksum,
} from "./lib/backup-lib.mjs";

function usage() {
  console.log(`Uso: node scripts/restore-db.mjs <arquivo> [opções]

Sem --restore, apenas verifica o checksum e o conteúdo do dump.

Opções:
  --file <arquivo>    caminho do .dump ou .dump.enc
  --verify            somente verificação (padrão)
  --restore           restaura o dump no banco alvo
  --target <url>      URL do banco alvo (ou RESTORE_DATABASE_URL)
  --clean             remove objetos existentes antes de restaurar
  --yes               confirma a restauração
  --force             permite restaurar no mesmo banco de origem
  --help              mostra esta ajuda

Variáveis:
  BACKUP_ENCRYPTION_KEY  obrigatória para arquivos .enc
  RESTORE_DATABASE_URL   alternativa a --target
  PG_RESTORE             caminho opcional do pg_restore`);
}

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = { positionals: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--file" || arg === "--target") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) fail(`${arg} exige um valor.`);
      result[arg.slice(2)] = value;
      continue;
    }
    if (
      arg === "--verify" ||
      arg === "--restore" ||
      arg === "--yes" ||
      arg === "--clean" ||
      arg === "--force" ||
      arg === "--help" ||
      arg === "-h"
    ) {
      result[arg === "-h" ? "help" : arg.slice(2)] = true;
      continue;
    }
    if (arg.startsWith("--")) fail(`opção desconhecida: ${arg}`);
    result.positionals.push(arg);
  }
  return result;
}

function sameDatabase(first, second) {
  const a = new URL(first);
  const b = new URL(second);
  return (
    a.hostname === b.hostname &&
    (a.port || "5432") === (b.port || "5432") &&
    a.pathname === b.pathname &&
    a.username === b.username
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }
  if (options.verify && options.restore)
    fail("use --verify ou --restore, não ambos.");
  if (options.clean && !options.restore) fail("--clean exige --restore.");

  loadEnvFile();
  const file = options.file || options.positionals[0];
  if (!file) fail("informe o arquivo do backup (--file <arquivo>).");
  const backupPath = path.resolve(file);
  if (!existsSync(backupPath)) fail(`arquivo não encontrado: ${backupPath}`);

  const checksum = await verifyChecksum(backupPath);
  if (checksum.ok) {
    console.log(`Checksum OK: ${checksum.actual}`);
  } else if (checksum.reason) {
    console.warn(
      `Aviso: ${checksum.reason}; a integridade não pôde ser conferida.`,
    );
  } else {
    fail(
      `checksum não confere (esperado ${checksum.expected}, obtido ${checksum.actual}).`,
    );
  }

  let tempDir = null;
  let dumpPath = backupPath;
  try {
    if (backupPath.endsWith(".enc")) {
      const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
      if (!encryptionKey)
        fail("defina BACKUP_ENCRYPTION_KEY para decifrar o backup.");
      tempDir = await mkdtemp(path.join(tmpdir(), "gestor-restore-"));
      dumpPath = path.join(
        tempDir,
        path.basename(backupPath).replace(/\.enc$/, ""),
      );
      console.log("Decifrando backup...");
      await decryptFile(backupPath, dumpPath, encryptionKey);
    }

    const pgRestore = findExecutable("pg_restore", "PG_RESTORE", true);
    const toc = await run(pgRestore, ["--list", dumpPath]);
    const entries = toc.stdout
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith(";")).length;
    console.log(`Dump legível: ${entries} entradas no TOC.`);

    if (!options.restore) {
      console.log("Verificação concluída; nenhuma restauração foi executada.");
      return;
    }

    if (!options.yes) {
      fail(
        "a restauração altera o banco alvo; repita com --yes após conferir o destino.",
      );
    }
    const targetUrl = options.target || process.env.RESTORE_DATABASE_URL;
    if (!targetUrl) fail("informe --target ou defina RESTORE_DATABASE_URL.");
    const sourceUrl =
      process.env.BACKUP_DATABASE_URL ||
      process.env.DIRECT_URL ||
      process.env.DATABASE_URL;
    if (sourceUrl && sameDatabase(sourceUrl, targetUrl) && !options.force) {
      fail(
        "o alvo é o mesmo banco de origem; use --force apenas se for intencional.",
      );
    }

    const target = pgEnvFromUrl(targetUrl);
    console.log(`Alvo: ${describeDatabase(target)}`);
    if (options.clean)
      console.log("Atenção: --clean removerá objetos existentes no alvo.");
    await run(
      pgRestore,
      [
        "--no-owner",
        "--no-privileges",
        "--no-password",
        "--exit-on-error",
        "--dbname",
        target.database,
        ...(options.clean ? ["--clean", "--if-exists"] : []),
        dumpPath,
      ],
      { env: target.env },
    );
    console.log("Restauração concluída.");
    console.log(
      "Em banco novo, aplique o papel e a RLS com a conexão direta do alvo:",
    );
    console.log("  pnpm --filter @gestor/database db:app-role:direct");
    console.log("  pnpm --filter @gestor/database db:rls:direct");
    console.log(
      "Depois valide login, /api/health e a contagem das tabelas principais.",
    );
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
