import React from "react";
import { AbsoluteFill, Easing, Sequence, useCurrentFrame } from "remotion";
import { C, Celular, Encerramento, F, Fundo, Laco, Legenda, TextoCinetico, faixa, reais, useMola } from "./base";
import { BalaoWhats, CelularLembretes, Notificacao } from "./V2Lembretes";

/**
 * 06 · Reels "O cliente não veio" (roteiro IHC, versão B: conta de exemplo, sem números do José).
 * Gancho escuro (cadeira vazia, "falta de respeito?"), virada (ele esqueceu), a conta de exemplo,
 * a lista de lembretes do Fio (cena do vídeo 02), o dado da Cochrane e o encerramento.
 */

export const DURACAO_06 = 1500; // 50 s

// quadros de início de cada cena
const T = {
  naoVeio: 75,
  pensa: 150,
  estoura: 240,
  conta: 350,
  vezes: 470,
  mes: 590,
  virada: 700,
  lista: 790,
  demo: 870,
  prova: 1230,
  fim: 1380,
};
/** A cena do vídeo 02 começa no quadro 66 dele; aqui ela começa em T.demo. */
const DEMO = T.demo - 66;

// Exemplo da conta (não é número medido: aparece com o selo "exemplo")
const FALTAS = 3;
const PRECO = 35;
const SEMANA = FALTAS * PRECO;
const MES = 450; // 105 × 52 ÷ 12 ≈ 455, arredondado para baixo
const ANO = SEMANA * 52;

// Revisão Cochrane CD007458 (Gurol-Urganci et al., 2013): 67,8% sem lembrete x 78,6% com SMS
const SEM_LEMBRETE = 68;
const COM_LEMBRETE = 79;

const CLARO = "#f3ece4";
const DESTAQUE_ESCURO = "#e0734f";

/** Título grande que entra palavra por palavra e sai subindo com desfoque. */
function Titulo({
  texto,
  de,
  ate,
  destaque = [],
  cor = CLARO,
  corDestaque = DESTAQUE_ESCURO,
  topo = 300,
  tamanho = 112,
  alinhamento = "left",
}: {
  texto: string;
  de: number;
  ate: number;
  destaque?: string[];
  cor?: string;
  corDestaque?: string;
  topo?: number;
  tamanho?: number;
  alinhamento?: "left" | "center";
}) {
  const frame = useCurrentFrame();
  if (frame < de - 1 || frame > ate + 14) return null;
  const s = faixa(frame, ate, ate + 12);
  return (
    <div style={{ position: "absolute", left: 90, top: topo, opacity: 1 - s, transform: `translateY(${-s * 60}px)`, filter: `blur(${s * 8}px)` }}>
      <TextoCinetico texto={texto} inicio={de} tamanho={tamanho} cor={cor} destaque={destaque} corDestaque={corDestaque} alinhamento={alinhamento} />
    </div>
  );
}

function Cadeira({ largura = 560 }: { largura?: number }) {
  const couro = "#7a3426";
  const couroLuz = "#9a4733";
  const metal = "#8d8279";
  return (
    <svg viewBox="0 0 300 360" width={largura} height={(largura * 360) / 300}>
      <ellipse cx={150} cy={334} rx={96} ry={16} fill="#000" opacity={0.35} />
      <ellipse cx={150} cy={326} rx={84} ry={14} fill={metal} />
      <rect x={140} y={236} width={20} height={88} rx={4} fill={metal} />
      <rect x={104} y={268} width={92} height={10} rx={5} fill={metal} />
      <rect x={128} y={12} width={44} height={30} rx={11} fill={couro} />
      <rect x={146} y={40} width={8} height={20} fill={metal} />
      <rect x={86} y={58} width={128} height={140} rx={26} fill={couro} />
      <rect x={98} y={70} width={104} height={116} rx={18} fill="none" stroke={couroLuz} strokeWidth={2} />
      <rect x={56} y={180} width={10} height={30} fill={metal} />
      <rect x={234} y={180} width={10} height={30} fill={metal} />
      <rect x={38} y={160} width={56} height={22} rx={11} fill={couro} />
      <rect x={206} y={160} width={56} height={22} rx={11} fill={couro} />
      <rect x={68} y={190} width={164} height={48} rx={18} fill={couroLuz} />
    </svg>
  );
}

/** Relógio de parede: 10h, o ponteiro dos segundos anda e, quando o cliente não vem, o tempo corre até 10h15. */
function Relogio() {
  const frame = useCurrentFrame();
  const segundos = Math.floor(frame / 15) * 6 * 2 + faixa(frame % 15, 0, 3) * 12;
  const minutos = faixa(frame, T.naoVeio + 20, T.pensa, [0, 90]);
  const horas = 300 + minutos / 12;
  const ponteiro = (angulo: number, comprimento: number, espessura: number, cor: string) => (
    <line x1={0} y1={0} x2={0} y2={-comprimento} stroke={cor} strokeWidth={espessura} strokeLinecap="round" transform={`rotate(${angulo})`} />
  );
  return (
    <svg viewBox="-120 -120 240 240" width={240} height={240}>
      <circle r={112} fill="#241d18" stroke="#4a3d33" strokeWidth={8} />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={-92} x2={0} y2={i % 3 ? -84 : -76} stroke="#8d8279" strokeWidth={i % 3 ? 3 : 6} transform={`rotate(${i * 30})`} />
      ))}
      {ponteiro(horas, 50, 9, CLARO)}
      {ponteiro(minutos, 78, 6, CLARO)}
      {ponteiro(segundos, 86, 2.5, DESTAQUE_ESCURO)}
      <circle r={7} fill={DESTAQUE_ESCURO} />
    </svg>
  );
}

/** Cartão da agenda das 10h que é riscado e recebe o carimbo "não veio". */
function CartaoAgenda() {
  const frame = useCurrentFrame();
  const entra = useMola(T.naoVeio + 4, { damping: 15 });
  const risco = faixa(frame, T.naoVeio + 30, T.naoVeio + 40);
  const carimbo = useMola(T.naoVeio + 42, { damping: 11, stiffness: 220 });
  const tremor = frame >= T.naoVeio + 42 && frame < T.naoVeio + 50 ? Math.sin(frame * 3) * 8 : 0;
  const recua = faixa(frame, T.pensa, T.pensa + 16);
  return (
    <div
      style={{
        position: "absolute",
        left: 160,
        top: 640,
        width: 760,
        opacity: entra * (1 - recua * 0.75),
        transform: `translateY(${(1 - entra) * 80 + recua * 40}px) translateX(${tremor}px) scale(${1 - recua * 0.08})`,
      }}
    >
      <div
        style={{
          background: risco > 0.5 ? "#e7e0d8" : C.superficie,
          borderRadius: 32,
          padding: "34px 40px",
          display: "flex",
          alignItems: "center",
          gap: 34,
          fontFamily: F.sans,
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)",
          borderLeft: `12px solid ${risco > 0.5 ? "#a39a91" : C.acento}`,
          filter: `grayscale(${risco})`,
          position: "relative",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, color: C.texto, fontVariantNumeric: "tabular-nums" }}>10:00</div>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.texto }}>Corte + barba</div>
          <div style={{ fontSize: 30, color: C.texto2 }}>Cliente fixo</div>
        </div>
        <svg width={760} height={20} style={{ position: "absolute", left: 0, top: "50%", marginTop: -10, overflow: "visible" }}>
          <line x1={20} y1={10} x2={20 + 720 * risco} y2={10} stroke="#c0392b" strokeWidth={8} strokeLinecap="round" />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          right: -20,
          top: -50,
          fontFamily: F.sans,
          fontWeight: 800,
          fontSize: 46,
          letterSpacing: "0.08em",
          color: "#e2483a",
          border: "6px solid #e2483a",
          borderRadius: 16,
          padding: "8px 26px",
          transform: `rotate(-9deg) scale(${frame < T.naoVeio + 42 ? 0 : 2.2 - carimbo * 1.2})`,
          opacity: frame < T.naoVeio + 42 ? 0 : Math.min(1, carimbo * 1.5),
          background: "rgba(26,21,17,0.85)",
        }}
      >
        NÃO VEIO
      </div>
    </div>
  );
}

/** Balão de pensamento vermelho que infla e depois estoura. */
function BalaoPensamento() {
  const frame = useCurrentFrame();
  const infla = useMola(T.pensa + 10, { damping: 9, stiffness: 120 });
  const bolinhas = [useMola(T.pensa + 4), useMola(T.pensa + 8)];
  const estoura = faixa(frame, T.estoura, T.estoura + 8, [0, 1], Easing.out(Easing.cubic));
  const respira = 1 + Math.sin((frame - T.pensa) / 6) * 0.015 + faixa(frame, T.pensa + 30, T.estoura, [0, 0.06]);
  const tremor = frame > T.estoura - 30 && frame < T.estoura ? Math.sin(frame * 2.7) * 5 : 0;
  const pedacos = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const d = 120 + estoura * (260 + (i % 3) * 80);
    return { x: Math.cos(a) * d * 1.4, y: Math.sin(a) * d, r: 14 + (i % 4) * 6 };
  });
  if (frame < T.pensa + 4 || frame > T.estoura + 26) return null;
  return (
    <div style={{ position: "absolute", left: 540, top: 1000, transform: `translateX(${tremor}px)` }}>
      {estoura === 0 && (
        <>
          {[
            [-260, 330, 26],
            [-200, 250, 40],
          ].map(([x, y, r], i) => (
            <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 999, background: "#c0392b", transform: `scale(${bolinhas[i]})` }} />
          ))}
          <div
            style={{
              position: "absolute",
              left: -400,
              top: -200,
              width: 800,
              height: 400,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 30%, #e2564a, #a82c22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${infla * respira})`,
              boxShadow: "0 50px 100px -30px rgba(192,57,43,0.6)",
            }}
          >
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 600, fontSize: 92, color: "#fff", textAlign: "center", lineHeight: 1.05, width: 600 }}>Falta de respeito.</div>
          </div>
        </>
      )}
      {estoura > 0 &&
        pedacos.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: p.x - p.r, top: p.y - p.r, width: p.r * 2, height: p.r * 2, borderRadius: 999, background: "#d9473a", opacity: 1 - estoura, transform: `scale(${1 - estoura * 0.5})` }} />
        ))}
    </div>
  );
}

const NOTIFICACOES = [
  { app: "Grupo da família", texto: "87 mensagens novas", cor: "#25d366", letra: "F" },
  { app: "Trabalho", texto: "Reunião passou para as 10h", cor: "#4f7cff", letra: "T" },
  { app: "Escola", texto: "Reunião de pais amanhã", cor: "#f0a020", letra: "E" },
  { app: "Banco", texto: "Sua fatura vence hoje", cor: "#9b5cf6", letra: "B" },
];

/** Tela bloqueada do cliente às 09:52: o dia cheio de avisos, nenhum da barbearia. */
function CelularCliente() {
  const frame = useCurrentFrame();
  const entra = useMola(T.estoura + 18, { damping: 16 });
  const sai = faixa(frame, T.conta, T.conta + 14);
  const avisos = NOTIFICACOES.map((_, i) => useMola(T.estoura + 34 + i * 9, { damping: 14 }));
  if (frame < T.estoura || frame > T.conta + 16) return null;
  return (
    <div style={{ position: "absolute", left: (1080 - 414 * 1.35) / 2, top: 760 + (1 - entra) * 1200 + sai * 300, opacity: 1 - sai }}>
      <Celular escala={1.35}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #23314a, #141a26)", color: "#fff", padding: "70px 16px 0" }}>
          <div style={{ textAlign: "center", fontSize: 15, opacity: 0.8 }}>sábado, 7 de novembro</div>
          <div style={{ textAlign: "center", fontSize: 76, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.1 }}>09:52</div>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
            {NOTIFICACOES.map((n, i) => {
              const s = avisos[i];
              return (
                <div key={n.app} style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.16)", borderRadius: 18, padding: "12px 12px", opacity: s, transform: `translateY(${(1 - s) * -40}px) scale(${0.9 + s * 0.1})` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: n.cor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{n.letra}</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{n.app}</div>
                    <div style={{ fontSize: 17, opacity: 0.85 }}>{n.texto}</div>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                border: "1.5px dashed rgba(255,255,255,0.45)",
                borderRadius: 18,
                padding: "12px",
                textAlign: "center",
                fontSize: 19,
                fontWeight: 700,
                color: "#ffb3a3",
                opacity: faixa(frame, T.estoura + 76, T.estoura + 86),
              }}
            >
              Da barbearia: nenhum aviso.
            </div>
          </div>
        </div>
      </Celular>
    </div>
  );
}

function SeloExemplo() {
  const frame = useCurrentFrame();
  const s = useMola(T.conta + 10);
  const sai = faixa(frame, T.virada - 10, T.virada);
  if (frame < T.conta || frame > T.virada) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 220,
        fontFamily: F.sans,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#1a1511",
        background: "#e8b04a",
        borderRadius: 999,
        padding: "10px 26px",
        opacity: s * (1 - sai),
        transform: `scale(${0.8 + s * 0.2})`,
        transformOrigin: "left center",
      }}
    >
      Exemplo · faça com os seus números
    </div>
  );
}

const DIAS = ["Ter 10:00", "Qui 15:30", "Sáb 11:00"];

/** As 3 faltas da semana, uma por vez. */
function Faltas() {
  const frame = useCurrentFrame();
  const sai = faixa(frame, T.vezes, T.vezes + 14);
  const rotulo = useMola(T.conta + 84);
  const cartoes = DIAS.map((_, i) => useMola(T.conta + 30 + i * 15, { damping: 12 }));
  if (frame < T.conta + 20 || frame > T.vezes + 16) return null;
  return (
    <div style={{ position: "absolute", left: 90, right: 90, top: 700, opacity: 1 - sai, transform: `translateY(${-sai * 80}px)` }}>
      <div style={{ display: "flex", gap: 30 }}>
        {DIAS.map((d, i) => {
          const s = cartoes[i];
          const risco = faixa(frame, T.conta + 40 + i * 15, T.conta + 48 + i * 15);
          return (
            <div key={d} style={{ flex: 1, background: "#2a221c", border: "2px solid #4a3d33", borderRadius: 28, padding: "36px 0", textAlign: "center", fontFamily: F.sans, transform: `scale(${s})`, position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 44, fontWeight: 700, color: CLARO }}>{d.split(" ")[0]}</div>
              <div style={{ fontSize: 38, color: "#a39a91", marginTop: 6 }}>{d.split(" ")[1]}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#e2483a", marginTop: 16, letterSpacing: "0.06em", opacity: risco }}>FALTOU</div>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                <line x1={12} y1={12} x2={12 + 76 * risco} y2={12 + 76 * risco} stroke="#e2483a" strokeWidth={2} opacity={0.5} />
              </svg>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 50, fontFamily: F.sans, fontSize: 54, fontWeight: 700, color: CLARO, opacity: rotulo, transform: `translateY(${(1 - rotulo) * 30}px)` }}>
        {FALTAS} faltas na semana.
      </div>
    </div>
  );
}

/** 3 × R$ 35 = R$ 105, depois o número do mês, grande. */
function Conta() {
  const frame = useCurrentFrame();
  const a = useMola(T.vezes + 6);
  const b = useMola(T.vezes + 22);
  const semana = Math.round(faixa(frame, T.vezes + 36, T.vezes + 66, [0, SEMANA], Easing.out(Easing.cubic)));
  const rotuloSemana = useMola(T.vezes + 66);
  const sobe = faixa(frame, T.mes, T.mes + 16);
  const mesEntra = useMola(T.mes + 10, { damping: 13 });
  const mes = Math.round(faixa(frame, T.mes + 10, T.mes + 46, [SEMANA, MES], Easing.out(Easing.cubic)));
  const impacto = frame >= T.mes + 46 && frame < T.mes + 54 ? Math.sin(frame * 3.1) * 10 : 0;
  const ano = useMola(T.mes + 62);
  if (frame < T.vezes || frame > T.virada + 2) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 720 - sobe * 300,
          fontFamily: F.sans,
          color: CLARO,
          transform: `scale(${1 - sobe * 0.35})`,
          transformOrigin: "left top",
          opacity: 1 - sobe * 0.45,
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: "-0.03em", opacity: a, transform: `translateY(${(1 - a) * 40}px)` }}>
          {FALTAS} × {reais(PRECO, 0)}
        </div>
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: "-0.03em", color: DESTAQUE_ESCURO, opacity: b, transform: `translateY(${(1 - b) * 40}px)`, fontVariantNumeric: "tabular-nums" }}>
          = {reais(semana, 0)}
        </div>
        <div style={{ fontSize: 50, color: "#a39a91", fontWeight: 600, opacity: rotuloSemana }}>por semana</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 860, opacity: mesEntra, transform: `translateY(${(1 - mesEntra) * 120}px) translateX(${impacto}px)` }}>
        <div style={{ fontFamily: F.sans, fontSize: 56, fontWeight: 600, color: "#a39a91" }}>No mês, uns</div>
        <div style={{ fontFamily: F.serif, fontSize: 270, fontWeight: 700, color: DESTAQUE_ESCURO, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{reais(mes, 0)}</div>
        <div style={{ fontFamily: F.sans, fontSize: 46, fontWeight: 600, color: CLARO, marginTop: 30, width: 860, lineHeight: 1.25 }}>em cortes que já estavam marcados.</div>
        <div style={{ fontFamily: F.sans, fontSize: 38, color: "#a39a91", marginTop: 26, opacity: ano }}>No ano: {reais(ANO, 0)}.</div>
      </div>
    </>
  );
}

/** Parte escura do vídeo (gancho, história e conta). */
function ParteEscura() {
  const frame = useCurrentFrame();
  const cenario = faixa(frame, T.pensa, T.pensa + 20);
  const someCenario = faixa(frame, T.estoura, T.estoura + 10);
  const zoom = 1 + faixa(frame, 0, T.pensa, [0, 0.06], (x) => x);
  const cadeira = useMola(2, { damping: 20 });
  const relogio = useMola(12);
  return (
    <AbsoluteFill>
      <Fundo escuro />
      <AbsoluteFill style={{ background: "radial-gradient(700px 900px at 40% 70%, rgba(255,214,170,0.10), transparent 70%)", opacity: 1 - someCenario }} />
      {frame < T.estoura + 12 && (
        <AbsoluteFill style={{ opacity: (1 - cenario * 0.75) * (1 - someCenario), transform: `scale(${zoom})`, transformOrigin: "40% 80%" }}>
          <div style={{ position: "absolute", left: 140, top: 940, opacity: cadeira, transform: `translateY(${(1 - cadeira) * 60}px)` }}>
            <Cadeira />
          </div>
          <div style={{ position: "absolute", left: 740, top: 900, opacity: relogio, transform: `scale(${0.8 + relogio * 0.2})` }}>
            <Relogio />
          </div>
        </AbsoluteFill>
      )}
      {frame < T.estoura + 12 && (
        <AbsoluteFill style={{ opacity: 1 - someCenario }}>
          <CartaoAgenda />
        </AbsoluteFill>
      )}

      <Titulo texto="Sábado, 10h." de={4} ate={T.naoVeio - 8} tamanho={150} />
      <Titulo texto="E o cliente… não veio." de={T.naoVeio} ate={T.pensa - 8} destaque={["veio"]} />
      <Titulo texto="Você pensa:" de={T.pensa + 2} ate={T.estoura - 4} tamanho={130} />
      <BalaoPensamento />
      <Titulo texto="Quase sempre, não é. Ele esqueceu." de={T.estoura + 8} ate={T.conta - 6} destaque={["esqueceu"]} tamanho={104} topo={260} />
      <CelularCliente />

      <SeloExemplo />
      <Titulo texto="Faz a conta comigo." de={T.conta + 12} ate={T.vezes - 6} tamanho={120} />
      <Faltas />
      <Conta />
    </AbsoluteFill>
  );
}

/** Virada: a tela clareia num círculo, o laço desenha e vem a pergunta. */
function Virada() {
  const frame = useCurrentFrame();
  const abre = faixa(frame, T.virada, T.virada + 18);
  const laco = faixa(frame, T.virada + 8, T.virada + 40);
  const someLaco = faixa(frame, T.lista - 6, T.lista + 8);
  return (
    <AbsoluteFill style={{ clipPath: `circle(${abre * 150}% at 50% 50%)` }}>
      <Fundo />
      <div style={{ position: "absolute", left: 90, top: 520, opacity: 1 - someLaco }}>
        <Laco tamanho={200} progresso={laco} espessura={2.6} />
      </div>
      <Titulo texto="E se você lembrasse antes?" de={T.virada + 14} ate={T.lista - 6} destaque={["antes"]} cor={C.texto} corDestaque={C.acento} topo={760} tamanho={124} />
      <Titulo texto="Às 18h, o Fio mostra quem corta amanhã." de={T.lista + 4} ate={T.demo - 12} destaque={["18h"]} cor={C.texto} corDestaque={C.acento} topo={640} tamanho={110} />
    </AbsoluteFill>
  );
}

/** Prova: até em consulta médica, quem recebe lembrete aparece mais. */
function Prova() {
  const frame = useCurrentFrame();
  const entra = faixa(frame, T.prova, T.prova + 16, [1, 0]);
  const barras = [
    { rotulo: "Sem lembrete", valor: SEM_LEMBRETE, cor: "#b8ada2", inicio: T.prova + 50 },
    { rotulo: "Com mensagem no celular", valor: COM_LEMBRETE, cor: C.acento, inicio: T.prova + 70 },
  ];
  const fonte = useMola(T.prova + 100);
  return (
    <AbsoluteFill style={{ transform: `translateY(${entra * 1920}px)` }}>
      <Fundo />
      <div style={{ position: "absolute", left: 90, top: 280, fontFamily: F.sans, fontSize: 32, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.acentoForte }}>Até no médico é assim</div>
      <div style={{ position: "absolute", left: 90, top: 350 }}>
        <TextoCinetico texto="Quem é lembrado aparece mais." inicio={T.prova + 14} tamanho={110} destaque={["lembrado"]} />
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 880, display: "flex", flexDirection: "column", gap: 70, fontFamily: F.sans }}>
        {barras.map((b) => {
          const p = faixa(frame, b.inicio, b.inicio + 30, [0, 1], Easing.out(Easing.cubic));
          const rotulo = useMola(b.inicio - 6);
          return (
            <div key={b.rotulo} style={{ opacity: rotulo }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 42, fontWeight: 600, color: C.texto }}>
                <span>{b.rotulo}</span>
                <span style={{ fontSize: 34, color: C.texto2 }}>
                  <b style={{ fontSize: 64, color: b.cor === C.acento ? C.acento : C.texto, fontVariantNumeric: "tabular-nums" }}>{Math.round(b.valor * p)}</b> de 100 foram
                </span>
              </div>
              <div style={{ marginTop: 18, height: 64, borderRadius: 999, background: C.divisoria, overflow: "hidden" }}>
                <div style={{ width: `${b.valor * p}%`, height: "100%", borderRadius: 999, background: b.cor }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1380, fontFamily: F.sans, fontSize: 28, color: C.texto2, lineHeight: 1.4, opacity: fonte }}>
        Fonte: Revisão Cochrane (Gurol-Urganci e outros, 2013), 7 estudos com 5.841 pacientes, consultas de saúde.
      </div>
    </AbsoluteFill>
  );
}

export function V6Faltas() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {frame < T.virada + 20 && <ParteEscura />}
      {frame >= T.virada && <Virada />}

      <Sequence from={DEMO} durationInFrames={T.prova + 16 - DEMO} layout="none">
        {frame >= T.demo - 2 && <CelularLembretes />}
        <BalaoWhats />
        <Notificacao />
      </Sequence>
      <Legenda texto="Um toque. Vai pelo seu WhatsApp." de={DEMO + 118} ate={DEMO + 204} destaque={["toque"]} baixo={230} />
      <Legenda texto="Um toque por cliente. Pronto." de={DEMO + 218} ate={DEMO + 288} destaque={["Pronto"]} baixo={230} />
      {frame >= DEMO + 296 && <Legenda texto="3h antes, o celular dele avisa de novo." de={DEMO + 318} ate={T.prova - 10} destaque={["3h"]} cor="#fff" corDestaque={DESTAQUE_ESCURO} baixo={230} />}

      {frame >= T.prova && <Prova />}
      <Encerramento inicio={T.fim} frase="Seus lembretes prontos em 1 toque." />
    </AbsoluteFill>
  );
}
