// A linha que vai para a tabela post_blog (sem rede).
import { test } from "node:test";
import assert from "node:assert/strict";
import { montarLinhaPost } from "./blog.mjs";

const post = {
  slug: "a-b",
  palavra_chave: "a b",
  titulo: "T",
  h1: "H",
  descricao: "D",
  corpo_md: "## x",
  perguntas: [["P?", "R."]],
  fontes: [],
  extra: "não vai",
};

test("montarLinhaPost põe situacao no_ar, o dia, as 18h e o tema_id", () => {
  const l = montarLinhaPost(post, "2026-11-17", "tema-1");
  assert.equal(l.situacao, "no_ar");
  assert.equal(l.dia, "2026-11-17");
  assert.equal(l.publicar_em, "2026-11-17T21:00:00.000Z");
  assert.equal(l.tema_id, "tema-1");
  assert.equal(l.slug, "a-b");
  assert.deepEqual(l.perguntas, [["P?", "R."]]);
  assert.equal("extra" in l, false);
});
