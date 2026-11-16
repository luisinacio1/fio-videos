// Testes do banco de temas (rodar com: node --test src/motor/banco.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PECAS_2D, PECAS_3D, USOS_DOS_PILOTOS, conferirBanco, livres, temaDoVideo } from "./banco.ts";
import type { Tema } from "./banco.ts";

/** um tema válido; `troca` muda só o que o teste quer provar */
function tema(troca: Partial<Tema> = {}): Tema {
  return {
    id: "poste-de-barbeiro",
    tipo: "curiosidade",
    titulo: "Por que o poste de barbeiro é vermelho e branco",
    gancho: "O poste da barbearia tem uma origem de sangue",
    fatos: [{ texto: "Os barbeiros também faziam sangrias.", fonte: "https://pt.wikipedia.org/wiki/Poste_de_barbeiro" }],
    ponte: "Cuidar de quem senta na cadeira continua sendo o centro do trabalho.",
    tela: "agenda",
    pecas: ["barbearia", "objeto"],
    ...troca,
  };
}

/** algum erro contém o trecho */
const tem = (erros: string[], trecho: string) => erros.some((e) => e.includes(trecho));

test("conferirBanco aceita um banco válido", () => {
  assert.deepEqual(conferirBanco([tema(), tema({ id: "outro-tema" })]), []);
});

test("conferirBanco recusa id repetido", () => {
  const erros = conferirBanco([tema(), tema()]);
  assert.ok(tem(erros, "id repetido"), erros.join("\n"));
});

test("conferirBanco recusa id fora de kebab-case", () => {
  for (const id of ["Poste_De_Barbeiro", "poste de barbeiro", "-poste", "poste-", "poste--barbeiro", "poste-é"]) {
    const erros = conferirBanco([tema({ id })]);
    assert.ok(tem(erros, "kebab-case"), `id "${id}": ${erros.join(" | ")}`);
  }
});

test("conferirBanco recusa tema sem id", () => {
  const erros = conferirBanco([tema({ id: "" })]);
  assert.ok(tem(erros, "falta o id"), erros.join("\n"));
});

test('conferirBanco recusa curiosidade com fonte "oficio"', () => {
  const erros = conferirBanco([tema({ fatos: [{ texto: "Todo barbeiro sabe.", fonte: "oficio" }] })]);
  assert.ok(tem(erros, "oficio"), erros.join("\n"));
});

test('conferirBanco recusa atração com fonte "oficio"', () => {
  for (const tipo of ["atracao-2d", "atracao-3d"] as const) {
    const erros = conferirBanco([tema({ tipo, pecas: [], fatos: [{ texto: "Todo barbeiro sabe.", fonte: "oficio" }] })]);
    assert.ok(tem(erros, "oficio"), `${tipo}: ${erros.join(" | ")}`);
  }
});

test('conferirBanco aceita dica e conceito com fonte "oficio"', () => {
  for (const tipo of ["dica", "conceito"] as const) {
    const erros = conferirBanco([tema({ tipo, fatos: [{ texto: "Confirmar na véspera reduz as faltas.", fonte: "oficio" }] })]);
    assert.deepEqual(erros, [], tipo);
  }
});

test("conferirBanco recusa fonte que não começa com https://", () => {
  for (const fonte of ["http://exemplo.com/poste", "www.exemplo.com", "exemplo", ""]) {
    const erros = conferirBanco([tema({ fatos: [{ texto: "Um fato.", fonte }] })]);
    assert.ok(tem(erros, "https://"), `fonte "${fonte}": ${erros.join(" | ")}`);
  }
});

test("conferirBanco recusa tema sem fatos", () => {
  const erros = conferirBanco([tema({ fatos: [] })]);
  assert.ok(tem(erros, "fatos"), erros.join("\n"));
});

test("conferirBanco recusa peça que não existe", () => {
  const erros = conferirBanco([tema({ pecas: ["barbearia", "dragao"] })]);
  assert.ok(tem(erros, "dragao"), erros.join("\n"));
});

test("conferirBanco aceita todas as peças 2D nos tipos 2D e as 3D em atracao-3d", () => {
  assert.deepEqual(conferirBanco([tema({ tipo: "atracao-2d", pecas: [...PECAS_2D] })]), []);
  assert.deepEqual(conferirBanco([tema({ tipo: "atracao-3d", pecas: [...PECAS_3D] })]), []);
});

test("conferirBanco recusa misturar peça 2D com 3D (o vídeo é 2D ou 3D)", () => {
  const e3d = conferirBanco([tema({ tipo: "atracao-3d", pecas: ["vitrine", "barbearia"] })]);
  assert.ok(tem(e3d, "barbearia"), e3d.join("\n"));
  const e2d = conferirBanco([tema({ tipo: "atracao-2d", pecas: ["objeto", "vitrine"] })]);
  assert.ok(tem(e2d, "vitrine"), e2d.join("\n"));
});

test('conferirBanco recusa "sistema" na ponte', () => {
  const erros = conferirBanco([tema({ ponte: "O Fio é um sistema que organiza a agenda." })]);
  assert.ok(tem(erros, "sistema"), erros.join("\n"));
});

test("conferirBanco recusa as outras palavras proibidas, sem ligar para acento e maiúscula", () => {
  for (const ponte of ["Uma GESTÃO simples.", "Gestao da agenda.", "A plataforma resolve.", "Um software leve.", "Uma solução prática.", "Sistemas assim ajudam."]) {
    const erros = conferirBanco([tema({ ponte })]);
    assert.ok(erros.length > 0, ponte);
  }
});

test('conferirBanco não confunde palavras parecidas ("ferramenta" e "sistemático" passam)', () => {
  assert.deepEqual(conferirBanco([tema({ ponte: "A navalha é a ferramenta mais antiga da cadeira." })]), []);
  assert.deepEqual(conferirBanco([tema({ ponte: "Um trabalho sistemático de anotar tudo." })]), []);
});

test("conferirBanco recusa tema sem ponte", () => {
  for (const ponte of ["", "   ", undefined]) {
    const erros = conferirBanco([tema({ ponte: ponte as string })]);
    assert.ok(tem(erros, "ponte"), `ponte ${JSON.stringify(ponte)}: ${erros.join(" | ")}`);
  }
});

test("conferirBanco recusa tela e tipo inválidos", () => {
  assert.ok(tem(conferirBanco([tema({ tela: "relatorio" as Tema["tela"] })]), "tela"));
  assert.ok(tem(conferirBanco([tema({ tipo: "noticia" as Tema["tipo"] })]), "tipo"));
});

test("conferirBanco recusa título e gancho vazios", () => {
  assert.ok(tem(conferirBanco([tema({ titulo: " " })]), "titulo"));
  assert.ok(tem(conferirBanco([tema({ gancho: "" })]), "gancho"));
});

test("conferirBanco não quebra com entradas que não são tema", () => {
  const erros = conferirBanco([null, 7, "x", {}] as unknown as Tema[]);
  assert.ok(erros.length >= 4, erros.join("\n"));
});

test("conferirBanco diz qual tema tem o erro", () => {
  const erros = conferirBanco([tema(), tema({ id: "outro", ponte: "" })]);
  assert.ok(erros.some((e) => e.startsWith("outro:")), erros.join("\n"));
});

test("temaDoVideo tira o prefixo AAAA-MM-DD-HHh-", () => {
  assert.equal(temaDoVideo("2026-11-12-08h-poste-de-barbeiro"), "poste-de-barbeiro");
  assert.equal(temaDoVideo("2026-11-12-8h-poste-de-barbeiro"), "poste-de-barbeiro");
  assert.equal(temaDoVideo("2026-11-12-18h-navalha-3d"), "navalha-3d");
});

test("temaDoVideo entende o nome do arquivo no storage (com 8h- na frente e .mp4 atrás)", () => {
  assert.equal(temaDoVideo("diario/2026-11-07/8h-2026-11-07-08h-cliente-sumido.mp4"), "cliente-sumido");
  assert.equal(temaDoVideo("diario/2026-11-07/18h-2026-11-07-18h-cliente-sumido.json"), "cliente-sumido");
  assert.equal(temaDoVideo("8h-2026-11-07-08h-cliente-sumido"), "cliente-sumido");
});

test("temaDoVideo deixa passar o que não tem prefixo", () => {
  assert.equal(temaDoVideo("poste-de-barbeiro"), "poste-de-barbeiro");
});

test("livres exclui tema usado há 30 dias e devolve o usado há 61 dias", () => {
  const temas = [tema({ id: "usado-30" }), tema({ id: "usado-61" }), tema({ id: "nunca-usado" })];
  const usados = [
    { tema: "usado-30", dia: "2026-10-11" }, // 30 dias antes de 2026-11-10
    { tema: "usado-61", dia: "2026-09-10" }, // 61 dias antes
  ];
  const ids = livres(temas, usados, "2026-11-10").map((t) => t.id);
  assert.deepEqual(ids, ["usado-61", "nunca-usado"]);
});

test("livres: usado há 59 dias ainda não volta, há 60 volta", () => {
  const temas = [tema({ id: "a" }), tema({ id: "b" })];
  const usados = [
    { tema: "a", dia: "2026-09-12" }, // 59 dias antes de 2026-11-10
    { tema: "b", dia: "2026-09-11" }, // 60 dias antes
  ];
  const ids = livres(temas, usados, "2026-11-10").map((t) => t.id);
  assert.deepEqual(ids, ["b"]);
});

test("livres olha o último uso, não o primeiro", () => {
  const temas = [tema({ id: "a" })];
  const usados = [
    { tema: "a", dia: "2026-06-01" },
    { tema: "a", dia: "2026-10-20" },
  ];
  assert.deepEqual(livres(temas, usados, "2026-11-10"), []);
});

test("livres conta dias de calendário (vira de mês e de ano)", () => {
  const temas = [tema({ id: "a" }), tema({ id: "b" })];
  const usados = [
    { tema: "a", dia: "2025-11-20" }, // 46 dias antes de 2026-01-05
    { tema: "b", dia: "2025-11-05" }, // 61 dias antes
  ];
  const ids = livres(temas, usados, "2026-01-05").map((t) => t.id);
  assert.deepEqual(ids, ["b"]);
});

test("livres recusa dia que não é AAAA-MM-DD", () => {
  assert.throws(() => livres([tema()], [], "10/11/2026"), /dia inválido/);
  assert.throws(() => livres([tema()], [{ tema: "poste-de-barbeiro", dia: "ontem" }], "2026-11-10"), /dia inválido/);
});

test("livres filtra por tipo", () => {
  const temas = [tema({ id: "a", tipo: "curiosidade" }), tema({ id: "b", tipo: "atracao-3d", pecas: ["vitrine"] }), tema({ id: "c", tipo: "curiosidade" })];
  assert.deepEqual(livres(temas, [], "2026-11-10", "curiosidade").map((t) => t.id), ["a", "c"]);
  assert.deepEqual(livres(temas, [], "2026-11-10", "atracao-3d").map((t) => t.id), ["b"]);
  assert.deepEqual(livres(temas, [], "2026-11-10", "dica"), []);
  assert.equal(livres(temas, [], "2026-11-10").length, 3);
});

test("os temas dos pilotos ficam presos até 2027-01-12 e são os mesmos dos arquivos em diario/pilotos", () => {
  const pasta = fileURLToPath(new URL("../../diario/pilotos/", import.meta.url));
  const dosArquivos = readdirSync(pasta)
    .filter((n) => n.endsWith(".json"))
    .map((n) => JSON.parse(readFileSync(join(pasta, n), "utf8")).tema)
    .sort();
  assert.deepEqual(USOS_DOS_PILOTOS.map((u) => u.tema).sort(), dosArquivos);
  const poste = [tema()]; // id "poste-de-barbeiro", o tema do piloto de curiosidade
  assert.deepEqual(livres(poste, USOS_DOS_PILOTOS, "2026-11-20"), []);
  assert.deepEqual(livres(poste, USOS_DOS_PILOTOS, "2027-01-11"), []);
  assert.equal(livres(poste, USOS_DOS_PILOTOS, "2027-01-12").length, 1);
});
