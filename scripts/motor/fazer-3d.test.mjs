// Teste do fazer-3d: o vídeo de atração para com "falta a tela N" quando a imagem de uma tela do Fio não existe.
// Rodar de videos/: node --test scripts/motor/fazer-3d.test.mjs
// Usa --telas-prontas (não gera as telas, só confere as que estão em public/motor/<id>/) para o teste ser rápido e
// não depender do Remotion; a conferência acontece antes da voz, então também não precisa de internet.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ID = "teste-falta-tela";
const pasta = join("public", "motor", ID);

test("fazer-3d sai com código 1 e 'falta a tela 2' quando a tela 2 não existe", () => {
  const r = JSON.parse(readFileSync("diario/teste/pecas/3d-vitrine.json", "utf8"));
  r.id = ID;
  const json = join(tmpdir(), `${ID}-${process.pid}.json`);
  writeFileSync(json, JSON.stringify(r));
  rmSync(pasta, { recursive: true, force: true });
  mkdirSync(pasta, { recursive: true });
  // só a tela 1 e a 3 existem (o conteúdo não importa: o script só confere se o arquivo está lá)
  for (const n of [1, 3]) writeFileSync(join(pasta, `tela-${n}.png`), "png de teste");
  try {
    const p = spawnSync(process.execPath, ["scripts/motor/fazer-3d.mjs", json, "--so-quadros", "--telas-prontas"], { encoding: "utf8" });
    assert.equal(p.status, 1, p.stdout + p.stderr);
    assert.match(p.stderr, /falta a tela 2/);
    assert.doesNotMatch(p.stderr, /falta a tela [13]/);
    assert.doesNotMatch(p.stdout, /voz/, "parou antes da voz");
  } finally {
    rmSync(pasta, { recursive: true, force: true });
    rmSync(json, { force: true });
  }
});
