// Ponte do robô do blog com o banco (tabelas post_blog, tema_blog e blog_execucao), pela API do Supabase.
// O Claude nunca roda com a chave: ele lê out/blog/contexto.json e escreve arquivos; quem fala com o banco é este script,
// num job separado do workflow.
//   node scripts/blog/blog.mjs contexto AAAA-MM-DD            → JSON com o tema do dia e o que o post precisa saber
//   node scripts/blog/blog.mjs finalizar AAAA-MM-DD out/blog  → grava o post (ou registra o dia sem post) e os temas novos
//   node scripts/blog/blog.mjs registrar AAAA-MM-DD reprovado|falhou "motivo" [--descartar <tema_id>]
//   node scripts/blog/blog.mjs temas temas.json                → acrescenta temas novos (pula os repetidos)
// Precisa de FIO_SUPABASE_URL e FIO_SUPABASE_SERVICE_KEY, os dois sempre (sem endereço não há produção "por padrão").
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { conferirPost, lerPost, normalizar, PROIBIDAS } from "./conferir-post.mjs";
import { publicarEm } from "./hora.mjs";

/** As 4 páginas de busca do site (agendafio: src/lib/seo/guias.ts). Mudou lá, muda aqui. */
export const GUIAS = ["agenda-para-barbearia", "como-diminuir-faltas-na-barbearia", "lembrete-de-horario-whatsapp", "agenda-para-barbeiro-autonomo"];

/** A linha da tabela post_blog: só os campos do post, no ar, às 18h do dia. */
export function montarLinhaPost(post, dia, temaId) {
  return {
    slug: post.slug,
    palavra_chave: post.palavra_chave,
    titulo: post.titulo,
    h1: post.h1,
    descricao: post.descricao,
    corpo_md: post.corpo_md,
    perguntas: post.perguntas,
    fontes: post.fontes,
    dia,
    publicar_em: publicarEm(dia),
    situacao: "no_ar",
    tema_id: temaId ?? null,
  };
}

function cliente() {
  const url = process.env.FIO_SUPABASE_URL;
  const chave = process.env.FIO_SUPABASE_SERVICE_KEY;
  if (!url || !chave) throw new Error("faltam FIO_SUPABASE_URL e FIO_SUPABASE_SERVICE_KEY");
  const cabecalho = { apikey: chave, Authorization: `Bearer ${chave}` };
  return async function api(caminho, opcoes = {}) {
    const r = await fetch(`${url}${caminho}`, { ...opcoes, headers: { "Content-Type": "application/json", ...cabecalho, ...opcoes.headers } });
    const texto = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${caminho}: ${texto}`);
    return texto ? JSON.parse(texto) : null;
  };
}

const exigirDia = (dia) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? "")) throw new Error(`dia fora do formato AAAA-MM-DD: ${dia}`);
  return dia;
};

async function contexto(api, dia) {
  const [doDia, temas, posts] = await Promise.all([
    api(`/rest/v1/post_blog?select=id&dia=eq.${dia}`),
    api("/rest/v1/tema_blog?select=id,palavra_chave,intencao,link_alvo&situacao=eq.livre&order=prioridade.desc,criado_em.asc&limit=1000"),
    api("/rest/v1/post_blog?select=slug,titulo,palavra_chave,situacao&order=dia.desc&limit=5000"),
  ]);
  const noAr = posts.filter((p) => p.situacao === "no_ar");
  return {
    dia,
    jaTemPost: doDia.length > 0,
    tema: temas[0] ?? null,
    temasLivres: temas.length,
    slugsUsados: posts.map((p) => p.slug),
    palavrasUsadas: posts.map((p) => p.palavra_chave),
    linksValidos: ["/", "/blog", ...GUIAS.map((g) => `/${g}`), ...noAr.map((p) => `/blog/${p.slug}`)],
    ultimosPosts: noAr.slice(0, 20).map((p) => ({ slug: p.slug, titulo: p.titulo })),
  };
}

const registrarExecucao = (api, dia, resultado, motivo) =>
  api("/rest/v1/blog_execucao", { method: "POST", body: JSON.stringify({ dia, resultado, motivo: motivo ?? null }) });

async function registrar(api, dia, resultado, motivo, temaDescartado) {
  if (!["reprovado", "falhou"].includes(resultado)) throw new Error("resultado: reprovado ou falhou");
  await registrarExecucao(api, dia, resultado, motivo);
  if (temaDescartado)
    await api(`/rest/v1/tema_blog?id=eq.${temaDescartado}`, { method: "PATCH", body: JSON.stringify({ situacao: "descartado", motivo: motivo ?? null }) });
  console.log(`Registrado: ${dia} ${resultado}${motivo ? ` (${motivo})` : ""}`);
}

/**
 * Depois do Claude: lê o que ele deixou em `pasta` e grava. O tema do post é o do contexto salvo antes do Claude rodar
 * (não o que ele escreveu). Sempre deixa o dia registrado: post gravado, reprovado ou falhou. Dia que já tinha post fica
 * como está.
 */
export async function finalizar(api, dia, pasta) {
  const arquivo = (nome) => (existsSync(join(pasta, nome)) ? join(pasta, nome) : null);
  const lerJson = (nome) => (arquivo(nome) ? JSON.parse(readFileSync(arquivo(nome), "utf8")) : null);
  const temaId = lerJson("contexto.json")?.tema?.id ?? null;
  const ctx = await contexto(api, dia);

  if (ctx.jaTemPost) console.log(`O dia ${dia} já tem post. Nada a gravar.`);
  else if (arquivo("post.json")) {
    const post = lerPost(arquivo("post.json"));
    const problemas = conferirPost(post, ctx);
    if (problemas.length) {
      console.log(`Reprovado pelo conferidor, nada gravado:\n- ${problemas.join("\n- ")}`);
      await registrar(api, dia, "reprovado", `conferidor: ${problemas.slice(0, 3).join("; ")}`, null);
    } else {
      await api("/rest/v1/post_blog", { method: "POST", body: JSON.stringify(montarLinhaPost(post, dia, temaId)) });
      if (temaId) await api(`/rest/v1/tema_blog?id=eq.${temaId}`, { method: "PATCH", body: JSON.stringify({ situacao: "usado" }) });
      await registrarExecucao(api, dia, "publicado", null);
      console.log(`Gravado: /blog/${post.slug}, aparece em ${dia} às 18h.`);
    }
  } else {
    const r = lerJson("resultado.json");
    const resultado = r?.resultado === "reprovado" ? "reprovado" : "falhou";
    const motivo = String(r?.motivo ?? "o robô terminou sem post e sem motivo (pode ter passado do tempo)").slice(0, 300);
    await registrar(api, dia, resultado, motivo, r?.descartar ? temaId : null);
  }

  if (arquivo("temas.json")) {
    try {
      await temas(api, arquivo("temas.json"));
    } catch (e) {
      console.log(`Temas novos não entraram: ${e.message}`);
    }
  }
}

async function temas(api, arquivo) {
  const novos = JSON.parse(readFileSync(arquivo, "utf8"));
  const existentes = new Set((await api("/rest/v1/tema_blog?select=palavra_chave&limit=10000")).map((t) => normalizar(t.palavra_chave)));
  const proibida = (t) => PROIBIDAS.some((p) => normalizar(t).includes(normalizar(p)));
  const vistos = new Set();
  const linhas = [];
  for (const t of novos) {
    const chave = normalizar(t.palavra_chave);
    if (!chave || existentes.has(chave) || vistos.has(chave) || proibida(t.palavra_chave)) continue;
    vistos.add(chave);
    linhas.push({
      palavra_chave: String(t.palavra_chave).trim(),
      intencao: t.intencao ?? "",
      link_alvo: t.link_alvo ?? null,
      prioridade: Number.isFinite(t.prioridade) ? t.prioridade : 100,
      fonte_da_pesquisa: t.fonte_da_pesquisa ?? null,
    });
  }
  if (linhas.length) await api("/rest/v1/tema_blog", { method: "POST", body: JSON.stringify(linhas) });
  console.log(`Temas novos: ${linhas.length} (de ${novos.length} no arquivo).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [comando, ...resto] = process.argv.slice(2);
  const api = cliente();
  if (comando === "contexto") console.log(JSON.stringify(await contexto(api, exigirDia(resto[0])), null, 2));
  else if (comando === "finalizar") await finalizar(api, exigirDia(resto[0]), resto[1]);
  else if (comando === "registrar") {
    const i = resto.indexOf("--descartar");
    const tema = i >= 0 ? resto[i + 1] : null;
    const [dia, resultado, motivo] = i >= 0 ? resto.slice(0, i) : resto;
    await registrar(api, exigirDia(dia), resultado, motivo, tema);
  } else if (comando === "temas") await temas(api, resto[0]);
  else throw new Error("comandos: contexto, finalizar, registrar, temas");
}
