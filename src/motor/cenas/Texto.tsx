import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, F, Fundo, Laco } from "../../base";
import { CHAMADA_DUPLA, limpa, type Cena } from "../roteiro";
import { Som, entre, mola, useCena } from "../util";

type CenaDe<T extends Cena["tipo"]> = Extract<Cena, { tipo: T }>;

/** Frase grande na tela (com palavras em destaque) e, se quiser, um número que sobe. */
export function Texto({ c }: { c: CenaDe<"texto"> }) {
  const { f, dur, em } = useCena();
  const fundo = c.fundo ?? "escuro";
  const corTexto = fundo === "claro" ? C.texto : "#f3ece4";
  const corDestaque = fundo === "claro" ? C.acento : fundo === "acento" ? "#f2c063" : "#e0734f";
  const maior = Math.max(...c.linhas.map((l) => l.length));
  const tamanho = maior > 22 ? 74 : maior > 15 ? 92 : 112;
  const destaques = new Set((c.destaque ?? []).map(limpa));
  const n = c.numero;
  const nq = n ? em(n.em, 10) : 0;
  const valor = n ? Math.round(n.de + (n.ate - n.de) * entre(f, nq, nq + 30, [0, 1], Easing.out(Easing.cubic))) : 0;
  const pulo = n ? mola(f, nq + 30, { damping: 8, stiffness: 220 }) : 0;
  const deriva = entre(f, 0, dur, [1.04, 1], Easing.linear);
  return (
    <AbsoluteFill style={{ background: fundo === "acento" ? C.acento : undefined }}>
      {fundo !== "acento" && <Fundo escuro={fundo === "escuro"} />}
      {fundo === "acento" && <AbsoluteFill style={{ background: "radial-gradient(1200px 900px at 80% 10%, rgba(255,255,255,0.14), transparent 60%)" }} />}
      <div style={{ position: "absolute", left: 80, right: 80, top: n ? 330 : 470, transform: `scale(${deriva})`, transformOrigin: "50% 0" }}>
        {c.linhas.map((linha, i) => {
          const e = mola(f, 3 + i * 7, { damping: 13, stiffness: 180 });
          return (
            <div key={i} style={{ fontFamily: F.serif, fontWeight: 700, fontSize: tamanho, lineHeight: 1.08, letterSpacing: "-0.02em", color: corTexto, opacity: e, transform: `translateY(${(1 - e) * 50}px)` }}>
              {linha.split(" ").map((p, k) => (
                <span key={k} style={destaques.has(limpa(p)) ? { color: corDestaque, fontStyle: "italic" } : undefined}>
                  {p}{" "}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {n && f >= nq - 2 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily: F.sans, fontWeight: 900, fontSize: 210, letterSpacing: "-0.04em", color: corDestaque, fontVariantNumeric: "tabular-nums", transform: `scale(${1 + (1 - pulo) * 0.12})` }}>
          {n.prefixo ?? ""}
          {valor.toLocaleString("pt-BR")}
          {n.sufixo ?? ""}
        </div>
      )}
      {c.linhas.map((_, i) => (
        <Som key={i} em={3 + i * 7} tipo="pop" vol={0.7} />
      ))}
      {n && <Som em={nq + 30} tipo="bumbo" />}
    </AbsoluteFill>
  );
}

/** onde cada parte do fecho fica (com a chamada dupla tudo sobe, para as duas linhas ficarem acima de y 1300) */
const LUGAR_FINAL = {
  simples: { laco: 380, tamLaco: 340, nome: 690, frase: 930, chamada: 1330 },
  dupla: { laco: 250, tamLaco: 300, nome: 525, frase: 760, chamada: 1010 },
};

/**
 * Fecho de todo vídeo: o laço se desenha, "Fio", a frase da última fala e a chamada.
 * Com `dupla` (o Motor liga nos vídeos com tipo), o "link na bio" vira as duas linhas de CHAMADA_DUPLA.
 */
export function Final({ c, dupla = false }: { c: CenaDe<"final">; dupla?: boolean }) {
  const { f, tempos, inicio } = useCena();
  const L = dupla ? LUGAR_FINAL.dupla : LUGAR_FINAL.simples;
  const fala = (() => {
    const m = /^(\d+)/.exec(String(c.de));
    return m ? Number(m[1]) - 1 : tempos.falas.length - 1;
  })();
  const palavras = tempos.palavras.filter((p) => p.f === fala);
  const frase = limpa(palavras[0]?.p ?? "") === "fio" ? palavras.slice(1) : palavras;
  const laco = entre(f, 6, 40, [0, 1], Easing.inOut(Easing.cubic));
  const nome = mola(f, 14, { damping: 13 });
  const ultima = frase.length ? Math.round(frase[frase.length - 1].z * 30) - inicio : 40;
  const chamada = mola(f, ultima + 6, { damping: 12 });
  return (
    <AbsoluteFill style={{ background: C.fundo }}>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.12), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(176,81,58,0.08), transparent 60%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: L.laco, display: "flex", justifyContent: "center" }}>
        <Laco tamanho={L.tamLaco} progresso={laco} espessura={2.6} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: L.nome, textAlign: "center", fontFamily: F.serif, fontWeight: 700, fontSize: 150, color: C.texto, letterSpacing: "-0.02em", transform: `translateY(${(1 - nome) * 40}px)`, opacity: nome }}>Fio</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: L.frase, textAlign: "center", fontFamily: F.serif, fontWeight: 600, fontSize: frase.length > 9 ? 62 : 70, lineHeight: 1.12, color: C.texto }}>
        {frase.map((p, i) => {
          const q = Math.round(p.a * 30) - inicio;
          const e = mola(f, q - 2, { damping: 12, stiffness: 220 });
          const ultimaPalavra = i === frase.length - 1;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 16, opacity: f >= q - 2 ? e : 0, transform: `translateY(${(1 - e) * 20}px)`, color: ultimaPalavra ? C.acento : C.texto, fontStyle: ultimaPalavra ? "italic" : "normal" }}>
              {p.p}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: L.chamada, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: `scale(${chamada})`, opacity: f >= ultima + 6 ? 1 : 0 }}>
        <div style={{ background: C.acento, color: "#fff", fontFamily: F.sans, fontWeight: 800, fontSize: 48, borderRadius: 999, padding: "26px 52px", boxShadow: "0 24px 50px -20px rgba(176,81,58,0.7)" }}>{c.chamada ?? "Teste grátis por 7 dias"}</div>
        {!dupla && <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 38, color: C.texto2 }}>{c.subchamada ?? "link na bio · a gente monta tudo pra você"}</div>}
      </div>
      {dupla && (
        <div style={{ position: "absolute", left: 60, right: 60, top: L.chamada + 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {CHAMADA_DUPLA.map((linha, i) => {
            const q = ultima + 14 + i * 12;
            const e = mola(f, q, { damping: 14, stiffness: 160 });
            // a pergunta em destaque e o pedido logo depois (o texto junto é exatamente a linha)
            const corte = linha.indexOf("?") + 1;
            return (
              <div key={i} style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 44, lineHeight: 1.15, color: C.texto, textAlign: "center", opacity: f >= q ? e : 0, transform: `translateY(${(1 - e) * 18}px)` }}>
                <span style={{ fontWeight: 800, color: C.acento }}>{linha.slice(0, corte)}</span>
                {linha.slice(corte)}
              </div>
            );
          })}
        </div>
      )}
      <Som em={14} tipo="sucesso" />
      <Som em={ultima + 6} tipo="pop" />
      {dupla && CHAMADA_DUPLA.map((_, i) => <Som key={i} em={ultima + 14 + i * 12} tipo="pop" vol={0.6} />)}
    </AbsoluteFill>
  );
}
