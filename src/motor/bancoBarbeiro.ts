// Banco de temas do carrossel do barbeiro (diario/banco/barbeiro.json): educação para o dono da barbearia.
// Separado do banco dos vídeos (banco.ts), que fala com o público em geral.
// Conferido por: node scripts/motor/banco.mjs conferir
//
// Regra de ouro: todo número de um fato tem fonte (link https:// aberto e lido). "oficio" só para prática sem número.
import { JANELA_DIAS, diaNumero, palavrasProibidas } from "./banco.ts";
import type { TelaStory } from "./StoryBloco.tsx";

/** fonte: link https:// aberto e lido, ou "oficio" (prática sem número) */
export type FatoBarbeiro = { texto: string; fonte: string };
export type TemaBarbeiro = {
  id: string;
  titulo: string;
  capa: string;
  formato: "lista" | "compara";
  fatos: FatoBarbeiro[];
  quadro: string[];
  tela: TelaStory["nome"];
  ponte: string;
};

/**
 * Os temas dos carrosséis piloto (diario/pilotos/carrossel/) contam como usados em 2026-11-17: se o dono postar um
 * deles, a rotina não repete o tema logo em seguida. Voltam em 2027-01-16.
 */
export const USOS_DOS_PILOTOS_CARROSSEL: { tema: string; dia: string }[] = ["cliente-que-volta-vale-mais", "hora-marcada-vs-ordem-de-chegada"].map((tema) => ({ tema, dia: "2026-11-17" }));

const TELAS: TelaStory["nome"][] = ["aviso", "agenda", "lembretes", "whats", "link", "horarios", "confirmado", "equipe"];
const texto = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/** Confere o banco inteiro e devolve os erros (lista vazia = ok), cada um começando pelo id do tema. */
export function conferirBancoBarbeiro(temas: TemaBarbeiro[]): string[] {
  const erros: string[] = [];
  const vistos = new Set<string>();
  for (const [i, t] of (Array.isArray(temas) ? temas : []).entries()) {
    const o = texto(t?.id) ? t.id : `tema ${i + 1}`;
    if (!texto(t?.id) || !/^[a-z0-9-]+$/.test(t.id)) erros.push(`${o}: id só com minúsculas, números e hífen`);
    else if (vistos.has(t.id)) erros.push(`${o}: id repetido`);
    else vistos.add(t.id);
    for (const campo of ["titulo", "capa", "ponte"] as const) if (!texto(t?.[campo])) erros.push(`${o}: falta ${campo}`);
    if (t?.formato !== "lista" && t?.formato !== "compara") erros.push(`${o}: formato é "lista" ou "compara"`);
    if (!TELAS.includes(t?.tela)) erros.push(`${o}: tela "${t?.tela}" não existe`);
    const fatos = Array.isArray(t?.fatos) ? t.fatos : [];
    if (fatos.length < 3) erros.push(`${o}: pelo menos 3 fatos (veio ${fatos.length})`);
    for (const [k, f] of fatos.entries()) {
      if (!texto(f?.texto)) erros.push(`${o}: fato ${k + 1} sem texto`);
      if (f?.fonte === "oficio") {
        if (/\d/.test(f.texto ?? "")) erros.push(`${o}: fato ${k + 1} tem número, então precisa de fonte https (não "oficio")`);
      } else if (!/^https:\/\/\S+$/.test(f?.fonte ?? "")) erros.push(`${o}: fato ${k + 1} com fonte inválida (link https:// ou "oficio")`);
    }
    const quadro = Array.isArray(t?.quadro) ? t.quadro : [];
    if (quadro.length < 3 || quadro.length > 5) erros.push(`${o}: quadro com 3 a 5 itens (veio ${quadro.length})`);
    const tudo = [t?.titulo, t?.capa, t?.ponte, ...fatos.map((f) => f?.texto), ...quadro].filter(texto).join(" ");
    for (const p of palavrasProibidas(tudo)) erros.push(`${o}: palavra proibida "${p}"`);
  }
  return erros;
}

/** Os temas que podem sair em `hoje`: nunca usados, ou usados há 60 dias ou mais (uso no futuro também bloqueia). */
export function livresBarbeiro(temas: TemaBarbeiro[], usados: { tema: string; dia: string }[], hoje: string): TemaBarbeiro[] {
  const agora = diaNumero(hoje);
  const ultimo = new Map<string, number>();
  for (const u of usados) ultimo.set(u.tema, Math.max(ultimo.get(u.tema) ?? -Infinity, diaNumero(u.dia)));
  return temas.filter((t) => {
    const u = ultimo.get(t.id);
    return u === undefined || agora - u >= JANELA_DIAS;
  });
}
