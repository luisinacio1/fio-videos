// Testes do conferidor do que vai a público. Cada teste monta uma pasta temporária com seu próprio git.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const conferidor = join(aqui, "conferir-publico.mjs");
const publicarReal = join(aqui, "..", "motor", "publicar.mjs");

function pasta(arquivos) {
  const dir = mkdtempSync(join(tmpdir(), "confere-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const caminho = join(dir, nome);
    mkdirSync(dirname(caminho), { recursive: true });
    writeFileSync(caminho, conteudo);
  }
  return dir;
}
function conferir(dir) {
  return spawnSync(process.execPath, [conferidor, dir], { encoding: "utf8" });
}
const limpar = (...dirs) => dirs.forEach((d) => rmSync(d, { recursive: true, force: true }));

// valores falsos montados na hora, para este arquivo não casar com os padrões
const fakeAnt = "sk" + "-ant-" + "a1B2c3D4e5F6g7H8i9J0k1L2";
const fakeJwt = "eyJ" + "hbGciOi" + "JIUzI1NiIsInR5cCI6IkpXVCJ9abcdef";

test("barra arquivo com chave sk-ant", () => {
  const dir = pasta({ "a.txt": `chave = ${fakeAnt}\n` });
  const r = conferir(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /a\.txt:1/);
  assert.ok(!(r.stdout + r.stderr).includes(fakeAnt));
  limpar(dir);
});

test("barra JWT", () => {
  const dir = pasta({ "x/b.js": `const t = "${fakeJwt}";\n` });
  const r = conferir(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /x\/b\.js:1/);
  limpar(dir);
});

test("barra arquivo dentro de narracoes/", () => {
  const dir = pasta({ "narracoes/um.txt": "oi\n" });
  const r = conferir(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /narracoes\/um\.txt/);
  limpar(dir);
});

test("barra pasta proibida de public e .env.local", () => {
  const dir = pasta({ "public/v13/a.json": "{}\n", ".env.local": "X=1\n" });
  const r = conferir(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /public\/v13\/a\.json/);
  assert.match(r.stdout + r.stderr, /\.env\.local/);
  limpar(dir);
});

// nomes montados na hora, para este arquivo não casar com o conferidor
const IG = "INSTAGRAM" + "_TOKEN";
const SR = "SUPABASE_SERVICE" + "_ROLE_KEY";
const FK = "FIO_SUPABASE_SERVICE" + "_KEY";

test("barra atribuição de token com valor e aceita vazio ou secrets", () => {
  const ruim = pasta({ "c.sh": `${IG}=abc123segredo\n` });
  assert.equal(conferir(ruim).status, 1);
  const ruim2 = pasta({ "d.sh": `${SR}="xyz789"\n` });
  assert.equal(conferir(ruim2).status, 1);
  const bom = pasta({
    "e.yml": `${IG}=\n${IG}: \${{ secrets.${IG} }}\n${FK}=\${{ secrets.${FK} }}\n`,
  });
  const r = conferir(bom);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  limpar(ruim, ruim2, bom);
});

test("barra token da Meta, segredo do app e token OAuth do Claude Code", () => {
  const meta = pasta({ "m.txt": `t = ${"EAA" + "B1c2D3e4F5g6H7i8J9k0L1m2N3o4P5q6R7s8T9u0V1w2"}\n` });
  assert.equal(conferir(meta).status, 1);
  const app = pasta({ "n.sh": `${"INSTAGRAM_APP" + "_SECRET"}=valor123\n` });
  assert.equal(conferir(app).status, 1);
  const oauth = pasta({ "o.sh": `${"CLAUDE_CODE_OAUTH" + "_TOKEN"}=valor123\n` });
  assert.equal(conferir(oauth).status, 1);
  const bom = pasta({ "p.yml": `${"CLAUDE_CODE_OAUTH" + "_TOKEN"}=\${{ secrets.X }}\n${"INSTAGRAM_APP" + "_SECRET"}=\n` });
  assert.equal(conferir(bom).status, 0);
  limpar(meta, app, oauth, bom);
});

test("aceita scripts/motor/publicar.mjs, que só lê process.env.FIO_SUPABASE_SERVICE_KEY", () => {
  const dir = pasta({});
  mkdirSync(join(dir, "scripts/motor"), { recursive: true });
  copyFileSync(publicarReal, join(dir, "scripts/motor/publicar.mjs"));
  const r = conferir(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /pronto para publicar: 1 arquivos/);
  limpar(dir);
});

test("ignora binários e respeita .gitignore", () => {
  const dir = pasta({ ".gitignore": "ignorado.txt\n", "ignorado.txt": `${fakeAnt}\n` });
  writeFileSync(join(dir, "v.mp4"), Buffer.from(fakeAnt));
  const r = conferir(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  limpar(dir);
});
