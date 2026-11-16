import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { C, F } from "../../base";
import { Cabeca, ELENCO, piscada, type Corte as TipoCorte } from "../../motion/Personagens";
import type { Cena } from "../roteiro";
import { Som, entre, mola, sorte, useCena } from "../util";

/**
 * Cena "corte": a cabeça grande no centro e o cabelo trocando no tempo de cada estilo.
 * A máquina atravessa a cabeça e deixa o corte novo para trás (cai cabelo na capa); o nome sai numa pílula embaixo.
 * O pezinho é mostrado de costas: a cabeça vira antes de a máquina passar na nuca.
 */

type CenaCorte = Extract<Cena, { tipo: "corte" }>;
type Vista = "frente" | "costas";

export const NOMES_CORTE: Record<TipoCorte, string> = {
  "degrade-baixo": "Degradê baixo",
  "degrade-medio": "Degradê médio",
  "degrade-alto": "Degradê alto",
  social: "Social",
  navalhado: "Navalhado",
  topete: "Topete",
  risco: "Risco",
  pezinho: "Pezinho",
};

/** quadros da máquina atravessando a cabeça (a palavra cai no meio da passada) */
const PASSA = 16;
/** quadros da cabeça virando de costas (ou de volta) antes da máquina passar */
const GIRO = 12;
/** a cabeça: tamanho e onde fica o centro do rosto (o quadro da cabeça tem 300 × 360, centro do rosto em 150, 190) */
const ESCALA = 2.6;
const CX = 540;
const CY = 630;

const vistaDe = (estilo: TipoCorte): Vista => (estilo === "pezinho" ? "costas" : "frente");

/** onde a lâmina encosta, em coordenadas da cabeça: no alto da cabeça (de frente) ou na nuca (de costas) */
function lamina(x: number, vista: Vista) {
  if (vista === "costas") return { y: 290, giro: 180 };
  const d = Math.max(-1, Math.min(1, (x - 150) / 112));
  const y = 34 + d * d * 96;
  // a lâmina aponta para o centro da cabeça
  const giro = (Math.atan2(-(150 - x), 190 - y) * 180) / Math.PI;
  return { y, giro };
}

/** a máquina de cortar: lâmina na origem, corpo para cima */
function Maquina({ vibra }: { vibra: number }) {
  return (
    <g transform={`translate(${vibra} 0)`}>
      <path d="M0 -122 C0 -170 34 -196 22 -260" stroke="#2a211b" strokeWidth={6} strokeLinecap="round" fill="none" />
      <rect x={-27} y={-124} width={54} height={112} rx={20} fill={C.escuro} />
      <rect x={-27} y={-92} width={54} height={12} fill={C.acento} />
      <rect x={-7} y={-70} width={14} height={26} rx={7} fill="#f2c063" />
      <rect x={-25} y={-16} width={50} height={12} rx={3} fill="#9aa0a5" />
      <rect x={-28} y={-6} width={56} height={10} rx={2} fill="#d9dde0" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={-26 + i * 6} y={3} width={3} height={6} fill="#d9dde0" />
      ))}
    </g>
  );
}

export function Corte({ c }: { c: CenaCorte }) {
  const { f, dur, em } = useCena();
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = ELENCO[c.personagem];
  const passos = c.estilos.map((e) => ({ ...e, q: em(e.em), vista: vistaDe(e.estilo) }));
  const estado = (k: number): { corte?: TipoCorte; vista: Vista } => (k < 0 ? { vista: "frente" } : { corte: passos[k].estilo, vista: passos[k].vista });

  // qual corte vale agora: a máquina começa a passar meia passada antes da palavra
  let k = -1;
  passos.forEach((ps, i) => {
    if (f >= ps.q - PASSA / 2) k = i;
  });
  const atual = estado(k);
  const passando = k >= 0 && f < passos[k].q + PASSA / 2;
  const t = passando ? entre(f, passos[k].q - PASSA / 2, passos[k].q + PASSA / 2) : 1;
  let antes = passando ? { ...estado(k - 1), vista: atual.vista } : atual;

  // a cabeça vira (achata e abre) antes da passada que muda o lado
  let largura = 1;
  const prox = passos[k + 1];
  if (prox && prox.vista !== atual.vista) {
    const ini = prox.q - PASSA / 2 - GIRO;
    if (f >= ini) {
      const u = entre(f, ini, ini + GIRO, [0, 1]);
      largura = Math.max(0.03, Math.abs(Math.cos(Math.PI * u)));
      if (u >= 0.5) antes = { ...antes, vista: prox.vista };
    }
  }

  // a máquina atravessa da esquerda para a direita
  const xm = -40 + t * 380;
  const { y: ym, giro } = lamina(xm, atual.vista);
  const vibra = Math.sin(f * 3.3) * 1.8;

  // expressão: sorri depois do primeiro corte; olha para cima quando a máquina passa
  const boca = k >= 0 && !passando ? "sorriso" : "neutra";
  const olhar: [number, number] = passando ? [0, -12] : [0, 2];
  const respira = Math.sin(f / 22) * 4;
  const balanco = Math.sin(f / 37) * 1.4;

  // câmera: chega perto devagar e dá um soquinho a cada corte
  const soco = passos.reduce((s, ps) => s + 0.03 * Math.sin(Math.PI * entre(f, ps.q - 2, ps.q + 14)), 0);
  const zoom = 1 + 0.05 * (f / Math.max(1, dur)) + soco;

  const props = { ...p.cabeca, olhar, piscar: piscada(f, 21), boca, sobrancelha: passando ? 10 : 0 } as const;

  // cabelo caindo da máquina (no quadro da cabeça)
  const fios: React.ReactNode[] = [];
  passos.forEach((ps, j) => {
    const ini = ps.q - PASSA / 2;
    if (f < ini || f > ini + PASSA + 40) return;
    for (let i = 0; i < 22; i++) {
      const nasce = ini + (i / 22) * PASSA;
      const idade = f - nasce;
      if (idade < 0 || idade > 38) continue;
      const tn = entre(nasce, ini, ini + PASSA);
      const x0 = -40 + tn * 380 + (sorte(j * 50 + i) - 0.5) * 30;
      const y0 = lamina(x0, ps.vista).y + 6;
      const x = x0 + (sorte(j * 50 + i + 7) - 0.5) * 1.6 * idade;
      const y = y0 - (1 + sorte(j * 50 + i + 3) * 3) * idade + 0.45 * idade * idade;
      const tam = 7 + sorte(j * 50 + i + 11) * 8;
      const ang = sorte(j * 50 + i + 13) * 180 + idade * 9;
      fios.push(<rect key={`${j}-${i}`} x={-tam / 2} y={-1.6} width={tam} height={3.2} rx={1.6} fill={p.cabeca.corCabelo} opacity={1 - idade / 38} transform={`translate(${x} ${y}) rotate(${ang})`} />);
    }
  });

  // brilhos quando o corte fica pronto (no cabelo de frente, na linha da nuca de costas)
  const brilhos: React.ReactNode[] = [];
  passos.forEach((ps, j) => {
    const ini = ps.q + PASSA / 2 - 2;
    if (f < ini || f > ini + 30) return;
    const pontos = ps.vista === "costas" ? [[96, 284], [204, 284], [150, 300]] : [[58, 92], [244, 84], [150, 2]];
    pontos.forEach(([x, y], i) => {
      const a = entre(f, ini + i * 4, ini + i * 4 + 22, [0, 1]);
      const s = Math.sin(Math.PI * a) * (i === 2 ? 0.8 : 1.1);
      if (s <= 0) return;
      brilhos.push(<path key={`${j}-${i}`} d="M0 -18 C2 -4 4 -2 18 0 C4 2 2 4 0 18 C-2 4 -4 2 -18 0 C-4 -2 -2 -4 0 -18 Z" fill="#f2c063" stroke="#fff" strokeWidth={2} transform={`translate(${x} ${y}) scale(${s}) rotate(${a * 90})`} />);
    });
  });

  // pedacinhos de cabelo que ficam na capa (mais a cada corte)
  const capa: React.ReactNode[] = [];
  passos.forEach((ps, j) => {
    if (f < ps.q) return;
    for (let i = 0; i < 7; i++) {
      const n = j * 30 + i;
      capa.push(<rect key={n} x={170 + sorte(n + 300) * 740} y={1090 + sorte(n + 400) * 300} width={10 + sorte(n + 500) * 10} height={4} rx={2} fill={p.cabeca.corCabelo} opacity={0.85} transform={`rotate(${sorte(n + 600) * 180} ${170 + sorte(n + 300) * 740} ${1090 + sorte(n + 400) * 300})`} />);
    }
  });

  // pílula com o nome do corte
  let r = -1;
  passos.forEach((ps, i) => {
    if (f >= ps.q - 2) r = i;
  });
  const pilula = r >= 0 ? mola(f, passos[r].q - 2, { damping: 12, stiffness: 220 }) * (passos[r + 1] ? 1 - entre(f, passos[r + 1].q - 8, passos[r + 1].q - 2) : 1) : 0;
  const texto = r >= 0 ? (passos[r].rotulo ?? NOMES_CORTE[passos[r].estilo]) : "";

  const cabeca = `translate(${CX} ${CY + respira}) rotate(${balanco}) scale(${ESCALA * largura} ${ESCALA}) translate(-150 -190)`;
  return (
    <AbsoluteFill style={{ background: "#f3ece4", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: `${CX}px 760px` }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id={`${id}fundo`} cx="0.5" cy="0.36" r="0.6">
              <stop offset="0" stopColor="#f7f1ea" />
              <stop offset="1" stopColor="#e6d6c5" />
            </radialGradient>
            {/* máscara (e não clipPath): ela recorta o grupo já pronto, sem deixar fresta clara na borda */}
            <mask id={`${id}novo`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={1200} height={1200}>
              <rect x={-400} y={-400} width={402 + xm} height={1200} fill="#fff" />
            </mask>
            <mask id={`${id}velho`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={1200} height={1200}>
              <rect x={xm - 2} y={-400} width={1200} height={1200} fill="#fff" />
            </mask>
          </defs>
          <rect width={1080} height={1920} fill={`url(#${id}fundo)`} />
          <circle cx={CX} cy={CY - 20} r={470} fill="#ead9c7" />
          <circle cx={CX} cy={CY - 20} r={470} fill="none" stroke={C.acento} strokeWidth={6} opacity={0.18} strokeDasharray="4 22" strokeLinecap="round" />
          {/* pescoço e capa */}
          <g transform={`translate(0 ${respira * 0.6})`}>
            <rect x={CX - 100} y={860} width={200} height={230} rx={60} fill={p.cabeca.sombra} />
            <path d="M40 1920 L90 1300 C120 1140 300 1050 450 1040 L630 1040 C780 1050 960 1140 990 1300 L1040 1920 Z" fill={C.acento} />
            <path d="M300 1190 C320 1400 300 1620 270 1920 M780 1190 C760 1400 780 1620 810 1920" stroke={C.acentoForte} strokeWidth={8} fill="none" opacity={0.5} strokeLinecap="round" />
            <path d="M424 1046 Q540 1112 656 1046" stroke="#f3ece4" strokeWidth={28} fill="none" strokeLinecap="round" />
            {capa}
          </g>
          {/* a cabeça: o corte novo fica à esquerda da máquina, o antigo à direita (os dois se encostam 2 px, sem fresta) */}
          <g transform={cabeca}>
            {passando ? (
              <>
                <g mask={`url(#${id}velho)`}>
                  <Cabeca {...props} corte={antes.corte} vista={antes.vista} />
                </g>
                <g mask={`url(#${id}novo)`}>
                  <Cabeca {...props} corte={atual.corte} vista={atual.vista} />
                </g>
              </>
            ) : (
              <Cabeca {...props} corte={antes.corte} vista={antes.vista} />
            )}
            {fios}
            {brilhos}
            {passando && (
              <g transform={`translate(${xm} ${ym}) rotate(${giro})`}>
                <Maquina vibra={vibra} />
              </g>
            )}
          </g>
        </svg>
      </div>
      {/* nome do corte */}
      {pilula > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `scale(${pilula})`, display: "flex", alignItems: "center", gap: 22, background: C.escuro, color: "#f3ece4", borderRadius: 999, padding: "22px 56px 24px 40px", fontFamily: F.sans, fontWeight: 800, fontSize: 68, letterSpacing: "-0.01em", boxShadow: "0 24px 50px -20px rgba(0,0,0,0.6)", border: "4px solid #f2c063" }}>
            <span style={{ width: 26, height: 26, borderRadius: 99, background: "#f2c063" }} />
            {texto}
          </div>
        </div>
      )}
      {passos.map((ps, i) => (
        <React.Fragment key={i}>
          <Som em={ps.q - PASSA / 2} tipo="zumbir" />
          <Som em={ps.q - 2} tipo="pop" vol={0.7} />
          {ps.vista !== (i ? passos[i - 1].vista : "frente") && <Som em={ps.q - PASSA / 2 - GIRO} tipo="whoosh" vol={0.8} />}
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
}
