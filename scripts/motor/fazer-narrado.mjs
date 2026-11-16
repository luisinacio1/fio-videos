// Faz um vídeo do motor com uma narração gravada (em vez da voz grátis do fazer.mjs).
//   node scripts/motor/fazer-narrado.mjs <roteiro.json> <narracao.mp3> [--quadros] [--so-tempos]
// Transcreve a narração (scripts/palavras-narracao.py, faster-whisper), alinha as palavras com as falas do roteiro
// (scripts/alinhar-falas.py), confere as referências e renderiza em out/motor/<id>.mp4.
// Use PYTHON=... para um Python que tenha faster-whisper.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ajustarVolume, salvar } from "../som.mjs";
import { musica } from "./musica.mjs";

const { conferir, duracao, linhaDasCenas, quadro, FPS } = await import("../../src/motor/roteiro.ts");

const args = process.argv.slice(2);
const [arquivo, narracao] = args.filter((a) => !a.startsWith("--"));
const quadros = args.includes("--quadros");
const soTempos = args.includes("--so-tempos");
const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const npx = (a, opcoes = {}) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"], ...opcoes });
const py = (script, a) => execFileSync(PYTHON, [resolve(script), ...a], { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, PYTHONIOENCODING: "utf8" } });

const r = JSON.parse(readFileSync(arquivo, "utf8"));
let erros = conferir(r);
if (erros.length) throw new Error(`roteiro com problemas:\n  - ${erros.join("\n  - ")}`);

const pasta = join("public", "motor", r.id);
mkdirSync(pasta, { recursive: true });
const ouvidas = join(pasta, "palavras-narracao.json");
if (!existsSync(ouvidas)) {
  console.log("▶ transcrevendo a narração");
  py("scripts/palavras-narracao.py", [narracao, ouvidas]);
}
py("scripts/alinhar-falas.py", [ouvidas, arquivo, join(pasta, "tempos.json")]);
const tempos = JSON.parse(readFileSync(join(pasta, "tempos.json"), "utf8"));
erros = conferir(r, tempos);
if (erros.length) throw new Error(`referências com problemas:\n  - ${erros.join("\n  - ")}`);
console.log(tempos.falas.map((f, i) => `  ${i + 1}. ${f.a.toFixed(1)}–${f.z.toFixed(1)} s  ${r.falas[i].texto}`).join("\n"));
if (soTempos) process.exit(0);

// a voz entra como veio (só o volume é ajustado); a música segue o mesmo motor dos vídeos diários
const voz = join(pasta, `voz${narracao.slice(narracao.lastIndexOf("."))}`);
if (resolve(narracao) !== resolve(voz)) copyFileSync(narracao, voz);
const wav = join(pasta, "voz.wav");
npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", `"${voz}"`, "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "2", `"${wav}"`]);
const total = duracao(tempos) / FPS + 0.3;
const virada = r.virada ? quadro(tempos, r.virada) / FPS : total / 2;
salvar(join(pasta, "musica.wav"), ajustarVolume(musica(total, virada), -20));
const props = resolve(pasta, "props.json");
writeFileSync(props, JSON.stringify({ roteiro: r, tempos, voz: `motor/${r.id}/voz.wav`, musica: `motor/${r.id}/musica.wav` }));

const pacote = join(tmpdir(), `fio-motor-pacote-${process.pid}`);
console.log("▶ preparando o render");
npx(["remotion", "bundle", `--out-dir="${pacote}"`, "--log=error"]);
mkdirSync("out/motor", { recursive: true });
if (quadros) {
  const dir = `out/motor/${r.id}`;
  mkdirSync(dir, { recursive: true });
  const marcas = [...linhaDasCenas(r, tempos).map((c) => Math.round((c.de + c.ate) / 2)), duracao(tempos) - 5];
  for (const q of [...new Set(marcas)].sort((a, b) => a - b)) {
    npx(["remotion", "still", `"${pacote}"`, "motor", `"${dir}/q${String(q).padStart(4, "0")}.jpg"`, `--frame=${q}`, `--props="${props}"`, "--image-format=jpeg", "--scale=0.4", "--log=error"]);
  }
  console.log(`  quadros em ${dir}`);
}
console.log(`▶ ${r.id}: vídeo`);
npx(["remotion", "render", `"${pacote}"`, "motor", `"out/motor/${r.id}.mp4"`, `--props="${props}"`, "--crf=12", "--x264-preset=slow", "--jpeg-quality=100", "--pixel-format=yuv420p", "--color-space=bt709", "--log=error"], { stdio: "inherit" });
console.log(`✓ out/motor/${r.id}.mp4`);
try {
  rmSync(pacote, { recursive: true, force: true });
} catch {
  // no Windows a pasta às vezes fica presa por um instante; é temporária, pode ficar
}
