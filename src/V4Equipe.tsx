import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, Celular, Check, Encerramento, F, Fundo, Gancho, Legenda, Toque, faixa, reais, useMola } from "./base";

/** 04 · Equipe e comissão: o cliente escolhe com quem; no fim do mês, a comissão de cada um já está somada. */

const PROFISSIONAIS = [
  { nome: "Léo", cor: "#8a5a3c", papel: "Cortes e degradê" },
  { nome: "Caio", cor: "#4a6a5a", papel: "Barba e navalha" },
  { nome: "André", cor: "#5a4a6a", papel: "Cortes clássicos" },
];
const T_ESCOLHE = 150;
const T_COMISSAO = 206;

// valores de exemplo: atendimentos realizados no mês × porcentagem de cada um
const COMISSOES = [
  { nome: "Léo", cor: "#8a5a3c", atend: 74, cobrado: 4280, pct: 40 },
  { nome: "Caio", cor: "#4a6a5a", atend: 61, cobrado: 3150, pct: 50 },
  { nome: "André", cor: "#5a4a6a", atend: 48, cobrado: 2640, pct: 45 },
];

function EscolhaProfissional() {
  const frame = useCurrentFrame();
  const escolhido = frame >= T_ESCOLHE;
  return (
    <div style={{ position: "absolute", inset: 0, padding: "72px 20px 0" }}>
      <div style={{ fontSize: 13, color: C.texto2 }}>Casa Navalha · Corte masculino</div>
      <div style={{ fontFamily: F.serif, fontWeight: 600, fontSize: 26, marginTop: 6 }}>Com quem você quer cortar?</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {[...PROFISSIONAIS, { nome: "Sem preferência", cor: C.texto2, papel: "Quem estiver livre no horário" }].map((p, i) => {
          const s = useMola(76 + i * 6);
          const ativo = escolhido && p.nome === "Caio";
          const semPref = p.nome === "Sem preferência";
          return (
            <div
              key={p.nome}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 14,
                borderRadius: 18,
                border: `1.5px solid ${ativo ? C.acento : C.divisoria}`,
                background: ativo ? C.acentoSuave : C.superficie,
                opacity: s,
                transform: `translateY(${(1 - s) * 40}px) scale(${ativo ? 1 + 0.04 * Math.sin(Math.min(1, (frame - T_ESCOLHE) / 8) * Math.PI) : 1})`,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 99,
                  background: semPref ? C.lateral : p.cor,
                  color: semPref ? C.texto2 : "#fff",
                  border: semPref ? `2px dashed ${C.divisoria}` : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.serif,
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {semPref ? "?" : p.nome[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{p.nome}</div>
                <div style={{ fontSize: 13, color: C.texto2 }}>{p.papel}</div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: 99, border: `2px solid ${ativo ? C.acento : C.divisoria}`, background: ativo ? C.acento : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ativo && <Check tamanho={14} cor="#fff" progresso={faixa(frame, T_ESCOLHE, T_ESCOLHE + 8)} />}
              </div>
            </div>
          );
        })}
      </div>
      <Toque x={195} y={72 + 64 + 20 + 86 + 43} quadro={T_ESCOLHE} tamanho={30} />
    </div>
  );
}

function PainelComissao() {
  const frame = useCurrentFrame();
  const entra = useMola(T_COMISSAO, { damping: 18 });
  const conta = faixa(frame, T_COMISSAO + 20, T_COMISSAO + 90, [0, 1]);
  const maior = Math.max(...COMISSOES.map((c) => (c.cobrado * c.pct) / 100));
  const total = COMISSOES.reduce((t, c) => t + (c.cobrado * c.pct) / 100, 0);
  return (
    <div
      style={{
        width: 960,
        background: C.superficie,
        borderRadius: 40,
        padding: "40px 40px 30px",
        border: `1.5px solid ${C.divisoria}`,
        boxShadow: "0 60px 120px -50px rgba(42,32,24,0.5)",
        fontFamily: F.sans,
        opacity: entra,
        transform: `translateY(${(1 - entra) * 500}px) scale(${0.9 + entra * 0.1})`,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>Comissão da equipe</div>
      <div style={{ fontSize: 24, color: C.texto2, marginTop: 2 }}>Outubro de 2026 · atendimentos realizados</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 36 }}>
        {COMISSOES.map((c, i) => {
          const s = useMola(T_COMISSAO + 10 + i * 6);
          const valor = ((c.cobrado * c.pct) / 100) * conta;
          return (
            <div key={c.nome} style={{ opacity: s, transform: `translateX(${(1 - s) * 80}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ width: 74, height: 74, borderRadius: 99, background: c.cor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontSize: 32, fontWeight: 600 }}>{c.nome[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{c.nome}</div>
                  <div style={{ fontSize: 22, color: C.texto2 }}>
                    {Math.round(c.atend * conta)} atendimentos · {c.pct}%
                  </div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.texto }}>{reais(valor)}</div>
              </div>
              <div style={{ marginTop: 16, height: 14, borderRadius: 99, background: C.lateral, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(valor / maior) * 100}%`, borderRadius: 99, background: C.acento }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 36, paddingTop: 26, borderTop: `1.5px solid ${C.divisoria}`, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 26, color: C.texto2 }}>Total a pagar</div>
        <div style={{ fontSize: 52, fontWeight: 800, color: C.acentoForte, fontVariantNumeric: "tabular-nums" }}>{reais(total * conta)}</div>
      </div>
      <div style={{ fontSize: 18, color: C.texto2, marginTop: 10 }}>Valores de exemplo</div>
    </div>
  );
}

/** O acesso do barbeiro: ele vê só a dele. */
function MinhaComissao() {
  const frame = useCurrentFrame();
  const s = useMola(296, { damping: 13 });
  if (frame < 290) return null;
  return (
    <div
      style={{
        position: "absolute",
        right: 60,
        top: 1180,
        width: 520,
        background: C.texto,
        color: "#fff",
        borderRadius: 32,
        padding: "28px 32px",
        fontFamily: F.sans,
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
        transform: `scale(${s}) rotate(${(1 - s) * 8 - 2}deg)`,
        transformOrigin: "80% 0%",
      }}
    >
      <div style={{ fontSize: 22, opacity: 0.7 }}>No celular do Caio</div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 6 }}>Minha comissão</div>
      <div style={{ fontSize: 58, fontWeight: 800, marginTop: 8, fontVariantNumeric: "tabular-nums", color: "#f0b49f" }}>{reais(1575)}</div>
    </div>
  );
}

/** O painel com a comissão de cada barbeiro (entra no quadro 206) e o cartão "Minha comissão" (quadro 296). */
export function DemoComissao() {
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 230 }}>
        <PainelComissao />
      </div>
      <MinhaComissao />
    </>
  );
}

export function V4Equipe() {
  const frame = useCurrentFrame();
  const entraCel = useMola(62, { damping: 18 });
  const saiCel = faixa(frame, T_COMISSAO - 10, T_COMISSAO + 12);
  return (
    <AbsoluteFill>
      <Fundo />
      <Gancho numero="04" rotulo="Equipe e comissão" titulo="Quanto cada barbeiro tem a receber?" destaque={["receber?"]} ate={56} />

      {frame < T_COMISSAO + 14 && (
        <div style={{ position: "absolute", left: (1080 - 414 * 1.6) / 2, top: 170 + (1 - entraCel) * 1500, opacity: 1 - saiCel, transform: `scale(${1 - saiCel * 0.2}) translateY(${saiCel * -200}px)`, filter: `blur(${saiCel * 10}px)` }}>
          <Celular escala={1.6}>
            <EscolhaProfissional />
          </Celular>
        </div>
      )}

      <DemoComissao />

      <Legenda texto="O cliente escolhe com quem quer cortar." de={84} ate={T_COMISSAO - 12} destaque={["com", "quem"]} />
      <Legenda texto="No fim do mês, a comissão de cada um já está somada." de={T_COMISSAO + 14} ate={288} destaque={["comissão"]} />
      <Legenda texto="E cada barbeiro vê a dele, no próprio acesso." de={300} ate={370} destaque={["dele,"]} />

      <Encerramento inicio={378} frase="Equipe organizada. Conta sem discussão." />
    </AbsoluteFill>
  );
}
