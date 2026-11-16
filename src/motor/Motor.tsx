import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, F, Laco } from "../base";
import { LegendaDinamica, montarBlocos } from "../motion/LegendaDinamica";
import { App, aviso } from "./cenas/App";
import { ApresentaFio } from "./cenas/ApresentaFio";
import { Barbearia, BarbeariaAntiga, Cidade, Quarto, Sala } from "./cenas/Cenarios";
import { Corte } from "./cenas/Corte";
import { Compara, LinhaDoTempo, Passos } from "./cenas/Explica";
import { CenaObjeto } from "./cenas/Objeto";
import { Final, Texto } from "./cenas/Texto";
import { FPS, TRANSICAO, duracao, linhaDasCenas, quadro, type Cena, type Entrada, type Roteiro, type Tempos } from "./roteiro";
import { ProvedorCena, Som, entre, mola, sai } from "./util";

/**
 * Motor dos vídeos diários: lê um roteiro (motor/roteiro.ts) e monta o vídeo com as peças prontas.
 * Cada cena entra no tempo da palavra que a chama; a legenda, os efeitos e a música seguem a narração.
 */

export type PropsMotor = { roteiro: Roteiro; tempos: Tempos; voz: string | null; musica: string | null };

/** ponto da tela onde costumam estar os celulares (o mergulho entra por ele) */
const ANCORA = { x: 540, y: 1350 };

function entradaPadrao(c: Cena, antes?: Cena): Entrada {
  if (c.tipo === "final") return "onda";
  if (c.tipo === "app") return antes && antes.tipo !== "app" && antes.tipo !== "texto" ? "mergulho" : "chicote";
  if (c.tipo === "texto" || c.tipo === "apresentaFio") return "zoom";
  return "chicote";
}

/** `dupla`: a chamada dupla no final (o Motor decide pelo roteiro; a cena não lê nada de fora) */
function Cena_({ c, dupla }: { c: Cena; dupla: boolean }) {
  switch (c.tipo) {
    case "quarto":
      return <Quarto c={c} />;
    case "sala":
      return <Sala c={c} />;
    case "barbearia":
      return <Barbearia c={c} />;
    case "barbeariaAntiga":
      return <BarbeariaAntiga c={c} />;
    case "cidade":
      return <Cidade c={c} />;
    case "app":
      return <App c={c} />;
    case "texto":
      return <Texto c={c} />;
    case "corte":
      return <Corte c={c} />;
    case "objeto":
      return <CenaObjeto c={c} />;
    case "linhaDoTempo":
      return <LinhaDoTempo c={c} />;
    case "compara":
      return <Compara c={c} />;
    case "passos":
      return <Passos c={c} />;
    case "apresentaFio":
      return <ApresentaFio c={c} />;
    default:
      return <Final c={c} dupla={dupla} />;
  }
}

/** Entrada da cena (primeiros quadros) e saída quando a próxima mergulha nela. */
function Transicao({ entrada, mergulhaDepois, dur, children }: { entrada: Entrada | null; mergulhaDepois: boolean; dur: number; children: React.ReactNode }) {
  const f = useCurrentFrame();
  const p = entre(f, 0, TRANSICAO, [0, 1], sai);
  const q = mergulhaDepois ? entre(f, dur - TRANSICAO, dur) : 0;
  let estilo: React.CSSProperties = {};
  if (entrada && p < 1) {
    if (entrada === "chicote") estilo = { transform: `translateX(${(1 - p) * 1080}px)`, filter: `blur(${(1 - p) * 16}px)` };
    else if (entrada === "zoom") estilo = { transform: `scale(${1.25 - 0.25 * p})`, opacity: p, filter: `blur(${(1 - p) * 12}px)` };
    else if (entrada === "subir") estilo = { transform: `translateY(${(1 - p) * 1920}px)` };
    else if (entrada === "mergulho") estilo = { clipPath: `circle(${p * 2300}px at ${ANCORA.x}px ${ANCORA.y}px)`, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: `${ANCORA.x}px ${ANCORA.y}px` };
    else if (entrada === "onda") estilo = { clipPath: `circle(${entre(f, 4, TRANSICAO + 4, [0, 1], sai) * 2400}px at 540px 960px)` };
  }
  if (q > 0) estilo = { ...estilo, transform: `scale(${1 + q * 1.8})`, transformOrigin: `${ANCORA.x}px ${ANCORA.y}px`, filter: `blur(${q * 10}px)` };
  return (
    <>
      {entrada === "onda" && p < 1 && <AbsoluteFill style={{ background: C.acento, clipPath: `circle(${entre(f, 0, TRANSICAO, [0, 1], sai) * 2400}px at 540px 960px)` }} />}
      <AbsoluteFill style={estilo}>{children}</AbsoluteFill>
    </>
  );
}

// ---------- o que aparece por cima das cenas ----------

function Extras({ roteiro, tempos }: { roteiro: Roteiro; tempos: Tempos }) {
  const f = useCurrentFrame();
  const cenas = linhaDasCenas(roteiro, tempos);
  const extras = (roteiro.extras ?? []).map((x) => {
    const em = quadro(tempos, x.em);
    const padrao = x.tipo === "aviso" ? 90 : 80;
    // some sozinho quando a cena muda (a não ser que o roteiro diga até quando)
    const proxima = cenas.find((c) => c.de > em + 10)?.de ?? Infinity;
    const ate = x.ate ? quadro(tempos, x.ate) : Math.min(em + padrao, proxima + 4);
    return { x, em, ate };
  });
  const ativos = (tipo: string) => extras.filter((e) => e.x.tipo === tipo && f >= e.em && f < e.ate + 8);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {ativos("selo").map((e, k) => {
        const x = e.x as Extract<typeof e.x, { tipo: "selo" }>;
        const s = mola(f, e.em, { damping: 10, stiffness: 200 }) * (1 - entre(f, e.ate, e.ate + 8));
        const fundo = x.cor === "ok" ? C.ok : x.cor === "acento" ? C.acento : C.escuro;
        return (
          <div key={e.em} style={{ position: "absolute", right: 70, top: 430 + k * 150, transform: `scale(${s}) rotate(${k % 2 ? 2 : -3}deg)`, transformOrigin: "100% 50%", display: "flex", alignItems: "center", gap: 14, background: fundo, color: "#f3ece4", borderRadius: 999, padding: "22px 38px 22px 24px", fontFamily: F.sans, fontWeight: 800, fontSize: 50, boxShadow: "0 20px 40px -16px rgba(0,0,0,0.55)" }}>
            <span style={{ width: 62, height: 62, borderRadius: 99, background: x.cor === "ok" ? "#fff" : C.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={x.cor === "ok" ? C.ok : "#fff"} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            {x.texto}
          </div>
        );
      })}
      {ativos("aviso").map((e) => {
        const x = e.x as Extract<typeof e.x, { tipo: "aviso" }>;
        const a = aviso(x.aviso);
        const s = mola(f, e.em, { damping: 13 }) * (1 - entre(f, e.ate, e.ate + 8));
        return (
          <div key={e.em} style={{ position: "absolute", left: 126, top: 300, width: 360, transformOrigin: "0 0", transform: `scale(${2.3}) translateY(${(1 - s) * -60}px)`, opacity: s }}>
            <div style={{ borderRadius: 22, background: "rgba(250,248,245,0.97)", padding: "14px 16px", display: "flex", gap: 12, fontFamily: F.sans, boxShadow: "0 18px 40px -18px rgba(0,0,0,0.55)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.fundo, border: `1px solid ${C.divisoria}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Laco tamanho={28} cor={C.acento} espessura={3} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.texto2 }}>
                  <span style={{ fontWeight: 600, color: C.texto }}>Fio</span>
                  <span>agora</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.texto, marginTop: 2 }}>{a.titulo}</div>
                <div style={{ fontSize: 15, lineHeight: 1.3, color: C.texto, marginTop: 2 }}>{a.texto}</div>
              </div>
            </div>
          </div>
        );
      })}
      {ativos("zap").map((e, k) => {
        const x = e.x as Extract<typeof e.x, { tipo: "zap" }>;
        const s = mola(f, e.em, { damping: 12 }) * (1 - entre(f, e.ate, e.ate + 8));
        return (
          <div key={e.em} style={{ position: "absolute", left: 70, top: 300 + k * 190, maxWidth: 820, transform: `scale(${s}) rotate(${k % 2 ? 1.5 : -1.5}deg)`, transformOrigin: "0 0", background: "#fff", borderRadius: "8px 30px 30px 30px", padding: "20px 28px", boxShadow: "0 20px 40px -18px rgba(0,0,0,0.5)", fontFamily: F.sans }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#1f8a4c" }}>{x.de}</div>
            <div style={{ fontSize: 40, fontWeight: 600, color: C.texto, lineHeight: 1.2 }}>{x.texto}</div>
          </div>
        );
      })}
      {extras.map((e, i) => (
        <Sequence key={i} from={0} layout="none">
          <Som em={e.em} tipo={e.x.tipo === "aviso" ? "notificacao" : "pop"} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}

/** Volume da música: abaixa quando a voz fala (ataque rápido, volta devagar). */
function curvaDaMusica(tempos: Tempos, total: number) {
  const fala = new Float32Array(total);
  for (const p of tempos.palavras) for (let q = Math.floor((p.a - 0.05) * FPS); q <= Math.ceil((p.z + 0.15) * FPS); q++) if (q >= 0 && q < total) fala[q] = 1;
  const v = new Float32Array(total);
  let g = 1;
  for (let q = 0; q < total; q++) {
    const alvo = fala[q] ? 0.32 : 1;
    g = alvo < g ? Math.max(alvo, g - 0.25) : Math.min(alvo, g + 0.05);
    v[q] = g;
  }
  return v;
}

export function Motor({ roteiro, tempos, voz, musica }: PropsMotor) {
  const f = useCurrentFrame();
  const cenas = useMemo(() => linhaDasCenas(roteiro, tempos), [roteiro, tempos]);
  const blocos = useMemo(() => montarBlocos(tempos.palavras), [tempos]);
  const total = duracao(tempos);
  const curva = useMemo(() => curvaDaMusica(tempos, total), [tempos, total]);
  // sem legenda nas cenas de texto, na apresentação do Fio e no final: a frase já está grande na tela
  const semLegenda = cenas.some((c) => (c.cena.tipo === "texto" || c.cena.tipo === "apresentaFio" || c.cena.tipo === "final") && f >= c.de + 4 && f < c.ate - 4);
  // nas telas do app a legenda desce para baixo do celular, para não cobrir a tela
  const noApp = cenas.some((c) => c.cena.tipo === "app" && f >= c.de && f < c.ate);
  return (
    <AbsoluteFill style={{ background: "#0e0b09" }}>
      {cenas.map((c, i) => {
        const antes = cenas[i - 1]?.cena;
        const depois = cenas[i + 1]?.cena;
        const entrada = i === 0 ? null : (c.cena.entrada ?? entradaPadrao(c.cena, antes));
        const mergulhaDepois = !!depois && (depois.entrada ?? entradaPadrao(depois, c.cena)) === "mergulho";
        const dur = c.ate - c.de;
        return (
          <Sequence key={i} from={c.de} durationInFrames={dur}>
            <ProvedorCena value={{ tempos, inicio: c.de, dur }}>
              <Transicao entrada={entrada} mergulhaDepois={mergulhaDepois} dur={dur}>
                <Cena_ c={c.cena} dupla={c.cena.tipo === "final" ? (c.cena.dupla ?? !!roteiro.tipo) : false} />
              </Transicao>
              {entrada && entrada !== "corte" && <Som em={0} tipo={entrada === "mergulho" ? "whooshLongo" : "whoosh"} vol={entrada === "zoom" ? 0.6 : 1} />}
            </ProvedorCena>
          </Sequence>
        );
      })}
      <Extras roteiro={roteiro} tempos={tempos} />
      {!semLegenda && <LegendaDinamica f={f} blocos={blocos} chaves={roteiro.chaves ?? []} topo={noApp ? 1500 : 1330} />}
      {voz && <Audio src={staticFile(voz)} />}
      {musica && <Audio src={staticFile(musica)} volume={(q) => 0.7 * (curva[Math.min(curva.length - 1, Math.max(0, q))] ?? 1)} />}
    </AbsoluteFill>
  );
}
