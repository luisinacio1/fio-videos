import React from "react";
import { C, F, Laco } from "../base";
import { ALTURA_TELA, BarraStatus, Botao, Icone, LARGURA_TELA, Topo } from "./TelasFio";

/**
 * Mais telas do barbeiro para o motor dos vídeos diários, copiadas do app:
 * lembretes (src/app/painel/lembretes), WhatsApp com a mensagem pronta (src/lib/agenda/mensagens.ts),
 * equipe com a comissão do mês (src/app/painel/equipe), celular bloqueado com os avisos (src/lib/push/payload.ts)
 * e a janela "Atendimento realizado" da agenda.
 */

const T2 = C.texto2;
const BORDA = C.divisoria;

function TituloPainel({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <>
      <div style={{ padding: "16px 20px 0", fontFamily: F.sans, fontWeight: 700, fontSize: 38, letterSpacing: "-0.02em", color: C.texto, height: 46 }}>{titulo}</div>
      <div style={{ padding: "12px 20px 0", fontFamily: F.sans, fontSize: 17, lineHeight: 1.4, color: T2 }}>{descricao}</div>
    </>
  );
}

const Balao = ({ tam = 20, cor = "#fff" }: { tam?: number; cor?: string }) => (
  <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

export type ItemLembrete = { hora: string; nome: string; servico: string; lembrado?: string };
/** y (na página) do botão "Lembrar no WhatsApp" de cada cliente. */
export const Y_LEMBRETE = (i: number) => 64 + 150 + 8 + 70 + i * 158 + 16 + 52 + 14 + 24;

/** /painel/lembretes: clientes de amanhã, cada um com o botão do WhatsApp. */
export function PaginaLembretes({ itens, apertado = -1 }: { itens: ItemLembrete[]; apertado?: number }) {
  const feitos = itens.filter((i) => i.lembrado).length;
  return (
    <div style={{ background: C.fundo, paddingBottom: 300, fontFamily: F.sans }}>
      <Topo corLaco={C.acento} />
      <div style={{ height: 150 }}>
        <TituloPainel titulo="Lembretes" descricao="Avise os clientes pelo seu WhatsApp, com a mensagem pronta. Quem já foi avisado fica marcado." />
      </div>
      <div style={{ margin: "8px 20px 0", borderRadius: 18, border: `1.5px solid ${BORDA}`, background: "#fff", padding: "0 20px" }}>
        <div style={{ height: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: C.texto }}>Amanhã</span>
          <span style={{ fontSize: 16, color: T2 }}>{feitos === itens.length ? "Todos avisados" : `${feitos} de ${itens.length} avisados`}</span>
        </div>
        {itens.map((i, k) => (
          <div key={k} style={{ height: 158, boxSizing: "border-box", borderTop: `1px solid ${BORDA}`, paddingTop: 16 }}>
            <div style={{ display: "flex", gap: 16, height: 52 }}>
              <span style={{ width: 54, fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: C.texto }}>{i.hora}</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 500, color: C.texto }}>{i.nome}</div>
                <div style={{ fontSize: 16, color: T2 }}>{i.servico}</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              {i.lembrado ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14, height: 48 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.okSuave, color: C.ok, borderRadius: 999, padding: "6px 12px", fontSize: 14, fontWeight: 600 }}>
                    {Icone.certo({ tam: 14, cor: C.ok, traco: 2.6 })} Lembrado às {i.lembrado}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, textDecoration: "underline", color: C.texto }}>Mandar de novo</span>
                </div>
              ) : (
                <div
                  style={{
                    height: 48,
                    borderRadius: 14,
                    background: apertado === k ? C.acentoForte : C.acento,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    fontSize: 17,
                    fontWeight: 600,
                    transform: `scale(${apertado === k ? 0.97 : 1})`,
                  }}
                >
                  <Balao /> Lembrar no WhatsApp
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mensagem de lembrete exatamente como o Fio monta (mensagemLembrete em src/lib/agenda/mensagens.ts). */
export const mensagemLembrete = (nome: string, hora: string, servico: string) =>
  `Oi, ${nome.split(" ")[0]}! Lembrete do seu horário na Barbearia do Rafa: amanhã, às ${hora}, ${servico}. Se precisar remarcar ou cancelar: agendafio.com.br/barbearia-do-rafa/agendamento/…`;

/** A conversa que abre no WhatsApp do barbeiro, com a mensagem do Fio já escrita; `enviada` de 0 a 1. */
/** parte da tela que aparece quando o celular ocupa o vídeo inteiro (1920 de altura em 390 de largura) */
export const ALTURA_VISIVEL = Math.floor((1920 * LARGURA_TELA) / 1080);

export function ChatWhats({ contato, mensagem, enviada = 0 }: { contato: string; mensagem: string; enviada?: number }) {
  return (
    <div style={{ width: LARGURA_TELA, height: ALTURA_TELA, background: "#efeae2", fontFamily: F.sans, position: "relative", overflow: "hidden" }}>
      <BarraStatus hora="18:02" />
      <div style={{ height: 62, background: "#f7f5f2", display: "flex", alignItems: "center", gap: 12, padding: "0 14px", borderBottom: "1px solid #e2ddd6" }}>
        {Icone.voltar({ tam: 24, cor: "#1f1b17" })}
        <div style={{ width: 40, height: 40, borderRadius: 99, background: "#c9bcb0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{contato[0]}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#1f1b17" }}>{contato}</div>
      </div>
      {enviada > 0 && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 120,
            width: 290,
            background: "#d9fdd3",
            borderRadius: "14px 4px 14px 14px",
            padding: "10px 12px 24px",
            fontSize: 16,
            lineHeight: 1.38,
            color: "#1f1b17",
            boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
            transform: `translateY(${(1 - enviada) * 420}px)`,
            opacity: Math.min(1, enviada * 2),
          }}
        >
          {mensagem}
          <span style={{ position: "absolute", right: 10, bottom: 5, fontSize: 11, color: "#53a3e0" }}>18:02 ✓✓</span>
        </div>
      )}
      <div style={{ position: "absolute", left: 8, right: 8, bottom: 30, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <div style={{ flex: 1, minHeight: 50, borderRadius: 24, background: "#fff", padding: "12px 16px", fontSize: 16, lineHeight: 1.38, color: "#1f1b17", boxSizing: "border-box" }}>
          {enviada > 0 ? <span style={{ color: "#8a8580" }}>Mensagem</span> : mensagem}
        </div>
        <div style={{ width: 50, height: 50, borderRadius: 99, background: C.whats, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="#fff">
            <path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export type Profissional = { nome: string; servicos: string; comissao: number; dono?: boolean };
export const brl = (centavos: number) => `R$ ${(centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** /painel/equipe (dono): cada profissional com a comissão do mês; `progresso` faz os valores subirem. */
export function PaginaEquipe({ equipe, progresso = 1, mes = "novembro" }: { equipe: Profissional[]; progresso?: number; mes?: string }) {
  return (
    <div style={{ background: C.fundo, paddingBottom: 300, fontFamily: F.sans }}>
      <Topo corLaco={C.acento} />
      <div style={{ height: 150 }}>
        <TituloPainel titulo="Equipe" descricao="Profissionais que fazem a Barbearia do Rafa acontecer." />
      </div>
      <div style={{ margin: "8px 20px 0", borderRadius: 18, border: `1.5px solid ${BORDA}`, background: "#fff", padding: "0 16px" }}>
        {equipe.map((p, k) => (
          <div key={k} style={{ height: 150, boxSizing: "border-box", borderTop: k ? `1px solid ${BORDA}` : "none", paddingTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 54, height: 54, borderRadius: 99, background: C.acentoSuave, color: C.acentoForte, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17 }}>
                {p.nome
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.texto }}>{p.nome}</div>
                {p.dono && <div style={{ fontSize: 14, color: T2 }}>Dono</div>}
              </div>
              <span style={{ background: C.okSuave, color: C.ok, borderRadius: 999, padding: "4px 12px", fontSize: 14, fontWeight: 600 }}>Ativo</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 15, color: T2 }}>{p.servicos}</div>
            <div style={{ marginTop: 4, fontSize: 16, color: T2 }}>
              Comissão em {mes}: <span style={{ color: C.texto, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.dono ? "—" : brl(Math.round((p.comissao * progresso) / 100) * 100)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type Aviso = { titulo: string; texto: string; quando?: string };
/** Os avisos que o Fio manda de verdade (src/lib/push/payload.ts). */
export const AVISOS = {
  novo: (nome: string, servico = "Corte masculino", quando = "seg 02/11 às 10:00"): Aviso => ({ titulo: "Novo agendamento", texto: `${nome} · ${servico} · ${quando}` }),
  lembretes: (n: number): Aviso => ({
    titulo: "Lembretes de amanhã",
    texto: n === 1 ? "Você tem 1 cliente para lembrar amanhã. Toque para mandar pelo WhatsApp." : `Você tem ${n} clientes para lembrar amanhã. Toque para mandar pelo WhatsApp.`,
  }),
  cliente: (hora: string, quando: "hoje" | "amanhã" = "hoje", servico = "Corte masculino"): Aviso => ({
    titulo: `Seu horário é ${quando} às ${hora}`,
    texto: `${servico} na Barbearia do Rafa. Precisa remarcar ou cancelar? Toque para ver.`,
  }),
  cancelado: (nome: string, servico = "Corte masculino", quando = "seg 02/11 às 10:00"): Aviso => ({ titulo: "Agendamento cancelado pelo cliente", texto: `${nome} · ${servico} · ${quando}` }),
};

/** Celular bloqueado, com os avisos chegando (cada um com seu `p` de 0 a 1). */
export function TelaBloqueio({ hora, data, avisos }: { hora: string; data: string; avisos: { aviso: Aviso; p: number }[] }) {
  return (
    <div style={{ width: LARGURA_TELA, height: ALTURA_TELA, background: "linear-gradient(180deg, #2a1d17 0%, #4a2a20 55%, #8f4232 100%)", fontFamily: F.sans, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", opacity: 0.16 }}>
        <Laco tamanho={240} cor="#f3ece4" espessura={2} />
      </div>
      <BarraStatus hora="" escura />
      <div style={{ textAlign: "center", marginTop: 40, color: "#f3ece4" }}>
        <div style={{ fontSize: 17, fontWeight: 500 }}>{data}</div>
        <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{hora}</div>
      </div>
      <div style={{ position: "absolute", left: 15, right: 15, top: 220, display: "flex", flexDirection: "column", gap: 10 }}>
        {avisos.map(({ aviso, p }, i) =>
          p <= 0 ? null : (
            <div key={i} style={{ transform: `translateY(${(1 - p) * -40}px) scale(${0.92 + p * 0.08})`, opacity: Math.min(1, p * 2) }}>
              <div style={{ boxSizing: "border-box", borderRadius: 22, background: "rgba(250,248,245,0.96)", padding: "13px 15px", display: "flex", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.fundo, border: `1px solid ${BORDA}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Laco tamanho={28} cor={C.acento} espessura={3} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T2 }}>
                    <span style={{ fontWeight: 600, color: C.texto }}>Fio</span>
                    <span>{aviso.quando ?? "agora"}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.texto, marginTop: 2 }}>{aviso.titulo}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.3, color: C.texto, marginTop: 2 }}>{aviso.texto}</div>
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

const FORMAS = ["PIX", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Outro"];
/** topo das janelas da agenda (no meio da tela, como o diálogo do app) e onde ficam os botões delas */
export const JANELA = { topo: 110, botaoDetalhe: 126, pix: { x: 48, y: 185 }, confirmar: 348 };

function Janela({ p, altura, children }: { p: number; altura: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(31,27,23,${0.4 * p})` }}>
      <div style={{ position: "absolute", left: 16, right: 16, top: JANELA.topo, height: altura, boxSizing: "border-box", transform: `scale(${0.92 + 0.08 * p})`, opacity: p, background: C.fundo, borderRadius: 24, padding: "24px 20px 0", fontFamily: F.sans, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)" }}>
        {children}
      </div>
    </div>
  );
}

/** Detalhe do agendamento com o botão "Marcar como realizado" (`p` de 0 a 1). */
export function JanelaDetalhe({ nome, horario, servico, p, apertado }: { nome: string; horario: string; servico: string; p: number; apertado?: boolean }) {
  return (
    <Janela p={p} altura={176}>
      <div style={{ height: 30, fontSize: 22, fontWeight: 700, color: C.texto }}>{nome}</div>
      <div style={{ marginTop: 6, height: 22, fontSize: 16, color: T2 }}>
        {horario} · {servico}
      </div>
      <div style={{ marginTop: 18, height: 52, borderRadius: 14, background: apertado ? C.acentoForte : C.acento, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600 }}>Marcar como realizado</div>
    </Janela>
  );
}

/** Janela "Atendimento realizado" da agenda (`p` de 0 a 1). */
export function JanelaRealizado({ nome, servico, valor, p, forma, apertado }: { nome: string; servico: string; valor: string; p: number; forma?: boolean; apertado?: boolean }) {
  return (
    <Janela p={p} altura={402}>
      <div style={{ height: 34, fontSize: 24, fontWeight: 700, color: C.texto }}>Atendimento realizado</div>
      <div style={{ marginTop: 8, height: 48, fontSize: 16, lineHeight: 1.45, color: T2 }}>
        {nome} · {servico} · {valor}. A receita entra em Transações.
      </div>
      <div style={{ marginTop: 16, height: 24, fontSize: 17, fontWeight: 500, color: C.texto }}>Como o cliente pagou?</div>
      <div style={{ marginTop: 12, height: 136, display: "flex", gap: 8, flexWrap: "wrap", alignContent: "flex-start" }}>
        {FORMAS.map((x, i) => (
          <span key={x} style={{ height: 38, boxSizing: "border-box", borderRadius: 999, padding: "8px 14px", fontSize: 15, border: `1.5px solid ${forma && i === 0 ? C.acento : BORDA}`, background: forma && i === 0 ? C.acentoSuave : "#fff", color: forma && i === 0 ? C.acentoForte : C.texto }}>
            {x}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Botao texto="Confirmar" apertado={apertado ? 1 : 0} />
      </div>
    </Janela>
  );
}

/** Aviso verde no topo ("Atendimento realizado."), como o toast do app. */
export function Toast({ texto, p }: { texto: string; p: number }) {
  if (p <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 20, right: 20, top: 30, transform: `translateY(${(1 - p) * -80}px)`, opacity: p, display: "flex", alignItems: "center", gap: 10, background: C.texto, color: "#fff", borderRadius: 16, padding: "14px 16px", fontFamily: F.sans, fontSize: 16, fontWeight: 500, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.5)" }}>
      <span style={{ width: 24, height: 24, borderRadius: 99, background: C.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>{Icone.certo({ tam: 14, cor: "#fff", traco: 3 })}</span>
      {texto}
    </div>
  );
}
