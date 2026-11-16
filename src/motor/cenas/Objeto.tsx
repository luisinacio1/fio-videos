import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../base";
import { Objeto, TESOURA, ponto } from "../../motion/Objetos";
import type { Cena } from "../roteiro";
import { Som, entre, mola, useCena } from "../util";

/**
 * Cena "objeto": um objeto de barbearia grande no centro, com o seu movimento próprio,
 * e etiquetas que surgem no tempo de cada palavra, cada uma com uma linha até o objeto.
 * As etiquetas ficam em cima e embaixo do objeto (nunca por cima dele) e acima da legenda.
 */

type CenaObjetoT = Extract<Cena, { tipo: "objeto" }>;

const CX = 540;
/** onde fica a bolinha da etiqueta, a partir da borda (é dela que sai a linha) */
const BOLINHA = 47;
const ALTURA = 100;
const MARGEM = 80;

/** posições das etiquetas: 0 em cima à esquerda, 1 embaixo à direita, 2 em cima à direita, 3 embaixo à esquerda */
function posicoes(muitas: boolean) {
  return muitas
    ? [
        { topo: 112, lado: "esq" as const, cima: true },
        { topo: 990, lado: "dir" as const, cima: false },
        { topo: 236, lado: "dir" as const, cima: true },
        { topo: 1114, lado: "esq" as const, cima: false },
      ]
    : [
        { topo: 170, lado: "esq" as const, cima: true },
        { topo: 1050, lado: "dir" as const, cima: false },
      ];
}

export function CenaObjeto({ c }: { c: CenaObjetoT }) {
  const { f, dur, em } = useCena();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fundo = c.fundo ?? "claro";
  const lista = c.etiquetas ?? [];
  const muitas = lista.length > 2;
  const pos = posicoes(muitas);
  const S = muitas ? 600 : 720;
  const CY = muitas ? 662 : 640;

  const etiquetas = lista.map((e, i) => ({ ...e, q: em(e.em), vaga: i % pos.length }));
  // numa vaga já usada, a etiqueta nova toma o lugar da antiga
  const some = (i: number) => etiquetas.some((o, j) => j > i && o.vaga === etiquetas[i].vaga && f >= o.q - 2);

  const corFundo = fundo === "claro" ? "#f3ece4" : fundo === "escuro" ? C.escuro : C.acento;
  const halo = fundo === "claro" ? "#ead9c7" : fundo === "escuro" ? "#2a211b" : C.acentoForte;
  const brilho =
    fundo === "claro"
      ? "radial-gradient(900px 900px at 50% 34%, #f8f2eb, #e6d6c5)"
      : fundo === "escuro"
        ? "radial-gradient(1100px 900px at 50% 30%, rgba(176,81,58,0.30), transparent 65%)"
        : "radial-gradient(1100px 900px at 50% 30%, rgba(255,255,255,0.16), transparent 65%)";
  const corLinha = fundo === "claro" ? C.escuro : "#f3ece4";

  // o objeto chega com uma molinha e a câmera se aproxima devagar
  const chega = mola(f, 2, { damping: 12, stiffness: 170 });
  const escala = 0.8 + 0.2 * chega;
  const zoom = 1 + 0.035 * (f / Math.max(1, dur));
  const caixa = { x: CX - S / 2, y: CY - S / 2 };
  const noQuadro = ([x, y]: [number, number]): [number, number] => [CX + (x - 200) * (S / 400) * escala, CY + (y - 200) * (S / 400) * escala];

  // tesoura: um "tec" a cada fechada
  const tecs: number[] = [];
  if (c.objeto === "tesoura") for (let q = TESOURA.fecha; q < dur; q += TESOURA.ciclo) tecs.push(q - 3);

  return (
    <AbsoluteFill style={{ background: corFundo, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: brilho }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${CX}px ${CY}px` }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <circle cx={CX} cy={CY} r={S * 0.56} fill={halo} />
          <circle cx={CX} cy={CY} r={S * 0.56} fill="none" stroke={fundo === "claro" ? C.acento : "#f2c063"} strokeWidth={6} opacity={0.22} strokeDasharray="4 22" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: S, height: S, transform: `scale(${escala})`, opacity: Math.min(1, chega * 1.5) }}>
          <Objeto nome={c.objeto} f={f} tamanho={S} variante={c.variante} />
        </div>
        {/* linhas das etiquetas até o objeto */}
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id={`${id}sombra`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx={0} dy={3} stdDeviation={4} floodColor="#000" floodOpacity={0.25} />
            </filter>
          </defs>
          {etiquetas.map((e, i) => {
            if (f < e.q || some(i)) return null;
            const p = pos[e.vaga];
            const ax = p.lado === "esq" ? MARGEM + BOLINHA : 1080 - MARGEM - BOLINHA;
            const ay = p.cima ? p.topo + ALTURA : p.topo;
            const [bx, by] = noQuadro(ponto(c.objeto, e.vaga, f));
            const t = entre(f, e.q + 1, e.q + 9);
            const x = ax + (bx - ax) * t;
            const y = ay + (by - ay) * t;
            const ponta = mola(f, e.q + 8, { damping: 10, stiffness: 240 });
            const onda = entre(f, e.q + 9, e.q + 27);
            return (
              <g key={i} filter={`url(#${id}sombra)`}>
                <line x1={ax} y1={ay} x2={x} y2={y} stroke={corLinha} strokeWidth={5} strokeLinecap="round" />
                {t > 0.98 && (
                  <>
                    <circle cx={bx} cy={by} r={14 + onda * 26} fill="none" stroke={corLinha} strokeWidth={4} opacity={(1 - onda) * 0.8} />
                    <circle cx={bx} cy={by} r={14 * ponta} fill={corLinha} />
                    <circle cx={bx} cy={by} r={6.5 * ponta} fill="#f2c063" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
        {/* etiquetas */}
        {etiquetas.map((e, i) => {
          if (f < e.q - 2 || some(i)) return null;
          const p = pos[e.vaga];
          const s = mola(f, e.q - 2, { damping: 12, stiffness: 220 });
          const tam = e.texto.length > 26 ? 40 : e.texto.length > 18 ? 46 : 52;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: p.topo,
                height: ALTURA,
                ...(p.lado === "esq" ? { left: MARGEM } : { right: MARGEM }),
                maxWidth: 1080 - 2 * MARGEM,
                transform: `scale(${s})`,
                transformOrigin: `${p.lado === "esq" ? `${BOLINHA}px` : `calc(100% - ${BOLINHA}px)`} ${p.cima ? "100%" : "0%"}`,
                display: "flex",
                flexDirection: p.lado === "esq" ? "row" : "row-reverse",
                alignItems: "center",
                gap: 20,
                boxSizing: "border-box",
                background: C.escuro,
                color: "#f3ece4",
                borderRadius: 999,
                padding: "0 32px",
                fontFamily: F.sans,
                fontWeight: 800,
                fontSize: tam,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                boxShadow: "0 24px 50px -20px rgba(0,0,0,0.6)",
                border: "4px solid #f2c063",
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 99, background: "#f2c063", flexShrink: 0 }} />
              {e.texto}
            </div>
          );
        })}
      </div>
      {etiquetas.map((e, i) => (
        <Som key={i} em={e.q - 2} tipo="pop" vol={0.7} />
      ))}
      {c.objeto === "maquina" && <Som em={4} tipo="zumbir" />}
      {tecs.map((q) => (
        <Som key={q} em={q} tipo="tesoura" vol={0.6} />
      ))}
    </AbsoluteFill>
  );
}
