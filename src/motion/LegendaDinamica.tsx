import React from "react";
import { spring } from "remotion";
import { C, F } from "../base";

/**
 * Legenda dinâmica: blocos curtos, cada palavra entra quando é dita (com mola),
 * a palavra falada fica dourada e as palavras-chave ganham uma etiqueta terracota.
 * Contorno escuro para ler em qualquer fundo (claro ou escuro).
 */

export type Palavra = { p: string; f: number; a: number; z: number };
type Bloco = { palavras: Palavra[]; de: number; ate: number };

const FPS = 30;
const q = (s: number) => Math.round(s * FPS);
const limpa = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Junta as palavras em blocos de até `max` letras, quebrando na pontuação e sem deixar "o", "a", "e" sozinhos no fim. */
export function montarBlocos(palavras: Palavra[], max = 16): Bloco[] {
  const grupos: Palavra[][] = [];
  let atual: Palavra[] = [];
  palavras.forEach((p, i) => {
    const prox = palavras[i + 1];
    atual.push(p);
    const letras = atual.map((x) => x.p).join(" ").length;
    const fimDeFrase = /[.?!:,;]$/.test(p.p) || !prox || prox.f !== p.f;
    const proxCabe = prox && letras + 1 + prox.p.length <= max;
    if (fimDeFrase || !proxCabe) {
      // não termina bloco em palavra curta solta (a, o, e, de...): ela vai para o próximo
      const ultima = atual[atual.length - 1];
      if (!fimDeFrase && atual.length > 1 && ultima.p.length <= 2) {
        atual.pop();
        grupos.push(atual);
        atual = [ultima];
      } else {
        grupos.push(atual);
        atual = [];
      }
    }
  });
  if (atual.length) grupos.push(atual);
  return grupos.map((ps, i) => {
    const prox = grupos[i + 1];
    const fim = q(ps[ps.length - 1].z) + 10;
    return { palavras: ps, de: q(ps[0].a) - 3, ate: prox ? Math.min(q(prox[0].a) - 3, fim + 20) : fim + 20 };
  });
}

const CONTORNO = (() => {
  const s: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    s.push(`${(Math.cos(a) * 6).toFixed(1)}px ${(Math.sin(a) * 6).toFixed(1)}px 0 ${C.escuro}`);
  }
  s.push(`0 10px 18px rgba(0,0,0,0.45)`);
  return s.join(", ");
})();

/**
 * `firme` (vídeos 3D): mais espaço entre as palavras e a mola só cresce até o tamanho final (sem passar dele), para
 * uma palavra longa entrando não encostar na anterior ("da barbearia" virava "dabarbearia").
 */
export function LegendaDinamica({ f, blocos, chaves, topo = 1330, firme = false }: { f: number; blocos: Bloco[]; chaves: string[]; topo?: number; firme?: boolean }) {
  const b = blocos.find((x) => f >= x.de && f < x.ate);
  if (!b) return null;
  const especiais = new Set(chaves.map(limpa));
  const saida = Math.min(1, Math.max(0, (b.ate - f) / 4));
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: topo,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: firme ? 28 : 18,
        rowGap: 4,
        opacity: saida,
        transform: `scale(${0.92 + saida * 0.08})`,
      }}
    >
      {b.palavras.map((p, i) => {
        const mola = spring({ frame: f - (q(p.a) - 2), fps: FPS, config: { damping: 11, stiffness: 260, mass: 0.6 } });
        const entra = firme ? Math.min(1, mola) : mola;
        if (f < q(p.a) - 2) return <span key={i} style={{ fontFamily: F.sans, fontWeight: 900, fontSize: 82, opacity: 0 }}>{p.p}</span>;
        const falando = f < q(p.z) + 3;
        const chave = especiais.has(limpa(p.p));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: F.sans,
              fontWeight: 900,
              fontSize: 82,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: chave ? "#fff" : falando ? "#f2c063" : "#fff",
              textShadow: chave ? "0 10px 18px rgba(0,0,0,0.35)" : CONTORNO,
              background: chave ? C.acento : "transparent",
              borderRadius: 18,
              padding: chave ? "0 18px 4px" : "0 2px",
              boxShadow: chave ? `0 0 0 5px ${C.escuro}` : undefined,
              transform: `translateY(${(1 - entra) * 36}px) scale(${0.6 + entra * 0.4}) rotate(${chave ? -2.5 : 0}deg)`,
            }}
          >
            {p.p}
          </span>
        );
      })}
    </div>
  );
}
