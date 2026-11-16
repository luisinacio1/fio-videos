import React from "react";
import { C, F, Laco } from "../base";

/**
 * Telas do Fio redesenhadas em 390 px de largura (o celular do vídeo), copiando as telas reais:
 * src/app/[slug]/agendar/FluxoAgendamento.tsx (cliente) e src/app/painel/agenda (barbeiro).
 * Nada aqui mostra função que o app não tem. Cada bloco tem altura fixa, para o vídeo saber onde tocar.
 */

export const LARGURA_TELA = 390;
export const ALTURA_TELA = 844;
const T2 = C.texto2;
const BORDA = C.divisoria;

type PropsIcone = { tam?: number; cor?: string; traco?: number };
function Svg({ tam = 22, cor = C.texto, traco = 1.8, children }: PropsIcone & { children: React.ReactNode }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={traco} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      {children}
    </svg>
  );
}

export const Icone = {
  voltar: (p: PropsIcone) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>,
  avancar: (p: PropsIcone) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>,
  seta: (p: PropsIcone) => <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>,
  tesoura: (p: PropsIcone) => <Svg {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.12 15.88" /><path d="M14.47 14.48 20 20" /><path d="M8.12 8.12 12 12" /></Svg>,
  local: (p: PropsIcone) => <Svg {...p}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></Svg>,
  telefone: (p: PropsIcone) => <Svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></Svg>,
  cadeado: (p: PropsIcone) => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>,
  calendario: (p: PropsIcone) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></Svg>,
  relogio: (p: PropsIcone) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Svg>,
  recibo: (p: PropsIcone) => <Svg {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8" /><path d="M16 12H8" /><path d="M13 16H8" /></Svg>,
  pessoa: (p: PropsIcone) => <Svg {...p}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></Svg>,
  menu: (p: PropsIcone) => <Svg {...p}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></Svg>,
  certo: (p: PropsIcone) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>,
  mais: (p: PropsIcone) => <Svg {...p}><path d="M5 12h14" /><path d="M12 5v14" /></Svg>,
};

// ---------- peças ----------

/** Barra de status do celular. */
export function BarraStatus({ hora, escura = false }: { hora: string; escura?: boolean }) {
  const cor = escura ? "#fff" : C.texto;
  return (
    <div style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: cor }}>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{hora}</span>
      <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <span style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
          {[5, 7, 9, 11].map((h) => (
            <span key={h} style={{ width: 3, height: h, background: cor, borderRadius: 1 }} />
          ))}
        </span>
        <span style={{ width: 22, height: 11, border: `1.5px solid ${cor}`, borderRadius: 3, padding: 1 }}>
          <span style={{ display: "block", width: "70%", height: "100%", background: cor, borderRadius: 1 }} />
        </span>
      </span>
    </div>
  );
}

/** Barra de endereço do navegador do celular. */
export function BarraEndereco({ url, carregando = 1 }: { url: string; carregando?: number }) {
  return (
    <div style={{ height: 56, background: "#efe9e2", padding: "9px 12px", position: "relative" }}>
      <div style={{ height: 38, borderRadius: 999, background: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", fontFamily: F.sans, fontSize: 15, color: C.texto }}>
        {Icone.cadeado({ tam: 14, cor: T2, traco: 2.2 })}
        <span style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{url}</span>
      </div>
      {carregando < 1 && <div style={{ position: "absolute", left: 0, bottom: 0, height: 3, width: `${carregando * 100}%`, background: C.acento }} />}
    </div>
  );
}

/** Topo das páginas do Fio (laço + "Fio" e o menu). */
export function Topo({ corLaco = C.texto }: { corLaco?: string }) {
  return (
    <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Laco tamanho={34} cor={corLaco} espessura={2.8} />
        <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 25, color: C.texto }}>Fio</span>
      </div>
      {Icone.menu({ tam: 26, traco: 1.6 })}
    </div>
  );
}

function LinkVoltar({ texto }: { texto: string }) {
  return (
    <div style={{ height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 18px", fontFamily: F.sans, fontSize: 18, color: T2 }}>
      {Icone.voltar({ tam: 22, cor: T2 })}
      {texto}
    </div>
  );
}

export function LogoBarbearia({ tam = 84 }: { tam?: number }) {
  return (
    <div style={{ width: tam, height: tam, borderRadius: 999, background: "#1f1b17", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ width: tam - 10, height: tam - 10, borderRadius: 999, border: `${Math.max(1.5, tam / 50)}px solid #c9a45c`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: tam * 0.26, color: "#fff", letterSpacing: "0.04em" }}>RAFA</span>
        <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: tam * 0.13, color: "#c9a45c", marginTop: tam * 0.03 }}>barbearia</span>
      </div>
    </div>
  );
}

const BARBEARIA = "Barbearia do Rafa";

function Cabecalho({ comServico }: { comServico?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "0 20px", alignItems: "flex-start" }}>
      <LogoBarbearia />
      <div style={{ fontFamily: F.sans, minWidth: 0 }}>
        <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 25, lineHeight: 1.15, color: C.texto }}>{BARBEARIA}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 15, color: T2 }}>
          {Icone.local({ tam: 16, cor: T2 })} São Paulo, SP
        </div>
        {comServico ? (
          <>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 500, color: C.texto }}>Corte masculino</div>
            <div style={{ fontSize: 16, color: T2 }}>45 min · R$ 40,00</div>
          </>
        ) : (
          <div style={{ marginTop: 6, fontSize: 16, color: C.texto, lineHeight: 1.35 }}>Corte, barba e aquele papo bom.</div>
        )}
      </div>
    </div>
  );
}

export function Etapas({ indice }: { indice: number }) {
  const nomes = ["Serviço", "Horário", "Seus dados", "Confirmação"];
  return (
    <div style={{ height: 70, position: "relative", padding: "0 14px", display: "flex", justifyContent: "space-between", fontFamily: F.sans }}>
      <div style={{ position: "absolute", left: 60, right: 60, top: 20, height: 1.5, background: "#ead3ca" }} />
      {nomes.map((n, i) => {
        const feito = i < indice;
        const ativo = i === indice;
        return (
          <div key={n} style={{ width: 82, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: feito ? "#c9bcb0" : ativo ? C.acento : "#fff",
                border: feito || ativo ? "none" : `1.5px solid ${BORDA}`,
                color: ativo ? "#fff" : T2,
                fontSize: 17,
              }}
            >
              {feito ? Icone.certo({ tam: 18, cor: "#fff", traco: 2.4 }) : i + 1}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: ativo ? C.texto : T2, whiteSpace: "nowrap" }}>{n}</div>
          </div>
        );
      })}
    </div>
  );
}

function Titulo({ children, centro, mt = 26 }: { children: React.ReactNode; centro?: boolean; mt?: number }) {
  return (
    <div style={{ padding: `${mt}px 20px 0`, fontFamily: F.serif, fontWeight: 600, fontSize: 38, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.texto, textAlign: centro ? "center" : "left" }}>
      {children}
    </div>
  );
}

function Texto({ children, mt = 10, centro, tam = 17 }: { children: React.ReactNode; mt?: number; centro?: boolean; tam?: number }) {
  return <div style={{ padding: `${mt}px 20px 0`, fontFamily: F.sans, fontSize: tam, lineHeight: 1.45, color: T2, textAlign: centro ? "center" : "left" }}>{children}</div>;
}

export function Botao({ texto, seta, secundario, apertado = 0, desativado, estilo }: { texto: string; seta?: "frente" | "volta" | "chevron"; secundario?: boolean; apertado?: number; desativado?: boolean; estilo?: React.CSSProperties }) {
  const cor = secundario ? C.texto : "#fff";
  return (
    <div
      style={{
        height: 56,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: F.sans,
        fontSize: 18,
        fontWeight: 600,
        background: secundario ? "#fff" : apertado > 0 ? C.acentoForte : C.acento,
        border: secundario ? `1.5px solid ${BORDA}` : "none",
        color: cor,
        opacity: desativado ? 0.45 : 1,
        transform: `scale(${1 - apertado * 0.04})`,
        ...estilo,
      }}
    >
      {seta === "volta" && Icone.voltar({ tam: 20, cor })}
      {texto}
      {seta === "frente" && Icone.seta({ tam: 21, cor, traco: 2 })}
      {seta === "chevron" && Icone.avancar({ tam: 20, cor })}
    </div>
  );
}

function CartaoServico({ nome, dur, preco, ativo }: { nome: string; dur: string; preco: string; ativo?: boolean }) {
  return (
    <div
      style={{
        height: 136,
        boxSizing: "border-box",
        margin: "0 20px 14px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: 12,
        borderRadius: 18,
        border: `1.5px solid ${ativo ? C.acento : BORDA}`,
        background: ativo ? "rgba(248,235,230,0.7)" : "#fff",
      }}
    >
      <div style={{ width: 110, height: 110, borderRadius: 14, background: C.acentoSuave, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {Icone.tesoura({ tam: 36, cor: C.acento, traco: 1.4 })}
      </div>
      <div style={{ flex: 1, fontFamily: F.sans }}>
        <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 23, lineHeight: 1.12, color: C.texto }}>{nome}</div>
        <div style={{ marginTop: 4, fontSize: 16, color: T2 }}>{dur}</div>
        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: C.acentoForte }}>{preco}</div>
      </div>
      <div style={{ width: 28, height: 28, borderRadius: 999, border: `2px solid ${ativo ? C.acento : "#b9b1a9"}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0 }}>
        {ativo && <div style={{ width: 15, height: 15, borderRadius: 999, background: C.acento }} />}
      </div>
    </div>
  );
}

// ---------- páginas do cliente (altura e posição de cada parte, para o toque cair no lugar certo) ----------

/** y (dentro da página) do que dá para tocar, em cada passo. */
export const ALVOS = {
  servico: { cartao1: { x: 195, y: 528 }, continuar: { x: 195, y: 952 } },
  horario: { dia: { x: 138, y: 526 }, hora: { x: 60, y: 719 }, continuar: { x: 287, y: 878 } },
  dados: { nome: { x: 195, y: 408 }, telefone: { x: 195, y: 514 }, revisar: { x: 195, y: 660 } },
  revisao: { confirmar: { x: 195, y: 822 } },
};

export function PaginaServico({ escolhido }: { escolhido?: boolean }) {
  return (
    <div style={{ background: C.fundo, paddingBottom: 200 }}>
      <Topo />
      <LinkVoltar texto="Página da barbearia" />
      <div style={{ height: 12 }} />
      <div style={{ height: 112 }}>
        <Cabecalho />
      </div>
      <div style={{ height: 28 }} />
      <Etapas indice={0} />
      <div style={{ height: 106 }}>
        <Titulo>Escolha um serviço</Titulo>
        <Texto>Selecione o serviço que deseja agendar.</Texto>
      </div>
      <div style={{ height: 24 }} />
      <CartaoServico nome="Corte masculino" dur="45 min" preco="R$ 40,00" ativo={escolhido} />
      <CartaoServico nome="Barba" dur="30 min" preco="R$ 30,00" />
      <CartaoServico nome="Corte + barba" dur="1h 10min" preco="R$ 65,00" />
      <div style={{ height: 14 }} />
      <div style={{ padding: "0 20px" }}>
        <Botao texto="Continuar" seta="frente" desativado={!escolhido} />
      </div>
      <Texto mt={14} centro>
        1 de 4
      </Texto>
    </div>
  );
}

const DIAS = [
  { s: "HOJE", n: 1 },
  { s: "SEG", n: 2 },
  { s: "TER", n: 3 },
  { s: "QUA", n: 4 },
  { s: "QUI", n: 5 },
];
const HORAS = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "14:30"];

export function PaginaHorario({ dia, hora }: { dia?: boolean; hora?: boolean }) {
  return (
    <div style={{ background: C.fundo, paddingBottom: 200 }}>
      <Topo />
      <LinkVoltar texto="Voltar" />
      <div style={{ height: 12 }} />
      <div style={{ height: 142 }}>
        <Cabecalho comServico />
      </div>
      <div style={{ height: 28 }} />
      <Etapas indice={1} />
      <div style={{ height: 110 }}>
        <Titulo>Escolha data e horário</Titulo>
      </div>
      <div style={{ height: 112, display: "flex", gap: 10, padding: "0 20px", overflow: "hidden", fontFamily: F.sans }}>
        {DIAS.map((d, i) => {
          const sel = dia && i === 1;
          const hoje = i === 0;
          return (
            <div
              key={d.s}
              style={{
                width: 72,
                height: 112,
                flexShrink: 0,
                borderRadius: 18,
                border: `1.5px solid ${sel ? C.acento : BORDA}`,
                background: sel ? C.acento : hoje ? "#f6f2ec" : "#fff",
                color: sel ? "#fff" : C.texto,
                opacity: hoje ? 0.45 : 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 13, letterSpacing: "0.04em" }}>{d.s}</span>
              <span style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.1 }}>{d.n}</span>
              <span style={{ fontSize: 13, letterSpacing: "0.04em" }}>NOV</span>
            </div>
          );
        })}
      </div>
      <div style={{ height: 110, opacity: dia ? 1 : 0, fontFamily: F.sans }}>
        <div style={{ padding: "32px 20px 0", fontFamily: F.serif, fontWeight: 600, fontSize: 24, color: C.texto }}>Horários disponíveis</div>
        <Texto mt={4} tam={16}>
          Segunda-feira, 2 de novembro
        </Texto>
        <div style={{ height: 16 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "0 20px", opacity: dia ? 1 : 0, fontFamily: F.sans }}>
        {HORAS.map((h, i) => {
          const sel = hora && i === 0;
          return (
            <div key={h} style={{ height: 54, borderRadius: 14, border: `1.5px solid ${sel ? C.acento : BORDA}`, background: sel ? C.acento : "#fff", color: sel ? "#fff" : C.texto, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {h}
            </div>
          );
        })}
      </div>
      <div style={{ height: 40 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "0 20px" }}>
        <Botao texto="Voltar" seta="volta" secundario />
        <Botao texto="Continuar" seta="chevron" desativado={!hora} />
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, exemplo, foco, telefone, cursor }: { rotulo: string; valor: string; exemplo: string; foco?: boolean; telefone?: boolean; cursor?: boolean }) {
  return (
    <div style={{ padding: "0 20px", fontFamily: F.sans }}>
      <div style={{ height: 28, fontSize: 17, fontWeight: 500, color: C.texto }}>{rotulo}</div>
      <div
        style={{
          height: 56,
          boxSizing: "border-box",
          borderRadius: 14,
          border: foco ? `2px solid ${C.acento}` : `1.5px solid ${BORDA}`,
          boxShadow: foco ? "0 0 0 3px rgba(176,81,58,0.22)" : undefined,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 16px",
          fontSize: 18,
          color: valor ? C.texto : "#a39a91",
        }}
      >
        {telefone && Icone.telefone({ tam: 20, cor: T2, traco: 1.6 })}
        <span>{valor || exemplo}</span>
        {cursor && <span style={{ width: 2, height: 22, background: C.acento, marginLeft: -10 }} />}
      </div>
    </div>
  );
}

export function PaginaDados({ nome, telefone, foco, cursor }: { nome: string; telefone: string; foco?: "nome" | "telefone"; cursor?: boolean }) {
  return (
    <div style={{ background: C.fundo, paddingBottom: 200 }}>
      <Topo />
      <LinkVoltar texto="Voltar" />
      <div style={{ height: 16 }} />
      <Etapas indice={2} />
      <div style={{ height: 136 }}>
        <Titulo>Seus dados</Titulo>
        <Texto>Quase lá! Preencha seus dados para finalizarmos seu agendamento.</Texto>
      </div>
      <div style={{ height: 22 }} />
      <Campo rotulo="Nome completo" valor={nome} exemplo="Ex.: João Silva" foco={foco === "nome"} cursor={cursor && foco === "nome"} />
      <div style={{ height: 22 }} />
      <Campo rotulo="Telefone com DDD" valor={telefone} exemplo="(11) 99999-9999" telefone foco={foco === "telefone"} cursor={cursor && foco === "telefone"} />
      <div style={{ height: 70, display: "flex", gap: 12, padding: "16px 20px 0", fontFamily: F.sans, fontSize: 16, lineHeight: 1.4, color: T2, boxSizing: "border-box" }}>
        {Icone.cadeado({ tam: 22, cor: T2, traco: 1.6 })}
        <span>Usaremos seus dados para organizar este agendamento.</span>
      </div>
      <div style={{ height: 20 }} />
      <div style={{ padding: "0 20px" }}>
        <Botao texto="Revisar agendamento" seta="frente" />
      </div>
    </div>
  );
}

function Linha({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div style={{ height: 52, display: "grid", gridTemplateColumns: "28px 0.8fr 1.3fr", alignItems: "center", gap: 14, borderTop: `1px solid ${BORDA}`, fontFamily: F.sans }}>
      {icone}
      <span style={{ fontSize: 15, color: T2 }}>{rotulo}</span>
      <span style={{ fontSize: 16, color: C.texto }}>{valor}</span>
    </div>
  );
}

export function PaginaRevisao({ apertado = 0, nome, telefoneOculto }: { apertado?: number; nome: string; telefoneOculto: string }) {
  const i = { tam: 22, cor: "rgba(31,27,23,0.8)", traco: 1.5 };
  return (
    <div style={{ background: C.fundo, paddingBottom: 200 }}>
      <Topo />
      <LinkVoltar texto="Voltar" />
      <div style={{ height: 16 }} />
      <Etapas indice={3} />
      <div style={{ height: 172 }}>
        <Titulo centro>Revise seu agendamento</Titulo>
        <Texto centro>Confira os detalhes abaixo e confirme para finalizar seu agendamento.</Texto>
      </div>
      <div style={{ margin: "0 20px", borderRadius: 18, border: `1.5px solid ${BORDA}`, background: "#fff", padding: "0 18px", height: 404, boxSizing: "border-box" }}>
        <div style={{ height: 88, display: "flex", alignItems: "center", gap: 14 }}>
          <LogoBarbearia tam={58} />
          <div>
            <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 22, color: C.texto }}>{BARBEARIA}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.sans, fontSize: 14, color: T2 }}>{Icone.local({ tam: 15, cor: T2 })} São Paulo, SP</div>
          </div>
        </div>
        <Linha icone={Icone.tesoura(i)} rotulo="Serviço" valor="Corte masculino" />
        <Linha icone={Icone.calendario(i)} rotulo="Data" valor="Segunda-feira, 2/11" />
        <Linha icone={Icone.relogio(i)} rotulo="Horário" valor="10:00" />
        <Linha icone={Icone.recibo(i)} rotulo="Valor previsto" valor="R$ 40,00" />
        <Linha icone={Icone.pessoa(i)} rotulo="Cliente" valor={nome} />
        <Linha icone={Icone.telefone(i)} rotulo="Telefone" valor={telefoneOculto} />
      </div>
      <div style={{ height: 24 }} />
      <div style={{ padding: "0 20px" }}>
        <Botao texto="Confirmar agendamento" apertado={apertado} />
      </div>
      <Texto mt={14} centro tam={15}>
        O pagamento é combinado diretamente com a barbearia. O Fio não processa pagamentos.
      </Texto>
    </div>
  );
}

/** Tela de confirmação; `p` vai de 0 a 1 (o círculo entra, o certo se desenha, os raios abrem). */
export function PaginaConfirmado({ p }: { p: number }) {
  const circulo = Math.min(1, p * 2.2);
  const certo = Math.max(0, Math.min(1, (p - 0.3) * 2.5));
  const raios = Math.max(0, Math.min(1, (p - 0.4) * 2.5));
  return (
    <div style={{ background: C.fundo, paddingBottom: 200 }}>
      <Topo />
      <div style={{ height: 30 }} />
      <div style={{ height: 160, position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg width={260} height={160} viewBox="-130 -80 260 160" style={{ position: "absolute", overflow: "visible" }}>
          {[0, 45, 135, 180, 225, 315].map((a) => {
            const r1 = 70 + raios * 6;
            const r2 = r1 + 26 * raios;
            const rad = (a * Math.PI) / 180;
            return <line key={a} x1={Math.cos(rad) * r1} y1={Math.sin(rad) * r1} x2={Math.cos(rad) * r2} y2={Math.sin(rad) * r2} stroke="#d2bcab" strokeWidth={5} strokeLinecap="round" opacity={raios} />;
          })}
          <circle r={64 * circulo} fill="#8f4232" />
          <path d="M-22 2 L-6 18 L24 -14" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - certo} />
        </svg>
      </div>
      <div style={{ opacity: Math.min(1, p * 2) }}>
        <Titulo centro mt={22}>
          Agendamento confirmado
        </Titulo>
        <Texto centro tam={17}>
          <span style={{ color: C.texto }}>Nos vemos em breve na {BARBEARIA}.</span>
        </Texto>
        <div style={{ margin: "26px 20px 0", borderRadius: 18, border: `1.5px solid ${BORDA}`, background: "#f7f3ee", padding: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LogoBarbearia tam={70} />
            <div>
              <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 24, color: C.texto }}>{BARBEARIA}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.sans, fontSize: 15, color: T2 }}>{Icone.local({ tam: 16, cor: T2 })} São Paulo, SP</div>
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDA}`, display: "flex", gap: 14, fontFamily: F.sans }}>
            {Icone.tesoura({ tam: 22, cor: C.acento, traco: 1.6 })}
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", color: T2 }}>SERVIÇO</div>
              <div style={{ fontSize: 17, color: C.texto }}>Corte masculino</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- barbeiro ----------

/** Aviso que chega no celular do barbeiro (texto igual ao de src/lib/push/payload.ts). */
export function Notificacao({ nome, quando }: { nome: string; quando: string }) {
  return (
    <div style={{ width: 360, boxSizing: "border-box", borderRadius: 22, background: "rgba(250,248,245,0.97)", padding: "14px 16px", display: "flex", gap: 12, fontFamily: F.sans, boxShadow: "0 18px 40px -18px rgba(0,0,0,0.55)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: C.fundo, border: `1px solid ${BORDA}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Laco tamanho={28} cor={C.acento} espessura={3} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T2 }}>
          <span style={{ fontWeight: 600, color: C.texto }}>Fio</span>
          <span>agora</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.texto, marginTop: 2 }}>Novo agendamento</div>
        <div style={{ fontSize: 15, lineHeight: 1.3, color: C.texto, marginTop: 2 }}>
          {nome} · Corte masculino · {quando}
        </div>
      </div>
    </div>
  );
}

export type ItemAgenda = { h: string; fim: string; nome: string; serv: string };
export const AGENDA_PADRAO: ItemAgenda[] = [
  { h: "09:00", fim: "09:45", nome: "Bruno Almeida", serv: "Corte masculino • 45 min" },
  { h: "10:00", fim: "10:45", nome: "Matheus Lima", serv: "Corte masculino • 45 min" },
  { h: "11:00", fim: "11:30", nome: "Diego Souza", serv: "Barba • 30 min" },
];
/** y (na página) do cartão de cada cliente da agenda. */
export const Y_AGENDA = (i: number) => 392 + i * 112;

export function PaginaAgenda({ destaque = 0, novo = 1, itens = AGENDA_PADRAO, indiceDestaque = 1, data = "Segunda-feira, 2 de novembro" }: { destaque?: number; novo?: number; itens?: ItemAgenda[]; indiceDestaque?: number; data?: string }) {
  return (
    <div style={{ background: C.fundo, paddingBottom: 300, fontFamily: F.sans }}>
      <Topo corLaco={C.acento} />
      <div style={{ margin: "16px 20px 0", fontWeight: 700, fontSize: 38, letterSpacing: "-0.02em", color: C.texto, height: 46 }}>Agenda</div>
      <div style={{ margin: "8px 20px 0", fontSize: 17, lineHeight: 1.4, color: T2, height: 48 }}>Organize seus atendimentos e mantenha seu dia no ritmo certo.</div>
      <div style={{ margin: "26px 20px 0", display: "flex", gap: 9, height: 48 }}>
        {[Icone.voltar({ tam: 20 }), "Hoje", Icone.avancar({ tam: 20 })].map((c, i) => (
          <div key={i} style={{ width: i === 1 ? 84 : 48, height: 48, borderRadius: 14, border: `1.5px solid ${BORDA}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: C.texto }}>
            {c}
          </div>
        ))}
      </div>
      <div style={{ margin: "14px 28px 0", fontSize: 20, fontWeight: 600, color: C.texto, height: 28 }}>{data}</div>
      <div style={{ margin: "12px 20px 0", width: 176, height: 48, borderRadius: 14, border: `1.5px solid ${BORDA}`, background: "#fff", display: "flex", padding: 4, boxSizing: "border-box", fontSize: 17 }}>
        <div style={{ flex: 1, borderRadius: 10, background: C.acentoSuave, color: C.acentoForte, display: "flex", alignItems: "center", justifyContent: "center" }}>Dia</div>
        <div style={{ flex: 1.3, display: "flex", alignItems: "center", justifyContent: "center", color: C.texto }}>Semana</div>
      </div>
      <div style={{ position: "relative", height: 380, marginTop: 22 }}>
        {itens.map((a, i) => {
          const y = Y_AGENDA(i) - 382;
          const ehNovo = i === indiceDestaque;
          return (
            <React.Fragment key={a.h}>
              <div style={{ position: "absolute", left: 20, top: y, fontSize: 15, color: T2, fontVariantNumeric: "tabular-nums" }}>{a.h}</div>
              <div
                style={{
                  position: "absolute",
                  left: 82,
                  right: 20,
                  top: y,
                  height: 92,
                  boxSizing: "border-box",
                  borderRadius: 14,
                  border: "1px solid #f0d9d0",
                  borderLeft: `5px solid ${C.acento}`,
                  background: "#f9eeea",
                  padding: "12px 16px",
                  opacity: ehNovo ? novo : 1,
                  transform: ehNovo ? `scale(${1 + destaque * 0.04})` : undefined,
                  boxShadow: ehNovo && destaque > 0 ? `0 0 0 ${3 + destaque * 3}px rgba(176,81,58,${0.25 * destaque}), 0 16px 30px -14px rgba(176,81,58,${0.5 * destaque})` : undefined,
                }}
              >
                <div style={{ fontSize: 14, color: T2, fontVariantNumeric: "tabular-nums" }}>
                  {a.h} – {a.fim}
                </div>
                <div style={{ fontSize: 17, fontWeight: 500, color: C.texto, marginTop: 2 }}>{a.nome}</div>
                <div style={{ fontSize: 15, color: T2, marginTop: 1 }}>{a.serv}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
