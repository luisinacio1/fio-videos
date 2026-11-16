// Faz os vídeos 3D a partir dos roteiros:
//   - com "etapas": o "Quanto custa…?" (src/custo3d/roteiro.ts explica o formato, composição custo3d);
//   - sem "etapas": o vídeo de atração (src/custo3d/atracao.ts: vitrine, por dentro, viagem no tempo e o Fio em 3D,
//     composição atracao3d).
//   node scripts/motor/fazer-3d.mjs <roteiro.json> [...]        → voz, música e vídeo em out/motor/<id>.mp4
//   ... --quadros                                                → também tira quadros de conferência em out/motor/<id>/
//   ... --so-quadros                                             → só os quadros, sem o vídeo (para conferir o 3D rápido)
//   ... --so-voz                                                 → só a voz e os tempos (para conferir as referências rápido)
//   ... --narracao=<audio>                                       → usa a narração gravada no lugar da voz grátis (um roteiro só)
//   ... --telas-prontas                                          → (Fio em 3D) não gera as telas do app de novo, usa as que já estão
//                                                                  em public/motor/<id>/tela-N.png
// Com o Fio em 3D (todo vídeo de atração e o "Quanto custa" no formato novo, com "fio"): antes da voz, cada tela do
// Fio (fio.telas[i].tela) vira public/motor/<id>/tela-<i+1>.png (composição tela-parada, --scale=3), a textura do
// celular 3D. Se alguma não existir, o roteiro para com "falta a tela N".
// A voz grátis é a mesma dos vídeos do dia (scripts/motor/voz.mjs). A narração gravada é transcrita
// (scripts/palavras-narracao.py, faster-whisper) e alinhada às falas (scripts/alinhar-falas.py), como no fazer-narrado.mjs.
// O 3D é desenhado pelo Chrome com WebGL: --gl=angle com placa de vídeo; na nuvem (Linux, sem placa) --gl=swangle,
// que desenha pelo processador. FIO_GL troca à mão.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { ajustarVolume, salvar } from "../som.mjs";
import { musica } from "./musica.mjs";
import { fazerVoz } from "./voz.mjs";

const { ANTES, duracao, quadro, FPS } = await import("../../src/motor/roteiro.ts");
const { conferir3d, cortes, linhaDasEtapas } = await import("../../src/custo3d/roteiro.ts");
const { conferirAtracao3d, quadrosDeConferencia } = await import("../../src/custo3d/atracao.ts");

const args = process.argv.slice(2);
const arquivos = args.filter((a) => !a.startsWith("--"));
const soVoz = args.includes("--so-voz");
const soQuadros = args.includes("--so-quadros");
const quadros = soQuadros || args.includes("--quadros");
const telasProntas = args.includes("--telas-prontas");
const narracao = args.find((a) => a.startsWith("--narracao="))?.slice("--narracao=".length);
if (narracao && arquivos.length !== 1) throw new Error("--narracao vale para um roteiro só");
const GL = process.env.FIO_GL ?? (process.platform === "linux" ? "swangle" : "angle");
const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const py = (script, a) => execFileSync(PYTHON, [resolve(script), ...a], { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, PYTHONIOENCODING: "utf8" } });
const npx = (a, opcoes = {}) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"], ...opcoes });

/** o "Quanto custa" tem etapas; o resto é vídeo de atração */
const eCusto = (r) => Array.isArray(r.etapas);
const conferirRoteiro = (r, t) => (eCusto(r) ? conferir3d(r, t) : conferirAtracao3d(r, t));
const arquivoDaTela = (id, n) => join("public", "motor", id, `tela-${n}.png`);

// pacotes do Remotion: um para tirar as telas (antes da voz) e outro para o vídeo (depois, para levar as telas junto)
const pacotes = [];
function empacotar(nome) {
  const pacote = join(tmpdir(), `fio-3d-${nome}-${process.pid}`);
  npx(["remotion", "bundle", `--out-dir="${pacote}"`, "--log=error"]);
  pacotes.push(pacote);
  return pacote;
}
let pacoteTelas = null;

/** Gera os PNGs das telas do Fio (1170x2532) em public/motor/<id>/tela-N.png. */
function fazerTelas(r, pasta) {
  if (!pacoteTelas) {
    console.log("▶ preparando as telas do app");
    pacoteTelas = empacotar("telas");
  }
  r.fio.telas.forEach(({ tela }, i) => {
    const props = resolve(pasta, `tela-${i + 1}.json`);
    writeFileSync(props, JSON.stringify({ tela }));
    npx(["remotion", "still", `"${pacoteTelas}"`, "tela-parada", `"${resolve(arquivoDaTela(r.id, i + 1))}"`, `--props="${props}"`, "--scale=3", "--log=error"]);
  });
}

/** As telas que faltam (números a partir de 1). */
const telasQueFaltam = (r) => r.fio.telas.map((_, i) => i + 1).filter((n) => !existsSync(arquivoDaTela(r.id, n)));

const prontos = [];
for (const arquivo of arquivos) {
  const r = JSON.parse(readFileSync(arquivo, "utf8"));
  let erros = conferirRoteiro(r);
  if (erros.length) {
    console.error(`✗ ${basename(arquivo)}:\n  - ${erros.join("\n  - ")}`);
    process.exitCode = 1;
    continue;
  }
  const custo = eCusto(r);
  const pasta = join("public", "motor", r.id);
  mkdirSync(pasta, { recursive: true });
  if (r.fio) {
    if (!telasProntas) {
      console.log(`▶ ${r.id}: ${r.fio.telas.length} tela(s) do app`);
      fazerTelas(r, pasta);
    }
    const faltam = telasQueFaltam(r);
    if (faltam.length) {
      console.error(`✗ ${r.id}:\n${faltam.map((n) => `  - falta a tela ${n} (${arquivoDaTela(r.id, n)})`).join("\n")}`);
      process.exitCode = 1;
      continue;
    }
  }
  let tempos, voz, total;
  if (narracao) {
    console.log(`▶ ${r.id}: transcrevendo a narração`);
    const ouvidas = join(pasta, "palavras-narracao.json");
    py("scripts/palavras-narracao.py", [narracao, ouvidas]);
    py("scripts/alinhar-falas.py", [ouvidas, arquivo, join(pasta, "tempos.json")]);
    tempos = JSON.parse(readFileSync(join(pasta, "tempos.json"), "utf8"));
    total = duracao(tempos) / FPS + 0.3;
  } else {
    console.log(`▶ ${r.id}: voz`);
    ({ tempos, voz, total } = fazerVoz(r, pasta));
    writeFileSync(join(pasta, "tempos.json"), JSON.stringify(tempos, null, 1));
  }
  erros = conferirRoteiro(r, tempos);
  if (erros.length) {
    console.error(`✗ ${r.id}:\n  - ${erros.join("\n  - ")}`);
    process.exitCode = 1;
    continue;
  }
  console.log(tempos.falas.map((f, i) => `  ${i + 1}. ${f.a.toFixed(1)}–${f.z.toFixed(1)} s  ${r.falas[i].texto}`).join("\n"));
  const seg = (q) => (q / FPS).toFixed(1);
  let virada, etapas;
  if (custo) {
    etapas = linhaDasEtapas(r, tempos);
    console.log(`  soma das etapas: R$ ${etapas[etapas.length - 1].soma.toLocaleString("pt-BR")} · ${(duracao(tempos) / FPS).toFixed(0)} s`);
    // a música vira de "problema" para "solução" quando o celular com o Fio entra
    virada = cortes(r, tempos).app / FPS;
  } else virada = (quadro(tempos, r.fio.de) - ANTES) / FPS;
  if (r.ponte && r.fio) {
    const [ponte, fio, final] = [r.ponte, r.fio.de, r.final.de].map((ref) => quadro(tempos, ref));
    console.log(`  conteúdo ${seg(ponte)} s · ponte ${seg(fio - ponte)} s · Fio ${seg(final - fio)} s · total ${seg(duracao(tempos))} s${r.tipo ? "" : " (sem tipo: marcos não conferidos)"}`);
  }
  if (soVoz) continue;
  if (narracao) {
    // a narração entra como veio, só com o volume igualado
    npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", `"${resolve(narracao)}"`, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "2", `"${join(pasta, "voz.wav")}"`]);
  } else salvar(join(pasta, "voz.wav"), ajustarVolume(voz, -15));
  salvar(join(pasta, "musica.wav"), ajustarVolume(musica(total, virada), -20));
  const props = { roteiro: r, tempos, voz: `motor/${r.id}/voz.wav`, musica: `motor/${r.id}/musica.wav` };
  writeFileSync(join(pasta, "props.json"), JSON.stringify(props));
  prontos.push({ r, tempos, pasta, etapas, custo });
}

if (!soVoz && prontos.length) {
  console.log("▶ preparando o render");
  const pacote = empacotar("pacote");
  mkdirSync("out/motor", { recursive: true });
  for (const { r, tempos, pasta, etapas, custo } of prontos) {
    const comp = custo ? "custo3d" : "atracao3d";
    const props = resolve(pasta, "props.json");
    const comum = [`--props="${props}"`, `--gl=${GL}`, "--log=error"];
    if (quadros) {
      const dir = `out/motor/${r.id}`;
      mkdirSync(dir, { recursive: true });
      let marcas;
      if (custo) {
        const { app, final } = cortes(r, tempos);
        marcas = [10, quadro(tempos, "2") + 20, ...etapas.map((e) => e.q + 24), quadro(tempos, r.total) + 30, ...(r.falta ? [quadro(tempos, r.falta.marca) + 20, quadro(tempos, r.falta.some) + 20] : []), app + 40, final + 60];
        // Fio em 3D: a névoa, cada frase e a câmera subindo para o fecho
        if (r.fio) marcas.push(app - 6, ...r.fio.frases.map((x) => quadro(tempos, x.em) + 20), final + 10);
      } else marcas = quadrosDeConferencia(r, tempos);
      const t0 = Date.now();
      for (const q of [...new Set(marcas)].sort((a, b) => a - b)) {
        npx(["remotion", "still", `"${pacote}"`, comp, `"${dir}/q${String(q).padStart(4, "0")}.jpg"`, `--frame=${q}`, "--image-format=jpeg", "--scale=0.4", ...comum]);
      }
      console.log(`  ${marcas.length} quadros em ${dir} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    if (soQuadros) continue;
    console.log(`▶ ${r.id}: vídeo`);
    const t0 = Date.now();
    npx(["remotion", "render", `"${pacote}"`, comp, `"out/motor/${r.id}.mp4"`, "--crf=12", "--x264-preset=slow", "--jpeg-quality=100", "--pixel-format=yuv420p", "--color-space=bt709", ...comum], { stdio: "inherit" });
    console.log(`✓ out/motor/${r.id}.mp4 (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}
for (const pacote of pacotes) {
  try {
    rmSync(pacote, { recursive: true, force: true });
  } catch {
    // no Windows a pasta às vezes fica presa por um instante; é temporária, pode ficar
  }
}
