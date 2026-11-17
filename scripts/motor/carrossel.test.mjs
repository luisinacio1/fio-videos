// Testes do script do carrossel (rodar com: node --test scripts/motor/carrossel.test.mjs)
// Só a conferência (--so-conferir): sem desenhar e sem rede. Roda numa pasta temporária com o banco do barbeiro.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(RAIZ, "scripts", "motor", "carrossel.mjs");
const EXEMPLO = JSON.parse(readFileSync(join(RAIZ, "diario", "teste", "carrossel.json"), "utf8"));
const DIA = "2099-01-01";

function rodar(roteiro) {
  const pasta = mkdtempSync(join(tmpdir(), "fio-carrossel-"));
  try {
    mkdirSync(join(pasta, "diario", "banco"), { recursive: true });
    copyFileSync(join(RAIZ, "diario", "banco", "barbeiro.json"), join(pasta, "diario", "banco", "barbeiro.json"));
    if (roteiro) {
      mkdirSync(join(pasta, "diario", DIA));
      writeFileSync(join(pasta, "diario", DIA, "carrossel.json"), JSON.stringify(roteiro));
    }
    return spawnSync(process.execPath, [SCRIPT, DIA, "--so-conferir"], { cwd: pasta, encoding: "utf8" });
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

test("roteiro válido passa na conferência", () => {
  const r = rodar(EXEMPLO);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /carrossel ok/);
});

test("palavra proibida sai com código 1", () => {
  const ruim = structuredClone(EXEMPLO);
  ruim.slides[2].paragrafos[0] = "Um sistema resolve.";
  const r = rodar(ruim);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /✗/);
});

test("sem o arquivo do dia sai com código 1", () => {
  const r = rodar(null);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /falta diario\/2099-01-01\/carrossel\.json/);
});
