// Trilha do tour gravado (src/Tour.tsx): música leve, clique em cada clique do cursor, teclas enquanto digita,
// um "whoosh" a cada etapa e, se houver, a narração por cima (a música abaixa quando a voz fala).
// Uso: node scripts/audio-tour.mjs pc|cel [pasta-da-narracao]
// Com a narração (fala-01.wav = abertura, fala-02.wav = 1ª etapa…, de scripts/separar-narracao.py), cada fala entra
// no começo da sua etapa e a etapa se alonga o quanto for preciso; os quadros a mais vão para src/tour/<formato>-extras.json.
import { readFileSync, writeFileSync } from "node:fs";
import { SR, ajustarVolume, baixo, chimbal, hz, novaFaixa, pad, piano, pop, ruido, salvar, sucesso, tecla, tocar, toque, whoosh } from "./som.mjs";

const [formato = "pc", pastaVoz] = process.argv.slice(2);
const g = JSON.parse(readFileSync(`src/tour/${formato}.json`, "utf8"));
const FPS = 30;
const ABERTURA = 60;
const FECHAMENTO = 100;
const ANTES_DA_FALA = 8;

/** WAV estéreo 16 bits → [esq, dir], sem o silêncio das pontas. */
function lerFala(arq) {
  const b = readFileSync(arq);
  const d = b.indexOf("data") + 8;
  const n = Math.floor((b.length - d) / 4);
  const l = new Float32Array(n);
  const r2 = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    l[k] = b.readInt16LE(d + k * 4) / 32768;
    r2[k] = b.readInt16LE(d + k * 4 + 2) / 32768;
  }
  let a = 0;
  let z = n - 1;
  while (a < n && Math.abs(l[a]) < 0.01) a++;
  while (z > a && Math.abs(l[z]) < 0.01) z--;
  a = Math.max(0, a - Math.round(SR * 0.03));
  z = Math.min(n - 1, z + Math.round(SR * 0.08));
  return [l.subarray(a, z), r2.subarray(a, z)];
}

const capitulos = [...new Set(g.passos.map((p) => p.capitulo))];
const falas = pastaVoz ? [0, ...capitulos.map((_, k) => k + 1)].map((k) => lerFala(`${pastaVoz}/fala-${String(k + 1).padStart(2, "0")}.wav`)) : null;
const base = Object.fromEntries(capitulos.map((c) => [c, 0]));
g.passos.forEach((p) => (base[p.capitulo] += Math.max(2, Math.round((p.ms * FPS) / 1000))));
const extras = {};
if (falas) {
  const quadros = (x, folga) => ANTES_DA_FALA + Math.ceil((x[0].length / SR + folga) * FPS);
  extras.__abertura = Math.max(0, quadros(falas[0], 0.35) - ABERTURA);
  capitulos.forEach((c, k) => {
    const ultimo = k === capitulos.length - 1;
    extras[c] = Math.max(0, quadros(falas[k + 1], ultimo ? 0.8 : 0.45) - base[c] - (ultimo ? FECHAMENTO : 0));
  });
  writeFileSync(`src/tour/${formato}-extras.json`, JSON.stringify(extras, null, 1));
}

// mesma conta de linhaDoTempo em src/Tour.tsx
const inicio = [];
const dur = [];
let t = ABERTURA + (extras.__abertura ?? 0);
g.passos.forEach((p, i) => {
  inicio.push(t);
  let d = Math.max(2, Math.round((p.ms * FPS) / 1000));
  if (!g.passos[i + 1] || g.passos[i + 1].capitulo !== p.capitulo) d += extras[p.capitulo] ?? 0;
  dur.push(d);
  t += d;
});
const fimPassos = t;
const total = t + FECHAMENTO;
const DUR = total / FPS + 0.3;
const q = (f) => f / FPS;

// música: piano e baixo calmos, chimbal leve (lo-fi), sem bateria pesada para não brigar com a voz
const BATIDA = 60 / 84;
const COMPASSO = BATIDA * 4;
const ACORDES = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
];
const m = novaFaixa(DUR);
const fimM = q(fimPassos);
for (let c = 0; c * COMPASSO < fimM; c++) {
  const t0 = c * COMPASSO;
  const [raiz, notas] = ACORDES[c % 4];
  const d = Math.min(COMPASSO, fimM - t0) + 0.4;
  notas.forEach((n, k) => tocar(m, t0, d, pad(hz(n - 12), d), 0.045, k % 2 ? 0.4 : -0.4));
  for (const b of [0, 1.5, 3]) if (t0 + b * BATIDA < fimM) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.015, 1.5, piano(hz(n)), 0.055, (k - 1.5) * 0.25));
  for (const b of [0, 2.5]) if (t0 + b * BATIDA < fimM) tocar(m, t0 + b * BATIDA, 0.6, baixo(hz(raiz)), 0.14);
  for (let b = 0; b < 4; b += 0.5) if (t0 + b * BATIDA < fimM) tocar(m, t0 + b * BATIDA + (b % 1 ? 0.03 : 0), 0.08, chimbal(), b % 1 ? 0.07 : 0.04, 0.3);
}
[48, 52, 55, 59, 62].forEach((n, k) => {
  tocar(m, fimM + k * 0.03, 2.6, piano(hz(n + 12)), 0.06, (k - 2) * 0.2);
  tocar(m, fimM, DUR - fimM, pad(hz(n), DUR - fimM), 0.05, k % 2 ? 0.4 : -0.4);
});

const fx = novaFaixa(DUR);
tocar(fx, 0.15, 0.6, whoosh(0.6, true), 0.25);
sucesso(fx, 0.4, 0.22);
let capAnterior = "";
g.passos.forEach((p, i) => {
  if (p.capitulo !== capAnterior) {
    if (i > 0) tocar(fx, q(inicio[i]) - 0.1, 0.45, whoosh(0.45, true), 0.22);
    capAnterior = p.capitulo;
  }
  if (p.clique) tocar(fx, q(inicio[i] + dur[i] - 3), 0.08, toque, 0.4, 0.1);
  if (p.digitando) for (let k = 0; k < 2; k++) tocar(fx, q(inicio[i]) + k * 0.045, 0.05, tecla, 0.16, ruido() * 0.3);
});
tocar(fx, fimM, 0.6, whoosh(0.6, false), 0.3);
sucesso(fx, fimM + 0.6, 0.28);
tocar(fx, fimM + 0.6, 0.2, pop, 0.3);

// narração: a abertura no começo; cada etapa com a sua fala logo depois do corte
const voz = novaFaixa(DUR);
if (falas) {
  const comecos = [0, ...capitulos.map((c) => inicio[g.passos.findIndex((p) => p.capitulo === c)])];
  falas.forEach((x, k) => {
    const d = Math.round(q(comecos[k] + ANTES_DA_FALA) * SR);
    for (let j = 0; j < x[0].length && d + j < voz[0].length; j++) {
      voz[0][d + j] += x[0][j];
      voz[1][d + j] += x[1][j];
    }
  });
}
const mix = novaFaixa(DUR);
const janela = Math.round(SR * 0.05);
let soma = 0;
let gmus = 1;
for (let k = 0; k < mix[0].length; k++) {
  soma += Math.abs(voz[0][k]);
  if (k >= janela) soma -= Math.abs(voz[0][k - janela]);
  const alvo = soma / janela > 0.01 ? 0.3 : 1;
  gmus = alvo < gmus ? Math.max(alvo, gmus - 1 / (SR * 0.06)) : Math.min(alvo, gmus + 1 / (SR * 0.5));
  for (let c = 0; c < 2; c++) mix[c][k] = m[c][k] * 2 * gmus + fx[c][k] * 2 * (0.6 + 0.4 * gmus) + voz[c][k] * 2.2;
}
const saida = `public/audio/tour-${formato}${falas ? "" : "-sem-voz"}.wav`;
salvar(saida, ajustarVolume(mix, -14));
console.log(saida, DUR.toFixed(1), "s");
