import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  decryptFile,
  encryptFile,
  keyId,
  verifyChecksum,
  writeChecksum,
} from "./backup-lib.mjs";

const KEY = "test-only-backup-key-0123456789abcdef";

test("cifra e decifra um arquivo", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "gestor-backup-test-"));
  try {
    const source = path.join(dir, "source.dump");
    const encrypted = path.join(dir, "source.dump.enc");
    const restored = path.join(dir, "restored.dump");
    const content = Buffer.from("conteudo de teste do backup");
    await writeFile(source, content);
    await encryptFile(source, encrypted, KEY);
    await decryptFile(encrypted, restored, KEY);
    assert.deepEqual(await readFile(restored), content);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejeita chave incorreta", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "gestor-backup-test-"));
  try {
    const source = path.join(dir, "source.dump");
    const encrypted = path.join(dir, "source.dump.enc");
    const restored = path.join(dir, "restored.dump");
    await writeFile(source, "conteudo");
    await encryptFile(source, encrypted, KEY);
    await assert.rejects(
      decryptFile(encrypted, restored, "outra-chave-de-teste-0123456789abcdef"),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("grava e confere o checksum", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "gestor-backup-test-"));
  try {
    const source = path.join(dir, "source.dump");
    await writeFile(source, "conteudo");
    const hash = await writeChecksum(source);
    const result = await verifyChecksum(source);
    assert.equal(result.ok, true);
    assert.equal(result.expected, hash);
    assert.equal(result.actual, hash);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("keyId é estável e distingue chaves", async () => {
  const first = await keyId(KEY);
  const second = await keyId(KEY);
  const other = await keyId("outra-chave-de-teste-0123456789abcdef");
  assert.match(first, /^[0-9a-f]{12}$/);
  assert.equal(first, second);
  assert.notEqual(first, other);
});
