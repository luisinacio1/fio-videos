// Horário do blog: o post aparece às 18h de Brasília do dia dele (Brasília não tem horário de verão: -03:00 fixo).

/** "2026-11-17" → instante das 18h de Brasília desse dia, em ISO (UTC). */
export function publicarEm(dia) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia ?? "")) throw new Error(`dia fora do formato AAAA-MM-DD: ${dia}`);
  return new Date(`${dia}T18:00:00-03:00`).toISOString();
}

/** O dia seguinte ao de hoje em Brasília, como "AAAA-MM-DD". */
export function amanha(agora = new Date()) {
  const hojeEmBrasilia = new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
  const d = new Date(`${hojeEmBrasilia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
