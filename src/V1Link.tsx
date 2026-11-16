import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, Celular, Check, Encerramento, F, Fundo, Gancho, Legenda, Selo, Toque, faixa, useMola } from "./base";

/** 01 · Agendamento pelo link: o cliente marca sozinho e o horário aparece na agenda. */

const SERVICOS = [
  ["Corte masculino", "45 min", "R$ 60,00"],
  ["Barba", "30 min", "R$ 40,00"],
  ["Corte + barba", "1h 10min", "R$ 90,00"],
];
const HORARIOS = ["09:00", "10:30", "11:15", "14:00", "15:30", "16:00", "17:30", "18:15", "19:00"];

const T_SERVICO = 128;
const T_HORA = 182;
const T_CONFIRMA = 224;
const T_AGENDA = 290;

function PaginaPublica() {
  const frame = useCurrentFrame();
  const rolagem = faixa(frame, T_SERVICO + 8, T_SERVICO + 30, [0, -232]);
  const escolhido = frame >= T_SERVICO;
  const hora = frame >= T_HORA;
  const sucesso = faixa(frame, T_CONFIRMA + 4, T_CONFIRMA + 20);
  const check = faixa(frame, T_CONFIRMA + 14, T_CONFIRMA + 34);
  const capa = useMola(84);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ transform: `translateY(${rolagem}px)` }}>
        <div style={{ height: 170, background: "linear-gradient(135deg,#4a3324,#8a5a3c 60%,#b0794f)", transform: `scale(${1.15 - capa * 0.15})`, transformOrigin: "top" }} />
        <div style={{ padding: "0 20px", marginTop: -38 }}>
          <div style={{ width: 76, height: 76, borderRadius: 99, border: `3px solid ${C.fundo}`, background: C.acento, color: "#fff", fontFamily: F.serif, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${capa})` }}>
            C
          </div>
          <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 26, marginTop: 8 }}>Casa Navalha</div>
          <div style={{ fontSize: 13, color: C.texto2 }}>Rua das Palmeiras, 120 · Centro</div>
          <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 17, marginTop: 20 }}>Escolha o serviço</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 10 }}>
            {SERVICOS.map(([nome, tempo, preco], i) => {
              const s = useMola(92 + i * 5);
              const ativo = escolhido && i === 0;
              return (
                <div
                  key={nome}
                  style={{
                    borderRadius: 14,
                    padding: "12px 14px",
                    border: `1.5px solid ${ativo ? C.acento : C.divisoria}`,
                    background: ativo ? C.acentoSuave : C.superficie,
                    opacity: s,
                    transform: `translateY(${(1 - s) * 30}px)`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 16 }}>{nome}</div>
                    <div style={{ fontSize: 12, color: C.texto2 }}>
                      {tempo} · <span style={{ color: C.acentoForte, fontWeight: 600 }}>{preco}</span>
                    </div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${ativo ? C.acento : C.divisoria}`, background: ativo ? C.acento : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ativo && <Check tamanho={13} cor="#fff" progresso={faixa(frame, T_SERVICO, T_SERVICO + 8)} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 17, marginTop: 24 }}>Quinta, 30 de outubro</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 10 }}>
            {HORARIOS.map((h, i) => {
              const s = useMola(T_SERVICO + 18 + i * 2);
              const ativo = hora && h === "14:00";
              return (
                <div
                  key={h}
                  style={{
                    borderRadius: 11,
                    padding: "11px 0",
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: ativo ? 700 : 500,
                    fontVariantNumeric: "tabular-nums",
                    border: `1.5px solid ${ativo ? C.acento : C.divisoria}`,
                    background: ativo ? C.acento : C.superficie,
                    color: ativo ? "#fff" : C.texto,
                    opacity: s,
                    transform: `scale(${(0.6 + s * 0.4) * (ativo ? 1 + 0.08 * Math.sin(Math.min(1, (frame - T_HORA) / 8) * Math.PI) : 1)})`,
                  }}
                >
                  {h}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* botão fixo embaixo */}
      <div style={{ position: "absolute", left: 20, right: 20, bottom: 26, opacity: faixa(frame, T_HORA + 4, T_HORA + 14), transform: `translateY(${faixa(frame, T_HORA + 4, T_HORA + 14, [40, 0])}px)` }}>
        <div style={{ borderRadius: 999, background: C.acento, color: "#fff", textAlign: "center", padding: "16px 0", fontWeight: 600, fontSize: 16, boxShadow: "0 12px 24px -12px rgba(176,81,58,0.8)" }}>
          Confirmar · Qui 30/10 às 14:00
        </div>
      </div>

      {/* tela de sucesso */}
      <div style={{ position: "absolute", inset: 0, background: C.fundo, clipPath: `circle(${sucesso * 130}% at 50% 92%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 30 }}>
        <div style={{ width: 92, height: 92, borderRadius: 99, background: C.okSuave, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.5 + check * 0.5})` }}>
          <Check tamanho={50} cor={C.ok} progresso={check} />
        </div>
        <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 30 }}>Horário marcado!</div>
        <div style={{ fontSize: 15, color: C.texto2, textAlign: "center", lineHeight: 1.45 }}>
          Corte masculino na Casa Navalha
          <br />
          Quinta, 30/10 às 14:00
        </div>
      </div>

      <Toque x={195} y={350} quadro={T_SERVICO} tamanho={30} />
      <Toque x={75} y={430} quadro={T_HORA} tamanho={30} />
      <Toque x={195} y={748} quadro={T_CONFIRMA} tamanho={30} />
    </div>
  );
}

const AGENDA = [
  { hora: "09:00", nome: "Bruno", servico: "Corte masculino", tom: "ok" },
  { hora: "11:15", nome: "Rafael", servico: "Barba", tom: "acento" },
  { hora: "14:00", nome: "Matheus", servico: "Corte masculino", tom: "novo" },
  { hora: "16:00", nome: "Diego", servico: "Corte + barba", tom: "acento" },
] as const;

function CartaoAgenda() {
  const frame = useCurrentFrame();
  const entra = useMola(T_AGENDA + 4);
  const novo = useMola(T_AGENDA + 34, { damping: 10, stiffness: 180 });
  return (
    <div
      style={{
        width: 560,
        background: C.superficie,
        borderRadius: 34,
        padding: 34,
        boxShadow: "0 50px 100px -40px rgba(42,32,24,0.5)",
        border: `1.5px solid ${C.divisoria}`,
        opacity: entra,
        transform: `translateX(${(1 - entra) * 200}px) rotate(${(1 - entra) * 6}deg)`,
        fontFamily: F.sans,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em" }}>Agenda</div>
      <div style={{ fontSize: 20, color: C.texto2 }}>Quinta-feira, 30 de outubro</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {AGENDA.map((a) => {
          const ehNovo = a.tom === "novo";
          const s = ehNovo ? novo : 1;
          const ok = a.tom === "ok";
          return (
            <div
              key={a.hora}
              style={{
                display: "flex",
                borderRadius: 16,
                overflow: "hidden",
                background: ok ? C.okSuave : C.acentoSuave,
                boxShadow: ehNovo ? `0 0 0 ${3 + Math.max(0, Math.sin((frame - T_AGENDA) / 6)) * 3}px ${C.acento}` : undefined,
                transform: `scale(${ehNovo ? s : 1})`,
                opacity: ehNovo ? s : 1,
                maxHeight: ehNovo ? s * 120 : 120,
              }}
            >
              <div style={{ width: 7, background: ok ? C.ok : C.acento }} />
              <div style={{ flex: 1, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 17, color: C.texto2, fontVariantNumeric: "tabular-nums" }}>{a.hora}</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{a.nome}</div>
                  <div style={{ fontSize: 17, color: C.texto2 }}>{a.servico}</div>
                </div>
                <Selo tom={ok ? "ok" : "acento"} tamanho={16}>
                  {ok ? "Realizado" : ehNovo ? "Novo pelo link" : "Confirmado"}
                </Selo>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** O celular com a página pública (entra no quadro 70), o fio até a agenda e "Ele marca. Aparece aqui." */
export function DemoLink() {
  const frame = useCurrentFrame();
  const entraCel = useMola(70, { damping: 18 });
  const lado = faixa(frame, T_AGENDA - 14, T_AGENDA + 16);
  const E = 1.6;
  // posição/escala do celular: centralizado → recua para a esquerda
  const escala = interpolate(lado, [0, 1], [1, 0.62]);
  const x = interpolate(lado, [0, 1], [(1080 - 414 * E) / 2, 40]);
  const y = interpolate(lado, [0, 1], [150, 420]) + (1 - entraCel) * 1500;
  const fio = faixa(frame, T_AGENDA + 14, T_AGENDA + 40);

  return (
    <>
      <div style={{ position: "absolute", left: x, top: y, transform: `scale(${escala}) rotate(${(1 - entraCel) * -8 + lado * -3}deg)`, transformOrigin: "top left" }}>
        <Celular escala={E}>
          <PaginaPublica />
        </Celular>
      </div>

      {/* o fio: do celular até o horário novo na agenda */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d="M 330 1010 C 470 1010, 420 1150, 520 1135" stroke={C.acento} strokeWidth={6} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fio} />
        <circle cx={330} cy={1010} r={10 * fio} fill={C.acento} />
      </svg>

      <div style={{ position: "absolute", left: 470, top: 640 }}>
        <CartaoAgenda />
      </div>

      {frame >= T_AGENDA - 20 && frame < 380 && (
        <div style={{ position: "absolute", left: 90, top: 190, width: 900 }}>
          <div style={{ fontFamily: F.serif, fontSize: 88, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", opacity: faixa(frame, T_AGENDA - 6, T_AGENDA + 10), transform: `translateY(${faixa(frame, T_AGENDA - 6, T_AGENDA + 10, [40, 0])}px)` }}>
            Ele marca. <span style={{ color: C.acento, fontStyle: "italic" }}>Aparece aqui.</span>
          </div>
        </div>
      )}
    </>
  );
}

export function V1Link() {
  return (
    <AbsoluteFill>
      <Fundo />
      <Gancho numero="01" rotulo="Agendamento pelo link" titulo="Ainda responde “tem horário hoje?”" destaque={["horário", "hoje?”"]} ate={66} />

      <DemoLink />

      <Legenda texto="O cliente escolhe o serviço e o horário livre." de={96} ate={T_CONFIRMA - 6} destaque={["serviço", "horário"]} />
      <Legenda texto="Sem trocar 10 mensagens." de={T_CONFIRMA + 6} ate={T_AGENDA - 16} destaque={["10"]} />
      <Legenda texto="Direto na sua agenda, sem você digitar nada." de={T_AGENDA + 24} ate={370} destaque={["agenda,"]} />

      <Encerramento inicio={378} frase="Seu link de agendamento. Pronto para a bio." />
    </AbsoluteFill>
  );
}
