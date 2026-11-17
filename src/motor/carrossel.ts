// Carrossel do dia (educação para o barbeiro): o roteiro e a conferência, sem React, para os scripts em Node também usarem.
// O roteiro fica em diario/<dia>/carrossel.json e é conferido por: node scripts/motor/carrossel.mjs <dia> --so-conferir
//
// Regras: 6 a 8 slides, capa primeiro e fecho por último; o Fio só aparece na tela e no fecho; todo número dos
// slides de conteúdo está num fato do tema (banco do barbeiro); nada de palavra proibida.
import { palavrasProibidas } from "./banco.ts";
import type { TemaBarbeiro } from "./bancoBarbeiro.ts";
import type { TelaStory } from "./StoryBloco.tsx";
import type { Objeto2D } from "../motion/Objetos.tsx";
import type { NomeElenco } from "../motion/Personagens.tsx";

export type Slide =
  | { tipo: "capa"; titulo: string; curiosidade: string; ilustracao?: { personagem?: string; objeto?: string; tela?: TelaStory } }
  | { tipo: "texto"; titulo: string; paragrafos: string[]; puxada?: string; fonte?: string }
  | { tipo: "lista"; titulo: string; itens: { termo: string; texto: string }[]; puxada?: string }
  | { tipo: "compara"; titulo: string; a: { rotulo: string; linhas: string[] }; b: { rotulo: string; linhas: string[] }; puxada?: string }
  | { tipo: "tela"; tela: TelaStory; frase: string }
  | { tipo: "fecho"; frase: string };

export type RoteiroCarrossel = { id: string; tema: string; rotulo: string; legenda: string; slides: Slide[] };

/** limites de letras: cabem com folga num slide de 1080×1350 */
export const LIMITES_CARROSSEL = {
  capaTitulo: 60,
  curiosidade: 50,
  titulo: 70,
  paragrafo: 140,
  paragrafos: [2, 3],
  puxada: 90,
  itens: [3, 5],
  item: 90,
  linhas: [2, 4],
  linha: 40,
  frase: 90,
  rotulo: 14,
  slides: [6, 8],
} as const;

export const TELAS_CARROSSEL: TelaStory["nome"][] = ["aviso", "agenda", "lembretes", "whats", "link", "horarios", "confirmado", "equipe"];

/** o que pode ilustrar a capa (o desenho quebra com nome que não existe) */
const ELENCO_CAPA: NomeElenco[] = ["rafa", "matheus", "juninho", "carlos", "bia", "ze", "davi"];
const OBJETOS_CAPA: Objeto2D[] = ["poste", "toalha", "navalha", "maquina", "tesoura", "pente", "cadeiraAntiga", "pincel", "pomada"];

/** números da oferta e do Fio que podem aparecer na tela, no fecho e na legenda: 7 dias grátis, montagem em 2 dias, lembretes às 18h, link 24 horas */
const NUMEROS_DO_FIO = ["7", "2", "18", "24"];
const LEGENDA_MAX = 2200; // limite do Instagram
const HASHTAGS_MAX = 30; // limite do Instagram

const L = LIMITES_CARROSSEL;
const NUMERO = /\d+(?:[.,]\d+)?/g;
const numeros = (t: string) => t.match(NUMERO) ?? [];

/** os textos de um slide: `todos` (para palavras e "Fio") e `comNumero` (os que precisam de fato com o número) */
function textos(s: Slide): { todos: string[]; comNumero: string[] } {
  switch (s.tipo) {
    case "capa":
      return { todos: [s.titulo, s.curiosidade], comNumero: [s.titulo, s.curiosidade] };
    case "texto": {
      const corpo = [s.titulo, ...(s.paragrafos ?? []), s.puxada ?? ""];
      return { todos: corpo, comNumero: corpo };
    }
    case "lista": {
      const itens = (s.itens ?? []).flatMap((i) => [i.termo, i.texto]);
      // o título da lista conta os itens ("3 jeitos de…"): esse número não precisa de fonte
      return { todos: [s.titulo, ...itens, s.puxada ?? ""], comNumero: [...itens, s.puxada ?? ""] };
    }
    case "compara": {
      const lados = [s.a?.rotulo ?? "", ...(s.a?.linhas ?? []), s.b?.rotulo ?? "", ...(s.b?.linhas ?? [])];
      const corpo = [s.titulo, ...lados, s.puxada ?? ""];
      return { todos: corpo, comNumero: corpo };
    }
    case "tela":
    case "fecho":
      return { todos: [s.frase], comNumero: [] };
  }
}

/** Confere o roteiro e devolve os erros (lista vazia = ok), cada um começando por "slide N" ou pelo campo. */
export function conferirCarrossel(r: RoteiroCarrossel, temas: TemaBarbeiro[]): string[] {
  const erros: string[] = [];
  const tema = temas.find((t) => t.id === r.tema);
  if (!tema) erros.push(`tema "${r.tema}" não está no banco do barbeiro`);
  if (!r.rotulo?.trim() || r.rotulo.length > L.rotulo) erros.push(`rotulo: até ${L.rotulo} letras`);

  const slides = Array.isArray(r.slides) ? r.slides : [];
  if (slides.length < L.slides[0] || slides.length > L.slides[1]) erros.push(`são de ${L.slides[0]} a ${L.slides[1]} slides (veio ${slides.length})`);
  if (slides[0]?.tipo !== "capa") erros.push("o primeiro slide é a capa");
  if (slides[slides.length - 1]?.tipo !== "fecho") erros.push("o último slide é o fecho");

  const dosFatos = new Set(numeros((tema?.fatos ?? []).map((f) => f.texto).join(" ")));
  const doFinal = new Set([...dosFatos, ...numeros(tema?.ponte ?? ""), ...NUMEROS_DO_FIO]);
  slides.forEach((s, i) => {
    const o = `slide ${i + 1}`;
    const max = (t: string | undefined, n: number, campo: string) => {
      if (typeof t !== "string" || !t.trim()) erros.push(`${o}: falta ${campo}`);
      else if (t.length > n) erros.push(`${o}: ${campo} com ${t.length} letras (máximo ${n})`);
    };
    const entre = (n: number, [a, b]: readonly [number, number], campo: string) => {
      if (n < a || n > b) erros.push(`${o}: ${campo} são de ${a} a ${b} (veio ${n})`);
    };
    if (s.tipo === "capa" && i !== 0) erros.push(`${o}: a capa só pode ser o primeiro slide`);
    if (s.tipo === "fecho" && i !== slides.length - 1) erros.push(`${o}: o fecho só pode ser o último slide`);
    switch (s.tipo) {
      case "capa":
        max(s.titulo, L.capaTitulo, "título");
        max(s.curiosidade, L.curiosidade, "curiosidade");
        if (s.ilustracao?.tela) erros.push(`${o}: a capa não leva tela (o celular cobre o título); use personagem ou objeto`);
        if (s.ilustracao?.personagem && !ELENCO_CAPA.includes(s.ilustracao.personagem as NomeElenco)) erros.push(`${o}: personagem "${s.ilustracao.personagem}" não existe`);
        if (s.ilustracao?.objeto && !OBJETOS_CAPA.includes(s.ilustracao.objeto as Objeto2D)) erros.push(`${o}: objeto "${s.ilustracao.objeto}" não existe`);
        break;
      case "texto":
        max(s.titulo, L.titulo, "título");
        entre(s.paragrafos?.length ?? 0, L.paragrafos, "parágrafos");
        (s.paragrafos ?? []).forEach((p, k) => max(p, L.paragrafo, `parágrafo ${k + 1}`));
        if (s.puxada) max(s.puxada, L.puxada, "puxada");
        break;
      case "lista":
        max(s.titulo, L.titulo, "título");
        entre(s.itens?.length ?? 0, L.itens, "itens");
        (s.itens ?? []).forEach((x, k) => max(`${x.termo} ${x.texto}`, L.item, `item ${k + 1}`));
        if (s.puxada) max(s.puxada, L.puxada, "puxada");
        break;
      case "compara":
        max(s.titulo, L.titulo, "título");
        for (const [lado, nome] of [[s.a, "A"], [s.b, "B"]] as const) {
          max(lado?.rotulo, L.rotulo, `rótulo ${nome}`);
          entre(lado?.linhas?.length ?? 0, L.linhas, `linhas do lado ${nome}`);
          (lado?.linhas ?? []).forEach((l, k) => max(l, L.linha, `linha ${k + 1} do lado ${nome}`));
        }
        if (s.puxada) max(s.puxada, L.puxada, "puxada");
        break;
      case "tela":
        if (!TELAS_CARROSSEL.includes(s.tela?.nome)) erros.push(`${o}: tela "${s.tela?.nome}" não existe`);
        max(s.frase, L.frase, "frase");
        break;
      case "fecho":
        max(s.frase, L.frase, "frase");
        break;
      default:
        erros.push(`${o}: tipo "${(s as { tipo: string }).tipo}" não existe`);
        return;
    }
    const { todos, comNumero } = textos(s);
    const junto = todos.join(" ");
    for (const p of palavrasProibidas(junto)) erros.push(`${o}: palavra proibida "${p}"`);
    if (s.tipo !== "tela" && s.tipo !== "fecho" && /\bFio\b/.test(junto)) erros.push(`${o}: o Fio só aparece na tela e no fecho`);
    if (tema) {
      const aceitos = s.tipo === "tela" || s.tipo === "fecho" ? doFinal : dosFatos;
      const conferir = s.tipo === "tela" || s.tipo === "fecho" ? [s.frase] : comNumero;
      for (const n of numeros(conferir.join(" "))) {
        if (!aceitos.has(n)) erros.push(`${o}: o número "${n}" não está nos fatos do tema (todo número precisa de fonte)`);
      }
      // o título da lista só pode contar os itens ("4 jeitos de…")
      if (s.tipo === "lista") for (const n of numeros(s.titulo)) if (n !== String(s.itens?.length)) erros.push(`${o}: o número "${n}" do título não é a contagem dos itens`);
    }
  });

  const legenda = r.legenda ?? "";
  for (const p of palavrasProibidas(legenda)) erros.push(`legenda: palavra proibida "${p}"`);
  if (legenda.length > LEGENDA_MAX) erros.push(`legenda: ${legenda.length} letras (máximo ${LEGENDA_MAX}, limite do Instagram)`);
  if ((legenda.match(/#/g) ?? []).length > HASHTAGS_MAX) erros.push(`legenda: mais de ${HASHTAGS_MAX} hashtags (limite do Instagram)`);
  if (tema) for (const n of numeros(legenda)) if (!doFinal.has(n)) erros.push(`legenda: o número "${n}" não está nos fatos do tema`);
  if (!/link na bio/i.test(r.legenda ?? "") || !(r.legenda ?? "").includes("?")) erros.push('legenda: termina com "Link na bio…" e uma pergunta');
  return [...new Set(erros)];
}
