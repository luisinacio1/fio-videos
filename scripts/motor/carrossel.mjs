// Carrossel do dia: educação para o barbeiro (src/motor/carrossel.ts explica o roteiro, CarrosselSlide.tsx o desenho).
//   node scripts/motor/carrossel.mjs AAAA-MM-DD [--so-conferir] [--publicar] [--trocar]
// Lê diario/<dia>/carrossel.json, confere contra o banco do barbeiro (diario/banco/barbeiro.json) e faz as imagens em
// out/motor/carrossel/<dia>/<n>.jpg. Com --so-conferir, só confere. Com --publicar, sobe as imagens para o bucket
// instagram (diario/<dia>/carrossel/<n>.jpg) e põe o carrossel na fila às 15h (precisa de FIO_SUPABASE_SERVICE_KEY).
// Com --trocar, um carrossel já na fila e ainda "agendado" recebe as imagens novas.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const { conferirCarrossel } = await import("../../src/motor/carrossel.ts");

const args = process.argv.slice(2);
const soConferir = args.includes("--so-conferir");
const publicar = args.includes("--publicar");
const trocar = args.includes("--trocar");
const [dia] = args.filter((a) => !a.startsWith("--"));
const sair = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};
if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? "")) sair("uso: carrossel.mjs AAAA-MM-DD [--so-conferir] [--publicar] [--trocar]");
const HORA = "15:00"; // horário de Brasília

// ---------- confere o roteiro ----------
const arquivo = `diario/${dia}/carrossel.json`;
if (!existsSync(arquivo)) sair(`falta ${arquivo}`);
const roteiro = JSON.parse(readFileSync(arquivo, "utf8"));
const temas = JSON.parse(readFileSync("diario/banco/barbeiro.json", "utf8"));
const erros = conferirCarrossel(roteiro, temas);
if (erros.length) sair(erros.join("\n✗ "));
console.log(`carrossel ok: ${roteiro.slides.length} slides, tema ${roteiro.tema}`);
if (soConferir) process.exit(0);

// ---------- imagens ----------
const npx = (a) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"] });
const pasta = `out/motor/carrossel/${dia}`;
rmSync(pasta, { recursive: true, force: true });
mkdirSync(pasta, { recursive: true });
const pacote = join(tmpdir(), `fio-carrossel-pacote-${process.pid}`);
npx(["remotion", "bundle", `--out-dir="${pacote}"`, "--log=error"]);
const feitos = [];
for (const [i, slide] of roteiro.slides.entries()) {
  const saida = `${pasta}/${i + 1}.jpg`;
  const props = join(tmpdir(), `fio-carrossel-${process.pid}.json`);
  writeFileSync(props, JSON.stringify({ rotulo: roteiro.rotulo, n: i + 1, total: roteiro.slides.length, slide }));
  npx(["remotion", "still", `"${pacote}"`, "carrossel-slide", `"${saida}"`, `--props="${resolve(props)}"`, "--image-format=jpeg", "--jpeg-quality=95", "--log=error"]);
  feitos.push(saida);
  console.log(`✓ ${saida}`);
}
try {
  rmSync(pacote, { recursive: true, force: true });
} catch {
  // no Windows a pasta às vezes fica presa por um instante; é temporária, pode ficar
}

// ---------- fila ----------
if (publicar) {
  const URL_ = process.env.FIO_SUPABASE_URL ?? "https://jtcymmkstzmjednnrvxb.supabase.co";
  const CHAVE = process.env.FIO_SUPABASE_SERVICE_KEY;
  if (!CHAVE) sair("falta FIO_SUPABASE_SERVICE_KEY");
  const cabecalho = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };
  const api = async (caminho, opcoes = {}) => {
    const r = await fetch(`${URL_}${caminho}`, { ...opcoes, headers: { ...cabecalho, ...opcoes.headers } });
    const texto = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${caminho}: ${texto}`);
    return texto ? JSON.parse(texto) : null;
  };
  const destinos = feitos.map((_, i) => `diario/${dia}/carrossel/${i + 1}.jpg`);
  const subir = () =>
    Promise.all(feitos.map((f, i) => api(`/storage/v1/object/instagram/${destinos[i]}`, { method: "POST", headers: { "Content-Type": "image/jpeg", "x-upsert": "true" }, body: readFileSync(f) })));
  const quando = new Date(`${dia}T${HORA}:00-03:00`);
  const ja = await api(`/rest/v1/instagram_post?select=id,estado&tipo=eq.carrossel&video=eq.${encodeURIComponent(destinos[0])}`);
  if (ja.length) {
    if (trocar && ja[0].estado === "agendado") {
      await subir();
      await api(`/rest/v1/instagram_post?id=eq.${ja[0].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagens: destinos, legenda: roteiro.legenda }) });
      console.log(`trocado: carrossel de ${dia}`);
    } else console.log(`já na fila (${ja[0].estado}): carrossel de ${dia}`);
  } else if (+quando < Date.now()) {
    console.log(`horário já passou, fica de fora: carrossel de ${dia}`);
  } else {
    await subir();
    await api("/rest/v1/instagram_post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "carrossel", video: destinos[0], imagens: destinos, legenda: roteiro.legenda, publicar_em: quando.toISOString() }),
    });
    console.log(`agendado: carrossel de ${dia} (${destinos.length} imagens) para ${quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  }
}
