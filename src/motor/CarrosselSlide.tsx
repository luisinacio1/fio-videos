import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, Laco } from "../base";
import { Objeto, type Objeto2D } from "../motion/Objetos";
import { Cabeca, ELENCO, type NomeElenco } from "../motion/Personagens";
import { ALTURA_TELA, LARGURA_TELA } from "../motion/TelasFio";
import type { Slide } from "./carrossel";
import { Tela, type TelaStory } from "./StoryBloco";

/**
 * Um slide do carrossel do dia (educação para o barbeiro), 1080×1350, no modelo dos carrosséis do G4:
 * capa que prende → problema com números → "na sua barbearia" → quadro prático → tela do app → fecho.
 * Fundo escuro e claro alternando; tema e posição no topo; seta → em todos menos no último.
 */
export type PropsCarrosselSlide = { rotulo: string; n: number; total: number; slide: Slide };

const CREME = "#f3ece4";
const OURO = "#f2c063";
const L = 1080;
const A = 1350;
const M = 90; // margem lateral

type Paleta = { texto: string; suave: string; destaque: string; claro: boolean };
const ESCURO: Paleta = { texto: CREME, suave: "rgba(243,236,228,0.72)", destaque: OURO, claro: false };
const CLARO: Paleta = { texto: C.texto, suave: C.texto2, destaque: C.acento, claro: true };

function Fundo({ tipo }: { tipo: "escuro" | "creme" | "terracota" }) {
  const bg =
    tipo === "escuro"
      ? `radial-gradient(900px 700px at 85% 0%, rgba(176,81,58,0.40), transparent 60%), ${C.escuro}`
      : tipo === "terracota"
        ? `radial-gradient(120% 80% at 50% 30%, #c35f45 0%, ${C.acento} 45%, #7c3424 100%)`
        : `radial-gradient(900px 700px at 90% 0%, rgba(176,81,58,0.12), transparent 60%), ${C.fundo}`;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 140, top: 380, opacity: tipo === "creme" ? 0.05 : 0.07 }}>
        <Laco tamanho={900} cor={tipo === "creme" ? C.acento : CREME} espessura={1.4} />
      </div>
    </AbsoluteFill>
  );
}

/** a marca do Fio, o tema e a posição ("3/7") */
function Topo({ rotulo, n, total, p }: { rotulo: string; n: number; total: number; p: Paleta }) {
  return (
    <div style={{ position: "absolute", left: M, right: M, top: 64, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.sans, color: p.texto }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.serif, fontWeight: 600, fontSize: 36 }}>
        <Laco tamanho={46} cor={p.claro ? C.acento : OURO} espessura={2.8} />
        Fio
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.85 }}>
        {rotulo} · {n}/{total}
      </div>
    </div>
  );
}

/** a seta para arrastar, no canto de baixo (com texto na capa) */
function Seta({ p, texto }: { p: Paleta; texto?: string }) {
  return (
    <div style={{ position: "absolute", right: M, bottom: 60, display: "flex", alignItems: "center", gap: 16, fontFamily: F.sans, fontWeight: 700, fontSize: 30, color: p.suave }}>
      {texto}
      <svg width={64} height={32} viewBox="0 0 64 32" fill="none" stroke={p.destaque} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 16h54M44 4l14 12-14 12" />
      </svg>
    </div>
  );
}

/** o miolo dos slides de conteúdo: centralizado na vertical entre o topo e a seta */
const MIOLO: React.CSSProperties = { position: "absolute", left: M, right: M, top: 170, bottom: 150, display: "flex", flexDirection: "column", justifyContent: "center" };

/** slide muito cheio: diminui tudo junto (até 75%) para caber; o limite de letras da conferência já evita o exagero */
function densidade(s: Slide): number {
  const n = (...t: (string | undefined)[]) => t.reduce((a, x) => a + (x?.length ?? 0), 0);
  if (s.tipo === "texto") return Math.min(1, Math.max(0.75, 400 / n(s.titulo, ...s.paragrafos, s.puxada)));
  if (s.tipo === "lista") return Math.min(1, Math.max(0.75, 380 / n(s.titulo, ...s.itens.flatMap((i) => [i.termo, i.texto]), s.puxada)));
  if (s.tipo === "compara") return Math.min(1, Math.max(0.75, 230 / n(...s.a.linhas, ...s.b.linhas, s.puxada)));
  return 1;
}

/** o conteúdo com o zoom da densidade (o zoom do Chrome encolhe fonte e espaço juntos) */
function Ajusta({ k, children }: { k: number; children: React.ReactNode }) {
  return <div style={{ zoom: k, display: "flex", flexDirection: "column" }}>{children}</div>;
}

const titulo = (p: Paleta, tamanho = 64): React.CSSProperties => ({ fontFamily: F.sans, fontWeight: 900, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: p.texto });
const corpo = (p: Paleta): React.CSSProperties => ({ fontFamily: F.sans, fontWeight: 500, fontSize: 38, lineHeight: 1.36, color: p.texto });
const puxada = (p: Paleta): React.CSSProperties => ({ fontFamily: F.sans, fontWeight: 800, fontSize: 40, lineHeight: 1.3, color: p.destaque });

/** personagem do elenco do peito para cima; (x, y) é a base do pescoço */
function Busto({ quem, x, y, escala }: { quem: NomeElenco; x: number; y: number; escala: number }) {
  const e = ELENCO[quem];
  return (
    <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x} ${y}) scale(${escala}) translate(-540 -1100)`}>
        <rect x={490} y={990} width={100} height={140} rx={34} fill={e.cabeca.sombra} />
        <path d="M300 1700 L300 1300 C300 1180 400 1112 480 1100 L600 1100 C680 1112 780 1180 780 1300 L780 1700 Z" fill={e.roupa} />
        <path d="M480 1100 Q540 1150 600 1100" stroke={e.sombraRoupa} strokeWidth={10} fill="none" strokeLinecap="round" />
        <g transform="translate(540 872) scale(1.25) translate(-150 -190)">
          <Cabeca {...e.cabeca} olhar={[0, 4]} boca="sorriso" sobrancelha={0} />
        </g>
      </g>
    </svg>
  );
}

/** o celular inteiro, com a tela real do app (nunca esticada até a borda) */
function Celular({ t, cx, top, escala }: { t: TelaStory; cx: number; top: number; escala: number }) {
  const B = 12;
  return (
    <div style={{ position: "absolute", left: cx - (LARGURA_TELA * escala) / 2, top, transformOrigin: "0 0", transform: `scale(${escala})` }}>
      <div style={{ position: "absolute", left: -B, top: -B, width: LARGURA_TELA + B * 2, height: ALTURA_TELA + B * 2, borderRadius: 58, background: "linear-gradient(140deg, #3a332d, #15110e 40%, #2b2520)", boxShadow: "0 40px 60px -20px rgba(20,8,4,0.6), inset 0 0 0 1.5px rgba(255,255,255,0.12)" }} />
      <div style={{ position: "relative", width: LARGURA_TELA, height: ALTURA_TELA, borderRadius: 47, overflow: "hidden", background: C.fundo }}>
        <Tela t={t} />
        <div style={{ position: "absolute", left: LARGURA_TELA / 2 - 46, top: 4, width: 92, height: 22, borderRadius: 99, background: "#0b0908" }} />
      </div>
    </div>
  );
}

function Selo({ children, cor, texto }: { children: React.ReactNode; cor: string; texto: string }) {
  return <div style={{ display: "inline-flex", alignItems: "center", background: cor, color: texto, borderRadius: 999, padding: "18px 34px", fontFamily: F.sans, fontWeight: 800, fontSize: 36 }}>{children}</div>;
}

export function CarrosselSlide({ rotulo, n, total, slide: s }: PropsCarrosselSlide) {
  const ultimo = n === total;
  // capa escura; depois alterna claro/escuro; o fecho é terracota
  const tipoFundo = s.tipo === "fecho" ? "terracota" : n % 2 === 1 ? "escuro" : "creme";
  const p = tipoFundo === "creme" ? CLARO : ESCURO;

  let miolo: React.ReactNode;
  if (s.tipo === "capa") {
    const il = s.ilustracao;
    miolo = (
      <>
        <div style={{ position: "absolute", left: M, right: M, top: 210 }}>
          <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 96, lineHeight: 1.04, letterSpacing: "-0.015em", color: p.texto }}>{s.titulo}</div>
          <div style={{ marginTop: 34, fontFamily: F.sans, fontWeight: 700, fontSize: 44, lineHeight: 1.25, color: p.destaque }}>{s.curiosidade}</div>
        </div>
        {il?.tela && <Celular t={il.tela} cx={L / 2} top={640} escala={0.68} />}
        {!il?.tela && il?.personagem && il.personagem in ELENCO && <Busto quem={il.personagem as NomeElenco} x={540} y={1250} escala={1.05} />}
        {!il?.tela && !il?.personagem && il?.objeto && (
          <div style={{ position: "absolute", left: L / 2 - 210, top: 820, width: 420, height: 420 }}>
            <Objeto nome={il.objeto as Objeto2D} f={0} tamanho={420} />
          </div>
        )}
      </>
    );
  } else if (s.tipo === "texto") {
    miolo = (
      <div style={MIOLO}>
        <Ajusta k={densidade(s)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={titulo(p)}>{s.titulo}</div>
            {s.paragrafos.map((t, i) => (
              <div key={i} style={corpo(p)}>{t}</div>
            ))}
            {s.puxada && <div style={puxada(p)}>{s.puxada}</div>}
            {s.fonte && <div style={{ marginTop: 20, fontFamily: F.sans, fontSize: 24, color: p.suave }}>Fonte: {s.fonte}</div>}
          </div>
        </Ajusta>
      </div>
    );
  } else if (s.tipo === "lista") {
    miolo = (
      <div style={MIOLO}>
        <Ajusta k={densidade(s)}>
        <div style={titulo(p)}>{s.titulo}</div>
        <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: s.itens.length > 4 ? 28 : 38 }}>
          {s.itens.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 99, background: p.destaque, color: p.claro ? "#fff" : C.escuro, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 34 }}>{i + 1}</div>
              <div style={{ ...corpo(p), fontSize: 36, paddingTop: 6 }}>
                <span style={{ fontWeight: 800 }}>{it.termo}:</span> {it.texto}
              </div>
            </div>
          ))}
        </div>
        {s.puxada && <div style={{ ...puxada(p), marginTop: 44 }}>{s.puxada}</div>}
        </Ajusta>
      </div>
    );
  } else if (s.tipo === "compara") {
    const Lado = ({ lado, vence }: { lado: { rotulo: string; linhas: string[] }; vence: boolean }) => (
      <div style={{ flex: 1, borderRadius: 32, padding: "32px 30px", background: vence ? p.destaque : p.claro ? "#fff" : "rgba(243,236,228,0.08)", border: vence ? "none" : `2px solid ${p.claro ? C.divisoria : "rgba(243,236,228,0.18)"}` }}>
        <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 40, color: vence ? (p.claro ? "#fff" : C.escuro) : p.texto, marginBottom: 22 }}>{lado.rotulo}</div>
        {lado.linhas.map((l, i) => (
          <div key={i} style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 33, lineHeight: 1.3, color: vence ? (p.claro ? "#fff" : C.escuro) : p.suave, marginBottom: 18 }}>{l}</div>
        ))}
      </div>
    );
    miolo = (
      <div style={MIOLO}>
        <Ajusta k={densidade(s)}>
        <div style={titulo(p)}>{s.titulo}</div>
        <div style={{ marginTop: 50, display: "flex", gap: 28, alignItems: "stretch" }}>
          <Lado lado={s.a} vence={false} />
          <div style={{ alignSelf: "center", fontFamily: F.serif, fontWeight: 700, fontSize: 40, color: p.suave }}>vs</div>
          <Lado lado={s.b} vence />
        </div>
        {s.puxada && <div style={{ ...puxada(p), marginTop: 44 }}>{s.puxada}</div>}
        </Ajusta>
      </div>
    );
  } else if (s.tipo === "tela") {
    miolo = (
      <>
        <div style={{ position: "absolute", left: M, right: M, top: 170 }}>
          <div style={titulo(p, 50)}>{s.frase}</div>
        </div>
        <Celular t={s.tela} cx={L / 2} top={470} escala={0.8} />
      </>
    );
  } else {
    miolo = (
      <div style={{ ...MIOLO, top: 140 }}>
        <Laco tamanho={150} cor={OURO} espessura={2.6} />
        <div style={{ marginTop: 40, fontFamily: F.serif, fontWeight: 700, fontSize: 76, lineHeight: 1.1, color: CREME }}>{s.frase}</div>
        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
          <Selo cor={C.escuro} texto={CREME}>7 dias grátis, sem cartão</Selo>
          <Selo cor={C.escuro} texto={CREME}>A gente monta pra você</Selo>
          <Selo cor={CREME} texto={C.texto}>Link na bio</Selo>
        </div>
      </div>
    );
  }

  return (
    <AbsoluteFill>
      <Fundo tipo={tipoFundo} />
      <Topo rotulo={rotulo} n={n} total={total} p={p} />
      {miolo}
      {!ultimo && <Seta p={p} texto={s.tipo === "capa" ? "Arraste" : undefined} />}
    </AbsoluteFill>
  );
}
