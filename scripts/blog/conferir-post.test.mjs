// Testes do conferidor do post do blog (as regras que o código consegue checar antes de gravar).
import { test } from "node:test";
import assert from "node:assert/strict";
import { conferirPost, lerPost } from "./conferir-post.mjs";

const paragrafo = "O barbeiro que organiza a semana com antecedência consegue atender melhor, perde menos tempo no celular e sabe quanto vai entrar no caixa antes do sábado chegar.";
/** Corpo com ~1.000 palavras, 3 h2 e 2 links internos. */
function corpo({ h2 = 3, repeticoes = 12 } = {}) {
  const partes = [];
  for (let i = 0; i < h2; i++) {
    partes.push(`## Parte ${i + 1}`);
    for (let j = 0; j < repeticoes; j++) partes.push(paragrafo);
  }
  partes.push("Veja [como diminuir as faltas](/como-diminuir-faltas-na-barbearia) e a [agenda com link](/agenda-para-barbearia).");
  return partes.join("\n\n");
}

const bom = () => ({
  slug: "como-organizar-a-semana-da-barbearia",
  palavra_chave: "como organizar a semana da barbearia",
  titulo: "Como organizar a semana da barbearia",
  h1: "Como organizar a semana da barbearia sem correria",
  descricao: "Um jeito simples de organizar a semana da barbearia: horários, folgas, dias cheios e o que fazer quando o cliente some sem avisar antes.",
  corpo_md: corpo(),
  perguntas: [
    ["Qual o melhor dia para folgar?", "O dia mais fraco da sua agenda."],
    ["Abro no domingo?", "Depende do seu público."],
    ["Quanto tempo por corte?", "Marque o tempo real que você leva."],
  ],
  fontes: [],
});
const contexto = () => ({
  slugsUsados: ["quanto-cobrar-por-um-corte"],
  palavrasUsadas: ["quanto cobrar por um corte"],
  linksValidos: ["/", "/blog", "/agenda-para-barbearia", "/como-diminuir-faltas-na-barbearia"],
});
const conferir = (mudar = {}, ctx = {}) => conferirPost({ ...bom(), ...mudar }, { ...contexto(), ...ctx });
const temProblema = (problemas, trecho) => assert.ok(problemas.some((p) => p.includes(trecho)), `esperava "${trecho}" em ${JSON.stringify(problemas)}`);

test("aprova um post bom", () => {
  assert.deepEqual(conferir(), []);
});

test('reprova "sistema" no corpo', () => {
  temProblema(conferir({ corpo_md: corpo() + "\n\nUse um sistema." }), "sistema");
});

test('não confunde "sistemático"', () => {
  assert.deepEqual(conferir({ corpo_md: corpo() + "\n\nSeja sistemático." }), []);
});

test('reprova "Gestão" no título, sem ligar para maiúscula', () => {
  temProblema(conferir({ titulo: "Gestão da barbearia" }), "gestão");
});

test("reprova título com 61 caracteres", () => {
  temProblema(conferir({ titulo: "a".repeat(61) }), "título");
});

test("reprova descrição com 119", () => {
  temProblema(conferir({ descricao: "a".repeat(119) }), "descrição");
});

test("reprova 2 h2", () => {
  temProblema(conferir({ corpo_md: corpo({ h2: 2, repeticoes: 18 }) }), "h2");
});

test("reprova 6 perguntas", () => {
  temProblema(conferir({ perguntas: Array.from({ length: 6 }, (_, i) => [`P${i}?`, "R."]) }), "perguntas");
});

test("reprova link interno inexistente", () => {
  temProblema(conferir({ corpo_md: corpo() + "\n\nVeja [isto](/nao-existe)." }), "/nao-existe");
});

test("reprova menos de 2 links internos", () => {
  const so1 = corpo().replace(" e a [agenda com link](/agenda-para-barbearia)", "");
  temProblema(conferir({ corpo_md: so1 }), "links internos");
});

test('reprova "40%" sem fonte', () => {
  temProblema(conferir({ corpo_md: corpo() + "\n\nCerca de 40% dos clientes faltam." }), "fonte");
});

test('aceita "40%" com fonte listada', () => {
  assert.deepEqual(conferir({ corpo_md: corpo() + "\n\nCerca de 40% dos clientes faltam.", fontes: [{ titulo: "Pesquisa", url: "https://exemplo.com" }] }), []);
});

test('aceita "R$ 35" numa linha de exemplo', () => {
  assert.deepEqual(conferir({ corpo_md: corpo() + "\n\nPor exemplo: um corte de R$ 35 vezes 4 faltas dá R$ 140." }), []);
});

test("reprova fonte sem endereço http", () => {
  temProblema(conferir({ fontes: [{ titulo: "x", url: "javascript:alert(1)" }] }), "fonte");
});

test("reprova slug repetido", () => {
  temProblema(conferir({}, { slugsUsados: ["como-organizar-a-semana-da-barbearia"] }), "slug");
});

test("reprova slug fora do formato", () => {
  temProblema(conferir({ slug: "Com Espaço" }), "slug");
});

test("reprova palavra-chave repetida (sem acento/caixa)", () => {
  temProblema(conferir({}, { palavrasUsadas: ["Como organizar a SEMANA da barbearia"] }), "palavra-chave");
  temProblema(conferir({ palavra_chave: "gestão de agenda" }, { palavrasUsadas: ["Gestao de  agenda"] }), "palavra-chave");
});

test("reprova 899 palavras e aceita 900", () => {
  const palavras = (n) => "## A\n\n## B\n\n## C\n\n" + Array.from({ length: n - 3 }, () => "corte").join(" ") + " [x](/blog) [y](/)";
  // "## A" etc. contam como 1 palavra cada (A, B, C); os 2 links contam x e y
  temProblema(conferir({ corpo_md: palavras(897) }), "palavras");
  assert.deepEqual(conferir({ corpo_md: palavras(898) }), []);
});

test("lerPost junta o texto de corpo_arquivo ao post", async () => {
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "post-"));
  writeFileSync(join(dir, "corpo.md"), "## Título\n\nTexto com \"aspas\".");
  writeFileSync(join(dir, "post.json"), JSON.stringify({ slug: "a-b", corpo_arquivo: "corpo.md" }));
  const post = lerPost(join(dir, "post.json"));
  assert.equal(post.corpo_md, '## Título\n\nTexto com "aspas".');
  assert.equal("corpo_arquivo" in post, false);
});

test("reprova pergunta em formato de objeto em vez de [pergunta, resposta]", () => {
  temProblema(conferir({ perguntas: [{ pergunta: "a?", resposta: "b" }, ["c?", "d"], ["e?", "f"]] }), "pergunta 1");
});

test("reprova pergunta com resposta vazia", () => {
  temProblema(conferir({ perguntas: [["a?", ""], ["c?", "d"], ["e?", "f"]] }), "pergunta 1");
});

test("reprova fonte sem título", () => {
  temProblema(conferir({ fontes: [{ titulo: "", url: "https://exemplo.com" }] }), "fonte");
});
