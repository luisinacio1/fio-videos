import React, { createContext, useContext } from "react";
import { Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { quadro, type Ref, type Tempos } from "./roteiro";

export const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ease = Easing.bezier(0.65, 0, 0.25, 1);
export const sai = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Vai de saida[0] a saida[1] entre os quadros `de` e `ate`; se o momento não existe no roteiro (Infinity), fica no começo. */
export const entre = (f: number, de: number, ate: number, saida: [number, number] = [0, 1], e = ease) =>
  Number.isFinite(de) && Number.isFinite(ate) ? interpolate(f, [de, ate], saida, { ...lim, easing: e }) : saida[0];
export const mola = (f: number, inicio: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  Number.isFinite(inicio) ? spring({ frame: f - inicio, fps: 30, config: { damping: 14, stiffness: 160, mass: 0.8, ...cfg } }) : 0;
export function mistura(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}
/** número pseudoaleatório fixo (o mesmo a cada quadro) */
export const sorte = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** O que cada cena sabe: os tempos da narração e onde ela começa no vídeo. */
const Contexto = createContext<{ tempos: Tempos; inicio: number; dur: number }>({ tempos: { falas: [], palavras: [] }, inicio: 0, dur: 1 });
export const ProvedorCena = Contexto.Provider;

/** Quadro local da cena e conversor de referência ("3:palavra") para quadro local. Sem referência, devolve `padrao`. */
export function useCena() {
  const f = useCurrentFrame();
  const { tempos, inicio, dur } = useContext(Contexto);
  const em = (ref: Ref | undefined, padrao = Infinity) => (ref ? quadro(tempos, ref) - inicio : padrao);
  return { f, dur, em, tempos, inicio };
}

export type TipoSom = "whoosh" | "whooshLongo" | "pop" | "toque" | "tecla" | "apagar" | "sucesso" | "notificacao" | "zumbir" | "bumbo" | "sino" | "bip" | "boing" | "tesoura" | "envio";
const VOLUME: Record<TipoSom, number> = { whoosh: 0.5, whooshLongo: 0.55, pop: 0.45, toque: 0.5, tecla: 0.3, apagar: 0.28, sucesso: 0.45, notificacao: 0.5, zumbir: 0.35, bumbo: 0.6, sino: 0.35, bip: 0.3, boing: 0.45, tesoura: 0.35, envio: 0.45 };

/** Efeito sonoro no quadro `em` (local da cena). */
export function Som({ em, tipo, vol = 1 }: { em: number; tipo: TipoSom; vol?: number }) {
  if (!Number.isFinite(em) || em < 0) return null;
  return (
    <Sequence from={Math.round(em)} durationInFrames={75} layout="none">
      <Audio src={staticFile(`motor/sfx/${tipo}.wav`)} volume={VOLUME[tipo] * vol} />
    </Sequence>
  );
}
