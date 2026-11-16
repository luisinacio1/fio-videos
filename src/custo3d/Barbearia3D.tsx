import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { C, F, fontesCarregadas } from "../base";
import type { Peca } from "./roteiro";
import { OBJETOS_3D } from "./Objetos3D";

/**
 * A barbearia em 3D, estilo "brinquedo": só caixas, cilindros e esferas nas cores do Fio.
 * Medidas em metros. O chão fica em y = 0, o fundo em z = -D/2 e a fachada em z = +D/2 (casa de boneca: sem teto).
 * Quem chama decide quanto cada peça já apareceu (0 a 1, pode passar de 1 no quique da mola).
 *
 * Com `epoca` (0 a 1), a barbearia viaja no tempo: em 0 é a de 1920 (madeira, luz amarelada, cadeira antiga de
 * porcelana, espelho em arco, navalha e pente na bancada, banco de madeira, poste) e em 1 é a de hoje (cadeira
 * moderna, luminárias, piso xadrez, máquina). As peças viram uma de cada vez, na ordem de ORDEM_EPOCA. Sem `epoca`,
 * nada muda (a barbearia do "Quanto custa" continua igual).
 */

export const ALTURA = 3;
export const FUNDO = 6;
export const largura = (cadeiras: number) => 2.2 * cadeiras + 2.6;
/** x de cada estação (cadeira + espelho + bancada) */
export const estacoes = (cadeiras: number) => Array.from({ length: cadeiras }, (_, i) => -largura(cadeiras) / 2 + 2.9 + i * 2.2);
/** x do meio da porta */
export const PORTA_X = -1.6;

export const COR = {
  bruto: "#b9b2a8",
  concreto: "#a7a29b",
  parede: "#efe6da",
  fundo: C.acento,
  ladrilhoEscuro: "#2b2420",
  ladrilhoClaro: "#efe7dc",
  couro: "#2a201b",
  cromo: "#c9ccd0",
  madeira: "#8a5a3b",
  preto: "#1d1915",
  espelho: "#dbe6ea",
  pele: "#c48a5f",
  cabelo: "#2a1c14",
  calcada: "#e2d7c8",
  rua: "#57504a",
  chao: "#e8dccb",
  folha: "#7d9b5f",
  tronco: "#7a5a3f",
  cano: "#e9eef0",
};

const mistura = (a: string, b: string, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, t)));

export function Caixa({ p, s, cor, sombra = true, ...m }: { p: [number, number, number]; s: [number, number, number]; cor: string | THREE.Color; sombra?: boolean } & Partial<THREE.MeshStandardMaterialParameters>) {
  return (
    <mesh position={p} castShadow={sombra} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={cor} roughness={0.75} {...m} />
    </mesh>
  );
}

export function Cilindro({ p, r, h, cor, rot, ...m }: { p: [number, number, number]; r: number | [number, number]; h: number; cor: string; rot?: [number, number, number] } & Partial<THREE.MeshStandardMaterialParameters>) {
  const [a, b] = typeof r === "number" ? [r, r] : r;
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[a, b, h, 28]} />
      <meshStandardMaterial color={cor} roughness={0.6} {...m} />
    </mesh>
  );
}

/** Peça que cai do alto e cresce com a mola (v de 0 a 1). */
function Surge({ v, p = [0, 0, 0], cai = 1.4, rot = 0, children }: { v: number; p?: [number, number, number]; cai?: number; rot?: number; children: React.ReactNode }) {
  if (v <= 0.002) return null;
  return (
    <group position={[p[0], p[1] + (1 - Math.min(1, v)) * cai, p[2]]} rotation={[0, rot, 0]} scale={Math.max(0.001, v)}>
      {children}
    </group>
  );
}

// ---------- peças ----------

export function CadeiraBarbeiro() {
  return (
    <group>
      <Cilindro p={[0, 0.03, 0]} r={0.3} h={0.06} cor={COR.cromo} metalness={0.8} roughness={0.25} />
      <Cilindro p={[0, 0.25, 0]} r={0.06} h={0.4} cor={COR.cromo} metalness={0.8} roughness={0.25} />
      <Caixa p={[0, 0.5, 0]} s={[0.58, 0.14, 0.56]} cor={COR.couro} roughness={0.45} />
      <group position={[0, 0.55, 0.27]} rotation={[-0.18, 0, 0]}>
        <Caixa p={[0, 0.38, 0]} s={[0.56, 0.72, 0.12]} cor={COR.couro} roughness={0.45} />
        <Caixa p={[0, 0.84, 0.01]} s={[0.3, 0.16, 0.1]} cor={COR.couro} roughness={0.45} />
      </group>
      {[-1, 1].map((l) => (
        <group key={l}>
          <Caixa p={[l * 0.33, 0.72, 0.02]} s={[0.08, 0.06, 0.5]} cor={COR.couro} />
          <Caixa p={[l * 0.33, 0.62, 0.02]} s={[0.04, 0.16, 0.04]} cor={COR.cromo} metalness={0.8} roughness={0.25} />
        </group>
      ))}
      <group position={[0, 0.3, -0.36]} rotation={[0.5, 0, 0]}>
        <Caixa p={[0, 0, 0]} s={[0.42, 0.04, 0.2]} cor={COR.cromo} metalness={0.8} roughness={0.25} />
      </group>
    </group>
  );
}

/** Espelho com moldura e bancada embaixo (de frente para a cadeira). */
function Bancada() {
  return (
    <group>
      <Caixa p={[0, 0.85, 0]} s={[1.25, 0.08, 0.5]} cor={COR.madeira} />
      <Caixa p={[0, 0.42, 0.02]} s={[1.15, 0.8, 0.42]} cor={COR.preto} />
      <Caixa p={[0, 1.75, -0.19]} s={[1.0, 1.35, 0.06]} cor={COR.preto} />
      <Caixa p={[0, 1.75, -0.155]} s={[0.88, 1.23, 0.02]} cor={COR.espelho} roughness={0.08} metalness={0.55} sombra={false} />
      <Caixa p={[-0.22, 1.9, -0.14]} s={[0.05, 0.9, 0.005]} cor="#ffffff" sombra={false} opacity={0.5} transparent />
    </group>
  );
}

function Ferramentas() {
  return (
    <group position={[0, 0.89, 0.05]}>
      <Caixa p={[-0.35, 0.05, 0]} s={[0.07, 0.1, 0.2]} cor={COR.preto} roughness={0.3} />
      <Caixa p={[-0.35, 0.06, -0.11]} s={[0.06, 0.03, 0.03]} cor={COR.cromo} metalness={0.9} roughness={0.2} />
      <Caixa p={[-0.2, 0.05, 0]} s={[0.07, 0.1, 0.18]} cor="#c8a24a" metalness={0.7} roughness={0.3} />
      <Cilindro p={[0.05, 0.11, 0]} r={0.045} h={0.22} cor={C.acento} />
      <Cilindro p={[0.05, 0.24, 0]} r={0.02} h={0.05} cor={COR.preto} />
      <Caixa p={[0.25, 0.02, 0.02]} s={[0.04, 0.01, 0.22]} cor={COR.cromo} metalness={0.9} roughness={0.2} />
      <Caixa p={[0.3, 0.02, 0.02]} s={[0.04, 0.01, 0.22]} cor={COR.cromo} metalness={0.9} roughness={0.2} />
      <Caixa p={[0.47, 0.05, 0]} s={[0.22, 0.1, 0.22]} cor="#ffffff" />
    </group>
  );
}

function Lavatorio() {
  return (
    <group>
      <Caixa p={[0, 0.4, 0]} s={[0.5, 0.8, 0.6]} cor={COR.preto} />
      <mesh position={[0, 0.86, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[0.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <Cilindro p={[-0.2, 1.0, 0]} r={0.02} h={0.25} cor={COR.cromo} metalness={0.9} roughness={0.2} />
      <group position={[0.75, 0, 0]}>
        <Caixa p={[0, 0.45, 0]} s={[0.6, 0.12, 0.56]} cor={COR.couro} />
        <Caixa p={[0, 0.2, 0]} s={[0.5, 0.4, 0.5]} cor={COR.preto} />
        <group position={[-0.3, 0.5, 0]} rotation={[0, 0, 0.55]}>
          <Caixa p={[0, 0.32, 0]} s={[0.12, 0.66, 0.56]} cor={COR.couro} />
        </group>
        <Caixa p={[0.5, 0.3, 0]} s={[0.5, 0.1, 0.46]} cor={COR.couro} />
      </group>
    </group>
  );
}

function Sofa() {
  return (
    <group>
      <Caixa p={[0, 0.25, 0]} s={[0.8, 0.3, 1.6]} cor="#3f5a46" roughness={0.9} />
      <Caixa p={[-0.32, 0.6, 0]} s={[0.16, 0.5, 1.6]} cor="#3f5a46" roughness={0.9} />
      {[-1, 1].map((l) => (
        <Caixa key={l} p={[0, 0.45, l * 0.82]} s={[0.8, 0.3, 0.14]} cor="#3f5a46" roughness={0.9} />
      ))}
      {[-1, 1].map((l) => (
        <Caixa key={`a${l}`} p={[0.05, 0.43, l * 0.38]} s={[0.66, 0.08, 0.7]} cor="#4c6b54" roughness={0.9} />
      ))}
      <group position={[0, 0, -1.25]}>
        <Cilindro p={[0, 0.25, 0]} r={0.05} h={0.5} cor={COR.preto} />
        <Cilindro p={[0, 0.52, 0]} r={0.28} h={0.04} cor={COR.madeira} />
        <Cilindro p={[0, 0.66, 0]} r={[0.09, 0.07]} h={0.22} cor={C.acento} />
        <mesh position={[0, 0.86, 0]} castShadow>
          <icosahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial color={COR.folha} flatShading />
        </mesh>
      </group>
    </group>
  );
}

function Prateleira() {
  const cores = [C.acento, "#d9b25b", COR.preto, "#ffffff", C.ok, "#c96a52"];
  return (
    <group>
      {[1.25, 1.7].map((y, k) => (
        <group key={y}>
          <Caixa p={[0.13, y, 0]} s={[0.26, 0.04, 0.9]} cor={COR.madeira} />
          {cores.map((c, i) => (
            <Cilindro key={i} p={[0.13, y + 0.09, -0.36 + i * 0.145]} r={0.045} h={0.14 + ((i + k) % 3) * 0.03} cor={c} roughness={0.35} />
          ))}
        </group>
      ))}
    </group>
  );
}

function Luminaria({ v }: { v: number }) {
  return (
    <group>
      <Cilindro p={[0, 2.75, 0]} r={0.008} h={0.5} cor={COR.preto} />
      <mesh position={[0, 2.45, 0]} castShadow>
        <coneGeometry args={[0.2, 0.22, 24, 1, true]} />
        <meshStandardMaterial color={COR.preto} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <mesh position={[0, 2.37, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color="#fff4dd" emissive="#ffd59a" emissiveIntensity={2.5 * Math.min(1, v)} />
      </mesh>
      <pointLight position={[0, 2.25, 0]} intensity={5 * Math.min(1, v)} distance={4.5} color="#ffdcae" />
    </group>
  );
}

/** Canos de PVC saindo do chão e subindo pela parede até o lavatório. */
function Cano() {
  return (
    <group>
      <Cilindro p={[0, 0.5, 0]} r={0.035} h={1.0} cor={COR.cano} />
      <Cilindro p={[0.14, 0.45, 0]} r={0.05} h={0.9} cor="#dcdcd2" />
      <Cilindro p={[0, 1.0, 0.25]} r={0.035} h={0.5} cor={COR.cano} rot={[Math.PI / 2, 0, 0]} />
      <Cilindro p={[0.45, 0.02, 0]} r={0.035} h={0.9} cor={COR.cano} rot={[0, 0, Math.PI / 2]} />
    </group>
  );
}

// ---------- texturas (letreiro e poste de barbeiro) ----------

function desenhaLetreiro(cv: HTMLCanvasElement) {
  const g = cv.getContext("2d")!;
  g.fillStyle = C.escuro;
  g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#f6efe6";
  g.font = `700 112px ${F.serif}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Barbearia", cv.width / 2, cv.height / 2 + 6);
  g.fillStyle = C.acento;
  g.fillRect(0, cv.height - 16, cv.width, 16);
}

/** Letreiro desenhado num canvas; redesenha quando a fonte termina de carregar e pede um quadro novo ao 3D. */
function useLetreiro() {
  const advance = useThree((st) => st.advance);
  const [h] = useState(() => delayRender("letreiro"));
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 1024;
    cv.height = 200;
    desenhaLetreiro(cv);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    const pronto = () => {
      desenhaLetreiro(tex.image as HTMLCanvasElement);
      tex.needsUpdate = true;
      advance(performance.now());
      continueRender(h);
    };
    // espera a fonte do Google entrar em document.fonts (fontesCarregadas): sem isso, às vezes o letreiro saía com a serifa de sistema
    fontesCarregadas()
      .then(() => document.fonts.load(`700 112px ${F.serif}`))
      .then(pronto, pronto);
  }, [tex, h, advance]);
  return tex;
}

function useListras() {
  return useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 64, 256);
    g.fillStyle = C.acento;
    for (let y = -256; y < 512; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(64, y + 64);
      g.lineTo(64, y + 96);
      g.lineTo(0, y + 32);
      g.fill();
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function Fachada({ cadeiras, f }: { cadeiras: number; f: number }) {
  const W = largura(cadeiras);
  const z = FUNDO / 2;
  const letreiro = useLetreiro();
  const listras = useListras();
  listras.offset.y = (f * 0.012) % 1;
  const esq = -W / 2;
  const portaA = PORTA_X - 0.55;
  const portaB = PORTA_X + 0.55;
  const janelaA = portaB + 0.2;
  const janelaB = W / 2 - 0.2;
  return (
    <group>
      <Caixa p={[(esq + portaA) / 2, ALTURA / 2, z]} s={[portaA - esq, ALTURA, 0.15]} cor={COR.parede} />
      <Caixa p={[(portaB + janelaA) / 2, ALTURA / 2, z]} s={[janelaA - portaB, ALTURA, 0.15]} cor={COR.parede} />
      <Caixa p={[(janelaB + W / 2) / 2, ALTURA / 2, z]} s={[W / 2 - janelaB, ALTURA, 0.15]} cor={COR.parede} />
      <Caixa p={[(janelaA + janelaB) / 2, 0.25, z]} s={[janelaB - janelaA, 0.5, 0.15]} cor={COR.parede} />
      <Caixa p={[(esq + W / 2) / 2, 2.7, z]} s={[W, 0.6, 0.15]} cor={COR.parede} />
      {/* vidro da vitrine e da porta */}
      <Caixa p={[(janelaA + janelaB) / 2, 1.45, z]} s={[janelaB - janelaA, 1.9, 0.03]} cor="#cfe0e6" transparent opacity={0.22} roughness={0.05} sombra={false} />
      <Caixa p={[PORTA_X, 1.2, z]} s={[1.1, 2.4, 0.03]} cor="#cfe0e6" transparent opacity={0.28} roughness={0.05} sombra={false} />
      {[portaA, portaB].map((x) => (
        <Caixa key={x} p={[x, 1.2, z + 0.03]} s={[0.05, 2.4, 0.05]} cor={COR.preto} />
      ))}
      <Caixa p={[PORTA_X + 0.4, 1.1, z + 0.08]} s={[0.04, 0.4, 0.04]} cor={COR.cromo} metalness={0.9} roughness={0.2} />
      {/* marquise e letreiro */}
      <Caixa p={[(esq + W / 2) / 2, 2.3, z + 0.25]} s={[W + 0.1, 0.06, 0.45]} cor={COR.preto} />
      <mesh position={[0.2, 2.68, z + 0.1]} castShadow>
        <boxGeometry args={[4.2, 0.8, 0.06]} />
        <meshStandardMaterial attach="material-0" color={C.escuro} />
        <meshStandardMaterial attach="material-1" color={C.escuro} />
        <meshStandardMaterial attach="material-2" color={C.escuro} />
        <meshStandardMaterial attach="material-3" color={C.escuro} />
        <meshStandardMaterial attach="material-4" map={letreiro} emissive="#ffffff" emissiveMap={letreiro} emissiveIntensity={0.35} />
        <meshStandardMaterial attach="material-5" color={C.escuro} />
      </mesh>
      {/* poste de barbeiro */}
      <group position={[esq + 0.45, 0, z + 0.25]}>
        <Cilindro p={[0, 1.95, 0]} r={0.12} h={0.08} cor={COR.cromo} metalness={0.8} roughness={0.25} />
        <mesh position={[0, 1.55, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.72, 28]} />
          <meshStandardMaterial map={listras} emissive="#ffffff" emissiveMap={listras} emissiveIntensity={0.2} />
        </mesh>
        <Cilindro p={[0, 1.15, 0]} r={0.12} h={0.08} cor={COR.cromo} metalness={0.8} roughness={0.25} />
      </group>
    </group>
  );
}

// ---------- personagens ----------

/** Boneco de brinquedo. `fantasma` deixa ele branco e transparente (o cliente que não veio). */
export function Boneco({ p, rot = 0, sentado = false, fantasma, f = 0, avental = C.acento }: { p: [number, number, number]; rot?: number; sentado?: boolean; fantasma?: number; f?: number; avental?: string }) {
  if (fantasma !== undefined && fantasma <= 0.01) return null;
  const tr = fantasma !== undefined ? { transparent: true, opacity: 0.55 * fantasma } : {};
  const cor = (c: string) => (fantasma !== undefined ? "#ffffff" : c);
  const respira = sentado ? 0 : Math.sin(f / 9) * 0.012;
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {sentado ? (
        [-1, 1].map((l) => (
          <group key={l}>
            <Cilindro p={[l * 0.1, 0.62, -0.18]} r={0.075} h={0.36} cor={cor("#2f3a4a")} rot={[Math.PI / 2, 0, 0]} {...tr} />
            <Cilindro p={[l * 0.1, 0.42, -0.36]} r={0.07} h={0.4} cor={cor("#2f3a4a")} {...tr} />
          </group>
        ))
      ) : (
        [-1, 1].map((l) => <Cilindro key={l} p={[l * 0.1, 0.22, 0]} r={0.075} h={0.44} cor={cor("#2f3a4a")} {...tr} />)
      )}
      <group position={[0, (sentado ? 0.62 : 0.44) + respira, sentado ? 0.02 : 0]}>
        <Cilindro p={[0, 0.27, 0]} r={[0.19, 0.22]} h={0.54} cor={cor("#f4efe8")} {...tr} />
        {!fantasma && !sentado && <Caixa p={[0, 0.2, -0.205]} s={[0.34, 0.42, 0.03]} cor={avental} />}
        {[-1, 1].map((l) => (
          <Cilindro key={l} p={[l * 0.26, 0.28, 0]} r={0.06} h={0.42} cor={cor("#f4efe8")} rot={[0, 0, l * 0.12]} {...tr} />
        ))}
        <mesh position={[0, 0.74, 0]} castShadow>
          <sphereGeometry args={[0.21, 28, 20]} />
          <meshStandardMaterial color={cor(COR.pele)} roughness={0.6} {...tr} />
        </mesh>
        {!fantasma && (
          <>
            <mesh position={[0, 0.82, 0.02]} scale={[1.04, 0.72, 1.04]}>
              <sphereGeometry args={[0.21, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={COR.cabelo} roughness={0.8} />
            </mesh>
            {[-1, 1].map((l) => (
              <mesh key={l} position={[l * 0.075, 0.76, -0.19]}>
                <sphereGeometry args={[0.025, 12, 8]} />
                <meshStandardMaterial color="#120d0a" />
              </mesh>
            ))}
            <mesh position={[0, 0.66, -0.17]} rotation={[0.35, 0, 0]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[0.13, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color={COR.cabelo} roughness={0.9} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

function Arvore({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cilindro p={[0, 0.6, 0]} r={[0.08, 0.12]} h={1.2} cor={COR.tronco} />
      {[
        [0, 1.6, 0, 0.75],
        [0.4, 1.3, 0.2, 0.5],
        [-0.35, 1.35, -0.15, 0.55],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={COR.folha} flatShading roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- viagem no tempo (1920 → hoje) ----------

/** a ordem em que as peças mudam de época; cada uma vira no seu pedaço de `epoca` */
export const ORDEM_EPOCA = ["paredes", "piso", "luz", "espelhos", "cadeiras", "ferramentas", "resto"] as const;
const lim01 = (x: number) => Math.min(1, Math.max(0, x));
/** quanto a peça i já virou (0 = 1920, 1 = hoje): cada uma leva 0,28 de `epoca`, começando 0,12 depois da anterior */
const vez = (epoca: number, i: number) => lim01((epoca - i * 0.12) / 0.28);
/** sai devagar e passa um pouco do ponto (o "quique" da peça nova) */
const comQuique = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

const COR_1920 = {
  painel: "#6e4a30",
  parede: "#dcc6a2",
  tabuaA: "#8c5f3c",
  tabuaB: "#7a5134",
  ceu: "#f3d3a0",
  chao: "#8d6c4a",
  sol: "#ffd8a0",
};
const hex = (c: THREE.Color) => `#${c.getHexString()}`;

/** A peça de 1920 encolhe e afunda; depois a de hoje cai do alto e quica (t de 0 a 1). */
function Troca({ t, antes, depois, p = [0, 0, 0], rot = 0 }: { t: number; antes: React.ReactNode; depois: React.ReactNode; p?: [number, number, number]; rot?: number }) {
  const velha = 1 - lim01(t * 2);
  const nova = t <= 0.5 ? 0 : comQuique(lim01((t - 0.5) * 2));
  return (
    <group position={p} rotation={[0, rot, 0]}>
      {velha > 0.002 && (
        <group position={[0, -(1 - velha) * 0.3, 0]} scale={velha}>
          {antes}
        </group>
      )}
      <Surge v={nova}>{depois}</Surge>
    </group>
  );
}

/** Bancada de 1920: armário de madeira com puxadores dourados e o espelho em arco em cima. */
function BalcaoAntigo() {
  const Espelho = OBJETOS_3D.espelho.Comp;
  return (
    <group>
      <Caixa p={[0, 0.85, 0.02]} s={[1.25, 0.06, 0.5]} cor="#a4744c" />
      <Caixa p={[0, 0.41, 0.03]} s={[1.15, 0.82, 0.42]} cor={COR.madeira} />
      {[-0.3, 0.3].map((x) => (
        <React.Fragment key={x}>
          <Caixa p={[x, 0.45, 0.245]} s={[0.46, 0.6, 0.02]} cor="#7b4f33" />
          <Caixa p={[x + (x < 0 ? 0.17 : -0.17), 0.5, 0.26]} s={[0.03, 0.08, 0.02]} cor="#c8a24a" metalness={0.45} roughness={0.32} />
        </React.Fragment>
      ))}
      <group position={[0, 0.88, -0.12]}>
        <Espelho f={0} />
      </group>
    </group>
  );
}

/** Na bancada de 1920: navalha, pente e toalha (um pouco maiores que os de verdade, para aparecerem de longe). */
function FerramentasAntigas({ f }: { f: number }) {
  const { navalha, pente, toalha } = OBJETOS_3D;
  return (
    <group position={[0, 0.88, 0.1]}>
      <group position={[-0.4, 0, 0]} rotation={[0, 0.3, 0]} scale={1.5}>
        <navalha.Comp f={f} />
      </group>
      <group position={[-0.22, 0, 0.02]} rotation={[0, -0.2, 0]} scale={1.5}>
        <pente.Comp f={f} />
      </group>
      <group position={[0.38, 0, 0]} scale={0.9}>
        <toalha.Comp f={f} />
      </group>
    </group>
  );
}

/** Lâmpada de 1920: fio, soquete e a lâmpada nua, com a luz amarela. */
function LampadaAntiga() {
  return (
    <group>
      <Cilindro p={[0, 2.7, 0]} r={0.006} h={0.6} cor={COR.preto} />
      <Cilindro p={[0, 2.38, 0]} r={0.035} h={0.07} cor="#8a6a3a" metalness={0.5} roughness={0.4} />
      <mesh position={[0, 2.29, 0]}>
        <sphereGeometry args={[0.06, 16, 12]} />
        <meshStandardMaterial color="#fff1cf" emissive="#ffc77a" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 2.2, 0]} intensity={3.5} distance={4} color="#ffc98a" />
    </group>
  );
}

/** Banco de espera de 1920: tábuas de madeira. */
function BancoAntigo() {
  return (
    <group>
      <Caixa p={[0, 0.42, 0]} s={[0.5, 0.06, 1.6]} cor="#8c5f3c" />
      <Caixa p={[-0.22, 0.75, 0]} s={[0.06, 0.6, 1.6]} cor="#7a5134" />
      {[-0.7, 0.7].map((z) => (
        <Caixa key={z} p={[0, 0.2, z]} s={[0.44, 0.4, 0.06]} cor={COR.madeira} />
      ))}
    </group>
  );
}

// ---------- a cena inteira ----------

export type EstadoCena = {
  f: number;
  cadeiras: number;
  /** quanto cada peça já apareceu (0 a 1) */
  v: (p: Peca) => number;
  /** quanto cada ladrilho já apareceu (i = coluna, j = linha) */
  ladrilho: (i: number, j: number) => number;
  /** 0 = parede crua, 1 = pintada */
  pintura: number;
  barbeiro: { p: [number, number, number]; rot: number };
  /** 0 a 1: o cliente fantasma sentado na primeira cadeira */
  cliente: number;
  /** viagem no tempo: 0 = 1920, 1 = hoje, peça por peça (sem ela, a barbearia de sempre) */
  epoca?: number;
  /** 0 a 1: a névoa creme engole a cena (para passar de uma cena para outra sem corte seco) */
  nevoa?: number;
};

export function Barbearia3D({ f, cadeiras, v, ladrilho, pintura, barbeiro, cliente, epoca, nevoa }: EstadoCena) {
  const W = largura(cadeiras);
  const D = FUNDO;
  const xs = estacoes(cadeiras);
  const antiga = epoca !== undefined;
  const e = lim01(epoca ?? 1);
  const passo = (p: (typeof ORDEM_EPOCA)[number]) => (antiga ? vez(e, ORDEM_EPOCA.indexOf(p)) : 1);
  const hoje = { fundo: mistura(COR.bruto, COR.fundo, pintura), lado: mistura(COR.bruto, COR.parede, pintura) };
  const cores = antiga ? { fundo: mistura(COR_1920.painel, hex(hoje.fundo), passo("paredes")), lado: mistura(COR_1920.parede, hex(hoje.lado), passo("paredes")) } : hoje;
  // a luz amarelada de 1920 vai ficando branca junto com a época
  const luz = antiga ? { ceu: hex(mistura(COR_1920.ceu, "#fff6ec", e)), chao: hex(mistura(COR_1920.chao, "#b9a48f", e)), sol: hex(mistura(COR_1920.sol, "#ffffff", e)) } : { ceu: "#fff6ec", chao: "#b9a48f", sol: "#ffffff" };
  const n = lim01(nevoa ?? 0);
  // na viagem no tempo a câmera fica dentro da sala: a sombra cobre só ela (mais nítida para as peças pequenas)
  const sombra = antiga ? 7 : 12;
  const piso = passo("piso");
  const cols = Math.round(W / 0.5);
  const lins = Math.round(D / 0.5);
  return (
    <>
      <color attach="background" args={["#efe3d4"]} />
      <fog attach="fog" args={n > 0 ? ["#efe3d4", 22 * Math.pow(1 - n, 3) + 0.01, 55 * Math.pow(1 - n, 3) + 0.02] : ["#efe3d4", 22, 55]} />
      <hemisphereLight args={[luz.ceu, luz.chao, 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[7, 13, 9]}
        intensity={2.1}
        color={luz.sol}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-sombra}
        shadow-camera-right={sombra}
        shadow-camera-top={sombra}
        shadow-camera-bottom={-sombra}
        shadow-bias={-0.0004}
      />

      {/* terreno, calçada e rua */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={COR.chao} roughness={1} />
      </mesh>
      <Caixa p={[0, -0.06, D / 2 + 1.3]} s={[W + 8, 0.1, 2.6]} cor={COR.calcada} sombra={false} />
      <Caixa p={[0, -0.1, D / 2 + 6]} s={[60, 0.04, 6.8]} cor={COR.rua} sombra={false} />
      {Array.from({ length: 12 }, (_, i) => (
        <Caixa key={i} p={[-22 + i * 4, -0.075, D / 2 + 6]} s={[1.8, 0.01, 0.16]} cor="#efe6da" sombra={false} />
      ))}
      <Arvore p={[-W / 2 - 2.6, 0, -2.2]} s={1.2} />
      <Arvore p={[-W / 2 - 3.2, 0, 1.8]} />
      <Arvore p={[W / 2 + 2.6, 0, -3]} s={1.3} />
      <Arvore p={[0.8, 0, -D / 2 - 2.6]} s={1.1} />
      <Arvore p={[-3, 0, -D / 2 - 3.2]} s={0.9} />

      {/* laje e paredes (sempre lá; a pintura muda a cor) */}
      <Caixa p={[0, -0.05, 0]} s={[W, 0.1, D]} cor={COR.concreto} sombra={false} />
      <Caixa p={[0, ALTURA / 2, -D / 2 - 0.075]} s={[W + 0.3, ALTURA, 0.15]} cor={cores.fundo} />
      <Caixa p={[-W / 2 - 0.075, ALTURA / 2, 0]} s={[0.15, ALTURA, D]} cor={cores.lado} />
      <Caixa p={[W / 2 + 0.075, ALTURA / 2, 0]} s={[0.15, ALTURA, D]} cor={cores.lado} />
      {pintura > 0.02 && <Caixa p={[0, 0.06, -D / 2 + 0.01]} s={[W, 0.12, 0.02]} cor={COR.preto} transparent opacity={pintura} />}

      {/* piso xadrez, ladrilho por ladrilho */}
      {Array.from({ length: cols * lins }, (_, k) => {
        const i = k % cols;
        const j = Math.floor(k / cols);
        const s = ladrilho(i, j);
        if (s <= 0.002) return null;
        return (
          <mesh key={k} position={[-W / 2 + 0.25 + i * 0.5, 0.012 + (1 - Math.min(1, s)) * 0.6, -D / 2 + 0.25 + j * 0.5]} scale={[Math.max(0.001, s), 1, Math.max(0.001, s)]} receiveShadow>
            <boxGeometry args={[0.5, 0.024, 0.5]} />
            {/* em 1920, tábuas de madeira (uma cor por fileira) */}
            <meshStandardMaterial
              color={antiga ? mistura(j % 2 ? COR_1920.tabuaA : COR_1920.tabuaB, (i + j) % 2 ? COR.ladrilhoEscuro : COR.ladrilhoClaro, piso) : (i + j) % 2 ? COR.ladrilhoEscuro : COR.ladrilhoClaro}
              roughness={0.35 + 0.4 * (1 - piso)}
            />
          </mesh>
        );
      })}

      {/* trilho de luz e luminárias em cima de cada cadeira */}
      {antiga ? (
        <Troca
          t={passo("luz")}
          antes={xs.map((x) => (
            <group key={x} position={[x, 0, -D / 2 + 1.25]}>
              <LampadaAntiga />
            </group>
          ))}
          depois={
            <>
              <Caixa p={[(xs[0] + xs[xs.length - 1]) / 2, 2.98, -D / 2 + 1.25]} s={[xs[xs.length - 1] - xs[0] + 1.2, 0.05, 0.05]} cor={COR.preto} />
              {xs.map((x) => (
                <group key={x} position={[x, 0, -D / 2 + 1.25]}>
                  <Luminaria v={1} />
                </group>
              ))}
            </>
          }
        />
      ) : (
        <Surge v={v("luz")} p={[0, 0, 0]} cai={0.8}>
          <Caixa p={[(xs[0] + xs[xs.length - 1]) / 2, 2.98, -D / 2 + 1.25]} s={[xs[xs.length - 1] - xs[0] + 1.2, 0.05, 0.05]} cor={COR.preto} />
          {xs.map((x) => (
            <group key={x} position={[x, 0, -D / 2 + 1.25]}>
              <Luminaria v={v("luz")} />
            </group>
          ))}
        </Surge>
      )}

      <Surge v={v("cano")} p={[-W / 2 + 0.06, 0, -1.6]} cai={0.6}>
        <Cano />
      </Surge>

      {/* viagem no tempo: cada estação troca a cadeira, a bancada e as ferramentas de 1920 pelas de hoje */}
      {antiga &&
        xs.map((x) => (
          <React.Fragment key={x}>
            <Troca t={passo("cadeiras")} p={[x, 0, -D / 2 + 1.55]} rot={Math.PI} antes={<OBJETOS_3D.cadeiraAntiga.Comp f={f} />} depois={<OBJETOS_3D.cadeiraModerna.Comp f={f} />} />
            <Troca t={passo("espelhos")} p={[x, 0, -D / 2 + 0.25]} antes={<BalcaoAntigo />} depois={<Bancada />} />
            <Troca t={passo("ferramentas")} p={[x, 0, -D / 2 + 0.25]} antes={<FerramentasAntigas f={f} />} depois={<Ferramentas />} />
          </React.Fragment>
        ))}
      {antiga && (
        <group position={[xs[xs.length - 1] + 1.15, 0, -D / 2 + 0.45]}>
          <OBJETOS_3D.poste.Comp f={f} />
        </group>
      )}
      {!antiga && xs.map((x, i) => (
        <React.Fragment key={x}>
          <Surge v={v("cadeiras")} p={[x, 0, -D / 2 + 1.55]}>
            <CadeiraBarbeiro />
          </Surge>
          <Surge v={v("espelhos")} p={[x, 0, -D / 2 + 0.25]}>
            <Bancada />
          </Surge>
          <Surge v={v("ferramentas")} p={[x, 0, -D / 2 + 0.25]} cai={0.5}>
            <Ferramentas />
          </Surge>
          {i === 0 && cliente > 0.01 && <Boneco p={[x, 0, -D / 2 + 1.55]} sentado fantasma={cliente} />}
        </React.Fragment>
      ))}

      <Surge v={antiga ? (passo("resto") <= 0.5 ? 0 : comQuique(lim01((passo("resto") - 0.5) * 2))) : v("lavatorio")} p={[-W / 2 + 0.4, 0, -1.6]}>
        <Lavatorio />
      </Surge>
      <Surge v={v("produtos")} p={[-W / 2, 0, -0.3]} cai={0.6}>
        <Prateleira />
      </Surge>
      {antiga ? (
        <Troca t={passo("resto")} p={[-W / 2 + 0.45, 0, 1.9]} antes={<BancoAntigo />} depois={<Sofa />} />
      ) : (
        <Surge v={v("recepcao")} p={[-W / 2 + 0.45, 0, 1.9]}>
          <Sofa />
        </Surge>
      )}
      <Surge v={v("fachada")} p={[0, 0, 0]} cai={2.2}>
        <Fachada cadeiras={cadeiras} f={f} />
      </Surge>

      <Boneco p={barbeiro.p} rot={barbeiro.rot} f={f} />
    </>
  );
}
