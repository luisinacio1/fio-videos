import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, Celular, Encerramento, F, Fundo, Gancho, Legenda, faixa, useMola } from "./base";

/** 03 · Agenda: a semana enche sozinha, o barbeiro bloqueia a folga e o link deixa de mostrar esses horários. */

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const H0 = 9;
const H1 = 19;
// [dia, hora de início, duração em horas, cliente, tom]
const BLOCOS: [number, number, number, string, "ok" | "acento"][] = [
  [0, 9, 0.75, "Bruno", "ok"],
  [0, 11, 1, "Caio", "ok"],
  [0, 15, 0.75, "Léo", "acento"],
  [1, 10, 0.75, "Rafael", "ok"],
  [1, 13.5, 1.2, "Diego", "acento"],
  [1, 17, 0.75, "Igor", "acento"],
  [2, 9.5, 0.75, "Paulo", "ok"],
  [2, 14, 0.75, "Hugo", "acento"],
  [2, 16, 1.2, "Vitor", "acento"],
  [3, 9, 0.75, "Bruno", "ok"],
  [3, 11.25, 0.5, "Rafael", "acento"],
  [3, 14, 0.75, "Matheus", "acento"],
  [3, 16, 1.2, "Diego", "acento"],
  [4, 10, 0.75, "André", "acento"],
  [4, 12, 0.75, "Lucas", "acento"],
  [4, 15, 1.2, "Tiago", "acento"],
  [4, 17.5, 0.75, "João", "acento"],
  [5, 9, 0.75, "Gabriel", "acento"],
  [5, 10, 0.75, "Pedro", "acento"],
  [5, 11, 1.2, "Samuel", "acento"],
];

const T_BLOCO = 214;
const T_LINK = 296;

const GX = 110; // início da grade dentro do cartão
const COL = 140;
const LIN = 92; // altura de 1 hora

function Semana() {
  const frame = useCurrentFrame();
  const entra = useMola(64, { damping: 20 });
  const varre = faixa(frame, T_BLOCO, T_BLOCO + 26);
  const rotulo = useMola(T_BLOCO + 22, { damping: 11 });
  const topoBloq = (14 - H0) * LIN;
  const altBloq = (H1 - 14) * LIN;
  return (
    <div
      style={{
        width: 980,
        background: C.superficie,
        borderRadius: 40,
        border: `1.5px solid ${C.divisoria}`,
        boxShadow: "0 60px 120px -50px rgba(42,32,24,0.5)",
        padding: "34px 30px 30px",
        fontFamily: F.sans,
        opacity: entra,
        transform: `translateY(${(1 - entra) * 600}px) rotateX(${(1 - entra) * 25}deg)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 6px" }}>
        <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>Agenda</div>
        <div style={{ display: "flex", gap: 6, background: C.lateral, borderRadius: 999, padding: 5, fontSize: 22, fontWeight: 600 }}>
          <span style={{ padding: "8px 20px", color: C.texto2 }}>Dia</span>
          <span style={{ padding: "8px 20px", background: C.superficie, borderRadius: 999, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>Semana</span>
        </div>
      </div>
      <div style={{ fontSize: 24, color: C.texto2, padding: "4px 6px 20px" }}>27 de outubro a 1º de novembro</div>

      <div style={{ position: "relative", height: (H1 - H0) * LIN + 50 }}>
        {DIAS.map((d, i) => (
          <div key={d} style={{ position: "absolute", left: GX + i * COL, width: COL, textAlign: "center", fontSize: 22, fontWeight: 700, color: i === 3 ? C.acento : C.texto }}>
            {d}
            <div style={{ fontSize: 18, fontWeight: 500, color: C.texto2 }}>{27 + i > 31 ? 1 : 27 + i}</div>
          </div>
        ))}
        <div style={{ position: "absolute", top: 60, left: 0, right: 0 }}>
          {Array.from({ length: H1 - H0 + 1 }, (_, i) => (
            <div key={i} style={{ position: "absolute", top: i * LIN, left: 0, right: 0, display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: GX - 20, textAlign: "right", fontSize: 18, color: C.texto2, fontVariantNumeric: "tabular-nums", transform: "translateY(-50%)" }}>{`${H0 + i}h`}</span>
              <span style={{ flex: 1, height: 1, background: C.divisoria }} />
            </div>
          ))}
          {BLOCOS.map(([dia, h, dur, nome, tom], i) => {
            const s = useMola(80 + i * 4, { damping: 12, stiffness: 170 });
            const ok = tom === "ok";
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: GX + dia * COL + 6,
                  width: COL - 12,
                  top: (h - H0) * LIN + 3,
                  height: dur * LIN - 6,
                  borderRadius: 14,
                  background: ok ? C.okSuave : C.acentoSuave,
                  borderLeft: `6px solid ${ok ? C.ok : C.acento}`,
                  padding: "6px 10px",
                  fontSize: 19,
                  fontWeight: 600,
                  overflow: "hidden",
                  opacity: s,
                  transform: `translateY(${(1 - s) * -80}px) scale(${0.7 + s * 0.3})`,
                }}
              >
                {nome}
              </div>
            );
          })}

          {/* bloqueio do sábado à tarde, varrendo de cima para baixo */}
          <div
            style={{
              position: "absolute",
              left: GX + 5 * COL + 4,
              width: COL - 8,
              top: topoBloq + 2,
              height: altBloq * varre,
              borderRadius: 14,
              background: `repeating-linear-gradient(135deg, ${C.lateral} 0 14px, ${C.divisoria} 14px 28px)`,
              border: varre > 0 ? `2px dashed ${C.texto2}` : undefined,
              overflow: "hidden",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: GX + 3 * COL + 30,
              top: (18.35 - H0) * LIN,
              background: C.texto,
              color: "#fff",
              borderRadius: 20,
              padding: "16px 24px",
              fontSize: 24,
              fontWeight: 700,
              opacity: rotulo,
              transform: `scale(${0.6 + rotulo * 0.4}) rotate(-3deg)`,
              boxShadow: "0 20px 40px -12px rgba(0,0,0,0.45)",
              whiteSpace: "nowrap",
            }}
          >
            Bloqueado · Folga
            <div style={{ fontSize: 18, fontWeight: 500, opacity: 0.7 }}>Sáb, das 14h às 19h</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// sábado de manhã já está cheio (ver a grade): só sobra o 12:30 e a tarde, que vai ser bloqueada
const SLOTS = ["12:30", "14:00", "15:00", "16:00", "17:00", "18:00"];

function LinkSabado() {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, padding: "70px 20px 0" }}>
      <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 24 }}>Casa Navalha</div>
      <div style={{ fontSize: 13, color: C.texto2 }}>Corte masculino · 45 min</div>
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {["Qui 30", "Sex 31", "Sáb 1"].map((d, i) => (
          <div key={d} style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 12, fontSize: 14, fontWeight: 600, background: i === 2 ? C.texto : C.superficie, color: i === 2 ? "#fff" : C.texto, border: `1.5px solid ${i === 2 ? C.texto : C.divisoria}` }}>
            {d}
          </div>
        ))}
      </div>
      <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 17, marginTop: 22 }}>Horários livres</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9, marginTop: 10 }}>
        {SLOTS.map((h, i) => {
          const tarde = parseInt(h) >= 14;
          const somem = tarde ? faixa(frame, T_LINK + 26 + i * 3, T_LINK + 38 + i * 3) : 0;
          return (
            <div
              key={h}
              style={{
                borderRadius: 12,
                padding: "12px 0",
                textAlign: "center",
                fontSize: 16,
                fontWeight: 500,
                fontVariantNumeric: "tabular-nums",
                background: C.superficie,
                border: `1.5px solid ${C.divisoria}`,
                opacity: 1 - somem,
                transform: `scale(${1 - somem * 0.5})`,
                filter: `blur(${somem * 4}px)`,
              }}
            >
              {h}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center", opacity: faixa(frame, T_LINK + 50, T_LINK + 60), transform: `translateY(${faixa(frame, T_LINK + 50, T_LINK + 60, [16, 0])}px)` }}>
        <span style={{ borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 600, color: C.texto2, background: `repeating-linear-gradient(135deg, ${C.lateral} 0 8px, ${C.divisoria} 8px 16px)` }}>
          Tarde de sábado bloqueada
        </span>
      </div>
    </div>
  );
}

export function V3Agenda() {
  const frame = useCurrentFrame();
  const troca = faixa(frame, T_LINK - 10, T_LINK + 14);
  const entraCel = useMola(T_LINK - 2, { damping: 16 });
  // leve movimento de câmera pela grade
  const pan = interpolate(frame, [64, T_BLOCO, T_LINK], [0, -40, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <Fundo />
      <Gancho numero="03" rotulo="Agenda e bloqueios" titulo="A semana inteira na palma da mão." destaque={["semana", "inteira"]} ate={58} />

      <div style={{ position: "absolute", left: 50, top: 260 + pan, opacity: 1 - troca, transform: `scale(${1 - troca * 0.15})`, filter: `blur(${troca * 8}px)` }}>
        <Semana />
      </div>

      {frame >= T_LINK - 4 && (
        <div style={{ position: "absolute", left: (1080 - 414 * 1.45) / 2, top: 150, transform: `translateY(${(1 - entraCel) * 1600}px) rotate(${(1 - entraCel) * 10}deg)` }}>
          <Celular escala={1.45}>
            <LinkSabado />
          </Celular>
        </div>
      )}

      <Legenda texto="Dia e semana, com tudo o que foi marcado." de={90} ate={T_BLOCO - 8} destaque={["Dia", "semana,"]} />
      <Legenda texto="Folga? Bloqueie o horário, o dia ou as férias." de={T_BLOCO + 4} ate={T_LINK - 12} destaque={["Bloqueie"]} />
      <Legenda texto="E esses horários somem do seu link." de={T_LINK + 20} ate={370} destaque={["somem"]} />

      <Encerramento inicio={378} frase="Sua agenda, do seu jeito." />
    </AbsoluteFill>
  );
}
