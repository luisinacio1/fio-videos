// O post aparece às 18h de Brasília do dia dele; o robô prepara o dia seguinte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { amanha, publicarEm } from "./hora.mjs";

test("publicarEm é 18h de Brasília (21h UTC)", () => {
  assert.equal(publicarEm("2026-11-17"), "2026-11-17T21:00:00.000Z");
});

test("publicarEm recusa dia fora do formato", () => {
  assert.throws(() => publicarEm("17/11/2026"));
});

test("amanhã às 23h30 de Brasília ainda conta o dia de Brasília", () => {
  assert.equal(amanha(new Date("2026-11-17T02:30:00Z")), "2026-11-17");
});

test("amanhã no fim do mês vira o mês", () => {
  assert.equal(amanha(new Date("2026-11-30T15:00:00Z")), "2026-12-01");
});
