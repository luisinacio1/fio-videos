// Gera as imagens dos stories da semana (semanas/<data>/stories.json) em semanas/<data>/stories/.
// Cada story vira um JPG 1080×1920 renderizado pela composição "story" (src/Story.tsx).
//   imagem "reels:<arquivo>@<segundo>" → tira o quadro do vídeo pronto (prontos/<arquivo>.mp4)
//   imagem "entrega:<caminho>"         → copia de semanas/<data>/entrega/<caminho>
//   outro caminho                      → já está em public/
// Uso (em videos/): node scripts/stories.mjs semanas/2026-11-02 [filtro]
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const [pasta, filtro] = process.argv.slice(2);
const nome = basename(pasta);
const { stories } = JSON.parse(readFileSync(join(pasta, "stories.json"), "utf8"));
const publico = join("public", "stories", nome);
mkdirSync(publico, { recursive: true });
mkdirSync(join(pasta, "stories"), { recursive: true });
const npx = (args) => execFileSync("npx", args, { shell: true, stdio: ["ignore", "pipe", "inherit"] });

for (const s of stories) {
  const arquivo = `${s.quando.replace(":", "h").replace("T", "-")}.jpg`;
  if (filtro && !arquivo.includes(filtro)) continue;
  const props = { ...s };
  delete props.quando;
  if (s.imagem?.startsWith("reels:")) {
    const [video, segundo] = s.imagem.slice(6).split("@");
    const quadro = join(publico, `quadro-${video}.jpg`);
    npx(["remotion", "ffmpeg", "-loglevel", "error", "-y", "-ss", segundo, "-i", `"${join(pasta, "prontos", `${video}.mp4`)}"`, "-frames:v", "1", "-q:v", "2", `"${quadro}"`]);
    props.imagem = `stories/${nome}/quadro-${video}.jpg`;
  } else if (s.imagem?.startsWith("entrega:")) {
    const origem = join(pasta, "entrega", s.imagem.slice(8));
    const destino = join(publico, s.imagem.slice(8).replace(/[\\/]/g, "-"));
    copyFileSync(origem, destino);
    props.imagem = `stories/${nome}/${basename(destino)}`;
  }
  const arqProps = join(tmpdir(), `fio-story-${process.pid}.json`);
  writeFileSync(arqProps, JSON.stringify(props));
  npx(["remotion", "still", "story", `"${join(pasta, "stories", arquivo)}"`, `--props="${arqProps}"`, "--image-format=jpeg", "--jpeg-quality=92", "--log=error"]);
  console.log(join(pasta, "stories", arquivo));
}
