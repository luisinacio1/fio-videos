// Stories do dia, em blocos de fim de funil (src/motor/StoryBloco.tsx).
//   node scripts/motor/stories.mjs AAAA-MM-DD [--publicar] [--trocar]
// Lê diario/<dia>/stories.json  { "blocos": [{ "hora": "9h", "tema": "Faltas", "quadros": [ ... ] }, ...] },
// confere, faz as imagens em out/motor/stories/<dia>/<hora>-<n>.jpg e, com --publicar, põe na fila do Instagram:
// cada bloco sai inteiro na hora dele, um quadro por minuto, na ordem (precisa de FIO_SUPABASE_SERVICE_KEY).
// Com --trocar, quadros já agendados (e ainda não postados) recebem a imagem nova.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const publicar = args.includes("--publicar");
const trocar = args.includes("--trocar");
const [dia] = args.filter((a) => !a.startsWith("--"));
if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? "")) throw new Error("uso: stories.mjs AAAA-MM-DD [--publicar] [--trocar]");
const npx = (a) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"] });

// ---------- confere o roteiro ----------
const TIPOS = ["dor", "prova", "objecao", "beneficios", "chamada"];
const TELAS = ["aviso", "agenda", "lembretes", "whats", "link", "horarios", "confirmado", "equipe"];
const { blocos } = JSON.parse(readFileSync(`diario/${dia}/stories.json`, "utf8"));
const erros = [];
const textoOk = (onde, t, max) => {
  if (typeof t !== "string" || !t.trim()) erros.push(`${onde}: falta o texto`);
  else if (t.length > max) erros.push(`${onde}: texto com ${t.length} letras (máximo ${max})`);
};
// o dono pediu menos stories (15/11): 1 bloco por dia, às 9h, com 4 quadros
if (!Array.isArray(blocos) || blocos.length !== 1) erros.push("é 1 bloco só por dia");
for (const [i, b] of (blocos ?? []).entries()) {
  const onde = `bloco ${i + 1} (${b.hora})`;
  if (b.hora !== "9h") erros.push(`${onde}: o bloco sai às "9h"`);
  textoOk(`${onde} tema`, b.tema, 14);
  const q = b.quadros ?? [];
  if (q.length !== 4) erros.push(`${onde}: são 4 quadros (dor, prova, benefícios e chamada)`);
  if (q.at(-1)?.tipo !== "chamada") erros.push(`${onde}: o último quadro é a chamada`);
  if (!q.some((x) => x.tipo === "beneficios")) erros.push(`${onde}: falta o quadro de benefícios`);
  for (const [k, x] of q.entries()) {
    const o = `${onde} quadro ${k + 1}`;
    if (!TIPOS.includes(x.tipo)) erros.push(`${o}: tipo "${x.tipo}" não existe`);
    if (x.tipo === "dor" || x.tipo === "chamada") textoOk(o, x.titulo, 70);
    if (x.tipo === "prova") {
      textoOk(o, x.titulo, 80);
      if (!TELAS.includes(x.tela?.nome)) erros.push(`${o}: tela "${x.tela?.nome}" não existe`);
    }
    if (x.tipo === "objecao") {
      textoOk(`${o} objeção`, x.objecao, 60);
      textoOk(`${o} resposta`, x.resposta, 70);
    }
    if (x.destaque && !(x.titulo ?? x.resposta ?? "").includes(x.destaque)) erros.push(`${o}: o destaque "${x.destaque}" não está no texto`);
  }
}
if (erros.length) {
  console.error(erros.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}

// ---------- imagens ----------
const pasta = `out/motor/stories/${dia}`;
mkdirSync(pasta, { recursive: true });
const pacote = join(tmpdir(), `fio-stories-pacote-${process.pid}`);
npx(["remotion", "bundle", `--out-dir="${pacote}"`, "--log=error"]);
const feitos = [];
for (const b of blocos) {
  for (const [k, quadro] of b.quadros.entries()) {
    const arquivo = `${pasta}/${b.hora}-${k + 1}.jpg`;
    const props = join(tmpdir(), `fio-story-${process.pid}.json`);
    writeFileSync(props, JSON.stringify({ tema: b.tema, n: k + 1, total: b.quadros.length, quadro }));
    npx(["remotion", "still", `"${pacote}"`, "story-bloco", `"${arquivo}"`, `--props="${resolve(props)}"`, "--image-format=jpeg", "--jpeg-quality=95", "--log=error"]);
    feitos.push({ hora: b.hora, n: k + 1, arquivo });
    console.log(`✓ ${arquivo}`);
  }
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
  if (!CHAVE) throw new Error("falta FIO_SUPABASE_SERVICE_KEY");
  const cabecalho = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };
  const api = async (caminho, opcoes = {}) => {
    const r = await fetch(`${URL_}${caminho}`, { ...opcoes, headers: { ...cabecalho, ...opcoes.headers } });
    const texto = await r.text();
    if (!r.ok) throw new Error(`${r.status} ${caminho}: ${texto}`);
    return texto ? JSON.parse(texto) : null;
  };
  for (const { hora, n, arquivo } of feitos) {
    const destino = `diario/${dia}/stories/${hora}-${n}.jpg`;
    // um quadro por minuto: o carteiro posta na ordem do horário
    const quando = new Date(`${dia}T${hora.replace("h", "").padStart(2, "0")}:${String(n - 1).padStart(2, "0")}:00-03:00`);
    const ja = await api(`/rest/v1/instagram_post?select=id,estado&video=eq.${encodeURIComponent(destino)}`);
    const subir = () => api(`/storage/v1/object/instagram/${destino}`, { method: "POST", headers: { "Content-Type": "image/jpeg", "x-upsert": "true" }, body: readFileSync(arquivo) });
    if (ja.length) {
      if (trocar && ja[0].estado === "agendado") {
        await subir();
        console.log(`trocado: ${destino}`);
      } else console.log(`já na fila (${ja[0].estado}): ${destino}`);
      continue;
    }
    if (+quando < Date.now()) {
      console.log(`horário já passou, fica de fora: ${destino}`);
      continue;
    }
    await subir();
    await api("/rest/v1/instagram_post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "story", video: destino, legenda: "", publicar_em: quando.toISOString() }) });
    console.log(`agendado: ${destino} para ${quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  }
}
