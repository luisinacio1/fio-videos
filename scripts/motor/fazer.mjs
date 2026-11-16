// Faz os vídeos do motor a partir dos roteiros (src/motor/roteiro.ts explica o formato).
//   node scripts/motor/fazer.mjs <roteiro.json> [...]           → voz, música e vídeo em out/motor/<id>.mp4
//   ... --quadros                                                → também tira quadros de conferência em out/motor/<id>/
//   ... --so-voz                                                 → só a voz e os tempos (para conferir as referências rápido)
// A voz grátis vem de scripts/voz-gratis.py (Python com edge-tts; use PYTHON=... para escolher o Python).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { ajustarVolume, salvar } from "../som.mjs";
import { musica } from "./musica.mjs";
import { fazerVoz } from "./voz.mjs";

const { conferir, duracao, linhaDasCenas, quadro, FPS } = await import("../../src/motor/roteiro.ts");

const args = process.argv.slice(2);
const arquivos = args.filter((a) => !a.startsWith("--"));
const soVoz = args.includes("--so-voz");
const quadros = args.includes("--quadros");
const npx = (a, opcoes = {}) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"], ...opcoes });

const prontos = [];
for (const arquivo of arquivos) {
  const r = JSON.parse(readFileSync(arquivo, "utf8"));
  let erros = conferir(r);
  if (erros.length) {
    console.error(`✗ ${basename(arquivo)}:\n  - ${erros.join("\n  - ")}`);
    process.exitCode = 1;
    continue;
  }
  const pasta = join("public", "motor", r.id);
  mkdirSync(pasta, { recursive: true });
  console.log(`▶ ${r.id}: voz`);
  const { tempos, voz, total } = fazerVoz(r, pasta);
  writeFileSync(join(pasta, "tempos.json"), JSON.stringify(tempos, null, 1));
  erros = conferir(r, tempos);
  if (erros.length) {
    console.error(`✗ ${r.id}:\n  - ${erros.join("\n  - ")}`);
    process.exitCode = 1;
    continue;
  }
  const falas = tempos.falas.map((f, i) => `  ${i + 1}. ${f.a.toFixed(1)}–${f.z.toFixed(1)} s  ${r.falas[i].texto}`);
  console.log(falas.join("\n"));
  // os marcos de tempo (como no fazer-3d): conteúdo até a ponte, a ponte, o Fio até a cena final e o vídeo inteiro
  const fecho = r.cenas.find((c) => c.tipo === "final");
  if (r.ponte && r.fio && fecho) {
    const seg = (q) => (q / FPS).toFixed(1);
    const [ponte, fio, final] = [r.ponte, r.fio, fecho.de].map((ref) => quadro(tempos, ref));
    console.log(`  conteúdo ${seg(ponte)} s · ponte ${seg(fio - ponte)} s · Fio ${seg(final - fio)} s · total ${seg(duracao(tempos))} s${r.tipo ? "" : " (sem tipo: marcos não conferidos)"}`);
  }
  if (soVoz) continue;
  salvar(join(pasta, "voz.wav"), ajustarVolume(voz, -15));
  // a música vira de "problema" para "solução": onde o roteiro disser, senão na entrada do Fio, senão na primeira tela do app
  const viradaRef = r.virada ?? r.fio;
  const virada = viradaRef ? quadro(tempos, viradaRef) / FPS : (linhaDasCenas(r, tempos).find((c) => c.cena.tipo === "app" || c.cena.tipo === "apresentaFio")?.de ?? duracao(tempos) * 0.5) / FPS;
  salvar(join(pasta, "musica.wav"), ajustarVolume(musica(total, virada), -20));
  const props = { roteiro: r, tempos, voz: `motor/${r.id}/voz.wav`, musica: `motor/${r.id}/musica.wav` };
  writeFileSync(join(pasta, "props.json"), JSON.stringify(props));
  prontos.push({ r, tempos, pasta });
}

if (!soVoz && prontos.length) {
  // um pacote só para todos os vídeos (o pacote leva a pasta public/ junto, por isso vem depois da voz)
  const pacote = join(tmpdir(), `fio-motor-pacote-${process.pid}`);
  console.log("▶ preparando o render");
  npx(["remotion", "bundle", `--out-dir="${pacote}"`, "--log=error"]);
  mkdirSync("out/motor", { recursive: true });
  for (const { r, tempos, pasta } of prontos) {
    console.log(`▶ ${r.id}: vídeo`);
    const props = resolve(pasta, "props.json");
    npx(["remotion", "render", `"${pacote}"`, "motor", `"out/motor/${r.id}.mp4"`, `--props="${props}"`, "--crf=12", "--x264-preset=slow", "--jpeg-quality=100", "--pixel-format=yuv420p", "--color-space=bt709", "--log=error"], { stdio: "inherit" });
    if (quadros) {
      const dir = `out/motor/${r.id}`;
      mkdirSync(dir, { recursive: true });
      const marcas = [...linhaDasCenas(r, tempos).flatMap((c) => [c.de + 16, Math.round((c.de + c.ate) / 2)]), duracao(tempos) - 5];
      for (const q of [...new Set(marcas)].sort((a, b) => a - b)) {
        npx(["remotion", "still", `"${pacote}"`, "motor", `"${dir}/q${String(q).padStart(4, "0")}.jpg"`, `--frame=${q}`, `--props="${props}"`, "--image-format=jpeg", "--scale=0.4", "--log=error"]);
      }
      console.log(`  quadros em ${dir}`);
    }
    console.log(`✓ out/motor/${r.id}.mp4`);
  }
  try {
    rmSync(pacote, { recursive: true, force: true });
  } catch {
    // no Windows a pasta às vezes fica presa por um instante; é temporária, pode ficar
  }
}
