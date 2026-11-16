// Confere o que vai a público: lista os arquivos como o git enviaria a partir da pasta
// e barra segredos e pastas que ficam só no computador.
// Uso: node scripts/publico/conferir-publico.mjs [pasta]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, join, extname, basename } from "node:path";

const pasta = resolve(process.argv[2] ?? process.cwd());

const PASTAS_PROIBIDAS = [
  "narracoes/", "gravacao/", "tour/", "semanas/", "vsl/",
  "public/stories/", "public/v13/", "public/v14/", "public/narracao/", "public/audio/", "public/vsl/",
];
const BINARIOS = new Set([
  ".mp4", ".mov", ".webm", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp3", ".wav", ".ogg", ".m4a",
  ".ttf", ".otf", ".woff", ".woff2", ".ico", ".glb", ".zip", ".pdf",
]);
// Só valores de segredo; a palavra "service_role" sozinha é comentário e passa (decisão 5).
const PADROES = [
  { re: /sk-ant-[A-Za-z0-9_-]{20,}/, motivo: "chave sk-ant" },
  { re: /eyJhbGciOi[A-Za-z0-9_-]{20,}/, motivo: "JWT" },
  { re: /EAA[A-Za-z0-9]{40,}/, motivo: "token da Meta" },
];
const ATRIBUICAO = /\b(INSTAGRAM_TOKEN|INSTAGRAM_APP_SECRET|CLAUDE_CODE_OAUTH_TOKEN|SUPABASE_SERVICE_ROLE_KEY|FIO_SUPABASE_SERVICE_KEY)\s*=\s*["']?([^\s"']*)/g;

function valorEhSegredo(valor) {
  if (!valor) return false; // vazio
  if (valor.startsWith("$") || valor.startsWith("<") || valor.startsWith("process.env")) return false; // referência
  return true;
}

// -z evita aspas nos nomes; a saída já vem relativa à pasta e com "/"
const saida = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  cwd: pasta, encoding: "utf8", maxBuffer: 256 * 1024 * 1024,
});
const arquivos = [...new Set(saida.split("\0").filter(Boolean).map((p) => p.replaceAll("\\", "/")))];

const problemas = [];
for (const arq of arquivos) {
  if (PASTAS_PROIBIDAS.some((p) => arq.startsWith(p))) {
    problemas.push(`${arq}:0 pasta que fica só no computador`);
    continue;
  }
  if (basename(arq).startsWith(".env")) {
    problemas.push(`${arq}:0 arquivo .env`);
    continue;
  }
  if (BINARIOS.has(extname(arq).toLowerCase())) continue;
  let texto;
  try { texto = readFileSync(join(pasta, arq)); } catch { continue; }
  if (texto.includes(0)) continue; // binário
  const linhas = texto.toString("utf8").split(/\r?\n/);
  linhas.forEach((linha, i) => {
    for (const { re, motivo } of PADROES) {
      if (re.test(linha)) problemas.push(`${arq}:${i + 1} ${motivo}`);
    }
    for (const m of linha.matchAll(ATRIBUICAO)) {
      if (valorEhSegredo(m[2])) problemas.push(`${arq}:${i + 1} ${m[1]} com valor`);
    }
  });
}

if (problemas.length) {
  console.error("NÃO publicar. Problemas encontrados:");
  for (const p of problemas) console.error("  " + p);
  process.exit(1);
}
console.log(`pronto para publicar: ${arquivos.length} arquivos`);
