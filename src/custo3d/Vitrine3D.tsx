import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, F } from "../base";
import type { VarianteObjeto } from "../motion/Objetos";
import { entre, mola, sai } from "../motor/util";
import { Cilindro } from "./Barbearia3D";
import { CenaFio3D, FOV_FIO3D } from "./Fio3D";
import { OBJETOS_3D, enquadramento, type Objeto3D } from "./Objetos3D";

/**
 * Vitrine para conferir a coleção de objetos 3D: cada objeto gira 3 s num pedestal, com a câmera passeando devagar.
 * Os que se abrem (com `partes`) abrem e fecham no meio dos 3 s.
 *
 * Props para um quadro parado: `so` mostra só um objeto o tempo todo, `aberto` fixa a abertura (0 a 1) e
 * `variante` troca o desenho do poste ("vermelhoBranco").
 *
 * No fim vem a tomada do Fio (4 s): o celular 3D com 3 telas, as 3 frases e o fecho. `so: "fio"` mostra só ela
 * (quadros 0 a 119). As telas vêm de public/motor/teste-fio3d/tela-1..3.png (ignoradas pelo git; copie de
 * out/telas/ antes) ou de `telas` nas props.
 */

export type PropsVitrine3D = { so?: Objeto3D | "fio" | null; aberto?: number | null; variante?: VarianteObjeto | null; telas?: string[] | null };

const ORDEM: Objeto3D[] = ["poste", "cadeiraAntiga", "cadeiraModerna", "maquina", "navalha", "tesoura", "espelho", "toalha", "pente"];
const POR = 90;
const POR_FIO = 120;
export const DURACAO_VITRINE = ORDEM.length * POR + POR_FIO;

const TELAS_TESTE = ["motor/teste-fio3d/tela-1.png", "motor/teste-fio3d/tela-2.png", "motor/teste-fio3d/tela-3.png"];
const FRASES_TESTE = ["Agenda aberta 24 horas pelo link", "Lembrete no WhatsApp antes do horário", "Você vê o dia inteiro num lugar só"];

/** A tomada do Fio na vitrine: celular trocando de tela, frases entrando e o fecho a partir do quadro 70. */
function TomadaFio({ t, telas }: { t: number; telas: string[] }) {
  const quando = [0, 34, 54];
  return (
    <AbsoluteFill style={{ background: "#efe3d4" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: FOV_FIO3D, near: 0.1, far: 100, position: [0, 0, 5.6] }} gl={{ antialias: true }}>
        <CenaFio3D
          f={t}
          telas={telas.map((src, i) => ({ de: quando[i] ?? i * 20, src }))}
          frases={FRASES_TESTE.map((texto, i) => ({ de: 14 + i * 16, texto }))}
          entrada={0}
          final={70}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
}

const NOMES: Record<Objeto3D, string> = {
  poste: "Poste de barbeiro",
  cadeiraAntiga: "Cadeira antiga",
  cadeiraModerna: "Cadeira moderna",
  maquina: "Máquina",
  navalha: "Navalha",
  tesoura: "Tesoura",
  espelho: "Espelho",
  toalha: "Toalha quente",
  pente: "Pente",
};

/** Todo objeto aparece com esta altura na vitrine (a escala compensa o tamanho de verdade). */
const ALTURA_VITRINE = 1.6;
const FOV = 30;

type V3 = [number, number, number];

function Camera({ pos, alvo }: { pos: V3; alvo: V3 }) {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...alvo));
  camera.updateProjectionMatrix();
  return null;
}

export function Vitrine3D({ so, aberto, variante, telas }: PropsVitrine3D) {
  const f = useCurrentFrame();
  if (so === "fio") return <TomadaFio t={f} telas={telas ?? TELAS_TESTE} />;
  if (!so && f >= ORDEM.length * POR) return <TomadaFio t={f - ORDEM.length * POR} telas={telas ?? TELAS_TESTE} />;
  return <VitrineObjeto f={f} so={so ?? null} aberto={aberto} variante={variante} />;
}

function VitrineObjeto({ f, so, aberto, variante }: { f: number; so: Objeto3D | null; aberto?: number | null; variante?: VarianteObjeto | null }) {
  const nome: Objeto3D = so ?? ORDEM[Math.min(ORDEM.length - 1, Math.floor(f / POR))];
  const t = f % POR;
  const obj = OBJETOS_3D[nome];
  const q = enquadramento(nome);

  // abre e fecha no meio dos 3 s (ou fica no valor pedido)
  const a = aberto ?? (obj.partes ? entre(t, 28, 44, [0, 1], sai) - entre(t, 68, 82, [0, 1], sai) : 0);

  // escala e enquadramento
  const s = ALTURA_VITRINE / obj.altura;
  const h = (obj.altura + ((q.alturaAberta ?? obj.altura) - obj.altura) * a) * s;
  const w = (q.largura + ((q.larguraAberta ?? q.largura) - q.largura) * a) * s;
  const visivel = Math.max(h, w / (1080 / 1920)) / 0.6;
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
  const dist = (visivel / (2 * tan)) * (1.06 - 0.06 * entre(t, 0, POR));
  const giroCam = 0.25 - 0.12 * entre(t, 0, POR);
  const sobe = 0.2;
  const alvo: V3 = [0, h * 0.42, 0];
  const pos: V3 = [Math.sin(giroCam) * Math.cos(sobe) * dist, alvo[1] + Math.sin(sobe) * dist, Math.cos(giroCam) * Math.cos(sobe) * dist];

  // o objeto gira no pedestal; entra com mola e sai encolhendo (só quando passa a coleção inteira)
  const giro = -0.5 + t * 0.025;
  const entra = so ? 1 : mola(t, 0, { damping: 13 }) * (1 - entre(t, POR - 8, POR));
  const raio = Math.max(w * 0.6, 0.55) + 0.1;

  return (
    <AbsoluteFill style={{ background: "#efe3d4" }}>
      <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: FOV, near: 0.05, far: 200, position: pos }} gl={{ antialias: true }}>
        <Camera pos={pos} alvo={alvo} />
        <color attach="background" args={["#efe3d4"]} />
        <fog attach="fog" args={["#efe3d4", 14, 40]} />
        <hemisphereLight args={["#fff6ec", "#b9a48f", 1.1]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[3, 6, 4.5]}
          intensity={2.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-bias={-0.0004}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#e8dccb" roughness={1} />
        </mesh>
        {/* pedestal */}
        <Cilindro p={[0, -0.045, 0]} r={raio + 0.03} h={0.07} cor={C.acento} />
        <Cilindro p={[0, -0.035, 0]} r={raio} h={0.07} cor="#f4ece2" roughness={0.8} />
        <group rotation={[0, giro, 0]} scale={Math.max(0.001, entra * s)}>
          <obj.Comp f={f} aberto={a} variante={variante ?? undefined} />
        </group>
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 110, textAlign: "center", fontFamily: F.sans, color: C.texto }}>
        <div style={{ fontWeight: 800, fontSize: 64 }}>{NOMES[nome]}</div>
        {obj.partes && (
          <div style={{ marginTop: 14, fontWeight: 600, fontSize: 36, color: C.texto2, opacity: entre(a, 0.4, 0.9) }}>{obj.partes.join(" · ")}</div>
        )}
      </div>
    </AbsoluteFill>
  );
}
