// Linha do tempo do piloto 14: quadros de cada acontecimento, tirados das palavras da narração.
// Sem imports, para o scripts/audio-14.mjs também ler (Node tira os tipos sozinho) e pôr os efeitos no mesmo quadro.

export type Tempos = { falas: { a: number; z: number }[]; palavras: { p: string; f: number; a: number; z: number }[] };
export const FPS = 30;

const limpa = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export function criarLinha(t: Tempos) {
  const q = (s: number) => Math.round(s * FPS);
  /** Quadro em que a palavra é dita na fala (1 = primeira); `vez` para a 2ª ocorrência na mesma fala. */
  const w = (fala: number, texto: string, vez = 1) => {
    const achadas = t.palavras.filter((p) => p.f === fala - 1 && limpa(p.p) === limpa(texto));
    if (!achadas[vez - 1]) throw new Error(`palavra não achada: ${fala} ${texto}`);
    return q(achadas[vez - 1].a);
  };
  const DURACAO = Math.round((t.falas[t.falas.length - 1].z + 2.6) * FPS);

  const S = {
    relogio: w(1, "Onze"),
    abreQuarto: w(1, "noite") + 8,
    fechou: w(1, "fechou"),
    dormindo: w(1, "dormindo"),
    viagem: w(2, "Do") - 8,
    lembra: w(2, "lembra"),
    amanha: w(2, "amanhã"),
    entrevista: w(2, "entrevista"),
    cabelo: w(2, "cabelo"),
    caos: w(2, "caos"),
    mandar: w(3, "Mandar"),
    nem: w(3, "Nem"),
    abre: w(4, "abre"),
    link: w(4, "link"),
    barbearia: w(4, "barbearia"),
    corte: w(4, "corte"),
    dia: w(4, "dia"),
    horario: w(4, "horário"),
    coloca: w(5, "Coloca"),
    telefone: w(5, "telefone"),
    semApp: w(5, "baixar"),
    semConta: w(5, "criar"),
    confirmado: w(6, "Confirmado"),
    celular: w(7, "celular"),
    chega: w(7, "chega"),
    aviso: w(7, "aviso"),
    manha: w(8, "manhã"),
    agenda: w(8, "agenda"),
    ninguem: w(8, "ninguém"),
    responder: w(8, "responder"),
    nenhuma: w(8, "nenhuma"),
    fio: w(9, "Fio"),
    sua: w(9, "Sua"),
    dorme: w(9, "dorme"),
  };

  // dentro do celular do Matheus (o caminho real do link: serviço → horário → seus dados → revisão → confirmado)
  const P = {
    mergulho: S.abre - 2,
    servicoScroll: S.barbearia + 16,
    toqueCorte: S.corte - 4,
    toqueContinuar1: S.corte + 10,
    passoHorario: S.corte + 12,
    toqueDia: S.dia,
    toqueHora: S.horario,
    toqueContinuar2: S.horario + 12,
    passoDados: S.horario + 15,
    digitaNome: S.coloca + 3,
    digitaTelefone: S.telefone + 2,
    toqueRevisar: S.confirmado - 19,
    passoRevisao: S.confirmado - 16,
    toqueConfirmar: S.confirmado - 5,
    passoConfirmado: S.confirmado - 1,
    volta: S.confirmado + 31,
    pontoSai: S.confirmado + 45,
    pontoChega: S.chega - 1,
  };

  const NOME = "Matheus Lima";
  const TELEFONE = "(11) 95432-1098";
  const MENSAGEM = "Fala, Rafa! Tem horário amanh";

  /** Efeitos sonoros: [quadro, tipo] (tipos em scripts/audio-14.mjs). */
  const MARCAS: [number, string][] = [
    [S.relogio, "bip"],
    [S.abreQuarto, "whoosh"],
    [S.fechou + 2, "pop"],
    [S.viagem, "whooshLongo"],
    [S.lembra - 2, "pop"],
    [S.amanha, "pop"],
    [S.entrevista, "pop"],
    [S.cabelo + 4, "whoosh"],
    [S.caos, "boing"],
    [S.mandar - 4, "pop"],
    ...Array.from({ length: MENSAGEM.length }, (_, i) => [S.mandar + 2 + Math.floor(i * 1.6), "tecla"] as [number, string]),
    ...Array.from({ length: 8 }, (_, i) => [S.nem + i * 2, "apagar"] as [number, string]),
    [S.nem + 18, "pop"],
    [P.mergulho, "whooshLongo"],
    [S.barbearia, "pop"],
    [P.toqueCorte, "toque"],
    [P.toqueContinuar1, "toque"],
    [P.toqueDia, "toque"],
    [P.toqueHora, "toque"],
    [P.toqueContinuar2, "toque"],
    ...Array.from({ length: NOME.length }, (_, i) => [P.digitaNome + i * 2, "tecla"] as [number, string]),
    ...Array.from({ length: TELEFONE.length }, (_, i) => [P.digitaTelefone + i * 2, "tecla"] as [number, string]),
    [S.semApp, "pop"],
    [S.semConta, "pop"],
    [P.toqueRevisar, "toque"],
    [P.toqueConfirmar, "toque"],
    [S.confirmado, "sucesso"],
    [P.volta, "whooshLongo"],
    [P.pontoSai, "whoosh"],
    [P.pontoChega, "notificacao"],
    [P.pontoChega + 2, "zumbir"],
    [S.aviso, "whoosh"],
    [S.manha, "sino"],
    [S.agenda - 20, "whoosh"],
    [S.agenda + 6, "pop"],
    [S.responder, "pop"],
    [S.nenhuma, "bumbo"],
    [S.fio - 12, "whoosh"],
    [S.fio, "sucesso"],
    [S.dorme + 10, "pop"],
  ];

  return { q, w, S, P, DURACAO, NOME, TELEFONE, MENSAGEM, MARCAS };
}
