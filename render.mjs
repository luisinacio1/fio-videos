// Gera os vídeos em out/ (MP4, 1080x1920; 01 a 05 com 15 s, 06 é o Reels de 50 s e 07 é o mesmo Reels narrado). Uso: npm run render  (ou: npm run render -- 02)
import { execFileSync } from "node:child_process";

const IDS = ["01-agendamento-pelo-link", "02-lembretes-whatsapp", "03-agenda-e-bloqueios", "04-equipe-e-comissao", "05-financeiro", "06-reels-cliente-nao-veio", "07-reels-cliente-nao-veio-narrado"];
const filtro = process.argv[2];

for (const id of IDS.filter((i) => !filtro || i.startsWith(filtro))) {
  console.log(`\n▶ ${id}`);
  execFileSync("npx", ["remotion", "render", id, `out/fio-${id}.mp4`, "--crf=18", "--log=error"], { stdio: "inherit", shell: true });
}
