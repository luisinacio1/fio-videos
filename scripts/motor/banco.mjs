// Confere o banco de temas dos vídeos e lista os temas livres (src/motor/banco.ts explica o formato).
//   node scripts/motor/banco.mjs conferir                       → "banco ok: N temas", ou os erros (e sai com código 1)
//   node scripts/motor/banco.mjs livres <tipo> [AAAA-MM-DD]     → "id — titulo" dos temas que podem sair naquele dia (padrão: hoje, no horário de Brasília)
//   node scripts/motor/banco.mjs livres carrossel [AAAA-MM-DD]  → o mesmo, do banco do barbeiro (diario/banco/barbeiro.json, src/motor/bancoBarbeiro.ts)
// Os temas já usados vêm dos roteiros salvos em diario/AAAA-MM-DD/*.json (campo "tema") e, se existir
// FIO_SUPABASE_SERVICE_KEY, também da fila do Instagram (tabela instagram_post; FIO_SUPABASE_URL é opcional).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { USOS_DOS_PILOTOS, conferirBanco, livres, temaDoVideo } = await import("../../src/motor/banco.ts");
const { USOS_DOS_PILOTOS_CARROSSEL, conferirBancoBarbeiro, livresBarbeiro } = await import("../../src/motor/bancoBarbeiro.ts");

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "../.."); // a pasta videos/
const ARQUIVO_BANCO = join(RAIZ, "diario", "banco", "temas.json");
const ARQUIVO_BARBEIRO = join(RAIZ, "diario", "banco", "barbeiro.json");
const TIPOS = ["curiosidade", "dica", "conceito", "atracao-2d", "atracao-3d"];
const FUSO = "America/Sao_Paulo";

/** o dia (AAAA-MM-DD) de um instante, no horário de Brasília */
const diaDeBrasilia = (instante) => new Date(instante).toLocaleDateString("sv-SE", { timeZone: FUSO });

function lerBanco(arquivo = ARQUIVO_BANCO) {
  if (!existsSync(arquivo)) throw new Error(`não achei ${arquivo}`);
  const temas = JSON.parse(readFileSync(arquivo, "utf8"));
  if (!Array.isArray(temas)) throw new Error(`${arquivo} precisa ser uma lista de temas`);
  return temas;
}

/**
 * os temas dos roteiros salvos: cada pasta diario/AAAA-MM-DD/ é o dia, o campo "tema" de cada .json é o tema.
 * `carrossel`: só os carrossel.json (banco do barbeiro); sem ele, todos os outros .json (banco dos vídeos).
 */
function usadosDasPastas(carrossel = false) {
  const usados = [];
  const base = join(RAIZ, "diario");
  if (!existsSync(base)) return usados;
  for (const pasta of readdirSync(base, { withFileTypes: true })) {
    if (!pasta.isDirectory() || !/^\d{4}-\d{2}-\d{2}$/.test(pasta.name)) continue;
    for (const nome of readdirSync(join(base, pasta.name))) {
      if (!nome.endsWith(".json") || (nome === "carrossel.json") !== carrossel) continue;
      let roteiro;
      try {
        roteiro = JSON.parse(readFileSync(join(base, pasta.name, nome), "utf8"));
      } catch {
        console.error(`aviso: ${pasta.name}/${nome} não é um JSON válido, ficou de fora`);
        continue;
      }
      if (typeof roteiro?.tema === "string" && roteiro.tema) usados.push({ tema: roteiro.tema, dia: pasta.name });
    }
  }
  return usados;
}

/** os temas dos posts já feitos e da fila do Instagram (só com a chave; a chave nunca é impressa) */
async function usadosDoSupabase() {
  const chave = process.env.FIO_SUPABASE_SERVICE_KEY;
  if (!chave) return [];
  const url = process.env.FIO_SUPABASE_URL ?? "https://jtcymmkstzmjednnrvxb.supabase.co";
  const r = await fetch(`${url}/rest/v1/instagram_post?select=video,publicar_em&tipo=eq.reels&order=publicar_em.desc&limit=1000`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  });
  if (!r.ok) throw new Error(`instagram_post: ${r.status}: ${await r.text()}`);
  return (await r.json()).map((p) => ({ tema: temaDoVideo(p.video), dia: diaDeBrasilia(p.publicar_em) }));
}

async function main() {
  const [comando, ...resto] = process.argv.slice(2);

  if (comando === "conferir") {
    const temas = lerBanco();
    const erros = conferirBanco(temas);
    if (erros.length) {
      console.error(`✗ banco com ${erros.length} erro(s):\n  - ${erros.join("\n  - ")}`);
      process.exitCode = 1;
    } else console.log(`banco ok: ${temas.length} temas`);
    const barbeiro = lerBanco(ARQUIVO_BARBEIRO);
    const errosB = conferirBancoBarbeiro(barbeiro);
    if (errosB.length) {
      console.error(`✗ banco do barbeiro com ${errosB.length} erro(s):\n  - ${errosB.join("\n  - ")}`);
      process.exitCode = 1;
    } else console.log(`barbeiro ok: ${barbeiro.length} temas`);
    return;
  }

  if (comando === "livres" && resto[0] === "carrossel") {
    const dia = resto[1] ?? diaDeBrasilia(Date.now());
    for (const t of livresBarbeiro(lerBanco(ARQUIVO_BARBEIRO), [...USOS_DOS_PILOTOS_CARROSSEL, ...usadosDasPastas(true)], dia)) console.log(`${t.id} — ${t.titulo}`);
    return;
  }

  if (comando === "livres") {
    const [tipo, dia = diaDeBrasilia(Date.now())] = resto;
    if (!TIPOS.includes(tipo)) throw new Error(`uso: banco.mjs livres <${TIPOS.join("|")}> [AAAA-MM-DD]`);
    // os temas dos pilotos contam como usados em 2026-11-13 (voltam em 2027-01-12; veja USOS_DOS_PILOTOS)
    const usados = [...USOS_DOS_PILOTOS, ...usadosDasPastas(), ...(await usadosDoSupabase())];
    for (const t of livres(lerBanco(), usados, dia, tipo)) console.log(`${t.id} — ${t.titulo}`);
    return;
  }

  throw new Error("uso: banco.mjs conferir | banco.mjs livres <tipo> [AAAA-MM-DD]");
}

try {
  await main();
} catch (e) {
  console.error(`✗ ${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
}
