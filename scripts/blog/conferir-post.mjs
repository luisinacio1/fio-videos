// Conferidor do post do blog: as regras que dá para checar por código antes de gravar (a leitura de editor vem depois).
//   node scripts/blog/conferir-post.mjs post.json contexto.json
// Imprime os problemas e sai com 1 se houver algum. O blog.mjs usa a mesma função e se recusa a gravar post reprovado.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Palavras que nunca aparecem nos textos públicos do Fio (founder/estrategia.md). */
export const PROIBIDAS = ["sistema", "gestão", "gestao", "plataforma", "software", "lembrete automático", "lembrete automatico"];
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])$/;
const NUMERO = /\d+(?:[.,]\d+)?\s?%|R\$\s?\d/;
const CONTA_PROPRIA = /exemplo|conta/i;

/** Sem acento, minúscula e espaços simples: "Gestão de  Agenda" e "gestao de agenda" são a mesma busca. */
export const normalizar = (t) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Palavras do texto, sem a marcação do Markdown (o endereço dos links não conta). */
export const contarPalavras = (md) =>
  String(md ?? "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`]/g, " ")
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p)).length;

/**
 * Lê o post.json. O texto pode vir num arquivo .md separado (`corpo_arquivo`, relativo ao post.json), para não precisar
 * escapar 1.500 palavras dentro do JSON.
 */
export function lerPost(arquivo) {
  const { corpo_arquivo, ...post } = JSON.parse(readFileSync(arquivo, "utf8"));
  if (corpo_arquivo) post.corpo_md = readFileSync(resolve(dirname(arquivo), corpo_arquivo), "utf8").replace(/\r\n/g, "\n").trim();
  return post;
}

const temPalavra = (texto, palavra) => new RegExp(`(?<![\\p{L}])${palavra}(?![\\p{L}])`, "iu").test(texto);

/**
 * Lista os problemas do post; vazia = aprovado.
 * post = { slug, palavra_chave, titulo, h1, descricao, corpo_md, perguntas: [pergunta, resposta][], fontes: {titulo, url}[] }
 * contexto = { slugsUsados, palavrasUsadas, linksValidos }
 */
export function conferirPost(post, contexto) {
  const problemas = [];
  const corpo = String(post.corpo_md ?? "");
  const perguntas = Array.isArray(post.perguntas) ? post.perguntas : [];
  const fontes = Array.isArray(post.fontes) ? post.fontes : [];

  const textos = [post.titulo, post.h1, post.descricao, corpo, ...perguntas.flat()].map((t) => String(t ?? "")).join("\n");
  for (const palavra of PROIBIDAS) if (temPalavra(textos, palavra)) problemas.push(`palavra proibida "${palavra}"`);

  const titulo = String(post.titulo ?? "");
  if (!titulo.trim() || titulo.length > 60) problemas.push(`título com ${titulo.length} caracteres (máximo 60)`);
  const descricao = String(post.descricao ?? "");
  if (descricao.length < 120 || descricao.length > 160) problemas.push(`descrição com ${descricao.length} caracteres (de 120 a 160)`);
  if (!String(post.h1 ?? "").trim()) problemas.push("falta o h1");

  const palavras = contarPalavras(corpo);
  if (palavras < 900 || palavras > 1600) problemas.push(`texto com ${palavras} palavras (de 900 a 1.600)`);
  const h2 = corpo.split("\n").filter((l) => /^##\s+\S/.test(l)).length;
  if (h2 < 3) problemas.push(`só ${h2} h2 (mínimo 3)`);
  if (perguntas.length < 3 || perguntas.length > 5) problemas.push(`${perguntas.length} perguntas (de 3 a 5)`);
  perguntas.forEach((p, i) => {
    const ok = Array.isArray(p) && p.length === 2 && p.every((t) => typeof t === "string" && t.trim());
    if (!ok) problemas.push(`pergunta ${i + 1} fora do formato ["pergunta?", "resposta."]`);
  });

  const internos = [...corpo.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
  for (const link of internos) if (!contexto.linksValidos.includes(link)) problemas.push(`link interno que não existe: ${link}`);
  if (internos.length < 2) problemas.push(`${internos.length} links internos (mínimo 2)`);

  for (const f of fontes) {
    if (!/^https?:\/\//.test(String(f?.url ?? ""))) problemas.push(`fonte sem endereço http: ${f?.titulo ?? "?"}`);
    if (!String(f?.titulo ?? "").trim()) problemas.push(`fonte sem título: ${f?.url ?? "?"}`);
  }
  if (!fontes.length)
    for (const linha of corpo.split("\n"))
      if (NUMERO.test(linha) && !CONTA_PROPRIA.test(linha)) problemas.push(`número sem fonte: "${linha.trim().slice(0, 80)}"`);

  const slug = String(post.slug ?? "");
  if (!SLUG.test(slug) || slug.includes("--")) problemas.push(`slug fora do formato: ${slug}`);
  if (contexto.slugsUsados.includes(slug)) problemas.push(`slug já usado: ${slug}`);
  const chave = normalizar(post.palavra_chave);
  if (!chave) problemas.push("falta a palavra-chave");
  if (contexto.palavrasUsadas.some((p) => normalizar(p) === chave)) problemas.push(`palavra-chave já usada: ${post.palavra_chave}`);

  return problemas;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [arquivoPost, arquivoContexto] = process.argv.slice(2);
  if (!arquivoPost || !arquivoContexto) throw new Error("uso: conferir-post.mjs post.json contexto.json");
  const problemas = conferirPost(lerPost(arquivoPost), JSON.parse(readFileSync(arquivoContexto, "utf8")));
  if (problemas.length) {
    console.log(`Reprovado:\n- ${problemas.join("\n- ")}`);
    process.exit(1);
  }
  console.log("Aprovado pelo conferidor.");
}
