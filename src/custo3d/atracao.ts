// Formato do roteiro dos vídeos 3D de atração e a conferência (sem React, para os scripts em Node também usarem).
// O vídeo é uma sequência de planos no palco 3D (um por vez), depois a ponte (a câmera se afasta), a parte do Fio
// (celular 3D com as telas do app e as 3 frases) e o fecho com a chamada dupla. As referências de tempo ("3",
// "3:palavra", "3:fim") são as mesmas do motor (src/motor/roteiro.ts).
//
// Sem `tipo`, o roteiro é um teste curto: tudo é conferido, menos os marcos de tempo (conteúdo de 45 a 100 s etc.).
import { ANTES, FRASES_FIO, chamaDeFerramenta, conferirMarcos, conferirTextos, duracao, quadro, textoProibido, type Ref, type Tempos } from "../motor/roteiro.ts";
import type { TelaStory } from "../motor/StoryBloco";
import type { Objeto3D } from "./Objetos3D";

/** os objetos da coleção 3D (o Record obriga a lista a ter todos os nomes de Objeto3D, nem mais nem menos) */
const TODOS: Record<Objeto3D, true> = { poste: true, cadeiraAntiga: true, cadeiraModerna: true, maquina: true, navalha: true, tesoura: true, espelho: true, toalha: true, pente: true };
export const OBJETOS = Object.keys(TODOS) as Objeto3D[];

/** os objetos que se abrem em partes (os que têm `partes` em OBJETOS_3D) */
export const ABREM = ["maquina", "navalha", "tesoura", "poste"] as const;
export type ObjetoQueAbre = (typeof ABREM)[number];

/** as telas do app que viram imagem (a composição tela-parada) */
const TELAS: Record<TelaStory["nome"], true> = { aviso: true, agenda: true, lembretes: true, whats: true, link: true, horarios: true, confirmado: true, equipe: true };

export const MODOS = ["vitrine", "porDentro", "viagemNoTempo"] as const;

/** etiquetas e nomes de partes cabem numa placa de uma linha */
export const LETRAS_ETIQUETA = 24;
/** cada plano fica pelo menos isso na tela (quadros) */
export const PLANO_MIN = 45;

export type Plano3D =
  | { modo: "vitrine"; de: Ref; objeto: Objeto3D; etiquetas?: { em: Ref; texto: string }[] }
  | { modo: "porDentro"; de: Ref; objeto: ObjetoQueAbre; abre: Ref; partes?: { em: Ref; texto: string }[] }
  /** a barbearia de 1920 virando a de hoje, peça por peça, a partir de `vira`; `anos` = as duas placas ("1920", "hoje") */
  | { modo: "viagemNoTempo"; de: Ref; anos: [string, string]; vira: Ref };

/** A parte do Fio em 3D (também no "Quanto custa" no formato novo): as telas trocam em `em`, as frases entram em `em`. */
export type ParteFio3D = { de: Ref; telas: { em: Ref; tela: TelaStory }[]; frases: { em: Ref; texto: string }[] };

export type RoteiroAtracao3D = {
  id: string;
  titulo: string;
  /** legenda do post (sem as hashtags, que entram sozinhas) */
  legenda: string;
  /** sem tipo = teste curto (não confere os marcos de tempo) */
  tipo?: "atracao-3d";
  tema?: string;
  voz?: string;
  velocidade?: string;
  falas: { texto: string; pausa?: number }[];
  /** palavras que ganham etiqueta na legenda do vídeo */
  chaves?: string[];
  planos: Plano3D[];
  /** onde o conteúdo termina e a ponte começa (a câmera se afasta do último plano) */
  ponte: Ref;
  /** a parte do Fio: as telas trocam em `em`, as frases entram em `em` */
  fio: ParteFio3D;
  final: { de: Ref };
};

/** Começo e fim (quadros) de cada plano: o primeiro começa no quadro 0 e o último vai até a ponte. */
export function quadrosDosPlanos(r: RoteiroAtracao3D, t: Tempos) {
  const inicios = r.planos.map((p, i) => (i === 0 ? 0 : quadro(t, p.de)));
  const ponte = quadro(t, r.ponte);
  return r.planos.map((plano, i) => ({ plano, de: inicios[i], ate: i < r.planos.length - 1 ? inicios[i + 1] : ponte }));
}

/** quadros que valem a pena conferir (fazer-3d --quadros): os eventos de cada plano, a ponte, o Fio e o fecho */
export function quadrosDeConferencia(r: RoteiroAtracao3D, t: Tempos): number[] {
  const fio = quadro(t, r.fio.de) - ANTES;
  const final = quadro(t, r.final.de) - ANTES;
  const qs: number[] = [12];
  for (const { plano: p, de, ate } of quadrosDosPlanos(r, t)) {
    qs.push(de + 20, ate - 3);
    if (p.modo === "vitrine") qs.push(...(p.etiquetas ?? []).map((e) => quadro(t, e.em) + 20));
    if (p.modo === "porDentro") {
      const abre = quadro(t, p.abre);
      qs.push(abre + 26);
      if (p.partes?.length) qs.push(...p.partes.map((e) => quadro(t, e.em) + 20));
      else qs.push(abre + 110);
    }
    if (p.modo === "viagemNoTempo") {
      const vira = quadro(t, p.vira);
      qs.push(vira - 4, vira + 45, vira + 90, ate - 20);
    }
  }
  qs.push(quadro(t, r.ponte) + 20, fio + 30);
  qs.push(...r.fio.frases.map((x) => quadro(t, x.em) + 20));
  qs.push(final + 60);
  const fim = duracao(t) - 1;
  return [...new Set(qs.map((q) => Math.max(0, Math.min(fim, q))))].sort((a, b) => a - b);
}


/** Confere o roteiro antes de gastar tempo com voz e vídeo: devolve a lista de problemas (vazia = ok). */
export function conferirAtracao3d(r: RoteiroAtracao3D, t?: Tempos): string[] {
  const erros: string[] = [];
  if (!r.id || !/^[a-z0-9-]+$/.test(r.id)) erros.push("id precisa ser só letras minúsculas, números e hífen");
  if (!r.falas?.length) erros.push("sem falas");
  if (!r.legenda) erros.push("sem legenda do post");
  if (!r.titulo) erros.push("sem título");
  if (r.tipo !== undefined && r.tipo !== "atracao-3d") erros.push(`tipo "${r.tipo}" não serve aqui (use "atracao-3d" ou tire o tipo para um teste curto)`);
  if (!r.planos?.length) erros.push("sem planos");
  if (!r.ponte) erros.push('falta "ponte" (a fala em que o conteúdo termina e a câmera se afasta)');
  if (!r.fio?.de) erros.push('falta "fio.de" (onde a parte do Fio começa)');
  if (!r.final?.de) erros.push('falta "final.de" (onde o fecho começa)');

  const textoCurto = (onde: string, s: string) => {
    if (!s?.trim()) erros.push(`${onde} está sem texto`);
    else if (s.length > LETRAS_ETIQUETA) erros.push(`${onde} tem ${s.length} letras e o máximo é ${LETRAS_ETIQUETA}: "${s}"`);
  };
  (r.planos ?? []).forEach((p, i) => {
    const nome = `o plano ${i + 1} (${p.modo})`;
    if (!MODOS.includes(p.modo)) return erros.push(`o plano ${i + 1} tem o modo "${p.modo}", que não existe (use: ${MODOS.join(", ")})`);
    if (p.modo === "vitrine") {
      if (!OBJETOS.includes(p.objeto)) erros.push(`${nome} usa o objeto "${p.objeto}", que não existe (use: ${OBJETOS.join(", ")})`);
      (p.etiquetas ?? []).forEach((e, k) => textoCurto(`a etiqueta ${k + 1} do plano ${i + 1}`, e.texto));
    }
    if (p.modo === "porDentro") {
      if (!(ABREM as readonly string[]).includes(p.objeto)) erros.push(`${nome} usa "${p.objeto}", que não abre (porDentro só com: ${ABREM.join(", ")})`);
      if (!p.abre) erros.push(`${nome} precisa de "abre" (quando o objeto se abre)`);
      (p.partes ?? []).forEach((e, k) => textoCurto(`a parte ${k + 1} do plano ${i + 1}`, e.texto));
    }
    if (p.modo === "viagemNoTempo") {
      if (!Array.isArray(p.anos) || p.anos.length !== 2 || p.anos.some((a) => !a?.trim() || a.length > 8)) erros.push(`${nome} precisa de "anos" com 2 textos curtos (até 8 letras), como ["1920", "hoje"]`);
      if (!p.vira) erros.push(`${nome} precisa de "vira" (quando a barbearia começa a mudar)`);
    }
  });

  erros.push(...conferirParteFio(r.fio), ...conferirTextos(r, r.ponte));

  // as placas dos planos também: nada de palavra proibida nem do Fio antes da ponte
  (r.planos ?? []).forEach((p, i) => {
    const placas = p.modo === "vitrine" ? (p.etiquetas ?? []).map((e) => e.texto) : p.modo === "porDentro" ? (p.partes ?? []).map((e) => e.texto) : (p.anos ?? []);
    placas.forEach((s) => {
      erros.push(...proibidas(`o plano ${i + 1}`, s));
      if (/\bFio\b/.test(s ?? "")) erros.push(`o plano ${i + 1} escreve "Fio" antes da ponte: "${s}"`);
    });
  });

  if (!t || erros.length) return [...new Set(erros)];

  // ---- com os tempos: referências, ordem e marcos ----
  const refs: Ref[] = [r.ponte, r.final.de, ...refsDoFio(r.fio)];
  for (const p of r.planos) {
    refs.push(p.de);
    if (p.modo === "vitrine") refs.push(...(p.etiquetas ?? []).map((e) => e.em));
    if (p.modo === "porDentro") refs.push(p.abre, ...(p.partes ?? []).map((e) => e.em));
    if (p.modo === "viagemNoTempo") refs.push(p.vira);
  }
  for (const ref of refs) {
    try {
      quadro(t, ref);
    } catch (e) {
      erros.push((e as Error).message);
    }
  }
  if (erros.length) return [...new Set(erros)];

  const q = (ref: Ref) => quadro(t, ref);
  const seg = (f: number) => `${String(Math.round((f / 30) * 10) / 10).replace(".", ",")} s`;
  const ponte = q(r.ponte);
  const fio = q(r.fio.de);
  const final = q(r.final.de);

  const inicios = r.planos.map((p) => q(p.de));
  inicios.forEach((de, i) => {
    if (!i) return;
    if (de <= inicios[i - 1]) erros.push(`o plano ${i + 1} (${r.planos[i].modo}) começa antes ou junto do plano ${i}`);
    else if (de - inicios[i - 1] < PLANO_MIN) erros.push(`o plano ${i} (${r.planos[i - 1].modo}) dura menos de 1,5 s`);
  });
  const ultimo = inicios[inicios.length - 1];
  if (ponte - ultimo < PLANO_MIN) erros.push(`a ponte precisa vir pelo menos 1,5 s depois do começo do último plano`);
  if (fio <= ponte) erros.push("o Fio precisa começar depois da ponte");
  if (final <= fio) erros.push("o fecho precisa começar depois do Fio");

  if (!erros.length) {
    quadrosDosPlanos(r, t).forEach(({ plano: p, de, ate }, i) => {
      const dentro = (onde: string, ref: Ref) => {
        const x = q(ref);
        if (x < de || x >= ate) erros.push(`${onde} fica fora do plano ${i + 1} (entra em ${seg(x)}, e o plano vai de ${seg(de)} a ${seg(ate)})`);
        return x;
      };
      if (p.modo === "vitrine") (p.etiquetas ?? []).forEach((e, k) => dentro(`a etiqueta ${k + 1} do plano ${i + 1}`, e.em));
      if (p.modo === "porDentro") {
        const abre = dentro(`o "abre" do plano ${i + 1}`, p.abre);
        (p.partes ?? []).forEach((e, k) => {
          if (dentro(`a parte ${k + 1} do plano ${i + 1}`, e.em) < abre) erros.push(`a parte ${k + 1} do plano ${i + 1} entra antes de o objeto abrir`);
        });
      }
      if (p.modo === "viagemNoTempo") dentro(`o "vira" do plano ${i + 1}`, p.vira);
    });
  }

  erros.push(...conferirFioNoTempo(r.fio, r.final.de, t));

  if (r.tipo) erros.push(...conferirMarcos(t, r.falas, { ponte: r.ponte, fio: r.fio.de, final: r.final.de }));
  return [...new Set(erros)];
}

// ---------- partes da conferência que o "Quanto custa" no formato novo também usa (src/custo3d/roteiro.ts) ----------

// as palavras proibidas, "ferramenta" e o Fio antes da ponte são conferidos pelo motor (src/motor/roteiro.ts),
// para o 2D e o 3D usarem a mesma regra
const proibidas = textoProibido;
const ferramenta = chamaDeFerramenta;
export { conferirTextos };

/** Confere a parte do Fio sem os tempos: exatamente 3 frases de até 40 letras, telas que existem e nenhuma palavra proibida. */
export function conferirParteFio(fio: ParteFio3D | undefined): string[] {
  const erros: string[] = [];
  const frases = fio?.frases ?? [];
  if (frases.length !== FRASES_FIO.quantas) erros.push(`o Fio tem ${frases.length} frases e precisa ter exatamente ${FRASES_FIO.quantas}`);
  frases.forEach((x, k) => {
    if (x.texto.length > FRASES_FIO.letras) erros.push(`a frase ${k + 1} do Fio tem ${x.texto.length} letras e o máximo é ${FRASES_FIO.letras}: "${x.texto}"`);
    erros.push(...proibidas(`a frase ${k + 1} do Fio`, x.texto), ...ferramenta(`a frase ${k + 1} do Fio`, x.texto));
  });
  const telas = fio?.telas ?? [];
  if (!telas.length) erros.push("o Fio precisa de pelo menos uma tela do app");
  telas.forEach((x, k) => {
    if (!TELAS[x.tela?.nome]) erros.push(`a tela ${k + 1} do Fio é "${x.tela?.nome}", que não existe (use: ${Object.keys(TELAS).join(", ")})`);
    else if (x.tela.nome === "aviso" && !x.tela.aviso) erros.push(`a tela ${k + 1} do Fio (aviso) precisa do "aviso"`);
  });
  return erros;
}

/** as referências de tempo da parte do Fio (para conferir se existem antes de usar) */
export const refsDoFio = (fio: ParteFio3D): Ref[] => [fio.de, ...fio.telas.map((x) => x.em), ...fio.frases.map((x) => x.em)];

/** Com os tempos: as telas e as frases do Fio entram entre o começo do Fio e o fecho, cada uma depois da anterior. */
export function conferirFioNoTempo(fio: ParteFio3D, finalDe: Ref, t: Tempos): string[] {
  const erros: string[] = [];
  const seg = (f: number) => `${String(Math.round((f / 30) * 10) / 10).replace(".", ",")} s`;
  const comeco = quadro(t, fio.de);
  const final = quadro(t, finalDe);
  const confere = (onde: string, lista: { em: Ref }[]) =>
    lista.forEach((x, k) => {
      const em = quadro(t, x.em);
      if (em < comeco) erros.push(`${onde} ${k + 1} do Fio entra antes do começo do Fio (${seg(em)}, e o Fio começa em ${seg(comeco)})`);
      else if (em >= final) erros.push(`${onde} ${k + 1} do Fio entra depois do começo do fecho`);
      if (k && em <= quadro(t, lista[k - 1].em)) erros.push(`${onde} ${k + 1} do Fio entra antes ou junto da anterior`);
    });
  confere("a tela", fio.telas);
  confere("a frase", fio.frases);
  return erros;
}
