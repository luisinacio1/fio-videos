import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { C, F, Laco } from "./base";
import temposJson from "./v14/tempos.json";
import { criarLinha, type Tempos } from "./v14/linha";
import { borrao, cameraEm, naTela, transformMundo, type Chave } from "./motion/camera";
import { Cabeca, MATHEUS, RAFA, piscada, type Boca } from "./motion/Personagens";
import {
  ALTURA_TELA,
  ALVOS,
  BarraEndereco,
  BarraStatus,
  LARGURA_TELA,
  LogoBarbearia,
  Notificacao,
  PaginaAgenda,
  PaginaConfirmado,
  PaginaDados,
  PaginaHorario,
  PaginaRevisao,
  PaginaServico,
  Y_AGENDA,
} from "./motion/TelasFio";
import { LegendaDinamica, montarBlocos } from "./motion/LegendaDinamica";

/**
 * 14 · Piloto do estilo novo: um mundo só (quarto do Rafa, cidade, sala do Matheus) e uma câmera que viaja por ele.
 * O app aparece como ele é (telas copiadas do Fio), os elementos viram uns nos outros (o "confirmado" vira o fio que
 * atravessa a cidade, o aviso vira a agenda) e tudo anda no tempo das palavras da narração (v14/tempos.json).
 */

const tempos = temposJson as Tempos;
const L = criarLinha(tempos);
const { S, P } = L;
export const DURACAO_14 = L.DURACAO;

const BLOCOS = montarBlocos(tempos.palavras);
const CHAVES_LEGENDA = ["noite", "dormindo", "entrevista", "caos", "pensar", "link", "corte", "dia", "horário", "aplicativo", "conta", "Confirmado", "aviso", "agenda", "nenhuma"];

// ---------- ferramentas ----------
const lim = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.25, 1);
const sai = Easing.bezier(0.2, 0.8, 0.2, 1);
const entre = (f: number, de: number, ate: number, saida: [number, number] = [0, 1], e = ease) => interpolate(f, [de, ate], saida, { ...lim, easing: e });
const mola = (f: number, inicio: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: f - inicio, fps: 30, config: { damping: 14, stiffness: 160, mass: 0.8, ...cfg } });
function mistura(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}
/** número pseudoaleatório fixo (as janelas acesas são sempre as mesmas) */
const sorte = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- o mundo ----------
const QUARTO = 0;
const CIDADE = 1080;
const SALA = 2160;

// celular do Matheus: a tela mede 390 × 844 "pixels do app", encolhida para caber na mão
const K = 0.38;
const TW = LARGURA_TELA * K;
const TH = ALTURA_TELA * K;
const BEZEL = 7;
const CEL = { x: SALA + 540, y: 1350 };
/** zoom em que a tela do celular ocupa a largura do vídeo */
const S_TELA = 1080 / TW;
const CAM_TELA = { x: CEL.x, y: CEL.y - TH / 2 + 960 / S_TELA };
/** escala das telas que ocupam o vídeo inteiro (390 → 1080) */
const KT = 1080 / LARGURA_TELA;
// celular do Rafa, no carregador do criado-mudo
const CEL_RAFA = { x: 270, y: 1183 };

const CAMERA: Chave[] = [
  { f: 0, x: 132, y: 1257, s: 3.6 },
  { f: S.abreQuarto - 2, x: 132, y: 1257, s: 3.2, e: Easing.linear },
  { f: S.abreQuarto + 26, x: 540, y: 980, s: 1.0 },
  { f: S.viagem, x: 545, y: 975, s: 1.05, e: Easing.linear },
  { f: S.viagem + 18, x: CIDADE + 540, y: 930, s: 0.72 },
  { f: S.viagem + 40, x: SALA + 540, y: 960, s: 1.0 },
  { f: S.cabelo - 4, x: SALA + 540, y: 950, s: 1.06, e: Easing.linear },
  { f: S.cabelo + 10, x: SALA + 540, y: 790, s: 1.7 },
  { f: S.mandar - 8, x: SALA + 540, y: 790, s: 1.78, e: Easing.linear },
  { f: S.mandar + 6, x: SALA + 540, y: 900, s: 1.08 },
  { f: P.mergulho, x: SALA + 540, y: 930, s: 1.12, e: Easing.linear },
  { f: P.mergulho + 30, x: CAM_TELA.x, y: CAM_TELA.y, s: S_TELA },
  { f: P.volta, x: CAM_TELA.x, y: CAM_TELA.y, s: S_TELA },
  { f: P.volta + 24, x: 1620, y: 1150, s: 0.36 },
  { f: P.pontoChega - 20, x: 1480, y: 1150, s: 0.38, e: Easing.linear },
  { f: P.pontoChega + 4, x: 430, y: 1080, s: 1.35 },
  { f: S.manha + 30, x: 540, y: 990, s: 1.0 },
];

/** o fio que leva o agendamento da sala até o celular do Rafa (duas curvas de Bézier) */
const TRAJETO = [
  [
    [CEL.x, CEL.y - 120],
    [2500, 480],
    [1900, 430],
    [1620, 640],
  ],
  [
    [1620, 640],
    [1340, 850],
    [620, 640],
    [CEL_RAFA.x, CEL_RAFA.y - 90],
  ],
];
function pontoNoFio(t: number) {
  const [seg, u] = t < 0.5 ? [TRAJETO[0], t * 2] : [TRAJETO[1], (t - 0.5) * 2];
  const m = 1 - u;
  const c = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u];
  return { x: seg.reduce((s, p, i) => s + p[0] * c[i], 0), y: seg.reduce((s, p, i) => s + p[1] * c[i], 0) };
}

// ---------- cenários ----------

function Quarto({ f, dia }: { f: number; dia: number }) {
  const parede = mistura("#1d1713", "#efe2d0", dia);
  const chao = mistura("#2a201a", "#d8c6b1", dia);
  // placa: vira de ABERTO para FECHADO quando ele fecha, e volta de manhã
  const virar1 = entre(f, S.fechou, S.fechou + 10);
  const virar2 = entre(f, S.manha + 14, S.manha + 24);
  const giro = virar2 > 0 ? virar2 : virar1;
  const face = virar2 > 0.5 ? "ABERTO" : virar1 > 0.5 ? "FECHADO" : "ABERTO";
  const balanco = f > S.fechou ? 9 * Math.sin((f - S.fechou) * 0.28) * Math.exp(-(f - S.fechou) / 22) : 0;
  const acordado = f >= S.manha + 10;
  const sorriso = f >= P.pontoChega + 8;
  const chegou = f >= P.pontoChega;
  const treme = chegou && f < P.pontoChega + 16 ? Math.sin(f * 2.4) * 3 : 0;
  const hora = dia > 0.5 ? "07:00" : f < S.relogio ? "22:59" : "23:00";
  const pulo = f >= S.relogio && f < S.relogio + 6 ? (1 - (f - S.relogio) / 6) * 12 : 0;
  const respira = Math.sin(f / 18) * 4;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="ceuQuarto" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mistura("#141b30", "#8fc6e3", dia)} />
          <stop offset="1" stopColor={mistura("#2b2240", "#f7dfba", dia)} />
        </linearGradient>
        <filter id="brilho" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width={1080} height={1920} fill={parede} />
      {/* janela */}
      <rect x={110} y={250} width={360} height={510} rx={10} fill="url(#ceuQuarto)" />
      {[...Array(14)].map((_, i) => (
        <circle key={i} cx={130 + sorte(i) * 320} cy={270 + sorte(i + 40) * 300} r={2 + sorte(i + 9) * 2.5} fill="#fff" opacity={(1 - dia) * (0.5 + 0.5 * Math.sin(f / 9 + i))} />
      ))}
      <g opacity={1 - dia}>
        <circle cx={360} cy={380} r={46} fill="#f3ece4" />
        <circle cx={378} cy={368} r={46} fill={mistura("#141b30", "#8fc6e3", dia)} opacity={0.0} />
        <circle cx={346} cy={372} r={8} fill="#ddd3c6" />
        <circle cx={372} cy={398} r={6} fill="#ddd3c6" />
      </g>
      <circle cx={240} cy={760 - dia * 330} r={58} fill="#f2b25c" opacity={dia} />
      <rect x={110} y={250} width={360} height={510} rx={10} fill="none" stroke="#4a3426" strokeWidth={22} />
      <line x1={290} y1={250} x2={290} y2={760} stroke="#4a3426" strokeWidth={14} />
      <line x1={110} y1={505} x2={470} y2={505} stroke="#4a3426" strokeWidth={14} />
      {/* luz da lua */}
      <polygon points="120,760 470,760 900,1540 260,1540" fill="#c8d4f0" opacity={0.05 * (1 - dia)} />
      <polygon points="120,760 470,760 900,1540 260,1540" fill="#ffd9a0" opacity={0.18 * dia} />
      {/* placa da barbearia, pendurada */}
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
      {/* chão */}
      <rect y={1760} width={1080} height={160} fill={chao} />
      {/* cama */}
      <rect x={300} y={760} width={820} height={330} rx={44} fill="#4a3426" />
      <rect x={340} y={800} width={740} height={250} rx={30} fill="#563d2c" />
      <rect x={270} y={1090} width={830} height={680} rx={30} fill="#3b2a1f" />
      <rect x={470} y={905} width={420} height={210} rx={70} fill="#f3ece4" />
      <rect x={480} y={1060} width={400} height={50} rx={25} fill="#e3d8ca" />
      {/* Rafa */}
      <g transform={`translate(675 ${1010 + respira * 0.3}) rotate(-12) scale(0.86) translate(-150 -190)`}>
        <Cabeca {...RAFA} olhos={acordado ? "abertos" : "fechados"} piscar={acordado ? piscada(f, 30) : 0} olhar={[-4, -2]} boca={acordado || sorriso ? "sorriso" : "neutra"} sobrancelha={acordado ? 6 : 0} />
      </g>
      {/* coberta */}
      <path d={`M280 ${1150 + respira} C400 ${1096 + respira} 520 ${1092 + respira} 610 ${1124 + respira} C720 ${1160 + respira} 860 ${1130 + respira} 1100 ${1128 + respira} L1100 1770 L280 1770 Z`} fill={C.acento} />
      <path d={`M280 ${1150 + respira} C400 ${1096 + respira} 520 ${1092 + respira} 610 ${1124 + respira} C720 ${1160 + respira} 860 ${1130 + respira} 1100 ${1128 + respira} L1100 ${1180 + respira} C860 ${1182 + respira} 720 ${1212 + respira} 610 ${1178 + respira} C520 ${1146 + respira} 400 ${1150 + respira} 280 ${1204 + respira} Z`} fill="#f3ece4" />
      <path d="M380 1330 C520 1300 700 1360 1080 1320" stroke={C.acentoForte} strokeWidth={6} fill="none" opacity={0.6} />
      <path d="M340 1520 C560 1480 760 1550 1080 1500" stroke={C.acentoForte} strokeWidth={6} fill="none" opacity={0.6} />
      {/* Zzz */}
      {!acordado &&
        [0, 1, 2].map((i) => {
          const c = ((f + i * 22) % 66) / 66;
          return (
            <text key={i} x={800 + c * 90} y={880 - c * 170} fontFamily={F.serif} fontStyle="italic" fontWeight={700} fontSize={44 + c * 26} fill="#f3ece4" opacity={Math.sin(c * Math.PI) * 0.8 * (1 - dia)}>
              z
            </text>
          );
        })}
      {/* criado-mudo, relógio e celular */}
      <rect x={30} y={1300} width={310} height={460} rx={14} fill="#4a3426" />
      <rect x={20} y={1288} width={330} height={30} rx={10} fill="#5c4130" />
      <line x1={50} y1={1520} x2={320} y2={1520} stroke="#3a281d" strokeWidth={5} />
      <circle cx={185} cy={1440} r={10} fill="#c9a45c" />
      <rect x={52} y={1214} width={160} height={78} rx={14} fill="#120e0b" />
      <text x={132} y={1270 - pulo} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={46} fill="#ff7a52" filter="url(#brilho)" opacity={0.7}>
        {hora}
      </text>
      <text x={132} y={1270 - pulo} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={46} fill="#ff8b66">
        {hora}
      </text>
      <g transform={`translate(${treme} 0)`}>
        <path d="M228 1288 L312 1288 L304 1270 L236 1270 Z" fill="#2a211b" />
        <rect x={224} y={1076} width={92} height={210} rx={14} fill="#16120f" />
        <rect x={230} y={1084} width={80} height={194} rx={9} fill={chegou ? "#f3ece4" : "#1d1916"} />
        {chegou && (
          <>
            <rect x={230} y={1084} width={80} height={194} rx={9} fill={C.acento} opacity={0.12} />
            <rect x={236} y={1118} width={68} height={30} rx={7} fill="#fff" />
            <rect x={241} y={1126} width={34} height={5} rx={2} fill={C.texto} />
            <rect x={241} y={1136} width={56} height={4} rx={2} fill={C.texto2} />
            <circle cx={270} cy={1183} r={60} fill={C.acento} opacity={0.25 * Math.max(0, 1 - (f - P.pontoChega) / 20)} filter="url(#brilho)" />
          </>
        )}
      </g>
    </svg>
  );
}

const PREDIOS = [
  [0, 190, 640],
  [170, 150, 860],
  [300, 210, 560],
  [490, 170, 940],
  [640, 230, 720],
  [850, 140, 600],
  [970, 150, 790],
];

function Cidade({ f }: { f: number }) {
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="ceuCidade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120f17" />
          <stop offset="1" stopColor="#2c1e19" />
        </linearGradient>
        <radialGradient id="lua">
          <stop offset="0" stopColor="#f3ece4" stopOpacity={0.35} />
          <stop offset="1" stopColor="#f3ece4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#ceuCidade)" />
      {[...Array(40)].map((_, i) => (
        <circle key={i} cx={sorte(i + 100) * 1080} cy={sorte(i + 200) * 1000} r={1.5 + sorte(i + 300) * 2.5} fill="#fff" opacity={0.3 + 0.4 * Math.sin(f / 11 + i)} />
      ))}
      <circle cx={760} cy={420} r={220} fill="url(#lua)" />
      <circle cx={760} cy={420} r={78} fill="#f3ece4" />
      <circle cx={735} cy={400} r={14} fill="#e2d8ca" />
      <circle cx={782} cy={448} r={10} fill="#e2d8ca" />
      {PREDIOS.map(([x, w, h], i) => (
        <g key={i}>
          <rect x={x} y={1920 - h} width={w} height={h} fill={i % 2 ? "#2e221b" : "#3a2b21"} />
          {[...Array(Math.floor((h - 60) / 70))].map((_, r) =>
            [...Array(Math.floor((w - 30) / 46))].map((__, c) => {
              const acesa = sorte(i * 100 + r * 10 + c) > 0.55;
              return <rect key={`${r}-${c}`} x={x + 22 + c * 46} y={1920 - h + 40 + r * 70} width={22} height={32} rx={3} fill={acesa ? "#e8b04a" : "#251b16"} opacity={acesa ? 0.75 : 1} />;
            }),
          )}
        </g>
      ))}
    </svg>
  );
}

/** Balão de pensamento do Matheus: amanhã tem entrevista. */
function Pensamento({ f }: { f: number }) {
  const e = mola(f, S.lembra - 2, { damping: 12 });
  const s = 1 - entre(f, S.cabelo - 8, S.cabelo);
  if (f < S.lembra - 2 || s <= 0) return null;
  const cartao = mola(f, S.amanha, { damping: 12 });
  const fita = mola(f, S.entrevista, { damping: 10 });
  return (
    <g opacity={s} transform={`translate(800 420) scale(${e * s}) translate(-800 -420)`}>
      <circle cx={700} cy={640} r={14} fill="#f3ece4" />
      <circle cx={735} cy={590} r={22} fill="#f3ece4" />
      <path d="M600 300 C560 200 680 140 760 190 C810 120 940 150 940 240 C1020 260 1010 380 930 390 C930 470 800 490 760 440 C700 500 580 470 600 400 C520 390 520 300 600 300 Z" fill="#f3ece4" />
      <g transform={`translate(770 320) scale(${cartao}) rotate(${(1 - cartao) * -20}) translate(-770 -320)`}>
        <rect x={660} y={235} width={220} height={170} rx={20} fill="#fff" stroke={C.divisoria} strokeWidth={3} />
        <rect x={660} y={235} width={220} height={52} rx={20} fill={C.acento} />
        <rect x={660} y={265} width={220} height={22} fill={C.acento} />
        <text x={770} y={272} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={26} letterSpacing="0.1em" fill="#fff">
          AMANHÃ
        </text>
        <text x={770} y={340} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={46} fill={C.texto}>
          14h
        </text>
        <text x={770} y={384} textAnchor="middle" fontFamily={F.serif} fontWeight={700} fontSize={30} fill={C.acentoForte} opacity={fita}>
          Entrevista
        </text>
      </g>
    </g>
  );
}

function Sala({ f }: { f: number }) {
  const caos = entre(f, S.cabelo + 2, S.caos + 4, [0, 1], sai);
  const nao = f >= S.nem && f < S.nem + 22 ? Math.sin((f - S.nem) * 0.9) * 7 * (1 - (f - S.nem) / 22) : 0;
  const respira = Math.sin(f / 20) * 3;
  let olhar: [number, number] = [0, 8];
  let boca: Boca = "neutra";
  let sob = 0;
  if (f >= S.lembra - 2 && f < S.cabelo) {
    olhar = [14, -10];
    sob = 10;
    boca = f >= S.entrevista ? "torta" : "aberta";
  } else if (f >= S.cabelo && f < S.mandar - 4) {
    olhar = [0, -13];
    sob = 14;
    boca = "aberta";
  } else if (f >= S.nem && f < S.abre) {
    boca = "torta";
    sob = 4;
  } else if (f >= S.confirmado) {
    boca = "sorriso";
    sob = 6;
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="abajur" cx="0.15" cy="0.36" r="0.5">
          <stop offset="0" stopColor="#e8b04a" stopOpacity={0.3} />
          <stop offset="1" stopColor="#e8b04a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="luzTela">
          <stop offset="0" stopColor="#f3ece4" stopOpacity={0.2} />
          <stop offset="1" stopColor="#f3ece4" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="#231b16" />
      <rect width={1080} height={1920} fill="url(#abajur)" />
      {/* janela com a cidade */}
      <rect x={690} y={230} width={320} height={380} rx={10} fill="#16121c" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={700 + i * 78} y={430 - (i % 2) * 70} width={66} height={180 + (i % 2) * 70} fill="#2e221b" />
      ))}
      {[...Array(12)].map((_, i) => (
        <rect key={i} x={712 + (i % 4) * 78 + (i % 3) * 8} y={450 + Math.floor(i / 4) * 44 - ((i % 4) % 2) * 60} width={14} height={20} fill="#e8b04a" opacity={sorte(i + 70) > 0.4 ? 0.8 : 0.1} />
      ))}
      <rect x={690} y={230} width={320} height={380} rx={10} fill="none" stroke="#3a2a20" strokeWidth={18} />
      {/* abajur */}
      <rect x={146} y={720} width={10} height={800} fill="#3a2a20" />
      <path d="M86 720 L216 720 L190 610 L112 610 Z" fill="#e8b04a" />
      <ellipse cx={151} cy={1520} rx={70} ry={14} fill="#1a1410" />
      {/* sofá */}
      <rect x={40} y={1040} width={1000} height={520} rx={70} fill="#6b3a2b" />
      <rect x={0} y={1460} width={1080} height={460} rx={50} fill="#5a3024" />
      <rect x={0} y={1180} width={130} height={560} rx={50} fill="#5e3226" />
      <rect x={950} y={1180} width={130} height={560} rx={50} fill="#5e3226" />
      {/* Matheus */}
      <g transform={`translate(0 ${respira})`}>
        <rect x={490} y={990} width={100} height={140} rx={34} fill={MATHEUS.sombra} />
        <path d="M300 1920 L300 1300 C300 1180 400 1112 480 1100 L600 1100 C680 1112 780 1180 780 1300 L780 1920 Z" fill="#e8b04a" />
        <path d="M480 1100 Q540 1150 600 1100" stroke="#c9902f" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M352 1210 C300 1360 296 1500 360 1570" stroke="#d9a03d" strokeWidth={84} strokeLinecap="round" fill="none" />
        <path d="M728 1210 C780 1360 784 1500 720 1570" stroke="#d9a03d" strokeWidth={84} strokeLinecap="round" fill="none" />
        <g transform={`translate(540 ${872}) rotate(${nao}) scale(1.25) translate(-150 -190)`}>
          <Cabeca {...MATHEUS} olhar={olhar} piscar={piscada(f, 12)} boca={boca} sobrancelha={sob} caos={caos} t={f} />
        </g>
        <ellipse cx={540} cy={970} rx={190} ry={160} fill="url(#luzTela)" opacity={f < S.abre ? 1 : 0} />
      </g>
      <Pensamento f={f} />
    </svg>
  );
}

/** Antebraços e mãos do Matheus, por cima do celular (somem quando a câmera entra na tela). */
function Maos({ f }: { f: number }) {
  const o = Math.min(1 - entre(f, P.mergulho, P.mergulho + 10), 1) + entre(f, P.volta + 6, P.volta + 18);
  if (o <= 0) return null;
  const respira = Math.sin(f / 20) * 3;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0, opacity: Math.min(1, o) }}>
      <g transform={`translate(0 ${respira})`}>
        <path d="M362 1572 C400 1560 440 1500 456 1440" stroke={MATHEUS.pele} strokeWidth={62} strokeLinecap="round" fill="none" />
        <path d="M718 1572 C680 1560 640 1500 624 1440" stroke={MATHEUS.pele} strokeWidth={62} strokeLinecap="round" fill="none" />
        <ellipse cx={452} cy={1418} rx={34} ry={46} fill={MATHEUS.pele} />
        <ellipse cx={628} cy={1418} rx={34} ry={46} fill={MATHEUS.pele} />
        <ellipse cx={470} cy={1392} rx={12} ry={26} fill={MATHEUS.sombra} opacity={0.5} />
        <ellipse cx={610} cy={1392} rx={12} ry={26} fill={MATHEUS.sombra} opacity={0.5} />
      </g>
    </svg>
  );
}

/** A mensagem que o Matheus quase manda (e apaga). */
function Mensagem({ f }: { f: number }) {
  if (f < S.mandar - 4 || f > S.nem + 30) return null;
  const e = mola(f, S.mandar - 4, { damping: 13 });
  const digitadas = Math.min(L.MENSAGEM.length, Math.max(0, Math.floor((f - S.mandar - 2) / 1.6) + 1));
  const apagadas = f >= S.nem ? Math.min(digitadas, (f - S.nem) * 4) : 0;
  const texto = L.MENSAGEM.slice(0, Math.max(0, digitadas - apagadas));
  const vai = entre(f, S.nem + 16, S.nem + 30, [0, 1], Easing.in(Easing.cubic));
  const treme = f >= S.nem && f < S.nem + 14 ? Math.sin(f * 2.2) * 10 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 290,
        width: 800,
        transformOrigin: "400px 500px",
        transform: `translate(${treme}px, ${vai * 700}px) scale(${e * (1 - vai * 0.8)})`,
        opacity: 1 - vai,
        fontFamily: F.sans,
      }}
    >
      <div style={{ background: "#f3ece4", borderRadius: 34, padding: 26, boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LogoBarbearia tam={74} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.texto }}>Barbearia do Rafa</div>
            <div style={{ fontSize: 24, color: C.texto2 }}>visto por último hoje às 19:12</div>
          </div>
        </div>
        <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minHeight: 74, borderRadius: 40, background: "#fff", display: "flex", alignItems: "center", padding: "0 28px", fontSize: 32, color: C.texto }}>
            {texto}
            <span style={{ width: 3, height: 38, background: C.texto, marginLeft: 3, opacity: Math.floor(f / 8) % 2 ? 1 : 0.2 }} />
          </div>
          <div style={{ width: 74, height: 74, borderRadius: 99, background: C.whats, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={34} height={34} viewBox="0 0 24 24" fill="#fff">
              <path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- dentro do celular do Matheus ----------

type Passo = "servico" | "horario" | "dados" | "revisao" | "confirmado";
const PASSOS: { de: number; tela: Passo }[] = [
  { de: S.barbearia - 2, tela: "servico" },
  { de: P.passoHorario, tela: "horario" },
  { de: P.passoDados, tela: "dados" },
  { de: P.passoRevisao, tela: "revisao" },
  { de: P.passoConfirmado, tela: "confirmado" },
];

function rolagem(tela: Passo, f: number) {
  if (tela === "servico") return entre(f, S.barbearia + 6, S.barbearia + 20, [0, 230]) + entre(f, P.toqueCorte + 3, P.toqueContinuar1 - 3, [0, 364]);
  if (tela === "horario") return 380 + entre(f, P.toqueHora + 3, P.toqueContinuar2 - 2, [0, 260]);
  if (tela === "dados") return 160 + entre(f, P.toqueRevisar - 10, P.toqueRevisar - 3, [0, 240]);
  if (tela === "revisao") return entre(f, P.passoRevisao + 1, P.toqueConfirmar - 3, [0, 560]);
  return 0;
}

const TOPO_PAGINA = 82;
const TOQUES = [
  { f: P.toqueCorte, ...ALVOS.servico.cartao1, rol: 230 },
  { f: P.toqueContinuar1, ...ALVOS.servico.continuar, rol: 594 },
  { f: P.toqueDia, ...ALVOS.horario.dia, rol: 380 },
  { f: P.toqueHora, ...ALVOS.horario.hora, rol: 380 },
  { f: P.toqueContinuar2, ...ALVOS.horario.continuar, rol: 640 },
  { f: P.digitaNome - 2, ...ALVOS.dados.nome, rol: 160 },
  { f: P.digitaTelefone - 2, ...ALVOS.dados.telefone, rol: 160 },
  { f: P.toqueRevisar, ...ALVOS.dados.revisar, rol: 400 },
  { f: P.toqueConfirmar, ...ALVOS.revisao.confirmar, rol: 560 },
].map((t) => ({ f: t.f, x: t.x, y: TOPO_PAGINA + t.y - t.rol }));

/** O dedo: vai de um toque ao outro, aperta e solta uma onda. */
function Dedo({ f }: { f: number }) {
  if (f < TOQUES[0].f - 14 || f > TOQUES[TOQUES.length - 1].f + 14) return null;
  const i = TOQUES.findIndex((t) => f <= t.f + 6);
  const alvo = TOQUES[Math.max(0, i === -1 ? TOQUES.length - 1 : i)];
  const antes = TOQUES[Math.max(0, (i === -1 ? TOQUES.length - 1 : i) - 1)];
  const k = i <= 0 ? 1 : entre(f, alvo.f - 8, alvo.f - 1);
  const x = antes.x + (alvo.x - antes.x) * k;
  const y = antes.y + (alvo.y - antes.y) * k;
  const aperta = f >= alvo.f - 1 && f < alvo.f + 3 ? 0.78 : 1;
  const onda = entre(f, alvo.f, alvo.f + 12);
  // o dedo some quando fica parado (para não tapar o que está sendo digitado) e volta antes do próximo toque
  const ultimo = [...TOQUES].reverse().find((t) => t.f <= f);
  const proximo = TOQUES.find((t) => t.f > f);
  const perto = Math.max(ultimo ? 1 - entre(f, ultimo.f + 6, ultimo.f + 12) : 0, proximo ? entre(f, proximo.f - 14, proximo.f - 8) : 0);
  const entra = perto;
  return (
    <>
      {f >= alvo.f && onda < 1 && <div style={{ position: "absolute", left: alvo.x - 30, top: alvo.y - 30, width: 60, height: 60, borderRadius: 99, border: `3px solid ${C.acento}`, transform: `scale(${0.4 + onda * 1.4})`, opacity: 1 - onda }} />}
      <div
        style={{
          position: "absolute",
          left: x - 17,
          top: y - 17,
          width: 34,
          height: 34,
          borderRadius: 99,
          background: "rgba(31,27,23,0.35)",
          border: "3px solid rgba(255,255,255,0.95)",
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
          transform: `scale(${aperta * entra})`,
        }}
      />
    </>
  );
}

function Pagina({ tela, f }: { tela: Passo; f: number }) {
  const digNome = Math.max(0, Math.min(L.NOME.length, Math.floor((f - P.digitaNome) / 2) + 1));
  const digTel = Math.max(0, Math.min(L.TELEFONE.length, Math.floor((f - P.digitaTelefone) / 2) + 1));
  const nome = f >= P.digitaNome ? L.NOME.slice(0, digNome) : "";
  const telefone = f >= P.digitaTelefone ? L.TELEFONE.slice(0, digTel) : "";
  switch (tela) {
    case "servico":
      return <PaginaServico escolhido={f >= P.toqueCorte} />;
    case "horario":
      return <PaginaHorario dia={f >= P.toqueDia} hora={f >= P.toqueHora} />;
    case "dados":
      return <PaginaDados nome={nome} telefone={telefone} foco={f >= P.digitaTelefone - 2 ? "telefone" : f >= P.digitaNome - 2 ? "nome" : undefined} cursor={Math.floor(f / 8) % 2 === 0} />;
    case "revisao":
      return <PaginaRevisao nome={L.NOME} telefoneOculto="(11) 9****-1098" apertado={f >= P.toqueConfirmar - 1 && f < P.toqueConfirmar + 3 ? 1 : 0} />;
    default:
      return <PaginaConfirmado p={entre(f, P.passoConfirmado, P.passoConfirmado + 24, [0, 1], Easing.linear)} />;
  }
}

function TelaMatheus({ f }: { f: number }) {
  const atual = PASSOS.reduce((idx, p, i) => (f >= p.de ? i : idx), -1);
  const carregando = entre(f, S.link - 4, S.barbearia, [0, 1], Easing.linear);
  return (
    <div style={{ width: LARGURA_TELA, height: ALTURA_TELA, background: C.fundo, position: "relative", overflow: "hidden" }}>
      <BarraStatus hora="23:07" />
      <BarraEndereco url="agendafio.com.br/barbearia-do-rafa" carregando={f < S.barbearia ? carregando : 1} />
      <div style={{ position: "absolute", left: 0, top: TOPO_PAGINA, width: LARGURA_TELA, height: ALTURA_TELA - TOPO_PAGINA, overflow: "hidden" }}>
        {PASSOS.map((p, i) => {
          if (i !== atual && i !== atual - 1) return null;
          const proxima = PASSOS[i + 1];
          const chegada = i === 0 ? entre(f, p.de, p.de + 8) : entre(f, p.de, p.de + 8, [0, 1], sai);
          const saida = proxima && f >= proxima.de ? entre(f, proxima.de, proxima.de + 8, [0, 1], sai) : 0;
          if (saida >= 1) return null;
          const x = i === 0 ? 0 : (1 - chegada) * LARGURA_TELA - saida * 120;
          return (
            <div key={p.tela} style={{ position: "absolute", inset: 0, transform: `translateX(${i === 0 ? -saida * 120 : x}px)`, opacity: i === 0 ? chegada * (1 - saida) : 1 - saida * 0.6 }}>
              <div style={{ transform: `translateY(${-rolagem(p.tela, f)}px)` }}>
                <Pagina tela={p.tela} f={f} />
              </div>
            </div>
          );
        })}
      </div>
      <Dedo f={f} />
    </div>
  );
}

function CelularMatheus({ f }: { f: number }) {
  const virar = 180 - entre(f, P.mergulho + 2, P.mergulho + 16) * 180;
  const frente = virar < 90;
  const largura = TW + BEZEL * 2;
  const altura = TH + BEZEL * 2;
  return (
    <div style={{ position: "absolute", left: 540 - largura / 2, top: CEL.y - altura / 2, width: largura, height: altura, perspective: virar > 0 && virar < 180 ? 900 : undefined }}>
      <div style={{ width: "100%", height: "100%", transform: virar > 0 && virar < 180 ? `rotateY(${virar}deg)` : undefined, position: "relative" }}>
        {frente ? (
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "#16120f", padding: BEZEL, boxSizing: "border-box", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
            <div style={{ width: TW, height: TH, borderRadius: 17, overflow: "hidden", position: "relative" }}>
              <div style={{ width: LARGURA_TELA, height: ALTURA_TELA, transform: `scale(${K})`, transformOrigin: "0 0" }}>
                <TelaMatheus f={f} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "#2b221c", transform: "scaleX(-1)", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
            <div style={{ position: "absolute", left: 14, top: 14, width: 52, height: 52, borderRadius: 16, background: "#1a1410" }}>
              <div style={{ position: "absolute", left: 8, top: 8, width: 16, height: 16, borderRadius: 99, background: "#0c0907", border: "2px solid #3a2e26" }} />
              <div style={{ position: "absolute", left: 28, top: 26, width: 16, height: 16, borderRadius: 99, background: "#0c0907", border: "2px solid #3a2e26" }} />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%, -50%)", opacity: 0.5 }}>
              <Laco tamanho={46} cor="#8a6a52" espessura={3} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** O fio que atravessa a cidade levando o agendamento, com o ponto brilhando na ponta. */
function Fio({ f }: { f: number }) {
  if (f < P.pontoSai) return null;
  const t = entre(f, P.pontoSai, P.pontoChega, [0, 1], Easing.inOut(Easing.cubic));
  const some = 1 - entre(f, S.manha, S.manha + 20);
  const n = Math.max(2, Math.ceil(t * 140));
  const pontos = Array.from({ length: n }, (_, i) => pontoNoFio((i / (n - 1)) * t));
  const d = pontos.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const ponta = pontoNoFio(t);
  const viajando = f < P.pontoChega;
  return (
    <svg width={3240} height={1920} viewBox="0 0 3240 1920" style={{ position: "absolute", inset: 0, overflow: "visible", opacity: some }}>
      <path d={d} stroke="#e8b04a" strokeWidth={30} strokeLinecap="round" fill="none" opacity={0.25} />
      <path d={d} stroke={C.acento} strokeWidth={14} strokeLinecap="round" fill="none" />
      {viajando && (
        <>
          <circle cx={ponta.x} cy={ponta.y} r={90} fill="#e8b04a" opacity={0.25} />
          <circle cx={ponta.x} cy={ponta.y} r={42} fill={C.acento} stroke="#f3ece4" strokeWidth={8} />
          <path d={`M${ponta.x - 16} ${ponta.y} l11 11 l22 -22`} stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
    </svg>
  );
}

function Mundo({ f }: { f: number }) {
  const cam = cameraEm(f, CAMERA);
  const dia = entre(f, S.manha - 4, S.manha + 26);
  const raio = cam.s < 0.95 ? interpolate(cam.s, [0.36, 0.95], [70, 0], lim) : 0;
  const desfoque = borrao(f, CAMERA, 8);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 3240,
          height: 1920,
          transformOrigin: "0 0",
          transform: transformMundo(cam),
          borderRadius: raio,
          overflow: "hidden",
          filter: desfoque > 0.3 ? `blur(${desfoque / cam.s}px)` : undefined,
        }}
      >
        <div style={{ position: "absolute", left: QUARTO, top: 0, width: 1080, height: 1920 }}>
          <Quarto f={f} dia={dia} />
        </div>
        <div style={{ position: "absolute", left: CIDADE, top: 0, width: 1080, height: 1920 }}>
          <Cidade f={f} />
        </div>
        <div style={{ position: "absolute", left: SALA, top: 0, width: 1080, height: 1920 }}>
          <Sala f={f} />
          <CelularMatheus f={f} />
          <Maos f={f} />
          <Mensagem f={f} />
        </div>
        <Fio f={f} />
      </div>
    </AbsoluteFill>
  );
}

/** Céu estrelado por trás do mundo (aparece quando a câmera se afasta). */
function Fundo({ f }: { f: number }) {
  return (
    <AbsoluteFill style={{ background: "radial-gradient(1400px 1000px at 50% 45%, #2a1d17, #0e0b09 70%)" }}>
      {[...Array(60)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: sorte(i + 500) * 1080, top: sorte(i + 600) * 1920, width: 3, height: 3, borderRadius: 9, background: "#fff", opacity: 0.15 + 0.25 * Math.sin(f / 10 + i) }} />
      ))}
    </AbsoluteFill>
  );
}

/** Com a câmera parada dentro do celular, a tela é desenhada direto no tamanho do vídeo (texto nítido). */
const TELA_CHEIA = { de: P.mergulho + 30, ate: P.volta };
function TelaCheiaMatheus({ f }: { f: number }) {
  return (
    <AbsoluteFill style={{ background: "#16120f" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: ALTURA_TELA * KT, borderRadius: 17 * S_TELA, overflow: "hidden" }}>
        <div style={{ width: LARGURA_TELA, height: ALTURA_TELA, transform: `scale(${KT})`, transformOrigin: "0 0" }}>
          <TelaMatheus f={f} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ---------- o que sai do celular do Rafa ----------

const ALVO_AVISO = { x: 60, y: 430, w: 960 };

/** O aviso sai do celular do Rafa, cresce, e depois vira a tela da agenda inteira. */
function AvisoEAgenda({ f }: { f: number }) {
  const inicio = S.aviso - 4;
  if (f < inicio || f >= S.fio + 4) return null;
  const camNoInicio = cameraEm(inicio, CAMERA);
  const origem = naTela(camNoInicio, CEL_RAFA.x, CEL_RAFA.y - 60);
  const larguraOrigem = 68 * camNoInicio.s;
  const cresce = mola(f, inicio, { damping: 15, stiffness: 120 });
  const vira = entre(f, S.agenda - 22, S.agenda - 4, [0, 1], Easing.inOut(Easing.cubic));
  // aviso
  const escalaAviso = (larguraOrigem + (ALVO_AVISO.w - larguraOrigem) * cresce) / 360;
  const xAviso = origem.x - (larguraOrigem / 2) * (1 - cresce) + (ALVO_AVISO.x - origem.x) * cresce;
  const yAviso = origem.y + (ALVO_AVISO.y - origem.y) * cresce;
  // a caixa que vira a agenda: do tamanho do aviso até a tela toda
  const caixa = {
    x: xAviso * (1 - vira),
    y: yAviso * (1 - vira),
    w: 360 * escalaAviso + (1080 - 360 * escalaAviso) * vira,
    h: 118 * escalaAviso + (1920 - 118 * escalaAviso) * vira,
  };
  const rolar = entre(f, S.agenda + 2, S.agenda + 16, [0, 120]);
  const destaque = f >= S.agenda + 6 ? 0.6 + 0.4 * Math.sin((f - S.agenda - 6) / 5) : 0;
  return (
    <AbsoluteFill>
      {vira < 1 && (
        <div style={{ position: "absolute", left: xAviso, top: yAviso, transformOrigin: "0 0", transform: `scale(${escalaAviso})`, opacity: (1 - vira) * Math.min(1, cresce * 3) }}>
          <Notificacao nome={L.NOME} quando="seg 02/11 às 10:00" />
        </div>
      )}
      {vira > 0 && (
        <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, borderRadius: 40 * (1 - vira), overflow: "hidden", background: C.fundo, opacity: Math.min(1, vira * 3), boxShadow: "0 40px 80px -30px rgba(0,0,0,0.6)" }}>
          <div style={{ width: LARGURA_TELA, transformOrigin: "0 0", transform: `scale(${(caixa.w / 1080) * KT})` }}>
            <div style={{ transform: `translateY(${26 - rolar}px)` }}>
              <PaginaAgenda destaque={destaque} />
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA_TELA, background: C.fundo }}>
              <BarraStatus hora="07:02" />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

/** "Mensagens pra responder: 0" por cima da agenda. */
function ZeroMensagens({ f }: { f: number }) {
  if (f < S.responder - 2 || f >= S.fio - 10) return null;
  const e = mola(f, S.responder - 2, { damping: 11 });
  const zero = mola(f, S.nenhuma, { damping: 8, stiffness: 220 });
  return (
    <div style={{ position: "absolute", left: 120, right: 120, top: 520, transform: `scale(${e}) rotate(-3deg)`, display: "flex", alignItems: "center", gap: 26, background: C.escuro, color: "#f3ece4", borderRadius: 36, padding: "26px 34px", fontFamily: F.sans, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6)" }}>
      <div style={{ width: 84, height: 84, borderRadius: 99, background: C.whats, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      </div>
      <div style={{ flex: 1, fontSize: 38, fontWeight: 700, lineHeight: 1.15 }}>mensagens pra responder</div>
      <div style={{ fontSize: 120, fontWeight: 900, color: "#f2c063", transform: `scale(${f >= S.nenhuma ? 1 + (1 - zero) * 0.8 : 1}) rotate(${f >= S.nenhuma ? (1 - zero) * 12 : 0}deg)`, width: 80, textAlign: "center" }}>0</div>
    </div>
  );
}

/** Selos que pulam por cima da tela de dados. */
function Selos({ f }: { f: number }) {
  if (f < S.semApp - 2 || f >= P.passoRevisao) return null;
  const selo = (texto: string, de: number, y: number, giro: number) => {
    const e = mola(f, de, { damping: 10, stiffness: 200 });
    if (f < de) return null;
    return (
      <div style={{ position: "absolute", right: 70, top: y, transform: `scale(${e}) rotate(${giro}deg)`, transformOrigin: "100% 50%", display: "flex", alignItems: "center", gap: 14, background: C.escuro, color: "#f3ece4", borderRadius: 999, padding: "22px 38px 22px 24px", fontFamily: F.sans, fontWeight: 800, fontSize: 50, boxShadow: "0 20px 40px -16px rgba(0,0,0,0.55)" }}>
        <span style={{ width: 62, height: 62, borderRadius: 99, background: C.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        {texto}
      </div>
    );
  };
  return (
    <AbsoluteFill>
      {selo("sem baixar aplicativo", S.semApp - 2, 430, -3)}
      {selo("sem criar conta", S.semConta - 2, 580, 2)}
    </AbsoluteFill>
  );
}

// ---------- final ----------

function Final({ f }: { f: number }) {
  const inicio = S.fio - 14;
  if (f < inicio) return null;
  const centro = { x: 82 * KT + 30, y: (26 + Y_AGENDA(1) - 120 + 46) * KT };
  const abre = entre(f, inicio, inicio + 16, [0, 1], Easing.in(Easing.quad));
  const laco = entre(f, S.fio - 8, S.fio + 26, [0, 1], Easing.inOut(Easing.cubic));
  const nome = mola(f, S.fio, { damping: 13 });
  const frase = tempos.palavras.filter((p) => p.f === tempos.falas.length - 1).slice(1);
  const chamada = mola(f, S.dorme + 10, { damping: 12 });
  return (
    <>
    <AbsoluteFill style={{ clipPath: `circle(${abre * 2400}px at ${centro.x}px ${centro.y}px)`, background: C.acento }} />
    <AbsoluteFill style={{ clipPath: `circle(${entre(f, inicio + 5, inicio + 22, [0, 1], Easing.in(Easing.quad)) * 2400}px at ${centro.x}px ${centro.y}px)`, background: C.fundo }}>
      <AbsoluteFill style={{ background: "radial-gradient(1100px 900px at 85% 0%, rgba(176,81,58,0.12), transparent 60%), radial-gradient(900px 800px at 0% 100%, rgba(176,81,58,0.08), transparent 60%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
        <Laco tamanho={340} progresso={laco} espessura={2.6} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: F.serif, fontWeight: 700, fontSize: 150, color: C.texto, letterSpacing: "-0.02em", transform: `translateY(${(1 - nome) * 40}px)`, opacity: nome }}>
        Fio
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 930, textAlign: "center", fontFamily: F.serif, fontWeight: 600, fontSize: 70, lineHeight: 1.12, color: C.texto }}>
        {frase.map((p, i) => {
          const q = Math.round(p.a * 30);
          const e = mola(f, q - 2, { damping: 12, stiffness: 220 });
          const ultima = i === frase.length - 1;
          return (
            <span key={i} style={{ display: "inline-block", marginRight: 18, opacity: f >= q - 2 ? e : 0, transform: `translateY(${(1 - e) * 20}px)`, color: ultima ? C.acento : C.texto, fontStyle: ultima ? "italic" : "normal" }}>
              {p.p}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1320, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: `scale(${chamada})`, opacity: f >= S.dorme + 10 ? 1 : 0 }}>
        <div style={{ background: C.acento, color: "#fff", fontFamily: F.sans, fontWeight: 800, fontSize: 48, borderRadius: 999, padding: "26px 52px", boxShadow: "0 24px 50px -20px rgba(176,81,58,0.7)" }}>Teste grátis por 7 dias</div>
        <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 38, color: C.texto2 }}>link na bio</div>
      </div>
    </AbsoluteFill>
    </>
  );
}

export function V14Piloto() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0e0b09" }}>
      <Fundo f={f} />
      {f < S.agenda && (f < TELA_CHEIA.de || f > TELA_CHEIA.ate) && <Mundo f={f} />}
      {f >= TELA_CHEIA.de && f <= TELA_CHEIA.ate && <TelaCheiaMatheus f={f} />}
      <Selos f={f} />
      <AvisoEAgenda f={f} />
      <ZeroMensagens f={f} />
      <Final f={f} />
      {f < S.fio - 12 && <LegendaDinamica f={f} blocos={BLOCOS} chaves={CHAVES_LEGENDA} />}
    </AbsoluteFill>
  );
}
