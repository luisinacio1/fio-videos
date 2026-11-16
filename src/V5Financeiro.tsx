import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, Encerramento, F, Fundo, Gancho, Legenda, faixa, reais, useMola } from "./base";

/** 05 · Financeiro: previsto x realizado, a semana em gráfico, despesas e faltas. Valores de exemplo. */

const T_GRAFICO = 168;
const T_DESPESAS = 270;

const BLOCOS = [
  { rotulo: "Agendamentos hoje", valor: 12, dinheiro: false, cor: C.texto },
  { rotulo: "Realizados", valor: 7, dinheiro: false, cor: C.texto },
  { rotulo: "Previsto hoje", valor: 780, dinheiro: true, cor: C.texto },
  { rotulo: "Realizado hoje", valor: 455, dinheiro: true, cor: C.ok },
];

// faturamento acumulado da semana (seg a sáb), em reais
const REALIZADO = [0, 520, 1080, 1540, 1995, 1995];
const PREVISTO = [0, 560, 1160, 1700, 2380, 3100];
const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Cartao({ children, inicio, estilo }: { children: React.ReactNode; inicio: number; estilo?: React.CSSProperties }) {
  const s = useMola(inicio, { damping: 15 });
  return (
    <div
      style={{
        background: C.superficie,
        borderRadius: 32,
        border: `1.5px solid ${C.divisoria}`,
        boxShadow: "0 40px 80px -50px rgba(42,32,24,0.55)",
        padding: 30,
        fontFamily: F.sans,
        opacity: s,
        transform: `translateY(${(1 - s) * 140}px) scale(${0.92 + s * 0.08})`,
        ...estilo,
      }}
    >
      {children}
    </div>
  );
}

function Indicadores() {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      {BLOCOS.map((b, i) => {
        const conta = faixa(frame, 80 + i * 8, 130 + i * 8);
        const v = b.valor * conta;
        return (
          <Cartao key={b.rotulo} inicio={70 + i * 6}>
            <div style={{ fontSize: 24, color: C.texto2 }}>{b.rotulo}</div>
            <div style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: b.cor, marginTop: 6 }}>{b.dinheiro ? reais(v, 0) : Math.round(v)}</div>
          </Cartao>
        );
      })}
    </div>
  );
}

function curva(pts: [number, number][]) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function Grafico() {
  const frame = useCurrentFrame();
  const L = 860;
  const A = 360;
  const max = 3200;
  const x = (i: number) => 70 + ((L - 90) * i) / (DIAS.length - 1);
  const y = (v: number) => 20 + (A - 60) * (1 - v / max);
  const real = faixa(frame, T_GRAFICO + 10, T_GRAFICO + 50);
  const prev = faixa(frame, T_GRAFICO + 24, T_GRAFICO + 64);
  const ultimo = REALIZADO.length - 2;
  const ponto = useMola(T_GRAFICO + 50, { damping: 9 });
  return (
    <Cartao inicio={T_GRAFICO}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>Faturamento da semana</div>
      </div>
      <div style={{ display: "flex", gap: 30, fontSize: 22, color: C.texto2, marginTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 5, background: "#963F2C", borderRadius: 9 }} /> Realizado
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 0, borderTop: "5px dashed #D9764F" }} /> Previsto
        </span>
      </div>
      <svg width={L} height={A} style={{ marginTop: 10, overflow: "visible" }}>
        {[0, 1000, 2000, 3000].map((v) => (
          <g key={v}>
            <line x1={70} x2={L - 20} y1={y(v)} y2={y(v)} stroke={C.divisoria} strokeWidth={1.5} />
            <text x={56} y={y(v) + 7} fontSize={19} fill={C.texto2} textAnchor="end" fontFamily={F.sans}>
              {v === 0 ? "0" : `${v / 1000} mil`}
            </text>
          </g>
        ))}
        {DIAS.map((d, i) => (
          <text key={d} x={x(i)} y={A - 4} fontSize={20} fill={C.texto2} textAnchor="middle" fontFamily={F.sans}>
            {d}
          </text>
        ))}
        <path d={curva(PREVISTO.map((v, i) => [x(i), y(v)]))} stroke="#D9764F" strokeWidth={5} strokeDasharray="12 10" fill="none" strokeLinecap="round" style={{ clipPath: `inset(0 ${(1 - prev) * 100}% 0 0)` }} />
        <path d={curva(REALIZADO.slice(0, ultimo + 1).map((v, i) => [x(i), y(v)]))} stroke="#963F2C" strokeWidth={6} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - real} />
        <circle cx={x(ultimo)} cy={y(REALIZADO[ultimo])} r={11 * ponto} fill="#963F2C" stroke="#fff" strokeWidth={4} />
        <g opacity={ponto} transform={`translate(${x(ultimo) - 120}, ${y(REALIZADO[ultimo]) - 96})`}>
          <rect width={196} height={66} rx={16} fill={C.texto} />
          <text x={98} y={43} fontSize={26} fontWeight={700} fill="#fff" textAnchor="middle" fontFamily={F.sans}>
            {reais(REALIZADO[ultimo], 0)}
          </text>
        </g>
      </svg>
    </Cartao>
  );
}

const DESPESAS = [
  ["Aluguel", 1800],
  ["Produtos", 420],
  ["Luz e água", 260],
] as const;
const FALTAS = [
  ["Esta semana", 1],
  ["20/10", 3],
  ["13/10", 4],
  ["06/10", 3],
] as const;

function DespesasFaltas() {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      <Cartao inicio={T_DESPESAS}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>Despesas do mês</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {DESPESAS.map(([nome, v], i) => {
            const s = faixa(frame, T_DESPESAS + 12 + i * 6, T_DESPESAS + 24 + i * 6);
            return (
              <div key={nome} style={{ display: "flex", justifyContent: "space-between", fontSize: 24, opacity: s, transform: `translateX(${(1 - s) * 40}px)` }}>
                <span style={{ color: C.texto2 }}>{nome}</span>
                <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{reais(v, 0)}</span>
              </div>
            );
          })}
        </div>
      </Cartao>
      <Cartao inicio={T_DESPESAS + 8}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>Faltas por semana</div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 13 }}>
          {FALTAS.map(([sem, n], i) => {
            const s = faixa(frame, T_DESPESAS + 20 + i * 5, T_DESPESAS + 40 + i * 5);
            return (
              <div key={sem} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 19 }}>
                <span style={{ width: 132, color: C.texto2, whiteSpace: "nowrap", fontSize: 18 }}>{sem}</span>
                <span style={{ flex: 1, height: 12, borderRadius: 99, background: C.lateral }}>
                  <span style={{ display: "block", height: "100%", width: `${(n / 4) * 100 * s}%`, borderRadius: 99, background: i === 0 ? C.ok : C.acento }} />
                </span>
                <span style={{ width: 18, fontWeight: 700 }}>{n}</span>
              </div>
            );
          })}
        </div>
      </Cartao>
    </div>
  );
}

/** A visão geral do financeiro: indicadores (quadro 60), gráfico da semana (168), despesas e faltas (270). */
export function DemoFinanceiro() {
  const frame = useCurrentFrame();
  // a câmera desce pelo painel conforme os blocos chegam
  const rolagem = faixa(frame, T_DESPESAS - 10, T_DESPESAS + 20, [0, -120]);
  if (frame < 60) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 170 + rolagem, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: F.sans, fontSize: 52, fontWeight: 800, letterSpacing: "-0.02em", opacity: faixa(frame, 62, 76), padding: "0 6px" }}>Visão geral</div>
      <Indicadores />
      {frame >= T_GRAFICO && <Grafico />}
      {frame >= T_DESPESAS && <DespesasFaltas />}
      {frame >= T_DESPESAS && <div style={{ fontFamily: F.sans, fontSize: 20, color: C.texto2, padding: "0 6px", opacity: faixa(frame, T_DESPESAS + 30, T_DESPESAS + 40) }}>Valores de exemplo</div>}
    </div>
  );
}

export function V5Financeiro() {
  return (
    <AbsoluteFill>
      <Fundo />
      <Gancho numero="05" rotulo="Financeiro" titulo="Horário marcado não é dinheiro no bolso." destaque={["dinheiro", "bolso."]} ate={56} />

      <DemoFinanceiro />

      <Legenda texto="O que está marcado de um lado. O que entrou do outro." de={86} ate={T_GRAFICO - 6} destaque={["marcado", "entrou"]} />
      <Legenda texto="A semana inteira num gráfico." de={T_GRAFICO + 6} ate={T_DESPESAS - 8} destaque={["gráfico."]} />
      <Legenda texto="Despesas e faltas, sem planilha." de={T_DESPESAS + 10} ate={370} destaque={["sem", "planilha."]} />

      <Encerramento inicio={378} frase="Saiba o que entrou de verdade." />
    </AbsoluteFill>
  );
}
