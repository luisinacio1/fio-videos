import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Encerramento, F, Fundo, Legenda, TextoCinetico, faixa, useMola } from "./base";
import { DemoLink } from "./V1Link";
import { DemoComissao } from "./V4Equipe";
import { DemoFinanceiro } from "./V5Financeiro";
import { BalaoWhats, CelularLembretes, Notificacao } from "./V2Lembretes";

/**
 * Vídeo narrado montado a partir de um roteiro (semanas/<data>/roteiros/*.json).
 * scripts/semana.mjs calcula onde cada cena começa (pelo áudio da narração, ou por estimativa na prévia)
 * e passa tudo por props. Cada cena cobre a anterior com o próprio fundo.
 */

type Comum = { fala: string };
export type Cena = Comum &
  (
    | { tipo: "titulo"; texto: string; destaque?: string[]; rotulo?: string; escuro?: boolean }
    | { tipo: "imagem"; imagem: string; prompt: string; semPersonagem?: boolean; texto?: string; destaque?: string[]; movimento?: "aproxima" | "afasta" | "esquerda" | "direita"; seloIA?: boolean }
    | { tipo: "mensagem"; rotulo: string; texto: string; titulo?: string; estilo?: "whatsapp" | "cartaz" }
    | { tipo: "demo"; demo: "lembretes" | "link" | "comissao" | "financeiro" }
    | { tipo: "fim"; frase: string; chamada?: string }
  );

export type PropsNarrado = {
  cenas: Cena[];
  /** quadro em que cada cena começa */
  inicios: number[];
  duracao: number;
  /** trilha (música + efeitos + voz) em public/ */
  audio: string | null;
  /** caminho em public/ de cada imagem entregue (null = ainda não chegou; mostra um aviso no lugar) */
  imagens: Record<string, string | null>;
};

const CLARO = "#f3ece4";
const DESTAQUE_ESCURO = "#e0734f";
/** quadros em que a cena nova entra cobrindo a anterior */
const ENTRADA = 12;

/** A cena entra subindo por baixo, recortada, sobre a anterior. */
function Entrada({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const p = faixa(frame, 0, ENTRADA);
  return <AbsoluteFill style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}>{children}</AbsoluteFill>;
}

function Rotulo({ texto, cor }: { texto: string; cor: string }) {
  const s = useMola(4);
  return (
    <div style={{ fontFamily: F.sans, fontSize: 32, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: cor, opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
      {texto}
    </div>
  );
}

function CenaTitulo({ cena }: { cena: Extract<Cena, { tipo: "titulo" }> }) {
  const escuro = !!cena.escuro;
  return (
    <AbsoluteFill>
      <Fundo escuro={escuro} />
      <AbsoluteFill style={{ padding: "0 90px", justifyContent: "center", paddingBottom: 200 }}>
        {cena.rotulo && (
          <>
            <Rotulo texto={cena.rotulo} cor={escuro ? DESTAQUE_ESCURO : C.acentoForte} />
            <div style={{ height: 40 }} />
          </>
        )}
        <TextoCinetico
          texto={cena.texto}
          inicio={6}
          tamanho={cena.texto.length > 60 ? 96 : 116}
          cor={escuro ? CLARO : C.texto}
          destaque={cena.destaque ?? []}
          corDestaque={escuro ? DESTAQUE_ESCURO : C.acento}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function CenaImagem({ cena, src }: { cena: Extract<Cena, { tipo: "imagem" }>; src: string | null }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = Math.min(1, frame / Math.max(1, durationInFrames));
  const mov = cena.movimento ?? "aproxima";
  const escala = mov === "afasta" ? 1.14 - t * 0.12 : 1.02 + t * 0.12;
  const x = mov === "esquerda" ? 30 - t * 60 : mov === "direita" ? -30 + t * 60 : 0;
  const selo = useMola(16);
  return (
    <AbsoluteFill style={{ background: C.escuro, overflow: "hidden" }}>
      {src ? (
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${escala}) translateX(${x}px)` }} />
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: 110 }}>
          <div style={{ border: `4px dashed rgba(243,236,228,0.35)`, borderRadius: 40, padding: "60px 56px", fontFamily: F.sans, color: CLARO, textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "0.12em", color: DESTAQUE_ESCURO }}>IMAGEM {cena.imagem}</div>
            <div style={{ fontSize: 30, lineHeight: 1.4, marginTop: 24, opacity: 0.8 }}>{cena.prompt}</div>
          </div>
        </AbsoluteFill>
      )}
      {cena.texto && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,16,13,0.82) 0%, rgba(20,16,13,0.35) 30%, transparent 48%)" }} />
          <div style={{ position: "absolute", left: 90, top: 250 }}>
            <TextoCinetico texto={cena.texto} inicio={8} tamanho={100} cor="#fff" destaque={cena.destaque ?? []} corDestaque="#f2a07e" largura={900} />
          </div>
        </>
      )}
      {cena.seloIA && (
        <div
          style={{
            position: "absolute",
            left: 90,
            bottom: 300,
            fontFamily: F.sans,
            fontSize: 26,
            fontWeight: 600,
            color: "#fff",
            background: "rgba(20,16,13,0.6)",
            borderRadius: 999,
            padding: "10px 24px",
            opacity: selo,
          }}
        >
          Personagem criado com IA
        </div>
      )}
    </AbsoluteFill>
  );
}

/** Texto da mensagem com os [campos] destacados. */
function TextoComCampos({ texto, claro = false }: { texto: string; claro?: boolean }) {
  return (
    <>
      {texto.split(/(\[[^\]]+\])/).map((parte, i) =>
        parte.startsWith("[") ? (
          <span
            key={i}
            style={
              claro
                ? { background: C.acentoSuave, color: C.acentoForte, borderRadius: 8, padding: "0 6px" }
                : { background: "rgba(224,115,79,0.28)", color: "#ffd2c2", borderRadius: 8, padding: "0 6px" }
            }
          >
            {parte.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{parte}</span>
        ),
      )}
    </>
  );
}

function CenaMensagem({ cena }: { cena: Extract<Cena, { tipo: "mensagem" }> }) {
  const balao = useMola(14, { damping: 14 });
  const chip = useMola(30, { damping: 10 });
  const cartaz = cena.estilo === "cartaz";
  return (
    <AbsoluteFill>
      <Fundo />
      <div style={{ position: "absolute", left: 90, right: 90, top: 300 }}>
        <Rotulo texto={cena.rotulo} cor={C.acentoForte} />
        {cena.titulo && (
          <div style={{ marginTop: 24 }}>
            <TextoCinetico texto={cena.titulo} inicio={6} tamanho={84} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: cena.titulo ? 700 : 560, opacity: balao, transform: `translateY(${(1 - balao) * 120}px) scale(${0.9 + balao * 0.1})` }}>
        {cartaz ? (
          <div
            style={{
              background: C.superficie,
              borderRadius: 18,
              padding: "70px 64px",
              boxShadow: "0 50px 100px -40px rgba(42,32,24,0.5)",
              border: `1.5px solid ${C.divisoria}`,
              transform: "rotate(-1.2deg)",
              fontFamily: F.serif,
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.2,
              color: C.texto,
              letterSpacing: "-0.01em",
            }}
          >
            <TextoComCampos texto={cena.texto} claro />
          </div>
        ) : (
          <div style={{ background: "#0b141a", borderRadius: 40, padding: "34px 30px 38px", boxShadow: "0 50px 100px -30px rgba(0,0,0,0.55)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "#005c4b", color: "#e9edef", fontFamily: F.sans, fontSize: 42, lineHeight: 1.4, padding: "24px 28px 16px", borderRadius: "28px 8px 28px 28px", maxWidth: 820 }}>
                <TextoComCampos texto={cena.texto} />
                <div style={{ textAlign: "right", fontSize: 24, color: "#8fb7ad", marginTop: 8 }}>
                  18:02 <span style={{ color: "#53bdeb" }}>✓✓</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 40,
            top: -34,
            background: C.acento,
            color: "#fff",
            fontFamily: F.sans,
            fontWeight: 700,
            fontSize: 30,
            borderRadius: 999,
            padding: "12px 26px",
            transform: `rotate(-4deg) scale(${chip})`,
          }}
        >
          {cartaz ? "Imprima e cole" : "Copie e cole"}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/**
 * Demonstração do app: a mesma cena dos vídeos 01 (link) e 02 (lembretes), começando no quadro em que
 * o celular entra nelas, com as legendas para quem assiste sem som.
 */
function CenaDemo({ cena }: { cena: Extract<Cena, { tipo: "demo" }> }) {
  if (cena.demo === "lembretes") {
    const o = 62; // quadro do vídeo 02 em que esta cena começa
    return (
      <AbsoluteFill>
        <Fundo />
        <Sequence from={-o} layout="none">
          <CelularLembretes />
          <BalaoWhats />
          <Notificacao />
        </Sequence>
        <Legenda texto="Mensagem pronta, com nome e horário." de={118 - o} ate={204 - o} destaque={["pronta,"]} baixo={230} />
        <Legenda texto="Um toque por cliente." de={218 - o} ate={288 - o} destaque={["toque"]} baixo={230} />
        <Legenda texto="E 3h antes, o celular do cliente avisa." de={318 - o} ate={100000} destaque={["3h"]} cor="#fff" corDestaque={DESTAQUE_ESCURO} baixo={230} />
      </AbsoluteFill>
    );
  }
  if (cena.demo === "comissao") {
    const o = 196; // quadro do vídeo 04 em que esta cena começa
    return (
      <AbsoluteFill>
        <Fundo />
        <Sequence from={-o} layout="none">
          <DemoComissao />
        </Sequence>
        <Legenda texto="A comissão de cada um, já somada." de={222 - o} ate={290 - o} destaque={["comissão"]} baixo={230} />
        <Legenda texto="E cada barbeiro vê a dele." de={302 - o} ate={100000} destaque={["dele."]} baixo={230} />
      </AbsoluteFill>
    );
  }
  if (cena.demo === "financeiro") {
    const o = 56; // quadro do vídeo 05 em que esta cena começa
    return (
      <AbsoluteFill>
        <Fundo />
        <Sequence from={-o} layout="none">
          <DemoFinanceiro />
        </Sequence>
        <Legenda texto="O que entrou, sem fazer conta." de={86 - o} ate={162 - o} destaque={["entrou,"]} baixo={230} />
        <Legenda texto="A semana inteira num gráfico." de={174 - o} ate={100000} destaque={["gráfico."]} baixo={230} />
      </AbsoluteFill>
    );
  }
  const o = 66; // quadro do vídeo 01 em que esta cena começa
  return (
    <AbsoluteFill>
      <Fundo />
      <Sequence from={-o} layout="none">
        <DemoLink />
      </Sequence>
      <Legenda texto="O cliente escolhe o serviço e o horário livre." de={96 - o} ate={218 - o} destaque={["serviço", "horário"]} baixo={230} />
      <Legenda texto="Sem baixar aplicativo, sem criar conta." de={230 - o} ate={274 - o} destaque={["Sem"]} baixo={230} />
      <Legenda texto="Direto na sua agenda." de={314 - o} ate={100000} destaque={["agenda."]} baixo={230} />
    </AbsoluteFill>
  );
}

/** Quadros mínimos de cada demonstração (até o fim da animação dela). */
export const MINIMO_DEMO = { lembretes: 330 - 62, link: 350 - 66, comissao: 372 - 196, financeiro: 240 - 56 };

function CenaFim({ cena }: { cena: Extract<Cena, { tipo: "fim" }> }) {
  return <Encerramento inicio={0} frase={cena.frase} chamada={cena.chamada} />;
}

export function Narrado({ cenas, inicios, duracao, audio, imagens }: PropsNarrado) {
  return (
    <AbsoluteFill style={{ background: C.fundo }}>
      {cenas.map((cena, i) => {
        const de = inicios[i];
        const ate = i + 1 < cenas.length ? inicios[i + 1] + ENTRADA : duracao;
        return (
          <Sequence key={i} from={de} durationInFrames={ate - de}>
            {i === 0 || cena.tipo === "fim" ? (
              <Conteudo cena={cena} imagens={imagens} />
            ) : (
              <Entrada>
                <Conteudo cena={cena} imagens={imagens} />
              </Entrada>
            )}
          </Sequence>
        );
      })}
      {audio && <Audio src={staticFile(audio)} />}
    </AbsoluteFill>
  );
}

function Conteudo({ cena, imagens }: { cena: Cena; imagens: Record<string, string | null> }) {
  switch (cena.tipo) {
    case "titulo":
      return <CenaTitulo cena={cena} />;
    case "imagem":
      return <CenaImagem cena={cena} src={imagens[cena.imagem] ?? null} />;
    case "mensagem":
      return <CenaMensagem cena={cena} />;
    case "demo":
      return <CenaDemo cena={cena} />;
    case "fim":
      return <CenaFim cena={cena} />;
  }
}
