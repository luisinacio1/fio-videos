import { Easing } from "remotion";

/**
 * Câmera contínua: o vídeo é um "mundo" grande (cenários lado a lado) e a câmera viaja por ele,
 * em vez de cortar de uma cena para outra. Cada chave diz o ponto do mundo no centro do quadro e o zoom.
 */
export type Chave = { f: number; x: number; y: number; s: number; e?: (t: number) => number };
export type Vista = { x: number; y: number; s: number };

const suave = Easing.bezier(0.65, 0, 0.25, 1);

export function cameraEm(f: number, chaves: Chave[]): Vista {
  if (f <= chaves[0].f) return chaves[0];
  for (let i = 1; i < chaves.length; i++) {
    const a = chaves[i - 1];
    const b = chaves[i];
    if (f <= b.f) {
      const t = (b.e ?? suave)((f - a.f) / Math.max(1, b.f - a.f));
      // zoom em escala logarítmica (parece constante) e centro acompanhando o zoom, para o alvo não "escorregar"
      const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
      const peso = a.s === b.s ? t : (1 / a.s - 1 / s) / (1 / a.s - 1 / b.s);
      return { x: a.x + (b.x - a.x) * peso, y: a.y + (b.y - a.y) * peso, s };
    }
  }
  return chaves[chaves.length - 1];
}

/** transform CSS do mundo (com transform-origin 0 0) para (x, y) ficar no centro do quadro. */
export function transformMundo(c: Vista, largura = 1080, altura = 1920) {
  return `translate(${largura / 2}px, ${altura / 2}px) scale(${c.s}) translate(${-c.x}px, ${-c.y}px)`;
}

/** Onde um ponto do mundo aparece no quadro. */
export function naTela(c: Vista, x: number, y: number, largura = 1080, altura = 1920) {
  return { x: (x - c.x) * c.s + largura / 2, y: (y - c.y) * c.s + altura / 2 };
}

/** Desfoque de movimento: quanto a câmera andou na tela entre um quadro e o anterior. */
export function borrao(f: number, chaves: Chave[], max = 10) {
  const a = cameraEm(f - 1, chaves);
  const b = cameraEm(f, chaves);
  const anda = Math.hypot((b.x - a.x) * b.s, (b.y - a.y) * b.s) + Math.abs(Math.log(b.s / a.s)) * 900;
  return Math.min(max, Math.max(0, (anda - 12) / 9));
}
