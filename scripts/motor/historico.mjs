// Mostra os últimos posts do Instagram (o que já saiu e o que está na fila), para os roteiros novos não repetirem tema.
//   node scripts/motor/historico.mjs [quantos]
// Precisa de FIO_SUPABASE_SERVICE_KEY (chave service_role da produção); FIO_SUPABASE_URL é opcional.
const URL_ = process.env.FIO_SUPABASE_URL ?? "https://jtcymmkstzmjednnrvxb.supabase.co";
const CHAVE = process.env.FIO_SUPABASE_SERVICE_KEY;
if (!CHAVE) throw new Error("falta FIO_SUPABASE_SERVICE_KEY");
const quantos = Number(process.argv[2] ?? 30);

const r = await fetch(`${URL_}/rest/v1/instagram_post?select=video,legenda,publicar_em,estado,erro&tipo=eq.reels&order=publicar_em.desc&limit=${quantos}`, {
  headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` },
});
if (!r.ok) throw new Error(`${r.status}: ${await r.text()}`);
for (const p of await r.json()) {
  const quando = new Date(p.publicar_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  console.log(`${quando}  [${p.estado}${p.erro ? `: ${p.erro}` : ""}]  ${p.video}\n    ${p.legenda.split("\n")[0]}`);
}
