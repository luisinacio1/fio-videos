import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, F } from "../../base";
import { borrao, cameraEm, type Chave, type Vista } from "../../motion/camera";
import { Objeto } from "../../motion/Objetos";
import type { Cena } from "../roteiro";
import { Som, entre, mola, useCena } from "../util";

/**
 * Cenas que explicam: a linha do tempo (anos numa linha, a câmera andando de um marco para o outro),
 * a comparação (duas colunas, itens surgindo em ordem e o vencedor em destaque) e os passos numerados.
 * Tudo que importa fica acima de y 1300, porque a legenda ocupa a faixa de 1330 a 1430.
 */

type CenaDe<T extends Cena["tipo"]> = Extract<Cena, { tipo: T }>;

const OURO = "#f2c063";
const CREME = "#f3ece4";
const LINHA_CLARA = "#d9c7b4";

/** fundo claro das cenas (o mesmo das cenas corte e objeto) */
function FundoClaro() {
  return (
    <>
      <AbsoluteFill style={{ background: CREME }} />
      <AbsoluteFill style={{ background: "radial-gradient(900px 900px at 50% 34%, #f8f2eb, #e6d6c5)" }} />
    </>
  );
}

/** a câmera sem mexer na altura: o ponto (x, y) do mundo fica no meio da largura e na mesma altura, e o zoom é em volta dele */
const camera = (v: Vista): React.CSSProperties => ({ transformOrigin: `${v.x}px ${v.y}px`, transform: `translateX(${540 - v.x}px) scale(${v.s})` });

/** quadro da referência, sem deixar "Infinity" (referência ausente) quebrar as contas */
const firme = (q: number, padrao: number) => (Number.isFinite(q) ? q : padrao);

// ---------------------------------------------------------------------------------------------
// Linha do tempo
// ---------------------------------------------------------------------------------------------

/** distância entre dois marcos no mundo (o vizinho aparece só na beirada, para dizer que a linha continua) */
const ESP = 700;
/** quadros da câmera indo de um marco para o próximo (chega quando a palavra é dita) */
const VIAGEM = 24;

export function LinhaDoTempo({ c }: { c: CenaDe<"linhaDoTempo"> }) {
  const { f, dur, em } = useCena();
  const comObjeto = c.marcos.some((m) => m.objeto);
  const LY = comObjeto ? 900 : 800;

  // tempos sempre crescentes (um marco fora de ordem não pode fazer a câmera voltar)
  let ultimo = -Infinity;
  const marcos = c.marcos.map((m, i) => {
    const q = Math.max(firme(em(m.em), 20 + i * 45), ultimo + VIAGEM / 2);
    ultimo = q;
    return { ...m, q, x: 540 + i * ESP };
  });
  const ult = marcos[marcos.length - 1];

  // câmera: começa um pouco antes do primeiro marco e viaja de um para o outro
  const chaves: Chave[] = [{ f: 0, x: marcos[0].x - 200, y: LY, s: 0.95 }];
  marcos.forEach((m, i) => {
    const chega = Math.max(chaves[chaves.length - 1].f + 1, m.q + 2, i === 0 ? 18 : 0);
    if (i > 0) chaves.push({ f: Math.max(chaves[chaves.length - 1].f + 1, chega - VIAGEM), x: marcos[i - 1].x, y: LY, s: 1 });
    chaves.push({ f: chega, x: m.x, y: LY, s: 1 });
  });
  chaves.push({ f: Math.max(chaves[chaves.length - 1].f + 1, dur), x: ult.x + 50, y: LY, s: 1.05, e: Easing.linear });
  const cam = cameraEm(f, chaves);
  const desfoque = borrao(f, chaves, 7);

  // a linha se desenha junto com a câmera (a "caneta" está no centro do quadro)
  const caneta = Math.min(cam.x, ult.x);
  const inicio = marcos[0].x - 900;
  const fim = ult.x + 900;
  // o marco atual é o último que a caneta já alcançou
  let atual = -1;
  marcos.forEach((m, i) => {
    if (f >= m.q - 4) atual = i;
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <FundoClaro />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...camera(cam), filter: desfoque > 0.3 ? `blur(${desfoque}px)` : undefined }}>
        <svg width={fim + 200} height={1920} viewBox={`0 0 ${fim + 200} 1920`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* régua: tracinhos ao longo da linha */}
          {Array.from({ length: Math.ceil((fim - inicio) / 70) }, (_, k) => {
            const x = inicio + k * 70;
            const grande = Math.round((x - marcos[0].x) / 70) % 5 === 0;
            return <line key={k} x1={x} y1={LY + 26} x2={x} y2={LY + (grande ? 48 : 38)} stroke={x <= caneta ? C.escuro : LINHA_CLARA} strokeWidth={4} strokeLinecap="round" opacity={x <= caneta ? 0.35 : 0.8} />;
          })}
          {/* o que falta: tracejado claro; o que já passou: linha cheia */}
          <line x1={inicio} y1={LY} x2={fim} y2={LY} stroke={LINHA_CLARA} strokeWidth={10} strokeLinecap="round" strokeDasharray="2 26" />
          <line x1={inicio} y1={LY} x2={Math.max(inicio, caneta)} y2={LY} stroke={C.escuro} strokeWidth={12} strokeLinecap="round" />
          {/* seta do tempo no fim da linha */}
          <path d={`M${fim - 10} ${LY - 26} L${fim + 24} ${LY} L${fim - 10} ${LY + 26}`} fill="none" stroke={LINHA_CLARA} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
          {marcos.map((m, i) => {
            const chegou = caneta >= m.x - 4;
            const pop = mola(f, m.q - 2, { damping: 9, stiffness: 240 });
            const onda = entre(f, m.q, m.q + 26);
            const ativo = i === atual;
            return (
              <g key={i}>
                {/* haste até o cartão */}
                {chegou && <line x1={m.x} y1={LY} x2={m.x} y2={LY + 80 * pop} stroke={C.escuro} strokeWidth={6} strokeLinecap="round" />}
                {chegou && onda < 1 && <circle cx={m.x} cy={LY} r={32 + onda * 50} fill="none" stroke={C.acento} strokeWidth={6} opacity={(1 - onda) * 0.7} />}
                <circle cx={m.x} cy={LY} r={26} fill={CREME} stroke={chegou ? C.escuro : LINHA_CLARA} strokeWidth={8} />
                {chegou && <circle cx={m.x} cy={LY} r={34 * pop} fill={ativo ? C.acento : C.escuro} stroke={CREME} strokeWidth={8} />}
                {chegou && <circle cx={m.x} cy={LY} r={11 * pop} fill={ativo ? OURO : CREME} />}
              </g>
            );
          })}
        </svg>
        {marcos.map((m, i) => {
          const ano = mola(f, m.q - 4, { damping: 12, stiffness: 190 });
          const cartao = mola(f, m.q + 2, { damping: 13, stiffness: 200 });
          if (f < m.q - 4) return null;
          const passado = i < atual;
          const tam = m.texto.length > 60 ? 46 : m.texto.length > 36 ? 52 : 58;
          return (
            <React.Fragment key={i}>
              {m.objeto && (
                <div style={{ position: "absolute", left: m.x - 170, top: LY - 620, width: 340, height: 340, transformOrigin: "50% 100%", transform: `scale(${0.6 + 0.4 * ano})`, opacity: Math.min(1, ano * 1.4) * (passado ? 0.5 : 1) }}>
                  <Objeto nome={m.objeto} f={f - m.q} tamanho={340} />
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  left: m.x - 340,
                  width: 680,
                  top: LY - 250,
                  height: 200,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  fontFamily: F.serif,
                  fontWeight: 700,
                  fontSize: m.ano.length > 6 ? 130 : 180,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                  color: passado ? C.texto : C.acento,
                  opacity: ano * (passado ? 0.45 : 1),
                  transform: `translateY(${(1 - ano) * 60}px)`,
                }}
              >
                {m.ano}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: m.x - 290,
                  width: 580,
                  top: LY + 80,
                  boxSizing: "border-box",
                  padding: "34px 40px",
                  borderRadius: 40,
                  background: "#fffaf5",
                  border: `4px solid ${passado ? "#e6d6c5" : C.escuro}`,
                  boxShadow: "0 30px 60px -30px rgba(60,30,10,0.45)",
                  fontFamily: F.sans,
                  fontWeight: 700,
                  fontSize: tam,
                  lineHeight: 1.18,
                  letterSpacing: "-0.01em",
                  color: C.texto,
                  textAlign: "center",
                  transform: `scale(${0.85 + 0.15 * cartao}) translateY(${(1 - cartao) * 40}px)`,
                  transformOrigin: "50% 0",
                  opacity: Math.min(1, cartao * 1.5) * (passado ? 0.5 : 1),
                }}
              >
                {m.texto}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {marcos.map((m, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Som em={m.q + 2 - VIAGEM} tipo="whoosh" vol={0.7} />}
          <Som em={m.q - 2} tipo="pop" vol={0.8} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------------------------
// Comparação
// ---------------------------------------------------------------------------------------------

/** marca do item: neutra antes do veredito; certo no vencedor e xis no outro lado depois */
function Marca({ tipo, s }: { tipo: "neutra" | "certo" | "xis"; s: number }) {
  const fundo = tipo === "certo" ? C.ok : tipo === "xis" ? C.acento : C.escuro;
  return (
    <svg width={56} height={56} viewBox="0 0 56 56" style={{ flexShrink: 0, transform: `scale(${s})` }}>
      <circle cx={28} cy={28} r={26} fill={fundo} />
      {tipo === "certo" && <path d="M16 29 L24 37 L40 20" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />}
      {tipo === "xis" && <path d="M19 19 L37 37 M37 19 L19 37" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />}
      {tipo === "neutra" && <circle cx={28} cy={28} r={8} fill={OURO} />}
    </svg>
  );
}

export function Compara({ c }: { c: CenaDe<"compara"> }) {
  const { f, dur, em } = useCena();
  const lados = [c.esquerda, c.direita] as const;
  const nomes = ["esquerda", "direita"] as const;

  // tempo de cada item: os de `revela` na ordem (esquerda e depois direita); os que sobram entram em fila
  const itens = lados.flatMap((l, lado) => l.itens.map((texto, i) => ({ lado, i, texto })));
  let antes = 10;
  const quando = itens.map((_, k) => {
    const ref = c.revela?.[k];
    const q = ref ? firme(em(ref), antes + 14) : antes + (k === 0 ? 4 : 14);
    antes = q;
    return q;
  });
  const qDe = (lado: number, i: number) => quando[itens.findIndex((x) => x.lado === lado && x.i === i)];
  const ultimo = Math.max(...quando, 10);

  // o veredito: logo depois do último item (sem passar do fim da cena)
  const vence = c.vencedor ? nomes.indexOf(c.vencedor) : -1;
  const qv = vence >= 0 ? Math.max(ultimo + 8, Math.min(ultimo + 24, dur - 40)) : Infinity;
  const v = vence >= 0 ? mola(f, qv, { damping: 11, stiffness: 170 }) : 0;
  const decidido = vence >= 0 && f >= qv;

  // câmera: chega perto devagar e, no veredito, encosta um pouco no vencedor
  const chaves: Chave[] = [
    { f: 0, x: 540, y: 760, s: 1 },
    { f: Math.max(1, Number.isFinite(qv) ? qv : dur), x: 540, y: 760, s: 1.02, e: Easing.linear },
  ];
  if (vence >= 0) chaves.push({ f: Math.max(qv + 1, qv + 22), x: vence === 0 ? 524 : 556, y: 760, s: 1.03 }, { f: Math.max(qv + 23, dur), x: vence === 0 ? 522 : 558, y: 760, s: 1.035, e: Easing.linear });
  const cam = cameraEm(f, chaves);

  const temObjeto = lados.some((l) => l.objeto);
  const maisItens = Math.max(c.esquerda.itens.length, c.direita.itens.length);
  const tamItem = maisItens > 4 ? 42 : 50;
  // título numa linha só (o "vs" fica na altura da divisória embaixo dele)
  const tamTitulo = (t: string) => (t.length > 12 ? 50 : t.length > 9 ? 60 : 76);
  const maiorTitulo = Math.max(tamTitulo(c.esquerda.titulo), tamTitulo(c.direita.titulo));
  // sem ícone, o cartão ganha mais folga em cima para o selo do vencedor não encostar no título
  const folga = temObjeto ? 48 : 70;
  const divisoria = folga + (temObjeto ? 170 + 22 : 0) + maiorTitulo * 1.05 + 26 + 2;
  const vs = mola(f, 10, { damping: 10, stiffness: 220 });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <FundoClaro />
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, ...camera(cam) }}>
        <div style={{ position: "absolute", left: 44, right: 44, top: 170, height: 1120, display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 36, alignItems: "stretch", width: "100%" }}>
            {lados.map((l, lado) => {
              const chega = mola(f, 2 + lado * 6, { damping: 14, stiffness: 170 });
              const ganha = lado === vence;
              const perde = vence >= 0 && !ganha;
              const escala = 1 + (ganha ? 0.04 : perde ? -0.04 : 0) * v;
              return (
                <div
                  key={lado}
                  style={{
                    flex: 1,
                    position: "relative",
                    zIndex: lado === 0 ? 2 : 1,
                    boxSizing: "border-box",
                    borderRadius: 48,
                    background: "#fffaf5",
                    border: `6px solid ${ganha && decidido ? C.ok : C.escuro}`,
                    boxShadow: ganha && decidido ? `0 0 0 ${10 * v}px rgba(61,122,76,0.18), 0 40px 70px -30px rgba(30,60,30,0.55)` : "0 30px 60px -30px rgba(60,30,10,0.45)",
                    padding: `${folga}px 30px 44px`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 22,
                    transform: `translateY(${(1 - chega) * 120}px) scale(${escala})`,
                    opacity: Math.min(1, chega * 1.5) * (perde ? 1 - 0.4 * v : 1),
                    filter: perde && v > 0.01 ? `grayscale(${0.7 * v})` : undefined,
                  }}
                >
                  {/* selo do vencedor */}
                  {ganha && decidido && (
                    <div style={{ position: "absolute", left: "50%", top: -58, transform: `translateX(-50%) scale(${v})`, width: 104, height: 104, borderRadius: 99, background: C.ok, border: `6px solid #fffaf5`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 30px -12px rgba(30,60,30,0.6)" }}>
                      <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                  {/* "vs" no vão entre as colunas, na altura da divisória dos títulos */}
                  {lado === 0 && (
                    <div style={{ position: "absolute", right: -86, top: divisoria - 62, width: 124, height: 124, boxSizing: "border-box", borderRadius: 99, background: C.escuro, border: `6px solid ${OURO}`, color: CREME, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontStyle: "italic", fontWeight: 700, fontSize: 56, transform: `scale(${vs * (1 - 0.25 * v)})`, opacity: 1 - 0.6 * v }}>
                      vs
                    </div>
                  )}
                  {temObjeto && (
                    <div style={{ height: 170, display: "flex", justifyContent: "center" }}>
                      {l.objeto && <Objeto nome={l.objeto} f={f} tamanho={170} />}
                    </div>
                  )}
                  <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: tamTitulo(l.titulo), lineHeight: 1.05, whiteSpace: "nowrap", letterSpacing: "-0.02em", color: ganha && decidido ? C.ok : C.texto, textAlign: "center", paddingTop: (maiorTitulo - tamTitulo(l.titulo)) * 1.05, paddingBottom: 26, borderBottom: `4px solid ${C.divisoria}` }}>
                    {l.titulo}
                  </div>
                  {l.itens.map((texto, i) => {
                    const q = qDe(lado, i);
                    const s = mola(f, q - 2, { damping: 13, stiffness: 210 });
                    const marca = !decidido ? "neutra" : ganha ? "certo" : "xis";
                    const troca = decidido ? mola(f, qv + 4 + i * 3, { damping: 10, stiffness: 240 }) : 1;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 18,
                          fontFamily: F.sans,
                          fontWeight: 700,
                          fontSize: tamItem,
                          lineHeight: 1.12,
                          letterSpacing: "-0.01em",
                          color: C.texto,
                          opacity: f < q - 2 ? 0 : Math.min(1, s * 1.4),
                          transform: `translateX(${(1 - s) * (lado === 0 ? -80 : 80)}px)`,
                        }}
                      >
                        <Marca tipo={marca} s={troca} />
                        <span>{texto}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {quando.map((q, k) => (
        <Som key={k} em={q - 2} tipo="pop" vol={0.7} />
      ))}
      {vence >= 0 && <Som em={qv} tipo="sucesso" />}
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------------------------
// Passos
// ---------------------------------------------------------------------------------------------

export function Passos({ c }: { c: CenaDe<"passos"> }) {
  const { f, dur, em } = useCena();
  const n = c.passos.length;
  const temObjeto = c.passos.some((p) => p.objeto);

  let antes = 0;
  const passos = c.passos.map((p, i) => {
    const q = Math.max(firme(em(p.em), 16 + i * 30), antes + 6);
    antes = q;
    return { ...p, q };
  });
  let atual = -1;
  passos.forEach((p, i) => {
    if (f >= p.q - 3) atual = i;
  });

  // o espaço dos passos: abaixo do título e acima da legenda
  const topo = c.titulo ? 390 : 250;
  const base = 1290;
  const altura = Math.min(250, (base - topo) / n);
  const circ = Math.min(150, altura - 44);
  const tamTexto = altura >= 200 ? 58 : 50;
  const tamIcone = Math.min(190, altura - 40);
  const cx = 88 + circ / 2;
  const meio = (i: number) => topo + i * altura + altura / 2;

  const titulo = mola(f, 2, { damping: 14, stiffness: 170 });
  const zoom = entre(f, 0, dur, [1, 1.03], Easing.linear);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <FundoClaro />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "540px 760px" }}>
        {c.titulo && (
          <div style={{ position: "absolute", left: 80, right: 80, top: 170, height: 190, display: "flex", alignItems: "center", fontFamily: F.serif, fontWeight: 700, fontSize: c.titulo.length > 22 ? 72 : 88, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.texto, opacity: titulo, transform: `translateY(${(1 - titulo) * 40}px)` }}>
            {c.titulo}
          </div>
        )}
        {/* cartão branco atrás do passo atual */}
        {atual >= 0 && (
          <div
            style={{
              position: "absolute",
              left: 50,
              right: 50,
              top: meio(atual) - (altura - 22) / 2,
              height: altura - 22,
              borderRadius: 44,
              background: "#fffaf5",
              boxShadow: "0 30px 60px -30px rgba(60,30,10,0.45)",
              border: `4px solid ${C.escuro}`,
              transform: `scaleY(${0.8 + 0.2 * mola(f, passos[atual].q - 3, { damping: 14, stiffness: 220 })})`,
            }}
          />
        )}
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          {/* ligação entre os números: tracejada antes, cheia quando o próximo passo chega */}
          {passos.slice(1).map((p, i) => {
            const y1 = meio(i) + circ / 2 + 8;
            const y2 = meio(i + 1) - circ / 2 - 8;
            const t = entre(f, p.q - 10, p.q - 2);
            return (
              <g key={i}>
                <line x1={cx} y1={y1} x2={cx} y2={y2} stroke={LINHA_CLARA} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 18" />
                {t > 0 && <line x1={cx} y1={y1} x2={cx} y2={y1 + (y2 - y1) * t} stroke={C.escuro} strokeWidth={8} strokeLinecap="round" />}
              </g>
            );
          })}
        </svg>
        {passos.map((p, i) => {
          const s = mola(f, p.q - 3, { damping: 10, stiffness: 220 });
          // o texto entra junto com o número (o cartão nunca aparece vazio)
          const txt = mola(f, p.q - 3, { damping: 14, stiffness: 190 });
          const chegou = f >= p.q - 3;
          const ativo = i === atual;
          const y = meio(i);
          return (
            <React.Fragment key={i}>
              {/* número: um aro claro esperando; cheio quando o passo chega */}
              <div style={{ position: "absolute", left: 88, top: y - circ / 2, width: circ, height: circ, borderRadius: 999, boxSizing: "border-box", border: `8px ${chegou ? "solid" : "dashed"} ${chegou ? (ativo ? C.acento : C.escuro) : LINHA_CLARA}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontWeight: 700, fontSize: circ * 0.56, color: LINHA_CLARA }}>
                {!chegou && i + 1}
              </div>
              {chegou && (
                <div style={{ position: "absolute", left: 88, top: y - circ / 2, width: circ, height: circ, borderRadius: 999, background: ativo ? C.acento : C.escuro, color: ativo ? "#fff" : CREME, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.serif, fontWeight: 700, fontSize: circ * 0.56, lineHeight: 1, transform: `scale(${s})`, boxShadow: ativo ? `0 0 0 ${8 * s}px rgba(176,81,58,0.22)` : undefined }}>
                  {i + 1}
                </div>
              )}
              {chegou && (
                <div
                  style={{
                    position: "absolute",
                    left: 88 + circ + 40,
                    right: 90 + (temObjeto ? tamIcone + 20 : 0),
                    top: y - altura / 2,
                    height: altura,
                    display: "flex",
                    alignItems: "center",
                    fontFamily: F.sans,
                    fontWeight: 800,
                    fontSize: p.texto.length > 34 ? tamTexto - 8 : tamTexto,
                    lineHeight: 1.12,
                    letterSpacing: "-0.015em",
                    color: C.texto,
                    opacity: Math.min(1, txt * 1.4) * (ativo ? 1 : 0.55),
                    transform: `translateX(${(1 - txt) * 70}px)`,
                  }}
                >
                  {p.texto}
                </div>
              )}
              {chegou && p.objeto && (
                <div style={{ position: "absolute", right: 86, top: y - tamIcone / 2, width: tamIcone, height: tamIcone, transform: `scale(${s})`, opacity: ativo ? 1 : 0.55 }}>
                  <Objeto nome={p.objeto} f={f - p.q} tamanho={tamIcone} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {passos.map((p, i) => (
        <Som key={i} em={p.q - 3} tipo="pop" vol={0.8} />
      ))}
    </AbsoluteFill>
  );
}
