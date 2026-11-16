// Testes do roteiro do vídeo 3D de atração (rodar com: node --test src/custo3d/atracao.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { conferirAtracao3d, quadrosDosPlanos } from "./atracao.ts";
import type { RoteiroAtracao3D } from "./atracao.ts";
import { conferir3d, type Roteiro3D } from "./roteiro.ts";
import type { Tempos } from "../motor/roteiro.ts";

/** gera os tempos de cada fala [inicio, fim] (em segundos), com uma palavra por segundo (p1, p2, ...) */
function fazTempos(falas: [number, number][]): Tempos {
  const palavras: Tempos["palavras"] = [];
  falas.forEach(([a, z], f) => {
    for (let s = a, k = 1; s < z; s++, k++) palavras.push({ p: `p${k}`, f, a: s, z: Math.min(s + 1, z) });
  });
  return { falas: falas.map(([a, z]) => ({ a, z })), palavras };
}

/**
 * Vídeo com 7 falas: gancho (1), vitrine (2), por dentro (3), viagem no tempo (4), ponte (5), Fio (6) e final (7).
 * `conteudo` = segundos do começo até a ponte.
 */
function fazVideo(conteudo = 60, ponte = 8, fio = 25): Tempos {
  const q = conteudo / 4;
  return fazTempos([
    [0, q],
    [q, 2 * q],
    [2 * q, 3 * q],
    [3 * q, conteudo],
    [conteudo, conteudo + ponte],
    [conteudo + ponte, conteudo + ponte + fio],
    [conteudo + ponte + fio, conteudo + ponte + fio + 4],
  ]);
}

function fazRoteiro(troca: Partial<RoteiroAtracao3D> = {}): RoteiroAtracao3D {
  return {
    id: "teste-atracao",
    titulo: "Por dentro da máquina",
    legenda: "Teste",
    tipo: "atracao-3d",
    tema: "maquina-por-dentro",
    falas: [
      { texto: "O que tem dentro da máquina de cortar?" },
      { texto: "Por fora, ela é só um corpo preto e as lâminas." },
      { texto: "Por dentro, um motor e uma bateria pequena." },
      { texto: "E em 1920 nada disso existia na barbearia." },
      { texto: "Hoje a máquina é rápida, e a agenda também pode ser." },
      { texto: "O Fio deixa o cliente marcar sozinho pelo link." },
      { texto: "É barbeiro? Link na bio." },
    ],
    planos: [
      { modo: "vitrine", de: "1", objeto: "maquina", etiquetas: [{ em: "2:p2", texto: "corpo" }] },
      { modo: "porDentro", de: "3", objeto: "maquina", abre: "3:p2", partes: [{ em: "3:p4", texto: "motor" }] },
      { modo: "viagemNoTempo", de: "4", anos: ["1920", "hoje"], vira: "4:p3" },
    ],
    ponte: "5",
    fio: {
      de: "6",
      telas: [{ em: "6", tela: { nome: "agenda" } }],
      frases: [
        { em: "6:p2", texto: "Cliente marca sozinho pelo link" },
        { em: "6:p8", texto: "Lembrete no WhatsApp" },
        { em: "6:p14", texto: "Comissão já somada" },
      ],
    },
    final: { de: "7" },
    ...troca,
  };
}

test("aceita o roteiro completo, com 60 s de conteúdo", () => {
  assert.deepEqual(conferirAtracao3d(fazRoteiro(), fazVideo()), []);
});

test("recusa porDentro com objeto que não abre", () => {
  const r = fazRoteiro();
  r.planos[1] = { modo: "porDentro", de: "3", objeto: "espelho" as never, abre: "3:p2" };
  const erros = conferirAtracao3d(r);
  assert.ok(erros.some((e) => e.includes("porDentro") && e.includes("espelho")), erros.join(" | "));
});

test("recusa planos fora de ordem", () => {
  const r = fazRoteiro();
  r.planos = [r.planos[1], r.planos[0], r.planos[2]];
  const erros = conferirAtracao3d(r, fazVideo());
  assert.ok(erros.some((e) => e.includes("plano 2") && e.includes("antes")), erros.join(" | "));
});

test("recusa fio com 2 frases", () => {
  const r = fazRoteiro();
  r.fio = { ...r.fio, frases: r.fio.frases.slice(0, 2) };
  const erros = conferirAtracao3d(r);
  assert.ok(erros.some((e) => e.includes("2 frases") && e.includes("3")), erros.join(" | "));
});

test("recusa frase do Fio com mais de 40 letras", () => {
  const r = fazRoteiro();
  r.fio = { ...r.fio, frases: [r.fio.frases[0], r.fio.frases[1], { em: "6:p14", texto: "A comissão de cada barbeiro já vem somada no fim do mês" }] };
  const erros = conferirAtracao3d(r);
  assert.ok(erros.some((e) => e.includes("frase 3") && e.includes("40")), erros.join(" | "));
});

test("recusa telas.em antes de fio.de", () => {
  const r = fazRoteiro();
  r.fio = { ...r.fio, telas: [{ em: "5:p2", tela: { nome: "agenda" } }] };
  const erros = conferirAtracao3d(r, fazVideo());
  assert.ok(erros.some((e) => e.includes("tela 1") && e.includes("antes")), erros.join(" | "));
});

test("chama conferirMarcos: conteúdo de 40 s dá erro", () => {
  const erros = conferirAtracao3d(fazRoteiro(), fazVideo(40));
  assert.ok(erros.some((e) => e.includes("conteúdo") && e.includes("40")), erros.join(" | "));
});

test("sem tipo (exemplo curto) não confere os marcos", () => {
  const r = fazRoteiro();
  delete r.tipo;
  assert.deepEqual(conferirAtracao3d(r, fazVideo(40)), []);
});

test('recusa palavra proibida e "Fio" com maiúscula antes da ponte, mesmo sem tempos', () => {
  const r = fazRoteiro();
  r.falas = r.falas.map((f, i) => (i === 1 ? { texto: "O Fio é o melhor sistema de agenda." } : f));
  const erros = conferirAtracao3d(r);
  assert.ok(erros.some((e) => e.includes("sistema")), erros.join(" | "));
  assert.ok(erros.some((e) => e.includes("fala 2") && e.includes("antes da ponte")), erros.join(" | "));
  // o aviso do Fio cedo não sai repetido quando conferirMarcos também roda
  const comTempos = conferirAtracao3d(r, fazVideo());
  assert.equal(comTempos.filter((e) => e.includes("antes da ponte")).length, 1, comTempos.join(" | "));
});

test("recusa partes antes de o objeto abrir e etiqueta fora do plano", () => {
  const r = fazRoteiro();
  r.planos[0] = { modo: "vitrine", de: "1", objeto: "maquina", etiquetas: [{ em: "3:p1", texto: "corpo" }] };
  r.planos[1] = { modo: "porDentro", de: "3", objeto: "maquina", abre: "3:p4", partes: [{ em: "3:p2", texto: "motor" }] };
  const erros = conferirAtracao3d(r, fazVideo());
  assert.ok(erros.some((e) => e.includes("etiqueta 1") && e.includes("plano 1")), erros.join(" | "));
  assert.ok(erros.some((e) => e.includes("parte 1") && e.includes("abrir")), erros.join(" | "));
});

test("quadrosDosPlanos dá o começo e o fim de cada plano (o último vai até a ponte)", () => {
  const t = fazVideo();
  const q = quadrosDosPlanos(fazRoteiro(), t);
  assert.deepEqual(
    q.map((p) => [p.de, p.ate]),
    [
      [0, 900],
      [900, 1350],
      [1350, 1800],
    ],
  );
});

// ---------- o "Quanto custa" no formato novo (Roteiro3D com tipo) ----------

/** "Quanto custa" curto, com as mesmas 7 falas de fazVideo: gancho (1), 2 etapas (2 e 3), total (4), ponte (5), Fio (6) e final (7). */
function fazCusto(troca: Partial<Roteiro3D> = {}): Roteiro3D {
  return {
    id: "teste-custo",
    titulo: "Quanto custa montar uma barbearia?",
    legenda: "Teste",
    tipo: "atracao-3d",
    tema: "montar-1-cadeira",
    falas: [
      { texto: "Quanto custa montar uma barbearia de uma cadeira?" },
      { texto: "Primeiro o piso novo, três mil." },
      { texto: "Depois a cadeira hidráulica, dois mil e quinhentos." },
      { texto: "Somando, cinco mil e quinhentos reais." },
      { texto: "Aí o cliente marca e não aparece." },
      { texto: "O Fio deixa o lembrete pronto no WhatsApp." },
      { texto: "É barbeiro? Link na bio." },
    ],
    cadeiras: 1,
    contador: "CUSTO",
    etapas: [
      { em: "2:p2", rotulo: "Piso", valor: 3000, pecas: ["piso"] },
      { em: "3:p2", rotulo: "Cadeira", valor: 2500, pecas: ["cadeiras"] },
    ],
    total: "4",
    ponte: "5",
    fio: {
      de: "6",
      telas: [{ em: "6", tela: { nome: "lembretes" } }],
      frases: [
        { em: "6:p2", texto: "Lembretes de amanhã às 18h" },
        { em: "6:p8", texto: "Mensagem pronta no WhatsApp" },
        { em: "6:p14", texto: "A gente monta pra você" },
      ],
    },
    final: { de: "7" },
    rodape: "Valores médios · 2026",
    ...troca,
  };
}

test("conferir3d com tipo exige ponte e fio", () => {
  // sem ponte e sem fio: os dois faltam
  const erros = conferir3d(fazCusto({ ponte: undefined, fio: undefined }));
  assert.ok(erros.some((e) => e.includes('"ponte"')), erros.join(" | "));
  assert.ok(erros.some((e) => e.includes('"fio"')), erros.join(" | "));
  // sem tipo, o "Quanto custa" de antes (com o celular 2D em `app`) continua valendo
  const antigo = fazCusto({ tipo: undefined, ponte: undefined, fio: undefined, app: { de: "6", tela: { nome: "lembretes", toques: [] } } });
  assert.deepEqual(conferir3d(antigo), []);
  // com tipo, a parte do Fio passa pelas mesmas regras do vídeo de atração (3 frases de até 40 letras)
  const frases = fazCusto();
  frases.fio = { ...frases.fio!, frases: frases.fio!.frases.slice(0, 2) };
  assert.ok(conferir3d(frases).some((e) => e.includes("2 frases")), conferir3d(frases).join(" | "));
  // com tipo e os tempos, chama conferirMarcos: 60 s de conteúdo passa, 40 s dá erro
  assert.deepEqual(conferir3d(fazCusto(), fazVideo(60)), []);
  const curto = conferir3d(fazCusto(), fazVideo(40));
  assert.ok(curto.some((e) => e.includes("conteúdo") && e.includes("40")), curto.join(" | "));
  // e o Fio com maiúscula antes da ponte é recusado, mesmo sem tempos
  const cedo = fazCusto();
  cedo.falas = cedo.falas.map((f, i) => (i === 2 ? { texto: "O Fio ajuda a pagar a cadeira." } : f));
  assert.ok(conferir3d(cedo).some((e) => e.includes("fala 3") && e.includes("antes da ponte")), conferir3d(cedo).join(" | "));
});
