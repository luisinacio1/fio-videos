// Formato do roteiro dos vídeos diários e as contas de tempo (sem React, para os scripts em Node também usarem).
// O roteiro diz o que é falado e quais peças entram em cada momento; o tempo de tudo vem das palavras da narração.
//
// Referência de tempo (Ref): "3" = começo da fala 3 · "3:palavra" = quando a palavra é dita na fala 3
// · "3:palavra#2" = 2ª vez que a palavra aparece na fala 3 · "3:fim" = fim da fala 3.

export const FPS = 30;
/** a cena começa um pouco antes da palavra que a chama */
export const ANTES = 6;
/** quadros de transição entre uma cena e a próxima */
export const TRANSICAO = 12;
/** segundos de vídeo depois da última fala */
export const SOBRA_FINAL = 2.6;

import type { Objeto2D, VarianteObjeto } from "../motion/Objetos";
import type { Corte } from "../motion/Personagens";
import { palavrasProibidas } from "./banco.ts";

export type Ref = string;
export type Elenco = "rafa" | "matheus" | "juninho" | "carlos" | "bia" | "ze" | "davi";
export type Boca = "neutra" | "sorriso" | "aberta" | "torta";
export type Entrada = "chicote" | "zoom" | "mergulho" | "onda" | "corte" | "subir";

export type Reacao = { em: Ref; boca?: Boca; olhar?: "cima" | "celular" | "frente" | "lado"; sacode?: boolean; acorda?: boolean };

export type TelaApp =
  | { nome: "agendamento"; cliente?: string; telefone?: string; hora?: string; toques?: { servico?: Ref; dia?: Ref; horario?: Ref; nome?: Ref; telefone?: Ref; confirmar?: Ref } }
  | { nome: "agenda"; destaque?: { nome: string; em: Ref }; realizar?: { nome: string; em: Ref }; clientes?: { hora: string; nome: string; servico: string }[] }
  | { nome: "lembretes"; toques: (Ref | { toque: Ref; enviar?: Ref })[]; todos?: Ref; clientes?: { hora: string; nome: string; servico: string }[] }
  | { nome: "equipe"; contar: Ref; equipe?: { nome: string; servicos: string; comissao: number; dono?: boolean }[] }
  | { nome: "bloqueio"; hora: string; data?: string; avisos: AvisoRoteiro[] };

export type AvisoRoteiro =
  | { em: Ref; tipo: "novo"; nome: string; servico?: string; quando?: string }
  | { em: Ref; tipo: "lembretes"; quantidade: number }
  | { em: Ref; tipo: "cliente"; hora: string; quando?: "hoje" | "amanhã" }
  | { em: Ref; tipo: "cancelado"; nome: string; quando?: string };

/** o aviso sem o momento (para quem já sabe quando mostrar) */
export type AvisoSemEm = AvisoRoteiro extends infer T ? (T extends unknown ? Omit<T, "em"> : never) : never;

type BaseCena = { de: Ref; entrada?: Entrada };
export type Cena = BaseCena &
  (
    | { tipo: "quarto"; personagem: Elenco; hora?: string; placa?: "ABERTO" | "FECHADO"; viraPlaca?: Ref; amanhece?: Ref; celularAcende?: Ref; comecaNoRelogio?: boolean; reacoes?: Reacao[] }
    | { tipo: "sala"; personagem: Elenco; pensamento?: { em: Ref; rotulo: string; titulo: string; texto?: string }; mensagem?: { em: Ref; para: string; texto: string; apaga?: Ref }; cabeloBagunca?: Ref; reacoes?: Reacao[]; closeNoRosto?: Ref }
    | { tipo: "barbearia"; barbeiro: Elenco; /** sem cliente = cadeira vazia (o barbeiro espera) */ cliente?: Elenco; mensagens?: { em: Ref; de: string; texto: string }[]; olhaCelular?: Ref; reacoes?: Reacao[] }
    /** barbearia de época: sépia, cadeira de ferro, poste de parede, placa com o ano e o barbeiro de colete e bigode (sem celular) */
    | { tipo: "barbeariaAntiga"; barbeiro: Elenco; cliente?: Elenco; ano?: string; reacoes?: Reacao[] }
    | { tipo: "cidade"; sentido?: "ida" | "volta" }
    | { tipo: "app"; tela: TelaApp }
    | { tipo: "texto"; linhas: string[]; destaque?: string[]; fundo?: "escuro" | "claro" | "acento"; numero?: { de: number; ate: number; prefixo?: string; sufixo?: string; em: Ref } }
    /** `dupla`: troca o "link na bio" pelas duas linhas de CHAMADA_DUPLA (padrão: ligada quando o roteiro tem `tipo`) */
    | { tipo: "final"; chamada?: string; subchamada?: string; dupla?: boolean }
    /** o Fio com calma: o celular com a tela do app à esquerda e as 3 frases entrando à direita, uma por vez, com um check */
    | { tipo: "apresentaFio"; tela: TelaApp; frases: { em: Ref; texto: string }[] }
    /** a cabeça grande no centro e o cabelo trocando (a máquina passa) no tempo de cada estilo; o rótulo sai numa pílula embaixo */
    | { tipo: "corte"; personagem: Elenco; estilos: { em: Ref; estilo: Corte; rotulo?: string }[] }
    /** um objeto de barbearia grande e animado; cada etiqueta surge no seu momento com uma linha até o objeto.
     *  `variante` troca o desenho (veja VARIANTES: o poste "vermelhoBranco" fica só com listras vermelhas e brancas) */
    | { tipo: "objeto"; objeto: Objeto2D; etiquetas?: { em: Ref; texto: string }[]; fundo?: "escuro" | "claro" | "acento"; variante?: VarianteObjeto }
    /** os anos numa linha; a câmera anda de um marco para o outro no tempo de cada um */
    | { tipo: "linhaDoTempo"; marcos: { em: Ref; ano: string; texto: string; objeto?: Objeto2D }[] }
    /** duas colunas lado a lado; os itens aparecem nos tempos de `revela` (esquerda primeiro, depois direita) e o vencedor ganha destaque */
    | { tipo: "compara"; esquerda: Lado; direita: Lado; vencedor?: "esquerda" | "direita"; revela?: Ref[] }
    /** de 2 a 5 passos numerados, cada um entrando no tempo da sua palavra */
    | { tipo: "passos"; titulo?: string; passos: { em: Ref; texto: string; objeto?: Objeto2D }[] }
  );

/** uma coluna da cena "compara" */
export type Lado = { titulo: string; itens: string[]; objeto?: Objeto2D };

/** que variante de desenho vale para cada objeto (a cena "objeto" recusa as outras combinações) */
export const VARIANTES: Partial<Record<Objeto2D, readonly VarianteObjeto[]>> = { poste: ["vermelhoBranco"] };

/** quantos passos a cena "passos" aceita */
export const PASSOS = { min: 2, max: 5 } as const;

/** a cena "apresentaFio" tem exatamente 3 frases, cada uma com até 40 letras */
export const FRASES_FIO = { quantas: 3, letras: 40 } as const;

/** as duas linhas da chamada dupla, no fim dos vídeos com tipo (texto exato, não mudar) */
export const CHAMADA_DUPLA = ["É barbeiro? Link na bio.", "Não é? Manda esse vídeo pro seu barbeiro."] as const;

export type Extra =
  | { tipo: "selo"; texto: string; em: Ref; ate?: Ref; cor?: "escuro" | "ok" | "acento" }
  | { tipo: "aviso"; em: Ref; ate?: Ref; aviso: AvisoSemEm }
  | { tipo: "zap"; em: Ref; ate?: Ref; de: string; texto: string };

/** os 3 informativos do dia (curiosidade, dica, conceito) e os 2 de atração (2D e 3D) */
export type TipoVideo = "curiosidade" | "dica" | "conceito" | "atracao-2d" | "atracao-3d";

/** onde a ponte começa, onde o trecho calmo do Fio começa e onde a cena final começa */
export type Marcos = { ponte: Ref; fio: Ref; final: Ref };

export type Roteiro = {
  id: string;
  titulo: string;
  /** legenda do post (sem as hashtags, que entram sozinhas) */
  legenda: string;
  voz?: string;
  velocidade?: string;
  falas: { texto: string; pausa?: number }[];
  /** palavras que ganham etiqueta na legenda do vídeo */
  chaves?: string[];
  /** onde a música troca de "problema" para "solução" */
  virada?: Ref;
  cenas: Cena[];
  extras?: Extra[];
  /** com o tipo, o vídeo segue os marcos de tempo (gancho, conteúdo, ponte, Fio) e exige `ponte` e `fio` */
  tipo?: TipoVideo;
  /** assunto do vídeo (um tema só volta depois de 60 dias) */
  tema?: string;
  /** onde o conteúdo termina e a ponte para o Fio começa */
  ponte?: Ref;
  /** onde a ponte termina e o trecho calmo do Fio começa */
  fio?: Ref;
};

export type Palavra = { p: string; f: number; a: number; z: number };
export type Tempos = { falas: { a: number; z: number }[]; palavras: Palavra[] };

export const limpa = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Quadro (do vídeo inteiro) de uma referência. */
export function quadro(t: Tempos, ref: Ref): number {
  const m = /^(\d+)(?::([^#]+))?(?:#(\d+))?$/.exec(String(ref).trim());
  if (!m) throw new Error(`referência inválida: "${ref}" (use "3", "3:palavra", "3:palavra#2" ou "3:fim")`);
  const n = Number(m[1]);
  const fala = t.falas[n - 1];
  if (!fala) throw new Error(`a fala ${n} não existe (referência "${ref}")`);
  if (!m[2]) return Math.round(fala.a * FPS);
  if (m[2] === "fim") return Math.round(fala.z * FPS);
  const vez = m[3] ? Number(m[3]) : 1;
  const achadas = t.palavras.filter((p) => p.f === n - 1 && limpa(p.p) === limpa(m[2]));
  if (!achadas[vez - 1]) throw new Error(`a palavra "${m[2]}"${vez > 1 ? ` (${vez}ª vez)` : ""} não está na fala ${n}: "${t.palavras.filter((p) => p.f === n - 1).map((p) => p.p).join(" ")}"`);
  return Math.round(achadas[vez - 1].a * FPS);
}

export const duracao = (t: Tempos) => Math.round((t.falas[t.falas.length - 1].z + SOBRA_FINAL) * FPS);

/** Começo e fim (quadros) de cada cena; a cena seguinte entra por cima nos últimos TRANSICAO quadros. */
export function linhaDasCenas(r: Roteiro, t: Tempos) {
  const total = duracao(t);
  const inicios = r.cenas.map((c, i) => (i === 0 ? 0 : Math.max(0, quadro(t, c.de) - ANTES)));
  return r.cenas.map((c, i) => ({ cena: c, de: inicios[i], ate: i < r.cenas.length - 1 ? inicios[i + 1] + TRANSICAO : total }));
}

/** Limites dos vídeos com tipo, em segundos (o gancho é em palavras): conteúdo = do começo até a ponte, Fio = do Fio até a cena final. */
export const LIMITES = { gancho: 9, conteudo: [45, 100], ponte: [3, 12], fio: [18, 35], total: [75, 150] } as const;

/** Confere os marcos de tempo (gancho, conteúdo, ponte, Fio) e se o Fio só aparece depois da ponte: devolve a lista de problemas. */
export function conferirMarcos(t: Tempos, falas: { texto: string }[], m: Marcos): string[] {
  const erros: string[] = [];
  const palavrasDoGancho = (falas[0]?.texto ?? "").split(/\s+/).filter(Boolean).length;
  if (palavrasDoGancho > LIMITES.gancho) erros.push(`o gancho (fala 1) tem ${palavrasDoGancho} palavras e o máximo é ${LIMITES.gancho}`);

  let ponte: number, fio: number, final: number;
  try {
    [ponte, fio, final] = [m.ponte, m.fio, m.final].map((ref) => quadro(t, ref) / FPS);
  } catch (e) {
    return [...erros, (e as Error).message];
  }
  const seg = (s: number) => String(Math.round(s * 10) / 10).replace(".", ",");
  const faixa = (nome: string, s: number, [min, max]: readonly [number, number]) => {
    if (s < min || s > max) erros.push(`${nome} dura ${seg(s)} s e precisa ficar entre ${min} e ${max} s`);
  };
  faixa("o conteúdo", ponte, LIMITES.conteudo);
  faixa("a ponte", fio - ponte, LIMITES.ponte);
  faixa("o trecho do Fio", final - fio, LIMITES.fio);
  faixa("o vídeo", duracao(t) / FPS, LIMITES.total);

  // o app só pode ser citado depois da ponte (o "fio da navalha" em minúscula não conta)
  const falaDaPonte = Number(/^\d+/.exec(String(m.ponte).trim())?.[0]);
  falas.slice(0, falaDaPonte - 1).forEach((f, i) => {
    if (/\bFio\b/.test(f.texto)) erros.push(`a fala ${i + 1} cita o Fio antes da ponte (a fala ${falaDaPonte})`);
  });
  return erros;
}

// ---------- textos: palavras proibidas e o Fio antes da ponte (também usados pelo 3D, src/custo3d) ----------

/** minúsculas e sem acento, mantendo os espaços (para procurar palavras inteiras) */
const limpaFrase = (s: string) =>
  s
    .split(/\s+/)
    .map((p) => limpa(p))
    .join(" ");

/** as palavras proibidas num texto, como erro (vazio = ok) */
export const textoProibido = (onde: string, s: string | undefined) => {
  const achadas = palavrasProibidas(s ?? "");
  return achadas.length ? [`${onde} usa palavra proibida: ${achadas.join(", ")}`] : [];
};

/** "ferramenta" é proibida para o Fio (antes da ponte é a ferramenta do barbeiro, e pode) */
export const chamaDeFerramenta = (onde: string, s: string) => (/\bferramentas?\b/.test(limpaFrase(s)) ? [`${onde} chama o Fio de "ferramenta" (palavra proibida para o Fio)`] : []);

/**
 * Confere as falas, o título e a legenda: palavras proibidas em tudo, "ferramenta" da ponte em diante e "Fio" com
 * maiúscula antes da ponte (sem ponte, só as palavras proibidas; quem chama já avisa que a ponte falta).
 */
export function conferirTextos(r: { falas?: { texto: string }[]; titulo?: string; legenda?: string }, ponte: Ref | undefined): string[] {
  const erros: string[] = [];
  const falaDaPonte = ponte ? Number(/^\d+/.exec(String(ponte).trim())?.[0]) : Infinity;
  (r.falas ?? []).forEach((f, i) => {
    erros.push(...textoProibido(`a fala ${i + 1}`, f.texto));
    if (i + 1 >= falaDaPonte) erros.push(...chamaDeFerramenta(`a fala ${i + 1}`, f.texto));
    else if (ponte && /\bFio\b/.test(f.texto)) erros.push(`a fala ${i + 1} cita o Fio antes da ponte (a fala ${falaDaPonte})`);
  });
  erros.push(...textoProibido("o título", r.titulo), ...textoProibido("a legenda do post", r.legenda));
  return erros;
}

/** Confere o roteiro antes de gastar tempo com voz e vídeo: devolve a lista de problemas (vazia = ok). */
export function conferir(r: Roteiro, t?: Tempos): string[] {
  const erros: string[] = [];
  if (!r.id || !/^[a-z0-9-]+$/.test(r.id)) erros.push("id precisa ser só letras minúsculas, números e hífen");
  if (!r.falas?.length) erros.push("sem falas");
  if (!r.cenas?.length) erros.push("sem cenas");
  if (r.cenas?.[r.cenas.length - 1]?.tipo !== "final") erros.push('a última cena precisa ser { "tipo": "final" }');
  if (!r.legenda) erros.push("sem legenda do post");
  if (r.tipo && !r.ponte) erros.push(`vídeo do tipo "${r.tipo}" precisa de "ponte" (a fala em que o conteúdo termina e a ponte começa)`);
  if (r.tipo && !r.fio) erros.push(`vídeo do tipo "${r.tipo}" precisa de "fio" (a fala em que o trecho do Fio começa)`);
  (r.cenas ?? []).forEach((c, i) => {
    if (c.tipo === "passos" && (c.passos.length < PASSOS.min || c.passos.length > PASSOS.max))
      erros.push(`a cena ${i + 1} (passos) tem ${c.passos.length} passos e precisa ter de ${PASSOS.min} a ${PASSOS.max}`);
    if (c.tipo === "compara" && c.revela) {
      const itens = c.esquerda.itens.length + c.direita.itens.length;
      if (c.revela.length > itens) erros.push(`a cena ${i + 1} (compara) tem ${c.revela.length} tempos em "revela" e só ${itens} itens`);
    }
    if (c.tipo === "objeto" && c.variante && !VARIANTES[c.objeto]?.includes(c.variante))
      erros.push(`a cena ${i + 1} (objeto) usa a variante "${c.variante}", que não existe para "${c.objeto}"`);
    if (c.tipo === "apresentaFio") {
      const frases = c.frases ?? [];
      if (frases.length !== FRASES_FIO.quantas) erros.push(`a cena ${i + 1} (apresentaFio) tem ${frases.length} frases e precisa ter exatamente ${FRASES_FIO.quantas}`);
      frases.forEach((x, k) => {
        if (x.texto.length > FRASES_FIO.letras) erros.push(`a frase ${k + 1} da cena ${i + 1} (apresentaFio) tem ${x.texto.length} letras e o máximo é ${FRASES_FIO.letras}: "${x.texto}"`);
      });
    }
  });
  // palavras proibidas sempre; com tipo, também "ferramenta" da ponte em diante e o Fio antes da ponte
  const textos = conferirTextos(r, r.tipo ? r.ponte : undefined);
  if (!t) return [...new Set([...erros, ...textos])];
  const refs: Ref[] = [];
  const junta = (x: unknown) => {
    if (!x || typeof x !== "object") return;
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if (["de", "em", "ate", "apaga", "viraPlaca", "amanhece", "celularAcende", "cabeloBagunca", "olhaCelular", "closeNoRosto", "contar", "virada", "servico", "dia", "horario", "nome", "telefone", "confirmar", "toque", "enviar", "todos"].includes(k) && typeof v === "string" && /^\d/.test(v)) refs.push(v);
      else if ((k === "toques" || k === "revela") && Array.isArray(v)) v.forEach((y) => (typeof y === "string" ? refs.push(y) : junta(y)));
      else junta(v);
    }
  };
  junta(r.cenas);
  junta(r.extras);
  if (r.virada) refs.push(r.virada);
  if (r.ponte) refs.push(r.ponte);
  if (r.fio) refs.push(r.fio);
  const errosAntes = erros.length;
  for (const ref of refs) {
    try {
      quadro(t, ref);
    } catch (e) {
      erros.push((e as Error).message);
    }
  }
  const refsOk = erros.length === errosAntes;
  if (!erros.length) {
    const ini = linhaDasCenas(r, t);
    ini.forEach((c, i) => {
      if (i && c.de <= ini[i - 1].de) erros.push(`a cena ${i + 1} (${c.cena.tipo}) começa antes ou junto da anterior`);
      if (i && c.de - ini[i - 1].de < 40) erros.push(`a cena ${i} (${ini[i - 1].cena.tipo}) dura menos de 1,3 s`);
    });
  }
  // marcos de tempo dos vídeos com tipo: o Fio termina onde a cena final começa
  const final = r.cenas?.find((c) => c.tipo === "final");
  if (r.tipo && r.ponte && r.fio && final && refsOk) erros.push(...conferirMarcos(t, r.falas, { ponte: r.ponte, fio: r.fio, final: final.de }));
  return [...new Set([...erros, ...textos])];
}
