// Trilha do vídeo 13 (O Juninho e a conta da comissão) em public/audio/13.wav.
// Música em três partes (clara → tensa à noite → clara com batida depois do Fio), efeitos no quadro de cada
// acontecimento de src/V13Comissao.tsx e a narração por cima, com a música abaixando quando a voz fala.
// Uso: node scripts/audio-13.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SR, ajustarVolume, baixo, bumbo, chimbal, env, hz, novaFaixa, pad, palma, piano, pop, q, ruido, salvar, sino, sucesso, tique, tocar, toque, whoosh } from "./som.mjs";

const tempos = JSON.parse(readFileSync("src/v13/tempos.json", "utf8"));
const ATRASO = 0.5; // mesmo ATRASO_NARRACAO de src/V13Comissao.tsx
const Q = (s) => Math.round((s + ATRASO) * 30);
const limpa = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function w(fala, texto, vez = 1) {
  const achadas = tempos.palavras.filter((p) => p.f === fala - 1 && limpa(p.p) === limpa(texto));
  return Q(achadas[vez - 1].a);
}
// mesmos inícios de cena de src/V13Comissao.tsx
const S = { cozinha: Q(6.3), conta: Q(10.5), errou: Q(19.15), fio: Q(22.6), painel: Q(25.0), entrou: Q(33.85), noite: Q(36.95), praia: Q(40.75), fim: Q(44.45) };
const DURACAO = Q(tempos.falas[9].z) + 66;
const DUR = DURACAO / 30 + 0.3;

// ---------- sons próprios deste vídeo ----------
const papel = () => {
  let lp = 0;
  return (t) => {
    lp += 0.5 * (ruido() - lp);
    return lp * env(t, 0.005, 18) * (1 + 0.6 * Math.sin(t * 180));
  };
};
const zumbido = (t) => env(t, 0.004, 4) * Math.sign(Math.sin(2 * Math.PI * 110 * t)) * 0.5 * (t < 0.35 ? 1 : 0);
const rebobinar = (dur) => (t) => {
  const f = 900 * Math.pow(0.12, t / dur);
  const fase = 2 * Math.PI * f * t;
  return ((((fase / (2 * Math.PI)) % 1) * 2 - 1) * 0.35 + ruido() * 0.15) * Math.sin((Math.PI * t) / dur);
};
const ronco = (dur) => {
  let lp = 0;
  return (t) => {
    lp += 0.04 * (ruido() - lp);
    const catraca = Math.floor(t * 28) % 2 ? 1 : 0.55;
    return lp * 6 * catraca * Math.sin((Math.PI * t) / dur);
  };
};
const ondas = (dur) => {
  let lp = 0;
  return (t) => {
    lp += 0.03 * (ruido() - lp);
    return lp * 4 * (0.5 + 0.5 * Math.sin(t * 1.3)) * Math.min(1, t / 0.6, (dur - t) / 0.6);
  };
};
const bip = (t) => env(t, 0.002, 12) * Math.sin(2 * Math.PI * 2093 * t) * (t < 0.09 ? 1 : 0);

// ---------- música ----------
const BATIDA = 60 / 100;
const COMPASSO = BATIDA * 4;
const CLARO = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
];

function musica() {
  const m = novaFaixa(DUR);
  // A · abertura clara, sem bateria pesada
  const fimA = q(S.cozinha);
  for (let c = 0; c * COMPASSO < fimA; c++) {
    const t0 = c * COMPASSO;
    const [raiz, notas] = CLARO[c % 4];
    for (const b of [0, 1.5, 2.5]) if (t0 + b * BATIDA < fimA) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.012, 1.4, piano(hz(n)), 0.06, (k - 1.5) * 0.25));
    for (const b of [0, 2]) if (t0 + b * BATIDA < fimA) tocar(m, t0 + b * BATIDA, 0.5, baixo(hz(raiz)), 0.16);
    for (let b = 0; b < 4; b += 0.5) if (t0 + b * BATIDA < fimA) tocar(m, t0 + b * BATIDA, 0.1, chimbal(), 0.07, 0.3);
  }
  // B · a noite: tom grave em Lá menor, pulsação de coração na hora das contas
  const iniB = q(S.cozinha);
  const fimB = q(S.fio);
  [33, 40, 45, 48].forEach((n, k) => tocar(m, iniB, fimB - iniB + 0.3, pad(hz(n), fimB - iniB + 0.3), k < 2 ? 0.08 : 0.04, k % 2 ? 0.3 : -0.3));
  for (let t = q(S.conta); t < q(S.errou) - 0.3; t += 1.0 - Math.min(0.45, (t - q(S.conta)) * 0.05)) {
    tocar(m, t, 0.5, bumbo, 0.34);
    tocar(m, t + 0.2, 0.5, bumbo, 0.2);
  }
  // C · depois do Fio: clara, com batida
  const iniC = q(S.fio) + 0.1;
  const fimC = q(S.fim);
  for (let c = 0; iniC + c * COMPASSO < fimC; c++) {
    const t0 = iniC + c * COMPASSO;
    const [raiz, notas] = CLARO[c % 4];
    const dur = Math.min(COMPASSO, fimC - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.05, k % 2 ? 0.4 : -0.4));
    for (const b of [0, 2.5]) if (t0 + b * BATIDA < fimC) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.012, 1.6, piano(hz(n)), 0.07, (k - 1.5) * 0.25));
    for (const b of [0, 1.5, 2, 3.5]) if (t0 + b * BATIDA < fimC) tocar(m, t0 + b * BATIDA, 0.5, baixo(hz(raiz)), 0.2);
  }
  for (let t = iniC + COMPASSO; t < fimC - 0.05; t += BATIDA / 2) {
    const passo = Math.round((t - iniC - COMPASSO) / (BATIDA / 2)) % 8;
    if (passo === 0 || passo === 3 || passo === 4) tocar(m, t, 0.4, bumbo, 0.5);
    if (passo === 2 || passo === 6) tocar(m, t, 0.3, palma(), 0.2, 0.1);
    tocar(m, t + (passo % 2 ? 0.02 : 0), 0.1, chimbal(), passo % 2 ? 0.15 : 0.08, 0.3);
  }
  // fim: acorde longo
  [48, 52, 55, 59, 62].forEach((n, k) => {
    tocar(m, fimC + k * 0.03, 2.6, piano(hz(n + 12)), 0.06, (k - 2) * 0.2);
    tocar(m, fimC, DUR - fimC, pad(hz(n), DUR - fimC), 0.05, k % 2 ? 0.4 : -0.4);
  });
  tocar(m, fimC, 0.4, bumbo, 0.5);
  return m;
}

function efeitos() {
  const fx = novaFaixa(DUR);
  const em = (f) => q(f);
  // 1 · equipe
  tocar(fx, em(w(1, "Juninho") - 2), 0.2, pop, 0.35);
  tocar(fx, em(w(1, "cresceu") - 4), 0.7, whoosh(0.7, false), 0.35);
  [w(1, "Léo"), w(1, "Caio"), w(1, "André")].forEach((f, i) => tocar(fx, em(f), 0.2, pop, 0.35, (i - 1) * 0.5));
  // 2 · cozinha: chicote e comandas caindo
  tocar(fx, em(S.cozinha), 0.4, whoosh(0.4, true), 0.4);
  const t0 = w(2, "cresceu");
  for (let i = 0; i < 7; i++) tocar(fx, em(t0 + i * 7 + 10), 0.25, papel(), 0.35, ((i % 3) - 1) * 0.4);
  // 3 · meia-noite
  tocar(fx, em(S.conta), 0.5, bumbo, 0.6);
  const meia = w(3, "Meia-noite");
  [0, 4, 8].forEach((d) => tocar(fx, em(meia + d), 0.1, bip, 0.22));
  for (let f = meia + 20, passo = 15; f < S.errou - 4; f += passo, passo = Math.max(5, passo - 0.6)) tocar(fx, em(f), 0.06, tique, 0.16, 0.4);
  [w(3, "Quanto", 1), w(3, "Léo"), w(3, "Caio"), w(3, "André")].forEach((f, i) => {
    tocar(fx, em(f - 2), 0.4, bumbo, 0.55);
    tocar(fx, em(f - 2), 0.2, pop, 0.3, (i % 2 ? 0.4 : -0.4));
  });
  // 4 · errou e rebobina
  tocar(fx, em(S.errou + 8), 0.5, bumbo, 0.7);
  tocar(fx, em(w(4, "Errou") + 2), 0.4, zumbido, 0.3);
  tocar(fx, em(w(4, "começou")), 1.0, rebobinar(1.0), 0.5);
  // 5 · o Fio
  tocar(fx, em(S.fio - 6), 0.8, whoosh(0.8, true), 0.35);
  sucesso(fx, em(w(5, "Fio")), 0.34);
  [96, 100, 103].forEach((n, k) => tocar(fx, em(w(5, "Fio")) + 0.12 + k * 0.07, 1.0, sino(hz(n)), 0.12, (k - 1) * 0.5));
  tocar(fx, em(S.painel - 16), 0.6, whoosh(0.6, true), 0.4);
  // 6 · painel
  const at = w(6, "atendimento");
  for (let i = 0; i < 5; i++) {
    tocar(fx, em(at + 4 + i * 9 - 14), 0.25, papel(), 0.28, ((i % 3) - 1) * 0.5);
    tocar(fx, em(at + 4 + i * 9), 0.1, toque, 0.35);
  }
  const com = w(6, "comissão");
  for (let i = 0; i < 5; i++) tocar(fx, em(com + i * 5), 0.2, pop, 0.3);
  const som = w(6, "No");
  tocar(fx, em(som), 0.5, whoosh(0.5, true), 0.3);
  for (let f = som + 6; f < som + 52; f += 2) tocar(fx, em(f), 0.05, tique, 0.1);
  sucesso(fx, em(som + 52), 0.28);
  const cada = w(6, "cada", 3);
  tocar(fx, em(cada - 4), 0.5, whoosh(0.5, true), 0.3);
  [0, 5, 10].forEach((d) => tocar(fx, em(cada + d + 4), 0.2, pop, 0.3));
  // 7 · entrou
  tocar(fx, em(S.entrou), 0.5, whoosh(0.5, true), 0.35);
  const ent = w(7, "entrou");
  for (let f = ent - 4; f < ent + 34; f += 2) tocar(fx, em(f), 0.05, tique, 0.12);
  sucesso(fx, em(ent + 34), 0.3);
  tocar(fx, em(w(7, "sem") + 2), 0.3, whoosh(0.3, false), 0.3);
  // 8 · porta de enrolar
  const fecha = w(8, "fecha");
  tocar(fx, em(S.noite - 2), q(fecha + 8 - S.noite + 2), ronco(q(fecha + 8 - S.noite + 2)), 0.5);
  tocar(fx, em(fecha + 6), 0.5, bumbo, 0.7);
  tocar(fx, em(fecha + 8), 0.2, pop, 0.2);
  const abre = w(8, "e");
  tocar(fx, em(abre), 0.85, ronco(0.85), 0.4);
  [57, 64, 69, 72].forEach((n, k) => tocar(fx, em(abre + 14) + k * 0.05, 2.0, sino(hz(n + 12)), 0.08));
  // 9 · praia
  tocar(fx, em(S.praia), 0.6, whoosh(0.6, true), 0.45);
  tocar(fx, em(S.praia + 2), 0.5, whoosh(0.5, false), 0.3);
  tocar(fx, em(S.praia + 10), q(S.fim + 20 - S.praia - 10), ondas(q(S.fim + 20 - S.praia - 10)), 0.25);
  const apos = w(9, "aposentou");
  tocar(fx, em(apos), 0.5, bumbo, 0.7);
  tocar(fx, em(apos), 0.2, pop, 0.3);
  [88, 92, 95, 100].forEach((n, k) => tocar(fx, em(w(9, "praia")) + k * 0.06, 1.2, sino(hz(n)), 0.1));
  // 10 · fim
  tocar(fx, em(S.fim), 0.7, whoosh(0.7, false), 0.4);
  sucesso(fx, em(w(10, "Fio")), 0.3);
  tocar(fx, em(w(10, "agenda") - 4), 0.2, pop, 0.4);
  return fx;
}

function narracao() {
  const tmp = join(tmpdir(), `fio-13-${process.pid}.wav`);
  execFileSync("npx", ["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", "public/v13/narracao.mp3", "-ar", String(SR), "-ac", "2", "-c:a", "pcm_s16le", `"${tmp}"`], { shell: true });
  const b = readFileSync(tmp);
  rmSync(tmp);
  const d = b.indexOf("data") + 8;
  const n = Math.floor((b.length - d) / 4);
  const voz = novaFaixa(DUR);
  const ini = Math.round(ATRASO * SR);
  for (let i = 0; i < n && ini + i < voz[0].length; i++) {
    voz[0][ini + i] = b.readInt16LE(d + i * 4) / 32768;
    voz[1][ini + i] = b.readInt16LE(d + i * 4 + 2) / 32768;
  }
  return voz;
}

const m = musica();
const fx = efeitos();
const voz = narracao();
const mix = novaFaixa(DUR);
const janela = Math.round(SR * 0.05);
let soma = 0;
let g = 1;
for (let i = 0; i < mix[0].length; i++) {
  soma += Math.abs(voz[0][i]);
  if (i >= janela) soma -= Math.abs(voz[0][i - janela]);
  const alvo = soma / janela > 0.01 ? 0.32 : 1;
  g = alvo < g ? Math.max(alvo, g - 1 / (SR * 0.06)) : Math.min(alvo, g + 1 / (SR * 0.45));
  for (let c = 0; c < 2; c++) mix[c][i] = m[c][i] * 0.85 * g * 2 + fx[c][i] * (0.55 + 0.45 * g) * 2 + voz[c][i] * 2.2;
}
mkdirSync("public/audio", { recursive: true });
salvar("public/audio/13.wav", ajustarVolume(mix, -14));
console.log("public/audio/13.wav", DUR.toFixed(1), "s");
