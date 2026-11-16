// Formato do roteiro dos vídeos 3D "Quanto custa…?" (sem React, para os scripts em Node também usarem).
// A barbearia é montada peça por peça no tempo da narração; cada etapa soma o seu valor no contador do topo.
// As referências de tempo ("3", "3:palavra", "3:fim") são as mesmas do motor (src/motor/roteiro.ts).
import { ANTES, conferirMarcos, quadro, type Ref, type TelaApp, type Tempos } from "../motor/roteiro.ts";
import { conferirFioNoTempo, conferirParteFio, conferirTextos, refsDoFio, type ParteFio3D } from "./atracao.ts";

/** Peças da barbearia, na ordem em que costumam entrar. */
export const PECAS = ["piso", "pintura", "luz", "cano", "cadeiras", "espelhos", "lavatorio", "ferramentas", "recepcao", "produtos", "fachada"] as const;
export type Peca = (typeof PECAS)[number];

export type Etapa = { em: Ref; rotulo: string; valor: number; pecas: Peca[] };

export type Roteiro3D = {
  id: string;
  titulo: string;
  /** legenda do post (sem as hashtags, que entram sozinhas) */
  legenda: string;
  voz?: string;
  velocidade?: string;
  falas: { texto: string; pausa?: number }[];
  /** palavras que ganham etiqueta na legenda do vídeo */
  chaves?: string[];
  /** quantas cadeiras a barbearia tem (muda o tamanho da sala) */
  cadeiras: 1 | 2 | 3;
  /** texto pequeno em cima do valor do contador */
  contador: string;
  etapas: Etapa[];
  /** quando o total aparece grande no meio da tela */
  total: Ref;
  /** o cliente que marca e não aparece (opcional) */
  falta?: { marca: Ref; some: Ref; parada?: Ref };
  /** com tipo, é um vídeo da rotina (formato novo): pede `ponte` e `fio` e confere os marcos de tempo */
  tipo?: "atracao-3d";
  /** o id do tema no banco (diario/banco/temas.json) */
  tema?: string;
  /** onde o conteúdo termina e a ponte começa */
  ponte?: Ref;
  /** o Fio em 3D (celular com as telas, as 3 frases e o fecho com a chamada dupla), no lugar de `app` e do final 2D */
  fio?: ParteFio3D;
  /** o celular 2D com o Fio (formato antigo, sem `fio`) */
  app?: { de: Ref; tela: TelaApp };
  /** com `fio`, o fecho é o Final3D (a chamada dupla): `chamada` e `subchamada` não valem */
  final: { de: Ref; chamada?: string; subchamada?: string };
  /** aviso pequeno no fim ("Valores médios · 2026") */
  rodape?: string;
};

/** Momento (quadro do vídeo) em que cada etapa entra e a soma até ela. */
export function linhaDasEtapas(r: Roteiro3D, t: Tempos) {
  let soma = 0;
  return r.etapas.map((e) => {
    soma += e.valor;
    return { ...e, q: quadro(t, e.em), soma };
  });
}

/** Começo (quadro) do celular (o 2D de `app` ou o 3D de `fio`) e da tela final. */
export function cortes(r: Roteiro3D, t: Tempos) {
  return { app: quadro(t, (r.fio ?? r.app)!.de) - ANTES, final: quadro(t, r.final.de) - ANTES };
}

/** Confere o roteiro antes de gastar tempo com voz e vídeo: devolve a lista de problemas (vazia = ok). */
export function conferir3d(r: Roteiro3D, t?: Tempos): string[] {
  const erros: string[] = [];
  if (!r.id || !/^[a-z0-9-]+$/.test(r.id)) erros.push("id precisa ser só letras minúsculas, números e hífen");
  if (!r.falas?.length) erros.push("sem falas");
  if (!r.legenda) erros.push("sem legenda do post");
  if (![1, 2, 3].includes(r.cadeiras)) erros.push("cadeiras precisa ser 1, 2 ou 3");
  if (!r.etapas?.length) erros.push("sem etapas");
  for (const e of r.etapas ?? []) {
    if (!(e.valor > 0)) erros.push(`a etapa "${e.rotulo}" precisa de um valor maior que zero`);
    for (const p of e.pecas) if (!PECAS.includes(p)) erros.push(`peça desconhecida "${p}" (use: ${PECAS.join(", ")})`);
  }
  const usadas = (r.etapas ?? []).flatMap((e) => e.pecas);
  const repetidas = usadas.filter((p, i) => usadas.indexOf(p) !== i);
  if (repetidas.length) erros.push(`peça em mais de uma etapa: ${[...new Set(repetidas)].join(", ")}`);
  // formato novo (com tipo): a ponte e o Fio em 3D, com as mesmas regras do vídeo de atração (src/custo3d/atracao.ts)
  if (r.tipo !== undefined && r.tipo !== "atracao-3d") erros.push(`tipo "${r.tipo}" não serve aqui (use "atracao-3d" ou tire o tipo)`);
  if (r.tipo && !r.ponte) erros.push('vídeo com tipo precisa de "ponte" (a fala em que o conteúdo termina e a ponte começa)');
  if (r.tipo && !r.fio) erros.push('vídeo com tipo precisa de "fio" (o Fio em 3D: de, telas e frases)');
  if (!r.fio && !r.app) erros.push('falta o celular: "app" (2D) ou "fio" (3D)');
  if (r.fio) erros.push(...conferirParteFio(r.fio));
  if (r.tipo) erros.push(...conferirTextos(r, r.ponte));
  if (!t || erros.length) return [...new Set(erros)];
  const refs: Ref[] = [...r.etapas.map((e) => e.em), r.total, r.final.de, ...(r.fio ? refsDoFio(r.fio) : [r.app!.de]), ...(r.ponte ? [r.ponte] : [])];
  if (r.falta) refs.push(r.falta.marca, r.falta.some, ...(r.falta.parada ? [r.falta.parada] : []));
  for (const ref of refs) {
    try {
      quadro(t, ref);
    } catch (e) {
      erros.push((e as Error).message);
    }
  }
  if (erros.length) return erros;
  const qs = linhaDasEtapas(r, t).map((e) => e.q);
  qs.forEach((q, i) => {
    if (i && q - qs[i - 1] < 30) erros.push(`a etapa ${i + 1} (${r.etapas[i].rotulo}) entra menos de 1 s depois da anterior`);
  });
  if (quadro(t, "2") - 4 + 14 > qs[0]) erros.push("a primeira etapa precisa vir depois do começo da fala 2 (a obra volta no tempo nesse momento)");
  const { app, final } = cortes(r, t);
  if (quadro(t, r.total) <= qs[qs.length - 1]) erros.push("o total precisa vir depois da última etapa");
  if (app <= quadro(t, r.total)) erros.push("o celular precisa vir depois do total");
  if (final - app < 60) erros.push("o celular fica menos de 2 s na tela");
  if (r.ponte && quadro(t, r.ponte) <= quadro(t, r.total)) erros.push("a ponte precisa vir depois do total");
  if (r.fio) erros.push(...conferirFioNoTempo(r.fio, r.final.de, t));
  if (r.tipo && r.ponte && r.fio) erros.push(...conferirMarcos(t, r.falas, { ponte: r.ponte, fio: r.fio.de, final: r.final.de }));
  return [...new Set(erros)];
}
