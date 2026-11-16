import React from "react";
import { AbsoluteFill, spring, useCurrentFrame } from "remotion";
import { C, Celular, Check, Encerramento, F, Fundo, Gancho, Legenda, Selo, Toque, faixa, useMola } from "./base";

/** 02 · Lembretes: a lista de amanhã com a mensagem pronta; 1 toque por cliente, do WhatsApp do barbeiro. */

const CLIENTES = [
  { hora: "09:00", nome: "Bruno Almeida", servico: "Corte masculino", lembrado: "18:02" },
  { hora: "10:30", nome: "Rafael Souza", servico: "Barba", lembrado: "18:03" },
  { hora: "14:00", nome: "Matheus Lima", servico: "Corte + barba", lembrado: "18:03" },
  { hora: "16:00", nome: "Diego Costa", servico: "Corte masculino", lembrado: "18:04" },
];
// quadro em que o barbeiro toca em "Lembrar no WhatsApp" de cada cliente
const TOQUES = [112, 222, 244, 266];
const T_PUSH = 296;

const MENSAGEM = "Oi, Bruno! Lembrete do seu horário na Casa Navalha: amanhã (31/10), às 09:00, Corte masculino. Se precisar remarcar ou cancelar: agendafio.com.br/casa-navalha";

function TelaLembretes() {
  const frame = useCurrentFrame();
  const feitos = TOQUES.filter((t) => frame >= t + 6).length;
  const todos = feitos === CLIENTES.length;
  const pulso = todos ? molaPulso(frame, TOQUES[3] + 8) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, padding: "62px 18px 0" }}>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>Lembretes</div>
      <div style={{ fontSize: 14, color: C.texto2, marginTop: 2 }}>Avise os clientes de amanhã pelo seu WhatsApp, com a mensagem pronta.</div>
      <div style={{ marginTop: 18, background: C.superficie, borderRadius: 20, border: `1.5px solid ${C.divisoria}`, padding: "16px 16px 4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Amanhã</div>
          <div style={{ fontSize: 14, color: todos ? C.ok : C.texto2, fontWeight: todos ? 700 : 500, transform: `scale(${1 + pulso * 0.12})` }}>
            {todos ? "Todos avisados" : `${feitos} de ${CLIENTES.length} avisados`}
          </div>
        </div>
        {CLIENTES.map((c, i) => {
          const s = useMola(78 + i * 5);
          const feito = frame >= TOQUES[i] + 6;
          const troca = faixa(frame, TOQUES[i] + 4, TOQUES[i] + 12);
          return (
            <div key={c.nome} style={{ padding: "14px 0", borderTop: i ? `1px solid ${C.divisoria}` : undefined, opacity: s, transform: `translateX(${(1 - s) * 60}px)` }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 52, fontSize: 17, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{c.hora}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 13, color: C.texto2 }}>{c.servico}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 40, position: "relative" }}>
                {!feito || troca < 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 12,
                      background: C.acento,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: 1 - troca,
                      transform: `scale(${frame >= TOQUES[i] && frame < TOQUES[i] + 5 ? 0.95 : 1})`,
                    }}
                  >
                    <IconeConversa /> Lembrar no WhatsApp
                  </div>
                ) : null}
                {feito && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 10, opacity: troca, transform: `translateY(${(1 - troca) * 10}px)` }}>
                    <Selo tom="ok" tamanho={13}>
                      <Check tamanho={12} progresso={troca} /> Lembrado às {c.lembrado}
                    </Selo>
                    <span style={{ fontSize: 13, color: C.texto2, textDecoration: "underline" }}>Mandar de novo</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {CLIENTES.map((_, i) => (
        <Toque key={i} x={195} y={281 + i * 116} quadro={TOQUES[i]} tamanho={30} />
      ))}
    </div>
  );
}

/** Pulo curto do contador quando todos foram avisados. */
function molaPulso(frame: number, inicio: number) {
  return spring({ frame: frame - inicio, fps: 30, config: { damping: 8, stiffness: 200 } });
}

function IconeConversa({ cor = "#fff", tamanho = 18 }: { cor?: string; tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

/** Balão do WhatsApp com a mensagem pronta, digitando sozinha. */
export function BalaoWhats() {
  const frame = useCurrentFrame();
  const t0 = TOQUES[0] + 4;
  const entra = useMola(t0, { damping: 14 });
  const sai = faixa(frame, 206, 220);
  const letras = Math.floor(faixa(frame, t0 + 10, t0 + 60, [0, MENSAGEM.length], (x) => x));
  const enviado = faixa(frame, t0 + 66, t0 + 74);
  const selo = useMola(t0 + 20, { damping: 9 });
  if (frame < t0 || frame > 222) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 250,
        opacity: entra * (1 - sai),
        transform: `translateY(${(1 - entra) * 120 - sai * 80}px) scale(${0.85 + entra * 0.15})`,
        transformOrigin: "bottom right",
      }}
    >
      <div style={{ background: "#0b141a", borderRadius: 40, padding: "26px 30px 34px", boxShadow: "0 50px 100px -30px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 22, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: "#53bdeb", color: "#0b141a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 28 }}>B</div>
          <div style={{ fontFamily: F.sans }}>
            <div style={{ color: "#e9edef", fontSize: 30, fontWeight: 600 }}>Bruno Almeida</div>
            <div style={{ color: "#8696a0", fontSize: 22 }}>WhatsApp</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 26 }}>
          <div style={{ background: "#005c4b", color: "#e9edef", fontFamily: F.sans, fontSize: 31, lineHeight: 1.38, padding: "18px 22px 14px", borderRadius: "24px 6px 24px 24px", maxWidth: 760, minHeight: 60 }}>
            {MENSAGEM.slice(0, letras)}
            {letras < MENSAGEM.length && <span style={{ opacity: Math.floor(frame / 4) % 2 ? 1 : 0.2 }}>▍</span>}
            <div style={{ textAlign: "right", fontSize: 20, color: "#8fb7ad", marginTop: 6 }}>
              18:02 <span style={{ color: enviado > 0.5 ? "#53bdeb" : "#8fb7ad" }}>✓✓</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 34, top: -30, background: C.acento, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 26, borderRadius: 999, padding: "10px 22px", transform: `rotate(4deg) scale(${selo})` }}>
        Mensagem pronta
      </div>
    </div>
  );
}

/** Notificação no celular do cliente, 3 horas antes. */
export function Notificacao() {
  const frame = useCurrentFrame();
  const entra = useMola(T_PUSH + 10, { damping: 13 });
  const fundo = faixa(frame, T_PUSH, T_PUSH + 14);
  if (frame < T_PUSH) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(26,21,17,${fundo * 0.86})`, alignItems: "center", paddingTop: 300 }}>
      <div style={{ fontFamily: F.sans, color: "#fff", textAlign: "center", opacity: fundo }}>
        <div style={{ fontSize: 170, fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1 }}>06:00</div>
        <div style={{ fontSize: 34, opacity: 0.75, marginTop: 6 }}>sexta-feira, 31 de outubro</div>
      </div>
      <div
        style={{
          marginTop: 80,
          width: 920,
          background: "rgba(250,248,245,0.94)",
          borderRadius: 40,
          padding: "28px 32px",
          display: "flex",
          gap: 24,
          fontFamily: F.sans,
          transform: `translateY(${(1 - entra) * -500}px)`,
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ width: 84, height: 84, borderRadius: 22, background: C.fundo, border: `2px solid ${C.divisoria}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg viewBox="0 0 48 40" width={58} fill="none" stroke={C.acento} strokeWidth={3} strokeLinecap="round">
            <path d="M3 29c8 5 18.5 7 26-1.5 7-8 13-19.5 9.6-23.6-3.4-4.2-9.6 1.6-9.6 12.6 0 10.5 6.4 19.2 16 17" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: C.texto2 }}>
            <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>CASA NAVALHA</span>
            <span>agora</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: C.texto }}>Seu horário é hoje às 09:00</div>
          <div style={{ fontSize: 28, color: C.texto2, marginTop: 4, lineHeight: 1.3 }}>Corte masculino na Casa Navalha. Precisa remarcar ou cancelar? Toque para ver.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** O celular com a lista de lembretes: entra no quadro 66, recua enquanto o WhatsApp aparece e desfoca para o aviso. */
export function CelularLembretes() {
  const frame = useCurrentFrame();
  const entraCel = useMola(66, { damping: 18 });
  const E = 1.6;
  const afasta = faixa(frame, T_PUSH - 6, T_PUSH + 20);
  const y = 170 + (1 - entraCel) * 1500;
  const fala = faixa(frame, TOQUES[0], TOQUES[0] + 16) * (1 - faixa(frame, 206, 222));
  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - 414 * E) / 2,
        top: y,
        transform: `scale(${1 - fala * 0.12 - afasta * 0.1}) translateY(${fala * 260}px)`,
        transformOrigin: "50% 0%",
        filter: `blur(${fala * 4 + afasta * 6}px)`,
      }}
    >
      <Celular escala={E}>
        <TelaLembretes />
      </Celular>
    </div>
  );
}

export function V2Lembretes() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Fundo />
      <Gancho numero="02" rotulo="Lembretes no WhatsApp" titulo="Cliente esqueceu o horário de novo?" destaque={["esqueceu"]} ate={62} />

      <CelularLembretes />

      <BalaoWhats />

      <Legenda texto="A mensagem já vem pronta, com nome e horário." de={84} ate={TOQUES[0] - 4} destaque={["pronta,"]} />
      <Legenda texto="Você manda do seu WhatsApp." de={150} ate={204} destaque={["seu"]} />
      <Legenda texto="1 toque por cliente." de={218} ate={T_PUSH - 8} destaque={["1", "toque"]} />

      <Notificacao />
      {frame >= T_PUSH && <Legenda texto="E quem ativou o aviso recebe no celular, 3h antes." de={T_PUSH + 24} ate={370} destaque={["3h", "antes."]} cor="#fff" />}

      <Encerramento inicio={378} frase="Seus lembretes prontos em 1 toque." />
    </AbsoluteFill>
  );
}

