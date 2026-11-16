// Trilha de fundo dos vídeos do motor: noite/tensão até a virada, clara com batida depois.
// Toda sintetizada (scripts/som.mjs). O vídeo abaixa o volume quando a voz fala (src/motor/Motor.tsx).
import { baixo, bumbo, chimbal, hz, novaFaixa, pad, piano, tique, tocar } from "../som.mjs";

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

/** `total` e `virada` em segundos. */
export function musica(total, virada) {
  const m = novaFaixa(total);
  for (let c = 0; c * COMPASSO < virada; c++) {
    const t0 = c * COMPASSO;
    const [raiz, notas] = NOITE[c % 4];
    const dur = Math.min(COMPASSO, virada - t0) + 0.3;
    tocar(m, t0, dur, pad(hz(raiz + 12), dur), 0.07, -0.2);
    notas.forEach((n, k) => tocar(m, t0 + k * 0.5 * BATIDA, 1.8, piano(hz(n + 12)), 0.045, (k - 1) * 0.35));
    for (let b = 0; b < 4; b++) if (t0 + b * BATIDA < virada) tocar(m, t0 + b * BATIDA, 0.08, tique, 0.025, 0.4);
  }
  for (let c = 0; virada + c * COMPASSO < total; c++) {
    const t0 = virada + c * COMPASSO;
    const [raiz, notas] = DIA[c % 4];
    const dur = Math.min(COMPASSO, total - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.045, k % 2 ? 0.4 : -0.4));
    for (const b of [0, 1.5, 2.5]) if (t0 + b * BATIDA < total) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.012, 1.4, piano(hz(n)), 0.06, (k - 1.5) * 0.25));
    for (const b of [0, 2, 2.5]) if (t0 + b * BATIDA < total) tocar(m, t0 + b * BATIDA, 0.5, baixo(hz(raiz)), 0.17);
    for (let b = 0; b < 4; b += 0.5) if (t0 + b * BATIDA < total) tocar(m, t0 + b * BATIDA, 0.1, chimbal(), b % 1 ? 0.05 : 0.08, 0.3);
    for (const b of [0, 2]) if (t0 + b * BATIDA < total) tocar(m, t0 + b * BATIDA, 0.4, bumbo, 0.35);
  }
  return m;
}
