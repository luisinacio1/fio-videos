// Gera a trilha de cada vídeo (música + efeitos no tempo das animações) em public/audio/*.wav.
// Tudo sintetizado aqui: sem música de terceiros, sem risco de direitos autorais.
// Uso: node scripts/audio.mjs
import { mkdirSync } from "node:fs";
import { SR, baixo, bumbo, chimbal, hz, notificacao, novaFaixa as faixaDe, pad, palma, piano, pop, q, ruido, salvar, sino, sucesso, tecla, tique, tocar, toque, whoosh } from "./som.mjs";

const DUR = 15;
const N = SR * DUR;
const BPM = 100;
const BATIDA = 60 / BPM;
const COMPASSO = BATIDA * 4;
const INICIO_BATERIA = COMPASSO; // a batida entra quando o gancho sai de cena
const FIM = 12.6; // quadro 378: encerramento
const novaFaixa = () => faixaDe(DUR);

// ---------- música ----------
// Fmaj7 · Am7 · Dm9 · G6 · Fmaj7 · Am7, e Cmaj9 no encerramento
const ACORDES = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
];

function musica() {
  const m = novaFaixa();
  ACORDES.forEach(([raiz, notas], c) => {
    const t0 = c * COMPASSO;
    if (t0 >= FIM) return;
    const dur = Math.min(COMPASSO, FIM - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.05, k % 2 ? 0.4 : -0.4));
    // piano: no 1 e no "e" do 3 (sincopado)
    for (const b of [0, 2.5]) {
      const tb = t0 + b * BATIDA;
      if (tb >= FIM) continue;
      notas.forEach((n, k) => tocar(m, tb + k * 0.012, 1.6, piano(hz(n)), 0.07, (k - 1.5) * 0.25));
    }
    if (t0 >= INICIO_BATERIA - 0.01) {
      for (const b of [0, 1.5, 2, 3.5]) {
        const tb = t0 + b * BATIDA;
        if (tb < FIM) tocar(m, tb, 0.5, baixo(hz(raiz)), 0.2);
      }
    }
  });
  // bateria
  for (let t = INICIO_BATERIA; t < FIM - 0.05; t += BATIDA / 2) {
    const passo = Math.round((t - INICIO_BATERIA) / (BATIDA / 2)) % 8;
    if (passo === 0 || passo === 3 || passo === 4) tocar(m, t, 0.4, bumbo, 0.55);
    if (passo === 2 || passo === 6) tocar(m, t, 0.3, palma(), 0.22, 0.1);
    tocar(m, t + (passo % 2 ? 0.02 : 0), 0.1, chimbal(), passo % 2 ? 0.16 : 0.09, 0.3);
  }
  // subida antes da batida entrar
  tocar(m, INICIO_BATERIA - 0.9, 0.9, whoosh(0.9, true), 0.18);
  // encerramento: acorde longo
  [48, 52, 55, 59, 62].forEach((n, k) => {
    tocar(m, FIM + k * 0.03, 2.4, piano(hz(n + 12)), 0.06, (k - 2) * 0.2);
    tocar(m, FIM, DUR - FIM, pad(hz(n), DUR - FIM), 0.05, k % 2 ? 0.4 : -0.4);
  });
  tocar(m, FIM, 0.4, bumbo, 0.5);
  return m;
}

/** Efeitos comuns: saída do gancho e encerramento (laço, nome, botão). */
function comuns(fx, saidaGancho) {
  tocar(fx, q(saidaGancho), 0.5, whoosh(0.5, true), 0.35);
  tocar(fx, q(378), 0.6, whoosh(0.6, false), 0.4);
  sucesso(fx, q(378 + 18), 0.3);
  tocar(fx, q(378 + 36), 0.2, pop, 0.4);
}

const VIDEOS = {
  "01": (fx) => {
    comuns(fx, 66);
    [128, 182, 224].forEach((f) => tocar(fx, q(f), 0.1, toque, 0.55));
    tocar(fx, q(138), 0.4, whoosh(0.4, false), 0.18); // rolagem
    for (let i = 0; i < 9; i++) tocar(fx, q(146 + i * 2), 0.05, tique, 0.12, (i % 3) * 0.3 - 0.3);
    sucesso(fx, q(238));
    tocar(fx, q(276), 0.5, whoosh(0.5, true), 0.3);
    tocar(fx, q(304), 0.7, whoosh(0.7, true), 0.22);
    tocar(fx, q(324), 0.2, pop, 0.5);
  },
  "02": (fx) => {
    comuns(fx, 62);
    [112, 222, 244, 266].forEach((f) => tocar(fx, q(f), 0.1, toque, 0.55));
    tocar(fx, q(116), 0.5, whoosh(0.5, true), 0.3);
    for (let f = 126; f < 176; f += 1.6) tocar(fx, q(f), 0.04, tecla, 0.12, ruido() * 0.4);
    tocar(fx, q(182), 0.2, pop, 0.45);
    [228, 250, 272].forEach((f) => tocar(fx, q(f), 0.8, sino(hz(91)), 0.16));
    tocar(fx, q(208), 0.4, whoosh(0.4, false), 0.2);
    sucesso(fx, q(274), 0.34);
    tocar(fx, q(294), 0.5, whoosh(0.5, false), 0.25);
    notificacao(fx, q(306));
  },
  "03": (fx) => {
    comuns(fx, 58);
    tocar(fx, q(64), 0.5, whoosh(0.5, true), 0.3);
    for (let i = 0; i < 20; i++) tocar(fx, q(84 + i * 4), 0.15, pop, 0.12, ((i % 6) - 2.5) * 0.25);
    tocar(fx, q(214), 0.9, whoosh(0.9, false), 0.3);
    tocar(fx, q(236), 0.2, pop, 0.45);
    tocar(fx, q(292), 0.5, whoosh(0.5, true), 0.3);
    for (let i = 1; i < 6; i++) tocar(fx, q(322 + i * 3), 0.06, tique, 0.2);
    tocar(fx, q(346), 0.2, pop, 0.3);
  },
  "04": (fx) => {
    comuns(fx, 56);
    for (let i = 0; i < 4; i++) tocar(fx, q(78 + i * 6), 0.15, pop, 0.14);
    tocar(fx, q(150), 0.1, toque, 0.55);
    sucesso(fx, q(154), 0.2);
    tocar(fx, q(198), 0.5, whoosh(0.5, true), 0.32);
    for (let f = 226; f < 296; f += 3) tocar(fx, q(f), 0.05, tique, 0.13);
    sucesso(fx, q(296), 0.3);
  },
  "05": (fx) => {
    comuns(fx, 56);
    for (let i = 0; i < 4; i++) tocar(fx, q(72 + i * 6), 0.15, pop, 0.14);
    for (let f = 80; f < 160; f += 3) tocar(fx, q(f), 0.05, tique, 0.1);
    tocar(fx, q(168), 0.5, whoosh(0.5, true), 0.3);
    tocar(fx, q(178), 1.4, whoosh(1.4, true), 0.12);
    tocar(fx, q(218), 0.2, pop, 0.45);
    tocar(fx, q(262), 0.5, whoosh(0.5, true), 0.28);
    for (let i = 0; i < 3; i++) tocar(fx, q(282 + i * 6), 0.15, pop, 0.14);
  },
};
mkdirSync("public/audio", { recursive: true });
const base = musica();
for (const [id, efeitos] of Object.entries(VIDEOS)) {
  const fx = novaFaixa();
  efeitos(fx);
  const mix = [new Float32Array(N), new Float32Array(N)];
  for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) mix[c][i] = base[c][i] * 0.85 + fx[c][i];
  salvar(`public/audio/${id}.wav`, mix);
  console.log(`public/audio/${id}.wav`);
}
