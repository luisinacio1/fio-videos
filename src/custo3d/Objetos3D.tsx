import React, { useMemo, type JSX } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C } from "../base";
import type { VarianteObjeto } from "../motion/Objetos";
import { COR, Caixa, Cilindro } from "./Barbearia3D";

/**
 * A coleção de objetos de barbearia em 3D, no mesmo estilo de brinquedo de Barbearia3D (caixas, cilindros e
 * esferas nas cores de COR). Cada objeto fica no meio (x = 0, z = 0), em pé no chão (y = 0), com a frente
 * virada para +z, e mede mais ou menos `altura` (em metros, no tamanho de verdade).
 *
 * `aberto` (0 a 1) afasta as peças para a visão "por dentro" (máquina, navalha, tesoura e poste); `partes` dá o
 * nome de cada peça, na ordem em que se afastam. `f` é o quadro atual (o poste gira, a toalha solta vapor).
 *
 * Poste: o padrão é o de sempre (vermelho, branco e azul), igual ao 2D. `variante: "vermelhoBranco"` deixa só
 * vermelho e branco (o da lei inglesa), a mesma variante do poste 2D em src/motion/Objetos.tsx.
 */

type V3 = [number, number, number];

export type Objeto3D = "poste" | "cadeiraAntiga" | "cadeiraModerna" | "maquina" | "navalha" | "tesoura" | "espelho" | "toalha" | "pente";

export type PropsObjeto3D = { f: number; aberto?: number; variante?: VarianteObjeto };

/** cores que só os objetos usam (o resto vem de COR) */
const COR2 = {
  couroAntigo: "#6e2c22",
  botao: "#4a1c15",
  ouro: "#c8a24a",
  porcelana: "#f3eee6",
  cobre: "#b8703f",
  chifre: "#3a2a22",
  vermelho: "#c8322b",
  branco: "#f8f4ee",
  azul: "#2c4f8c",
  toalha: "#fbf8f3",
  maquina: "#2b2521",
  dentro: "#5a504a",
  lamina: "#dfe3e6",
  fio: "#f6f8f9",
};
const METAL = { metalness: 0.45, roughness: 0.28 };
const OURO = { metalness: 0.45, roughness: 0.32 };

const ab = (a?: number) => Math.min(1, Math.max(0, a ?? 0));

// ---------- peças básicas ----------

/** Caixa de cantos redondos (o "brinquedo" das peças pequenas). */
function Bloco({ p, s, r = 0.02, cor, rot, sombra = true, ...m }: { p: V3; s: V3; r?: number; cor: string; rot?: V3; sombra?: boolean } & Partial<THREE.MeshStandardMaterialParameters>) {
  const [x, y, z] = s;
  const geo = useMemo(() => new RoundedBoxGeometry(x, y, z, 3, Math.min(r, Math.min(x, y, z) / 2 - 1e-5)), [x, y, z, r]);
  return (
    <mesh position={p} rotation={rot} geometry={geo} castShadow={sombra} receiveShadow>
      <meshStandardMaterial color={cor} roughness={0.6} {...m} />
    </mesh>
  );
}

function Bola({ p, r, cor, ...m }: { p: V3; r: number; cor: string } & Partial<THREE.MeshStandardMaterialParameters>) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <sphereGeometry args={[r, 24, 16]} />
      <meshStandardMaterial color={cor} roughness={0.5} {...m} />
    </mesh>
  );
}

/** Cilindro com poucos lados (o pé octogonal da cadeira antiga). */
function Prisma({ p, r, h, lados, cor, ...m }: { p: V3; r: [number, number]; h: number; lados: number; cor: string } & Partial<THREE.MeshStandardMaterialParameters>) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r[0], r[1], h, lados]} />
      <meshStandardMaterial color={cor} roughness={0.5} flatShading {...m} />
    </mesh>
  );
}

/** Um desenho plano (THREE.Shape) com espessura, centrado em z = 0. */
function Perfil({ forma, prof, bisel = 0, p, rot, cor, ...m }: { forma: THREE.Shape; prof: number; bisel?: number; p?: V3; rot?: V3; cor: string } & Partial<THREE.MeshStandardMaterialParameters>) {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(forma, { depth: prof, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 2, curveSegments: 24 });
    g.translate(0, 0, -prof / 2);
    return g;
  }, [forma, prof, bisel]);
  return (
    <mesh position={p} rotation={rot} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={cor} roughness={0.5} {...m} />
    </mesh>
  );
}

/** Fio (cabo elétrico) passando pelos pontos. */
function Tubo({ pontos, r, cor }: { pontos: V3[]; r: number; cor: string }) {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos.map((v) => new THREE.Vector3(...v))), 64, r, 10, false), [pontos, r]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={cor} roughness={0.55} />
    </mesh>
  );
}

// ---------- poste ----------

/** listras do poste: o de sempre (vermelho, branco e azul) e o da lei inglesa (só vermelho e branco) */
const LISTRAS: Record<"padrao" | VarianteObjeto, string[]> = {
  padrao: [COR2.vermelho, COR2.branco, COR2.azul, COR2.branco],
  vermelhoBranco: [COR2.vermelho, COR2.branco, COR2.vermelho, COR2.branco],
};

/** Listras em diagonal que emendam sem costura: numa volta inteira cada faixa sobe exatamente um ciclo de cores. */
function useListrasPoste(cores: string[]) {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 128;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const b = 32;
    const ciclo = b * cores.length;
    for (let k = -8; k < 16; k++) {
      const y = k * b;
      g.fillStyle = cores[((k % cores.length) + cores.length) % cores.length];
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(128, y - ciclo);
      g.lineTo(128, y - ciclo + b + 0.5);
      g.lineTo(0, y + b + 0.5);
      g.fill();
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 0.7);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [cores]);
}

/** Poste de barbeiro de pé: base cromada, tubo de vidro com o cilindro listrado girando dentro e tampa com bola. */
function Poste({ f, aberto, variante }: PropsObjeto3D) {
  const d = 0.22 * ab(aberto);
  const listras = useListrasPoste(LISTRAS[variante ?? "padrao"]);
  return (
    <group>
      {/* base */}
      <Cilindro p={[0, 0.035, 0]} r={[0.13, 0.15]} h={0.07} cor={COR.cromo} {...METAL} />
      <Cilindro p={[0, 0.075, 0]} r={0.136} h={0.014} cor={COR.preto} />
      <Cilindro p={[0, 0.12, 0]} r={[0.11, 0.12]} h={0.09} cor={COR.cromo} {...METAL} />
      {/* motor (dentro da base) */}
      <group position={[0, d, 0]}>
        <Cilindro p={[0, 0.11, 0]} r={0.055} h={0.06} cor={COR2.cobre} metalness={0.6} roughness={0.35} />
        <Cilindro p={[0, 0.142, 0]} r={0.045} h={0.006} cor={COR.cromo} {...METAL} />
        <Caixa p={[0.07, 0.11, 0]} s={[0.028, 0.04, 0.03]} cor={COR.preto} />
        <Cilindro p={[0, 0.165, 0]} r={0.012} h={0.05} cor={COR.cromo} {...METAL} />
      </group>
      {/* cilindro listrado e o vidro em volta */}
      <group position={[0, 2 * d, 0]}>
        <mesh position={[0, 0.5, 0]} rotation={[0, f * 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.074, 0.074, 0.68, 40]} />
          <meshStandardMaterial map={listras} emissive="#ffffff" emissiveMap={listras} emissiveIntensity={0.25} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.68, 40, 1, true]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.2} roughness={0.05} metalness={0.1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <Caixa p={[-0.035, 0.5, 0.083]} s={[0.012, 0.6, 0.002]} cor="#ffffff" transparent opacity={0.55} sombra={false} />
      </group>
      {/* tampa */}
      <group position={[0, 3 * d, 0]}>
        <Cilindro p={[0, 0.885, 0]} r={[0.12, 0.11]} h={0.09} cor={COR.cromo} {...METAL} />
        <Cilindro p={[0, 0.93, 0]} r={0.136} h={0.014} cor={COR.preto} />
        <Cilindro p={[0, 0.97, 0]} r={[0.12, 0.14]} h={0.07} cor={COR.cromo} {...METAL} />
        <Bola p={[0, 1.04, 0]} r={0.05} cor={COR.cromo} {...METAL} />
      </group>
    </group>
  );
}

// ---------- cadeiras ----------

/** Cadeira de 1900: pé octogonal de porcelana, couro capitonê vinho, braços de madeira, frisos dourados e alavanca. */
function CadeiraAntiga() {
  const couro = COR2.couroAntigo;
  return (
    <group>
      {/* pé */}
      <Prisma p={[0, 0.03, 0]} r={[0.3, 0.34]} h={0.06} lados={8} cor={COR2.porcelana} />
      <Cilindro p={[0, 0.068, 0]} r={0.27} h={0.016} cor={COR2.ouro} {...OURO} />
      <Prisma p={[0, 0.17, 0]} r={[0.15, 0.25]} h={0.22} lados={8} cor={COR2.porcelana} />
      <Cilindro p={[0, 0.29, 0]} r={0.165} h={0.03} cor={COR2.ouro} {...OURO} />
      <Cilindro p={[0, 0.35, 0]} r={0.07} h={0.1} cor={COR.cromo} {...METAL} />
      {/* alavanca da bomba */}
      <Cilindro p={[0.24, 0.42, -0.1]} r={0.012} h={0.36} cor={COR.cromo} rot={[0, 0, -0.5]} {...METAL} />
      <Bola p={[0.326, 0.58, -0.1]} r={0.026} cor={COR.preto} />
      {/* apoio dos pés */}
      <Caixa p={[0, 0.12, 0.33]} s={[0.05, 0.035, 0.3]} cor={COR.cromo} {...METAL} />
      <group position={[0, 0.16, 0.48]} rotation={[0.3, 0, 0]}>
        <Bloco p={[0, 0, 0]} s={[0.44, 0.03, 0.2]} r={0.01} cor={COR2.ouro} {...OURO} />
        <Caixa p={[0, 0.014, 0]} s={[0.34, 0.006, 0.12]} cor={COR.preto} />
        {[-1, 1].map((l) => (
          <Bola key={l} p={[l * 0.19, 0.02, 0.07]} r={0.018} cor={COR2.ouro} {...OURO} />
        ))}
      </group>
      {/* saia de madeira e assento capitonê */}
      <Bloco p={[0, 0.43, 0]} s={[0.64, 0.08, 0.58]} r={0.02} cor={COR.madeira} />
      <Caixa p={[0, 0.43, 0.291]} s={[0.5, 0.014, 0.004]} cor={COR2.ouro} {...OURO} />
      <Bloco p={[0, 0.53, 0]} s={[0.6, 0.13, 0.56]} r={0.05} cor={couro} roughness={0.45} />
      {[-1, 0, 1].map((i) =>
        [-1, 1].map((j) => <Bola key={`${i}${j}`} p={[i * 0.17, 0.592, j * 0.13]} r={0.014} cor={COR2.botao} />),
      )}
      {/* encosto */}
      <group position={[0, 0.58, -0.25]} rotation={[-0.16, 0, 0]}>
        <Bloco p={[0, 0.38, 0]} s={[0.62, 0.76, 0.1]} r={0.03} cor={COR.madeira} />
        <Bloco p={[0, 0.36, 0.05]} s={[0.5, 0.62, 0.07]} r={0.03} cor={couro} roughness={0.45} />
        {[-1, 0, 1].map((i) =>
          [0.18, 0.36, 0.54].map((y) => <Bola key={`${i}${y}`} p={[i * 0.15, y, 0.086]} r={0.014} cor={COR2.botao} />),
        )}
        <Cilindro p={[0, 0.78, 0]} r={0.055} h={0.66} cor={COR.madeira} rot={[0, 0, Math.PI / 2]} />
        {[-1, 1].map((l) => (
          <Bola key={l} p={[l * 0.345, 0.78, 0]} r={0.045} cor={COR2.ouro} {...OURO} />
        ))}
        {/* encosto de cabeça */}
        <Cilindro p={[0, 0.9, 0.02]} r={0.012} h={0.14} cor={COR.cromo} {...METAL} />
        <Bloco p={[0, 1.0, 0.03]} s={[0.3, 0.11, 0.09]} r={0.04} cor={couro} roughness={0.45} />
      </group>
      {/* braços */}
      {[-1, 1].map((l) => (
        <group key={l}>
          <Bloco p={[l * 0.34, 0.8, 0]} s={[0.08, 0.05, 0.56]} r={0.02} cor={COR.madeira} />
          <Bloco p={[l * 0.34, 0.835, -0.02]} s={[0.085, 0.03, 0.42]} r={0.012} cor={couro} roughness={0.45} />
          <Cilindro p={[l * 0.34, 0.79, 0.28]} r={0.05} h={0.1} cor={COR.madeira} rot={[0, 0, Math.PI / 2]} />
          <Cilindro p={[l * 0.392, 0.79, 0.28]} r={0.03} h={0.008} cor={COR2.ouro} rot={[0, 0, Math.PI / 2]} {...OURO} />
          <Cilindro p={[l * 0.32, 0.63, 0.2]} r={[0.022, 0.03]} h={0.32} cor={COR.madeira} />
          <Bola p={[l * 0.32, 0.69, 0.2]} r={0.035} cor={COR2.ouro} {...OURO} />
        </group>
      ))}
    </group>
  );
}

/**
 * A cadeira de hoje: as medidas e o couro preto da CadeiraBarbeiro (a da barbearia do "Quanto custa"), mas com
 * cantos redondos e o pé hidráulico cromado, para aguentar um close.
 */
function CadeiraModerna() {
  const couro = COR.couro;
  return (
    <group>
      {/* pé hidráulico */}
      <Cilindro p={[0, 0.02, 0]} r={[0.27, 0.3]} h={0.04} cor={COR.cromo} {...METAL} />
      <Cilindro p={[0, 0.12, 0]} r={[0.09, 0.12]} h={0.16} cor={COR.preto} roughness={0.35} />
      <Cilindro p={[0, 0.205, 0]} r={0.095} h={0.012} cor={COR.cromo} {...METAL} />
      <Cilindro p={[0, 0.3, 0]} r={0.05} h={0.2} cor={COR.cromo} {...METAL} />
      {/* apoio dos pés */}
      <Caixa p={[0, 0.17, 0.27]} s={[0.05, 0.03, 0.26]} cor={COR.cromo} {...METAL} />
      <group position={[0, 0.2, 0.44]} rotation={[0.35, 0, 0]}>
        <Bloco p={[0, 0, 0]} s={[0.46, 0.03, 0.18]} r={0.01} cor={COR.cromo} {...METAL} />
        {[-1, 0, 1].map((i) => (
          <Caixa key={i} p={[0, 0.016, i * 0.05]} s={[0.4, 0.006, 0.02]} cor={COR.preto} />
        ))}
      </group>
      {/* assento */}
      <Bloco p={[0, 0.41, 0]} s={[0.56, 0.03, 0.52]} r={0.01} cor={COR.cromo} {...METAL} />
      <Bloco p={[0, 0.495, 0]} s={[0.58, 0.14, 0.56]} r={0.05} cor={couro} roughness={0.4} />
      {/* encosto e encosto de cabeça */}
      <group position={[0, 0.56, -0.26]} rotation={[-0.16, 0, 0]}>
        <Bloco p={[0, 0.38, 0]} s={[0.54, 0.74, 0.12]} r={0.06} cor={couro} roughness={0.4} />
        <Bloco p={[0, 0.38, -0.065]} s={[0.48, 0.66, 0.02]} r={0.008} cor={COR.cromo} {...METAL} />
        {[-1, 1].map((l) => (
          <Cilindro key={l} p={[l * 0.08, 0.77, -0.01]} r={0.01} h={0.1} cor={COR.cromo} {...METAL} />
        ))}
        <Bloco p={[0, 0.87, 0]} s={[0.3, 0.14, 0.1]} r={0.05} cor={couro} roughness={0.4} />
      </group>
      {/* braços */}
      {[-1, 1].map((l) => (
        <group key={l}>
          <Cilindro p={[l * 0.31, 0.655, 0.15]} r={0.018} h={0.19} cor={COR.cromo} {...METAL} />
          <Caixa p={[l * 0.33, 0.745, -0.01]} s={[0.07, 0.012, 0.44]} cor={COR.cromo} {...METAL} />
          <Bloco p={[l * 0.33, 0.78, -0.01]} s={[0.09, 0.06, 0.48]} r={0.025} cor={couro} roughness={0.4} />
        </group>
      ))}
    </group>
  );
}

// ---------- máquina ----------

/** o cabo sai da bateria pelas costas e dá a volta por trás (assim não atravessa a carcaça aberta) */
const FIO_MAQUINA: V3[] = [
  [0, 0.04, -0.005],
  [0, 0.036, -0.03],
  [0.004, 0.012, -0.052],
  [0.025, 0.004, -0.066],
  [0.05, 0.004, -0.062],
  [0.062, 0.004, -0.046],
];
const FIO_VERMELHO: V3[] = [
  [0.006, 0.088, 0.004],
  [0.01, 0.1, 0.007],
  [0.006, 0.108, 0.006],
];

/** Máquina de cortar em pé (lâminas para cima): carcaça em duas metades, motor e bateria dentro, cabo atrás. */
function Maquina({ aberto }: PropsObjeto3D) {
  const a = ab(aberto);
  const lado = 0.055 * a;
  const dentro = new THREE.Color(COR2.maquina).lerp(new THREE.Color(COR2.dentro), a);
  const dentes = (n: number, largura: number) => Array.from({ length: n }, (_, i) => -largura / 2 + (i + 0.5) * (largura / n));
  return (
    <group>
      {/* carcaça: metade esquerda e direita (a face de dentro é mais clara, para ler "por dentro" quando abre) */}
      {[-1, 1].map((l) => (
        <group key={l} position={[l * lado, 0, 0]}>
          <Bloco p={[l * 0.0155, 0.076, 0]} s={[0.031, 0.152, 0.042]} r={0.007} cor={COR2.maquina} roughness={0.35} />
          <Caixa p={[l * 0.0072, 0.076, 0]} s={[0.015, 0.138, 0.04]} cor={dentro} roughness={0.5} />
          <Bloco p={[l * 0.0175, 0.168, 0]} s={[0.035, 0.032, 0.046]} r={0.007} cor={COR2.maquina} roughness={0.35} />
          <Caixa p={[l * 0.0082, 0.168, 0]} s={[0.017, 0.02, 0.044]} cor={dentro} roughness={0.5} />
          <Caixa p={[l * 0.0155, 0.148, 0]} s={[0.0312, 0.007, 0.0425]} cor={COR2.ouro} {...OURO} />
          {l === 1 && <Bloco p={[0.013, 0.105, 0.0215]} s={[0.012, 0.03, 0.008]} r={0.003} cor={C.acento} />}
          {/* alavanca de regular a lâmina, do lado direito */}
          {l === 1 && (
            <>
              <Bloco p={[0.037, 0.168, 0]} s={[0.008, 0.01, 0.03]} r={0.003} cor={COR.cromo} {...METAL} />
              <Bola p={[0.039, 0.168, 0.017]} r={0.0055} cor={COR.cromo} {...METAL} />
            </>
          )}
        </group>
      ))}
      {/* motor */}
      <group position={[0, 0.012 * a, 0]}>
        <Cilindro p={[0, 0.12, 0]} r={0.013} h={0.034} cor={COR2.cobre} metalness={0.6} roughness={0.35} />
        <Cilindro p={[0, 0.139, 0]} r={0.011} h={0.004} cor={COR.cromo} {...METAL} />
        <Cilindro p={[0, 0.15, 0]} r={0.0025} h={0.022} cor={COR.cromo} {...METAL} />
      </group>
      {/* bateria */}
      <Bloco p={[0, 0.06, 0]} s={[0.026, 0.06, 0.024]} r={0.004} cor={C.ok} />
      <Caixa p={[0, 0.06, 0]} s={[0.027, 0.016, 0.025]} cor="#f4efe8" />
      <Cilindro p={[0, 0.093, 0]} r={0.004} h={0.006} cor={COR.cromo} {...METAL} />
      <Tubo pontos={FIO_VERMELHO} r={0.0013} cor={COR2.vermelho} />
      {/* lâminas */}
      <group position={[0, 0.05 * a, 0]}>
        <Caixa p={[0, 0.192, 0.018]} s={[0.068, 0.02, 0.006]} cor={COR.cromo} {...METAL} />
        {dentes(15, 0.068).map((x) => (
          <Caixa key={x} p={[x, 0.207, 0.018]} s={[0.0026, 0.012, 0.006]} cor={COR.cromo} {...METAL} />
        ))}
        <Caixa p={[0, 0.192, 0.0235]} s={[0.056, 0.014, 0.004]} cor={COR2.ouro} {...OURO} />
        {dentes(12, 0.056).map((x) => (
          <Caixa key={x} p={[x, 0.202, 0.0235]} s={[0.0024, 0.008, 0.004]} cor={COR2.ouro} {...OURO} />
        ))}
      </group>
      {/* cabo de força (fica no lugar, preso na bateria) */}
      <Cilindro p={[0, 0.037, -0.026]} r={0.006} h={0.016} cor={COR.preto} rot={[Math.PI / 2, 0, 0]} />
      <Tubo pontos={FIO_MAQUINA} r={0.0035} cor="#2b2522" />
      <Bloco p={[0.065, 0.006, -0.038]} s={[0.012, 0.012, 0.018]} r={0.003} rot={[0, 0.35, 0]} cor="#2b2522" />
    </group>
  );
}

// ---------- navalha ----------

/** lâmina com o pino na origem, apontando para +x: lombo em cima, fio embaixo, rabicho para trás */
const LAMINA_NAVALHA = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.022, 0.003);
  s.quadraticCurveTo(-0.03, -0.004, -0.024, -0.009);
  s.lineTo(-0.012, -0.005);
  s.lineTo(0.02, -0.005);
  s.quadraticCurveTo(0.026, -0.005, 0.03, -0.013);
  s.quadraticCurveTo(0.07, -0.017, 0.106, -0.015);
  s.quadraticCurveTo(0.114, -0.014, 0.114, -0.006);
  s.lineTo(0.114, 0.002);
  s.quadraticCurveTo(0.114, 0.006, 0.108, 0.006);
  s.lineTo(-0.018, 0.006);
  s.quadraticCurveTo(-0.024, 0.006, -0.022, 0.003);
  return s;
})();

/** a faixa clara do fio da navalha (a parte afiada), por cima das duas faces da lâmina */
const FIO_NAVALHA = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.031, -0.0098);
  s.quadraticCurveTo(0.07, -0.0128, 0.106, -0.0112);
  s.quadraticCurveTo(0.111, -0.0108, 0.1115, -0.008);
  s.lineTo(0.1125, -0.0095);
  s.quadraticCurveTo(0.112, -0.0138, 0.106, -0.0143);
  s.quadraticCurveTo(0.07, -0.0163, 0.0305, -0.0125);
  s.closePath();
  return s;
})();

/** cada lado do cabo, com o pino na origem, indo para -x */
const CABO_NAVALHA = (() => {
  const s = new THREE.Shape();
  s.moveTo(0.012, 0);
  s.quadraticCurveTo(0.012, 0.011, 0, 0.011);
  s.quadraticCurveTo(-0.07, 0.015, -0.13, 0.009);
  s.quadraticCurveTo(-0.142, 0, -0.13, -0.009);
  s.quadraticCurveTo(-0.07, -0.015, 0, -0.011);
  s.quadraticCurveTo(0.012, -0.011, 0.012, 0);
  return s;
})();

/** Navalha aberta, de pé sobre a ponta do cabo: o cabo desce, a lâmina sobe inclinada com o fio para a direita. */
function Navalha({ aberto }: PropsObjeto3D) {
  const a = ab(aberto);
  const abre = -0.4;
  const sai = 0.045 * a;
  return (
    <group position={[0, 0.143, 0]} rotation={[0, 0, Math.PI / 2]}>
      {/* cabo: dois lados com o vão no meio, cunha e pino do fundo */}
      {[-1, 1].map((l) => (
        <Perfil key={l} forma={CABO_NAVALHA} prof={0.003} bisel={0.0008} p={[0, 0, l * 0.0045]} cor={COR.madeira} roughness={0.45} />
      ))}
      <Caixa p={[-0.124, 0, 0]} s={[0.02, 0.012, 0.006]} cor={COR2.chifre} />
      <Cilindro p={[-0.128, 0, 0]} r={0.0025} h={0.0135} cor={COR2.ouro} rot={[Math.PI / 2, 0, 0]} {...OURO} />
      {/* lâmina: desliza para fora pelo próprio comprimento */}
      <group position={[Math.cos(abre) * sai, Math.sin(abre) * sai, 0]} rotation={[0, 0, abre]}>
        <Perfil forma={LAMINA_NAVALHA} prof={0.0018} bisel={0.0006} cor={COR2.lamina} {...METAL} />
        {[-1, 1].map((l) => (
          <Perfil key={l} forma={FIO_NAVALHA} prof={0.0002} p={[0, 0, l * 0.0016]} cor={COR2.fio} metalness={0.3} roughness={0.15} />
        ))}
      </group>
      {/* pino: sai para a frente, pelo eixo dele */}
      <group position={[0, 0, 0.04 * a]}>
        <Cilindro p={[0, 0, 0]} r={0.003} h={0.0145} cor={COR2.ouro} rot={[Math.PI / 2, 0, 0]} {...OURO} />
        {[-1, 1].map((l) => (
          <Cilindro key={l} p={[0, 0, l * 0.0068]} r={0.0048} h={0.0012} cor={COR2.ouro} rot={[Math.PI / 2, 0, 0]} {...OURO} />
        ))}
      </group>
    </group>
  );
}

// ---------- tesoura ----------

/** lâmina de uma metade, com o parafuso na origem e a ponta para +y; `m` espelha (fio do corte em -x ou +x) */
function laminaTesoura(m: 1 | -1) {
  const s = new THREE.Shape();
  s.moveTo(m * -0.0055, -0.008);
  s.lineTo(m * 0.0075, -0.008);
  s.lineTo(m * 0.0075, 0.02);
  s.quadraticCurveTo(m * 0.0065, 0.08, m * 0.0005, 0.106);
  s.lineTo(m * -0.0015, 0.104);
  s.lineTo(m * -0.0055, 0);
  s.closePath();
  return s;
}
const LAMINAS_TESOURA = { [1]: laminaTesoura(-1), [-1]: laminaTesoura(1) } as Record<1 | -1, THREE.Shape>;

/** Uma metade da tesoura: lâmina para cima, haste e argola do outro lado do parafuso (m = 1 inclina para a esquerda). */
function MeiaTesoura({ m }: { m: 1 | -1 }) {
  return (
    <group>
      <Perfil forma={LAMINAS_TESOURA[m]} prof={0.0025} bisel={0.0004} cor={COR.cromo} {...METAL} />
      <Bloco p={[m * 0.009, -0.022, 0]} s={[0.007, 0.042, 0.0035]} r={0.0015} rot={[0, 0, m * 0.418]} cor={COR.cromo} {...METAL} />
      <mesh position={[m * 0.017, -0.058, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.016, 0.0048, 14, 36]} />
        <meshStandardMaterial color={C.acento} roughness={0.45} />
      </mesh>
    </group>
  );
}

/**
 * Tesoura de pé sobre as argolas, um pouco aberta. Por dentro: as duas metades se endireitam e se afastam para os
 * lados (cada uma com a sua lâmina e a sua argola), e o parafuso sai para a frente, pelo eixo dele, no meio delas.
 */
function Tesoura({ aberto }: PropsObjeto3D) {
  const a = ab(aberto);
  const ang = 0.2 * (1 - a);
  const lado = 0.045 * a;
  const fundo = 0.0019 + 0.012 * a;
  return (
    <group position={[0, 0.075 + 0.005 * a, 0]}>
      <group position={[-lado, 0, fundo]} rotation={[0, 0, ang]}>
        <MeiaTesoura m={1} />
      </group>
      <group position={[lado, 0, -fundo]} rotation={[0, 0, -ang]}>
        <MeiaTesoura m={-1} />
      </group>
      <group position={[0, 0, 0.04 * a]}>
        <Cilindro p={[0, 0, 0]} r={0.0032} h={0.011} cor={COR.cromo} rot={[Math.PI / 2, 0, 0]} {...METAL} />
        <Cilindro p={[0, 0, 0.0058]} r={0.0055} h={0.0016} cor={COR2.ouro} rot={[Math.PI / 2, 0, 0]} {...OURO} />
      </group>
    </group>
  );
}

// ---------- espelho ----------

/** retângulo com o topo em meia-lua */
function arco(meia: number, base: number, reto: number) {
  const s = new THREE.Shape();
  s.moveTo(-meia, base);
  s.lineTo(meia, base);
  s.lineTo(meia, reto);
  s.absarc(0, reto, meia, 0, Math.PI, false);
  s.lineTo(-meia, base);
  return s;
}
const MOLDURA = (() => {
  const s = arco(0.4, 0, 0.95);
  s.holes.push(arco(0.33, 0.07, 0.95));
  return s;
})();
const FUNDO_ESPELHO = arco(0.4, 0, 0.95);
const VIDRO = arco(0.335, 0.065, 0.95);

/** Espelho de pé com moldura de madeira em arco, prateleirinha com um pote e um frasco, e bola dourada no alto. */
function Espelho() {
  const vidro = useMemo(() => new THREE.ShapeGeometry(VIDRO, 32), []);
  return (
    <group>
      <Bloco p={[0, 0.04, 0]} s={[0.92, 0.08, 0.32]} r={0.02} cor={COR.madeira} />
      {[-1, 1].map((l) => (
        <Bloco key={l} p={[l * 0.43, 0.2, 0]} s={[0.04, 0.24, 0.2]} r={0.012} cor={COR.madeira} />
      ))}
      <group position={[0, 0.08, 0]}>
        <Perfil forma={MOLDURA} prof={0.06} bisel={0.006} cor={COR.madeira} />
        <Perfil forma={FUNDO_ESPELHO} prof={0.01} p={[0, 0, -0.035]} cor={COR.preto} />
        <mesh geometry={vidro} position={[0, 0, 0.005]} receiveShadow>
          <meshStandardMaterial color={COR.espelho} roughness={0.1} metalness={0.25} />
        </mesh>
        <Bloco p={[-0.12, 0.75, 0.008]} s={[0.04, 0.5, 0.002]} r={0.0009} rot={[0, 0, 0.6]} cor="#ffffff" transparent opacity={0.4} sombra={false} />
        <Bloco p={[0.0, 0.8, 0.008]} s={[0.015, 0.36, 0.002]} r={0.0009} rot={[0, 0, 0.6]} cor="#ffffff" transparent opacity={0.4} sombra={false} />
        {/* prateleira */}
        <Bloco p={[0, 0.16, 0.07]} s={[0.66, 0.025, 0.11]} r={0.008} cor={COR.madeira} />
        <Cilindro p={[-0.18, 0.222, 0.07]} r={0.025} h={0.1} cor={C.acento} roughness={0.35} />
        <Cilindro p={[-0.18, 0.282, 0.07]} r={0.011} h={0.02} cor={COR.preto} />
        <Cilindro p={[0.15, 0.207, 0.07]} r={0.035} h={0.07} cor="#ffffff" roughness={0.35} />
        <Cilindro p={[0.15, 0.247, 0.07]} r={0.037} h={0.012} cor={COR2.ouro} {...OURO} />
        {/* bola no alto */}
        <Bola p={[0, 1.385, 0]} r={0.04} cor={COR2.ouro} {...OURO} />
      </group>
    </group>
  );
}

// ---------- toalha ----------

/** Toalha quente: bandeja de madeira, duas toalhas dobradas, uma enrolada por cima e vapor subindo. */
function Toalha({ f }: PropsObjeto3D) {
  return (
    <group>
      <Bloco p={[0, 0.015, 0]} s={[0.44, 0.03, 0.3]} r={0.012} cor={COR.madeira} />
      {/* dobrada de baixo (branca, com faixa) */}
      <Bloco p={[0, 0.058, 0]} s={[0.34, 0.056, 0.22]} r={0.026} cor={COR2.toalha} roughness={0.95} />
      {[0.1, 0.12].map((x) => (
        <Caixa key={x} p={[x, 0.0865, 0]} s={[0.008, 0.002, 0.16]} cor={C.acento} roughness={0.95} sombra={false} />
      ))}
      {/* dobrada de cima (na cor do Fio, com faixa branca) */}
      <group position={[0.01, 0.114, 0.005]} rotation={[0, 0.07, 0]}>
        <Bloco p={[0, 0, 0]} s={[0.32, 0.056, 0.2]} r={0.026} cor={C.acento} roughness={0.95} />
        {[-0.1, -0.12].map((x) => (
          <Caixa key={x} p={[x, 0.0285, 0]} s={[0.008, 0.002, 0.14]} cor={COR2.toalha} roughness={0.95} sombra={false} />
        ))}
      </group>
      {/* enrolada */}
      <Cilindro p={[0, 0.178, 0]} r={0.036} h={0.27} cor={COR2.toalha} rot={[0, 0, Math.PI / 2]} roughness={0.95} />
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.1355, 0.178, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.019, 0.0035, 8, 28]} />
          <meshStandardMaterial color="#e6ddd2" roughness={0.95} />
        </mesh>
      ))}
      {/* vapor */}
      {[0, 1, 2].map((k) =>
        [0, 1, 2, 3, 4, 5].map((i) => {
          const q = (((f / 80 + k / 3 + i / 6) % 1) + 1) % 1;
          return (
            <mesh key={`${k}${i}`} position={[(k - 1) * 0.08 + Math.sin(q * 6 + k * 2) * 0.02, 0.22 + q * 0.2, Math.cos(q * 5 + k) * 0.01]}>
              <sphereGeometry args={[0.014 + q * 0.026, 16, 12]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={Math.sin(q * Math.PI) * 0.32} depthWrite={false} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

// ---------- pente ----------

const DENTES_PENTE = [
  ...Array.from({ length: 14 }, (_, i) => ({ y: 0.014 + i * 0.0064, w: 0.0034 })),
  ...Array.from({ length: 24 }, (_, i) => ({ y: 0.105 + i * 0.0036, w: 0.0018 })),
];

/** Pente preto de pé: lombo à esquerda, dentes grossos embaixo e finos em cima. */
function Pente() {
  return (
    <group>
      <Bloco p={[-0.011, 0.1, 0]} s={[0.016, 0.2, 0.006]} r={0.0028} cor={COR.preto} roughness={0.3} />
      {DENTES_PENTE.map((d) => (
        <Caixa key={d.y} p={[0.008, d.y, 0]} s={[0.024, d.w, 0.005]} cor={COR.preto} roughness={0.3} />
      ))}
      <Caixa p={[-0.011, 0.16, 0.0031]} s={[0.007, 0.026, 0.0006]} cor={COR2.ouro} sombra={false} {...OURO} />
    </group>
  );
}

// ---------- a coleção ----------

export const OBJETOS_3D: Record<Objeto3D, { Comp: (p: PropsObjeto3D) => JSX.Element; partes?: string[]; altura: number }> = {
  poste: { Comp: Poste, partes: ["tampa", "cilindro listrado", "base", "motor"], altura: 1.09 },
  cadeiraAntiga: { Comp: CadeiraAntiga, altura: 1.62 },
  cadeiraModerna: { Comp: CadeiraModerna, altura: 1.48 },
  maquina: { Comp: Maquina, partes: ["carcaça", "motor", "bateria", "lâminas"], altura: 0.215 },
  navalha: { Comp: Navalha, partes: ["cabo", "lâmina", "pino"], altura: 0.26 },
  tesoura: { Comp: Tesoura, partes: ["lâmina de cima", "lâmina de baixo", "parafuso"], altura: 0.18 },
  espelho: { Comp: Espelho, altura: 1.5 },
  toalha: { Comp: Toalha, altura: 0.45 },
  pente: { Comp: Pente, altura: 0.2 },
};

/**
 * Como enquadrar cada objeto (medidas de verdade, em metros): a largura fechado e, para os que abrem, a largura e a
 * altura abertos. Os planos 3D usam isso para a câmera caber o objeto inteiro (a altura fechado é a de OBJETOS_3D).
 * - `gira`: "volta" dá a volta inteira; "balanca" só balança em volta da frente (as peças chatas, que de lado somem);
 * - `inclina`: inclina o topo para a câmera (rad), para a peça não virar uma silhueta preta (a máquina fechada);
 * - `ancoras`: onde fica cada parte de OBJETOS_3D.partes (na mesma ordem) com o objeto todo aberto, para a etiqueta
 *   ligar a linha nela.
 */
export type Enquadramento = { largura: number; alturaAberta?: number; larguraAberta?: number; gira: "volta" | "balanca"; inclina?: number; ancoras?: V3[] };

const ENQUADRAMENTO: Record<Objeto3D, Enquadramento> = {
  poste: { largura: 0.3, alturaAberta: 1.75, gira: "volta", ancoras: [[0, 1.6, 0.12], [0, 0.94, 0.08], [0, 0.09, 0.15], [0, 0.33, 0.06]] },
  cadeiraAntiga: { largura: 0.8, gira: "volta" },
  cadeiraModerna: { largura: 0.75, gira: "volta" },
  maquina: { largura: 0.07, larguraAberta: 0.18, alturaAberta: 0.27, gira: "volta", inclina: 0.3, ancoras: [[-0.08, 0.09, 0.021], [0, 0.132, 0.014], [0, 0.06, 0.013], [0, 0.25, 0.02]] },
  navalha: { largura: 0.12, alturaAberta: 0.29, gira: "balanca", ancoras: [[0, 0.07, 0.007], [0.042, 0.24, 0.002], [0, 0.143, 0.045]] },
  tesoura: { largura: 0.1, larguraAberta: 0.16, gira: "balanca", ancoras: [[-0.045, 0.14, 0.015], [0.045, 0.14, -0.012], [0, 0.08, 0.045]] },
  espelho: { largura: 0.92, gira: "balanca" },
  toalha: { largura: 0.44, gira: "volta" },
  pente: { largura: 0.04, gira: "balanca" },
};

export function enquadramento(nome: Objeto3D): Enquadramento {
  return ENQUADRAMENTO[nome];
}
