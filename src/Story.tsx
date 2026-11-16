import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, F, Laco } from "./base";

/**
 * Story em imagem (1080×1920) para postar sozinho pela API: nada de figurinha, música ou link.
 * A interação é "responde aqui no direct" e o caminho é o perfil ou o link na bio.
 * Texto entre y≈260 e y≈1560 (o Instagram cobre o topo e a base).
 */

export type PropsStory =
  | { tipo: "gancho"; rotulo?: string; titulo: string; destaque?: string; rodape?: string; escuro?: boolean }
  | { tipo: "foto"; imagem: string; titulo: string; destaque?: string; rodape?: string; seloIA?: boolean; exemplo?: boolean; celular?: boolean; desfocar?: boolean }
  | { tipo: "dica"; rotulo: string; titulo: string; destaque?: string; itens?: string[]; rodape?: string }
  | { tipo: "pergunta"; titulo: string; destaque?: string; rodape?: string }
  | { tipo: "video"; imagem: string; titulo: string; rodape?: string };

const CLARO = "#f3ece4";
const QUENTE = "#e0734f";

/** Título com uma palavra (ou trecho) em destaque. */
function Titulo({ texto, destaque, cor, corDestaque, tamanho }: { texto: string; destaque?: string; cor: string; corDestaque: string; tamanho: number }) {
  const partes = destaque && texto.includes(destaque) ? texto.split(destaque) : [texto];
  return (
    <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: tamanho, lineHeight: 1.05, letterSpacing: "-0.02em", color: cor }}>
      {partes.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < partes.length - 1 && <span style={{ color: corDestaque, fontStyle: "italic" }}>{destaque}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Marca({ claro }: { claro: boolean }) {
  return (
    <div style={{ position: "absolute", left: 80, bottom: 380, display: "flex", alignItems: "center", gap: 14, fontFamily: F.serif, fontWeight: 600, fontSize: 44, color: claro ? C.texto : CLARO }}>
      <Laco tamanho={60} cor={claro ? C.acento : "#d9764f"} espessura={2.8} />
      Fio
    </div>
  );
}

function Rodape({ texto, claro }: { texto?: string; claro: boolean }) {
  if (!texto) return null;
  return <div style={{ position: "absolute", left: 80, right: 80, bottom: 470, fontFamily: F.sans, fontSize: 40, fontWeight: 600, color: claro ? C.texto2 : "#d8cabd", lineHeight: 1.3 }}>{texto}</div>;
}

function Fundo({ escuro }: { escuro: boolean }) {
  return (
    <AbsoluteFill
      style={{
        background: escuro
          ? `radial-gradient(1200px 900px at 80% 8%, rgba(176,81,58,0.45), transparent 60%), radial-gradient(900px 900px at 0% 100%, rgba(176,81,58,0.18), transparent 60%), ${C.escuro}`
          : `radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.14), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(176,81,58,0.08), transparent 60%), ${C.fundo}`,
      }}
    />
  );
}

export function Story(props: PropsStory) {
  if (props.tipo === "gancho") {
    const escuro = props.escuro ?? true;
    return (
      <AbsoluteFill>
        <Fundo escuro={escuro} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 300 }}>
          {props.rotulo && <div style={{ display: "inline-block", fontFamily: F.sans, fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: escuro ? C.escuro : "#fff", background: escuro ? "#e8b04a" : C.acento, borderRadius: 999, padding: "12px 30px", marginBottom: 50 }}>{props.rotulo}</div>}
          <Titulo texto={props.titulo} destaque={props.destaque} cor={escuro ? CLARO : C.texto} corDestaque={escuro ? QUENTE : C.acento} tamanho={props.titulo.length > 70 ? 104 : 124} />
        </div>
        <Rodape texto={props.rodape} claro={!escuro} />
        <Marca claro={!escuro} />
      </AbsoluteFill>
    );
  }

  if (props.tipo === "foto") {
    const imagem = (
      <Img src={staticFile(props.imagem)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: props.desfocar ? "blur(28px) brightness(0.8)" : undefined, transform: props.desfocar ? "scale(1.1)" : undefined }} />
    );
    if (props.celular) {
      return (
        <AbsoluteFill>
          <Fundo escuro />
          <div style={{ position: "absolute", left: 80, right: 80, top: 270 }}>
            <Titulo texto={props.titulo} destaque={props.destaque} cor={CLARO} corDestaque={QUENTE} tamanho={92} />
          </div>
          {props.rodape && <div style={{ position: "absolute", left: 80, right: 80, top: 520, fontFamily: F.sans, fontSize: 40, fontWeight: 600, color: "#d8cabd", lineHeight: 1.3 }}>{props.rodape}</div>}
          <div style={{ position: "absolute", left: 270, top: 660, width: 540, height: 880, borderRadius: 60, background: "#16120f", padding: 14, boxShadow: "0 60px 120px -30px rgba(0,0,0,0.7)", transform: "rotate(-3deg)" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 52, overflow: "hidden" }}>{imagem}</div>
          </div>
          {props.exemplo && <div style={{ position: "absolute", right: 150, top: 640, fontFamily: F.sans, fontSize: 28, fontWeight: 800, letterSpacing: "0.1em", color: C.escuro, background: "#e8b04a", borderRadius: 999, padding: "10px 24px", transform: "rotate(4deg)" }}>EXEMPLO</div>}
        </AbsoluteFill>
      );
    }
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        {imagem}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,16,13,0.85) 0%, rgba(20,16,13,0.3) 34%, transparent 50%, rgba(20,16,13,0.55) 78%, rgba(20,16,13,0.85) 100%)" }} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 270 }}>
          <Titulo texto={props.titulo} destaque={props.destaque} cor="#fff" corDestaque="#f2a07e" tamanho={104} />
        </div>
        {props.seloIA && <div style={{ position: "absolute", left: 80, bottom: 560, fontFamily: F.sans, fontSize: 28, fontWeight: 600, color: "#fff", background: "rgba(20,16,13,0.6)", borderRadius: 999, padding: "10px 24px" }}>Personagem criado com IA</div>}
        <Rodape texto={props.rodape} claro={false} />
        <Marca claro={false} />
      </AbsoluteFill>
    );
  }

  if (props.tipo === "dica") {
    return (
      <AbsoluteFill>
        <Fundo escuro={false} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 300 }}>
          <div style={{ fontFamily: F.sans, fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: C.acentoForte, marginBottom: 40 }}>{props.rotulo}</div>
          <Titulo texto={props.titulo} destaque={props.destaque} cor={C.texto} corDestaque={C.acento} tamanho={96} />
          {props.itens && (
            <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 26 }}>
              {props.itens.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, background: C.superficie, border: `2px solid ${C.divisoria}`, borderRadius: 30, padding: "26px 32px", fontFamily: F.sans, fontSize: 42, fontWeight: 600, color: C.texto, boxShadow: "0 20px 40px -24px rgba(42,32,24,0.35)" }}>
                  <span style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 99, background: C.acento, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>{i + 1}</span>
                  {it}
                </div>
              ))}
            </div>
          )}
        </div>
        <Rodape texto={props.rodape} claro />
        <Marca claro />
      </AbsoluteFill>
    );
  }

  // pergunta aberta: sem opções (pareceria enquete e é só imagem); a resposta vai pela caixa de mensagem do story
  if (props.tipo === "pergunta") {
    return (
      <AbsoluteFill>
        <Fundo escuro />
        <div style={{ position: "absolute", left: 80, right: 80, top: 300 }}>
          <div style={{ display: "inline-block", fontFamily: F.sans, fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", color: C.escuro, background: "#e8b04a", borderRadius: 999, padding: "12px 30px", marginBottom: 50 }}>COMENTA AQUI</div>
          <Titulo texto={props.titulo} destaque={props.destaque} cor={CLARO} corDestaque={QUENTE} tamanho={props.titulo.length > 60 ? 104 : 120} />
        </div>
        <Rodape texto={props.rodape ?? "Eu leio e respondo todo mundo."} claro={false} />
        <Marca claro={false} />
        <div style={{ position: "absolute", right: 80, bottom: 250, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: F.sans, fontSize: 34, fontWeight: 800, color: "#e8b04a", textAlign: "center", lineHeight: 1.15 }}>
          escreve na
          <br />
          caixinha aqui embaixo
          <svg width={70} height={110} viewBox="0 0 70 110">
            <path d="M35 4 L35 96 M10 72 L35 100 L60 72" stroke="#e8b04a" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      </AbsoluteFill>
    );
  }

  // vídeo novo no perfil
  return (
    <AbsoluteFill>
      <Fundo escuro />
      <div style={{ position: "absolute", left: 80, right: 80, top: 280 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontFamily: F.sans, fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", color: "#fff", background: C.acento, borderRadius: 999, padding: "12px 30px" }}>
          <span style={{ width: 16, height: 16, borderRadius: 99, background: "#fff" }} /> VÍDEO NOVO
        </div>
        <div style={{ marginTop: 34 }}>
          <Titulo texto={props.titulo} cor={CLARO} corDestaque={QUENTE} tamanho={84} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 290, top: 690, width: 500, height: 620, borderRadius: 40, overflow: "hidden", boxShadow: "0 60px 120px -30px rgba(0,0,0,0.75)", border: "6px solid rgba(243,236,228,0.9)", transform: "rotate(-2.5deg)" }}>
        <Img src={staticFile(props.imagem)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: 99, background: "rgba(20,16,13,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={54} height={60} viewBox="0 0 54 60">
            <path d="M8 4 L50 30 L8 56 Z" fill="#fff" />
          </svg>
        </div>
      </div>
      <Rodape texto={props.rodape ?? "Assiste no perfil 👆"} claro={false} />
      <Marca claro={false} />
    </AbsoluteFill>
  );
}
