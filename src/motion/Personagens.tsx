import React, { useId } from "react";

/**
 * Cabeças dos personagens em vetor (cores do Fio), num quadro de 300 × 360.
 * Expressões trocam por props (olhos, boca, sobrancelha), para cada cena "atuar" no tempo da voz.
 */

export type Boca = "neutra" | "sorriso" | "aberta" | "torta";
/** cortes que a cena "corte" mostra (trocam o cabelo da pessoa enquanto valem) */
export type Corte = "degrade-baixo" | "degrade-medio" | "degrade-alto" | "social" | "navalhado" | "topete" | "risco" | "pezinho";
export type PropsCabeca = {
  pele: string;
  sombra: string;
  cabelo: "curto" | "baguncado" | "bone" | "calvo" | "longo";
  /** corte de barbearia no lugar do cabelo de sempre */
  corte?: Corte;
  /** de costas mostra a nuca (o "pezinho") */
  vista?: "frente" | "costas";
  /** cílios (Bia) */
  cilios?: boolean;
  /** sardas (Davi) */
  sardas?: boolean;
  /** rugas na testa e nos olhos (Zé) */
  rugas?: boolean;
  /** cor do boné (cabelo "bone") */
  corBone?: string;
  bigode?: string;
  oculos?: boolean;
  corCabelo: string;
  barba?: string;
  olhos?: "abertos" | "fechados";
  /** para onde olha, em px (x, y) */
  olhar?: [number, number];
  /** 0 = aberto, 1 = piscando */
  piscar?: number;
  boca?: Boca;
  /** sobe as sobrancelhas (px) */
  sobrancelha?: number;
  /** 0 a 1: o quanto o cabelo está bagunçado */
  caos?: number;
  /** quadro, para o cabelo mexer */
  t?: number;
};

const LABIO = "#4a2a20";

function Espinhos({ caos, t, cor }: { caos: number; t: number; cor: string }) {
  const cx = 150;
  const cy = 165;
  const r = 108;
  const caminhos = Array.from({ length: 11 }, (_, i) => {
    const ang = Math.PI * (1.08 + i * 0.084);
    const tam = 20 + caos * (40 + 22 * Math.sin(i * 1.7));
    const torto = caos * 0.28 * Math.sin(i * 2.3 + t * 0.18);
    const p = (a: number, raio: number) => `${(cx + raio * Math.cos(a)).toFixed(1)} ${(cy + raio * Math.sin(a)).toFixed(1)}`;
    return `M${p(ang - 0.11, r)} L${p(ang + torto, r + tam)} L${p(ang + 0.11, r)} Z`;
  });
  return (
    <g fill={cor}>
      {caminhos.map((d, i) => (
        <path key={i} d={d} strokeLinejoin="round" stroke={cor} strokeWidth={6} />
      ))}
    </g>
  );
}

/** mistura duas cores #rrggbb (t = 0 fica na primeira) */
function tom(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
}
const claro = (cor: string) => [1, 3, 5].reduce((s, i) => s + parseInt(cor.slice(i, i + 2), 16), 0) > 560;
/** cor dos fios desenhados por cima do cabelo (mais clara no cabelo escuro, mais escura no branco) */
const fios = (cor: string) => (claro(cor) ? tom(cor, "#000000", 0.16) : tom(cor, "#ffffff", 0.2));

// ---------- cortes (vista de frente) ----------

/** couro cabeludo: aparece onde o corte raspa (desenhado antes do rosto) */
const CRANIO = "M42 186 C34 112 82 46 150 44 C218 46 266 112 258 186 Z";
/** laterais e costeletas de um corte curto, do topo até em cima da orelha */
const LATERAIS =
  "M66 214 L77 214 C77 186 79 156 86 128 C102 106 124 99 150 98 C176 99 198 106 214 128 C221 156 223 186 223 214 L234 214 C236 198 238 188 240 182 C250 180 258 178 262 174 C268 112 236 40 150 38 C64 40 32 112 38 174 C42 178 50 180 60 182 C62 188 64 198 66 214 Z";
/** em cima, desfiado na franja (degradês e risco) */
const TOPO_DESFIADO =
  "M64 124 C58 66 98 20 150 18 C202 20 242 66 236 124 C228 112 216 104 204 100 L192 108 L180 98 L166 106 L150 96 L134 106 L120 98 L108 108 L96 100 C84 104 72 112 64 124 Z";
/** em cima, penteado para trás (navalhado) */
const TOPO_PENTEADO = "M76 120 C64 58 104 2 158 0 C208 2 240 56 226 120 C220 104 208 96 194 94 C176 90 158 92 142 96 C122 90 102 94 90 102 C84 106 79 112 76 120 Z";
/** em cima, baixo e alinhado, com risca do lado (social) */
const TOPO_SOCIAL = "M54 158 C44 76 94 30 150 28 C206 30 256 76 246 158 C238 126 226 108 206 102 C180 95 120 95 94 102 C74 108 62 126 54 158 Z";
/** topete: volume em cima, jogado para a frente e para o lado */
const TOPO_TOPETE =
  "M66 124 C56 70 74 26 112 4 C142 -12 200 -20 236 -2 C258 10 258 34 238 40 C248 62 244 92 234 122 C226 110 216 103 202 100 C176 95 124 95 98 100 C84 103 74 110 66 124 Z";

/** de onde até onde (y) o cabelo das laterais some (risco, topete e social; os degradês usam NIVEL_DEGRADE) */
const DEGRADE: Partial<Record<Corte, [number, number]>> = {
  risco: [140, 198],
  topete: [140, 200],
  social: [200, 218],
};

/**
 * Degradês: até onde (y) o cabelo da lateral vai cheio. Daí para baixo fica só a sombra do cabelo raspado,
 * com uma linha nítida na divisa, para os três se distinguirem de longe:
 * baixo = só em cima da orelha, médio = no meio da têmpora, alto = quase no alto da cabeça.
 */
export const NIVEL_DEGRADE: Partial<Record<Corte, number>> = { "degrade-baixo": 170, "degrade-medio": 138, "degrade-alto": 100 };
/** topo do cabelo encolhido no degradê alto, para a lateral raspada subir de verdade (as pontas descem só até y ~104) */
const TOPO_ALTO = "translate(150 18) scale(1 0.81) translate(-150 -18)";

/** lateral de um degradê: cabelo cheio até `nivel`, divisa nítida e a sombra do raspado (cor do cabelo bem fraca) até a orelha */
function LateralDegrade({ nivel, cor, id }: { nivel: number; cor: string; id: string }) {
  const y0 = 30;
  const y1 = 216;
  const o = (y: number) => (y - y0) / (y1 - y0);
  return (
    <>
      <defs>
        <linearGradient id={`${id}nv`} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          <stop offset={0} stopColor={cor} stopOpacity={1} />
          <stop offset={o(nivel - 6)} stopColor={cor} stopOpacity={1} />
          <stop offset={o(nivel + 2)} stopColor={cor} stopOpacity={0.36} />
          <stop offset={o(Math.min(y1 - 6, nivel + 40))} stopColor={cor} stopOpacity={0.2} />
          <stop offset={1} stopColor={cor} stopOpacity={0.06} />
        </linearGradient>
        <clipPath id={`${id}lat`}>
          <path d={LATERAIS} />
        </clipPath>
      </defs>
      <path d={LATERAIS} fill={`url(#${id}nv)`} />
      {/* a divisa: onde o cabelo cheio encontra o raspado */}
      <g clipPath={`url(#${id}lat)`}>
        <rect x={0} y={nivel - 1.5} width={300} height={4} fill={tom(cor, "#000000", 0.35)} opacity={0.6} />
      </g>
    </>
  );
}

function CorteFrente({ corte, cor, pele, id }: { corte: Corte; cor: string; pele: string; id: string }) {
  const faixa = DEGRADE[corte];
  const nivel = NIVEL_DEGRADE[corte];
  const f = fios(cor);
  const traco = { stroke: f, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  return (
    <>
      {faixa && (
        <>
          <defs>
            <linearGradient id={`${id}dg`} gradientUnits="userSpaceOnUse" x1={0} y1={faixa[0]} x2={0} y2={faixa[1]}>
              <stop offset={0} stopColor={cor} stopOpacity={1} />
              <stop offset={0.35} stopColor={cor} stopOpacity={0.72} />
              <stop offset={0.7} stopColor={cor} stopOpacity={0.3} />
              <stop offset={1} stopColor={cor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={LATERAIS} fill={`url(#${id}dg)`} />
        </>
      )}
      {nivel !== undefined && <LateralDegrade nivel={nivel} cor={cor} id={id} />}
      {corte === "navalhado" && (
        <>
          {/* laterais raspadas na navalha: só a pele, com brilho */}
          <ellipse cx={56} cy={146} rx={5} ry={18} fill="#fff" opacity={0.24} transform="rotate(14 56 146)" />
          <ellipse cx={244} cy={146} rx={5} ry={18} fill="#fff" opacity={0.24} transform="rotate(-14 244 146)" />
          <path d={TOPO_PENTEADO} fill="#000" opacity={0.12} transform="translate(0 5)" />
          <path d={TOPO_PENTEADO} fill={cor} />
          <path d="M96 100 C92 72 108 40 146 22 M124 94 C126 66 146 42 184 30 M160 92 C166 70 186 52 216 52 M196 96 C204 84 214 76 226 74" {...traco} opacity={0.8} />
        </>
      )}
      {(corte === "degrade-baixo" || corte === "degrade-medio" || corte === "degrade-alto" || corte === "risco") && (
        <g transform={corte === "degrade-alto" ? TOPO_ALTO : undefined}>
          <path d={TOPO_DESFIADO} fill={cor} />
          <path d="M100 82 L118 60 M132 76 L148 50 M166 78 L180 54 M196 84 L210 64 M120 44 L136 30 M164 40 L178 30" {...traco} opacity={0.75} />
        </g>
      )}
      {corte === "risco" && <path d="M70 122 C72 100 84 74 106 52" stroke={pele} strokeWidth={6.5} strokeLinecap="round" fill="none" />}
      {corte === "social" && (
        <>
          <path d={TOPO_SOCIAL} fill={cor} />
          {/* risca do lado e o cabelo penteado para o outro */}
          <path d="M104 32 C98 56 94 80 92 102" stroke={pele} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.85} />
          <path d="M108 52 C146 40 196 50 228 92 M104 76 C148 62 196 74 232 118 M120 36 C156 30 196 40 220 62" {...traco} opacity={0.7} />
        </>
      )}
      {corte === "topete" && (
        <>
          <path d={TOPO_TOPETE} fill={cor} />
          <path d="M90 76 C100 36 150 8 222 8 M108 90 C120 56 160 32 220 32 M78 104 C82 70 110 40 150 26" {...traco} opacity={0.8} />
        </>
      )}
    </>
  );
}

// ---------- de costas (nuca) ----------

/** de costas: o cabelo crescido, sem acabamento na nuca */
const NUCA_CRESCIDA =
  "M40 190 C28 110 80 36 150 34 C220 36 272 110 260 190 C260 226 246 254 226 270 L222 296 L212 282 L204 306 L194 290 L184 312 L174 294 L164 316 L154 298 L144 318 L134 296 L124 314 L114 292 L104 308 L96 290 L78 270 C54 254 40 226 40 190 Z";
/** pezinho feito: linha reta e limpa na nuca, contornando as orelhas */
const NUCA_PEZINHO =
  "M42 184 C30 108 80 36 150 34 C220 36 270 108 258 184 C258 214 244 236 222 252 C210 260 202 268 200 280 L100 280 C98 268 90 260 78 252 C56 236 42 214 42 184 Z";
/** parte de trás da cabeça, afinando até o pescoço */
const CRANIO_COSTAS = "M46 182 C46 100 92 50 150 50 C208 50 254 100 254 182 C254 236 228 262 200 274 L100 274 C72 262 46 236 46 182 Z";

function Costas(p: PropsCabeca & { id: string }) {
  const pezinho = p.corte === "pezinho";
  const f = fios(p.corCabelo);
  return (
    <g>
      {/* pescoço */}
      <rect x={100} y={240} width={100} height={130} rx={30} fill={p.pele} />
      <path d="M150 300 L150 372" stroke={p.sombra} strokeWidth={6} strokeLinecap="round" opacity={0.45} />
      {/* orelhas (por trás) */}
      <ellipse cx={44} cy={198} rx={20} ry={31} fill={p.pele} />
      <ellipse cx={256} cy={198} rx={20} ry={31} fill={p.pele} />
      <ellipse cx={56} cy={202} rx={8} ry={18} fill={p.sombra} />
      <ellipse cx={244} cy={202} rx={8} ry={18} fill={p.sombra} />
      {/* parte de trás da cabeça */}
      <path d={CRANIO_COSTAS} fill={p.pele} />
      {pezinho ? (
        <>
          <defs>
            <linearGradient id={`${p.id}nc`} gradientUnits="userSpaceOnUse" x1={0} y1={226} x2={0} y2={280}>
              <stop offset={0} stopColor={p.corCabelo} stopOpacity={1} />
              <stop offset={1} stopColor={p.corCabelo} stopOpacity={0.72} />
            </linearGradient>
          </defs>
          <path d={NUCA_PEZINHO} fill={`url(#${p.id}nc)`} />
          {/* a linha do acabamento */}
          <path d="M100 282 L200 282" stroke={p.sombra} strokeWidth={3} opacity={0.5} />
        </>
      ) : (
        <path d={NUCA_CRESCIDA} fill={p.corCabelo} />
      )}
      {/* redemoinho */}
      <path d="M150 98 m-12 0 a12 12 0 1 1 12 12 a22 22 0 0 1 -24 -16" stroke={f} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
    </g>
  );
}

// ---------- cabelo longo (Bia) ----------

/** atrás do rosto: desce até os ombros dos dois lados, deixando o pescoço à mostra */
const LONGO_ATRAS =
  "M30 190 C20 92 80 26 150 26 C220 26 280 92 270 190 C268 250 276 310 292 362 C284 376 270 380 258 372 C250 386 232 390 222 376 C214 342 210 314 200 294 L100 294 C90 314 86 342 78 376 C68 390 50 386 42 372 C30 380 16 376 8 362 C24 310 32 250 30 190 Z";
/** franja jogada para o lado, a partir de uma risca à esquerda */
const LONGO_FRENTE =
  "M112 34 C80 42 52 74 46 124 C40 170 40 232 46 292 C50 320 72 324 76 302 C68 252 66 200 72 160 C78 128 92 100 112 80 C134 98 162 106 190 112 C210 120 224 138 228 162 C236 202 234 252 228 302 C232 326 254 322 256 296 C262 236 262 170 254 122 C238 58 176 26 112 34 Z";

export function Cabeca(p: PropsCabeca) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (p.vista === "costas") return <Costas {...p} id={id} />;
  const longo = p.cabelo === "longo" && !p.corte;
  const [ox, oy] = p.olhar ?? [0, 0];
  const piscar = p.piscar ?? 0;
  const sob = p.sobrancelha ?? 0;
  const fechados = p.olhos === "fechados";
  const boca = p.boca ?? "neutra";
  return (
    <g>
      {longo && <path d={LONGO_ATRAS} fill={p.corCabelo} />}
      {/* orelhas (o cabelo longo cobre) */}
      {!longo && (
        <>
          <ellipse cx={46} cy={198} rx={21} ry={31} fill={p.pele} />
          <ellipse cx={254} cy={198} rx={21} ry={31} fill={p.pele} />
          <ellipse cx={48} cy={200} rx={9} ry={15} fill={p.sombra} />
          <ellipse cx={252} cy={200} rx={9} ry={15} fill={p.sombra} />
        </>
      )}
      {p.corte && <path d={CRANIO} fill={p.pele} />}
      {/* rosto */}
      <ellipse cx={150} cy={190} rx={106} ry={128} fill={p.pele} />
      {p.rugas && (
        <g stroke={p.sombra} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.6}>
          <path d="M106 130 Q150 120 194 130" />
          <path d="M118 116 Q150 108 182 116" />
          <path d="M74 184 l-10 -5 M74 196 l-11 2 M226 184 l10 -5 M226 196 l11 2" />
          <path d="M108 238 Q98 258 110 274 M192 238 Q202 258 190 274" />
        </g>
      )}
      {p.sardas && (
        <g fill={p.sombra} opacity={0.75}>
          {[[98, 226], [112, 234], [90, 238], [104, 244], [202, 226], [188, 234], [210, 238], [196, 244]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3.4} />
          ))}
        </g>
      )}
      {/* cabelo */}
      {p.corte && <CorteFrente corte={p.corte} cor={p.corCabelo} pele={p.pele} id={id} />}
      {longo && <path d={LONGO_FRENTE} fill={p.corCabelo} />}
      {longo && <path d="M126 46 C172 42 214 66 234 116 M140 70 C178 74 210 92 226 124 M100 50 C78 72 64 104 60 152 M244 160 C250 210 248 250 242 290 M56 180 C54 220 56 256 60 290" stroke={fios(p.corCabelo)} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />}
      {!p.corte && p.cabelo === "curto" && (
        <path d="M46 182 C38 78 96 36 150 36 C204 36 262 78 254 182 C248 140 232 112 208 104 C178 95 122 95 92 104 C68 112 52 140 46 182 Z" fill={p.corCabelo} />
      )}
      {!p.corte && p.cabelo === "baguncado" && (
        <>
          <Espinhos caos={p.caos ?? 0} t={p.t ?? 0} cor={p.corCabelo} />
          <path d="M44 186 C36 74 96 30 150 30 C204 30 264 74 256 186 C250 136 232 110 206 102 C176 92 124 92 94 102 C68 110 50 136 44 186 Z" fill={p.corCabelo} />
        </>
      )}
      {!p.corte && p.cabelo === "calvo" && (
        <>
          <path d="M46 200 C40 160 44 132 58 112 C70 140 66 170 70 206 Z" fill={p.corCabelo} />
          <path d="M254 200 C260 160 256 132 242 112 C230 140 234 170 230 206 Z" fill={p.corCabelo} />
          <ellipse cx={118} cy={92} rx={26} ry={12} fill="#fff" opacity={0.18} transform="rotate(-20 118 92)" />
        </>
      )}
      {!p.corte && p.cabelo === "bone" && (
        <>
          <path d="M48 190 C44 160 50 140 62 128 L238 128 C250 140 256 160 252 190 C246 160 236 146 220 140 L80 140 C64 146 54 160 48 190 Z" fill={p.corCabelo} />
          <path d="M50 142 C46 64 100 26 150 26 C200 26 254 64 250 142 Z" fill={p.corBone ?? "#b0513a"} />
          <path d="M150 26 L150 142" stroke="rgba(0,0,0,0.15)" strokeWidth={4} />
          <circle cx={150} cy={30} r={8} fill={p.corBone ?? "#b0513a"} stroke="rgba(0,0,0,0.2)" strokeWidth={3} />
          <path d="M42 136 C80 124 220 124 258 136 C266 150 250 160 236 156 C200 146 100 146 64 156 C50 160 34 150 42 136 Z" fill="#1f1b17" opacity={0.9} />
        </>
      )}
      {/* barba */}
      {p.barba && (
        <>
          <path d="M50 196 C52 290 100 326 150 326 C200 326 248 290 250 196 C242 240 226 254 210 258 C190 240 110 240 90 258 C74 254 58 240 50 196 Z" fill={p.barba} />
          <path d="M106 250 C120 234 140 238 150 245 C160 238 180 234 194 250 C178 255 160 254 150 250 C140 254 122 255 106 250 Z" fill={p.barba} />
        </>
      )}
      {p.bigode && <path d="M100 252 C116 232 138 236 150 246 C162 236 184 232 200 252 C182 262 164 258 150 252 C136 258 118 262 100 252 Z" fill={p.bigode} />}
      {/* bochechas */}
      <circle cx={92} cy={244} r={17} fill="#e0734f" opacity={0.22} />
      <circle cx={208} cy={244} r={17} fill="#e0734f" opacity={0.22} />
      {/* sobrancelhas */}
      <g transform={`translate(0 ${-sob})`} stroke={p.corCabelo} strokeWidth={10} strokeLinecap="round" fill="none">
        <path d="M86 160 Q108 148 130 157" />
        <path d="M170 157 Q192 148 214 160" />
      </g>
      {/* olhos */}
      {fechados ? (
        <g stroke={LABIO} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M94 196 Q110 206 126 196" />
          <path d="M174 196 Q190 206 206 196" />
        </g>
      ) : (
        <g fill="#1f1612">
          <ellipse cx={110 + ox} cy={194 + oy} rx={11} ry={Math.max(1.5, 13 * (1 - piscar))} />
          <ellipse cx={190 + ox} cy={194 + oy} rx={11} ry={Math.max(1.5, 13 * (1 - piscar))} />
          <circle cx={113 + ox} cy={190 + oy} r={3.2} fill="#fff" opacity={piscar > 0.5 ? 0 : 0.85} />
          <circle cx={193 + ox} cy={190 + oy} r={3.2} fill="#fff" opacity={piscar > 0.5 ? 0 : 0.85} />
        </g>
      )}
      {p.cilios && !fechados && piscar < 0.5 && (
        <g stroke="#1f1612" strokeWidth={4.5} strokeLinecap="round" fill="none">
          <path d={`M${100 + ox} ${186 + oy} l-10 -7 M${104 + ox} ${182 + oy} l-6 -9`} />
          <path d={`M${200 + ox} ${186 + oy} l10 -7 M${196 + ox} ${182 + oy} l6 -9`} />
        </g>
      )}
      {p.oculos && (
        <g stroke="#2a211b" strokeWidth={6} fill="rgba(255,255,255,0.12)">
          <rect x={78} y={168} width={64} height={52} rx={18} />
          <rect x={158} y={168} width={64} height={52} rx={18} />
          <path d="M142 186 Q150 180 158 186" fill="none" />
        </g>
      )}
      {/* nariz */}
      <path d="M150 204 Q138 236 153 240" stroke={p.sombra} strokeWidth={6} strokeLinecap="round" fill="none" />
      {/* boca */}
      {boca === "sorriso" && <path d="M120 270 Q150 296 180 270" stroke={p.barba ? "#f0d9c8" : LABIO} strokeWidth={7} strokeLinecap="round" fill="none" />}
      {boca === "neutra" && <path d="M130 274 Q150 279 170 274" stroke={p.barba ? "#f0d9c8" : LABIO} strokeWidth={7} strokeLinecap="round" fill="none" />}
      {boca === "torta" && <path d="M128 278 Q148 268 174 272" stroke={p.barba ? "#f0d9c8" : LABIO} strokeWidth={7} strokeLinecap="round" fill="none" />}
      {boca === "aberta" && <ellipse cx={150} cy={276} rx={15} ry={13} fill={LABIO} />}
    </g>
  );
}

/** Piscadas de tempos em tempos (0 aberto, 1 fechado). */
export function piscada(f: number, desloca = 0) {
  const c = (f + desloca) % 97;
  return c < 3 ? [0.5, 1, 0.5][c] : 0;
}

export const RAFA = { pele: "#a86c4a", sombra: "#8a5537", cabelo: "curto" as const, corCabelo: "#1f1612", barba: "#2a1c15" };
export const MATHEUS = { pele: "#e2b38f", sombra: "#c99474", cabelo: "baguncado" as const, corCabelo: "#5b3a26" };

/** Elenco fixo dos vídeos: aparência e roupa de cada um (o roteiro escolhe pelo nome). */
export type NomeElenco = "rafa" | "matheus" | "juninho" | "carlos" | "bia" | "ze" | "davi";
export const ELENCO: Record<NomeElenco, { nome: string; papel: "barbeiro" | "cliente"; cabeca: Omit<PropsCabeca, "olhar" | "piscar" | "boca" | "sobrancelha" | "caos" | "t">; roupa: string; sombraRoupa: string }> = {
  rafa: { nome: "Rafa", papel: "barbeiro", cabeca: RAFA, roupa: "#1f1b17", sombraRoupa: "#2e2823" },
  matheus: { nome: "Matheus", papel: "cliente", cabeca: MATHEUS, roupa: "#e8b04a", sombraRoupa: "#d9a03d" },
  juninho: { nome: "Juninho", papel: "barbeiro", cabeca: { pele: "#c98d63", sombra: "#ad7650", cabelo: "bone", corBone: "#b0513a", corCabelo: "#2a1c15" }, roupa: "#3a2a20", sombraRoupa: "#4a3729" },
  carlos: { nome: "Seu Carlos", papel: "cliente", cabeca: { pele: "#e9bf9b", sombra: "#cf9f7c", cabelo: "calvo", corCabelo: "#cfc8bf", bigode: "#bdb5ab", oculos: true }, roupa: "#3d7a4c", sombraRoupa: "#326641" },
  bia: { nome: "Bia", papel: "cliente", cabeca: { pele: "#d29c78", sombra: "#b8825f", cabelo: "longo", corCabelo: "#3a2418", cilios: true }, roupa: "#2f5d6e", sombraRoupa: "#264d5b" },
  ze: { nome: "Seu Zé", papel: "cliente", cabeca: { pele: "#c99a77", sombra: "#ad7f5e", cabelo: "curto", corCabelo: "#ebe6de", bigode: "#e0d9ce", rugas: true }, roupa: "#6b4a36", sombraRoupa: "#5a3d2c" },
  davi: { nome: "Davi", papel: "cliente", cabeca: { pele: "#e3b089", sombra: "#c89069", cabelo: "curto", corCabelo: "#7a4526", sardas: true }, roupa: "#3a5f9a", sombraRoupa: "#30507f" },
};
