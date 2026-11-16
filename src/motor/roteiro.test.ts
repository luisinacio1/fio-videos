// Testes dos marcos de tempo do roteiro (rodar com: node --test src/motor/roteiro.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { conferir, conferirMarcos } from "./roteiro.ts";
import type { Roteiro, Tempos } from "./roteiro.ts";

/** gera os tempos de cada fala [inicio, fim] (em segundos), com uma palavra por segundo */
function fazTempos(falas: [number, number][]): Tempos {
  const palavras: Tempos["palavras"] = [];
  falas.forEach(([a, z], f) => {
    for (let s = a, k = 1; s < z; s++, k++) palavras.push({ p: `p${k}`, f, a: s, z: Math.min(s + 1, z) });
  });
  return { falas: falas.map(([a, z]) => ({ a, z })), palavras };
}

/** n falas curtas; `troca` troca o texto de uma fala (número da fala, a partir de 1) */
function fazFalas(n: number, troca: Record<number, string> = {}) {
  return Array.from({ length: n }, (_, i) => ({ texto: troca[i + 1] ?? (i === 0 ? "Você sabia que isso acontece" : `fala número ${i + 1}`) }));
}

/** vídeo com 6 falas: gancho, duas de conteúdo, ponte (fala 4), Fio (fala 5) e final (fala 6) */
function fazVideo(conteudo: number, ponte: number, fio: number) {
  const fimConteudo = conteudo;
  const fimPonte = conteudo + ponte;
  const fimFio = conteudo + ponte + fio;
  return fazTempos([[0, 5], [5, conteudo / 2], [conteudo / 2, fimConteudo], [fimConteudo, fimPonte], [fimPonte, fimFio], [fimFio, fimFio + 3]]);
}

const marcos = { ponte: "4", fio: "5", final: "6" };

test("conferirMarcos aceita 60 s de conteúdo, 8 s de ponte e 25 s de Fio", () => {
  assert.deepEqual(conferirMarcos(fazVideo(60, 8, 25), fazFalas(6), marcos), []);
});

test("conferirMarcos recusa conteúdo de 40 s", () => {
  const erros = conferirMarcos(fazVideo(40, 8, 25), fazFalas(6), marcos);
  assert.ok(erros.some((e) => e.includes("conteúdo") && e.includes("40")), erros.join(" | "));
});

test("conferirMarcos recusa conteúdo de 110 s", () => {
  const erros = conferirMarcos(fazVideo(110, 8, 25), fazFalas(6), marcos);
  assert.ok(erros.some((e) => e.includes("conteúdo") && e.includes("110")), erros.join(" | "));
});

test("conferirMarcos recusa Fio de 10 s", () => {
  const erros = conferirMarcos(fazVideo(60, 8, 10), fazFalas(6), marcos);
  assert.ok(erros.some((e) => e.includes("Fio") && e.includes("10")), erros.join(" | "));
});

test("conferirMarcos recusa ponte de 2 s e vídeo de mais de 150 s", () => {
  assert.ok(conferirMarcos(fazVideo(60, 2, 25), fazFalas(6), marcos).some((e) => e.includes("ponte")));
  assert.ok(conferirMarcos(fazVideo(100, 12, 35), fazFalas(6), marcos).some((e) => e.includes("vídeo") && e.includes("150")));
});

test("conferirMarcos recusa gancho de 12 palavras", () => {
  const falas = fazFalas(6, { 1: "Um dois três quatro cinco seis sete oito nove dez onze doze" });
  const erros = conferirMarcos(fazVideo(60, 8, 25), falas, marcos);
  assert.ok(erros.some((e) => e.includes("gancho") && e.includes("12")), erros.join(" | "));
});

// vídeo com 8 falas: a ponte só chega na fala 6
const tempos8 = fazTempos([[0, 5], [5, 15], [15, 30], [30, 45], [45, 60], [60, 68], [68, 93], [93, 96]]);
const marcos8 = { ponte: "6", fio: "7", final: "8" };

test('conferirMarcos recusa "Fio" com maiúscula antes da ponte', () => {
  const erros = conferirMarcos(tempos8, fazFalas(8, { 3: "O Fio resolve isso" }), marcos8);
  assert.ok(erros.some((e) => e.includes("fala 3")), erros.join(" | "));
});

test('conferirMarcos aceita "fio da navalha" antes da ponte', () => {
  assert.deepEqual(conferirMarcos(tempos8, fazFalas(8, { 3: "O fio da navalha corta" }), marcos8), []);
});

test("conferirMarcos aceita Fio na própria fala da ponte", () => {
  assert.deepEqual(conferirMarcos(tempos8, fazFalas(8, { 6: "Para isso existe o Fio" }), marcos8), []);
});

test("conferirMarcos devolve o erro (sem lançar exceção) quando a referência não existe", () => {
  const erros = conferirMarcos(fazVideo(60, 8, 25), fazFalas(6), { ...marcos, ponte: "9" });
  assert.ok(erros.some((e) => e.includes("fala 9")), erros.join(" | "));
});

function fazRoteiro(extra: Partial<Roteiro> = {}): Roteiro {
  return {
    id: "teste-marcos",
    titulo: "Teste",
    legenda: "legenda do post",
    falas: fazFalas(6),
    cenas: [
      { tipo: "cidade", de: "1" },
      { tipo: "cidade", de: "2" },
      { tipo: "cidade", de: "3" },
      { tipo: "cidade", de: "4" },
      { tipo: "cidade", de: "5" },
      { tipo: "final", de: "6" },
    ],
    ...extra,
  };
}

test("conferir exige ponte e fio quando tipo está presente", () => {
  const erros = conferir(fazRoteiro({ tipo: "curiosidade" }));
  assert.ok(erros.some((e) => e.includes('"ponte"')), erros.join(" | "));
  assert.ok(erros.some((e) => e.includes('"fio"')), erros.join(" | "));
  assert.deepEqual(conferir(fazRoteiro()), [], "sem tipo, o roteiro antigo continua valendo");
});

test("conferir confere os marcos usando a cena final", () => {
  const completo = fazRoteiro({ tipo: "atracao-2d", tema: "teste", ponte: "4", fio: "5" });
  assert.deepEqual(conferir(completo, fazVideo(60, 8, 25)), []);
  const erros = conferir(completo, fazVideo(60, 8, 10));
  assert.ok(erros.some((e) => e.includes("Fio") && e.includes("10")), erros.join(" | "));
});

test("conferir recusa passos com 6 itens e compara com revela maior que o número de itens", () => {
  const passos = (n: number) => Array.from({ length: n }, (_, i) => ({ em: "2", texto: `passo ${i + 1}` }));
  const lado = (titulo: string) => ({ titulo, itens: ["um", "dois"] });
  const comCenas = (cenas: Roteiro["cenas"]) => fazRoteiro({ cenas: [...cenas, { tipo: "final", de: "6" }] });

  const seis = conferir(comCenas([{ tipo: "passos", de: "1", passos: passos(6) }]));
  assert.ok(seis.some((e) => e.includes("passos") && e.includes("6")), seis.join(" | "));
  const um = conferir(comCenas([{ tipo: "passos", de: "1", passos: passos(1) }]));
  assert.ok(um.some((e) => e.includes("passos") && e.includes("1")), um.join(" | "));
  assert.deepEqual(conferir(comCenas([{ tipo: "passos", de: "1", passos: passos(2) }, { tipo: "passos", de: "2", passos: passos(5) }])), []);

  const revela = (n: number) => Array.from({ length: n }, () => "2");
  const demais = conferir(comCenas([{ tipo: "compara", de: "1", esquerda: lado("Antes"), direita: lado("Depois"), revela: revela(5) }]));
  assert.ok(demais.some((e) => e.includes("revela") && e.includes("5") && e.includes("4")), demais.join(" | "));
  assert.deepEqual(conferir(comCenas([{ tipo: "compara", de: "1", esquerda: lado("Antes"), direita: lado("Depois"), revela: revela(4) }])), []);

  // os tempos de "revela" também são conferidos
  const tempos = fazTempos([[0, 5], [5, 10], [10, 15], [15, 20], [20, 25], [25, 28]]);
  const ref = conferir(comCenas([{ tipo: "compara", de: "1", esquerda: lado("Antes"), direita: lado("Depois"), revela: ["2", "9"] }]), tempos);
  assert.ok(ref.some((e) => e.includes("fala 9")), ref.join(" | "));
});

test("conferir recusa apresentaFio com 2 frases e frase de 41 letras", () => {
  const comCenas = (cenas: Roteiro["cenas"]) => fazRoteiro({ cenas: [...cenas, { tipo: "final", de: "6" }] });
  const tela = { nome: "agenda" } as const;
  const frase = (texto: string) => ({ em: "2", texto });

  const duas = conferir(comCenas([{ tipo: "apresentaFio", de: "1", tela, frases: [frase("Agenda pronta"), frase("Lembrete no zap")] }]));
  assert.ok(duas.some((e) => e.includes("apresentaFio") && e.includes("2 frases") && e.includes("3")), duas.join(" | "));

  const longa = "a".repeat(41);
  const grande = conferir(comCenas([{ tipo: "apresentaFio", de: "1", tela, frases: [frase("Agenda pronta"), frase(longa), frase("Lembrete no zap")] }]));
  assert.ok(grande.some((e) => e.includes("apresentaFio") && e.includes("41") && e.includes("40")), grande.join(" | "));

  const certas = [frase("a".repeat(40)), frase("Lembrete no zap"), frase("Comissão já somada")];
  assert.deepEqual(conferir(comCenas([{ tipo: "apresentaFio", de: "1", tela, frases: certas }])), []);

  // os tempos das frases também são conferidos
  const tempos = fazTempos([[0, 5], [5, 10], [10, 15], [15, 20], [20, 25], [25, 28]]);
  const ref = conferir(comCenas([{ tipo: "apresentaFio", de: "1", tela, frases: [...certas.slice(0, 2), { em: "9", texto: "Comissão" }] }]), tempos);
  assert.ok(ref.some((e) => e.includes("fala 9")), ref.join(" | "));
});

test("conferir aceita o poste vermelho e branco e recusa a variante em outro objeto", () => {
  const comCenas = (cenas: Roteiro["cenas"]) => fazRoteiro({ cenas: [...cenas, { tipo: "final", de: "6" }] });
  assert.deepEqual(conferir(comCenas([{ tipo: "objeto", de: "1", objeto: "poste", variante: "vermelhoBranco" }])), []);
  assert.deepEqual(conferir(comCenas([{ tipo: "objeto", de: "1", objeto: "poste" }])), []);
  const errada = conferir(comCenas([{ tipo: "objeto", de: "1", objeto: "navalha", variante: "vermelhoBranco" }]));
  assert.ok(errada.some((e) => e.includes("objeto") && e.includes("vermelhoBranco") && e.includes("navalha")), errada.join(" | "));
});

test("conferir recusa palavra proibida na fala e na legenda (com ou sem tipo)", () => {
  const semTipo = conferir(fazRoteiro({ falas: fazFalas(6, { 3: "O melhor sistema da cidade" }), legenda: "Uma solução pra você" }));
  assert.ok(semTipo.some((e) => e.includes("a fala 3") && e.includes("sistema")), semTipo.join(" | "));
  assert.ok(semTipo.some((e) => e.includes("legenda") && e.includes("solucao")), semTipo.join(" | "));
  const comTipo = conferir(fazRoteiro({ tipo: "dica", tema: "teste", ponte: "4", fio: "5", falas: fazFalas(6, { 2: "Uma plataforma nova" }) }));
  assert.ok(comTipo.some((e) => e.includes("a fala 2") && e.includes("plataforma")), comTipo.join(" | "));
});

test('conferir com tipo recusa "ferramenta" da ponte em diante, mas aceita antes (a ferramenta do barbeiro)', () => {
  const r = fazRoteiro({ tipo: "dica", tema: "teste", ponte: "4", fio: "5", falas: fazFalas(6, { 2: "A navalha é a ferramenta do barbeiro", 5: "Fio, a ferramenta da agenda" }) });
  const erros = conferir(r);
  assert.ok(erros.some((e) => e.includes("a fala 5") && e.includes("ferramenta")), erros.join(" | "));
  assert.ok(!erros.some((e) => e.includes("a fala 2")), erros.join(" | "));
  const comTempos = conferir(r, fazVideo(60, 8, 25));
  assert.equal(comTempos.filter((e) => e.includes("a fala 5")).length, 1, comTempos.join(" | "));
});

test('conferir com tipo recusa "Fio" antes da ponte sem os tempos, e o erro não se repete com os tempos', () => {
  const r = fazRoteiro({ tipo: "curiosidade", tema: "teste", ponte: "4", fio: "5", falas: fazFalas(6, { 2: "Fio da navalha, dizem" }) });
  assert.ok(conferir(r).some((e) => e.includes("a fala 2") && e.includes("Fio")));
  const comTempos = conferir(r, fazVideo(60, 8, 25));
  assert.equal(comTempos.filter((e) => e.includes("a fala 2")).length, 1, comTempos.join(" | "));
});
