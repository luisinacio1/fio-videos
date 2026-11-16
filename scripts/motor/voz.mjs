// Voz grátis dos vídeos do motor: gera cada fala (scripts/voz-gratis.py, edge-tts), junta com as pausas do roteiro
// e devolve os tempos de cada palavra. Usada por fazer.mjs (vídeos do dia) e fazer-3d.mjs (vídeos 3D).
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { SR, novaFaixa } from "../som.mjs";

const { duracao, FPS } = await import("../../src/motor/roteiro.ts");

const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const npx = (a, opcoes = {}) => execFileSync("npx", a, { shell: true, stdio: ["ignore", "pipe", "inherit"], ...opcoes });

/** Lê um mp3 como amostras estéreo em 44,1 kHz. */
export function ler(arquivo) {
  const tmp = join(tmpdir(), `fio-motor-${process.pid}.wav`);
  npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", `"${arquivo}"`, "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", `"${tmp}"`]);
  const b = readFileSync(tmp);
  rmSync(tmp);
  const d = b.indexOf("data") + 8;
  const n = Math.floor((b.length - d) / 4);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    l[i] = b.readInt16LE(d + i * 4) / 32768;
    r[i] = b.readInt16LE(d + i * 4 + 2) / 32768;
  }
  return [l, r];
}

/** pausa entre as falas (s), a não ser que o roteiro peça outra; nunca mais que PAUSA_MAX */
const PAUSA = 0.1;
const PAUSA_MAX = 0.3;
/** silêncio dentro de uma fala (ponto, vírgula) acima disso é encurtado para RESPIRO */
const SILENCIO_MAX = 0.2;
const RESPIRO = 0.14;

/**
 * Gera a fala de cada trecho e junta tudo num ritmo corrido: pausas curtas entre as falas e os silêncios longos
 * que a voz grátis deixa no meio da frase encurtados. Devolve os tempos (segundos) e a faixa da voz.
 */
export function fazerVoz(r, pasta) {
  const narr = join(tmpdir(), `fio-motor-${process.pid}.json`);
  writeFileSync(narr, JSON.stringify({ voz: r.voz ?? "pt-BR-AntonioNeural", velocidade: r.velocidade ?? "+15%", falas: r.falas }));
  const saida = join(pasta, "falas");
  execFileSync(PYTHON, [resolve("scripts/voz-gratis.py"), narr, saida], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PYTHONIOENCODING: "utf8" } });
  rmSync(narr);
  const palavras = JSON.parse(readFileSync(join(saida, "palavras.json"), "utf8"));
  const tempos = { falas: [], palavras: [] };
  const pedacos = [];
  let t = 0;
  r.falas.forEach((fala, i) => {
    t += i === 0 ? 0.15 : Math.min(PAUSA_MAX, fala.pausa ?? PAUSA);
    const audio = ler(join(saida, `fala-${String(i + 1).padStart(2, "0")}.mp3`));
    const ps = palavras[i];
    if (!ps?.length) throw new Error(`a voz não devolveu palavras para a fala ${i + 1}`);
    // a voz devolve as palavras sem pontuação: volta com as do roteiro quando a contagem bate
    const doRoteiro = fala.texto.split(/\s+/).filter(Boolean);
    const mesmas = doRoteiro.length === ps.length;
    // trechos do áudio que ficam: corta antes da 1ª palavra, depois da última e o excesso de cada silêncio longo
    const trechos = [{ de: Math.max(0, ps[0].a - 0.03), ate: 0 }];
    for (let k = 0; k < ps.length - 1; k++) {
      const vazio = ps[k + 1].a - ps[k].z;
      if (vazio > SILENCIO_MAX) {
        trechos[trechos.length - 1].ate = ps[k].z + RESPIRO / 2;
        trechos.push({ de: ps[k + 1].a - RESPIRO / 2, ate: 0 });
      }
    }
    trechos[trechos.length - 1].ate = Math.min(audio[0].length / SR, ps[ps.length - 1].z + 0.08);
    // onde cada instante do áudio original vai parar na faixa
    const inicioFala = t;
    const mapa = (seg) => {
      let acc = inicioFala;
      for (const tr of trechos) {
        if (seg <= tr.ate) return acc + Math.max(0, seg - tr.de);
        acc += tr.ate - tr.de;
      }
      return acc;
    };
    for (const tr of trechos) {
      pedacos.push({ inicio: t, audio, de: tr.de, ate: tr.ate });
      t += tr.ate - tr.de;
    }
    ps.forEach((p, k) => tempos.palavras.push({ p: mesmas ? doRoteiro[k] : p.p, f: i, a: +mapa(p.a).toFixed(3), z: +mapa(p.z).toFixed(3) }));
    tempos.falas.push({ a: +inicioFala.toFixed(3), z: +t.toFixed(3) });
  });
  const total = duracao(tempos) / FPS + 0.3;
  const voz = novaFaixa(total);
  for (const p of pedacos) {
    const i0 = Math.round(p.inicio * SR);
    const a = Math.round(p.de * SR);
    const b = Math.round(p.ate * SR);
    for (let i = a; i < b && i0 + i - a < voz[0].length; i++) {
      const g = Math.min(1, (i - a) / (SR * 0.008), (b - i) / (SR * 0.008));
      voz[0][i0 + i - a] += p.audio[0][i] * g;
      voz[1][i0 + i - a] += p.audio[1][i] * g;
    }
  }
  return { tempos, voz, total };
}

