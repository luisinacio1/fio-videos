// Põe os vídeos do motor na fila do Instagram (tabela instagram_post da produção), pela API do Supabase.
//   node scripts/motor/publicar.mjs 2026-11-05 8h:diario/2026-11-05/a.json 12h:diario/2026-11-05/b.json 18h:...
// Sobe out/motor/<id>.mp4 para o bucket "instagram" (diario/<dia>/...) e agenda no dia e hora, com a legenda do roteiro
// e as hashtags. Precisa de FIO_SUPABASE_SERVICE_KEY (chave service_role da produção); FIO_SUPABASE_URL é opcional.
// Quem posta é a função instagram-postar (a cada 5 min). Vídeo já na fila fica de fora; com --trocar, o arquivo dele é
// substituído pelo render novo (só se ainda não foi postado).
import { readFileSync } from "node:fs";

const URL_ = process.env.FIO_SUPABASE_URL ?? "https://jtcymmkstzmjednnrvxb.supabase.co";
const CHAVE = process.env.FIO_SUPABASE_SERVICE_KEY;
const HASHTAGS = "#barbearia #barbeiro #barbershop #barbeirosbrasil #agendaonline";
if (!CHAVE) throw new Error("falta FIO_SUPABASE_SERVICE_KEY");
const trocar = process.argv.includes("--trocar");
const [dia, ...itens] = process.argv.slice(2).filter((a) => a !== "--trocar");
if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? "") || !itens.length) throw new Error("uso: publicar.mjs AAAA-MM-DD 8h:roteiro.json [...]");

const cabecalho = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };
async function api(caminho, opcoes = {}) {
  const r = await fetch(`${URL_}${caminho}`, { ...opcoes, headers: { ...cabecalho, ...opcoes.headers } });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${caminho}: ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

for (const item of itens) {
  const [hora, arquivo] = item.split(/:(.+)/);
  const r = JSON.parse(readFileSync(arquivo, "utf8"));
  const destino = `diario/${dia}/${hora}-${r.id}.mp4`;
  const quando = new Date(`${dia}T${hora.replace("h", "").padStart(2, "0")}:00:00-03:00`);
  const ja = await api(`/rest/v1/instagram_post?select=id,estado&video=eq.${encodeURIComponent(destino)}`);
  if (ja.length && trocar && ja[0].estado === "agendado") {
    await api(`/storage/v1/object/instagram/${destino}`, { method: "POST", headers: { "Content-Type": "video/mp4", "x-upsert": "true" }, body: readFileSync(`out/motor/${r.id}.mp4`) });
    console.log(`trocado: ${destino}`);
    continue;
  }
  if (ja.length) {
    console.log(`já na fila (${ja[0].estado}): ${destino}`);
    continue;
  }
  if (+quando < Date.now()) {
    console.log(`horário já passou, fica de fora: ${destino}`);
    continue;
  }
  const mp4 = readFileSync(`out/motor/${r.id}.mp4`);
  await api(`/storage/v1/object/instagram/${destino}`, { method: "POST", headers: { "Content-Type": "video/mp4", "x-upsert": "true" }, body: mp4 });
  await api(`/storage/v1/object/instagram/diario/${dia}/${hora}-${r.id}.json`, { method: "POST", headers: { "Content-Type": "application/json", "x-upsert": "true" }, body: JSON.stringify(r) });
  const linha = await api("/rest/v1/instagram_post", {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ tipo: "reels", video: destino, legenda: `${r.legenda}\n\n${HASHTAGS}`, publicar_em: quando.toISOString() }),
  });
  console.log(`agendado: ${destino} para ${quando.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (id ${linha[0].id})`);
}
