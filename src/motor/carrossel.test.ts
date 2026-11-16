// Testes do roteiro do carrossel (rodar com: node --test src/motor/carrossel.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { conferirCarrossel } from "./carrossel.ts";
import type { RoteiroCarrossel, Slide } from "./carrossel.ts";
import type { TemaBarbeiro } from "./bancoBarbeiro.ts";

const TEMA: TemaBarbeiro = {
  id: "faltas-custam",
  titulo: "Quanto custa uma falta",
  capa: "Cada falta é uma cadeira vazia que você paga",
  formato: "lista",
  fatos: [
    { texto: "Com 3 faltas por semana a R$ 40, são R$ 120 parados.", fonte: "https://exemplo.com.br/faltas" },
    { texto: "Confirmar na véspera ajuda a lembrar o cliente.", fonte: "oficio" },
    { texto: "Cliente que esquece não avisa.", fonte: "oficio" },
  ],
  quadro: ["Confirme na véspera", "Deixe o cliente remarcar sozinho", "Anote quem falta"],
  tela: "lembretes",
  ponte: "Lembrar cliente por cliente cansa; com a mensagem pronta é um toque.",
};

function roteiro(troca: Partial<RoteiroCarrossel> = {}): RoteiroCarrossel {
  const slides: Slide[] = [
    { tipo: "capa", titulo: "Cada falta é uma cadeira vazia que você paga", curiosidade: "Quanto isso dá no mês?" },
    { tipo: "texto", titulo: "A conta que ninguém faz", paragrafos: ["Com 3 faltas por semana a R$ 40, são R$ 120 parados.", "E o horário não volta."], puxada: "Dá pra mudar isso." },
    { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["Cliente que esquece não avisa.", "Ele não some por mal."], puxada: "O que fazer, então?" },
    { tipo: "lista", titulo: "3 jeitos de ter menos faltas", itens: [
      { termo: "Véspera", texto: "Confirme na véspera." },
      { termo: "Link", texto: "Deixe o cliente remarcar sozinho." },
      { termo: "Anote", texto: "Saiba quem costuma faltar." },
    ] },
    { tipo: "compara", titulo: "Caderno vs link", a: { rotulo: "Caderno", linhas: ["Você lembra", "Você liga"] }, b: { rotulo: "Link", linhas: ["Ele marca", "Ele remarca"] } },
    { tipo: "tela", tela: { nome: "lembretes" }, frase: "No Fio, às 18h a lista de amanhã aparece pronta." },
    { tipo: "fecho", frase: "Menos falta é mais dinheiro no fim do mês. O Fio ajuda nisso." },
  ];
  return {
    id: "2026-11-20-carrossel-faltas-custam",
    tema: "faltas-custam",
    rotulo: "Faltas",
    legenda: "Falta custa caro.\n\nLink na bio pra testar 7 dias grátis.\n\nQuantas faltas você teve essa semana?",
    slides,
    ...troca,
  };
}
const com = (n: number, s: Slide) => roteiro({ slides: roteiro().slides.map((x, i) => (i === n ? s : x)) });

test("aceita um carrossel de 7 slides válido", () => {
  assert.deepEqual(conferirCarrossel(roteiro(), [TEMA]), []);
});

test("recusa menos de 6 ou mais de 8 slides", () => {
  const s = roteiro().slides;
  assert.ok(conferirCarrossel(roteiro({ slides: [s[0], s[1], s[2], s[3], s[6]] }), [TEMA]).some((e) => /6 a 8 slides/.test(e)));
  assert.ok(conferirCarrossel(roteiro({ slides: [s[0], s[1], s[2], s[1], s[2], s[3], s[4], s[5], s[6]] }), [TEMA]).some((e) => /6 a 8 slides/.test(e)));
});

test("recusa capa fora do primeiro e fecho fora do último", () => {
  const s = roteiro().slides;
  const erros = conferirCarrossel(roteiro({ slides: [s[1], s[0], s[2], s[3], s[6], s[5], s[4]] }), [TEMA]);
  assert.ok(erros.some((e) => /capa/.test(e)));
  assert.ok(erros.some((e) => /fecho/.test(e)));
});

test("recusa texto acima do limite", () => {
  const erros = conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["a".repeat(161), "Ok."] }), [TEMA]);
  assert.ok(erros.some((e) => e.startsWith("slide 3") && /160/.test(e)), erros.join("\n"));
});

test("recusa palavra proibida", () => {
  assert.ok(conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["Um sistema ajuda.", "Ok."] }), [TEMA]).some((e) => /sistema/.test(e)));
  assert.ok(conferirCarrossel(roteiro({ legenda: "Use um sistema. Link na bio. Topa?" }), [TEMA]).some((e) => /legenda/.test(e) && /sistema/.test(e)));
});

test("recusa Fio antes da parte final", () => {
  assert.ok(conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["O Fio resolve.", "Ok."] }), [TEMA]).some((e) => e.startsWith("slide 3") && /Fio/.test(e)));
  assert.deepEqual(conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["Corte no fio da navalha.", "Ok."] }), [TEMA]), []);
});

test("recusa tema fora do banco", () => {
  assert.ok(conferirCarrossel(roteiro({ tema: "nao-existe" }), [TEMA]).some((e) => /tema/.test(e)));
});

test("recusa número sem fato", () => {
  assert.ok(conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["37% faltam.", "Ok."] }), [TEMA]).some((e) => /37/.test(e)));
  assert.deepEqual(conferirCarrossel(com(2, { tipo: "texto", titulo: "Na sua barbearia", paragrafos: ["São R$ 120 parados.", "Ok."] }), [TEMA]), []);
});

test("recusa tela inexistente", () => {
  assert.ok(conferirCarrossel(com(5, { tipo: "tela", tela: { nome: "xyz" } as never, frase: "No Fio é assim." }), [TEMA]).some((e) => /xyz/.test(e)));
});

test("recusa lista com 2 ou 6 itens", () => {
  const item = { termo: "A", texto: "b." };
  assert.ok(conferirCarrossel(com(3, { tipo: "lista", titulo: "Dois", itens: [item, item] }), [TEMA]).some((e) => /3 a 5/.test(e)));
  assert.ok(conferirCarrossel(com(3, { tipo: "lista", titulo: "Seis", itens: Array(6).fill(item) }), [TEMA]).some((e) => /3 a 5/.test(e)));
});

test("legenda termina com link na bio", () => {
  assert.ok(conferirCarrossel(roteiro({ legenda: "Falta custa caro." }), [TEMA]).some((e) => /legenda/.test(e)));
});
