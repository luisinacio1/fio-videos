import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as carregarInter } from "@remotion/google-fonts/Inter";
import { loadFont as carregarSerif } from "@remotion/google-fonts/SourceSerif4";

const fonteInter = carregarInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
const fonteSerif = carregarSerif("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const inter = fonteInter.fontFamily;
const serif = fonteSerif.fontFamily;

/**
 * Resolve quando as fontes do Google já estão em document.fonts. O loadFont só põe cada fonte lá depois de baixar,
 * então quem desenha texto em canvas (as placas 3D, o letreiro) espera por isto antes do document.fonts.load: sem isso,
 * o load resolvia na hora, sem achar a fonte, e o canvas saía com a letra substituta (mais fina, ou serifa de sistema).
 * Se uma fonte falhar, resolve do mesmo jeito: o próprio loadFont segura o render e acusa o erro.
 */
export const fontesCarregadas = (): Promise<void> =>
  Promise.all([fonteInter.waitUntilDone(), fonteSerif.waitUntilDone()]).then(
    () => undefined,
    () => undefined,
  );

/** Mesmas cores do app (src/app/globals.css). */
export const C = {
  fundo: "#faf8f5",
  lateral: "#f6f2ec",
  superficie: "#ffffff",
  texto: "#1f1b17",
  texto2: "#6f675e",
  divisoria: "#ece5dc",
  acento: "#b0513a",
  acentoForte: "#963f2c",
  acentoSuave: "#f8ebe6",
  ok: "#3d7a4c",
  okSuave: "#ebf3ec",
  aviso: "#b9791a",
  avisoSuave: "#fbf1de",
  whats: "#25d366",
  escuro: "#1a1511",
};

export const F = { sans: inter, serif };

export const FPS = 30;
export const DURACAO = 15 * FPS;

/** Mola padrão dos vídeos: entra rápido, assenta sem quicar demais. */
export function useMola(inicio: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - inicio, fps, config: { damping: 16, stiffness: 140, mass: 0.8, ...config } });
}

export const suave = Easing.bezier(0.6, 0, 0.2, 1);

export function faixa(frame: number, de: number, ate: number, saida: [number, number] = [0, 1], easing = suave) {
  return interpolate(frame, [de, ate], saida, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

/** O laço do Fio, desenhado como um traço contínuo. `progresso` vai de 0 a 1. */
export function Laco({ tamanho = 120, progresso = 1, cor = C.acento, espessura = 2.4 }: { tamanho?: number; progresso?: number; cor?: string; espessura?: number }) {
  return (
    <svg viewBox="0 0 48 40" width={tamanho} height={(tamanho * 40) / 48} fill="none" style={{ overflow: "visible" }}>
      <path
        d="M3 29c8 5 18.5 7 26-1.5 7-8 13-19.5 9.6-23.6-3.4-4.2-9.6 1.6-9.6 12.6 0 10.5 6.4 19.2 16 17"
        stroke={cor}
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progresso}
      />
    </svg>
  );
}

/** Fundo creme com um fio terracota que atravessa a tela devagar (o "fio" da marca). */
export function Fundo({ escuro = false }: { escuro?: boolean }) {
  const frame = useCurrentFrame();
  const desenho = faixa(frame, 0, 60);
  const deriva = Math.sin(frame / 40) * 18;
  return (
    <AbsoluteFill style={{ background: escuro ? C.escuro : C.fundo }}>
      <AbsoluteFill
        style={{
          background: escuro
            ? "radial-gradient(1200px 900px at 80% 10%, rgba(176,81,58,0.28), transparent 60%)"
            : "radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.10), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(176,81,58,0.07), transparent 60%)",
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <path
          d={`M -60 ${1500 + deriva} C 300 ${1300 - deriva}, 700 ${1800 + deriva}, 1140 ${1520 - deriva}`}
          stroke={C.acento}
          strokeOpacity={escuro ? 0.35 : 0.16}
          strokeWidth={3}
          fill="none"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - desenho}
        />
      </svg>
      <Grao />
    </AbsoluteFill>
  );
}

/** Ruído fino para tirar a cara de "vetor chapado". */
function Grao() {
  const frame = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "multiply" }}>
      <filter id="grao">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(frame / 2) % 8} />
      </filter>
      <rect width="100%" height="100%" filter="url(#grao)" />
    </svg>
  );
}

/** Texto que sobe palavra por palavra, com leve desfoque saindo. */
export function TextoCinetico({
  texto,
  inicio,
  tamanho = 96,
  cor = C.texto,
  fonte = F.serif,
  peso = 600,
  destaque = [],
  largura = 900,
  alinhamento = "left",
  atraso = 3,
  corDestaque = C.acento,
}: {
  texto: string;
  inicio: number;
  tamanho?: number;
  cor?: string;
  fonte?: string;
  peso?: number;
  destaque?: string[];
  largura?: number;
  alinhamento?: "left" | "center";
  atraso?: number;
  corDestaque?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palavras = texto.split(" ");
  return (
    <div
      style={{
        fontFamily: fonte,
        fontSize: tamanho,
        fontWeight: peso,
        lineHeight: 1.06,
        letterSpacing: "-0.02em",
        color: cor,
        width: largura,
        textAlign: alinhamento,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: alinhamento === "center" ? "center" : "flex-start",
        columnGap: tamanho * 0.26,
      }}
    >
      {palavras.map((p, i) => {
        const s = spring({ frame: frame - inicio - i * atraso, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
        const limpa = p.replace(/[.,!?:]/g, "");
        const ehDestaque = destaque.includes(limpa);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: tamanho * 0.12 }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - s) * 110}%) rotate(${(1 - s) * 6}deg)`,
                filter: `blur(${(1 - s) * 8}px)`,
                color: ehDestaque ? corDestaque : undefined,
                fontStyle: ehDestaque && fonte === F.serif ? "italic" : undefined,
              }}
            >
              {p}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Rótulo pequeno em caixa alta com o número da função. */
export function Etiqueta({ numero, texto, inicio = 0 }: { numero: string; texto: string; inicio?: number }) {
  const s = useMola(inicio);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        fontFamily: F.sans,
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.acentoForte,
        opacity: s,
        transform: `translateX(${(1 - s) * -40}px)`,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: 999,
          border: `2.5px solid ${C.acento}`,
          fontSize: 26,
          letterSpacing: 0,
        }}
      >
        {numero}
      </span>
      {texto}
    </div>
  );
}

/** Moldura de celular. O conteúdo usa a escala 1:1 de um celular de 390px de largura, ampliado. */
export function Celular({ children, escala = 2.1, sombra = true }: { children: React.ReactNode; escala?: number; sombra?: boolean }) {
  const L = 390;
  const A = 800;
  return (
    <div style={{ width: (L + 24) * escala, height: (A + 24) * escala, position: "relative" }}>
      <div
        style={{
          transform: `scale(${escala})`,
          transformOrigin: "top left",
          width: L + 24,
          height: A + 24,
          borderRadius: 56,
          background: "#16120f",
          padding: 12,
          boxShadow: sombra ? "0 60px 120px -40px rgba(42,32,24,0.55), 0 0 0 1.5px rgba(255,255,255,0.06) inset" : undefined,
        }}
      >
        <div style={{ width: L, height: A, borderRadius: 44, overflow: "hidden", background: C.fundo, position: "relative", fontFamily: F.sans, color: C.texto }}>
          {children}
          {/* ilha do celular */}
          <div style={{ position: "absolute", top: 11, left: "50%", width: 110, height: 30, marginLeft: -55, borderRadius: 999, background: "#16120f" }} />
        </div>
      </div>
    </div>
  );
}

/** Dedo virtual: aparece, toca (anel que expande) e some. */
export function Toque({ x, y, quadro, cor = C.texto, tamanho = 64 }: { x: number; y: number; quadro: number; cor?: string; tamanho?: number }) {
  const r = tamanho / 2;
  const frame = useCurrentFrame();
  const t = frame - quadro;
  if (t < -14 || t > 22) return null;
  const chegada = faixa(t, -14, 0);
  const anel = faixa(t, 0, 18, [0, 1], Easing.out(Easing.cubic));
  const aperto = t >= 0 && t < 5 ? 0.82 : 1;
  const saida = faixa(t, 12, 22, [1, 0]);
  return (
    <div style={{ position: "absolute", left: x, top: y, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: -r * 1.25 * (1 + anel),
          top: -r * 1.25 * (1 + anel),
          width: r * 2.5 * (1 + anel),
          height: r * 2.5 * (1 + anel),
          borderRadius: 999,
          border: `${Math.max(1.5, tamanho / 22)}px solid ${cor}`,
          opacity: t >= 0 ? (1 - anel) * 0.5 : 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -r,
          top: -r,
          width: tamanho,
          height: tamanho,
          borderRadius: 999,
          background: "rgba(31,27,23,0.28)",
          border: `${Math.max(1.5, tamanho / 22)}px solid rgba(255,255,255,0.9)`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          opacity: chegada * saida,
          transform: `scale(${aperto * (0.6 + chegada * 0.4)})`,
        }}
      />
    </div>
  );
}

/** Legenda grande na parte de baixo (pensada para quem assiste sem som). */
export function Legenda({ texto, de, ate, destaque = [], cor = C.texto, baixo = 150, corDestaque }: { texto: string; de: number; ate: number; destaque?: string[]; cor?: string; baixo?: number; corDestaque?: string }) {
  const frame = useCurrentFrame();
  if (frame < de - 2 || frame > ate + 12) return null;
  const saida = faixa(frame, ate, ate + 10, [1, 0]);
  return (
    <div style={{ position: "absolute", left: 90, right: 90, bottom: baixo, opacity: saida, transform: `translateY(${(1 - saida) * -20}px)` }}>
      <TextoCinetico texto={texto} inicio={de} tamanho={62} fonte={F.sans} peso={700} destaque={destaque} largura={900} atraso={2} cor={cor} corDestaque={corDestaque} />
    </div>
  );
}

/** Abertura: etiqueta da função + pergunta-gancho, que sai de cena ao fim. */
export function Gancho({ numero, rotulo, titulo, destaque, ate = 66 }: { numero: string; rotulo: string; titulo: string; destaque: string[]; ate?: number }) {
  const frame = useCurrentFrame();
  const saida = faixa(frame, ate, ate + 14);
  if (frame > ate + 16) return null;
  return (
    <AbsoluteFill style={{ padding: "0 90px", justifyContent: "center", opacity: 1 - saida, transform: `translateY(${saida * -120}px) scale(${1 - saida * 0.06})`, filter: `blur(${saida * 10}px)` }}>
      <Etiqueta numero={numero} texto={rotulo} inicio={2} />
      <div style={{ height: 44 }} />
      <TextoCinetico texto={titulo} inicio={8} tamanho={124} destaque={destaque} />
    </AbsoluteFill>
  );
}

/** Encerramento igual nos 5 vídeos: laço desenhando, nome, endereço e chamada. */
export function Encerramento({ inicio, frase, chamada = "Comece grátis, sem cartão" }: { inicio: number; frase: string; chamada?: string }) {
  const frame = useCurrentFrame();
  const t = frame - inicio;
  const nome = useMola(inicio + 18);
  const sub = useMola(inicio + 28);
  const botao = useMola(inicio + 36, { damping: 12 });
  if (t < 0) return null;
  const cortina = faixa(t, 0, 16);
  const laco = faixa(t, 6, 36);
  return (
    <AbsoluteFill style={{ clipPath: `circle(${cortina * 150}% at 50% 50%)` }}>
      <Fundo escuro />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 34 }}>
          <Laco tamanho={210} progresso={laco} espessura={2.6} cor="#d9764f" />
          <span
            style={{
              fontFamily: F.serif,
              fontSize: 210,
              fontWeight: 600,
              lineHeight: 0.9,
              letterSpacing: "-0.03em",
              color: C.fundo,
              opacity: nome,
              transform: `translateY(${(1 - nome) * 40}px)`,
            }}
          >
            Fio
          </span>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 58, color: "#e9dfd4", opacity: sub, transform: `translateY(${(1 - sub) * 30}px)`, textAlign: "center", width: 860, lineHeight: 1.2, fontStyle: "italic" }}>
          {frase}
        </div>
        <div style={{ height: 30 }} />
        <div
          style={{
            fontFamily: F.sans,
            fontSize: 46,
            fontWeight: 700,
            color: "#fff",
            background: C.acento,
            borderRadius: 999,
            padding: "30px 64px",
            transform: `scale(${0.7 + botao * 0.3})`,
            opacity: botao,
            boxShadow: "0 30px 60px -20px rgba(176,81,58,0.7)",
          }}
        >
          agendafio.com.br
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 36, color: "#bfb2a5", opacity: sub }}>{chamada}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Contador de dinheiro em reais (R$ 1.284,00). */
export function reais(valor: number, casas = 2) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Selo arredondado (Confirmado, Realizado...). */
export function Selo({ tom, children, tamanho = 11 }: { tom: "ok" | "acento" | "aviso"; children: React.ReactNode; tamanho?: number }) {
  const cores = { ok: [C.okSuave, C.ok], acento: [C.acentoSuave, C.acentoForte], aviso: [C.avisoSuave, C.aviso] }[tom];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, padding: "3px 9px", fontSize: tamanho, fontWeight: 600, background: cores[0], color: cores[1], whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function Check({ tamanho = 12, cor = "currentColor", progresso = 1 }: { tamanho?: number; cor?: string; progresso?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6.5" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progresso} />
    </svg>
  );
}
