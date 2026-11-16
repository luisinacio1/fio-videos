import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import { C, F } from "../../base";
import { cameraEm, transformMundo, type Chave } from "../../motion/camera";
import { Cabeca, ELENCO, piscada } from "../../motion/Personagens";
import { LogoBarbearia } from "../../motion/TelasFio";
import type { Boca, Cena, Reacao } from "../roteiro";
import { Som, entre, mistura, mola, sai, sorte, useCena } from "../util";

/**
 * Cenários desenhados (vetor, cores do Fio): quarto, sala, barbearia e cidade.
 * Cada um tem a própria câmera, que anda devagar e se aproxima no tempo das palavras.
 */

type CenaDe<T extends Cena["tipo"]> = Extract<Cena, { tipo: T }>;

/** Câmera de um cenário de 1080 × 1920. */
function Camera({ f, chaves, children }: { f: number; chaves: Chave[]; children: React.ReactNode }) {
  const cam = cameraEm(f, chaves);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: transformMundo(cam) }}>{children}</div>
    </AbsoluteFill>
  );
}

/** Expressão do personagem num quadro, a partir da lista de reações do roteiro. */
function expressao(f: number, reacoes: { em: number; r: Reacao }[], padrao: { boca: Boca; olhar: [number, number] }) {
  let boca = padrao.boca;
  let olhar = padrao.olhar;
  let sacode = 0;
  let acordado = false;
  for (const { em, r } of reacoes) {
    if (f < em) continue;
    if (r.boca) boca = r.boca;
    if (r.olhar) olhar = r.olhar === "cima" ? [0, -13] : r.olhar === "celular" ? [0, 8] : r.olhar === "lado" ? [14, -6] : [0, 0];
    if (r.sacode && f < em + 22) sacode = Math.sin((f - em) * 0.9) * 7 * (1 - (f - em) / 22);
    if (r.acorda) acordado = true;
  }
  return { boca, olhar, sacode, acordado };
}

// ---------- quarto ----------

export function Quarto({ c }: { c: CenaDe<"quarto"> }) {
  const { f, dur, em } = useCena();
  const p = ELENCO[c.personagem];
  const amanhece = em(c.amanhece);
  const dia = entre(f, amanhece - 4, amanhece + 26);
  const vira = em(c.viraPlaca);
  const acende = em(c.celularAcende);
  const placaInicial = c.placa ?? "ABERTO";
  const outra = placaInicial === "ABERTO" ? "FECHADO" : "ABERTO";
  const giro = entre(f, vira, vira + 10);
  const face = giro > 0.5 ? outra : placaInicial;
  const balanco = f > vira ? 9 * Math.sin((f - vira) * 0.28) * Math.exp(-(f - vira) / 22) : 0;
  const reacoes = (c.reacoes ?? []).map((r) => ({ em: em(r.em), r }));
  const ex = expressao(f, reacoes, { boca: "neutra", olhar: [-4, -2] });
  const acordado = ex.acordado || f >= amanhece + 10;
  const chegou = f >= acende;
  const treme = chegou && f < acende + 16 ? Math.sin(f * 2.4) * 3 : 0;
  const hora = dia > 0.5 ? "07:00" : (c.hora ?? "23:00");
  const respira = Math.sin(f / 18) * 4;
  const chaves: Chave[] = c.comecaNoRelogio
    ? [
        { f: 0, x: 132, y: 1257, s: 3.4 },
        { f: 20, x: 132, y: 1257, s: 3.1, e: Easing.linear },
        { f: 48, x: 540, y: 980, s: 1.0 },
        { f: dur, x: 545, y: 975, s: 1.06, e: Easing.linear },
      ]
    : [
        { f: 0, x: 540, y: 990, s: 1.12 },
        { f: dur, x: 540, y: 975, s: 1.0, e: Easing.linear },
      ];
  if (Number.isFinite(acende)) {
    const base = cameraEm(acende - 12, chaves);
    chaves.splice(0, chaves.length, ...chaves.filter((k) => k.f < acende - 12), { f: acende - 12, ...base }, { f: acende + 8, x: 430, y: 1080, s: 1.35 }, { f: Math.max(acende + 9, amanhece + 30, dur), x: 520, y: 990, s: 1.02 });
  }
  return (
    <Camera f={f} chaves={chaves}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="mCeuQuarto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={mistura("#141b30", "#8fc6e3", dia)} />
            <stop offset="1" stopColor={mistura("#2b2240", "#f7dfba", dia)} />
          </linearGradient>
          <filter id="mBrilho" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width={1080} height={1920} fill={mistura("#1d1713", "#efe2d0", dia)} />
        <rect x={110} y={250} width={360} height={510} rx={10} fill="url(#mCeuQuarto)" />
        {[...Array(14)].map((_, i) => (
          <circle key={i} cx={130 + sorte(i) * 320} cy={270 + sorte(i + 40) * 300} r={2 + sorte(i + 9) * 2.5} fill="#fff" opacity={(1 - dia) * (0.5 + 0.5 * Math.sin(f / 9 + i))} />
        ))}
        <g opacity={1 - dia}>
          <circle cx={360} cy={380} r={46} fill="#f3ece4" />
          <circle cx={346} cy={372} r={8} fill="#ddd3c6" />
          <circle cx={372} cy={398} r={6} fill="#ddd3c6" />
        </g>
        <circle cx={240} cy={760 - dia * 330} r={58} fill="#f2b25c" opacity={dia} />
        <rect x={110} y={250} width={360} height={510} rx={10} fill="none" stroke="#4a3426" strokeWidth={22} />
        <line x1={290} y1={250} x2={290} y2={760} stroke="#4a3426" strokeWidth={14} />
        <line x1={110} y1={505} x2={470} y2={505} stroke="#4a3426" strokeWidth={14} />
        <polygon points="120,760 470,760 900,1540 260,1540" fill="#c8d4f0" opacity={0.05 * (1 - dia)} />
        <polygon points="120,760 470,760 900,1540 260,1540" fill="#ffd9a0" opacity={0.18 * dia} />
        {/* placa da barbearia */}
        <g transform={`rotate(${balanco} 870 520)`}>
          <line x1={870} y1={520} x2={790} y2={604} stroke="#8a6a52" strokeWidth={4} />
          <line x1={870} y1={520} x2={950} y2={604} stroke="#8a6a52" strokeWidth={4} />
          <g transform={`translate(870 652) scale(${Math.abs(Math.cos(giro * Math.PI))} 1) translate(-870 -652)`}>
            <rect x={762} y={602} width={216} height={100} rx={14} fill={face === "ABERTO" ? "#3d7a4c" : "#f3ece4"} />
            <text x={870} y={668} textAnchor="middle" fontFamily={F.sans} fontWeight={900} fontSize={38} letterSpacing="0.08em" fill={face === "ABERTO" ? "#fff" : C.acento}>
              {face}
            </text>
          </g>
        </g>
        <circle cx={870} cy={520} r={8} fill="#8a6a52" />
        <rect y={1760} width={1080} height={160} fill={mistura("#2a201a", "#d8c6b1", dia)} />
        <rect x={300} y={760} width={820} height={330} rx={44} fill="#4a3426" />
        <rect x={340} y={800} width={740} height={250} rx={30} fill="#563d2c" />
        <rect x={270} y={1090} width={830} height={680} rx={30} fill="#3b2a1f" />
        <rect x={470} y={905} width={420} height={210} rx={70} fill="#f3ece4" />
        <rect x={480} y={1060} width={400} height={50} rx={25} fill="#e3d8ca" />
        <g transform={`translate(675 ${1010 + respira * 0.3}) rotate(${-12 + ex.sacode}) scale(0.86) translate(-150 -190)`}>
          <Cabeca {...p.cabeca} olhos={acordado ? "abertos" : "fechados"} piscar={acordado ? piscada(f, 30) : 0} olhar={ex.olhar} boca={acordado && ex.boca === "neutra" ? "sorriso" : ex.boca} sobrancelha={acordado ? 6 : 0} />
        </g>
        <path d={`M280 ${1150 + respira} C400 ${1096 + respira} 520 ${1092 + respira} 610 ${1124 + respira} C720 ${1160 + respira} 860 ${1130 + respira} 1100 ${1128 + respira} L1100 1770 L280 1770 Z`} fill={C.acento} />
        <path d={`M280 ${1150 + respira} C400 ${1096 + respira} 520 ${1092 + respira} 610 ${1124 + respira} C720 ${1160 + respira} 860 ${1130 + respira} 1100 ${1128 + respira} L1100 ${1180 + respira} C860 ${1182 + respira} 720 ${1212 + respira} 610 ${1178 + respira} C520 ${1146 + respira} 400 ${1150 + respira} 280 ${1204 + respira} Z`} fill="#f3ece4" />
        <path d="M380 1330 C520 1300 700 1360 1080 1320" stroke={C.acentoForte} strokeWidth={6} fill="none" opacity={0.6} />
        <path d="M340 1520 C560 1480 760 1550 1080 1500" stroke={C.acentoForte} strokeWidth={6} fill="none" opacity={0.6} />
        {!acordado &&
          [0, 1, 2].map((i) => {
            const k = ((f + i * 22) % 66) / 66;
            return (
              <text key={i} x={800 + k * 90} y={880 - k * 170} fontFamily={F.serif} fontStyle="italic" fontWeight={700} fontSize={44 + k * 26} fill="#f3ece4" opacity={Math.sin(k * Math.PI) * 0.8 * (1 - dia)}>
                z
              </text>
            );
          })}
        <rect x={30} y={1300} width={310} height={460} rx={14} fill="#4a3426" />
        <rect x={20} y={1288} width={330} height={30} rx={10} fill="#5c4130" />
        <line x1={50} y1={1520} x2={320} y2={1520} stroke="#3a281d" strokeWidth={5} />
        <circle cx={185} cy={1440} r={10} fill="#c9a45c" />
        <rect x={52} y={1214} width={160} height={78} rx={14} fill="#120e0b" />
        <text x={132} y={1270} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={46} fill="#ff7a52" filter="url(#mBrilho)" opacity={0.7}>
          {hora}
        </text>
        <text x={132} y={1270} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={46} fill="#ff8b66">
          {hora}
        </text>
        <g transform={`translate(${treme} 0)`}>
          <path d="M228 1288 L312 1288 L304 1270 L236 1270 Z" fill="#2a211b" />
          <rect x={224} y={1076} width={92} height={210} rx={14} fill="#16120f" />
          <rect x={230} y={1084} width={80} height={194} rx={9} fill={chegou ? "#f3ece4" : "#1d1916"} />
          {chegou && (
            <>
              <rect x={236} y={1118} width={68} height={30} rx={7} fill="#fff" />
              <rect x={241} y={1126} width={34} height={5} rx={2} fill={C.texto} />
              <rect x={241} y={1136} width={56} height={4} rx={2} fill={C.texto2} />
              <circle cx={270} cy={1183} r={60} fill={C.acento} opacity={0.25 * Math.max(0, 1 - (f - acende) / 20)} filter="url(#mBrilho)" />
            </>
          )}
        </g>
      </svg>
      <Som em={vira + 2} tipo="pop" />
      <Som em={acende} tipo="notificacao" />
      <Som em={acende + 2} tipo="zumbir" />
      <Som em={amanhece} tipo="sino" />
    </Camera>
  );
}

// ---------- sala (cliente no sofá, com o celular) ----------

function Pensamento({ f, de, ate, rotulo, titulo, texto }: { f: number; de: number; ate: number; rotulo: string; titulo: string; texto?: string }) {
  const e = mola(f, de, { damping: 12 });
  const s = 1 - entre(f, ate - 8, ate);
  if (f < de || s <= 0) return null;
  const cartao = mola(f, de + 8, { damping: 12 });
  return (
    <g opacity={s} transform={`translate(800 420) scale(${e * s}) translate(-800 -420)`}>
      <circle cx={700} cy={640} r={14} fill="#f3ece4" />
      <circle cx={735} cy={590} r={22} fill="#f3ece4" />
      <path d="M600 300 C560 200 680 140 760 190 C810 120 940 150 940 240 C1020 260 1010 380 930 390 C930 470 800 490 760 440 C700 500 580 470 600 400 C520 390 520 300 600 300 Z" fill="#f3ece4" />
      <g transform={`translate(770 320) scale(${cartao}) rotate(${(1 - cartao) * -20}) translate(-770 -320)`}>
        <rect x={650} y={235} width={240} height={170} rx={20} fill="#fff" stroke={C.divisoria} strokeWidth={3} />
        <rect x={650} y={235} width={240} height={52} rx={20} fill={C.acento} />
        <rect x={650} y={265} width={240} height={22} fill={C.acento} />
        <text x={770} y={272} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={24} letterSpacing="0.08em" fill="#fff">
          {rotulo.toUpperCase()}
        </text>
        <text x={770} y={340} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={titulo.length > 7 ? 34 : 46} fill={C.texto}>
          {titulo}
        </text>
        {texto && (
          <text x={770} y={384} textAnchor="middle" fontFamily={F.serif} fontWeight={700} fontSize={texto.length > 12 ? 22 : 28} fill={C.acentoForte}>
            {texto}
          </text>
        )}
      </g>
    </g>
  );
}

function Mensagem({ f, de, apaga, para, texto }: { f: number; de: number; apaga: number; para: string; texto: string }) {
  if (f < de || f > apaga + 30) return null;
  const e = mola(f, de, { damping: 13 });
  const digitadas = Math.min(texto.length, Math.max(0, Math.floor((f - de - 6) / 1.6) + 1));
  const apagadas = f >= apaga ? Math.min(digitadas, (f - apaga) * 4) : 0;
  const visivel = texto.slice(0, Math.max(0, digitadas - apagadas));
  const vai = entre(f, apaga + 16, apaga + 30, [0, 1], Easing.in(Easing.cubic));
  const treme = f >= apaga && f < apaga + 14 ? Math.sin(f * 2.2) * 10 : 0;
  return (
    <div style={{ position: "absolute", left: 140, top: 290, width: 800, transformOrigin: "400px 500px", transform: `translate(${treme}px, ${vai * 700}px) scale(${e * (1 - vai * 0.8)})`, opacity: 1 - vai, fontFamily: F.sans }}>
      <div style={{ background: "#f3ece4", borderRadius: 34, padding: 26, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LogoBarbearia tam={74} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.texto }}>{para}</div>
            <div style={{ fontSize: 24, color: C.texto2 }}>visto por último hoje às 19:12</div>
          </div>
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minHeight: 74, borderRadius: 40, background: "#fff", display: "flex", alignItems: "center", padding: "0 28px", fontSize: 32, color: C.texto }}>
            {visivel}
            <span style={{ width: 3, height: 38, background: C.texto, marginLeft: 3, opacity: Math.floor(f / 8) % 2 ? 1 : 0.2 }} />
          </div>
          <div style={{ width: 74, height: 74, borderRadius: 99, background: C.whats, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="#fff">
              <path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z" />
            </svg>
          </div>
        </div>
      </div>
      {Array.from({ length: texto.length }, (_, i) => (
        <Som key={i} em={de + 6 + Math.floor(i * 1.6)} tipo="tecla" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Som key={`a${i}`} em={apaga + i * 2} tipo="apagar" />
      ))}
    </div>
  );
}

export function Sala({ c }: { c: CenaDe<"sala"> }) {
  const { f, dur, em } = useCena();
  const p = ELENCO[c.personagem];
  const bagunca = em(c.cabeloBagunca);
  const caos = p.cabeca.cabelo === "baguncado" ? entre(f, bagunca + 2, bagunca + 22, [0, 1], sai) : 0;
  const close = em(c.closeNoRosto, bagunca);
  const reacoes = (c.reacoes ?? []).map((r) => ({ em: em(r.em), r }));
  const pens = c.pensamento ? em(c.pensamento.em) : Infinity;
  const msg = c.mensagem ? em(c.mensagem.em) : Infinity;
  const padrao = { boca: "neutra" as Boca, olhar: [0, 8] as [number, number] };
  const ex = expressao(f, reacoes, padrao);
  let olhar = ex.olhar;
  let sob = 0;
  if (f >= pens && f < pens + 70 && !reacoes.some((r) => r.em <= f && r.em > pens)) {
    olhar = [14, -10];
    sob = 10;
  }
  if (Number.isFinite(bagunca) && f >= bagunca && f < bagunca + 40) {
    olhar = [0, -13];
    sob = 14;
  }
  const respira = Math.sin(f / 20) * 3;
  const chaves: Chave[] = [
    { f: 0, x: 540, y: 960, s: 1.0 },
    { f: dur, x: 540, y: 940, s: 1.08, e: Easing.linear },
  ];
  if (Number.isFinite(close)) {
    const base = cameraEm(close - 4, chaves);
    chaves.splice(0, chaves.length, { f: 0, x: 540, y: 960, s: 1.0 }, { f: close - 4, ...base }, { f: close + 10, x: 540, y: 790, s: 1.7 }, { f: close + 50, x: 540, y: 800, s: 1.78, e: Easing.linear }, { f: close + 64, x: 540, y: 900, s: 1.08 }, { f: Math.max(close + 65, dur), x: 540, y: 930, s: 1.12, e: Easing.linear });
  }
  return (
    <Camera f={f} chaves={chaves}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="mAbajur" cx="0.15" cy="0.36" r="0.5">
            <stop offset="0" stopColor="#e8b04a" stopOpacity={0.3} />
            <stop offset="1" stopColor="#e8b04a" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="mLuzTela">
            <stop offset="0" stopColor="#f3ece4" stopOpacity={0.2} />
            <stop offset="1" stopColor="#f3ece4" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="#231b16" />
        <rect width={1080} height={1920} fill="url(#mAbajur)" />
        <rect x={690} y={230} width={320} height={380} rx={10} fill="#16121c" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={700 + i * 78} y={430 - (i % 2) * 70} width={66} height={180 + (i % 2) * 70} fill="#2e221b" />
        ))}
        {[...Array(12)].map((_, i) => (
          <rect key={i} x={712 + (i % 4) * 78 + (i % 3) * 8} y={450 + Math.floor(i / 4) * 44 - ((i % 4) % 2) * 60} width={14} height={20} fill="#e8b04a" opacity={sorte(i + 70) > 0.4 ? 0.8 : 0.1} />
        ))}
        <rect x={690} y={230} width={320} height={380} rx={10} fill="none" stroke="#3a2a20" strokeWidth={18} />
        <rect x={146} y={720} width={10} height={800} fill="#3a2a20" />
        <path d="M86 720 L216 720 L190 610 L112 610 Z" fill="#e8b04a" />
        <ellipse cx={151} cy={1520} rx={70} ry={14} fill="#1a1410" />
        <rect x={40} y={1040} width={1000} height={520} rx={70} fill="#6b3a2b" />
        <rect x={0} y={1460} width={1080} height={460} rx={50} fill="#5a3024" />
        <rect x={0} y={1180} width={130} height={560} rx={50} fill="#5e3226" />
        <rect x={950} y={1180} width={130} height={560} rx={50} fill="#5e3226" />
        <g transform={`translate(0 ${respira})`}>
          <rect x={490} y={990} width={100} height={140} rx={34} fill={p.cabeca.sombra} />
          <path d="M300 1920 L300 1300 C300 1180 400 1112 480 1100 L600 1100 C680 1112 780 1180 780 1300 L780 1920 Z" fill={p.roupa} />
          <path d="M480 1100 Q540 1150 600 1100" stroke={p.sombraRoupa} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M352 1210 C300 1360 296 1500 360 1570" stroke={p.sombraRoupa} strokeWidth={84} strokeLinecap="round" fill="none" />
          <path d="M728 1210 C780 1360 784 1500 720 1570" stroke={p.sombraRoupa} strokeWidth={84} strokeLinecap="round" fill="none" />
          <g transform={`translate(540 872) rotate(${ex.sacode}) scale(1.25) translate(-150 -190)`}>
            <Cabeca {...p.cabeca} olhar={olhar} piscar={piscada(f, 12)} boca={ex.boca} sobrancelha={sob} caos={caos} t={f} />
          </g>
          <ellipse cx={540} cy={970} rx={190} ry={160} fill="url(#mLuzTela)" />
          {c.pensamento && <Pensamento f={f} de={pens} ate={Math.min(dur, pens + 110)} rotulo={c.pensamento.rotulo} titulo={c.pensamento.titulo} texto={c.pensamento.texto} />}
        </g>
      </svg>
      {/* celular (costas) e mãos */}
      <div style={{ position: "absolute", left: 459, top: 1183 + respira, width: 162, height: 334, borderRadius: 24, background: "#2b221c", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", right: 14, top: 14, width: 52, height: 52, borderRadius: 16, background: "#1a1410" }} />
      </div>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(0 ${respira})`}>
          <path d="M362 1572 C400 1560 440 1500 456 1440" stroke={p.cabeca.pele} strokeWidth={62} strokeLinecap="round" fill="none" />
          <path d="M718 1572 C680 1560 640 1500 624 1440" stroke={p.cabeca.pele} strokeWidth={62} strokeLinecap="round" fill="none" />
          <ellipse cx={452} cy={1418} rx={34} ry={46} fill={p.cabeca.pele} />
          <ellipse cx={628} cy={1418} rx={34} ry={46} fill={p.cabeca.pele} />
        </g>
      </svg>
      {c.mensagem && <Mensagem f={f} de={msg} apaga={em(c.mensagem.apaga, dur - 30)} para={c.mensagem.para} texto={c.mensagem.texto} />}
      <Som em={pens - 2} tipo="pop" />
      <Som em={pens + 8} tipo="pop" />
      <Som em={close + 4} tipo="whoosh" />
      <Som em={bagunca + 8} tipo="boing" />
      <Som em={msg} tipo="pop" />
      {reacoes.filter((r) => r.r.sacode).map((r, i) => (
        <Som key={i} em={r.em} tipo="boing" vol={0.6} />
      ))}
    </Camera>
  );
}

// ---------- barbearia (barbeiro cortando, celular no balcão) ----------

/** Braço do barbeiro com a tesoura (as duas lâminas abrem e fecham quando `corta`). Serve à barbearia moderna e à antiga. */
function BracoTesoura({ pele, manga, corta, desloca }: { pele: string; manga: string; corta: boolean; desloca?: string }) {
  return (
    <g transform={desloca}>
      <path d="M700 990 C640 1040 600 1010 590 930" stroke={manga} strokeWidth={60} strokeLinecap="round" fill="none" />
      <circle cx={588} cy={918} r={30} fill={pele} />
      <g transform={`translate(560 880) rotate(${corta ? -14 : 8})`} stroke="#8a8580" strokeWidth={8} strokeLinecap="round" fill="none">
        <path d="M0 0 L-70 -40" />
        <circle cx={12} cy={10} r={12} />
      </g>
      <g transform={`translate(560 880) rotate(${corta ? 14 : -8})`} stroke="#a8a39d" strokeWidth={8} strokeLinecap="round" fill="none">
        <path d="M0 0 L-70 -20" />
        <circle cx={16} cy={-6} r={12} />
      </g>
    </g>
  );
}

export function Barbearia({ c }: { c: CenaDe<"barbearia"> }) {
  const { f, dur, em } = useCena();
  const b = ELENCO[c.barbeiro];
  const cl = c.cliente ? ELENCO[c.cliente] : null;
  const olha = em(c.olhaCelular);
  const msgs = (c.mensagens ?? []).map((m) => ({ ...m, q: em(m.em) }));
  const ultimaMsg = msgs.filter((m) => m.q <= f).length;
  const vibrando = msgs.some((m) => f >= m.q && f < m.q + 14);
  const treme = vibrando ? Math.sin(f * 2.6) * 4 : 0;
  const reacoes = (c.reacoes ?? []).map((r) => ({ em: em(r.em), r }));
  const exB = expressao(f, reacoes, { boca: "neutra", olhar: [-10, 4] });
  const olhandoCel = f >= olha;
  const corta = !!cl && !olhandoCel && f % 16 < 8;
  const chaves: Chave[] = [
    { f: 0, x: 540, y: 980, s: 1.06 },
    { f: dur, x: 560, y: 960, s: 1.14, e: Easing.linear },
  ];
  const listra = (f * 3) % 120;
  return (
    <Camera f={f} chaves={chaves}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="mEspelho" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dfe4e3" />
            <stop offset="1" stopColor="#b7c0c0" />
          </linearGradient>
          <pattern id="mPoste" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${listra}) rotate(35)`}>
            <rect width="120" height="120" fill="#f3ece4" />
            <rect width="40" height="120" fill={C.acento} />
            <rect x="60" width="20" height="120" fill={C.escuro} />
          </pattern>
          <pattern id="mPiso" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="#e9dccb" />
            <rect width="60" height="60" fill="#2a211b" />
            <rect x="60" y="60" width="60" height="60" fill="#2a211b" />
          </pattern>
        </defs>
        <rect width={1080} height={1920} fill="#ece0cf" />
        <rect y={1150} width={1080} height={610} fill="#6b3a2b" />
        <rect y={1150} width={1080} height={16} fill="#5a3024" />
        <rect y={1760} width={1080} height={160} fill="url(#mPiso)" />
        {/* espelho */}
        <rect x={130} y={250} width={780} height={720} rx={30} fill="#4a3426" />
        <rect x={152} y={272} width={736} height={676} rx={18} fill="url(#mEspelho)" />
        <path d="M200 900 L420 300 L480 300 L260 900 Z" fill="#fff" opacity={0.25} />
        <path d="M300 900 L520 300 L545 300 L325 900 Z" fill="#fff" opacity={0.18} />
        {/* poste de barbeiro */}
        <rect x={968} y={300} width={70} height={600} rx={35} fill="url(#mPoste)" />
        <rect x={958} y={280} width={90} height={34} rx={12} fill="#c9a45c" />
        <rect x={958} y={886} width={90} height={34} rx={12} fill="#c9a45c" />
        {/* prateleira com produtos e o celular */}
        <rect x={110} y={980} width={820} height={28} rx={8} fill="#5c4130" />
        {[170, 230, 300, 360].map((x, i) => (
          <rect key={x} x={x} y={900 - (i % 2) * 20} width={44} height={80 + (i % 2) * 20} rx={10} fill={[C.acento, "#3d7a4c", "#e8b04a", "#2a211b"][i]} />
        ))}
        <g transform={`translate(${treme} 0) rotate(-8 800 930)`}>
          <rect x={760} y={850} width={80} height={130} rx={12} fill="#16120f" />
          <rect x={766} y={856} width={68} height={118} rx={8} fill={ultimaMsg ? "#f3ece4" : "#1d1916"} />
          {ultimaMsg > 0 && <rect x={772} y={870} width={56} height={22} rx={5} fill={C.whats} opacity={0.85} />}
        </g>
        {/* cadeira e cliente */}
        <rect x={330} y={1000} width={340} height={420} rx={50} fill="#2a211b" />
        <rect x={290} y={1380} width={420} height={140} rx={40} fill="#1f1915" />
        <rect x={470} y={1520} width={60} height={200} fill="#8a8580" />
        <ellipse cx={500} cy={1740} rx={170} ry={26} fill="#5f5a55" />
        {cl && (
          <>
            <g transform="translate(500 1010) scale(0.95) translate(-150 -190)">
              <Cabeca {...cl.cabeca} olhar={[6, -2]} piscar={piscada(f, 40)} boca="neutra" caos={0} t={f} />
            </g>
            <path d="M290 1620 L330 1250 C360 1180 430 1145 500 1145 C570 1145 640 1180 670 1250 L710 1620 Z" fill={C.acento} />
            <path d="M330 1250 C360 1180 430 1145 500 1145 C570 1145 640 1180 670 1250" stroke="#f3ece4" strokeWidth={14} fill="none" />
          </>
        )}
        {/* barbeiro */}
        <rect x={760} y={880} width={80} height={90} rx={30} fill={b.cabeca.sombra} />
        <path d="M670 1920 L670 1070 C670 975 725 925 800 920 C875 925 930 975 930 1070 L930 1920 Z" fill={b.roupa} />
        <path d="M710 1080 Q800 1120 890 1080 L905 1760 L695 1760 Z" fill={C.acento} opacity={0.92} />
        <path d="M740 1080 L740 1000 M860 1080 L860 1000" stroke={C.acento} strokeWidth={10} strokeLinecap="round" />
        <g transform={`translate(800 770) rotate(${exB.sacode}) scale(0.95) translate(-150 -190)`}>
          <Cabeca {...b.cabeca} olhar={olhandoCel ? [6, 12] : exB.olhar} piscar={piscada(f, 7)} boca={exB.boca} sobrancelha={olhandoCel ? 8 : 0} />
        </g>
        <BracoTesoura pele={b.cabeca.pele} manga={b.sombraRoupa} corta={corta} desloca={olhandoCel ? "translate(40 120)" : undefined} />
      </svg>
      {/* mensagens chegando no celular */}
      <div style={{ position: "absolute", left: 120, right: 260, top: 300, display: "flex", flexDirection: "column", gap: 18 }}>
        {msgs.map((m, i) => {
          if (f < m.q) return null;
          const e = mola(f, m.q, { damping: 12 });
          return (
            <div key={i} style={{ alignSelf: i % 2 ? "flex-end" : "flex-start", maxWidth: 560, transform: `scale(${e}) rotate(${i % 2 ? 2 : -2}deg)`, transformOrigin: i % 2 ? "100% 0" : "0 0", background: "#fff", borderRadius: "8px 28px 28px 28px", padding: "18px 26px", boxShadow: "0 20px 40px -18px rgba(0,0,0,0.45)", fontFamily: F.sans }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#1f8a4c" }}>{m.de}</div>
              <div style={{ fontSize: 36, fontWeight: 600, color: C.texto, lineHeight: 1.2 }}>{m.texto}</div>
            </div>
          );
        })}
      </div>
      {msgs.map((m, i) => (
        <React.Fragment key={i}>
          <Som em={m.q} tipo="pop" />
          <Som em={m.q + 1} tipo="zumbir" vol={0.6} />
        </React.Fragment>
      ))}
      {Array.from({ length: cl ? Math.min(8, Math.floor(Math.min(dur, olha) / 16)) : 0 }, (_, i) => (
        <Som key={`t${i}`} em={i * 16 + 2} tipo="tesoura" vol={0.6} />
      ))}
    </Camera>
  );
}

// ---------- barbearia antiga (sépia, cadeira de ferro, poste de parede, placa com o ano) ----------

const SEPIA = { parede: "#d8bf94", listra: "#cfb386", madeira: "#5a3d28", madeiraEscura: "#3f2a1b", ferro: "#2b2420", couro: "#4d3022", creme: "#efe5cf", camisa: "#d6c7a6", ouro: "#b98f45", tinta: "#2a1c15" };

export function BarbeariaAntiga({ c }: { c: CenaDe<"barbeariaAntiga"> }) {
  const { f, dur, em } = useCena();
  const b = ELENCO[c.barbeiro];
  const cl = c.cliente ? ELENCO[c.cliente] : null;
  const ano = c.ano ?? "1920";
  const reacoes = (c.reacoes ?? []).map((r) => ({ em: em(r.em), r }));
  const exB = expressao(f, reacoes, { boca: "neutra", olhar: [-10, 4] });
  const corta = !!cl && f % 16 < 8;
  const chaves: Chave[] = [
    { f: 0, x: 540, y: 980, s: 1.06 },
    { f: dur, x: 560, y: 960, s: 1.14, e: Easing.linear },
  ];
  const listra = (f * 2.4) % 120;
  const S = SEPIA;
  return (
    <Camera f={f} chaves={chaves}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, filter: "sepia(0.55) saturate(0.95) contrast(1.04)" }}>
        <defs>
          <linearGradient id="aEspelho" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6dcc4" />
            <stop offset="1" stopColor="#b9ad92" />
          </linearGradient>
          <pattern id="aPoste" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${listra}) rotate(35)`}>
            <rect width="120" height="120" fill={S.creme} />
            <rect width="40" height="120" fill={C.acento} />
            <rect x="60" width="20" height="120" fill={S.ferro} />
          </pattern>
          <pattern id="aPiso" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="#e3d3b4" />
            <rect width="60" height="60" fill="#33271d" />
            <rect x="60" y="60" width="60" height="60" fill="#33271d" />
          </pattern>
          <pattern id="aPapel" width="90" height="120" patternUnits="userSpaceOnUse">
            <rect width="90" height="120" fill={S.parede} />
            <rect width="45" height="120" fill={S.listra} />
            <circle cx={45} cy={60} r={5} fill={S.listra} />
          </pattern>
          <radialGradient id="aVinheta" cx="0.5" cy="0.5" r="0.72">
            <stop offset="0.55" stopColor="#2a1c10" stopOpacity={0} />
            <stop offset="1" stopColor="#2a1c10" stopOpacity={0.5} />
          </radialGradient>
        </defs>
        {/* parede de papel, lambri de madeira e piso */}
        <rect width={1080} height={1920} fill="url(#aPapel)" />
        <rect y={1150} width={1080} height={610} fill={S.madeira} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={30 + i * 270} y={1210} width={210} height={500} rx={10} fill="none" stroke={S.madeiraEscura} strokeWidth={8} />
        ))}
        <rect y={1150} width={1080} height={26} fill={S.madeiraEscura} />
        <rect y={1760} width={1080} height={160} fill="url(#aPiso)" />
        {/* placa com o ano */}
        <line x1={380} y1={0} x2={380} y2={100} stroke={S.ferro} strokeWidth={6} />
        <line x1={700} y1={0} x2={700} y2={100} stroke={S.ferro} strokeWidth={6} />
        <rect x={250} y={96} width={580} height={150} rx={22} fill={S.madeiraEscura} />
        <rect x={266} y={112} width={548} height={118} rx={14} fill="none" stroke={S.ouro} strokeWidth={5} />
        <text x={540} y={152} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={28} letterSpacing="0.34em" fill={S.ouro}>
          BARBEARIA
        </text>
        <text x={540} y={208} textAnchor="middle" fontFamily={F.serif} fontWeight={700} fontSize={56} fill={S.creme}>
          Desde {ano}
        </text>
        {/* espelho com moldura de madeira */}
        <rect x={120} y={290} width={800} height={690} rx={36} fill={S.madeiraEscura} />
        <rect x={142} y={312} width={756} height={646} rx={22} fill={S.ouro} />
        <rect x={154} y={324} width={732} height={622} rx={16} fill="url(#aEspelho)" />
        <path d="M200 940 L420 330 L480 330 L260 940 Z" fill="#fff" opacity={0.25} />
        <path d="M300 940 L520 330 L545 330 L325 940 Z" fill="#fff" opacity={0.18} />
        {/* afiador de navalha pendurado */}
        <path d="M62 330 L62 700 L106 700 L106 330 Z" fill={S.couro} />
        <rect x={72} y={350} width={24} height={330} rx={4} fill="none" stroke={S.ouro} strokeWidth={3} />
        <rect x={62} y={700} width={44} height={32} rx={8} fill={S.ouro} />
        <circle cx={84} cy={326} r={10} fill={S.ferro} />
        {/* poste de parede, preso por suportes de ferro */}
        <rect x={930} y={460} width={44} height={14} rx={6} fill={S.ferro} />
        <rect x={930} y={750} width={44} height={14} rx={6} fill={S.ferro} />
        <rect x={960} y={440} width={22} height={344} rx={6} fill={S.ferro} />
        <rect x={966} y={480} width={68} height={270} rx={34} fill="url(#aPoste)" />
        <rect x={956} y={462} width={88} height={30} rx={12} fill={S.ouro} />
        <rect x={956} y={738} width={88} height={30} rx={12} fill={S.ouro} />
        <circle cx={1000} cy={452} r={20} fill={S.ouro} />
        <circle cx={1000} cy={778} r={20} fill={S.ouro} />
        <rect x={978} y={496} width={10} height={240} rx={5} fill="#fff" opacity={0.3} />
        {/* prateleira com tônicos, pincel e navalha */}
        <rect x={110} y={980} width={820} height={28} rx={8} fill={S.madeira} />
        {[170, 230, 300, 360, 430].map((x, i) => (
          <rect key={x} x={x} y={900 - (i % 2) * 20} width={44} height={80 + (i % 2) * 20} rx={12} fill={[S.ouro, "#6f7a58", C.acento, S.ferro, "#7c5a3a"][i]} />
        ))}
        <rect x={500} y={940} width={64} height={40} rx={10} fill={S.creme} />
        <path d="M512 940 L512 900 M532 940 L532 890 M552 940 L552 900" stroke={S.tinta} strokeWidth={8} strokeLinecap="round" />
        {/* cadeira de ferro */}
        <ellipse cx={500} cy={1750} rx={190} ry={30} fill={S.ferro} />
        <path d="M410 1738 C440 1700 470 1690 475 1650 L525 1650 C530 1690 560 1700 590 1738 Z" fill={S.ferro} />
        <rect x={472} y={1510} width={56} height={150} fill={S.ferro} />
        <rect x={456} y={1560} width={88} height={14} rx={7} fill={S.ouro} />
        <rect x={456} y={1620} width={88} height={14} rx={7} fill={S.ouro} />
        <rect x={290} y={1380} width={420} height={140} rx={40} fill={S.ferro} />
        <rect x={304} y={1386} width={392} height={104} rx={34} fill={S.couro} />
        <rect x={300} y={1010} width={400} height={400} rx={60} fill={S.ferro} />
        <rect x={322} y={1034} width={356} height={356} rx={44} fill={S.couro} />
        {[0, 1, 2].map((i) =>
          [0, 1].map((j) => <circle key={`${i}${j}`} cx={430 + j * 140} cy={1130 + i * 90} r={9} fill={S.ouro} />),
        )}
        <rect x={420} y={960} width={160} height={78} rx={26} fill={S.ferro} />
        <rect x={436} y={970} width={128} height={52} rx={20} fill={S.couro} />
        <rect x={488} y={930} width={24} height={40} fill={S.ouro} />
        <path d="M296 1280 C250 1290 250 1380 296 1400" stroke={S.ferro} strokeWidth={22} fill="none" strokeLinecap="round" />
        <path d="M704 1280 C750 1290 750 1380 704 1400" stroke={S.ferro} strokeWidth={22} fill="none" strokeLinecap="round" />
        <rect x={250} y={1262} width={70} height={22} rx={11} fill="#7a5532" />
        <rect x={680} y={1262} width={70} height={22} rx={11} fill="#7a5532" />
        {cl && (
          <>
            <g transform="translate(500 1010) scale(0.95) translate(-150 -190)">
              <Cabeca {...cl.cabeca} olhar={[6, -2]} piscar={piscada(f, 40)} boca="neutra" caos={0} t={f} />
            </g>
            <path d="M290 1620 L330 1250 C360 1180 430 1145 500 1145 C570 1145 640 1180 670 1250 L710 1620 Z" fill={S.creme} />
            <path d="M300 1500 L690 1500 M308 1560 L694 1560" stroke="#c5b08a" strokeWidth={10} />
            <path d="M330 1250 C360 1180 430 1145 500 1145 C570 1145 640 1180 670 1250" stroke="#8a6a4a" strokeWidth={14} fill="none" />
          </>
        )}
        {/* barbeiro de colete e bigode */}
        <rect x={760} y={880} width={80} height={90} rx={30} fill={b.cabeca.sombra} />
        <path d="M682 1920 L682 1075 C682 980 730 928 800 922 C870 928 918 980 918 1075 L918 1920 Z" fill={S.camisa} />
        <path d="M692 1920 L692 1090 C692 1030 735 980 772 962 L800 1100 L828 962 C865 980 908 1030 908 1090 L908 1920 Z" fill={S.madeiraEscura} />
        <path d="M772 962 L800 1100 L828 962" stroke={S.tinta} strokeWidth={5} fill="none" />
        {[1190, 1290, 1390].map((y) => (
          <circle key={y} cx={800} cy={y} r={9} fill={S.ouro} />
        ))}
        <path d="M850 1210 C880 1240 870 1280 840 1285" stroke={S.ouro} strokeWidth={5} fill="none" />
        <circle cx={838} cy={1290} r={14} fill="none" stroke={S.ouro} strokeWidth={6} />
        <path d="M772 950 L800 990 L828 950 L840 985 L800 1010 L760 985 Z" fill={S.creme} />
        <path d="M778 985 L822 985 L810 1010 L790 1010 Z" fill={C.acento} />
        <g transform={`translate(800 770) rotate(${exB.sacode}) scale(0.95) translate(-150 -190)`}>
          <Cabeca {...b.cabeca} barba={undefined} bigode={S.tinta} olhar={exB.olhar} piscar={piscada(f, 7)} boca={exB.boca} />
        </g>
        <BracoTesoura pele={b.cabeca.pele} manga={S.camisa} corta={corta} />
        <rect width={1080} height={1920} fill="url(#aVinheta)" />
      </svg>
      {Array.from({ length: cl ? Math.min(8, Math.floor(dur / 16)) : 0 }, (_, i) => (
        <Som key={`t${i}`} em={i * 16 + 2} tipo="tesoura" vol={0.6} />
      ))}
    </Camera>
  );
}

// ---------- cidade (o fio atravessando, levando o agendamento) ----------

const PREDIOS = [
  [0, 190, 640],
  [170, 150, 860],
  [300, 210, 560],
  [490, 170, 940],
  [640, 230, 720],
  [850, 140, 600],
  [970, 150, 790],
];

export function Cidade({ c }: { c: CenaDe<"cidade"> }) {
  const { f, dur } = useCena();
  const ida = (c.sentido ?? "ida") === "ida";
  const t = entre(f, 4, dur - 6, [0, 1], Easing.inOut(Easing.cubic));
  const ponto = (u: number) => {
    const x0 = ida ? -80 : 1160;
    const x1 = ida ? 1160 : -80;
    const x = x0 + (x1 - x0) * u;
    const y = 900 - Math.sin(u * Math.PI) * 360;
    return { x, y };
  };
  const n = Math.max(2, Math.ceil(t * 80));
  const d = Array.from({ length: n }, (_, i) => ponto((i / (n - 1)) * t))
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const ponta = ponto(t);
  return (
    <Camera f={f} chaves={[{ f: 0, x: 540, y: 960, s: 1.12 }, { f: dur, x: 540, y: 960, s: 1.0, e: Easing.linear }]}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="mCeuCidade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#120f17" />
            <stop offset="1" stopColor="#2c1e19" />
          </linearGradient>
          <radialGradient id="mLua">
            <stop offset="0" stopColor="#f3ece4" stopOpacity={0.35} />
            <stop offset="1" stopColor="#f3ece4" stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#mCeuCidade)" />
        {[...Array(40)].map((_, i) => (
          <circle key={i} cx={sorte(i + 100) * 1080} cy={sorte(i + 200) * 1000} r={1.5 + sorte(i + 300) * 2.5} fill="#fff" opacity={0.3 + 0.4 * Math.sin(f / 11 + i)} />
        ))}
        <circle cx={760} cy={420} r={220} fill="url(#mLua)" />
        <circle cx={760} cy={420} r={78} fill="#f3ece4" />
        {PREDIOS.map(([x, w, h], i) => (
          <g key={i}>
            <rect x={x} y={1920 - h} width={w} height={h} fill={i % 2 ? "#2e221b" : "#3a2b21"} />
            {[...Array(Math.floor((h - 60) / 70))].map((_, r) =>
              [...Array(Math.floor((w - 30) / 46))].map((__, k) => {
                const acesa = sorte(i * 100 + r * 10 + k) > 0.55;
                return <rect key={`${r}-${k}`} x={x + 22 + k * 46} y={1920 - h + 40 + r * 70} width={22} height={32} rx={3} fill={acesa ? "#e8b04a" : "#251b16"} opacity={acesa ? 0.75 : 1} />;
              }),
            )}
          </g>
        ))}
        <path d={d} stroke="#e8b04a" strokeWidth={30} strokeLinecap="round" fill="none" opacity={0.25} />
        <path d={d} stroke={C.acento} strokeWidth={14} strokeLinecap="round" fill="none" />
        <circle cx={ponta.x} cy={ponta.y} r={90} fill="#e8b04a" opacity={0.25} />
        <circle cx={ponta.x} cy={ponta.y} r={42} fill={C.acento} stroke="#f3ece4" strokeWidth={8} />
        <path d={`M${ponta.x - 16} ${ponta.y} l11 11 l22 -22`} stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <Som em={2} tipo="whooshLongo" />
    </Camera>
  );
}
