// Trilha do Reels 06 ("O cliente não veio", 50 s) em public/audio/06.wav, e a versão narrada em public/audio/07.wav.
// Parte escura: relógio e um tom grave (sem batida). Na virada (quadro 700) entra a música clara do Fio.
// Uso: node scripts/audio-06.mjs
import { mkdirSync, readFileSync } from "node:fs";
import { SR, baixo, bumbo, chimbal, hz, notificacao, novaFaixa, pad, palma, piano, pop, q, ruido, salvar, sino, sucesso, tecla, tique, tocar, toque, whoosh } from "./som.mjs";

const DUR = 50;
// mesmos quadros de src/V6Faltas.tsx
const T = { naoVeio: 75, pensa: 150, estoura: 240, conta: 350, vezes: 470, mes: 590, virada: 700, lista: 790, demo: 870, prova: 1230, fim: 1380 };
const DEMO = T.demo - 66; // a cena do vídeo 02 começa no quadro 66 dele

const BATIDA = 60 / 100;
const COMPASSO = BATIDA * 4;
const VIRADA = q(T.virada);
const FIM = q(T.fim);

const GANHO_VOZ = 1.4;
const GANHO_NARRADO = 1.12; // deixa a versão narrada perto de -14 LUFS

const toc = (t) => Math.exp(-t * 120) * Math.sin(2 * Math.PI * 1400 * t);
const grave = (t) => Math.exp(-t * 5) * Math.sin(2 * Math.PI * (38 + 30 * Math.exp(-t * 20)) * t);

function parteEscura(m) {
  // tom grave em Lá menor, crescendo até a virada
  [33, 40, 45, 48].forEach((n, k) => tocar(m, 0, VIRADA + 0.3, pad(hz(n), VIRADA + 0.3), k < 2 ? 0.07 : 0.035, k % 2 ? 0.3 : -0.3));
  tocar(m, q(T.conta), VIRADA - q(T.conta) + 0.3, pad(hz(52), VIRADA - q(T.conta) + 0.3), 0.03, 0.2);
  // batida de coração durante a conta
  for (let t = q(T.conta); t < VIRADA - 0.6; t += 1.2) {
    tocar(m, t, 0.5, bumbo, 0.32);
    tocar(m, t + 0.22, 0.5, bumbo, 0.2);
  }
  // subida para a virada
  tocar(m, VIRADA - 1.4, 1.4, whoosh(1.4, true), 0.22);
}

// Fmaj7 · Am7 · Dm9 · G6 (a mesma música dos vídeos 01 a 05)
const ACORDES = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
];

function parteClara(m) {
  for (let c = 0; VIRADA + c * COMPASSO < FIM; c++) {
    const t0 = VIRADA + c * COMPASSO;
    const [raiz, notas] = ACORDES[c % ACORDES.length];
    const dur = Math.min(COMPASSO, FIM - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.05, k % 2 ? 0.4 : -0.4));
    for (const b of [0, 2.5]) {
      const tb = t0 + b * BATIDA;
      if (tb < FIM) notas.forEach((n, k) => tocar(m, tb + k * 0.012, 1.6, piano(hz(n)), 0.07, (k - 1.5) * 0.25));
    }
    for (const b of [0, 1.5, 2, 3.5]) {
      const tb = t0 + b * BATIDA;
      if (tb < FIM) tocar(m, tb, 0.5, baixo(hz(raiz)), 0.2);
    }
  }
  // a bateria entra um compasso depois da virada, quando a lista aparece
  const inicio = VIRADA + COMPASSO;
  for (let t = inicio; t < FIM - 0.05; t += BATIDA / 2) {
    const passo = Math.round((t - inicio) / (BATIDA / 2)) % 8;
    if (passo === 0 || passo === 3 || passo === 4) tocar(m, t, 0.4, bumbo, 0.55);
    if (passo === 2 || passo === 6) tocar(m, t, 0.3, palma(), 0.22, 0.1);
    tocar(m, t + (passo % 2 ? 0.02 : 0), 0.1, chimbal(), passo % 2 ? 0.16 : 0.09, 0.3);
  }
  // encerramento: acorde longo
  [48, 52, 55, 59, 62].forEach((n, k) => {
    tocar(m, FIM + k * 0.03, 2.4, piano(hz(n + 12)), 0.06, (k - 2) * 0.2);
    tocar(m, FIM, DUR - FIM, pad(hz(n), DUR - FIM), 0.05, k % 2 ? 0.4 : -0.4);
  });
  tocar(m, FIM, 0.4, bumbo, 0.5);
}

function efeitos(fx) {
  // relógio: tique-taque até o balão estourar
  for (let f = 0; f < T.estoura; f += 15) tocar(fx, q(f), 0.06, f % 30 ? toc : tique, 0.22, 0.4);
  tocar(fx, q(4), 0.2, pop, 0.3);
  // não veio: risco e carimbo
  tocar(fx, q(T.naoVeio), 0.4, whoosh(0.4, true), 0.2);
  tocar(fx, q(T.naoVeio + 30), 0.35, whoosh(0.35, false), 0.18);
  tocar(fx, q(T.naoVeio + 42), 0.8, grave, 0.7);
  // balão inflando e estourando
  tocar(fx, q(T.pensa + 6), 0.6, whoosh(0.6, true), 0.25);
  tocar(fx, q(T.estoura), 0.12, (t) => ruido() * Math.exp(-t * 40), 0.5);
  tocar(fx, q(T.estoura), 0.2, pop, 0.5);
  // celular do cliente: avisos chegando, um por um
  for (let i = 0; i < 4; i++) tocar(fx, q(T.estoura + 34 + i * 9), 0.6, sino(hz(86 + i * 2)), 0.1, (i - 1.5) * 0.3);
  tocar(fx, q(T.estoura + 78), 0.5, whoosh(0.5, false), 0.15);
  // a conta
  tocar(fx, q(T.conta), 0.5, whoosh(0.5, true), 0.28);
  for (let i = 0; i < 3; i++) {
    tocar(fx, q(T.conta + 30 + i * 15), 0.2, pop, 0.3);
    tocar(fx, q(T.conta + 42 + i * 15), 0.5, grave, 0.35);
  }
  tocar(fx, q(T.vezes), 0.5, whoosh(0.5, true), 0.25);
  tocar(fx, q(T.vezes + 6), 0.2, pop, 0.3);
  tocar(fx, q(T.vezes + 22), 0.2, pop, 0.3);
  for (let f = T.vezes + 36; f < T.vezes + 66; f += 2) tocar(fx, q(f), 0.05, tique, 0.12);
  tocar(fx, q(T.mes), 0.5, whoosh(0.5, true), 0.28);
  for (let f = T.mes + 10; f < T.mes + 46; f += 2) tocar(fx, q(f), 0.05, tique, 0.12);
  tocar(fx, q(T.mes + 46), 0.9, grave, 0.8);
  tocar(fx, q(T.mes + 46), 0.4, bumbo, 0.5);
  // virada: clareia
  tocar(fx, q(T.virada), 0.6, whoosh(0.6, true), 0.4);
  sucesso(fx, q(T.virada + 10), 0.3);
  tocar(fx, q(T.lista), 0.5, whoosh(0.5, true), 0.25);
  // a cena dos lembretes (mesmos efeitos do vídeo 02, deslocados)
  const d = (f) => q(DEMO + f);
  tocar(fx, d(62), 0.5, whoosh(0.5, true), 0.3);
  [112, 222, 244, 266].forEach((f) => tocar(fx, d(f), 0.1, toque, 0.55));
  tocar(fx, d(116), 0.5, whoosh(0.5, true), 0.3);
  for (let f = 126; f < 176; f += 1.6) tocar(fx, d(f), 0.04, tecla, 0.12, ruido() * 0.4);
  tocar(fx, d(182), 0.2, pop, 0.45);
  [228, 250, 272].forEach((f) => tocar(fx, d(f), 0.8, sino(hz(91)), 0.16));
  tocar(fx, d(208), 0.4, whoosh(0.4, false), 0.2);
  sucesso(fx, d(274), 0.34);
  tocar(fx, d(294), 0.5, whoosh(0.5, false), 0.25);
  notificacao(fx, d(306));
  // prova
  tocar(fx, q(T.prova), 0.5, whoosh(0.5, true), 0.35);
  tocar(fx, q(T.prova + 44), 0.2, pop, 0.3);
  tocar(fx, q(T.prova + 64), 0.2, pop, 0.3);
  sucesso(fx, q(T.prova + 96), 0.26);
  // encerramento
  tocar(fx, q(T.fim), 0.6, whoosh(0.6, false), 0.4);
  sucesso(fx, q(T.fim + 18), 0.3);
  tocar(fx, q(T.fim + 36), 0.2, pop, 0.4);
}

/** Lê as falas de scripts/narracao-06.json (WAV em public/narracao/06/), corta o silêncio do começo e põe cada uma no seu quadro. */
function narracao() {
  const { falas } = JSON.parse(readFileSync("scripts/narracao-06.json", "utf8"));
  const voz = novaFaixa(DUR);
  falas.forEach((f, i) => {
    const b = readFileSync(`public/narracao/06/${String(i + 1).padStart(2, "0")}.wav`);
    const d = b.indexOf("data") + 8;
    const n = Math.floor((b.length - d) / 4);
    const amostra = (k, c) => b.readInt16LE(d + k * 4 + c * 2) / 32768;
    let inicio = 0;
    while (inicio < n && Math.abs(amostra(inicio, 0)) < 0.01) inicio++;
    inicio = Math.max(0, inicio - Math.round(SR * 0.03));
    const destino = Math.round(q(f.de) * SR);
    for (let k = inicio; k < n && destino + k - inicio < voz[0].length; k++) for (let c = 0; c < 2; c++) voz[c][destino + k - inicio] += amostra(k, c);
  });
  return voz;
}

/** Abaixa a música enquanto a voz fala (sobe devagar quando ela para). */
function abaixarSobVoz(voz) {
  const ganho = new Float32Array(voz[0].length);
  const ataque = 1 / (SR * 0.06);
  const soltura = 1 / (SR * 0.45);
  const janela = Math.round(SR * 0.05);
  let soma = 0;
  let g = 1;
  for (let i = 0; i < ganho.length; i++) {
    soma += Math.abs(voz[0][i]);
    if (i >= janela) soma -= Math.abs(voz[0][i - janela]);
    const alvo = soma / janela > 0.01 ? 0.32 : 1;
    g = alvo < g ? Math.max(alvo, g - ataque) : Math.min(alvo, g + soltura);
    ganho[i] = g;
  }
  return ganho;
}

mkdirSync("public/audio", { recursive: true });
const musica = novaFaixa(DUR);
parteEscura(musica);
parteClara(musica);
const fx = novaFaixa(DUR);
efeitos(fx);

// 06: sem narração
const mix = novaFaixa(DUR);
for (let c = 0; c < 2; c++) for (let i = 0; i < mix[c].length; i++) mix[c][i] = (musica[c][i] * 0.85 + fx[c][i]) * 2.2; // ganho para ficar perto de -14 LUFS, como os outros vídeos
salvar("public/audio/06.wav", mix);
console.log("public/audio/06.wav");

// 07: o mesmo vídeo com narração (voz por cima, música e efeitos abaixam quando ela fala)
const voz = narracao();
const abaixa = abaixarSobVoz(voz);
const narrado = novaFaixa(DUR);
for (let c = 0; c < 2; c++)
  for (let i = 0; i < narrado[c].length; i++) narrado[c][i] = ((musica[c][i] * 0.85 + fx[c][i]) * 2.2 * abaixa[i] + voz[c][i] * GANHO_VOZ) * GANHO_NARRADO;
salvar("public/audio/07.wav", narrado);
console.log("public/audio/07.wav");
