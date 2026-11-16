// Gera os vídeos de uma semana a partir de semanas/<data>/semana.json e dos roteiros dessa pasta.
//
//   node scripts/semana.mjs kit semanas/2026-11-02          escreve KIT.md: texto das narrações e prompts das imagens
//   node scripts/semana.mjs gerar semanas/2026-11-02 [id]    gera os MP4 em prontos/ (só os que têm `id` no nome, se passar)
//
// Vídeo só de animação: copia (ou renderiza) o MP4 dos vídeos 01 a 07.
// Vídeo narrado: se a narração já chegou em entrega/<id>/, o tempo de cada cena segue a fala;
// se não, sai uma prévia sem voz em prontos/previas/, com o tempo estimado pelo texto.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { SR, ajustarVolume, baixo, bumbo, chimbal, hz, notificacao, novaFaixa, pad, palma, piano, pop, q, salvar, sino, sucesso, tecla, tique, tocar, toque, whoosh } from "./som.mjs";

const FPS = 30;
const [comando, pasta, filtro] = process.argv.slice(2);
if (!["kit", "gerar"].includes(comando) || !pasta) {
  console.log("Uso: node scripts/semana.mjs kit|gerar semanas/<data> [id]");
  process.exit(1);
}
const semana = JSON.parse(readFileSync(join(pasta, "semana.json"), "utf8"));
const nomeSemana = basename(pasta);
const roteiro = (id) => JSON.parse(readFileSync(join(pasta, "roteiros", `${id}.json`), "utf8"));
const DIAS = { extra: "Extra", seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };
const MODELOS = { motion: "Motion", narracao: "Motion + Narração", imagens: "Motion + Narração + Imagens" };
const dataBR = (iso) => (iso === "extra" ? "(sem data)" : iso.split("-").reverse().slice(0, 2).join("/"));
const palavras = (t = "") => t.split(/\s+/).filter(Boolean).length;

// ---------- KIT.md ----------

function kit() {
  const linhas = [
    `# Kit da semana ${semana.titulo}`,
    "",
    "Gerado por `node scripts/semana.mjs kit`. O que você precisa produzir para os vídeos narrados desta semana.",
    "",
    "## Como entregar",
    "",
    "- **Narração:** um arquivo só por vídeo (MP3, WAV ou M4A), com **1 segundo de silêncio entre as falas**. Salve como `entrega/<vídeo>/narracao.mp3`.",
    "  O número de falas precisa bater com a tabela: é pelo silêncio que eu sei onde cada cena começa. Não precisa caber em tempo nenhum: o vídeo se ajusta à sua fala.",
    "- **Imagens:** vertical 9:16, sem nenhum texto ou logo dentro, com espaço livre em cima (os títulos entram ali). Salve como `entrega/<vídeo>/imagem-01.jpg`, `imagem-02.jpg`…",
    "- Depois é só me avisar: eu gero o vídeo final e te mando para aprovar.",
    "",
  ];
  for (const p of semana.postagens.filter((p) => p.roteiro)) {
    const r = roteiro(p.roteiro);
    linhas.push(`## ${DIAS[p.dia]} ${dataBR(p.data)}, ${p.hora} · ${r.titulo}`, "", `Modelo: **${MODELOS[p.modelo]}** · pasta de entrega: \`entrega/${r.id}/\``, "");
    if (r.tom) linhas.push(`**Tom da narração:** ${r.tom}`, "");
    linhas.push("| # | Narração | O que aparece na tela |", "|---|---|---|");
    r.cenas.forEach((c, i) => linhas.push(`| ${i + 1} | ${c.fala} | ${descreverCena(c)} |`));
    linhas.push("");
    const imagens = r.cenas.filter((c) => c.tipo === "imagem");
    if (imagens.length) {
      linhas.push("**Imagens.** Cole a descrição fixa no começo de todo prompt e use a imagem 01 como referência de personagem nas outras.", "", `> ${r.personagem}`, "");
      linhas.push("| Arquivo | Prompt (depois da descrição fixa) |", "|---|---|");
      for (const c of imagens) linhas.push(`| \`imagem-${c.imagem}.jpg\` | ${c.semPersonagem ? "(sem a descrição fixa) " : ""}${c.prompt} |`);
      linhas.push("");
    }
  }
  writeFileSync(join(pasta, "KIT.md"), linhas.join("\n"));
  console.log(join(pasta, "KIT.md"));

  // textos soltos, prontos para colar nas IAs de voz e de imagem
  for (const p of semana.postagens.filter((p) => p.roteiro)) {
    const r = roteiro(p.roteiro);
    const entrega = join(pasta, "entrega", r.id);
    mkdirSync(entrega, { recursive: true });
    writeFileSync(join(entrega, "narracao.txt"), r.cenas.map((c) => c.fala).join("\n\n") + "\n");
    console.log(join(entrega, "narracao.txt"));
    const imagens = r.cenas.filter((c) => c.tipo === "imagem");
    if (imagens.length) {
      const blocos = imagens.map((c) => `===== imagem-${c.imagem}.jpg =====\n\n${c.semPersonagem ? "" : `${r.personagem}\n\n`}${c.prompt}\n\nFormato vertical 9:16. Sem nenhum texto, letra ou logo na imagem. Deixe espaço livre na parte de cima.`);
      writeFileSync(join(entrega, "prompts-imagens.txt"), blocos.join("\n\n\n") + "\n");
      console.log(join(entrega, "prompts-imagens.txt"));
    }
  }
}

const aspas = (t) => (/^[“"]/.test(t) ? t : `“${t}”`);

function descreverCena(c) {
  switch (c.tipo) {
    case "titulo": return `Título: ${aspas(c.texto)}`;
    case "imagem": return `Imagem ${c.imagem}${c.texto ? `, com o texto ${aspas(c.texto)}` : ""}`;
    case "mensagem": return `Mensagem para copiar (${c.rotulo})`;
    case "demo": return {
      lembretes: "Tela do Fio: lembretes de amanhã + WhatsApp + aviso 3h antes",
      link: "Tela do Fio: o cliente marca pelo link e cai na agenda",
      comissao: "Tela do Fio: comissão de cada barbeiro somada no mês",
      financeiro: "Tela do Fio: visão geral do financeiro e gráfico da semana",
    }[c.demo];
    case "fim": return `Encerramento: “${c.frase}”, agendafio.com.br`;
  }
}

// ---------- narração ----------

function acharArquivo(dir, base, exts) {
  for (const e of exts) if (existsSync(join(dir, `${base}.${e}`))) return join(dir, `${base}.${e}`);
  return null;
}

function decodificar(arquivo) {
  const tmp = join(tmpdir(), `fio-narracao-${process.pid}.wav`);
  execFileSync("npx", ["remotion", "ffmpeg", "-loglevel", "error", "-y", "-i", `"${arquivo}"`, "-ar", String(SR), "-ac", "1", "-c:a", "pcm_s16le", `"${tmp}"`], { shell: true });
  const b = readFileSync(tmp);
  rmSync(tmp);
  const d = b.indexOf("data") + 8;
  const n = Math.floor((b.length - d) / 2);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(d + i * 2) / 32768;
  return x;
}

/** Acha os trechos com fala (separados por silêncio). Aumenta a pausa mínima até sobrar o número de falas esperado. */
function trechosDeFala(x, esperado) {
  const J = Math.round(SR * 0.02);
  const rms = [];
  for (let s = 0; s + J <= x.length; s += J) {
    let e = 0;
    for (let i = s; i < s + J; i++) e += x[i] * x[i];
    rms.push(Math.sqrt(e / J));
  }
  const ordenado = [...rms].sort((a, b) => a - b);
  const limiar = Math.max(0.006, ordenado[Math.floor(ordenado.length * 0.95)] * 0.08);
  let trechos = [];
  for (const pausa of [0.45, 0.6, 0.8, 1.0, 1.3, 1.7]) {
    trechos = [];
    let inicio = -1;
    let ultimo = -1;
    rms.forEach((v, k) => {
      if (v < limiar) return;
      if (inicio < 0) inicio = k;
      else if ((k - ultimo) * 0.02 > pausa) {
        trechos.push([inicio, ultimo]);
        inicio = k;
      }
      ultimo = k;
    });
    if (inicio >= 0) trechos.push([inicio, ultimo]);
    trechos = trechos.filter(([a, b]) => (b - a) * 0.02 > 0.2).map(([a, b]) => [Math.max(0, a * J - SR * 0.04), Math.min(x.length, (b + 1) * J + SR * 0.08)]);
    if (trechos.length <= esperado) break;
  }
  // arquivo de uma fala só: do primeiro ao último som, com as pausas de dentro
  if (esperado === 1 && trechos.length > 1) trechos = [[trechos[0][0], trechos[trechos.length - 1][1]]];
  if (trechos.length !== esperado) {
    throw new Error(`a narração tem ${trechos.length} falas, mas o roteiro tem ${esperado}. Confira o silêncio de 1 s entre as falas.`);
  }
  return trechos.map(([a, b]) => x.subarray(Math.round(a), Math.round(b)));
}

// ---------- tempos ----------

/** Quadros mínimos de cada cena (mesmos valores de MINIMO_DEMO em src/Narrado.tsx). */
function minimo(c) {
  const ler = (t) => Math.ceil((1.5 + 0.3 * palavras(t)) * FPS);
  switch (c.tipo) {
    case "titulo": return ler(c.texto);
    case "imagem": return Math.max(Math.ceil(2.5 * FPS), c.texto ? ler(c.texto) : 0);
    case "mensagem": return Math.ceil((1.5 + 0.25 * palavras(`${c.rotulo} ${c.titulo ?? ""} ${c.texto}`)) * FPS);
    case "demo": return { lembretes: 330 - 62, link: 350 - 66, comissao: 372 - 196, financeiro: 240 - 56 }[c.demo];
    case "fim": return 150;
  }
}

const ANTES_DA_FALA = 9; // quadros entre o começo da cena e a fala (a cena entra primeiro)

function tempos(cenas, falas) {
  const inicios = [];
  let t = 0;
  cenas.forEach((c, i) => {
    inicios.push(t);
    const segundos = falas ? falas[i].length / SR : palavras(c.fala) / 2.6;
    t += Math.max(ANTES_DA_FALA + Math.ceil((segundos + 0.45) * FPS), minimo(c));
  });
  return { inicios, duracao: t };
}

// ---------- trilha ----------

const ACORDES = [
  [41, [57, 60, 64, 65]],
  [45, [55, 60, 64, 69]],
  [38, [57, 60, 62, 65]],
  [43, [55, 59, 62, 64]],
];
const BATIDA = 60 / 100;
const COMPASSO = BATIDA * 4;

function trilha(cenas, inicios, duracao, falas) {
  const DUR = duracao / FPS + 0.5;
  const fimMusica = q(inicios[cenas.length - 1]);
  const m = novaFaixa(DUR);
  for (let c = 0; c * COMPASSO < fimMusica; c++) {
    const t0 = c * COMPASSO;
    const [raiz, notas] = ACORDES[c % ACORDES.length];
    const dur = Math.min(COMPASSO, fimMusica - t0) + 0.4;
    notas.forEach((n, k) => tocar(m, t0, dur, pad(hz(n - 12), dur), 0.05, k % 2 ? 0.4 : -0.4));
    for (const b of [0, 2.5]) if (t0 + b * BATIDA < fimMusica) notas.forEach((n, k) => tocar(m, t0 + b * BATIDA + k * 0.012, 1.6, piano(hz(n)), 0.07, (k - 1.5) * 0.25));
    if (c >= 1) for (const b of [0, 1.5, 2, 3.5]) if (t0 + b * BATIDA < fimMusica) tocar(m, t0 + b * BATIDA, 0.5, baixo(hz(raiz)), 0.2);
  }
  for (let t = COMPASSO; t < fimMusica - 0.05; t += BATIDA / 2) {
    const passo = Math.round((t - COMPASSO) / (BATIDA / 2)) % 8;
    if (passo === 0 || passo === 3 || passo === 4) tocar(m, t, 0.4, bumbo, 0.55);
    if (passo === 2 || passo === 6) tocar(m, t, 0.3, palma(), 0.22, 0.1);
    tocar(m, t + (passo % 2 ? 0.02 : 0), 0.1, chimbal(), passo % 2 ? 0.16 : 0.09, 0.3);
  }
  [48, 52, 55, 59, 62].forEach((n, k) => {
    tocar(m, fimMusica + k * 0.03, 2.4, piano(hz(n + 12)), 0.06, (k - 2) * 0.2);
    tocar(m, fimMusica, DUR - fimMusica, pad(hz(n), DUR - fimMusica), 0.05, k % 2 ? 0.4 : -0.4);
  });
  tocar(m, fimMusica, 0.4, bumbo, 0.5);

  const fx = novaFaixa(DUR);
  cenas.forEach((c, i) => {
    const f0 = inicios[i];
    const em = (f) => q(f0 + f);
    if (i > 0 && c.tipo !== "fim") tocar(fx, em(0), 0.45, whoosh(0.45, true), 0.3);
    if (c.tipo === "titulo") tocar(fx, em(6), 0.2, pop, 0.25);
    if (c.tipo === "mensagem") {
      tocar(fx, em(14), 0.2, pop, 0.4);
      tocar(fx, em(30), 0.2, pop, 0.3);
    }
    if (c.tipo === "demo" && c.demo === "lembretes") {
      const d = (f) => em(f - 62);
      [112, 222, 244, 266].forEach((f) => tocar(fx, d(f), 0.1, toque, 0.55));
      for (let f = 126; f < 176; f += 1.6) tocar(fx, d(f), 0.04, tecla, 0.12);
      tocar(fx, d(182), 0.2, pop, 0.45);
      [228, 250, 272].forEach((f) => tocar(fx, d(f), 0.8, sino(hz(91)), 0.16));
      sucesso(fx, d(274), 0.34);
      notificacao(fx, d(306));
    }
    if (c.tipo === "demo" && c.demo === "link") {
      const d = (f) => em(f - 66);
      [128, 182, 224].forEach((f) => tocar(fx, d(f), 0.1, toque, 0.55));
      tocar(fx, d(138), 0.4, whoosh(0.4, false), 0.18);
      for (let k = 0; k < 9; k++) tocar(fx, d(146 + k * 2), 0.05, tique, 0.12);
      sucesso(fx, d(238));
      tocar(fx, d(276), 0.5, whoosh(0.5, true), 0.3);
      tocar(fx, d(324), 0.2, pop, 0.5);
    }
    if (c.tipo === "demo" && c.demo === "comissao") {
      const d = (f) => em(f - 196);
      tocar(fx, d(206), 0.5, whoosh(0.5, true), 0.3);
      for (let f = 226; f < 296; f += 3) tocar(fx, d(f), 0.05, tique, 0.13);
      sucesso(fx, d(296), 0.3);
    }
    if (c.tipo === "demo" && c.demo === "financeiro") {
      const d = (f) => em(f - 56);
      for (let k = 0; k < 4; k++) tocar(fx, d(72 + k * 6), 0.15, pop, 0.14);
      for (let f = 80; f < 160; f += 3) tocar(fx, d(f), 0.05, tique, 0.1);
      tocar(fx, d(168), 0.5, whoosh(0.5, true), 0.3);
      tocar(fx, d(218), 0.2, pop, 0.45);
    }
    if (c.tipo === "fim") {
      tocar(fx, em(0), 0.6, whoosh(0.6, false), 0.4);
      sucesso(fx, em(18), 0.3);
      tocar(fx, em(36), 0.2, pop, 0.4);
    }
  });

  // voz: cada fala no começo da sua cena; a música abaixa enquanto ela fala
  const voz = novaFaixa(DUR);
  if (falas) {
    falas.forEach((x, i) => {
      const d = Math.round(q(inicios[i] + ANTES_DA_FALA) * SR);
      for (let k = 0; k < x.length && d + k < voz[0].length; k++) {
        voz[0][d + k] += x[k];
        voz[1][d + k] += x[k];
      }
    });
  }
  const mix = novaFaixa(DUR);
  const janela = Math.round(SR * 0.05);
  let soma = 0;
  let g = 1;
  for (let i = 0; i < mix[0].length; i++) {
    soma += Math.abs(voz[0][i]);
    if (i >= janela) soma -= Math.abs(voz[0][i - janela]);
    const alvo = soma / janela > 0.01 ? 0.3 : 1;
    g = alvo < g ? Math.max(alvo, g - 1 / (SR * 0.06)) : Math.min(alvo, g + 1 / (SR * 0.45));
    for (let c = 0; c < 2; c++) mix[c][i] = (m[c][i] * 0.85 + fx[c][i]) * g * 2 + voz[c][i] * 2.2;
  }
  return ajustarVolume(mix, -14);
}

// ---------- gerar ----------

function renderizar(composicao, saida, props) {
  const args = ["remotion", "render", composicao, `"${saida}"`, "--crf=18", "--log=error"];
  if (props) {
    const arq = join(tmpdir(), `fio-props-${process.pid}.json`);
    writeFileSync(arq, JSON.stringify(props));
    args.push(`--props="${arq}"`);
  }
  execFileSync("npx", args, { stdio: "inherit", shell: true });
}

function gerarNarrado(p, prontos) {
  const r = roteiro(p.roteiro);
  const entrega = join(pasta, "entrega", r.id);
  const publico = join("public", "semanas", nomeSemana, r.id);
  mkdirSync(publico, { recursive: true });

  const AUDIO = ["mp3", "wav", "m4a", "ogg", "aac", "opus"];
  const arqNarracao = acharArquivo(entrega, "narracao", AUDIO);
  // um arquivo com tudo (falas separadas por silêncio) ou um arquivo por fala: fala-01.mp3, fala-02.mp3…
  const porFala = r.cenas.map((_, i) => acharArquivo(entrega, `fala-${String(i + 1).padStart(2, "0")}`, AUDIO));
  const falas = arqNarracao
    ? trechosDeFala(decodificar(arqNarracao), r.cenas.length)
    : porFala.every(Boolean)
      ? porFala.map((arq) => trechosDeFala(decodificar(arq), 1)[0])
      : null;

  const imagens = {};
  let faltaImagem = false;
  for (const c of r.cenas.filter((c) => c.tipo === "imagem")) {
    const arq = acharArquivo(entrega, `imagem-${c.imagem}`, ["jpg", "jpeg", "png", "webp"]);
    if (!arq) {
      imagens[c.imagem] = null;
      faltaImagem = true;
      continue;
    }
    const destino = join(publico, basename(arq));
    copyFileSync(arq, destino);
    imagens[c.imagem] = destino.replace(/\\/g, "/").replace(/^public\//, "");
  }

  const { inicios, duracao } = tempos(r.cenas, falas);
  const audio = join(publico, falas ? "trilha.wav" : "trilha-sem-voz.wav");
  salvar(audio, trilha(r.cenas, inicios, duracao, falas));

  const final = falas && !faltaImagem;
  const saida = final ? join(prontos, `${p.data}-${p.hora}-${r.id}.mp4`) : join(prontos, "previas", `${r.id}-previa${falas ? "" : "-sem-voz"}${faltaImagem ? "-sem-imagens" : ""}.mp4`);
  mkdirSync(join(prontos, "previas"), { recursive: true });
  renderizar("narrado", saida, { cenas: r.cenas, inicios, duracao, audio: audio.replace(/\\/g, "/").replace(/^public\//, ""), imagens });
  console.log(`  ${final ? "pronto" : "prévia"}: ${saida} (${(duracao / FPS).toFixed(1)} s${falas ? "" : ", tempo estimado"}${faltaImagem ? ", faltam imagens" : ""})`);
}

function gerar() {
  const prontos = join(pasta, "prontos");
  mkdirSync(prontos, { recursive: true });
  for (const p of semana.postagens) {
    const id = p.video ?? p.roteiro;
    if (filtro && !id.includes(filtro)) continue;
    console.log(`\n▶ ${DIAS[p.dia]} ${dataBR(p.data)} ${p.hora} · ${id}`);
    if (p.video) {
      const origem = join("out", `fio-${p.video}.mp4`);
      if (!existsSync(origem)) renderizar(p.video, origem);
      copyFileSync(origem, join(prontos, `${p.data}-${p.hora}-${p.video}.mp4`));
      console.log(`  pronto: ${join(prontos, `${p.data}-${p.hora}-${p.video}.mp4`)}`);
    } else {
      gerarNarrado(p, prontos);
    }
  }
}

if (comando === "kit") kit();
else gerar();
