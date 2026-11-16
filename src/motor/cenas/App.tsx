import React, { createContext, useContext, useMemo } from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, Laco } from "../../base";
import { cameraEm, type Chave } from "../../motion/camera";
import {
  AGENDA_PADRAO,
  ALTURA_TELA,
  ALVOS,
  BarraEndereco,
  BarraStatus,
  LARGURA_TELA,
  PaginaAgenda,
  PaginaConfirmado,
  PaginaDados,
  PaginaHorario,
  PaginaRevisao,
  PaginaServico,
  Y_AGENDA,
  type ItemAgenda,
} from "../../motion/TelasFio";
import { AVISOS, ChatWhats, JANELA, JanelaDetalhe, JanelaRealizado, PaginaEquipe, PaginaLembretes, TelaBloqueio, Toast, Y_LEMBRETE, brl, mensagemLembrete, type Aviso } from "../../motion/TelasPainel";
import type { AvisoSemEm, Cena, TelaApp } from "../roteiro";
import { Som, entre, mola, sai, useCena } from "../util";

/** escala das telas do app ocupando o vídeo (390 → 1080) */
export const KT = 1080 / LARGURA_TELA;

// ---------- o celular em cena ----------

/** zoom do celular inteiro na tela e do close no ponto tocado */
const S_LONGE = 1.45;
const S_PERTO = 1.72;
/** moldura do aparelho, em px da tela */
const MOLDURA = 12;
/** altura do quadro onde fica o ponto que importa (acima da legenda) */
const ALVO_Y = 700;
/** o celular nunca desce do topo nem sobe a base além disso (a legenda fica embaixo, no fundo) */
const TOPO_MAX = 170;
const BASE_MIN = 1440;

type Toque = { f: number; x: number; y: number };

/** centro (em px da tela) que a câmera pode usar com esse zoom sem mostrar fundo demais */
function limita(x: number, y: number, s: number) {
  const meio = LARGURA_TELA / 2;
  const xs = meio + (x - meio) * 0.35;
  const yMin = (ALVO_Y - TOPO_MAX) / s;
  const yMax = (ALVO_Y - BASE_MIN) / s + ALTURA_TELA;
  return { x: xs, y: yMin > yMax ? (yMin + yMax) / 2 : Math.min(yMax, Math.max(yMin, y)) };
}

/** Chaves da câmera: de longe no começo, chega perto antes de cada toque e volta quando há uma pausa. */
function chavesDoFoco(focos: Toque[], dur: number): Chave[] {
  const longe = (f: number): Chave => ({ f, ...limita(LARGURA_TELA / 2, ALTURA_TELA / 2, S_LONGE), s: S_LONGE });
  const ks: Chave[] = [longe(0)];
  const poe = (k: Chave) => {
    const f = Math.max(k.f, ks[ks.length - 1].f + 8);
    if (f < dur) ks.push({ ...k, f });
  };
  const lista = [...focos].filter((x) => Number.isFinite(x.f)).sort((a, b) => a.f - b.f);
  lista.forEach((a, i) => {
    const perto: Chave = { f: a.f - 6, ...limita(a.x, a.y, S_PERTO), s: S_PERTO };
    poe(perto);
    const prox = lista[i + 1];
    if (!prox || prox.f - a.f > 55) {
      poe({ ...perto, f: a.f + 16 });
      poe(longe(a.f + 38));
    }
  });
  // sem toque nenhum: aproxima devagar, para a tela nunca ficar parada
  if (ks.length === 1) ks.push({ ...longe(dur), s: S_LONGE * 1.07 });
  return ks;
}

/** Fundo das telas do app: terracota com luz suave andando e o laço bem apagado. */
function Palco({ f }: { f: number }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 38%, #c35f45 0%, ${C.acento} 45%, #7c3424 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 160 + Math.sin(f / 70) * 120, top: 120 + Math.cos(f / 90) * 80, width: 900, height: 900, borderRadius: 999, background: "radial-gradient(circle, rgba(242,192,99,0.28), rgba(242,192,99,0) 65%)" }} />
      <div style={{ position: "absolute", left: -260 + Math.cos(f / 80) * 90, top: 1100 + Math.sin(f / 60) * 70, width: 1000, height: 1000, borderRadius: 999, background: "radial-gradient(circle, rgba(26,21,17,0.35), rgba(26,21,17,0) 65%)" }} />
      <div style={{ position: "absolute", left: 540 - 520, top: 960 - 520, opacity: 0.09, transform: `rotate(${f / 12}deg)` }}>
        <Laco tamanho={1040} cor="#f3ece4" espessura={1.4} />
      </div>
    </AbsoluteFill>
  );
}

/** Celular parado num canto do quadro (x, y = canto de cima da tela, em px do vídeo; s = escala), sem a câmera seguir os toques. */
export type Enquadre = { x: number; y: number; s: number };
const ContextoEnquadre = createContext<Enquadre | null>(null);
/** Outra cena (a apresentaFio) usa as mesmas telas do app com o celular parado onde ela quiser. */
export const ProvedorEnquadre = ContextoEnquadre.Provider;

/**
 * A tela do app dentro de um celular de verdade, num palco nas cores do Fio.
 * A câmera mostra o aparelho inteiro e chega perto de cada toque (`focos`), sem nunca esticar a tela até a borda.
 * Dentro de um ProvedorEnquadre, o celular fica parado no lugar pedido (só chega e flutua devagar).
 */
export function TelaCheia({ children, focos = [] }: { children: React.ReactNode; focos?: Toque[] }) {
  const { f, dur } = useCena();
  const fixo = useContext(ContextoEnquadre);
  const chaves = useMemo(() => chavesDoFoco(focos, dur), [focos, dur]);
  const v = cameraEm(f, chaves);
  const antes = cameraEm(f - 1, chaves);
  // chegada: o aparelho sobe e se endireita
  const chega = mola(f, 0, { damping: 15, stiffness: 120 });
  const s = (fixo ? fixo.s : v.s) * (0.88 + 0.12 * chega);
  // inclina um pouco para o lado em que a câmera anda e flutua devagar
  const inclina = (fixo ? 0 : Math.max(-2.5, Math.min(2.5, (v.x - antes.x) * 0.6))) + (1 - chega) * -5 + Math.sin(f / 45) * 0.5;
  // parado: cresce em volta do meio da tela
  const ox = fixo ? fixo.x + ((fixo.s - s) * LARGURA_TELA) / 2 : 540 - s * v.x;
  const oy = (fixo ? fixo.y + ((fixo.s - s) * ALTURA_TELA) / 2 : ALVO_Y - s * v.y) + (1 - chega) * 260 + Math.sin(f / 38) * 6;
  const L = LARGURA_TELA + MOLDURA * 2;
  const A = ALTURA_TELA + MOLDURA * 2;
  return (
    <AbsoluteFill>
      <Palco f={f} />
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${ox}px, ${oy}px) scale(${s}) translate(${LARGURA_TELA / 2}px, ${ALTURA_TELA / 2}px) rotate(${inclina}deg) translate(${-LARGURA_TELA / 2}px, ${-ALTURA_TELA / 2}px)` }}>
        <div style={{ position: "absolute", left: -MOLDURA, top: -MOLDURA, width: L, height: A, borderRadius: 58, background: "linear-gradient(140deg, #3a332d, #15110e 40%, #2b2520)", boxShadow: "0 40px 60px -20px rgba(20,8,4,0.6), 0 12px 24px -8px rgba(20,8,4,0.4), inset 0 0 0 1.5px rgba(255,255,255,0.12)" }} />
        <div style={{ position: "absolute", left: -MOLDURA - 2.5, top: 150, width: 3, height: 60, borderRadius: 2, background: "#2b2520" }} />
        <div style={{ position: "absolute", left: L - MOLDURA - 0.5, top: 190, width: 3, height: 90, borderRadius: 2, background: "#2b2520" }} />
        <div style={{ position: "relative", width: LARGURA_TELA, height: ALTURA_TELA, borderRadius: 47, overflow: "hidden", background: C.fundo }}>
          {children}
          <div style={{ position: "absolute", left: LARGURA_TELA / 2 - 46, top: 4, width: 92, height: 22, borderRadius: 99, background: "#0b0908" }} />
          <div style={{ position: "absolute", left: LARGURA_TELA / 2 - 62, bottom: 7, width: 124, height: 4.5, borderRadius: 99, background: "rgba(31,27,23,0.35)" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** O dedo: aparece antes de cada toque, aperta, solta uma onda e some quando fica parado. */
function Dedo({ f, toques }: { f: number; toques: Toque[] }) {
  if (!toques.length) return null;
  const prox = toques.find((t) => t.f + 6 >= f) ?? toques[toques.length - 1];
  const i = toques.indexOf(prox);
  const antes = toques[Math.max(0, i - 1)];
  const k = i === 0 ? 1 : entre(f, prox.f - 8, prox.f - 1);
  const x = antes.x + (prox.x - antes.x) * k;
  const y = antes.y + (prox.y - antes.y) * k;
  const ultimo = [...toques].reverse().find((t) => t.f <= f);
  const proximo = toques.find((t) => t.f > f);
  const visivel = Math.max(ultimo ? 1 - entre(f, ultimo.f + 6, ultimo.f + 12) : 0, proximo ? entre(f, proximo.f - 14, proximo.f - 8) : 0);
  const aperta = f >= prox.f - 1 && f < prox.f + 3 ? 0.78 : 1;
  const onda = ultimo ? entre(f, ultimo.f, ultimo.f + 12) : 1;
  return (
    <>
      {ultimo && onda < 1 && <div style={{ position: "absolute", left: ultimo.x - 30, top: ultimo.y - 30, width: 60, height: 60, borderRadius: 99, border: `3px solid ${C.acento}`, transform: `scale(${0.4 + onda * 1.4})`, opacity: 1 - onda }} />}
      {visivel > 0 && (
        <div
          style={{
            position: "absolute",
            left: x - 17,
            top: y - 17,
            width: 34,
            height: 34,
            borderRadius: 99,
            background: "rgba(31,27,23,0.35)",
            border: "3px solid rgba(255,255,255,0.95)",
            boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
            transform: `scale(${aperta * visivel})`,
          }}
        />
      )}
    </>
  );
}

// ---------- o cliente marcando pelo link ----------

const TOPO_PAGINA = 82;
type Passo = "servico" | "horario" | "dados" | "revisao" | "confirmado";

function Agendamento({ t }: { t: Extract<TelaApp, { nome: "agendamento" }> }) {
  const { f, dur, em } = useCena();
  const auto = (k: number) => Math.round(dur * k);
  const servico = em(t.toques?.servico, auto(0.16));
  const dia = Math.max(em(t.toques?.dia, auto(0.32)), servico + 22);
  const horario = Math.max(em(t.toques?.horario, auto(0.42)), dia + 10);
  const nome = Math.max(em(t.toques?.nome, auto(0.54)), horario + 20);
  const NOME = t.cliente ?? "Matheus Lima";
  const TEL = t.telefone ?? "(11) 95432-1098";
  // digita mais rápido quando a narração dá pouco tempo entre o nome e o "confirmado"
  const alvoConfirmado = em(t.toques?.confirmar, auto(0.9));
  const porLetra = Math.min(2, Math.max(0.7, (alvoConfirmado - nome - 30) / (NOME.length + TEL.length)));
  const telefone = Math.max(em(t.toques?.telefone, nome + Math.ceil(NOME.length * porLetra) + 4), nome + Math.ceil(NOME.length * porLetra) + 4);
  const confirmado = Math.max(alvoConfirmado, telefone + Math.ceil(TEL.length * porLetra) + 22);
  const P = {
    continuar1: servico + 10,
    passoHorario: servico + 12,
    continuar2: horario + 12,
    passoDados: horario + 15,
    revisar: confirmado - 19,
    passoRevisao: confirmado - 16,
    confirmar: confirmado - 5,
    passoConfirmado: confirmado - 1,
  };
  const PASSOS: { de: number; tela: Passo }[] = [
    { de: 0, tela: "servico" },
    { de: P.passoHorario, tela: "horario" },
    { de: P.passoDados, tela: "dados" },
    { de: P.passoRevisao, tela: "revisao" },
    { de: P.passoConfirmado, tela: "confirmado" },
  ];
  const rolagem = (tela: Passo) => {
    if (tela === "servico") return entre(f, 4, 18, [0, 230]) + entre(f, servico + 3, P.continuar1 - 3, [0, 364]);
    if (tela === "horario") return 380 + entre(f, horario + 3, P.continuar2 - 2, [0, 260]);
    if (tela === "dados") return 160 + entre(f, P.revisar - 10, P.revisar - 3, [0, 240]);
    if (tela === "revisao") return entre(f, P.passoRevisao + 1, P.confirmar - 3, [0, 560]);
    return 0;
  };
  const toques: Toque[] = [
    { f: servico, ...ALVOS.servico.cartao1, rol: 230 },
    { f: P.continuar1, ...ALVOS.servico.continuar, rol: 594 },
    { f: dia, ...ALVOS.horario.dia, rol: 380 },
    { f: horario, ...ALVOS.horario.hora, rol: 380 },
    { f: P.continuar2, ...ALVOS.horario.continuar, rol: 640 },
    { f: nome - 2, ...ALVOS.dados.nome, rol: 160 },
    { f: telefone - 2, ...ALVOS.dados.telefone, rol: 160 },
    { f: P.revisar, ...ALVOS.dados.revisar, rol: 400 },
    { f: P.confirmar, ...ALVOS.revisao.confirmar, rol: 560 },
  ].map((x) => ({ f: x.f, x: x.x, y: TOPO_PAGINA + x.y - x.rol }));
  const nomeDig = f >= nome ? NOME.slice(0, Math.max(0, Math.floor((f - nome) / porLetra) + 1)) : "";
  const telDig = f >= telefone ? TEL.slice(0, Math.max(0, Math.floor((f - telefone) / porLetra) + 1)) : "";
  const pagina = (tela: Passo) => {
    switch (tela) {
      case "servico":
        return <PaginaServico escolhido={f >= servico} />;
      case "horario":
        return <PaginaHorario dia={f >= dia} hora={f >= horario} />;
      case "dados":
        return <PaginaDados nome={nomeDig} telefone={telDig} foco={f >= telefone - 2 ? "telefone" : f >= nome - 2 ? "nome" : undefined} cursor={Math.floor(f / 8) % 2 === 0} />;
      case "revisao":
        return <PaginaRevisao nome={NOME} telefoneOculto={TEL.replace(/(\(\d\d\) )\d(\d{4})/, "$19****")} apertado={f >= P.confirmar - 1 && f < P.confirmar + 3 ? 1 : 0} />;
      default:
        return <PaginaConfirmado p={entre(f, P.passoConfirmado, P.passoConfirmado + 24, [0, 1], Easing.linear)} />;
    }
  };
  const atual = PASSOS.reduce((idx, p, i) => (f >= p.de ? i : idx), 0);
  return (
    <TelaCheia focos={toques}>
      <BarraStatus hora={t.hora ?? "23:07"} />
      <BarraEndereco url="agendafio.com.br/barbearia-do-rafa" carregando={entre(f, 0, 10, [0, 1], Easing.linear)} />
      <div style={{ position: "absolute", left: 0, top: TOPO_PAGINA, width: LARGURA_TELA, height: ALTURA_TELA - TOPO_PAGINA, overflow: "hidden" }}>
        {PASSOS.map((p, i) => {
          if (i !== atual && i !== atual - 1) return null;
          const proxima = PASSOS[i + 1];
          const chegada = i === 0 ? 1 : entre(f, p.de, p.de + 8, [0, 1], sai);
          const saida = proxima && f >= proxima.de ? entre(f, proxima.de, proxima.de + 8, [0, 1], sai) : 0;
          if (saida >= 1) return null;
          const x = (1 - chegada) * LARGURA_TELA - saida * 120;
          return (
            <div key={p.tela} style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)`, opacity: 1 - saida * 0.6 }}>
              <div style={{ transform: `translateY(${-rolagem(p.tela)}px)` }}>{pagina(p.tela)}</div>
            </div>
          );
        })}
      </div>
      <Dedo f={f} toques={toques} />
      {toques.map((x, i) => (
        <Som key={i} em={x.f} tipo="toque" />
      ))}
      {Array.from({ length: NOME.length }, (_, i) => (
        <Som key={`n${i}`} em={nome + Math.round(i * porLetra)} tipo="tecla" />
      ))}
      {Array.from({ length: TEL.length }, (_, i) => (
        <Som key={`t${i}`} em={telefone + Math.round(i * porLetra)} tipo="tecla" />
      ))}
      <Som em={confirmado} tipo="sucesso" />
    </TelaCheia>
  );
}

// ---------- agenda do barbeiro ----------

const DURACOES: Record<string, string> = { Barba: "30 min", "Corte + barba": "1h 10min" };
const MINUTOS: Record<string, number> = { Barba: 30, "Corte + barba": 70 };
function itensAgenda(lista?: { hora: string; nome: string; servico: string }[]): ItemAgenda[] {
  if (!lista?.length) return AGENDA_PADRAO;
  return lista.map((c) => {
    const [h, m] = c.hora.split(":").map(Number);
    const fim = h * 60 + m + (MINUTOS[c.servico] ?? 45);
    return { h: c.hora, fim: `${String(Math.floor(fim / 60)).padStart(2, "0")}:${String(fim % 60).padStart(2, "0")}`, nome: c.nome, serv: `${c.servico} • ${DURACOES[c.servico] ?? "45 min"}` };
  });
}

function Agenda({ t }: { t: Extract<TelaApp, { nome: "agenda" }> }) {
  const { f, em } = useCena();
  const itens = itensAgenda(t.clientes);
  const alvo = t.realizar?.nome ?? t.destaque?.nome;
  const indice = Math.max(0, alvo ? itens.findIndex((i) => i.nome === alvo) : 1);
  const dEm = t.destaque ? em(t.destaque.em) : Infinity;
  const rEm = t.realizar ? em(t.realizar.em) : Infinity;
  const rolar = entre(f, 2, 16, [0, Math.max(0, 26 + Y_AGENDA(indice) - 380)]);
  const destaque = f >= dEm ? 0.6 + 0.4 * Math.sin((f - dEm) / 5) : 0;
  const cartaoY = 26 + Y_AGENDA(indice) - rolar + 40;
  // marcar como realizado: toca no cartão, toca no botão, escolhe PIX, confirma
  const folha = entre(f, rEm - 6, rEm + 2) * (1 - entre(f, rEm + 8, rEm + 12));
  const janela = entre(f, rEm + 10, rEm + 20) * (1 - entre(f, rEm + 40, rEm + 50));
  const toast = entre(f, rEm + 44, rEm + 52) * (1 - entre(f, rEm + 110, rEm + 120));
  const item = itens[indice];
  const toques: Toque[] = Number.isFinite(rEm)
    ? [
        { f: rEm - 10, x: 230, y: cartaoY },
        { f: rEm + 6, x: 195, y: JANELA.topo + JANELA.botaoDetalhe },
        { f: rEm + 26, x: JANELA.pix.x + 16, y: JANELA.topo + JANELA.pix.y },
        { f: rEm + 38, x: 195, y: JANELA.topo + JANELA.confirmar },
      ]
    : [];
  const focos = toques.length ? toques : Number.isFinite(dEm) ? [{ f: dEm, x: 195, y: cartaoY }] : [];
  return (
    <TelaCheia focos={focos}>
      <div style={{ transform: `translateY(${26 - rolar}px)` }}>
        <PaginaAgenda itens={itens} indiceDestaque={indice} destaque={Math.max(destaque, f >= rEm + 44 ? 0.5 : 0)} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
        <BarraStatus hora="10:52" />
      </div>
      {folha > 0 && <JanelaDetalhe nome={item.nome} horario={`${item.h} – ${item.fim}`} servico={item.serv.split(" • ")[0]} p={folha} apertado={f >= rEm + 5 && f < rEm + 9} />}
      {janela > 0 && <JanelaRealizado nome={item.nome} servico={item.serv.split(" • ")[0]} valor={item.serv.startsWith("Barba") ? "R$ 30,00" : item.serv.startsWith("Corte +") ? "R$ 65,00" : "R$ 40,00"} p={janela} forma={f >= rEm + 26} apertado={f >= rEm + 37 && f < rEm + 41} />}
      <Toast texto="Atendimento realizado." p={toast} />
      <Dedo f={f} toques={toques} />
      {toques.map((x, i) => (
        <Som key={i} em={x.f} tipo="toque" />
      ))}
      <Som em={dEm} tipo="pop" />
      <Som em={rEm + 44} tipo="sucesso" />
    </TelaCheia>
  );
}

// ---------- lembretes no WhatsApp ----------

const LEMBRETES_PADRAO = [
  { hora: "09:00", nome: "Bruno Almeida", servico: "Corte masculino" },
  { hora: "10:00", nome: "Matheus Lima", servico: "Corte masculino" },
  { hora: "11:00", nome: "Diego Souza", servico: "Barba" },
  { hora: "14:30", nome: "Carlos Pereira", servico: "Corte + barba" },
];

function Lembretes({ t }: { t: Extract<TelaApp, { nome: "lembretes" }> }) {
  const { f, em } = useCena();
  const lista = t.clientes?.length ? t.clientes : LEMBRETES_PADRAO;
  const qs = t.toques.map((r) => em(typeof r === "string" ? r : r.toque)).filter(Number.isFinite);
  // quando aperta "enviar" no WhatsApp (o roteiro pode casar com a palavra "manda"; senão, logo depois de abrir)
  const envia = t.toques.map((r, i) => Math.max(qs[i] + 16, typeof r === "string" ? qs[i] + 20 : em(r.enviar, qs[i] + 20)));
  const rolarPara = (i: number) => Math.max(0, 26 + Y_LEMBRETE(i) - 400);
  // antes de cada toque a lista rola até o cliente da vez
  const rolar = qs.reduce((acc, q, i) => acc + entre(f, q - 16, q - 8, [0, rolarPara(i) - (i ? rolarPara(i - 1) : 0)]), 0);
  // "todos": os que faltam aparecem lembrados de uma vez (ele seguiu mandando)
  const todos = em(t.todos);
  const itens = lista.map((c, i) => ({ hora: c.hora, nome: c.nome, servico: c.servico, lembrado: (qs[i] !== undefined && f >= envia[i] + 20) || f >= todos + i * 3 ? `18:0${2 + i}` : undefined }));
  const chat = qs.map((q, i) => ({ i, q, s: envia[i], p: entre(f, q + 5, q + 13, [0, 1], sai) * (1 - entre(f, envia[i] + 16, envia[i] + 24)) })).find((x) => x.p > 0);
  const toques: Toque[] = qs.flatMap((q, i) => [
    { f: q, x: 195, y: 26 + Y_LEMBRETE(i) - rolarPara(i) },
    { f: envia[i], x: 357, y: ALTURA_TELA - 55 },
  ]);
  return (
    <TelaCheia focos={toques}>
      <div style={{ transform: `translateY(${26 - rolar}px)` }}>
        <PaginaLembretes itens={itens} apertado={qs.findIndex((q) => f >= q - 1 && f < q + 3)} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
        <BarraStatus hora="18:01" />
      </div>
      {chat && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${(1 - chat.p) * LARGURA_TELA}px)` }}>
          <ChatWhats contato={lista[chat.i].nome} mensagem={mensagemLembrete(lista[chat.i].nome, lista[chat.i].hora, lista[chat.i].servico)} enviada={entre(f, chat.s + 1, chat.s + 9, [0, 1], sai)} />
        </div>
      )}
      <Dedo f={f} toques={toques} />
      {lista.map((_, i) => (i >= qs.length ? <Som key={`x${i}`} em={todos + i * 3} tipo="pop" /> : null))}
      {qs.map((q, i) => (
        <React.Fragment key={i}>
          <Som em={q} tipo="toque" />
          <Som em={q + 5} tipo="whoosh" vol={0.6} />
          <Som em={envia[i]} tipo="toque" />
          <Som em={envia[i] + 1} tipo="envio" />
          <Som em={envia[i] + 20} tipo="pop" />
        </React.Fragment>
      ))}
    </TelaCheia>
  );
}

// ---------- equipe e comissão ----------

const EQUIPE_PADRAO = [
  { nome: "Rafa Oliveira", servicos: "Corte masculino, Barba, Corte + barba", comissao: 0, dono: true },
  { nome: "Juninho Santos", servicos: "Corte masculino, Barba", comissao: 186000 },
  { nome: "Léo Martins", servicos: "Corte masculino, Corte + barba", comissao: 152400 },
  { nome: "Caio Ribeiro", servicos: "Corte masculino", comissao: 98700 },
];

function Equipe({ t }: { t: Extract<TelaApp, { nome: "equipe" }> }) {
  const { f, em } = useCena();
  const de = em(t.contar);
  const p = entre(f, de, de + 45, [0, 1], Easing.out(Easing.cubic));
  const equipe = t.equipe?.length ? t.equipe : EQUIPE_PADRAO;
  const total = equipe.reduce((s, x) => s + x.comissao, 0);
  const selo = mola(f, de + 48, { damping: 11 });
  return (
    <TelaCheia focos={[{ f: de, x: 195, y: 330 }, { f: de + 48, x: 195, y: 190 }]}>
      <div style={{ transform: "translateY(26px)" }}>
        <PaginaEquipe equipe={equipe} progresso={p} />
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
        <BarraStatus hora="21:30" />
      </div>
      {f >= de + 48 && (
        <div style={{ position: "absolute", left: 40, right: 40, top: 150, transform: `scale(${selo}) rotate(-2deg)`, background: C.escuro, color: "#f3ece4", borderRadius: 18, padding: "12px 18px", fontFamily: "inherit", textAlign: "center", boxShadow: "0 16px 30px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 13, letterSpacing: "0.12em", opacity: 0.8 }}>COMISSÕES DO MÊS, JÁ SOMADAS</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#f2c063", fontVariantNumeric: "tabular-nums" }}>{brl(total)}</div>
        </div>
      )}
      {Array.from({ length: 12 }, (_, i) => (
        <Som key={i} em={de + i * 3.5} tipo="tecla" vol={0.7} />
      ))}
      <Som em={de + 48} tipo="sucesso" />
    </TelaCheia>
  );
}

// ---------- celular bloqueado com os avisos ----------

export function aviso(a: AvisoSemEm): Aviso {
  switch (a.tipo) {
    case "novo":
      return AVISOS.novo(a.nome, a.servico, a.quando);
    case "lembretes":
      return AVISOS.lembretes(a.quantidade);
    case "cliente":
      return AVISOS.cliente(a.hora, a.quando);
    default:
      return AVISOS.cancelado(a.nome, undefined, a.quando);
  }
}

function Bloqueio({ t }: { t: Extract<TelaApp, { nome: "bloqueio" }> }) {
  const { f, em } = useCena();
  const avisos = t.avisos.map((a) => ({ q: em(a.em), aviso: aviso(a) }));
  return (
    <TelaCheia focos={avisos.slice(0, 1).map((a) => ({ f: a.q, x: 195, y: 280 }))}>
      <TelaBloqueio hora={t.hora} data={t.data ?? "segunda-feira, 2 de novembro"} avisos={[...avisos].reverse().map((a) => ({ aviso: a.aviso, p: f >= a.q ? mola(f, a.q, { damping: 13 }) : 0 }))} />
      {avisos.map((a, i) => (
        <React.Fragment key={i}>
          <Som em={a.q} tipo="notificacao" />
          <Som em={a.q + 2} tipo="zumbir" vol={0.6} />
        </React.Fragment>
      ))}
    </TelaCheia>
  );
}

export function App({ c }: { c: Extract<Cena, { tipo: "app" }> }) {
  switch (c.tela.nome) {
    case "agendamento":
      return <Agendamento t={c.tela} />;
    case "agenda":
      return <Agenda t={c.tela} />;
    case "lembretes":
      return <Lembretes t={c.tela} />;
    case "equipe":
      return <Equipe t={c.tela} />;
    default:
      return <Bloqueio t={c.tela} />;
  }
}
