import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { loadFont as carregarCaveat } from "@remotion/google-fonts/Caveat";
import { C, F, Laco, reais } from "./base";
import tempos from "./v13/tempos.json";

/**
 * 13 · O Juninho e a conta da comissão (feito sob medida, não usa o modelo genérico).
 * Tudo anda no tempo da narração: cada palavra tem um quadro (v13/tempos.json, de scripts/alinhar-legendas.py).
 * Noite (escuro, azulado, caos de números) → o Fio (claro: as comandas viram linhas, a comissão soma sozinha) → a noite livre.
 */

const { fontFamily: caveat } = carregarCaveat("normal", { weights: ["600", "700"], subsets: ["latin"] });

const FPS = 30;
/** a narração começa meio segundo depois do vídeo */
export const ATRASO_NARRACAO = 0.5;
const q = (s: number) => Math.round((s + ATRASO_NARRACAO) * FPS);

type Palavra = { p: string; f: number; a: number; z: number };
const PALAVRAS = tempos.palavras as Palavra[];
const limpa = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
/** Quadro em que a palavra `texto` é dita na fala `fala` (1 = primeira); `vez` para a 2ª ocorrência. */
function w(fala: number, texto: string, vez = 1) {
  const achadas = PALAVRAS.filter((p) => p.f === fala - 1 && limpa(p.p) === limpa(texto));
  if (!achadas[vez - 1]) throw new Error(`palavra não achada: ${fala} ${texto}`);
  return q(achadas[vez - 1].a);
}

// cenas: quadro de início (a troca acontece um pouco antes da fala seguinte)
const S = {
  equipe: 0,
  cozinha: q(6.3),
  conta: q(10.5),
  errou: q(19.15),
  fio: q(22.6),
  painel: q(25.0),
  entrou: q(33.85),
  noite: q(36.95),
  praia: q(40.75),
  fim: q(44.45),
};
export const DURACAO_13 = q(tempos.falas[9].z) + 66;

const CLARO = "#f3ece4";
const DESTAQUE = "#e0734f";
const VERDE = "#3d7a4c";

// ---------- ferramentas ----------

const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.6, 0, 0.2, 1);
const sai = Easing.bezier(0.2, 0.8, 0.2, 1);
const entre = (f: number, de: number, ate: number, saida: [number, number] = [0, 1], e = ease) => interpolate(f, [de, ate], saida, { ...lim, easing: e });
const mola = (f: number, inicio: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: f - inicio, fps: FPS, config: { damping: 14, stiffness: 160, mass: 0.8, ...cfg } });
/** número pseudoaleatório estável (mesmo valor em todo quadro) */
const sorte = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** tremida que decai depois de cada impacto */
function tremor(f: number, impactos: number[], forca = 18) {
  let x = 0;
  let y = 0;
  for (const i of impactos) {
    const t = f - i;
    if (t < 0 || t > 14) continue;
    const a = forca * Math.exp(-t / 4);
    x += Math.sin(t * 2.7 + i) * a;
    y += Math.cos(t * 3.1 + i) * a;
  }
  return { x, y };
}

/** Foto ocupando a tela, com zoom em torno de um ponto (o ponto fica parado na tela). */
function Foto({ src, foco, escala, x = 0, y = 0, filtro }: { src: string; foco: [number, number]; escala: number; x?: number; y?: number; filtro?: string }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
      <Img
        src={staticFile(`v13/${src}`)}
        style={{ position: "absolute", left: 0, top: -8, width: 1080, height: 1936, objectFit: "cover", transformOrigin: `${foco[0]}px ${foco[1] + 8}px`, transform: `translate(${x}px, ${y}px) scale(${escala})`, filter: filtro }}
      />
    </AbsoluteFill>
  );
}

function Vinheta({ forca = 0.6, cor = "0,0,0" }: { forca?: number; cor?: string }) {
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 40%, rgba(${cor},${forca}) 100%)`, pointerEvents: "none" }} />;
}

/** Comanda de papel escrita à mão. */
function Comanda({ linhas, largura = 250, estilo }: { linhas: string[]; largura?: number; estilo?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        width: largura,
        padding: "16px 20px 20px",
        background: "linear-gradient(180deg, #fffdf6, #f2ead8)",
        borderRadius: 4,
        boxShadow: "0 18px 30px -12px rgba(0,0,0,0.55)",
        fontFamily: caveat,
        fontWeight: 700,
        color: "#2a3a6a",
        fontSize: 40,
        lineHeight: 1.05,
        ...estilo,
      }}
    >
      <div style={{ height: 3, background: "repeating-linear-gradient(90deg, #c9bfa8 0 8px, transparent 8px 14px)", marginBottom: 10 }} />
      {linhas.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

const COMANDAS = [
  ["Léo", "Corte 35,00"],
  ["Caio", "Barba 25,00"],
  ["André", "C + B 55,00"],
  ["Léo", "Degradê 40,00"],
  ["Caio", "Corte 35,00"],
  ["André", "Corte 35,00"],
  ["Léo", "Pigment. 30,00"],
];

// ---------- 1 · o Juninho cresceu ----------

const CABECAS = { juninho: [547, 943], leo: [126, 900], caio: [360, 918], andre: [810, 943] } as const;

function Etiqueta({ nome, papel, x, y, inicio, f, lado = "cima" }: { nome: string; papel?: string; x: number; y: number; inicio: number; f: number; lado?: "cima" | "baixo" }) {
  const s = mola(f, inicio, { damping: 11, stiffness: 220 });
  const linha = entre(f, inicio - 4, inicio + 6);
  const dy = lado === "cima" ? -150 : 150;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={x} y1={y} x2={x} y2={y + dy * linha} stroke="#fff" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
        <circle cx={x} cy={y} r={9 * linha} fill={DESTAQUE} stroke="#fff" strokeWidth={3} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y + dy,
          transform: `translate(-50%, ${lado === "cima" ? "-100%" : "0"}) scale(${s})`,
          transformOrigin: lado === "cima" ? "50% 100%" : "50% 0%",
          background: "#fff",
          color: C.texto,
          borderRadius: 22,
          padding: "12px 26px",
          fontFamily: F.sans,
          textAlign: "center",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>{nome}</div>
        {papel && <div style={{ fontSize: 24, color: C.acentoForte, fontWeight: 600 }}>{papel}</div>}
      </div>
    </>
  );
}

function CenaEquipe({ f }: { f: number }) {
  const abre = entre(f, w(1, "cresceu") - 4, w(1, "cresceu") + 26, [0, 1], sai);
  const escala = interpolate(abre, [0, 1], [2.3 + f * 0.002, 1.04]);
  const ia = entre(f, 10, 22);
  return (
    <AbsoluteFill>
      <Foto src="imagem-01.jpg" foco={[547, 820]} escala={escala} />
      <Vinheta forca={0.35} />
      {f < w(1, "cresceu") + 4 && <Etiqueta nome="Juninho" papel="o dono" x={CABECAS.juninho[0] + 40} y={CABECAS.juninho[1] - 300} inicio={w(1, "Juninho")} f={f} />}
      {f >= w(1, "cresceu") + 20 && (
        <>
          <Etiqueta nome="Léo" x={CABECAS.leo[0] + 40} y={CABECAS.leo[1] - 70} inicio={w(1, "Léo")} f={f} />
          <Etiqueta nome="Caio" x={CABECAS.caio[0]} y={CABECAS.caio[1] - 70} inicio={w(1, "Caio")} f={f} />
          <Etiqueta nome="André" x={CABECAS.andre[0] - 30} y={CABECAS.andre[1] - 70} inicio={w(1, "André")} f={f} />
        </>
      )}
      <div style={{ position: "absolute", left: 60, top: 150, fontFamily: F.sans, fontSize: 24, fontWeight: 600, color: "#fff", background: "rgba(20,16,13,0.55)", borderRadius: 999, padding: "8px 20px", opacity: ia }}>Personagem criado com IA</div>
    </AbsoluteFill>
  );
}

// ---------- 2 · a conta do fim do dia ----------

function CenaCozinha({ f }: { f: number }) {
  const t0 = w(2, "cresceu") - S.cozinha;
  return (
    <AbsoluteFill>
      <Foto src="imagem-02.jpg" foco={[640, 920]} escala={1.02 + f * 0.0011} filtro="saturate(0.75) brightness(0.92)" />
      <AbsoluteFill style={{ background: "rgba(18,28,64,0.32)", mixBlendMode: "multiply" }} />
      <Vinheta forca={0.7} cor="6,8,20" />
      {COMANDAS.map((c, i) => {
        const inicio = t0 + i * 7;
        const t = Math.max(0, f - inicio);
        if (f < inicio) return null;
        const xi = 120 + sorte(i) * 700;
        const repouso = 1180 + sorte(i + 9) * 420;
        const y = Math.min(repouso, -300 + 60 * t + 2.6 * t * t);
        const pousou = y >= repouso;
        const giro = (sorte(i + 3) - 0.5) * 70 + (pousou ? 0 : Math.sin(t / 3) * 20);
        return <Comanda key={i} linhas={c} estilo={{ left: xi, top: y, transform: `rotate(${giro}deg)` }} />;
      })}
    </AbsoluteFill>
  );
}

// ---------- 3 · meia-noite: o caos da calculadora ----------

const RABISCOS = ["35,00", "× 40%", "= ?", "25,00", "+", "R$ ?", "÷ 3", "55,00", "50%?", "−", "14,00", "40,00", "= ??", "45%"];

function CenaConta({ f }: { f: number }) {
  const meia = w(3, "Meia-noite") - S.conta;
  const caderno = w(3, "Caderno") - S.conta;
  const chips = [
    { texto: "Quanto entrou hoje?", quadro: w(3, "Quanto", 1) - S.conta, x: 540, y: 560, giro: -3, tam: 58 },
    { texto: "Léo?", quadro: w(3, "Léo") - S.conta, x: 250, y: 760, giro: -8, tam: 84 },
    { texto: "Caio?", quadro: w(3, "Caio") - S.conta, x: 800, y: 820, giro: 7, tam: 84 },
    { texto: "André?", quadro: w(3, "André") - S.conta, x: 520, y: 1010, giro: -4, tam: 96 },
  ];
  const t = tremor(f, chips.map((c) => c.quadro));
  const caos = entre(f, caderno, chips[3].quadro + 10, [0, 1], (x) => x);
  const escuro = entre(f, 0, 240, [0.45, 0.85], (x) => x);
  return (
    <AbsoluteFill style={{ transform: `translate(${t.x}px, ${t.y}px)` }}>
      <Foto src="imagem-03.jpg" foco={[540, 900]} escala={1.08 + f * 0.0016 + caos * 0.05} filtro="saturate(0.7)" />
      <AbsoluteFill style={{ background: "rgba(18,28,64,0.38)", mixBlendMode: "multiply" }} />
      <Vinheta forca={escuro} cor="6,8,20" />

      {/* relógio da meia-noite */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 190,
          textAlign: "center",
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 190,
          letterSpacing: "0.04em",
          color: "#ff5a48",
          textShadow: "0 0 30px rgba(255,70,50,0.8), 0 0 80px rgba(255,70,50,0.45)",
          fontVariantNumeric: "tabular-nums",
          opacity: f < meia ? 0 : (f - meia) % 10 < 2 && f < meia + 12 ? 0.2 : 1,
          transform: `scale(${0.8 + mola(f, meia, { damping: 10 }) * 0.2 - entre(f, chips[0].quadro - 6, chips[0].quadro + 6, [0, 0.45])})`,
          transformOrigin: "50% 0%",
        }}
      >
        00<span style={{ opacity: Math.floor(f / 15) % 2 ? 1 : 0.25 }}>:</span>00
      </div>

      {/* números rodando em volta da cabeça, cada vez mais rápido */}
      {RABISCOS.map((r, i) => {
        const aparece = caderno + i * 8;
        if (f < aparece) return null;
        const s = mola(f, aparece, { damping: 12 });
        const ang = (i / RABISCOS.length) * Math.PI * 2 + (f - caderno) * (0.012 + caos * 0.05);
        const raio = 330 + sorte(i) * 120 + Math.sin(f / 9 + i) * 20;
        return (
          <div
            key={r + i}
            style={{
              position: "absolute",
              left: 540 + Math.cos(ang) * raio * 1.05,
              top: 900 + Math.sin(ang) * raio * 0.9,
              transform: `translate(-50%, -50%) rotate(${(sorte(i + 4) - 0.5) * 40}deg) scale(${s})`,
              fontFamily: caveat,
              fontWeight: 700,
              fontSize: 64 + sorte(i + 2) * 30,
              color: i % 3 ? "#fff" : "#ffd36e",
              textShadow: "0 4px 18px rgba(0,0,0,0.7)",
              opacity: 0.9,
            }}
          >
            {r}
          </div>
        );
      })}

      {chips.map((c) => {
        if (f < c.quadro - 2) return null;
        const s = mola(f, c.quadro - 2, { damping: 9, stiffness: 260 });
        return (
          <div
            key={c.texto}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              transform: `translate(-50%, -50%) rotate(${c.giro}deg) scale(${2.4 - s * 1.4})`,
              opacity: Math.min(1, s * 2),
              background: C.acento,
              color: "#fff",
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: c.tam,
              letterSpacing: "-0.02em",
              padding: "14px 34px",
              borderRadius: 26,
              boxShadow: "0 30px 60px -16px rgba(0,0,0,0.7)",
              whiteSpace: "nowrap",
            }}
          >
            {c.texto}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---------- 4 · errou: carimbo e rebobina ----------

function CenaErrou({ f }: { f: number }) {
  const queda = mola(f, 0, { damping: 12, stiffness: 120 });
  const errou = w(4, "Errou") - S.errou;
  const novo = w(4, "começou") - S.errou;
  const t = tremor(f, [8, errou + 2], 22);
  const glitch = f >= errou && f < errou + 10;
  const rebobina = f >= novo && f < novo + 30;
  const flash = rebobina ? [ "imagem-03.jpg", "imagem-02.jpg", "imagem-03.jpg", "imagem-02.jpg", "imagem-01.jpg" ][Math.floor((f - novo) / 6)] : null;
  const carimbo = mola(f, errou + 2, { damping: 10, stiffness: 260 });
  return (
    <AbsoluteFill style={{ transform: `translate(${t.x}px, ${t.y + (1 - queda) * -1920}px)` }}>
      {flash ? (
        <Foto src={flash} foco={[540, 900]} escala={1.15} x={Math.sin(f * 7) * 30} filtro="grayscale(0.6) contrast(1.3) blur(1.5px)" />
      ) : (
        <Foto src="imagem-04.jpg" foco={[380, 1280]} escala={1.05 + f * 0.0012} filtro={f > novo + 30 ? "grayscale(1) brightness(0.8)" : "saturate(0.8)"} />
      )}
      <AbsoluteFill style={{ background: "rgba(18,28,64,0.3)", mixBlendMode: "multiply" }} />
      {glitch && (
        <>
          <AbsoluteFill style={{ background: "rgba(255,40,40,0.35)", mixBlendMode: "screen" }} />
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ position: "absolute", left: 0, right: 0, top: sorte(f * 4 + k) * 1800, height: 20 + sorte(k + f) * 80, background: "rgba(255,255,255,0.18)", transform: `translateX(${(sorte(k * 3 + f) - 0.5) * 200}px)` }} />
          ))}
        </>
      )}
      {f >= errou + 2 && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 520,
            transform: `translate(-50%, -50%) rotate(-10deg) scale(${2.6 - carimbo * 1.6})`,
            opacity: Math.min(1, carimbo * 2) * (rebobina ? 0 : 1),
            border: "10px solid #ff4b3a",
            color: "#ff4b3a",
            borderRadius: 24,
            padding: "10px 46px",
            fontFamily: F.sans,
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: "0.06em",
            background: "rgba(20,10,10,0.35)",
          }}
        >
          ERROU
        </div>
      )}
      {rebobina && (
        <>
          <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 3px, transparent 3px 7px)" }} />
          <div style={{ position: "absolute", left: 70, top: 170, display: "flex", alignItems: "center", gap: 18, fontFamily: F.sans, fontWeight: 800, fontSize: 52, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>
            <svg width={90} height={56} viewBox="0 0 90 56">
              <path d="M44 4 L4 28 L44 52 Z M86 4 L46 28 L86 52 Z" fill="#fff" />
            </svg>
            DO ZERO
          </div>
        </>
      )}
    </AbsoluteFill>
  );
}

// ---------- 5 · o Fio entra ----------

function CenaFio({ f, total }: { f: number; total: number }) {
  const fio = w(5, "Fio") - S.fio;
  const mergulho = entre(f, total - 16, total + 10, [0, 1], Easing.in(Easing.cubic));
  const escala = 1.0 + f * 0.004 + mergulho * 5;
  const selo = mola(f, fio - 2, { damping: 10, stiffness: 200 });
  const brilho = entre(f, fio - 2, fio + 14);
  return (
    <AbsoluteFill>
      <Foto src="imagem-05.jpg" foco={[740, 1340]} escala={escala} filtro={`blur(${mergulho * 12}px) brightness(${1 + mergulho * 0.6})`} />
      <AbsoluteFill style={{ background: "radial-gradient(900px 700px at 80% 20%, rgba(255,214,150,0.35), transparent 60%)", mixBlendMode: "screen" }} />
      {f >= fio - 2 && (
        <div style={{ position: "absolute", left: 740, top: 1090, transform: `translate(-50%, -100%) scale(${selo * (1 - mergulho)})`, transformOrigin: "50% 100%" }}>
          <svg width={600} height={400} viewBox="-300 -200 600 400" style={{ position: "absolute", left: -300 + 150, top: -110, opacity: 1 - brilho, transform: `scale(${0.6 + brilho})` }}>
            {Array.from({ length: 10 }, (_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return <line key={k} x1={Math.cos(a) * 120} y1={Math.sin(a) * 90} x2={Math.cos(a) * 200} y2={Math.sin(a) * 150} stroke="#fff3d0" strokeWidth={8} strokeLinecap="round" />;
            })}
          </svg>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.fundo, borderRadius: 30, padding: "18px 36px 18px 26px", boxShadow: "0 30px 60px -16px rgba(0,0,0,0.55)" }}>
            <Laco tamanho={90} progresso={entre(f, fio, fio + 18)} espessura={3} />
            <span style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 92, color: C.texto, lineHeight: 1 }}>Fio</span>
          </div>
        </div>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: entre(f, total - 4, total + 8) }} />
    </AbsoluteFill>
  );
}

/** Transição noite → Fio: o laço risca a tela inteira e clareia. */
function RiscoDoLaco({ f }: { f: number }) {
  const p = entre(f, 0, 22, [0, 1], sai);
  const some = entre(f, 22, 34);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 1 - some }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 55%, rgba(255,236,200,${0.85 * p}) 0%, transparent ${20 + p * 70}%)` }} />
      <div style={{ position: "absolute", left: -40, top: 520 }}>
        <Laco tamanho={1160} progresso={p} espessura={4.5} cor={DESTAQUE} />
      </div>
    </AbsoluteFill>
  );
}

// ---------- 6 · as comandas viram linhas; a comissão se soma ----------

const LINHAS = [
  { nome: "Léo", cor: "#8a5a3c", servico: "Corte", valor: 35, pct: 40 },
  { nome: "Caio", cor: "#4a6a5a", servico: "Barba", valor: 25, pct: 50 },
  { nome: "André", cor: "#5a4a6a", servico: "Corte + barba", valor: 55, pct: 45 },
  { nome: "Léo", cor: "#8a5a3c", servico: "Degradê", valor: 40, pct: 40 },
  { nome: "Caio", cor: "#4a6a5a", servico: "Corte", valor: 35, pct: 50 },
];
const MES = [
  { nome: "Léo", cor: "#8a5a3c", atend: 74, valor: 1712 },
  { nome: "Caio", cor: "#4a6a5a", atend: 61, valor: 1575 },
  { nome: "André", cor: "#5a4a6a", atend: 48, valor: 1188 },
];

function Avatar({ nome, cor, tam = 64 }: { nome: string; cor: string; tam?: number }) {
  return <div style={{ width: tam, height: tam, borderRadius: 99, background: cor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontWeight: 600, fontSize: tam * 0.45, flexShrink: 0 }}>{nome[0]}</div>;
}

function CenaPainel({ f }: { f: number }) {
  const g = (fala: number, p: string, vez = 1) => w(fala, p, vez) - S.painel;
  const chegaCartao = g(6, "atendimento");
  const comissao = g(6, "comissão");
  const somado = g(6, "No");
  const cadaUm = g(6, "cada", 3);
  const cartao = mola(f, chegaCartao - 6, { damping: 16 });
  const vira = entre(f, somado, somado + 18);
  const sobe = entre(f, cadaUm - 4, cadaUm + 14);
  return (
    <AbsoluteFill style={{ background: C.fundo }}>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.12), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(176,81,58,0.08), transparent 60%)" }} />

      {/* cartão do dia: as comandas caem nele e viram linhas */}
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 300,
          background: C.superficie,
          borderRadius: 40,
          padding: "36px 36px 20px",
          border: `1.5px solid ${C.divisoria}`,
          boxShadow: "0 60px 120px -50px rgba(42,32,24,0.5)",
          fontFamily: F.sans,
          opacity: cartao * (1 - vira),
          transform: `translateY(${(1 - cartao) * 300 - vira * 120}px) scale(${1 - vira * 0.15})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em" }}>Atendimentos de hoje</div>
          <div style={{ fontSize: 26, color: C.texto2, opacity: entre(f, comissao - 6, comissao + 4) }}>comissão</div>
        </div>
        <div style={{ marginTop: 18 }}>
          {LINHAS.map((l, i) => {
            const chega = chegaCartao + 4 + i * 9;
            const s = mola(f, chega, { damping: 13 });
            const c = mola(f, comissao + i * 5, { damping: 11, stiffness: 220 });
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 0", borderTop: i ? `1.5px solid ${C.divisoria}` : undefined, opacity: s, transform: `translateX(${(1 - s) * -60}px)` }}>
                <Avatar nome={l.nome} cor={l.cor} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 34, fontWeight: 700 }}>{l.nome}</div>
                  <div style={{ fontSize: 26, color: C.texto2 }}>
                    {l.servico} · {reais(l.valor)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 24, fontWeight: 700, color: C.ok, background: C.okSuave, borderRadius: 99, padding: "6px 14px", transform: `scale(${s})` }}>✓ feito</div>
                <div style={{ width: 190, textAlign: "right", transform: `scale(${c})`, transformOrigin: "100% 50%" }}>
                  <div style={{ fontSize: 22, color: C.texto2 }}>{l.pct}%</div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: C.acento, fontVariantNumeric: "tabular-nums" }}>{reais((l.valor * l.pct) / 100)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* as comandas de papel voando até o cartão */}
      {COMANDAS.slice(0, 5).map((c, i) => {
        const chega = chegaCartao + 4 + i * 9;
        const p = entre(f, chega - 16, chega, [0, 1], Easing.in(Easing.quad));
        if (f > chega + 2) return null;
        const de = [[-300, 300], [1200, 500], [-320, 900], [1250, 1100], [500, 2100]][i];
        const ate = [540, 470 + i * 112];
        return <Comanda key={i} linhas={c} largura={220} estilo={{ left: interpolate(p, [0, 1], [de[0], ate[0] - 110]), top: interpolate(p, [0, 1], [de[1], ate[1] - 60]), transform: `rotate(${(1 - p) * (i % 2 ? 50 : -50)}deg) scale(${1 - p * 0.5})`, opacity: 1 - entre(f, chega - 3, chega + 2) }} />;
      })}

      {/* o mês somado */}
      {f >= somado && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 300, fontFamily: F.sans, opacity: vira, transform: `translateY(${(1 - vira) * 120 - sobe * 150}px) scale(${1 - sobe * 0.12})`, transformOrigin: "50% 0%" }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.acentoForte }}>Outubro · comissão do mês</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 30 }}>
            {MES.map((m, i) => {
              const conta = entre(f, somado + 6 + i * 6, somado + 46 + i * 6, [0, 1], sai);
              return (
                <div key={m.nome}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <Avatar nome={m.nome} cor={m.cor} tam={78} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 40, fontWeight: 800 }}>{m.nome}</div>
                      <div style={{ fontSize: 26, color: C.texto2, fontVariantNumeric: "tabular-nums" }}>{Math.round(m.atend * conta)} atendimentos</div>
                    </div>
                    <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: "-0.02em", color: C.texto, fontVariantNumeric: "tabular-nums" }}>{reais(m.valor * conta)}</div>
                  </div>
                  <div style={{ marginTop: 14, height: 20, borderRadius: 99, background: C.divisoria, overflow: "hidden" }}>
                    <div style={{ width: `${(m.valor / 1712) * 100 * conta}%`, height: "100%", borderRadius: 99, background: C.acento }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 26, fontSize: 22, color: C.texto2 }}>Valores de exemplo</div>
        </div>
      )}

      {/* cada um vê a sua: três celulares abrem em leque */}
      {MES.map((m, i) => {
        const s = mola(f, cadaUm - 2 + i * 5, { damping: 13 });
        if (f < cadaUm - 4) return null;
        const giro = (i - 1) * 12;
        return (
          <div
            key={m.nome}
            style={{
              position: "absolute",
              left: 540 - 150 + (i - 1) * 300,
              top: 860,
              width: 300,
              height: 470,
              borderRadius: 46,
              background: "#16120f",
              padding: 10,
              transform: `translateY(${(1 - s) * 700 + Math.abs(i - 1) * 40}px) rotate(${giro * s}deg)`,
              boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: 38, background: C.fundo, padding: "46px 22px", fontFamily: F.sans, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Avatar nome={m.nome} cor={m.cor} tam={70} />
              <div style={{ fontSize: 22, color: C.texto2 }}>Minha comissão</div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>{m.nome}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: C.acento, fontVariantNumeric: "tabular-nums" }}>{reais(m.valor)}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// ---------- 7 · e quanto entrou? ----------

function Calculadora({ tam = 160, cor = C.texto }: { tam?: number; cor?: string }) {
  return (
    <svg width={tam} height={tam * 1.3} viewBox="0 0 100 130">
      <rect x={4} y={4} width={92} height={122} rx={14} fill="none" stroke={cor} strokeWidth={7} />
      <rect x={18} y={18} width={64} height={24} rx={4} fill={cor} opacity={0.85} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 23} y={54 + r * 22} width={16} height={14} rx={3} fill={cor} />))}
    </svg>
  );
}

function CenaEntrou({ f, total }: { f: number; total: number }) {
  const g = (p: string) => w(7, p) - S.entrou;
  const conta = entre(f, g("entrou") - 4, g("entrou") + 34, [0, 1], sai);
  const risco = entre(f, g("sem") + 2, g("sem") + 12);
  const semanas = [2180, 2460, 2390, 3040];
  return (
    <AbsoluteFill style={{ background: C.fundo }}>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 900px at 15% 0%, rgba(61,122,76,0.12), transparent 60%)" }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 380, fontFamily: F.sans }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: VERDE, opacity: entre(f, 0, 10) }}>Entrou em outubro</div>
        <div style={{ fontFamily: F.serif, fontSize: 200, fontWeight: 700, letterSpacing: "-0.04em", color: C.texto, lineHeight: 1.05, fontVariantNumeric: "tabular-nums", transform: `scale(${0.9 + mola(f, 2) * 0.1})`, transformOrigin: "0 50%" }}>{reais(10070 * conta, 0)}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26, height: 360, marginTop: 40 }}>
          {semanas.map((v, i) => {
            const h = entre(f, 8 + i * 5, 34 + i * 5, [0, 1], sai);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: "100%", height: (v / 3040) * 300 * h, borderRadius: 18, background: i === 3 ? VERDE : "#b9d3bf" }} />
                <div style={{ fontSize: 24, color: C.texto2 }}>Sem {i + 1}</div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 22, color: C.texto2, marginTop: 18 }}>Valores de exemplo</div>
      </div>
      {/* sem fazer conta: a calculadora é riscada */}
      {f >= g("sem") - 4 && (
        <div style={{ position: "absolute", right: 100, top: 230, transform: `scale(${mola(f, g("sem") - 4, { damping: 10 })}) rotate(8deg)` }}>
          <Calculadora tam={150} cor={C.texto2} />
          <svg width={220} height={220} style={{ position: "absolute", left: -35, top: -10 }}>
            <line x1={10} y1={10} x2={10 + 200 * risco} y2={10 + 200 * risco} stroke="#d0392b" strokeWidth={16} strokeLinecap="round" />
          </svg>
        </div>
      )}
      <AbsoluteFill style={{ background: "#000", opacity: entre(f, total - 2, total + 10, [0, 0.4]) }} />
    </AbsoluteFill>
  );
}

// ---------- 8 · fecha a barbearia; a noite é dele ----------

function Porta({ fechada }: { fechada: number }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1920 * fechada, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1920, background: "repeating-linear-gradient(180deg, #8f969c 0 46px, #6f767c 46px 52px, #a7adb2 52px 60px)", boxShadow: "inset 0 -30px 40px rgba(0,0,0,0.35)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "linear-gradient(180deg, #5c6166, #3f4347)" }} />
      <div style={{ position: "absolute", left: 500, bottom: 8, width: 80, height: 18, borderRadius: 9, background: "#2c2f32" }} />
    </div>
  );
}

function CenaNoite({ f }: { f: number }) {
  const fecha = w(8, "fecha") - S.noite;
  const abre = w(8, "e") - S.noite;
  const fechada = f < abre ? entre(f, -6, fecha + 6, [0, 1], Easing.out(Easing.bounce)) : entre(f, abre, abre + 24, [1, 0], Easing.in(Easing.cubic));
  const placa = mola(f, fecha + 4, { damping: 6, stiffness: 120 });
  return (
    <AbsoluteFill>
      {/* até a porta fechar, aparece a cena anterior por baixo; o jantar só existe atrás da porta */}
      {f >= fecha + 6 && (
        <>
          <Foto src="imagem-06.jpg" foco={[900, 1160]} escala={1.12 + f * 0.0009} />
          <AbsoluteFill style={{ background: "radial-gradient(800px 700px at 45% 40%, rgba(255,190,110,0.32), transparent 65%)", mixBlendMode: "screen" }} />
        </>
      )}
      <Porta fechada={fechada} />
      {f >= fecha + 4 && fechada > 0.4 && (
        <div style={{ position: "absolute", left: 540, top: 1920 * fechada - 560, transform: `translateX(-50%) rotate(${Math.sin((f - fecha) / 5) * 10 * (1 - placa) + 2}deg)`, transformOrigin: "50% -60px" }}>
          <svg width={300} height={70} style={{ position: "absolute", left: 0, top: -64 }}>
            <line x1={150} y1={4} x2={40} y2={66} stroke="#3a3a3a" strokeWidth={4} />
            <line x1={150} y1={4} x2={260} y2={66} stroke="#3a3a3a" strokeWidth={4} />
          </svg>
          <div style={{ width: 300, padding: "26px 0", background: C.fundo, borderRadius: 14, border: `5px solid ${C.acento}`, textAlign: "center", fontFamily: F.serif, fontWeight: 700, fontSize: 64, color: C.acentoForte, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)" }}>Fechado</div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---------- 9 · a calculadora se aposentou ----------

function CenaPraia({ f }: { f: number }) {
  const apos = w(9, "aposentou") - S.praia;
  const praia = w(9, "praia") - S.praia;
  const voo = entre(f, 0, 16, [0, 1], Easing.in(Easing.quad));
  const entra = entre(f, 10, 22, [0, 1], sai);
  const carimbo = mola(f, apos, { damping: 9, stiffness: 260 });
  const t = tremor(f, [apos + 2], 16);
  const sol = entre(f, praia - 6, praia + 20);
  return (
    <AbsoluteFill style={{ transform: `translate(${t.x}px, ${t.y}px)` }}>
      <AbsoluteFill style={{ transform: `translateX(${(1 - entra) * 1100}px)`, filter: `blur(${(1 - entra) * 14}px)` }}>
        <Foto src="imagem-07.jpg" foco={[520, 1160]} escala={interpolate(f, [10, 100], [1.45, 1.05], { ...lim, easing: sai })} />
        <AbsoluteFill style={{ background: `radial-gradient(700px 520px at 50% 6%, rgba(255,226,160,${0.25 + sol * 0.45}), transparent 70%)`, mixBlendMode: "screen" }} />
      </AbsoluteFill>
      {/* a calculadora sai voando do jantar */}
      {f < 20 && (
        <div style={{ position: "absolute", left: interpolate(voo, [0, 1], [700, 1300]), top: interpolate(voo, [0, 1], [1300, 500]), transform: `rotate(${voo * 540}deg) scale(${1 + voo * 0.4})` }}>
          <Calculadora tam={170} cor="#fff" />
        </div>
      )}
      {f >= apos && (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 520,
            transform: `translate(-50%, -50%) rotate(-8deg) scale(${2.4 - carimbo * 1.4})`,
            opacity: Math.min(1, carimbo * 2),
            border: `9px solid ${C.acento}`,
            color: C.acento,
            borderRadius: 22,
            padding: "8px 40px",
            fontFamily: F.sans,
            fontWeight: 900,
            fontSize: 110,
            letterSpacing: "0.05em",
            background: "rgba(255,248,236,0.75)",
          }}
        >
          APOSENTADA
        </div>
      )}
    </AbsoluteFill>
  );
}

// ---------- 10 · fim ----------

function CenaFim({ f }: { f: number }) {
  const g = (p: string, vez = 1) => w(10, p, vez) - S.fim;
  const ceu = entre(f, 0, 20, [0, 1], ease);
  const laco = entre(f, 4, 34, [0, 1], sai);
  const nome = mola(f, g("Fio") + 2);
  const frase = ["Equipe", "organizada.", "Conta", "sem", "discussão."];
  const quadrosFrase = [g("Equipe"), g("organizada"), g("conta"), g("sem"), g("discussão")];
  const chamada = mola(f, g("Conheça"));
  const botao = mola(f, g("agenda") - 4, { damping: 11 });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateY(${ceu * 900}px)`, filter: `blur(${ceu * 10}px)`, opacity: 1 - ceu }}>
        <Foto src="imagem-07.jpg" foco={[520, 1160]} escala={1.05} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.escuro, opacity: ceu }} />
      <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 80% 10%, rgba(176,81,58,0.3), transparent 60%)", opacity: ceu }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34, paddingBottom: 120 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 30 }}>
          <Laco tamanho={200} progresso={laco} espessura={2.6} cor="#d9764f" />
          <span style={{ fontFamily: F.serif, fontSize: 200, fontWeight: 600, lineHeight: 0.9, letterSpacing: "-0.03em", color: C.fundo, opacity: nome, transform: `translateY(${(1 - nome) * 40}px)` }}>Fio</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 18, width: 900, fontFamily: F.serif, fontStyle: "italic", fontSize: 64, color: "#e9dfd4", lineHeight: 1.2 }}>
          {frase.map((p, i) => {
            const s = mola(f, quadrosFrase[i] - 2, { damping: 16 });
            return (
              <span key={i} style={{ display: "inline-block", opacity: s, transform: `translateY(${(1 - s) * 30}px)`, color: i === 4 ? "#f2a07e" : undefined }}>
                {p}
              </span>
            );
          })}
        </div>
        <div style={{ height: 20 }} />
        <div style={{ fontFamily: F.sans, fontSize: 40, color: "#d8cabd", opacity: chamada, transform: `translateY(${(1 - chamada) * 20}px)` }}>Conheça o plano Equipe</div>
        <div style={{ fontFamily: F.sans, fontSize: 50, fontWeight: 700, color: "#fff", background: C.acento, borderRadius: 999, padding: "30px 70px", transform: `scale(${0.6 + botao * 0.4})`, opacity: botao, boxShadow: "0 30px 60px -20px rgba(176,81,58,0.7)" }}>agendafio.com.br</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ---------- legendas (palavra por palavra, no tempo da voz) ----------

type Bloco = { palavras: Palavra[]; de: number; ate: number };
const BLOCOS: Bloco[] = (() => {
  const blocos: Palavra[][] = [];
  let atual: Palavra[] = [];
  PALAVRAS.forEach((p, i) => {
    atual.push(p);
    const prox = PALAVRAS[i + 1];
    if (!prox || prox.f !== p.f || /[.?!:…]$/.test(p.p) || (atual.length >= 4 && /,$/.test(p.p)) || atual.length >= 5) {
      blocos.push(atual);
      atual = [];
    }
  });
  return blocos.map((ps, i) => ({ palavras: ps, de: q(ps[0].a) - 3, ate: blocos[i + 1] ? q(blocos[i + 1][0].a) - 3 : q(ps[ps.length - 1].z) + 20 }));
})();

function Legendas({ f, claro }: { f: number; claro: boolean }) {
  const b = BLOCOS.find((x) => f >= x.de && f < x.ate);
  if (!b) return null;
  const s = mola(f, b.de, { damping: 15, stiffness: 240 });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 1380, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 14, rowGap: 6, transform: `scale(${0.85 + s * 0.15})`, opacity: s }}>
      {b.palavras.map((p, i) => {
        const ativa = f >= q(p.a) - 2 && f < q(p.z) + 4;
        const dita = f >= q(p.a) - 2;
        return (
          <span
            key={i}
            style={{
              fontFamily: F.sans,
              fontWeight: 800,
              fontSize: 66,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              padding: "2px 14px",
              borderRadius: 16,
              color: ativa ? "#fff" : claro ? C.texto : "#fff",
              background: ativa ? C.acento : "transparent",
              opacity: dita ? 1 : 0.45,
              textShadow: claro || ativa ? undefined : "0 3px 0 rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.65)",
              transform: `scale(${ativa ? 1.06 : 1})`,
            }}
          >
            {p.p}
          </span>
        );
      })}
    </div>
  );
}

// ---------- montagem ----------

/** Cena dentro do seu intervalo, com entrada própria nos primeiros quadros. */
function Trecho({ de, ate, children }: { de: number; ate: number; children: (f: number, total: number) => React.ReactNode }) {
  const frame = useCurrentFrame();
  if (frame < de || frame >= ate) return null;
  return <>{children(frame - de, ate - de)}</>;
}

/** Entrada em "chicote": a cena nova passa rápido, borrada, e assenta. */
function Chicote({ f, dir, children }: { f: number; dir: "cima" | "esquerda"; children: React.ReactNode }) {
  const p = entre(f, 0, 10, [0, 1], sai);
  const d = (1 - p) * (dir === "cima" ? 1920 : 1080);
  return <AbsoluteFill style={{ transform: dir === "cima" ? `translateY(${d}px)` : `translateX(${d}px)`, filter: `blur(${(1 - p) * 18}px)` }}>{children}</AbsoluteFill>;
}

export function V13Comissao() {
  const frame = useCurrentFrame();
  const claro = frame >= S.painel && frame < S.noite;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Trecho de={S.equipe} ate={S.cozinha + 10}>{(f) => <CenaEquipe f={f} />}</Trecho>
      <Trecho de={S.cozinha} ate={S.conta}>{(f) => <Chicote f={f} dir="cima"><CenaCozinha f={f} /></Chicote>}</Trecho>
      <Trecho de={S.conta} ate={S.errou}>{(f) => <AbsoluteFill style={{ transform: `scale(${1 + (1 - entre(f, 0, 8, [0, 1], sai)) * 0.18})` }}><CenaConta f={f} /></AbsoluteFill>}</Trecho>
      <Trecho de={S.errou} ate={S.fio}>{(f) => <CenaErrou f={f} />}</Trecho>
      <Trecho de={S.fio} ate={S.painel + 8}>{(f, t) => <CenaFio f={f} total={t - 8} />}</Trecho>
      <Trecho de={S.fio - 6} ate={S.fio + 34}>{(f) => <RiscoDoLaco f={f} />}</Trecho>
      <Trecho de={S.painel} ate={S.entrou + 8}>{(f) => <AbsoluteFill style={{ opacity: entre(f, 0, 8) }}><CenaPainel f={f} /></AbsoluteFill>}</Trecho>
      <Trecho de={S.entrou} ate={S.noite + 40}>{(f, t) => <AbsoluteFill style={{ clipPath: `circle(${entre(f, 0, 14) * 150}% at 50% 40%)` }}><CenaEntrou f={f} total={t - 40} /></AbsoluteFill>}</Trecho>
      <Trecho de={S.noite} ate={S.praia + 22}>{(f) => <CenaNoite f={f} />}</Trecho>
      <Trecho de={S.praia} ate={S.fim + 20}>{(f) => <CenaPraia f={f} />}</Trecho>
      <Trecho de={S.fim} ate={DURACAO_13}>{(f) => <CenaFim f={f} />}</Trecho>
      {frame < S.fim && <Legendas f={frame} claro={claro} />}
    </AbsoluteFill>
  );
}
