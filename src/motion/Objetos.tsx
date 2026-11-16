import React, { useId } from "react";
import { C, F } from "../base";

/**
 * Objetos de barbearia em vetor (mesmo traço chapado dos personagens), num quadro de 400 × 400.
 * Cada um tem o seu movimento, que vem só do quadro `f`: o poste gira as listras, a toalha solta vapor,
 * a navalha abre e fecha, a máquina vibra, a tesoura corta, o pincel faz espuma e os outros flutuam.
 * Servem grandes (cena "objeto") e pequenos, como ícone de uns 120 px.
 */

export type Objeto2D = "poste" | "toalha" | "navalha" | "maquina" | "tesoura" | "pente" | "cadeiraAntiga" | "pincel" | "pomada";

/** variantes de desenho: "vermelhoBranco" é o poste só com listras vermelhas e brancas (o da lei inglesa); sem variante, o de sempre */
export type VarianteObjeto = "vermelhoBranco";

const ACO = "#d9dde0";
const ACO_ESCURO = "#9aa0a5";
const OURO = "#e0b65a";
const OURO_ESCURO = "#b98a33";
const OURO_CLARO = "#f6d78e";
const PRETO = "#2a211b";
const CABELO = "#5b3a26";
const TARTARUGA = "#c98a3a";
const TARTARUGA_ESCURA = "#9c6526";
const TARTARUGA_CLARA = "#ecbb76";
const COURO = "#8e2f25";
const COURO_CLARO = "#b04a3c";
const COURO_ESCURO = "#6e221b";
const LOUCA = "#f1ebe2";
const LOUCA_SOMBRA = "#d6cbbd";

/** número pseudoaleatório fixo (o mesmo a cada quadro) */
const sorte = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** vai e volta suave de 0 a 1 */
const suave = (s: number) => {
  const t = Math.max(0, Math.min(1, s));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/** quanto o objeto inteiro se mexe no quadro (flutuar ou vibrar), em unidades do quadro de 400 */
export function movimento(nome: Objeto2D, f: number): { dx: number; dy: number; giro: number } {
  if (nome === "maquina") return { dx: Math.sin(f * 3.3) * 2.6, dy: Math.cos(f * 4.1) * 1.3, giro: Math.sin(f * 2.7) * 0.9 };
  if (nome === "pente" || nome === "cadeiraAntiga" || nome === "pomada") return { dx: 0, dy: Math.sin(f / 19) * 9 - 3, giro: Math.sin(f / 31) * 2.4 };
  return { dx: 0, dy: 0, giro: 0 };
}

/** abertura da navalha (0 fechada, 1 aberta): abre, fica aberta, fecha, fica fechada um instante */
function aberturaNavalha(f: number) {
  const t = ((f % 100) + 100) % 100;
  if (t < 22) return suave(t / 22);
  if (t < 72) return 1;
  if (t < 90) return 1 - suave((t - 72) / 18);
  return 0;
}
/** o cabo desce para a direita; aberta, a lâmina fica deitada e o fio (embaixo) fecha na direção do cabo */
const NAVALHA = { x: 212, y: 168, giro: 40, escala: 0.92 };
/** ângulo da lâmina em relação ao cabo: −40 aberta (a pose clássica, em "V") e −170 fechada dentro do cabo */
const anguloNavalha = (f: number) => -40 - (1 - aberturaNavalha(f)) * 130;

/** a tesoura: abre devagar e fecha rápido (o "tec" do corte) */
export const TESOURA = { ciclo: 26, fecha: 21 };
function aberturaTesoura(f: number) {
  const t = ((f % TESOURA.ciclo) + TESOURA.ciclo) % TESOURA.ciclo;
  if (t < 16) return suave(t / 16);
  if (t < TESOURA.fecha) return 1 - (t - 16) / (TESOURA.fecha - 16);
  return 0;
}
/** meio-ângulo de abertura da tesoura (graus) */
const anguloTesoura = (f: number) => 1 + 17 * aberturaTesoura(f);
/** a tesoura inteira: pino e inclinação */
const TESOURA_POS = { x: 200, y: 206, giro: -14 };

/** gira o ponto (x, y) em `graus` em volta da origem */
function gira(x: number, y: number, graus: number): [number, number] {
  const a = (graus * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}

/**
 * Pontos de cada objeto (no quadro de 400) para onde apontam as linhas das etiquetas,
 * na ordem das posições das etiquetas: em cima à esquerda, embaixo à direita, em cima à direita, embaixo à esquerda.
 */
const PONTOS: Record<Objeto2D, [number, number][]> = {
  poste: [[150, 90], [238, 272], [200, 40], [150, 324]],
  toalha: [[104, 226], [316, 304], [212, 118], [92, 304]],
  navalha: [[0, 0], [290, 233], [212, 168], [342, 277]],
  maquina: [[150, 52], [262, 246], [200, 140], [138, 304]],
  tesoura: [[180, 100], [300, 278], [200, 206], [146, 318]],
  pente: [[92, 160], [296, 252], [300, 146], [110, 250]],
  cadeiraAntiga: [[264, 138], [282, 320], [300, 42], [72, 326]],
  pincel: [[170, 78], [242, 316], [242, 170], [160, 250]],
  pomada: [[118, 114], [300, 322], [262, 240], [96, 296]],
};

/** onde o ponto `i` do objeto está no quadro `f` (já com o movimento), no quadro de 400 */
export function ponto(nome: Objeto2D, i: number, f: number): [number, number] {
  let [x, y] = PONTOS[nome][i % 4];
  if (nome === "navalha" && i % 4 === 0) {
    // acompanha o meio da lâmina enquanto ela abre e fecha
    const [px, py] = gira(-110, 12, anguloNavalha(f) + NAVALHA.giro);
    x = NAVALHA.x + NAVALHA.escala * px;
    y = NAVALHA.y + NAVALHA.escala * py;
  }
  if (nome === "tesoura" && i % 4 === 0) {
    // acompanha a lâmina da esquerda enquanto a tesoura abre e fecha
    const [px, py] = gira(10, -112, anguloTesoura(f));
    const [qx, qy] = gira(-px, py, TESOURA_POS.giro);
    x = TESOURA_POS.x + qx;
    y = TESOURA_POS.y + qy;
  }
  const m = movimento(nome, f);
  const g = (m.giro * Math.PI) / 180;
  const rx = 200 + (x - 200) * Math.cos(g) - (y - 200) * Math.sin(g);
  const ry = 200 + (x - 200) * Math.sin(g) + (y - 200) * Math.cos(g);
  return [rx + m.dx, ry + m.dy];
}

/** sombra no chão de cada objeto: altura e meia largura */
const SOMBRA: Record<Objeto2D, [number, number]> = {
  poste: [384, 64],
  toalha: [352, 160],
  navalha: [334, 140],
  maquina: [384, 86],
  tesoura: [376, 96],
  pente: [334, 150],
  cadeiraAntiga: [372, 140],
  pincel: [380, 70],
  pomada: [372, 128],
};

type Desenho = (p: { f: number; id: string; variante?: VarianteObjeto }) => React.ReactElement;

/** gradiente de metal cromado (da esquerda para a direita) */
function Cromo({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1={0} y1={0} x2={1} y2={0}>
      <stop offset={0} stopColor="#7f868c" />
      <stop offset={0.22} stopColor="#f4f6f7" />
      <stop offset={0.5} stopColor="#c3c9cd" />
      <stop offset={0.8} stopColor="#9aa0a5" />
      <stop offset={1} stopColor="#6f767c" />
    </linearGradient>
  );
}

// ---------- poste ----------

/** listras do poste: o de sempre (vermelho, branco e azul) e o da lei inglesa (só vermelho e branco) */
const LISTRAS_POSTE: Record<"padrao" | VarianteObjeto, string[]> = {
  padrao: ["#c8322b", "#f8f4ee", "#2c4f8c", "#f8f4ee"],
  vermelhoBranco: ["#c8322b", "#f8f4ee", "#c8322b", "#f8f4ee"],
};

const Poste: Desenho = ({ f, id, variante }) => {
  const x0 = 150;
  const x1 = 250;
  const y0 = 96;
  const y1 = 318;
  const faixa = 28;
  const periodo = faixa * 4;
  const sobe = (f * 2.4) % periodo;
  const cores = LISTRAS_POSTE[variante ?? "padrao"];
  const listras = [];
  for (let k = -5; k < 14; k++) {
    const y = y0 + k * faixa - sobe;
    listras.push(<path key={k} d={`M${x0} ${y + 56} L${x1} ${y} L${x1} ${y + faixa + 0.6} L${x0} ${y + 56 + faixa + 0.6} Z`} fill={cores[((k % 4) + 4) % 4]} />);
  }
  return (
    <>
      <defs>
        <Cromo id={`${id}cromo`} />
        <clipPath id={`${id}tubo`}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
        <linearGradient id={`${id}vidro`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#000" stopOpacity={0.3} />
          <stop offset={0.16} stopColor="#000" stopOpacity={0} />
          <stop offset={0.24} stopColor="#fff" stopOpacity={0.55} />
          <stop offset={0.34} stopColor="#fff" stopOpacity={0} />
          <stop offset={0.7} stopColor="#000" stopOpacity={0.04} />
          <stop offset={1} stopColor="#000" stopOpacity={0.34} />
        </linearGradient>
      </defs>
      {/* o tubo de vidro com as listras subindo */}
      <g clipPath={`url(#${id}tubo)`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="#f8f4ee" />
        {listras}
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}vidro)`} />
      </g>
      <rect x={x0 - 6} y={y0} width={8} height={y1 - y0} fill={`url(#${id}cromo)`} />
      <rect x={x1 - 2} y={y0} width={8} height={y1 - y0} fill={`url(#${id}cromo)`} />
      {/* em cima: cúpula e bola */}
      <rect x={192} y={48} width={16} height={18} fill={`url(#${id}cromo)`} />
      <circle cx={200} cy={40} r={18} fill={`url(#${id}cromo)`} />
      <circle cx={194} cy={34} r={5} fill="#fff" opacity={0.8} />
      <path d="M146 88 C146 56 254 56 254 88 Z" fill={`url(#${id}cromo)`} />
      <rect x={136} y={82} width={128} height={18} rx={7} fill={`url(#${id}cromo)`} />
      {/* embaixo: aro, cúpula e ponta */}
      <rect x={136} y={314} width={128} height={18} rx={7} fill={`url(#${id}cromo)`} />
      <path d="M146 330 C146 362 254 362 254 330 Z" fill={`url(#${id}cromo)`} />
      <circle cx={200} cy={364} r={11} fill={`url(#${id}cromo)`} />
    </>
  );
};

// ---------- toalha quente ----------

function espiral(cx: number, cy: number, rx: number, ry: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const a = Math.PI * 0.5 + t * Math.PI * 2 * 2.6;
    const r = 0.86 - t * 0.74;
    pts.push(`${(cx + rx * r * Math.cos(a)).toFixed(1)} ${(cy + ry * r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
}

const Toalha: Desenho = ({ f, id }) => {
  const xs = [146, 206, 266];
  const vapor = xs.map((x, i) => {
    const ciclo = 66;
    const p = (((f + i * 22) % ciclo) + ciclo) % ciclo / ciclo;
    const y = 176 - p * 74;
    const op = Math.sin(Math.PI * p);
    const w = Math.sin(f / 9 + i * 2.1) * 10;
    const d = `M${x} ${y} C${x - 18 + w} ${y - 18} ${x + 18 + w} ${y - 34} ${x + w * 0.5} ${y - 52} C${x - 14 + w * 0.3} ${y - 66} ${x + 12 + w} ${y - 76} ${x + w} ${y - 86}`;
    return (
      <g key={i} opacity={op} strokeLinecap="round" fill="none">
        <path d={d} stroke="#6b4a36" strokeOpacity={0.16} strokeWidth={22 - p * 6} />
        <path d={d} stroke="#ffffff" strokeWidth={12 - p * 4} />
      </g>
    );
  });
  const listra = (a: number, b: number) => `M${a} 190 A28 56 0 0 1 ${a} 302 L${b} 302 A28 56 0 0 0 ${b} 190 Z`;
  return (
    <>
      <defs>
        <Cromo id={`${id}cromo`} />
        <linearGradient id={`${id}pano`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#ffffff" />
          <stop offset={0.5} stopColor="#f7f0e7" />
          <stop offset={1} stopColor="#d9cab9" />
        </linearGradient>
      </defs>
      {/* bandeja */}
      <ellipse cx={200} cy={312} rx={170} ry={46} fill="#8f969b" />
      <ellipse cx={200} cy={306} rx={170} ry={44} fill={`url(#${id}cromo)`} />
      <ellipse cx={200} cy={302} rx={150} ry={33} fill="#e3e6e8" />
      <ellipse cx={206} cy={306} rx={118} ry={16} fill="#000" opacity={0.1} />
      {/* toalha enrolada */}
      <path d="M92 190 L312 190 A28 56 0 0 1 312 302 L92 302 Z" fill={`url(#${id}pano)`} />
      <path d={listra(254, 268)} fill={C.acento} />
      <path d={listra(278, 285)} fill={C.acento} />
      <path d="M100 290 C160 296 240 296 310 292" stroke="#cdbba7" strokeWidth={3} fill="none" opacity={0.7} />
      <ellipse cx={92} cy={246} rx={28} ry={56} fill="#efe5d9" />
      <path d={espiral(92, 246, 28, 56)} stroke="#c9b5a0" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M92 190 A28 56 0 0 0 92 302" stroke="#d9cab9" strokeWidth={3} fill="none" />
      {vapor}
    </>
  );
};

// ---------- navalha ----------

const LAMINA =
  "M16 -10 C8 -16 -2 -18 -12 -18 L-176 -20 C-190 -20 -196 -10 -196 2 C-196 24 -190 40 -176 44 C-130 48 -80 46 -50 40 C-42 38 -38 30 -36 22 L-24 14 L2 12 C14 12 22 2 16 -10 Z";

const Navalha: Desenho = ({ f, id }) => {
  const ang = anguloNavalha(f);
  const t = ((f % 100) + 100) % 100;
  const brilho = t >= 26 && t < 52 ? -200 + ((t - 26) / 26) * 240 : -400;
  return (
    <>
      <defs>
        <linearGradient id={`${id}aco`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#7f868c" />
          <stop offset={0.18} stopColor="#b9bfc4" />
          <stop offset={0.5} stopColor="#e9ecee" />
          <stop offset={0.85} stopColor="#f8fafb" />
          <stop offset={1} stopColor="#c3c9cd" />
        </linearGradient>
        <linearGradient id={`${id}cabo`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={TARTARUGA_CLARA} />
          <stop offset={0.4} stopColor={TARTARUGA} />
          <stop offset={1} stopColor={TARTARUGA_ESCURA} />
        </linearGradient>
        <clipPath id={`${id}lamina`}>
          <path d={LAMINA} />
        </clipPath>
      </defs>
      <g transform={`translate(${NAVALHA.x} ${NAVALHA.y}) rotate(${NAVALHA.giro}) scale(${NAVALHA.escala})`}>
        {/* lâmina (gira no pino) */}
        <g transform={`rotate(${ang})`}>
          <path d={LAMINA} fill={`url(#${id}aco)`} />
          <path d="M-12 -18 L-176 -20 C-186 -20 -192 -14 -194 -8 L-12 -8 Z" fill="#6f767c" opacity={0.55} />
          <g stroke="#6f767c" strokeWidth={2} strokeLinecap="round">
            <path d="M-2 -16 l0 6 M4 -15 l0 6 M10 -13 l0 6" />
          </g>
          <path d="M-46 26 C-100 30 -150 32 -190 30" stroke={ACO_ESCURO} strokeWidth={3} fill="none" opacity={0.6} />
          <g clipPath={`url(#${id}lamina)`}>
            <path d={`M${brilho} -30 L${brilho + 28} -30 L${brilho + 6} 56 L${brilho - 22} 56 Z`} fill="#fff" opacity={0.85} />
          </g>
        </g>
        {/* cabo */}
        <path d="M-22 -18 C30 -26 140 -26 196 -14 C214 -10 216 14 198 18 C140 26 30 24 -22 18 C-36 14 -36 -14 -22 -18 Z" fill={`url(#${id}cabo)`} />
        <g fill={TARTARUGA_ESCURA} opacity={0.45}>
          <ellipse cx={40} cy={-4} rx={14} ry={5} />
          <ellipse cx={92} cy={6} rx={18} ry={5} />
          <ellipse cx={140} cy={-6} rx={12} ry={4} />
        </g>
        <path d="M-14 -13 C40 -20 140 -20 192 -10" stroke="#f6d39a" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
        <circle cx={0} cy={0} r={9} fill={OURO} />
        <circle cx={0} cy={0} r={3.6} fill={OURO_ESCURO} />
        <circle cx={184} cy={0} r={6.5} fill={OURO} />
        <circle cx={184} cy={0} r={2.6} fill={OURO_ESCURO} />
      </g>
    </>
  );
};

// ---------- máquina ----------

const Maquina: Desenho = ({ f, id }) => {
  const pisca = Math.floor(f / 2) % 2 ? 1 : 0.4;
  const fios = Array.from({ length: 8 }, (_, i) => {
    const ciclo = 22;
    const p = (((f + i * 5) % ciclo) + ciclo) % ciclo / ciclo;
    const x0 = 128 + sorte(i + Math.floor((f + i * 5) / ciclo) * 9) * 144;
    const lado = x0 < 200 ? -1 : 1;
    const x = x0 + lado * (20 + sorte(i + 3) * 40) * p;
    const y = 36 - 60 * p + 70 * p * p;
    return <rect key={i} x={-6} y={-1.6} width={12} height={3.2} rx={1.6} fill={CABELO} opacity={1 - p} transform={`translate(${x} ${y}) rotate(${sorte(i + 7) * 180 + p * 200})`} />;
  });
  return (
    <>
      <defs>
        <Cromo id={`${id}cromo`} />
        <linearGradient id={`${id}ouro`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor={OURO_ESCURO} />
          <stop offset={0.2} stopColor={OURO_CLARO} />
          <stop offset={0.45} stopColor={OURO} />
          <stop offset={1} stopColor="#a87a2c" />
        </linearGradient>
      </defs>
      {/* tremidas dos lados */}
      <g stroke={OURO_ESCURO} strokeWidth={6} strokeLinecap="round" fill="none" opacity={pisca}>
        <path d="M96 52 Q84 76 96 100" />
        <path d="M74 40 Q56 76 74 112" />
        <path d="M304 52 Q316 76 304 100" />
        <path d="M326 40 Q344 76 326 112" />
      </g>
      {/* fio */}
      <path d="M200 356 C200 380 232 384 262 398" stroke={PRETO} strokeWidth={10} strokeLinecap="round" fill="none" />
      <rect x={185} y={336} width={30} height={24} rx={7} fill={PRETO} />
      {/* corpo */}
      <path d="M122 84 L278 84 C290 140 286 200 266 300 C260 330 236 348 200 348 C164 348 140 330 134 300 C114 200 110 140 122 84 Z" fill={`url(#${id}ouro)`} />
      <rect x={124} y={92} width={152} height={8} fill={C.acento} />
      {/* alavanca do pente, do lado */}
      <path d="M126 102 L98 118 C88 124 92 138 104 134 L130 122 Z" fill={PRETO} />
      {/* brilho do metal */}
      <path d="M150 112 C144 170 146 240 158 300" stroke="#fff3cf" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.6} />
      {/* empunhadura com frisos */}
      <g stroke={OURO_ESCURO} strokeWidth={6} strokeLinecap="round" opacity={0.85}>
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M${176 + i * 14} 214 l0 64`} />
        ))}
      </g>
      {/* botão de ligar, do lado */}
      <rect x={252} y={120} width={22} height={50} rx={11} fill={PRETO} />
      <rect x={256} y={124} width={14} height={20} rx={7} fill="#e0734f" />
      {/* lâmina: pente fixo, dentes e lâmina que corre */}
      <rect x={128} y={68} width={144} height={16} rx={3} fill={ACO_ESCURO} />
      <rect x={116} y={50} width={168} height={20} rx={5} fill={`url(#${id}cromo)`} />
      {Array.from({ length: 17 }, (_, i) => (
        <rect key={i} x={120 + i * 9.6} y={34} width={5.6} height={20} rx={2} fill={ACO} />
      ))}
      <circle cx={150} cy={60} r={4} fill="#6f767c" />
      <circle cx={250} cy={60} r={4} fill="#6f767c" />
      {fios}
    </>
  );
};

// ---------- tesoura ----------

function MetadeTesoura({ id, apoio }: { id: string; apoio?: boolean }) {
  return (
    <>
      {/* argola e haste */}
      <path d="M2 4 C-2 28 -18 46 -36 62" stroke={OURO} strokeWidth={20} strokeLinecap="round" fill="none" />
      <circle cx={-56} cy={96} r={36} fill="none" stroke={OURO} strokeWidth={15} />
      <circle cx={-56} cy={96} r={29} fill="none" stroke={OURO_ESCURO} strokeWidth={3} opacity={0.5} />
      <path d="M-84 82 A32 32 0 0 1 -60 62" stroke={OURO_CLARO} strokeWidth={4} strokeLinecap="round" fill="none" />
      {apoio && <path d="M-40 130 C-30 152 -8 162 10 156" stroke={OURO} strokeWidth={9} strokeLinecap="round" fill="none" />}
      {/* lâmina */}
      <path d="M-3 -4 L0 -186 C10 -170 22 -110 24 -40 C25 -20 20 -4 12 8 Z" fill={`url(#${id}aco)`} />
      <path d="M0 -186 L-3 -4 L3 -4 L4 -176 Z" fill="#fff" opacity={0.7} />
    </>
  );
}

const Tesoura: Desenho = ({ f, id }) => {
  const ang = anguloTesoura(f);
  // cabelo que cai a cada corte
  const fios: React.ReactNode[] = [];
  if (f >= TESOURA.fecha) {
    const k = Math.floor((f - TESOURA.fecha) / TESOURA.ciclo);
    for (const j of [k - 1, k]) {
      if (j < 0) continue;
      const idade = f - (TESOURA.fecha + j * TESOURA.ciclo);
      if (idade > 40) continue;
      for (let i = 0; i < 5; i++) {
        const n = j * 11 + i;
        const x = 172 + (sorte(n) - 0.5) * 50 + (sorte(n + 1) - 0.5) * idade * 1.4;
        const y = 92 + idade * (1 + sorte(n + 2) * 1.5) + 0.12 * idade * idade;
        fios.push(<rect key={n} x={-7} y={-1.8} width={14} height={3.6} rx={1.8} fill={CABELO} opacity={1 - idade / 40} transform={`translate(${x} ${y}) rotate(${sorte(n + 3) * 180 + idade * 6})`} />);
      }
    }
  }
  return (
    <>
      <defs>
        <linearGradient id={`${id}aco`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#f4f6f7" />
          <stop offset={0.4} stopColor={ACO} />
          <stop offset={1} stopColor="#868d93" />
        </linearGradient>
      </defs>
      <g transform={`translate(${TESOURA_POS.x} ${TESOURA_POS.y}) rotate(${TESOURA_POS.giro})`}>
        <g transform={`scale(-1 1) rotate(${ang})`}>
          <MetadeTesoura id={id} apoio />
        </g>
        <g transform={`rotate(${ang})`}>
          <MetadeTesoura id={id} />
        </g>
        <circle cx={0} cy={0} r={11} fill="#5a5f63" />
        <circle cx={0} cy={0} r={11} fill="none" stroke={ACO} strokeWidth={2.5} />
        <path d="M-6 -3 L6 3" stroke={ACO} strokeWidth={3} strokeLinecap="round" />
      </g>
      {fios}
    </>
  );
};

// ---------- pente ----------

const Pente: Desenho = () => {
  const dentes: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) dentes.push(<rect key={`f${i}`} x={44 + i * 13} y={176} width={8} height={98} rx={4} />);
  for (let i = 0; i < 8; i++) dentes.push(<rect key={`g${i}`} x={208 + i * 19.4} y={176} width={12} height={98} rx={5} />);
  return (
    <g transform="rotate(-9 200 204)">
      <g fill={TARTARUGA}>
        <rect x={32} y={176} width={12} height={98} rx={5} />
        {dentes}
      </g>
      <g fill={TARTARUGA_ESCURA} opacity={0.35}>
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} x={i < 12 ? 49 + i * 13 : 216 + (i - 12) * 19.4} y={182} width={i < 12 ? 3 : 4} height={88} rx={1.5} />
        ))}
      </g>
      <rect x={32} y={130} width={336} height={58} rx={18} fill={TARTARUGA} />
      <g fill={TARTARUGA_ESCURA} opacity={0.5}>
        {[[70, 160, 18, 7], [120, 150, 12, 5], [168, 166, 20, 6], [228, 152, 14, 6], [280, 168, 18, 6], [330, 154, 12, 5]].map(([x, y, rx, ry], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(-12 ${x} ${y})`} />
        ))}
      </g>
      <rect x={46} y={138} width={308} height={7} rx={3.5} fill={TARTARUGA_CLARA} opacity={0.9} />
      <rect x={32} y={178} width={336} height={10} fill={TARTARUGA_ESCURA} opacity={0.35} />
    </g>
  );
};

// ---------- cadeira antiga ----------

const CadeiraAntiga: Desenho = ({ id }) => (
  <>
    <defs>
      <Cromo id={`${id}cromo`} />
    </defs>
    {/* pé de louça e aro cromado */}
    <path d="M118 358 C118 334 156 322 210 322 C264 322 302 334 302 358 Z" fill={LOUCA} />
    <path d="M232 323 C270 328 302 338 302 358 L248 358 C248 342 242 330 232 323 Z" fill={LOUCA_SOMBRA} />
    <rect x={110} y={352} width={200} height={14} rx={7} fill={`url(#${id}cromo)`} />
    {/* coluna e pedal da bomba */}
    <rect x={192} y={262} width={36} height={64} fill={`url(#${id}cromo)`} />
    <rect x={184} y={262} width={52} height={10} rx={4} fill={`url(#${id}cromo)`} />
    <path d="M226 304 L270 320" stroke={ACO_ESCURO} strokeWidth={8} strokeLinecap="round" />
    <rect x={262} y={314} width={30} height={12} rx={5} fill={PRETO} transform="rotate(20 277 320)" />
    {/* apoio dos pés */}
    <path d="M124 262 L80 324" stroke="#aeb4b9" strokeWidth={10} strokeLinecap="round" />
    <rect x={40} y={320} width={80} height={14} rx={5} fill={`url(#${id}cromo)`} />
    <path d="M52 327 L108 327" stroke="#7f868c" strokeWidth={2} strokeDasharray="6 5" />
    {/* encosto (reclinado) e apoio da cabeça */}
    <g transform="rotate(10 268 236)">
      <rect x={266} y={40} width={10} height={44} fill={`url(#${id}cromo)`} />
      <rect x={242} y={22} width={58} height={28} rx={14} fill={COURO} />
      <rect x={250} y={27} width={40} height={6} rx={3} fill={COURO_CLARO} />
      <rect x={236} y={72} width={68} height={176} rx={26} fill={COURO} />
      <rect x={247} y={86} width={46} height={146} rx={18} fill={COURO_ESCURO} />
      <g fill="#4e1813">
        {[[260, 116], [280, 116], [260, 158], [280, 158], [260, 200], [280, 200]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} />
        ))}
      </g>
      <path d="M242 96 L242 226" stroke={COURO_CLARO} strokeWidth={5} strokeLinecap="round" />
    </g>
    {/* assento */}
    <rect x={106} y={254} width={190} height={14} rx={7} fill={`url(#${id}cromo)`} />
    <rect x={98} y={212} width={200} height={48} rx={22} fill={COURO} />
    <rect x={114} y={219} width={150} height={8} rx={4} fill={COURO_CLARO} />
    {/* braço de louça com pé cromado */}
    <path d="M124 196 C118 210 120 222 130 226" stroke="#aeb4b9" strokeWidth={9} strokeLinecap="round" fill="none" />
    <rect x={100} y={178} width={176} height={22} rx={11} fill={LOUCA} />
    <rect x={106} y={192} width={164} height={8} rx={4} fill={LOUCA_SOMBRA} />
    <rect x={112} y={182} width={120} height={5} rx={2.5} fill="#fff" opacity={0.9} />
  </>
);

// ---------- pincel de barba ----------

const ESPUMA: [number, number, number][] = [
  [148, 120, 20],
  [254, 118, 20],
  [168, 98, 30],
  [234, 96, 30],
  [200, 84, 36],
  [182, 62, 22],
  [220, 64, 20],
];

const Pincel: Desenho = ({ f, id }) => {
  const bolhas = Array.from({ length: 7 }, (_, i) => {
    const ciclo = 54;
    const p = (((f + i * 8) % ciclo) + ciclo) % ciclo / ciclo;
    const volta = Math.floor((f + i * 8) / ciclo);
    const x = 150 + sorte(i * 13 + volta) * 100 + Math.sin(f / 10 + i) * 8;
    const y = 70 - p * 74;
    const r = 5 + sorte(i * 7 + volta) * 7;
    const op = p < 0.15 ? p / 0.15 : 1 - Math.max(0, (p - 0.75) / 0.25);
    return (
      <g key={i} opacity={op}>
        <circle cx={x} cy={y} r={r} fill="#fff" fillOpacity={0.55} stroke="#c3b8ab" strokeWidth={2} />
        <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#fff" />
      </g>
    );
  });
  const raio = (i: number, r: number) => r * (1 + 0.05 * Math.sin(f / 8 + i * 1.7));
  return (
    <>
      <defs>
        <Cromo id={`${id}cromo`} />
        <linearGradient id={`${id}cabo`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#6b3f22" />
          <stop offset={0.28} stopColor="#b07a4c" />
          <stop offset={0.6} stopColor="#8a5a35" />
          <stop offset={1} stopColor="#5e3720" />
        </linearGradient>
        <linearGradient id={`${id}pelo`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor="#f4efe8" />
          <stop offset={0.32} stopColor="#cfc3b5" />
          <stop offset={0.55} stopColor="#4a3a30" />
          <stop offset={0.78} stopColor="#7a6656" />
          <stop offset={1} stopColor="#3a2e26" />
        </linearGradient>
      </defs>
      {/* cabo de madeira */}
      <path d="M162 258 C166 280 178 292 178 306 C178 322 156 330 152 350 C150 362 162 370 200 370 C238 370 250 362 248 350 C244 330 222 322 222 306 C222 292 234 280 238 258 Z" fill={`url(#${id}cabo)`} />
      <path d="M180 312 C190 316 210 316 220 312" stroke={C.acento} strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* aro de metal */}
      <rect x={156} y={232} width={88} height={30} rx={8} fill={`url(#${id}cromo)`} />
      <rect x={156} y={244} width={88} height={4} fill="#7f868c" opacity={0.6} />
      {/* pelos */}
      <path d="M164 236 C138 196 128 146 152 112 C172 86 228 86 248 112 C272 146 262 196 236 236 Z" fill={`url(#${id}pelo)`} />
      <g stroke="#2e241d" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.35}>
        <path d="M176 230 C164 196 160 170 164 146" />
        <path d="M200 232 C198 200 198 170 200 140" />
        <path d="M224 230 C236 196 240 170 236 146" />
      </g>
      {/* espuma */}
      <g fill="#d6cdc2">
        {ESPUMA.map(([x, y, r], i) => (
          <circle key={i} cx={x + 2} cy={y + 6} r={raio(i, r)} />
        ))}
      </g>
      <path d="M252 126 C262 140 262 156 256 162 C250 168 242 160 246 146 C248 138 250 132 252 126 Z" fill="#fff" />
      <g fill="#ffffff">
        {ESPUMA.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={raio(i, r)} />
        ))}
      </g>
      <g fill="#ece6de">
        <circle cx={214} cy={100} r={9} />
        <circle cx={176} cy={110} r={7} />
      </g>
      <circle cx={190} cy={70} r={7} fill="#fff" stroke="#e2dbd2" strokeWidth={2} />
      {bolhas}
    </>
  );
};

// ---------- pomada ----------

const Pomada: Desenho = ({ f, id }) => {
  const tampa = Math.sin(f / 14) * 8 - 4;
  return (
    <>
      <defs>
        <linearGradient id={`${id}lata`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor="#cdbfaa" />
          <stop offset={0.24} stopColor="#f8f2e8" />
          <stop offset={0.6} stopColor="#ece2d3" />
          <stop offset={1} stopColor="#c4b39b" />
        </linearGradient>
        <linearGradient id={`${id}ouro`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset={0} stopColor={OURO_ESCURO} />
          <stop offset={0.25} stopColor={OURO_CLARO} />
          <stop offset={0.55} stopColor={OURO} />
          <stop offset={1} stopColor="#a87a2c" />
        </linearGradient>
      </defs>
      {/* lata */}
      <path d="M76 246 L76 322 A124 36 0 0 0 324 322 L324 246 Z" fill={`url(#${id}lata)`} />
      <path d="M76 262 A124 36 0 0 0 324 262 L324 306 A124 36 0 0 1 76 306 Z" fill={C.acento} />
      <path d="M76 304 A124 36 0 0 0 324 304" stroke={C.acentoForte} strokeWidth={4} fill="none" />
      <text x={200} y={330} textAnchor="middle" fontFamily={F.sans} fontWeight={800} fontSize={27} letterSpacing={5} fill="#f8f2e8">
        POMADA
      </text>
      <ellipse cx={200} cy={246} rx={124} ry={36} fill="#b59b78" />
      <ellipse cx={200} cy={252} rx={114} ry={29} fill="#d4a86e" />
      <g stroke="#ecc994" strokeWidth={6} strokeLinecap="round" fill="none">
        <path d="M128 250 C160 238 228 236 262 246" />
        <path d="M152 262 C184 254 218 256 240 264" />
      </g>
      <ellipse cx={234} cy={250} rx={22} ry={8} fill="#b98a52" />
      <ellipse cx={200} cy={246} rx={124} ry={36} fill="none" stroke={OURO} strokeWidth={6} />
      {/* tampa flutuando por cima */}
      <g transform={`translate(0 ${tampa}) rotate(-12 200 116)`}>
        <path d="M74 104 L74 128 A126 36 0 0 0 326 128 L326 104 Z" fill={`url(#${id}ouro)`} />
        <ellipse cx={200} cy={104} rx={126} ry={36} fill={OURO} />
        <ellipse cx={200} cy={102} rx={110} ry={29} fill={OURO_CLARO} opacity={0.55} />
        <ellipse cx={200} cy={104} rx={74} ry={19} fill="none" stroke={OURO_ESCURO} strokeWidth={4} />
        <path d="M200 90 C202 99 204 101 213 104 C204 107 202 109 200 118 C198 109 196 107 187 104 C196 101 198 99 200 90 Z" fill={OURO_ESCURO} />
      </g>
    </>
  );
};

const DESENHOS: Record<Objeto2D, Desenho> = {
  poste: Poste,
  toalha: Toalha,
  navalha: Navalha,
  maquina: Maquina,
  tesoura: Tesoura,
  pente: Pente,
  cadeiraAntiga: CadeiraAntiga,
  pincel: Pincel,
  pomada: Pomada,
};

/** Um objeto de barbearia animado, num quadrado de `tamanho` px (o desenho cabe no quadro de 400 × 400). */
export function Objeto({ nome, f, tamanho, variante }: { nome: Objeto2D; f: number; tamanho: number; variante?: VarianteObjeto }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const m = movimento(nome, f);
  const Desenho = DESENHOS[nome];
  const [sy, sx] = SOMBRA[nome];
  // a sombra encolhe quando o objeto sobe
  const sombra = 1 + Math.min(0, m.dy) / 80 + Math.max(0, m.dy) / 160;
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 400 400" style={{ overflow: "visible", display: "block" }}>
      <ellipse cx={200} cy={sy} rx={sx * sombra} ry={11 * sombra} fill="#000" opacity={0.12} />
      <g transform={`translate(${m.dx} ${m.dy}) rotate(${m.giro} 200 200)`}>
        <Desenho f={f} id={id} variante={variante} />
      </g>
    </svg>
  );
}
