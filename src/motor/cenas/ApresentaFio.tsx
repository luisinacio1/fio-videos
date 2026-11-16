import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, F, Laco } from "../../base";
import type { Cena } from "../roteiro";
import { Som, entre, mola, useCena } from "../util";
import { App, ProvedorEnquadre, type Enquadre } from "./App";

/**
 * O Fio com calma: o celular com a tela de verdade do app à esquerda e as 3 frases entrando à direita,
 * uma por vez, cada uma com um check. A legenda some nesta cena, então o celular
 * e as frases ficam centrados na altura do vídeo, tudo acima de y 1500 (a interface do Instagram cobre o pé).
 */

type CenaDe<T extends Cena["tipo"]> = Extract<Cena, { tipo: T }>;

const CREME = "#f3ece4";

/** o celular parado à esquerda e centrado na altura do vídeo (a tela vai de x 44 a 512 e de y 454 a 1467; o aparelho até x 526) */
const CELULAR: Enquadre = { x: 44, y: 454, s: 1.2 };

/** coluna das frases, à direita do celular (com folga dele) e centrada na mesma altura */
const COLUNA = { esquerda: 562, direita: 34, topo: 440, base: 1480 };

/** quadros mínimos entre uma frase e a próxima (calma: nunca duas juntas) */
const RESPIRO = 24;

/** diâmetro do check e o espaço até o texto */
const CHECK = 60;

function Check({ p, risco }: { p: number; risco: number }) {
  return (
    <div style={{ width: CHECK, height: CHECK, flexShrink: 0, borderRadius: 99, background: CREME, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${p})`, boxShadow: "0 12px 24px -10px rgba(40,12,6,0.55)" }}>
      <svg width={33} height={33} viewBox="0 0 24 24" fill="none" stroke={C.acento} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - risco} />
      </svg>
    </div>
  );
}

export function ApresentaFio({ c }: { c: CenaDe<"apresentaFio"> }) {
  const { f, dur, em } = useCena();
  // tempo de cada frase: o da palavra; sem referência, espalha pela cena; sempre em ordem e com respiro
  let antes = -Infinity;
  const frases = c.frases.map((x, i) => {
    const q0 = em(x.em, Math.round(dur * (0.12 + 0.24 * i)));
    const q = Math.max(Number.isFinite(q0) ? q0 : 20 + i * 60, antes + RESPIRO);
    antes = q;
    return { texto: x.texto, q };
  });
  const marca = mola(f, 6, { damping: 18, stiffness: 120 });
  const maior = Math.max(...frases.map((x) => x.texto.length));
  const tamanho = maior > 30 ? 50 : maior > 20 ? 56 : 62;
  return (
    <AbsoluteFill>
      <ProvedorEnquadre value={CELULAR}>
        <App c={{ tipo: "app", de: c.de, tela: c.tela }} />
      </ProvedorEnquadre>
      {/* sombra suave atrás das frases, para o creme ler bem sobre o terracota */}
      <AbsoluteFill style={{ background: "radial-gradient(700px 1000px at 80% 50%, rgba(70,24,14,0.32), rgba(70,24,14,0) 70%)" }} />
      <div style={{ position: "absolute", left: COLUNA.esquerda, right: COLUNA.direita, top: COLUNA.topo, height: COLUNA.base - COLUNA.topo, display: "flex", flexDirection: "column", justifyContent: "center", gap: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: marca, transform: `translateY(${(1 - marca) * 24}px)` }}>
          <Laco tamanho={72} cor={CREME} espessura={3} progresso={entre(f, 4, 34, [0, 1], Easing.inOut(Easing.cubic))} />
          <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 70, color: CREME, letterSpacing: "-0.02em", lineHeight: 1 }}>Fio</div>
        </div>
        {frases.map((x, i) => {
          const e = mola(f, x.q, { damping: 20, stiffness: 110 });
          const bola = mola(f, x.q + 2, { damping: 11, stiffness: 170 });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20, opacity: f >= x.q ? e : 0, transform: `translateX(${(1 - e) * 60}px)` }}>
              <Check p={bola} risco={entre(f, x.q + 6, x.q + 18, [0, 1], Easing.out(Easing.cubic))} />
              <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.015em", color: CREME, paddingTop: Math.max(0, (CHECK - tamanho * 1.08) / 2), textWrap: "balance", textShadow: "0 2px 18px rgba(40,12,6,0.35)" }}>{x.texto}</div>
            </div>
          );
        })}
      </div>
      {frases.map((x, i) => (
        <Som key={i} em={x.q + 2} tipo="pop" vol={0.7} />
      ))}
    </AbsoluteFill>
  );
}
