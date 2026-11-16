import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { C, F, Laco } from "./base";

/**
 * Tour do Fio gravado de verdade (videos/gravacao/gravar-tour.mjs): cada passo é uma foto da tela,
 * com o cursor indo até onde a pessoa clicou, zoom suave quando digita e o nome da etapa no canto.
 * pc = 16:9 (YouTube), com moldura de navegador; cel = 9:16 (TikTok/Reels), tela de celular.
 * `extras` (quadros por etapa) alonga o fim de cada etapa para caber a narração.
 */

export type Passo = {
  img: string;
  ms: number;
  capitulo: string;
  tela: "principal" | "celular";
  url: string;
  cursor?: { x: number; y: number; w: number; h: number };
  clique?: boolean;
  zoom?: { x: number; y: number; escala: number };
  digitando?: boolean;
};
export type Gravacao = { formato: "pc" | "cel"; largura: number; passos: Passo[] };
export type PropsTour = { gravacao: Gravacao; extras: Record<string, number>; audio: string | null };

const FPS = 30;
export const ABERTURA = 60;
export const FECHAMENTO = 100;
const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const suave = Easing.bezier(0.45, 0, 0.2, 1);
const entre = (f: number, de: number, ate: number, s: [number, number] = [0, 1], e = suave) => interpolate(f, [de, ate], s, { ...lim, easing: e });

/** Quadro em que cada passo começa (mesma conta em scripts/audio-tour.mjs). */
export function linhaDoTempo(g: Gravacao, extras: Record<string, number>) {
  const inicio: number[] = [];
  const dur: number[] = [];
  let t = ABERTURA + (extras.__abertura ?? 0);
  g.passos.forEach((p, i) => {
    inicio.push(t);
    let d = Math.max(2, Math.round((p.ms * FPS) / 1000));
    const ultimoDaEtapa = !g.passos[i + 1] || g.passos[i + 1].capitulo !== p.capitulo;
    if (ultimoDaEtapa) d += extras[p.capitulo] ?? 0;
    dur.push(d);
    t += d;
  });
  return { inicio, dur, total: t + FECHAMENTO };
}

function Cursor({ x, y, apertado, toque }: { x: number; y: number; apertado: number; toque: boolean }) {
  if (toque) {
    return (
      <div style={{ position: "absolute", left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 99, background: "rgba(31,27,23,0.28)", border: "4px solid rgba(255,255,255,0.95)", boxShadow: "0 10px 26px rgba(0,0,0,0.3)", transform: `scale(${1 - apertado * 0.18})` }} />
    );
  }
  return (
    <svg width={44} height={56} viewBox="0 0 22 28" style={{ position: "absolute", left: x - 4, top: y - 2, transform: `scale(${1 - apertado * 0.12})`, transformOrigin: "4px 2px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))" }}>
      <path d="M2 1 L2 22 L7.5 17 L11 25.5 L14.6 24 L11.2 15.8 L18.5 15.8 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  );
}

function Ondinha({ x, y, t }: { x: number; y: number; t: number }) {
  if (t < 0 || t > 16) return null;
  const p = entre(t, 0, 16, [0, 1], Easing.out(Easing.cubic));
  return <div style={{ position: "absolute", left: x - 30 - p * 40, top: y - 30 - p * 40, width: 60 + p * 80, height: 60 + p * 80, borderRadius: 999, border: `4px solid ${C.acento}`, opacity: 1 - p }} />;
}

/** Onde o cursor está no quadro: vai do ponto anterior até o alvo do passo atual nos primeiros 70% dele. */
function posicaoCursor(g: Gravacao, inicio: number[], dur: number[], i: number, f: number) {
  let anterior: { x: number; y: number } | null = null;
  for (let k = i - 1; k >= 0; k--) {
    const c = g.passos[k].cursor;
    if (c && g.passos[k].tela === g.passos[i].tela) {
      anterior = c;
      break;
    }
  }
  const alvo = g.passos[i].cursor ?? anterior;
  if (!alvo) return null;
  const de = anterior ?? { x: alvo.x + 260, y: alvo.y + 220 };
  const viagem = Math.max(6, Math.min(18, Math.round(dur[i] * 0.7)));
  const p = entre(f - inicio[i], 0, viagem);
  return { x: interpolate(p, [0, 1], [de.x, alvo.x]), y: interpolate(p, [0, 1], [de.y, alvo.y]) };
}

/** Câmera: chega perto do campo quando o passo pede zoom, e volta devagar. */
function camera(g: Gravacao, inicio: number[], i: number, f: number) {
  const alvo = (k: number) => (k >= 0 && g.passos[k].zoom ? g.passos[k].zoom! : null);
  const atual = alvo(i);
  let k = i - 1;
  while (k >= 0 && JSON.stringify(alvo(k)) === JSON.stringify(atual)) k--;
  const antes = alvo(k);
  const desde = k >= 0 ? inicio[k + 1] : 0;
  const p = entre(f - desde, 0, 14);
  const de = antes ?? { x: atual?.x ?? 960, y: atual?.y ?? 540, escala: 1 };
  const ate = atual ?? { x: antes?.x ?? 960, y: antes?.y ?? 540, escala: 1 };
  return { x: interpolate(p, [0, 1], [de.x, ate.x]), y: interpolate(p, [0, 1], [de.y, ate.y]), escala: interpolate(p, [0, 1], [de.escala, ate.escala]) };
}

function BarraNavegador({ url }: { url: string }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 60, background: "#ebe6df", borderBottom: "1px solid #d9d1c6", display: "flex", alignItems: "center", gap: 18, padding: "0 22px", fontFamily: F.sans }}>
      <div style={{ display: "flex", gap: 9 }}>
        {["#ec6a5e", "#f4bf4f", "#61c554"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c }} />
        ))}
      </div>
      <div style={{ flex: 1, maxWidth: 900, margin: "0 auto", height: 38, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontSize: 20, color: "#3d3833" }}>
        <svg width={16} height={18} viewBox="0 0 16 18">
          <rect x={2} y={8} width={12} height={9} rx={2} fill="#6f675e" />
          <path d="M4.5 8V5.5a3.5 3.5 0 0 1 7 0V8" stroke="#6f675e" strokeWidth={2} fill="none" />
        </svg>
        {url}
      </div>
      <div style={{ width: 70 }} />
    </div>
  );
}

function Etapa({ titulo, numero, f, emCima }: { titulo: string; numero: number; f: number; emCima: boolean }) {
  const entra = spring({ frame: f, fps: FPS, config: { damping: 15, stiffness: 180 } });
  const sai = entre(f, 70, 84);
  if (f > 86) return null;
  return (
    <div style={{ position: "absolute", left: 40, ...(emCima ? { top: 150 } : { bottom: 40 }), display: "flex", alignItems: "center", gap: 14, background: C.escuro, color: "#fff", borderRadius: 999, padding: "14px 28px 14px 14px", fontFamily: F.sans, fontWeight: 700, fontSize: 30, opacity: entra * (1 - sai), transform: `translateY(${(1 - entra) * 40 + sai * 20}px)`, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.45)" }}>
      <span style={{ width: 44, height: 44, borderRadius: 99, background: C.acento, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{numero}</span>
      {titulo}
    </div>
  );
}

function Abertura({ f, pc, dur }: { f: number; pc: boolean; dur: number }) {
  const s = spring({ frame: f - 4, fps: FPS, config: { damping: 16 } });
  const sai = entre(f, dur - 12, dur);
  return (
    <AbsoluteFill style={{ background: C.escuro, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26, opacity: 1 - sai }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 22, transform: `scale(${0.9 + s * 0.1})`, opacity: s }}>
        <Laco tamanho={pc ? 120 : 150} progresso={entre(f, 2, 30)} cor="#d9764f" espessura={2.6} />
        <span style={{ fontFamily: F.serif, fontWeight: 600, fontSize: pc ? 120 : 150, color: C.fundo, lineHeight: 0.9 }}>Fio</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: pc ? 40 : 46, color: "#d8cabd", opacity: entre(f, 14, 26), textAlign: "center", padding: "0 60px" }}>Do zero ao primeiro agendamento</div>
    </AbsoluteFill>
  );
}

function Fechamento({ f, pc }: { f: number; pc: boolean }) {
  const s = spring({ frame: f - 6, fps: FPS, config: { damping: 15 } });
  const botao = spring({ frame: f - 18, fps: FPS, config: { damping: 11 } });
  return (
    <AbsoluteFill style={{ background: C.escuro, alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, clipPath: `circle(${entre(f, 0, 14) * 150}% at 50% 50%)` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 22, opacity: s }}>
        <Laco tamanho={pc ? 120 : 150} progresso={entre(f, 4, 30)} cor="#d9764f" espessura={2.6} />
        <span style={{ fontFamily: F.serif, fontWeight: 600, fontSize: pc ? 120 : 150, color: C.fundo, lineHeight: 0.9 }}>Fio</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: pc ? 46 : 50, fontWeight: 700, color: "#fff", background: C.acento, borderRadius: 999, padding: "26px 60px", transform: `scale(${0.7 + botao * 0.3})`, opacity: botao }}>agendafio.com.br</div>
      <div style={{ fontFamily: F.sans, fontSize: pc ? 32 : 38, color: "#bfb2a5", opacity: s }}>7 dias grátis, sem cartão</div>
    </AbsoluteFill>
  );
}

/** A foto do passo com câmera, cursor e clique, no espaço da foto (largura x altura dela). */
function Tela({ g, inicio, dur, i, f, largura, altura, toque }: { g: Gravacao; inicio: number[]; dur: number[]; i: number; f: number; largura: number; altura: number; toque: boolean }) {
  const p = g.passos[i];
  const cam = camera(g, inicio, i, f);
  const cur = posicaoCursor(g, inicio, dur, i, f);
  const fimPasso = inicio[i] + dur[i];
  const apertado = p.clique ? entre(f, fimPasso - 5, fimPasso - 2) * (1 - entre(f, fimPasso - 2, fimPasso + 2)) : 0;
  // a ondinha do clique aparece no começo do passo seguinte, no mesmo lugar
  const ant = g.passos[i - 1];
  const onda = ant?.clique && ant.cursor && ant.tela === p.tela ? <Ondinha x={ant.cursor.x} y={ant.cursor.y} t={f - inicio[i] + 2} /> : null;
  return (
    <div style={{ position: "absolute", inset: 0, width: largura, height: altura, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${cam.x}px ${cam.y}px`, transform: `scale(${cam.escala})` }}>
        <Img src={staticFile(`tour/${g.formato}/${p.img}`)} style={{ position: "absolute", left: 0, top: 0, width: largura, height: altura, objectFit: "cover", objectPosition: "top" }} />
        {onda}
        {cur && <Cursor x={cur.x} y={cur.y} apertado={apertado} toque={toque} />}
      </div>
    </div>
  );
}

/** Tela do cliente: o celular em pé, no centro, sobre o fundo da marca (só na versão de computador). */
function CelularNoPc({ children, f }: { children: React.ReactNode; f: number }) {
  const s = spring({ frame: f, fps: FPS, config: { damping: 16 } });
  const E = 0.5;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 70% 20%, rgba(176,81,58,0.18), transparent 60%), ${C.fundo}` }}>
      <div style={{ position: "absolute", left: 160, top: 380, width: 560, fontFamily: F.serif, fontSize: 76, fontWeight: 600, lineHeight: 1.05, color: C.texto, opacity: s }}>
        Do lado do <span style={{ color: C.acento, fontStyle: "italic" }}>cliente</span>
        <div style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 400, color: C.texto2, marginTop: 24, lineHeight: 1.4 }}>Ele abre o seu link no celular e marca sozinho, sem baixar aplicativo.</div>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 60 + (1 - s) * 400, width: 1080 * E + 28, height: 1800 * E + 28, borderRadius: 56, background: "#16120f", padding: 14, boxShadow: "0 60px 120px -40px rgba(42,32,24,0.6)" }}>
        <div style={{ position: "relative", width: 1080 * E, height: 1800 * E, borderRadius: 44, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1800, transform: `scale(${E})`, transformOrigin: "0 0" }}>{children}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function Tour({ gravacao: g, extras, audio }: PropsTour) {
  const frame = useCurrentFrame();
  const { inicio, dur, total } = linhaDoTempo(g, extras);
  const pc = g.formato === "pc";
  const abertura = ABERTURA + (extras.__abertura ?? 0);
  const fimPassos = total - FECHAMENTO;
  let i = inicio.findIndex((s, k) => frame >= s && frame < s + dur[k]);
  if (i < 0) i = frame < abertura ? 0 : g.passos.length - 1;
  const p = g.passos[i];
  const capitulos = [...new Set(g.passos.map((x) => x.capitulo))];
  const iniCap = inicio[g.passos.findIndex((x) => x.capitulo === p.capitulo)];
  const corte = entre(frame - iniCap, 0, 8);
  const celular = p.tela === "celular";
  const iniCel = inicio[g.passos.findIndex((x) => x.tela === "celular")] ?? 0;

  const telaPrincipal = pc ? (
    <AbsoluteFill style={{ background: C.fundo }}>
      <BarraNavegador url={p.url} />
      <div style={{ position: "absolute", left: 0, top: 60, width: 1920, height: 1020 }}>
        <Tela g={g} inicio={inicio} dur={dur} i={i} f={frame} largura={1920} altura={1020} toque={false} />
      </div>
    </AbsoluteFill>
  ) : (
    <AbsoluteFill style={{ background: C.fundo }}>
      <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: 120, background: "#f1ece5", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, paddingBottom: 18, fontFamily: F.sans }}>
        {celular && <div style={{ height: 62, borderRadius: 18, background: C.escuro, color: "#fff", fontWeight: 700, padding: "0 22px", display: "flex", alignItems: "center", fontSize: 28 }}>Cliente</div>}
        <div style={{ height: 62, borderRadius: 18, background: "#fff", padding: "0 30px", display: "flex", alignItems: "center", fontSize: 32, color: "#3d3833", border: "1px solid #e2dbd2" }}>{p.url}</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 120, width: 1080, height: 1800 }}>
        <Tela g={g} inicio={inicio} dur={dur} i={i} f={frame} largura={1080} altura={1800} toque />
      </div>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {frame < fimPassos && (
        <AbsoluteFill style={{ transform: `scale(${1 + (1 - corte) * 0.04})`, opacity: 0.4 + corte * 0.6 }}>
          {pc && celular ? (
            <CelularNoPc f={frame - iniCel}>
              <Tela g={g} inicio={inicio} dur={dur} i={i} f={frame} largura={1080} altura={1800} toque />
            </CelularNoPc>
          ) : (
            telaPrincipal
          )}
        </AbsoluteFill>
      )}
      {frame >= abertura && frame < fimPassos && <Etapa titulo={p.capitulo} numero={capitulos.indexOf(p.capitulo) + 1} f={frame - iniCap} emCima={!pc} />}
      {frame < abertura && <Abertura f={frame} pc={pc} dur={abertura} />}
      {frame >= fimPassos && <Fechamento f={frame - fimPassos} pc={pc} />}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
}
