// Testes do banco do barbeiro (rodar com: node --test src/motor/bancoBarbeiro.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conferirBancoBarbeiro, livresBarbeiro } from "./bancoBarbeiro.ts";
import type { TemaBarbeiro } from "./bancoBarbeiro.ts";

const BANCO: TemaBarbeiro[] = JSON.parse(readFileSync(new URL("../../diario/banco/barbeiro.json", import.meta.url), "utf8"));

function tema(troca: Partial<TemaBarbeiro> = {}): TemaBarbeiro {
  return {
    id: "faltas-custam",
    titulo: "Quanto custa uma falta",
    capa: "Cada falta é uma cadeira vazia",
    formato: "lista",
    fatos: [
      { texto: "Com 3 faltas por semana a R$ 40, são R$ 120 parados.", fonte: "https://exemplo.com.br/faltas" },
      { texto: "Confirmar na véspera ajuda a lembrar o cliente.", fonte: "oficio" },
      { texto: "Cliente que esquece não avisa.", fonte: "oficio" },
    ],
    quadro: ["Confirme na véspera", "Deixe o cliente remarcar", "Anote quem falta"],
    tela: "lembretes",
    ponte: "Com a mensagem pronta, lembrar é um toque.",
    ...troca,
  };
}

test("aceita os temas do banco", () => {
  assert.ok(BANCO.length >= 3);
  assert.deepEqual(conferirBancoBarbeiro(BANCO), []);
});

test("recusa id repetido ou fora do formato", () => {
  assert.ok(conferirBancoBarbeiro([tema(), tema()]).some((e) => /repetido/.test(e)));
  assert.ok(conferirBancoBarbeiro([tema({ id: "Faltas Custam" })]).some((e) => /id/.test(e)));
});

test("recusa número com fonte oficio e fonte que não é link", () => {
  const f = tema().fatos;
  assert.ok(conferirBancoBarbeiro([tema({ fatos: [{ texto: "37% faltam.", fonte: "oficio" }, f[1], f[2]] })]).some((e) => /número/.test(e)));
  assert.ok(conferirBancoBarbeiro([tema({ fatos: [{ texto: "Faltam.", fonte: "Sebrae" }, f[1], f[2]] })]).some((e) => /fonte/.test(e)));
});

test("recusa menos de 3 fatos e quadro fora de 3 a 5", () => {
  assert.ok(conferirBancoBarbeiro([tema({ fatos: tema().fatos.slice(0, 2) })]).some((e) => /fatos/.test(e)));
  assert.ok(conferirBancoBarbeiro([tema({ quadro: ["a", "b"] })]).some((e) => /quadro/.test(e)));
  assert.ok(conferirBancoBarbeiro([tema({ quadro: ["a", "b", "c", "d", "e", "f"] })]).some((e) => /quadro/.test(e)));
});

test("recusa tela desconhecida e palavra proibida", () => {
  assert.ok(conferirBancoBarbeiro([tema({ tela: "xyz" as never })]).some((e) => /tela/.test(e)));
  assert.ok(conferirBancoBarbeiro([tema({ ponte: "Um sistema resolve." })]).some((e) => /sistema/.test(e)));
});

test("tema usado há 59 dias fica preso e volta aos 60", () => {
  const usados = [{ tema: "faltas-custam", dia: "2026-01-01" }];
  assert.equal(livresBarbeiro([tema()], usados, "2026-03-01").length, 0); // 59 dias
  assert.equal(livresBarbeiro([tema()], usados, "2026-03-02").length, 1); // 60 dias
});
