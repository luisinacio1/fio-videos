// Peças de som usadas pelas trilhas (scripts/audio.mjs e scripts/audio-06.mjs).
// Tudo sintetizado aqui: sem música de terceiros, sem risco de direitos autorais.
import { writeFileSync } from "node:fs";

export const SR = 44100;
export const FPS = 30;

export const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
export const q = (frame) => frame / FPS;

// ruído determinístico, para o resultado ser sempre igual
let semente = 7;
export const ruido = () => {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return (semente / 4294967296) * 2 - 1;
};

export function novaFaixa(segundos) {
  const n = SR * segundos;
  return [new Float32Array(n), new Float32Array(n)];
}

/** Soma uma função de som (t em segundos desde o início do som) na faixa, com panorâmica. */
export function tocar(faixa, inicio, duracao, fn, ganho = 1, pan = 0) {
  const N = faixa[0].length;
  const i0 = Math.max(0, Math.floor(inicio * SR));
  const i1 = Math.min(N, Math.floor((inicio + duracao) * SR));
  const l = ganho * Math.cos(((pan + 1) * Math.PI) / 4);
  const r = ganho * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = i0; i < i1; i++) {
    const v = fn((i - i0) / SR);
    faixa[0][i] += v * l;
    faixa[1][i] += v * r;
  }
}

export const env = (t, ataque, queda) => Math.min(1, t / ataque) * Math.exp(-t * queda);

// ---------- instrumentos ----------
export const piano = (f) => (t) => env(t, 0.004, 2.6) * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 6) + 0.08 * Math.sin(6 * Math.PI * f * t));
export const pad = (f, dur) => (t) => {
  const a = Math.min(1, t / 0.8) * Math.min(1, (dur - t) / 0.6);
  return a * (Math.sin(2 * Math.PI * f * t) + Math.sin(2 * Math.PI * f * 1.004 * t) + 0.3 * Math.sin(4 * Math.PI * f * 0.998 * t)) / 2.3;
};
export const baixo = (f) => (t) => env(t, 0.006, 3.2) * Math.tanh(1.6 * Math.sin(2 * Math.PI * f * t));
export const bumbo = (t) => {
  const f = 45 + 95 * Math.exp(-t * 28);
  return Math.exp(-t * 9) * Math.sin(2 * Math.PI * f * t);
};
export function chimbal() {
  let ant = 0;
  return (t) => {
    const n = ruido();
    const hp = n - ant;
    ant = n;
    return hp * Math.exp(-t * 55) * 0.6;
  };
}
export function palma() {
  let lp = 0;
  return (t) => {
    lp += 0.35 * (ruido() - lp);
    const rajadas = t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.6 : 1) : 1;
    return (ruido() - lp) * Math.exp(-t * 22) * rajadas * 0.7;
  };
}

// ---------- efeitos ----------
export const toque = (t) => Math.exp(-t * 90) * (Math.sin(2 * Math.PI * 1900 * t) * 0.6 + ruido() * 0.4);
export const pop = (t) => {
  const f = 380 + 900 * Math.min(1, t / 0.05);
  return env(t, 0.002, 30) * Math.sin(2 * Math.PI * f * t);
};
export const tique = (t) => Math.exp(-t * 160) * Math.sin(2 * Math.PI * 3200 * t);
export const tecla = (t) => Math.exp(-t * 120) * (ruido() * 0.5 + Math.sin(2 * Math.PI * 2400 * t) * 0.3);
export function whoosh(dur = 0.45, sobe = true) {
  let lp = 0;
  return (t) => {
    const x = t / dur;
    const corte = sobe ? 0.02 + 0.25 * x : 0.27 - 0.25 * x;
    lp += corte * (ruido() - lp);
    return lp * Math.sin(Math.PI * Math.min(1, x)) * 2.2;
  };
}
export const sino = (f) => (t) => env(t, 0.002, 3.5) * (Math.sin(2 * Math.PI * f * t) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 6) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 10));

export function sucesso(faixa, inicio, ganho = 0.32) {
  tocar(faixa, inicio, 1.6, sino(hz(88)), ganho, -0.2);
  tocar(faixa, inicio + 0.09, 1.6, sino(hz(95)), ganho, 0.2);
}
export function notificacao(faixa, inicio) {
  tocar(faixa, inicio, 1.2, sino(hz(93)), 0.35, 0);
  tocar(faixa, inicio + 0.14, 1.4, sino(hz(88)), 0.3, 0);
}

/** Satura de leve, normaliza o pico em 0,89, faz fade-out no último meio segundo e grava WAV 16 bits estéreo. */
export function salvar(caminho, [l, r]) {
  const N = l.length;
  let pico = 0;
  for (let i = 0; i < N; i++) {
    l[i] = Math.tanh(l[i] * 1.1);
    r[i] = Math.tanh(r[i] * 1.1);
    pico = Math.max(pico, Math.abs(l[i]), Math.abs(r[i]));
  }
  const ganho = 0.89 / pico;
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + N * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    const fim = Math.min(1, (N - i) / (SR * 0.5));
    buf.writeInt16LE(Math.round(l[i] * ganho * fim * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r[i] * ganho * fim * 32767), 46 + i * 4);
  }
  writeFileSync(caminho, buf);
}

/** Volume percebido (LUFS integrado, ITU BS.1770) de uma faixa estéreo. */
export function medirLufs([l, r]) {
  const K = (f0, G, Q, alta) => {
    const k = Math.tan((Math.PI * f0) / SR);
    const a0 = 1 + k / Q + k * k;
    const a = [1, (2 * (k * k - 1)) / a0, (1 - k / Q + k * k) / a0];
    if (alta) return [[1, -2, 1], a];
    const vh = 10 ** (G / 20);
    const vb = vh ** 0.4996667741545416;
    return [[(vh + (vb * k) / Q + k * k) / a0, (2 * (k * k - vh)) / a0, (vh - (vb * k) / Q + k * k) / a0], a];
  };
  const filtrar = (x, [b, a]) => {
    const y = new Float64Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
  const prateleira = K(1681.974450955533, 3.999843853973347, 0.7071752369554196, false);
  const passaAlta = K(38.13547087602444, 0, 0.5003270373238773, true);
  const kw = [l, r].map((c) => filtrar(filtrar(c, prateleira), passaAlta));
  const W = Math.round(0.4 * SR);
  const S = Math.round(0.1 * SR);
  const blocos = [];
  for (let s = 0; s + W <= l.length; s += S) {
    let e = 0;
    for (const c of kw) for (let i = s; i < s + W; i++) e += c[i] * c[i];
    blocos.push(e / W);
  }
  const L = (e) => -0.691 + 10 * Math.log10(e);
  const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  let g = blocos.filter((e) => L(e) > -70);
  const relativo = L(media(g)) - 10;
  g = g.filter((e) => L(e) > relativo);
  return L(media(g));
}

/** Ajusta o ganho (antes da saturação de salvar) até a faixa ficar perto de `alvo` LUFS. */
export function ajustarVolume(faixa, alvo = -14) {
  const simular = (g) => faixa.map((c) => {
    const s = new Float32Array(c.length);
    let pico = 0;
    for (let i = 0; i < c.length; i++) { s[i] = Math.tanh(c[i] * g * 1.1); pico = Math.max(pico, Math.abs(s[i])); }
    for (let i = 0; i < c.length; i++) s[i] *= 0.89 / pico;
    return s;
  });
  let g = 1;
  for (let k = 0; k < 6; k++) {
    const erro = alvo - medirLufs(simular(g));
    if (Math.abs(erro) < 0.3) break;
    g *= 10 ** (erro / 20);
  }
  return faixa.map((c) => c.map((v) => v * g));
}
