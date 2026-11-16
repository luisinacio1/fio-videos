// Coloca os vídeos prontos de uma semana na fila do Instagram (tabela instagram_post, na produção).
// Sobe cada MP4 de prontos/ para o bucket público "instagram" e agenda no dia e hora do semana.json,
// com a legenda de legendas.json. Quem posta é a função instagram-postar (a cada 5 min).
//
//   node scripts/agendar-instagram.mjs semanas/2026-11-02            → mostra o que vai agendar (não muda nada)
//   node scripts/agendar-instagram.mjs semanas/2026-11-02 --valer    → sobe os vídeos e agenda de verdade
//
// Posts já na fila (mesmo vídeo) e horários que já passaram ficam de fora. Posts "extra" (sem data) não entram.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const [pasta, flag] = process.argv.slice(2);
const valer = flag === "--valer";
const semana = JSON.parse(readFileSync(join(pasta, "semana.json"), "utf8"));
const { hashtags, legendas } = JSON.parse(readFileSync(join(pasta, "legendas.json"), "utf8"));
const RAIZ = join(process.cwd(), "..");
const npx = (args) => execFileSync("npx", args, { cwd: RAIZ, shell: true, encoding: "utf8" });
const texto = (s) => `'${s.replace(/'/g, "''")}'`;

/** Roda o SQL na produção (por arquivo, para legendas com quebra de linha e emoji irem inteiras). */
function consultar(q) {
  const arq = join(tmpdir(), `fio-ig-${process.pid}.sql`);
  writeFileSync(arq, q);
  const saida = npx(["supabase", "db", "query", "--linked", "-f", `"${arq}"`]);
  rmSync(arq);
  return JSON.parse(saida.slice(saida.indexOf("{"))).rows ?? [];
}

const jaNaFila = new Set(consultar("select video from public.instagram_post").map((r) => r.video));
const agora = Date.now();
const fila = [];
for (const p of semana.postagens) {
  if (p.data === "extra") continue;
  const id = p.video ?? p.roteiro;
  const arquivo = join(pasta, "prontos", `${p.data}-${p.hora}-${id}.mp4`);
  const destino = `${basename(pasta)}/${basename(arquivo)}`;
  const quando = new Date(`${p.data}T${p.hora.replace("h", "").padStart(2, "0")}:00:00-03:00`);
  const motivo = !existsSync(arquivo) ? "vídeo não está em prontos/" : !legendas[id] ? "sem legenda" : jaNaFila.has(destino) ? "já está na fila" : +quando < agora ? "horário já passou" : null;
  console.log(`${p.data} ${p.hora}  ${id.padEnd(30)} ${motivo ?? "→ agendar"}`);
  if (!motivo) fila.push({ tipo: "reels", arquivo, destino, quando, legenda: `${legendas[id]}\n\n${hashtags}` });
}

// stories em imagem (scripts/stories.mjs gera os JPG a partir do stories.json)
const arqStories = join(pasta, "stories.json");
if (existsSync(arqStories)) {
  for (const st of JSON.parse(readFileSync(arqStories, "utf8")).stories) {
    const nome = `${st.quando.replace(":", "h").replace("T", "-")}.jpg`;
    const arquivo = join(pasta, "stories", nome);
    const destino = `${basename(pasta)}/stories/${nome}`;
    const quando = new Date(`${st.quando}:00-03:00`);
    const motivo = !existsSync(arquivo) ? "imagem não gerada (scripts/stories.mjs)" : jaNaFila.has(destino) ? "já está na fila" : +quando < agora ? "horário já passou" : null;
    console.log(`${st.quando.replace("T", " ")}  story ${st.tipo.padEnd(24)} ${motivo ?? "→ agendar"}`);
    if (!motivo) fila.push({ tipo: "story", arquivo, destino, quando, legenda: "" });
  }
}

if (!valer) {
  console.log(`\n${fila.length} post(s) para agendar. Nada foi mudado; rode de novo com --valer.`);
  process.exit(0);
}
for (const f of fila) {
  // caminho relativo à raiz do projeto: a CLI confunde "C:\…" com um endereço remoto
  npx(["supabase", "storage", "cp", `"videos/${f.arquivo.split("\\").join("/")}"`, `"ss:///instagram/${f.destino}"`, "--linked", "--experimental"]);
  consultar(`insert into public.instagram_post (tipo, video, legenda, publicar_em) values (${texto(f.tipo)}, ${texto(f.destino)}, ${texto(f.legenda)}, ${texto(f.quando.toISOString())}) returning id`);
  console.log(`agendado: ${f.destino} para ${f.quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
}
