// Gera os efeitos sonoros do motor em public/motor/sfx/*.wav (uma vez; o vídeo só toca os arquivos).
// Tudo sintetizado (scripts/som.mjs): sem som de terceiros. Uso (em videos/): node scripts/motor/sfx.mjs
import { mkdirSync } from "node:fs";
import { bumbo, env, hz, notificacao, novaFaixa, pop, ruido, salvar, sino, sucesso, tecla, tique, tocar, toque, whoosh } from "../som.mjs";

const PASTA = "public/motor/sfx";
mkdirSync(PASTA, { recursive: true });

const apagar = (t) => Math.exp(-t * 60) * (ruido() * 0.4 + Math.sin(2 * Math.PI * 1300 * t) * 0.3);
const zumbir = (t) => env(t, 0.004, 3) * Math.sign(Math.sin(2 * Math.PI * 160 * t)) * 0.35 * (Math.floor(t * 14) % 2);
const bip = (t) => env(t, 0.002, 12) * Math.sin(2 * Math.PI * 2093 * t) * (t < 0.09 ? 1 : 0);
const boing = (t) => env(t, 0.004, 5) * Math.sin(2 * Math.PI * (180 + 140 * Math.sin(t * 38) * Math.exp(-t * 6)) * t);
const estalo = (t) => Math.exp(-t * 220) * (ruido() * 0.7 + Math.sin(2 * Math.PI * 4200 * t) * 0.3);

const EFEITOS = {
  whoosh: [1.0, (f) => tocar(f, 0, 0.5, whoosh(0.5, true), 1)],
  whooshLongo: [1.4, (f) => tocar(f, 0, 0.9, whoosh(0.9, false), 1)],
  pop: [0.7, (f) => tocar(f, 0, 0.2, pop, 1)],
  toque: [0.6, (f) => tocar(f, 0, 0.1, toque, 1)],
  tecla: [0.6, (f) => tocar(f, 0, 0.08, tecla, 1)],
  apagar: [0.6, (f) => tocar(f, 0, 0.06, apagar, 1)],
  sucesso: [2.0, (f) => sucesso(f, 0, 0.5)],
  notificacao: [1.9, (f) => notificacao(f, 0)],
  zumbir: [1.2, (f) => tocar(f, 0, 0.7, zumbir, 1)],
  bumbo: [0.9, (f) => tocar(f, 0, 0.4, bumbo, 1)],
  sino: [1.8, (f) => [88, 92, 95, 100].forEach((n, k) => tocar(f, k * 0.06, 1.2, sino(hz(n)), 0.4))],
  bip: [0.9, (f) => [0, 0.13, 0.26].forEach((d) => tocar(f, d, 0.1, bip, 1))],
  boing: [1.1, (f) => tocar(f, 0, 0.6, boing, 1)],
  tesoura: [0.7, (f) => [0, 0.09].forEach((d) => tocar(f, d, 0.05, estalo, 1))],
  envio: [0.9, (f) => {
    tocar(f, 0, 0.25, whoosh(0.25, true), 0.7);
    tocar(f, 0.18, 0.1, tique, 0.6);
  }],
};

for (const [nome, [seg, fazer]] of Object.entries(EFEITOS)) {
  const faixa = novaFaixa(seg);
  fazer(faixa);
  salvar(`${PASTA}/${nome}.wav`, faixa);
}
console.log(`${Object.keys(EFEITOS).length} efeitos em ${PASTA}`);
