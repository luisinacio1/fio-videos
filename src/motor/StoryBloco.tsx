import React from "react";
import { AbsoluteFill } from "remotion";
import { C, F, Laco } from "../base";
import { Cabeca, ELENCO, type Boca, type NomeElenco } from "../motion/Personagens";
import { ALTURA_TELA, BarraEndereco, BarraStatus, LARGURA_TELA, PaginaAgenda, PaginaConfirmado, PaginaHorario, PaginaServico } from "../motion/TelasFio";
import { ChatWhats, PaginaEquipe, PaginaLembretes, TelaBloqueio, mensagemLembrete } from "../motion/TelasPainel";
import { aviso } from "./cenas/App";
import type { AvisoSemEm } from "./roteiro";

/**
 * Stories de fim de funil, em blocos: cada bloco conta uma história sobre um tema em 5 quadros
 * (dor → prova → objeção → benefícios → chamada) e sai inteiro de uma vez, em sequência.
 * Mesmo visual dos reels: cores do Fio, personagens, telas reais do app. Texto entre y≈260 e y≈1560.
 */

export type TelaStory =
  | { nome: "aviso"; aviso: AvisoSemEm; hora?: string; data?: string }
  | { nome: "agenda"; destaque?: string }
  | { nome: "lembretes" }
  | { nome: "whats"; cliente?: string }
  | { nome: "link" }
  | { nome: "horarios" }
  | { nome: "confirmado" }
  | { nome: "equipe" };

export type QuadroStory =
  | { tipo: "dor"; titulo: string; destaque?: string; personagem?: NomeElenco; boca?: Boca }
  | { tipo: "prova"; titulo: string; destaque?: string; tela: TelaStory }
  | { tipo: "objecao"; objecao: string; resposta: string; destaque?: string; personagem?: NomeElenco }
  | { tipo: "beneficios"; titulo?: string }
  | { tipo: "chamada"; titulo: string; destaque?: string };

export type PropsStoryBloco = { tema: string; n: number; total: number; quadro: QuadroStory };

/** O que o Fio faz de verdade: a lista é fixa para nenhum story prometer o que não existe. */
export const BENEFICIOS = [
  "A gente monta tudo pra você em até 2 dias, sem custo",
  "Seu cliente marca sozinho, a qualquer hora, pelo link",
  "Sem baixar app e sem criar conta",
  "Aviso no celular a cada novo agendamento",
  "Às 18h, os lembretes de amanhã prontos pro seu WhatsApp",
  "O cliente cancela ou remarca pelo próprio link",
];

const CREME = "#f3ece4";
const OURO = "#f2c063";

/** Título grosso como a legenda dos reels, com um trecho em destaque. */
function Titulo({ texto, destaque, cor, corDestaque, tamanho = 92 }: { texto: string; destaque?: string; cor: string; corDestaque: string; tamanho?: number }) {
  const partes = destaque && texto.includes(destaque) ? texto.split(destaque) : [texto];
  return (
    <div style={{ fontFamily: F.sans, fontWeight: 900, fontSize: tamanho, lineHeight: 1.06, letterSpacing: "-0.025em", color: cor }}>
      {partes.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < partes.length - 1 && <span style={{ color: corDestaque }}>{destaque}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Topo de todos os quadros do bloco: tema e posição, para a sequência parecer uma história só. */
function Topo({ tema, n, total, claro, marca = true }: { tema: string; n: number; total: number; claro: boolean; marca?: boolean }) {
  const cor = claro ? C.texto : CREME;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: 250, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F.sans }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: F.serif, fontWeight: 600, fontSize: 40, color: cor, opacity: marca ? 1 : 0 }}>
        <Laco tamanho={52} cor={claro ? C.acento : OURO} espessura={2.8} />
        Fio
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: cor }}>
        {tema}
        <span style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} style={{ width: i + 1 === n ? 30 : 10, height: 10, borderRadius: 99, background: cor, opacity: i + 1 === n ? 1 : 0.3 }} />
          ))}
        </span>
      </div>
    </div>
  );
}

function Fundo({ tipo }: { tipo: "escuro" | "terracota" | "creme" }) {
  const bg =
    tipo === "escuro"
      ? `radial-gradient(1100px 900px at 80% 10%, rgba(176,81,58,0.42), transparent 60%), ${C.escuro}`
      : tipo === "terracota"
        ? `radial-gradient(120% 80% at 50% 30%, #c35f45 0%, ${C.acento} 45%, #7c3424 100%)`
        : `radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.14), transparent 60%), ${C.fundo}`;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 20, top: 500, opacity: tipo === "creme" ? 0.05 : 0.08 }}>
        <Laco tamanho={1040} cor={tipo === "creme" ? C.acento : CREME} espessura={1.4} />
      </div>
    </AbsoluteFill>
  );
}

/** Personagem do elenco do peito para cima; (x, y) é a base do pescoço. */
function Busto({ quem, x, y, escala = 1, boca = "neutra", olhar = [0, 4], sobrancelha = 0 }: { quem: NomeElenco; x: number; y: number; escala?: number; boca?: Boca; olhar?: [number, number]; sobrancelha?: number }) {
  const p = ELENCO[quem];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${x} ${y}) scale(${escala}) translate(-540 -1100)`}>
        <rect x={490} y={990} width={100} height={140} rx={34} fill={p.cabeca.sombra} />
        <path d="M300 1920 L300 1300 C300 1180 400 1112 480 1100 L600 1100 C680 1112 780 1180 780 1300 L780 1920 Z" fill={p.roupa} />
        <path d="M480 1100 Q540 1150 600 1100" stroke={p.sombraRoupa} strokeWidth={10} fill="none" strokeLinecap="round" />
        <g transform="translate(540 872) scale(1.25) translate(-150 -190)">
          <Cabeca {...p.cabeca} olhar={olhar} boca={boca} sobrancelha={sobrancelha} />
        </g>
      </g>
    </svg>
  );
}

/** A tela pedida, parada no momento que importa. */
export function Tela({ t }: { t: TelaStory }) {
  switch (t.nome) {
    case "aviso":
      return <TelaBloqueio hora={t.hora ?? "18:00"} data={t.data ?? "quinta-feira, 5 de novembro"} avisos={[{ aviso: aviso(t.aviso), p: 1 }]} />;
    case "agenda":
      return (
        <>
          <div style={{ transform: "translateY(26px)" }}>
            <PaginaAgenda destaque={t.destaque ? 1 : 0} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
            <BarraStatus hora="10:52" />
          </div>
        </>
      );
    case "lembretes":
      return (
        <>
          <div style={{ transform: "translateY(26px)" }}>
            <PaginaLembretes
              itens={[
                { hora: "09:00", nome: "Bruno Almeida", servico: "Corte masculino", lembrado: "18:02" },
                { hora: "10:00", nome: "Matheus Lima", servico: "Corte masculino", lembrado: "18:03" },
                { hora: "11:00", nome: "Diego Souza", servico: "Barba" },
                { hora: "14:30", nome: "Carlos Pereira", servico: "Corte + barba" },
              ]}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
            <BarraStatus hora="18:01" />
          </div>
        </>
      );
    case "whats": {
      const nome = t.cliente ?? "Bruno Almeida";
      return <ChatWhats contato={nome} mensagem={mensagemLembrete(nome, "09:00", "Corte masculino")} />;
    }
    case "equipe":
      return (
        <>
          <div style={{ transform: "translateY(26px)" }}>
            <PaginaEquipe
              equipe={[
                { nome: "Rafa Oliveira", servicos: "Corte masculino, Barba, Corte + barba", comissao: 0, dono: true },
                { nome: "Juninho Santos", servicos: "Corte masculino, Barba", comissao: 186000 },
                { nome: "Léo Martins", servicos: "Corte masculino, Corte + barba", comissao: 152400 },
              ]}
            />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
            <BarraStatus hora="21:30" />
          </div>
        </>
      );
    default:
      return (
        <>
          <BarraStatus hora="23:07" />
          <BarraEndereco url="agendafio.com.br/barbearia-do-rafa" />
          <div style={{ position: "absolute", left: 0, top: 82, width: LARGURA_TELA, height: ALTURA_TELA - 82, overflow: "hidden" }}>
            {t.nome === "horarios" ? (
              <div style={{ transform: "translateY(-380px)" }}>
                <PaginaHorario dia hora />
              </div>
            ) : t.nome === "confirmado" ? (
              <PaginaConfirmado p={1} />
            ) : (
              <div style={{ transform: "translateY(-230px)" }}>
                <PaginaServico escolhido />
              </div>
            )}
          </div>
        </>
      );
  }
}

/** Celular inteiro, igual ao dos reels, com a base saindo do quadro. */
function Celular({ t, top = 640, escala = 1.32 }: { t: TelaStory; top?: number; escala?: number }) {
  const M = 12;
  return (
    <div style={{ position: "absolute", left: 540 - (LARGURA_TELA * escala) / 2, top, transformOrigin: "0 0", transform: `scale(${escala}) rotate(-2deg)` }}>
      <div style={{ position: "absolute", left: -M, top: -M, width: LARGURA_TELA + M * 2, height: ALTURA_TELA + M * 2, borderRadius: 58, background: "linear-gradient(140deg, #3a332d, #15110e 40%, #2b2520)", boxShadow: "0 40px 60px -20px rgba(20,8,4,0.6), inset 0 0 0 1.5px rgba(255,255,255,0.12)" }} />
      <div style={{ position: "relative", width: LARGURA_TELA, height: ALTURA_TELA, borderRadius: 47, overflow: "hidden", background: C.fundo }}>
        <Tela t={t} />
        <div style={{ position: "absolute", left: LARGURA_TELA / 2 - 46, top: 4, width: 92, height: 22, borderRadius: 99, background: "#0b0908" }} />
      </div>
    </div>
  );
}

function Selo({ children, cor = C.escuro, texto = CREME }: { children: React.ReactNode; cor?: string; texto?: string }) {
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: cor, color: texto, borderRadius: 999, padding: "20px 36px", fontFamily: F.sans, fontWeight: 800, fontSize: 44 }}>{children}</div>;
}

export function StoryBloco({ tema, n, total, quadro: q }: PropsStoryBloco) {
  if (q.tipo === "dor") {
    return (
      <AbsoluteFill>
        <Fundo tipo="escuro" />
        <Topo tema={tema} n={n} total={total} claro={false} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 400 }}>
          <Titulo texto={q.titulo} destaque={q.destaque} cor={CREME} corDestaque={OURO} tamanho={104} />
        </div>
        <div style={{ position: "absolute", left: 90, top: 980, width: 900, height: 900, borderRadius: 999, background: "radial-gradient(circle, rgba(176,81,58,0.55), rgba(176,81,58,0) 65%)" }} />
        <Busto quem={q.personagem ?? "rafa"} x={540} y={1420} escala={0.95} boca={q.boca ?? "torta"} olhar={[10, -6]} sobrancelha={10} />
      </AbsoluteFill>
    );
  }
  if (q.tipo === "prova") {
    return (
      <AbsoluteFill>
        <Fundo tipo="terracota" />
        <Topo tema={tema} n={n} total={total} claro={false} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 370 }}>
          <Titulo texto={q.titulo} destaque={q.destaque} cor={CREME} corDestaque={OURO} tamanho={72} />
        </div>
        <Celular t={q.tela} />
      </AbsoluteFill>
    );
  }
  if (q.tipo === "objecao") {
    return (
      <AbsoluteFill>
        <Fundo tipo="creme" />
        <Topo tema={tema} n={n} total={total} claro />
        <div style={{ position: "absolute", left: 80, right: 140, top: 400 }}>
          <div style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 700, letterSpacing: "0.12em", color: C.texto2, marginBottom: 18 }}>VOCÊ PODE ESTAR PENSANDO:</div>
          <div style={{ position: "relative", display: "inline-block", background: "#fff", borderRadius: "40px 40px 40px 8px", padding: "34px 42px", boxShadow: "0 20px 40px -20px rgba(31,27,23,0.35)", fontFamily: F.sans, fontWeight: 700, fontSize: 52, lineHeight: 1.2, color: C.texto }}>
            “{q.objecao}”
          </div>
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 860 }}>
          <Titulo texto={q.resposta} destaque={q.destaque} cor={C.texto} corDestaque={C.acento} tamanho={88} />
        </div>
        <Busto quem={q.personagem ?? "rafa"} x={830} y={1640} escala={0.6} boca="sorriso" olhar={[-12, -4]} />
      </AbsoluteFill>
    );
  }
  if (q.tipo === "beneficios") {
    return (
      <AbsoluteFill>
        <Fundo tipo="escuro" />
        <Topo tema={tema} n={n} total={total} claro={false} />
        <div style={{ position: "absolute", left: 80, right: 80, top: 400 }}>
          <Titulo texto={q.titulo ?? "O que o Fio faz por você"} destaque="Fio" cor={CREME} corDestaque={OURO} tamanho={84} />
          <div style={{ marginTop: 64, display: "flex", flexDirection: "column", gap: 42 }}>
            {BENEFICIOS.map((b) => (
              <div key={b} style={{ display: "flex", gap: 24, alignItems: "flex-start", fontFamily: F.sans, fontSize: 50, fontWeight: 600, lineHeight: 1.2, color: CREME }}>
                <span style={{ flexShrink: 0, marginTop: 4, width: 50, height: 50, borderRadius: 99, background: C.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {b}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 76 }}>
            <Selo cor={C.acento}>7 dias grátis · sem cartão</Selo>
          </div>
        </div>
      </AbsoluteFill>
    );
  }
  // chamada
  return (
    <AbsoluteFill>
      <Fundo tipo="terracota" />
      <Topo tema={tema} n={n} total={total} claro={false} marca={false} />
      {/* seta para o nome do perfil, no canto de cima do story */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <path d="M330 640 C 300 460, 250 300, 170 175" stroke={OURO} strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray="2 26" />
        <path d="M140 220 L165 160 L220 195" stroke={OURO} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 80, right: 80, top: 700 }}>
        <Titulo texto={q.titulo} destaque={q.destaque} cor={CREME} corDestaque={OURO} tamanho={100} />
        <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 22, alignItems: "flex-start" }}>
          <Selo>7 dias grátis · sem cartão</Selo>
          <Selo cor={CREME} texto={C.texto}>Toque no perfil → link na bio</Selo>
        </div>
      </div>
      <Busto quem="rafa" x={800} y={1700} escala={0.55} boca="sorriso" olhar={[-14, -10]} />
    </AbsoluteFill>
  );
}
