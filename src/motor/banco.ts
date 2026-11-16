// Banco de temas dos vídeos: o formato, a conferência e a lista dos temas livres (sem React, para os scripts em Node também usarem).
// O banco fica em diario/banco/temas.json e é conferido por: node scripts/motor/banco.mjs conferir
//
// Regra de ouro: todo fato de curiosidade e de atração tem uma fonte (link https://). Só dica e conceito podem usar
// fonte "oficio" (conhecimento de ofício, sem link). Um tema só volta 60 dias depois do último uso.
import type { TipoVideo } from "./roteiro.ts";

/** as telas do Fio que um tema pode pedir (só uma sugestão de assunto, a cena do app é escrita no roteiro) */
export const TELAS = ["agendamento", "lembretes", "agenda", "bloqueio", "equipe"] as const;

/** as peças 2D do motor (as cenas de src/motor/cenas) que um tema pode pedir */
export const PECAS_2D = ["quarto", "sala", "barbearia", "cidade", "app", "texto", "final", "corte", "objeto", "linhaDoTempo", "compara", "passos", "barbeariaAntiga", "apresentaFio"] as const;

/** os modos do palco 3D (src/custo3d) que um tema pode pedir */
export const PECAS_3D = ["vitrine", "porDentro", "viagemNoTempo", "montar"] as const;

/** dias até um tema poder voltar */
export const JANELA_DIAS = 60;

/**
 * Os temas dos 5 pilotos (diario/pilotos/*.json), aprovados pelo dono em 2026-11-13. Os pilotos não ficam em
 * diario/AAAA-MM-DD/ e podem ser postados fora da rotina, então contam como usados nesse dia: com a janela de 60 dias,
 * eles voltam em 2027-01-12. Depois dessa data a lista não muda mais nada e pode ficar.
 */
export const USOS_DOS_PILOTOS: { tema: string; dia: string }[] = ["por-que-o-barbeiro-conversa", "poste-de-barbeiro", "como-pedir-o-corte", "degrade-baixo-medio-alto", "poste-por-dentro"].map((tema) => ({ tema, dia: "2026-11-13" }));

export type Tema = {
  /** curto, só minúsculas, números e hífen; vai no id do vídeo (AAAA-MM-DD-HHh-<id>) */
  id: string;
  tipo: TipoVideo;
  titulo: string;
  /** sugestão de abertura (a fala 1 do roteiro tem no máximo 9 palavras) */
  gancho: string;
  /** cada fato com a fonte: link https:// ou "oficio" (só dica e conceito) */
  fatos: { texto: string; fonte: string }[];
  /** a frase que liga o tema ao Fio, sem as palavras proibidas */
  ponte: string;
  tela: (typeof TELAS)[number];
  /** as peças do motor que o tema precisa (2D nos tipos 2D, 3D em atracao-3d) */
  pecas: string[];
};

const TIPOS: readonly TipoVideo[] = ["curiosidade", "dica", "conceito", "atracao-2d", "atracao-3d"];

/** palavras que o Fio nunca usa para se descrever (sem acento, minúsculas; o plural entra junto) */
const PROIBIDAS = /\b(?:sistema|gestao|gestoes|plataforma|software|solucao|solucoes)s?\b/g;

/** minúsculas e sem acento, para comparar palavras */
function semAcento(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** as palavras proibidas que aparecem no texto (sem repetir, sem acento), para os roteiros também conferirem */
export function palavrasProibidas(s: string): string[] {
  return [...new Set(semAcento(s).match(PROIBIDAS) ?? [])];
}

const texto = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

/**
 * Confere o banco inteiro e devolve os erros (lista vazia = ok), cada um começando pelo id do tema.
 * Aceita qualquer coisa que veio do JSON: o que não for tema vira erro, nunca exceção.
 */
export function conferirBanco(temas: Tema[]): string[] {
  const erros: string[] = [];
  const vistos = new Set<string>();

  temas.forEach((t: unknown, i) => {
    if (typeof t !== "object" || t === null || Array.isArray(t)) {
      erros.push(`tema #${i + 1}: não é um objeto`);
      return;
    }
    const x = t as Record<string, unknown>;
    const rotulo = texto(x.id) ? x.id : `tema #${i + 1}`;
    const erro = (msg: string) => erros.push(`${rotulo}: ${msg}`);

    if (!texto(x.id)) erro("falta o id");
    else {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.id)) erro(`id "${x.id}" fora de kebab-case (só minúsculas, números e hífen, sem hífen nas pontas)`);
      if (vistos.has(x.id)) erro("id repetido");
      vistos.add(x.id);
    }

    const tipo = TIPOS.find((v) => v === x.tipo);
    if (!tipo) erro(`tipo "${String(x.tipo)}" não existe (use ${TIPOS.join(", ")})`);
    if (!texto(x.titulo)) erro("falta o titulo");
    if (!texto(x.gancho)) erro("falta o gancho");
    if (!TELAS.some((v) => v === x.tela)) erro(`tela "${String(x.tela)}" não existe (use ${TELAS.join(", ")})`);

    // ponte: obrigatória e sem as palavras que o Fio nunca usa
    if (!texto(x.ponte)) erro("falta a ponte (a frase que liga o tema ao Fio)");
    else {
      const achadas = [...new Set(semAcento(x.ponte).match(PROIBIDAS) ?? [])];
      if (achadas.length) erro(`a ponte usa palavra proibida: ${achadas.join(", ")}`);
    }

    // fatos: com fonte; "oficio" só para dica e conceito
    if (!Array.isArray(x.fatos) || x.fatos.length === 0) erro("faltam os fatos (pelo menos um, com fonte)");
    else {
      x.fatos.forEach((f: unknown, n) => {
        const fato = typeof f === "object" && f !== null ? (f as Record<string, unknown>) : {};
        const ondeFato = `fato ${n + 1}`;
        if (!texto(fato.texto)) erro(`${ondeFato}: falta o texto`);
        if (fato.fonte === "oficio") {
          if (tipo !== "dica" && tipo !== "conceito") erro(`${ondeFato}: fonte "oficio" só vale para dica e conceito (${String(x.tipo)} precisa de link https://)`);
        } else if (typeof fato.fonte !== "string" || !/^https:\/\/\S+$/.test(fato.fonte)) {
          erro(`${ondeFato}: a fonte precisa começar com https://${tipo === "dica" || tipo === "conceito" ? ' (ou ser "oficio")' : ""}`);
        }
      });
    }

    // peças: precisam existir, e o vídeo é 2D ou 3D, nunca os dois
    if (!Array.isArray(x.pecas)) erro("faltam as pecas (pode ser uma lista vazia)");
    else {
      const e3d = tipo === "atracao-3d";
      for (const p of x.pecas) {
        if ((PECAS_2D as readonly unknown[]).includes(p)) {
          if (e3d) erro(`peça "${String(p)}" é 2D, mas o tema é atracao-3d (use ${PECAS_3D.join(", ")})`);
        } else if ((PECAS_3D as readonly unknown[]).includes(p)) {
          if (tipo && !e3d) erro(`peça "${String(p)}" é 3D, mas o tema é ${tipo} (use as peças 2D)`);
        } else erro(`peça "${String(p)}" não existe`);
      }
    }
  });

  return erros;
}

/**
 * O id do tema a partir do id do vídeo ("2026-11-12-08h-poste-de-barbeiro" → "poste-de-barbeiro").
 * Também entende o caminho do arquivo no storage ("diario/2026-11-07/8h-2026-11-07-08h-cliente-sumido.mp4" → "cliente-sumido").
 */
export function temaDoVideo(idVideo: string): string {
  return idVideo
    .replace(/^.*\//, "")
    .replace(/\.(?:mp4|json)$/i, "")
    .replace(/^(?:\d{1,2}h-)?\d{4}-\d{2}-\d{2}-\d{1,2}h-/, "");
}

/** "AAAA-MM-DD" em dias desde 1970 (dia de calendário, em UTC, sem horário de verão) */
function diaNumero(dia: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  const ms = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : NaN;
  if (Number.isNaN(ms)) throw new Error(`dia inválido: "${dia}" (use AAAA-MM-DD)`);
  return ms / 86_400_000;
}

/**
 * Os temas que podem sair em `hoje` (AAAA-MM-DD): os que nunca foram usados ou cujo último uso foi há 60 dias ou mais.
 * Um tema usado há 59 dias ainda não volta; há 60, volta. Uso marcado para o futuro (já na fila) também bloqueia.
 * Com `tipo`, só os temas desse tipo.
 */
export function livres(temas: Tema[], usados: { tema: string; dia: string }[], hoje: string, tipo?: TipoVideo): Tema[] {
  const agora = diaNumero(hoje);
  const ultimoUso = new Map<string, number>();
  for (const u of usados) ultimoUso.set(u.tema, Math.max(ultimoUso.get(u.tema) ?? -Infinity, diaNumero(u.dia)));
  return temas.filter((t) => {
    if (tipo && t.tipo !== tipo) return false;
    const ultimo = ultimoUso.get(t.id);
    return ultimo === undefined || agora - ultimo >= JANELA_DIAS;
  });
}
