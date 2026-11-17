// O passo que grava no banco depois que o Claude escreveu (sem a chave) os arquivos em out/blog/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { finalizar } from "./blog.mjs";

const TEMA = { id: "tema-1", palavra_chave: "como organizar a semana da barbearia", intencao: "x", link_alvo: "/agenda-para-barbearia" };
const paragrafo = "O barbeiro que organiza a semana com antecedência consegue atender melhor, perde menos tempo no celular e sabe quanto vai entrar no caixa antes do sábado chegar.";
const corpo = ["## Um", "## Dois", "## Três"].flatMap((h) => [h, ...Array(12).fill(paragrafo)]).join("\n\n") + "\n\nVeja a [agenda](/agenda-para-barbearia) e o [blog](/blog).";
const POST = {
  slug: "como-organizar-a-semana-da-barbearia",
  palavra_chave: TEMA.palavra_chave,
  titulo: "Como organizar a semana da barbearia",
  h1: "Como organizar a semana da barbearia sem correria",
  descricao: "Um jeito simples de organizar a semana da barbearia: horários, folgas, dias cheios e o que fazer quando o cliente some sem avisar antes.",
  perguntas: [["a?", "b."], ["c?", "d."], ["e?", "f."]],
  fontes: [],
};

/** Pasta como a que o Claude deixa: contexto salvo antes dele, e os arquivos que ele escreveu. */
function pasta(arquivos) {
  const dir = mkdtempSync(join(tmpdir(), "blog-"));
  writeFileSync(join(dir, "contexto.json"), JSON.stringify({ dia: "2026-11-20", jaTemPost: false, tema: TEMA, temasLivres: 30 }));
  for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(dir, nome), typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo));
  return dir;
}

/** Banco de mentira: guarda o que foi pedido e responde as leituras. */
function bancoFalso({ temPost = false } = {}) {
  const chamadas = [];
  async function api(caminho, opcoes = {}) {
    const metodo = opcoes.method ?? "GET";
    chamadas.push({ metodo, caminho, corpo: opcoes.body ? JSON.parse(opcoes.body) : null });
    if (metodo !== "GET") return null;
    if (caminho.startsWith("/rest/v1/post_blog?select=id&dia=")) return temPost ? [{ id: "x" }] : [];
    if (caminho.startsWith("/rest/v1/tema_blog?select=id,")) return [{ ...TEMA, id: "outro-tema-mais-novo" }];
    return [];
  }
  return { api, chamadas, escritas: () => chamadas.filter((c) => c.metodo !== "GET") };
}

test("grava o post com o tema do contexto salvo e marca esse tema como usado", async () => {
  const b = bancoFalso();
  await finalizar(b.api, "2026-11-20", pasta({ "post.json": { ...POST, corpo_arquivo: "corpo.md" }, "corpo.md": corpo }));
  const [post, tema, execucao] = b.escritas();
  assert.equal(post.caminho, "/rest/v1/post_blog");
  assert.equal(post.corpo.tema_id, "tema-1");
  assert.equal(post.corpo.publicar_em, "2026-11-20T21:00:00.000Z");
  assert.equal(tema.caminho, "/rest/v1/tema_blog?id=eq.tema-1");
  assert.deepEqual(tema.corpo, { situacao: "usado" });
  assert.equal(execucao.corpo.resultado, "publicado");
});

test("sem post nem resultado, registra falhou", async () => {
  const b = bancoFalso();
  await finalizar(b.api, "2026-11-20", pasta({}));
  const escritas = b.escritas();
  assert.equal(escritas.length, 1);
  assert.equal(escritas[0].caminho, "/rest/v1/blog_execucao");
  assert.equal(escritas[0].corpo.resultado, "falhou");
});

test("no dia que já tem post não grava nem registra nada", async () => {
  const b = bancoFalso({ temPost: true });
  await finalizar(b.api, "2026-11-20", pasta({ "post.json": { ...POST, corpo_md: corpo } }));
  assert.equal(b.escritas().length, 0);
});

test("resultado reprovado com descartar marca o tema do contexto como descartado", async () => {
  const b = bancoFalso();
  await finalizar(b.api, "2026-11-20", pasta({ "resultado.json": { resultado: "reprovado", motivo: "texto genérico", descartar: true } }));
  const [execucao, tema] = b.escritas();
  assert.deepEqual([execucao.corpo.resultado, execucao.corpo.motivo], ["reprovado", "texto genérico"]);
  assert.equal(tema.caminho, "/rest/v1/tema_blog?id=eq.tema-1");
  assert.deepEqual(tema.corpo, { situacao: "descartado", motivo: "texto genérico" });
});

test("post reprovado pelo conferidor não é gravado e fica registrado como reprovado", async () => {
  const b = bancoFalso();
  await finalizar(b.api, "2026-11-20", pasta({ "post.json": { ...POST, corpo_md: "curto" } }));
  const escritas = b.escritas();
  assert.equal(escritas.some((e) => e.caminho === "/rest/v1/post_blog"), false);
  assert.equal(escritas.at(-1).corpo.resultado, "reprovado");
});

test("temas novos entram mesmo quando o dia fica sem post", async () => {
  const b = bancoFalso();
  await finalizar(
    b.api,
    "2026-11-20",
    pasta({ "resultado.json": { resultado: "falhou", motivo: "sem tema livre" }, "temas.json": [{ palavra_chave: "barbearia nova", intencao: "x" }] }),
  );
  assert.ok(b.escritas().some((e) => e.caminho === "/rest/v1/tema_blog" && e.corpo[0].palavra_chave === "barbearia nova"));
});
