// Trilha do piloto 14 (o cliente marca de madrugada), no estilo novo: voz grátis com o tempo de cada palavra.
//   node scripts/audio-14.mjs voz   → junta public/v14/voz/fala-NN.mp3 (de scripts/voz-gratis.py) com as pausas do roteiro
//                                     e grava src/v14/tempos.json (falas e palavras, em segundos do vídeo)
//   node scripts/audio-14.mjs mix   → música + efeitos nos quadros de src/V14Piloto.tsx + voz → public/audio/14.wav
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SR, ajustarVolume, baixo, bumbo, chimbal, env, hz, notificacao, novaFaixa, pad, piano, pop, q, ruido, salvar, sino, sucesso, tecla, tique, tocar, toque, whoosh } from "./som.mjs";

const PASTA = "public/v14/voz";
const roteiro = JSON.parse(readFileSync("scripts/narracao-14.json", "utf8"));

/** Lê um mp3 como amostras estéreo em 44,1 kHz. */
function ler(arquivo) {
  const tmp = join(tmpdir(), `fio-14-${process.pid}.wav`);
  execFileSync("npx", ["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", `"${arquivo}"`, "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", `"${tmp}"`], { shell: true });
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

/** Põe as falas uma depois da outra (com a pausa de cada uma) e devolve os tempos e as amostras. */
function montarVoz() {
  const palavras = JSON.parse(readFileSync(join(PASTA, "palavras.json"), "utf8"));
  const tempos = { falas: [], palavras: [] };
  const pedacos = [];
  let t = 0;
  roteiro.falas.forEach((fala, i) => {
    t += fala.pausa ?? 0.3;
    const audio = ler(join(PASTA, `fala-${String(i + 1).padStart(2, "0")}.mp3`));
    const ps = palavras[i];
    // a voz devolve as palavras sem pontuação: volta com as do roteiro quando a contagem bate
    const doRoteiro = fala.texto.split(/\s+/).filter(Boolean);
    const mesmas = doRoteiro.length === ps.length;
    // corta o silêncio do começo (até 60 ms antes da 1ª palavra) e do fim
    const ini = Math.max(0, ps[0].a - 0.06);
    const fim = Math.min(audio[0].length / SR, ps[ps.length - 1].z + 0.18);
    pedacos.push({ inicio: t, audio, de: ini, ate: fim });
    ps.forEach((p, k) => tempos.palavras.push({ p: mesmas ? doRoteiro[k] : p.p, f: i, a: +(t + p.a - ini).toFixed(3), z: +(t + p.z - ini).toFixed(3) }));
    tempos.falas.push({ a: +t.toFixed(3), z: +(t + fim - ini).toFixed(3) });
    t += fim - ini;
  });
  return { tempos, pedacos, total: t };
}

const modo = process.argv[2];
const { tempos, pedacos, total } = montarVoz();

if (modo === "voz") {
  mkdirSync("src/v14", { recursive: true });
  writeFileSync("src/v14/tempos.json", JSON.stringify(tempos, null, 1));
  tempos.falas.forEach((f, i) => console.log(`fala ${i + 1}: ${f.a.toFixed(2)} → ${f.z.toFixed(2)}  ${roteiro.falas[i].texto}`));
  console.log(`total ${total.toFixed(2)} s`);
  process.exit(0);
}

// ---------- mix ----------
const FPS = 30;
const limpa = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Segundo em que a palavra é dita na fala (1 = primeira). Mesmo w() de src/V14Piloto.tsx, mas em segundos. */
function w(fala, texto, vez = 1) {
  const achadas = tempos.palavras.filter((p) => p.f === fala - 1 && limpa(p.p) === limpa(texto));
  if (!achadas[vez - 1]) throw new Error(`palavra não achada: ${fala} ${texto}`);
  return achadas[vez - 1].a;
}
const fimFala = (n) => tempos.falas[n - 1].z;
const DURACAO = Math.round((total + 2.6) * FPS) / FPS; // mesmo DURACAO_14 de src/V14Piloto.tsx
const DUR = DURACAO + 0.3;

function voz() {
  const v = novaFaixa(DUR);
  for (const p of pedacos) {
    const i0 = Math.round(p.inicio * SR);
    const a = Math.round(p.de * SR);
    const b = Math.round(p.ate * SR);
    for (let i = a; i < b && i0 + i - a < v[0].length; i++) {
      // 8 ms de rampa nas pontas, para não estalar no corte
      const g = Math.min(1, (i - a) / (SR * 0.008), (b - i) / (SR * 0.008));
      v[0][i0 + i - a] += p.audio[0][i] * g;
      v[1][i0 + i - a] += p.audio[1][i] * g;
    }
  }
  return v;
}

// música: noite (pad grave + piano espaçado) até o "Confirmado", depois clara com batida leve
const BATIDA = 60 / 96;
const COMPASSO = BATIDA * 4;
const NOITE = [
  [38, [57, 60, 64]],
  [41, [57, 60, 65]],
  [36, [55, 60, 64]],
  [43, [55, 59, 62]],
];
const DIA = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
];

function musica() {
  const m = novaFaixa(DUR);
  const virada = w(6, "Confirmado");
  for (let c = 0; c * COMPASSO < virada; c++) {
    const t0 = c * COMPASSO;
    const [raiz, notas] = NOITE[c % 4];
    const dur = Math.min(COMPASSO, virada - t0) + 0.3;
    tocar(m, t0, dur, pad(hz(raiz + 12), dur), 0.07, -0.2);
    notas.forEach((n, k) => tocar(m, t0 + k * 0.5 * BATIDA, 1.8, piano(hz(n + 12)), 0.045, (k - 1) * 0.35));
    for (let b = 0; b < 4; b++) if (t0 + b * BATIDA < virada) tocar(m, t0 + b * BATIDA, 0.08, tique, 0.025, 0.4);
  }
  const fim = DURACAO;
  for (let c = 0; virada + c * COMPASSO < fim; c++) {
    const t0 = virada + c * COMPASSO;
    const [raiz, notas] = DIA[c % 4];
    const dur = Math.min(COMPASSO, fim - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.045, k % 2 ? 0.4 : -0.4));
    for (const b of [0, 1.5, 2.5]) if (t0 + b * BATIDA < fim) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.012, 1.4, piano(hz(n)), 0.06, (k - 1.5) * 0.25));
    for (const b of [0, 2, 2.5]) if (t0 + b * BATIDA < fim) tocar(m, t0 + b * BATIDA, 0.5, baixo(hz(raiz)), 0.17);
    for (let b = 0; b < 4; b += 0.5) if (t0 + b * BATIDA < fim) tocar(m, t0 + b * BATIDA, 0.1, chimbal(), b % 1 ? 0.05 : 0.08, 0.3);
    for (const b of [0, 2]) if (t0 + b * BATIDA < fim) tocar(m, t0 + b * BATIDA, 0.4, bumbo, 0.35);
  }
  return m;
}

const zumbir = (t) => env(t, 0.004, 9) * Math.sign(Math.sin(2 * Math.PI * 160 * t)) * 0.35 * (Math.floor(t * 14) % 2);
const apagar = (t) => Math.exp(-t * 60) * (ruido() * 0.4 + Math.sin(2 * Math.PI * 1300 * t) * 0.3);

const bip = (t) => env(t, 0.002, 12) * Math.sin(2 * Math.PI * 2093 * t) * (t < 0.09 ? 1 : 0);
const boing = (t) => env(t, 0.004, 5) * Math.sin(2 * Math.PI * (180 + 140 * Math.sin(t * 38) * Math.exp(-t * 6)) * t);

async function efeitos() {
  const fx = novaFaixa(DUR);
  // os mesmos quadros do vídeo (src/v14/linha.ts)
  const { criarLinha } = await import("../src/v14/linha.ts");
  const { MARCAS } = criarLinha(tempos);
  for (const [quadro, tipo] of MARCAS) {
    const t = quadro / FPS;
    if (tipo === "whoosh") tocar(fx, t, 0.5, whoosh(0.5, true), 0.4);
    else if (tipo === "whooshLongo") tocar(fx, t, 0.9, whoosh(0.9, false), 0.45);
    else if (tipo === "pop") tocar(fx, t, 0.2, pop, 0.32);
    else if (tipo === "toque") tocar(fx, t, 0.1, toque, 0.4);
    else if (tipo === "tecla") tocar(fx, t, 0.08, tecla, 0.22, 0.2);
    else if (tipo === "apagar") tocar(fx, t, 0.06, apagar, 0.2, -0.2);
    else if (tipo === "tique") tocar(fx, t, 0.06, tique, 0.14);
    else if (tipo === "sucesso") sucesso(fx, t, 0.3);
    else if (tipo === "notificacao") notificacao(fx, t);
    else if (tipo === "zumbir") tocar(fx, t, 0.5, zumbir, 0.25);
    else if (tipo === "bumbo") tocar(fx, t, 0.4, bumbo, 0.55);
    else if (tipo === "bip") [0, 0.13, 0.26].forEach((d) => tocar(fx, t + d, 0.1, bip, 0.22));
    else if (tipo === "boing") tocar(fx, t, 0.6, boing, 0.4);
    else if (tipo === "sino") [88, 92, 95, 100].forEach((n, k) => tocar(fx, t + k * 0.06, 1.2, sino(hz(n)), 0.09));
  }
  return fx;
}

const m = musica();
const fx = await efeitos();
const v = voz();
const mix = novaFaixa(DUR);
const janela = Math.round(SR * 0.05);
let soma = 0;
let g = 1;
for (let i = 0; i < mix[0].length; i++) {
  soma += Math.abs(v[0][i]);
  if (i >= janela) soma -= Math.abs(v[0][i - janela]);
  const alvo = soma / janela > 0.01 ? 0.35 : 1;
  g = alvo < g ? Math.max(alvo, g - 1 / (SR * 0.06)) : Math.min(alvo, g + 1 / (SR * 0.45));
  for (let c = 0; c < 2; c++) mix[c][i] = m[c][i] * 0.85 * g * 2 + fx[c][i] * (0.55 + 0.45 * g) * 2 + v[c][i] * 2.2;
}
mkdirSync("public/audio", { recursive: true });
salvar("public/audio/14.wav", ajustarVolume(mix, -14));
console.log("public/audio/14.wav", DUR.toFixed(1), "s", "| fim da última fala", fimFala(tempos.falas.length).toFixed(2));
