import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../base";
import { LegendaDinamica, montarBlocos } from "../motion/LegendaDinamica";
import { ANTES, limpa, quadro, type Tempos } from "../motor/roteiro";
import { Som, ease, entre, mola, sai } from "../motor/util";
import { Barbearia3D, Cilindro, estacoes } from "./Barbearia3D";
import { CenaFio3D, FOV_FIO3D, PX, Placa, useCartao, useFontesProntas, type Cartao } from "./Fio3D";
import { OBJETOS_3D, enquadramento, type Objeto3D } from "./Objetos3D";
import { quadrosDosPlanos, type Plano3D, type RoteiroAtracao3D } from "./atracao";

/**
 * Vídeo 3D de atração: um plano por vez no palco 3D, com câmera de cinema (deriva devagar e mistura as tomadas),
 * depois a ponte (a câmera se afasta), a parte do Fio (CenaFio3D: celular 3D com as telas do app e as 3 frases) e o
 * fecho (Final3D, com a chamada dupla). Só a legenda dinâmica é 2D, por cima; etiquetas, partes e anos são placas 3D.
 *
 * Planos:
 * - vitrine: o objeto gira no pedestal e as etiquetas entram (empilhadas embaixo dele) no tempo de cada uma;
 * - porDentro: o objeto se abre em `abre` e cada parte ganha uma placa ao lado, com uma linha até a peça;
 * - viagemNoTempo: a barbearia de 1920 vira a de hoje (Barbearia3D com `epoca`), peça por peça, a partir de `vira`,
 *   com a placa do ano no alto virando de `anos[0]` para `anos[1]`.
 *
 * Layout (px do vídeo 1080x1920): objeto entre y ≈ 170 e 1000, etiquetas de 1000 a 1290, legenda de 1330 a 1430.
 * Entre cenas de tipo diferente (pedestal ↔ barbearia, e a entrada do Fio) a névoa creme engole a cena e a próxima
 * nasce dela, sem corte seco.
 */

export type PropsAtracao3D = { roteiro: RoteiroAtracao3D | null; tempos: Tempos | null; voz: string | null; musica: string | null };

type V3 = [number, number, number];
type Tomada = { pos: V3; alvo: V3; fov: number };

const FUNDO = "#efe3d4";
const LEGENDA_Y = 1330;
/** fov do pedestal e da barbearia */
const FOV_PEDESTAL = 30;
const FOV_BARBEARIA = 50;
/** todo objeto aparece com esta altura no pedestal (a escala compensa o tamanho de verdade) */
const ALTURA_PEDESTAL = 1.6;
/** a altura do objeto ocupa esta parte da tela, e o centro dele fica em CENTRO_Y (px) */
const OCUPA = 0.4;
const CENTRO_Y = 560;
/** as etiquetas da vitrine: a primeira vaga (centro, px) e a distância entre elas */
const ETIQUETA_Y = 1078;
const ETIQUETA_PASSO = 86;
/** o pedaço de tela livre para o objeto na largura (px) */
const LARGURA_LIVRE = 820;
/** quadros da névoa entre cenas de tipo diferente (metade antes, metade depois) */
const NEVOA = 12;
/** a barbearia da viagem no tempo */
const CADEIRAS = 2;

const tipoDe = (p: Plano3D) => (p.modo === "viagemNoTempo" ? "barbearia" : "pedestal");
const misturaV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const misturaT = (a: Tomada, b: Tomada, t: number): Tomada => ({ pos: misturaV(a.pos, b.pos, t), alvo: misturaV(a.alvo, b.alvo, t), fov: a.fov + (b.fov - a.fov) * t });
const lim01 = (x: number) => Math.min(1, Math.max(0, x));

// ---------- o que acontece em cada plano (em quadros) ----------

type PlanoQ = {
  plano: Plano3D;
  de: number;
  ate: number;
  /** o objeto do pedestal (vitrine e porDentro) */
  objeto?: Objeto3D;
  /** quando o objeto abre (porDentro) */
  abre?: number;
  /** placas: etiquetas (vitrine) ou partes (porDentro), com o índice da âncora da parte */
  placas: { em: number; texto: string; ancora?: number }[];
  /** viagem no tempo: começo e fim da troca de época */
  vira?: [number, number];
};

function planosEmQuadros(r: RoteiroAtracao3D, t: Tempos): PlanoQ[] {
  return quadrosDosPlanos(r, t).map(({ plano: p, de, ate }) => {
    if (p.modo === "vitrine") return { plano: p, de, ate, objeto: p.objeto, placas: (p.etiquetas ?? []).map((e) => ({ em: quadro(t, e.em), texto: e.texto })) };
    if (p.modo === "porDentro") {
      const abre = quadro(t, p.abre);
      const nomes = OBJETOS_3D[p.objeto].partes ?? [];
      // sem partes no roteiro, as partes de OBJETOS_3D entram uma a uma depois de abrir
      const partes = p.partes?.length ? p.partes.map((x) => ({ em: quadro(t, x.em), texto: x.texto })) : nomes.map((texto, k) => ({ em: abre + 24 + k * 20, texto }));
      return {
        plano: p,
        de,
        ate,
        objeto: p.objeto,
        abre,
        placas: partes.map((x, k) => {
          const achou = nomes.findIndex((n) => limpa(n) === limpa(x.texto));
          return { ...x, ancora: achou >= 0 ? achou : k < nomes.length ? k : undefined };
        }),
      };
    }
    const vira = quadro(t, p.vira);
    return { plano: p, de, ate, placas: [], vira: [vira, vira + Math.max(60, Math.min(180, ate - vira - 24))] };
  });
}

// ---------- câmera ----------

function Camera({ pos, alvo, fov }: Tomada) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.fov = fov;
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...alvo));
  camera.updateProjectionMatrix();
  return null;
}

/** A mesma câmera, só para as contas (projetar um ponto na tela, achar o ponto do mundo de um pixel). */
function cameraDeConta(tm: Tomada) {
  const cam = new THREE.PerspectiveCamera(tm.fov, 1080 / 1920, 0.05, 200);
  cam.position.set(...tm.pos);
  cam.lookAt(new THREE.Vector3(...tm.alvo));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

/** px do vídeo de um ponto do mundo */
function naTela(cam: THREE.PerspectiveCamera, p: THREE.Vector3): [number, number] {
  const n = p.clone().project(cam);
  return [((n.x + 1) / 2) * 1080, ((1 - n.y) / 2) * 1920];
}

/** O ponto do mundo que aparece no pixel (x, y) a `d` da câmera, a escala para 1 px valer 1 px e a rotação da câmera. */
function noPixel(cam: THREE.PerspectiveCamera, x: number, y: number, d: number) {
  const k = (2 * d * Math.tan(((cam.fov / 2) * Math.PI) / 180)) / 1920;
  const frente = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const direita = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
  const cima = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const p = cam.position.clone().addScaledVector(frente, d).addScaledVector(direita, (x - 540) * k).addScaledVector(cima, (960 - y) * k);
  return { p, k, q: cam.quaternion.clone() };
}

// ---------- pedestal (vitrine e porDentro) ----------

/** tamanho na tela do objeto (já na escala do pedestal), com a abertura `a` */
function medida(nome: Objeto3D, a: number) {
  const obj = OBJETOS_3D[nome];
  const q = enquadramento(nome);
  const s = ALTURA_PEDESTAL / obj.altura;
  const h = (obj.altura + ((q.alturaAberta ?? obj.altura) - obj.altura) * a) * s;
  const w = (q.largura + ((q.larguraAberta ?? q.largura) - q.largura) * a) * s;
  return { s, h, w };
}

/**
 * Jeitos de olhar o pedestal: cada plano de pedestal usa o próximo da lista, para a câmera mudar de lugar a cada plano
 * (mesmo quando o objeto é o mesmo). `giro` = de onde começa (rad, gira devagar em direção à frente), `sobe` = altura
 * do olhar (rad), `perto` = quanto chega mais perto.
 */
const JEITOS = [
  { giro: 0.22, sobe: 0.16, perto: 1 },
  { giro: -0.42, sobe: 0.3, perto: 0.94 },
  { giro: 0.5, sobe: 0.1, perto: 0.97 },
] as const;

/** A tomada do pedestal: o objeto no alto da tela, a câmera girando devagar em volta (t = quadros desde o começo do plano). */
function tomadaPedestal(nome: Objeto3D, a: number, t: number, jeito = 0): Tomada {
  const j = JEITOS[jeito % JEITOS.length];
  const { h, w } = medida(nome, a);
  const tan = Math.tan(((FOV_PEDESTAL / 2) * Math.PI) / 180);
  const visivel = Math.max(h / OCUPA, w / ((1080 / 1920) * (LARGURA_LIVRE / 1080)));
  const dist = (visivel / (2 * tan)) * (1.05 - 0.05 * lim01(t / 240)) * j.perto;
  const giro = j.giro - Math.sign(j.giro) * 0.0012 * Math.min(t, 300);
  const sobe = j.sobe;
  // o centro do objeto fica em CENTRO_Y: o alvo (o meio da tela) fica abaixo dele
  const alvo: V3 = [0, h / 2 - ((960 - CENTRO_Y) / 1920) * visivel, 0];
  return { pos: [Math.sin(giro) * Math.cos(sobe) * dist, alvo[1] + Math.sin(sobe) * dist, Math.cos(giro) * Math.cos(sobe) * dist], alvo, fov: FOV_PEDESTAL };
}

/** quanto o objeto do plano k está aberto no quadro f */
function abertura(planos: PlanoQ[], k: number, f: number) {
  const p = planos[k];
  if (p.abre !== undefined) return entre(f, p.abre, p.abre + 22, [0, 1], sai);
  // vitrine logo depois de um porDentro do mesmo objeto: fecha devagar
  const antes = planos[k - 1];
  if (antes?.abre !== undefined && antes.objeto === p.objeto) return 1 - entre(f, p.de, p.de + 18, [0, 1], sai);
  return 0;
}

/** giro do objeto no pedestal: as peças redondas dão a volta; as chatas e as abertas só balançam em volta da frente */
function giroDoObjeto(nome: Objeto3D, a: number, t: number) {
  const volta = -0.5 + t * 0.02;
  const balanca = 0.42 * Math.sin(t / 48);
  if (enquadramento(nome).gira === "balanca") return balanca;
  // aberto, volta para perto da frente (para as partes ficarem à vista)
  return volta * (1 - a) + 0.3 * Math.sin(t / 60) * a;
}

const CARTAO_ETIQUETA = (texto: string): Cartao => ({ trechos: [{ t: texto, cor: C.texto, peso: 800 }], tam: 44, largura: 760, ajusta: true, fundo: "#ffffff", barra: C.acento, padX: 30, padY: 20, raio: 24 });
const CARTAO_PARTE = (texto: string): Cartao => ({ trechos: [{ t: texto, cor: "#ffffff", peso: 800 }], tam: 52, largura: 420, ajusta: true, fundo: C.escuro, padX: 32, padY: 22, raio: 26 });

/** Uma placa 3D presa na frente da câmera, no pixel (x, y), entrando com mola. */
function PlacaNaTela({ cam, x, y, d, cartao, s, cor }: { cam: THREE.PerspectiveCamera; x: number; y: number; d: number; cartao: NonNullable<ReturnType<typeof useCartao>>; s: number; cor?: string }) {
  // a posição não passa do ponto (só o giro quica), para a placa não sair da tela
  const sl = Math.min(1, s);
  const { p, k, q } = noPixel(cam, x, y + (1 - sl) * 40, d);
  const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler((1 - s) * -1.1, 0, 0));
  return (
    <group position={p} quaternion={q.multiply(giro)} scale={Math.max(0.001, (k / PX) * (0.55 + 0.45 * sl))}>
      <Placa cartao={cartao} cor={cor} sombra={false} />
    </group>
  );
}

/** Linha fina (cilindro) entre dois pontos do mundo, com uma bolinha na ponta da peça. */
function Linha({ a, b, r }: { a: THREE.Vector3; b: THREE.Vector3; r: number }) {
  const meio = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group>
      <mesh position={meio} quaternion={q}>
        <cylinderGeometry args={[r, r, dir.length(), 8]} />
        <meshBasicMaterial color={C.escuro} toneMapped={false} />
      </mesh>
      <mesh position={b}>
        <sphereGeometry args={[r * 3.2, 14, 10]} />
        <meshBasicMaterial color={C.acento} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Etiqueta({ cam, d, texto, em, f, vaga, some }: { cam: THREE.PerspectiveCamera; d: number; texto: string; em: number; f: number; vaga: number; some: number }) {
  const pronto = useFontesProntas("etiquetas 3D");
  const cartao = useCartao(CARTAO_ETIQUETA(texto), pronto);
  if (!cartao || f < em || some >= 1) return null;
  const s = mola(f, em, { damping: 12, stiffness: 170 }) * (1 - some);
  return <PlacaNaTela cam={cam} x={540} y={ETIQUETA_Y + vaga * ETIQUETA_PASSO} d={d} cartao={cartao} s={s} />;
}

type ParteNaTela = { texto: string; em: number; ancora?: THREE.Vector3; px?: [number, number] };

function Parte({ cam, d, parte, f, y, lado, some }: { cam: THREE.PerspectiveCamera; d: number; parte: ParteNaTela; f: number; y: number; lado: -1 | 1; some: number }) {
  const pronto = useFontesProntas("partes 3D");
  const cartao = useCartao(CARTAO_PARTE(parte.texto), pronto);
  if (!cartao || f < parte.em || some >= 1) return null;
  const s = mola(f, parte.em, { damping: 12, stiffness: 170 }) * (1 - some);
  const wPx = cartao.w / PX;
  const x = lado < 0 ? 44 + wPx / 2 : 1036 - wPx / 2;
  // a linha sai da beirada de dentro da placa até a peça
  const linha = entre(f, parte.em + 4, parte.em + 14) * (1 - some);
  const borda = noPixel(cam, x - lado * (wPx / 2), y, d).p;
  return (
    <>
      <PlacaNaTela cam={cam} x={x} y={y} d={d} cartao={cartao} s={s} cor={C.escuro} />
      {parte.ancora && linha > 0.01 && <Linha a={borda} b={borda.clone().lerp(parte.ancora, linha)} r={noPixel(cam, 540, 960, d).k * 2.2} />}
    </>
  );
}

/** Distribui as placas das partes dos dois lados, perto da altura da peça, sem uma encostar na outra. */
function vagasDasPartes(partes: ParteNaTela[]) {
  const ALTURA = 112;
  const ys = partes.map((p, i) => Math.min(1240, Math.max(200, p.px?.[1] ?? 300 + i * 160)));
  // a peça bem à esquerda ou à direita leva a placa para o seu lado; as do meio vão para a direita (até 3 placas)
  const lados: (-1 | 1)[] = [];
  const conta = { [-1]: 0, [1]: 0 } as Record<-1 | 1, number>;
  partes.map((_, i) => i).sort((a, b) => ys[a] - ys[b]).forEach((i) => {
    const x = partes[i].px?.[0] ?? 540;
    const lado: -1 | 1 = x < 470 ? -1 : x > 610 ? 1 : conta[1] < 3 ? 1 : -1;
    lados[i] = lado;
    conta[lado]++;
  });
  for (const lado of [-1, 1] as const) {
    const idx = partes.map((_, i) => i).filter((i) => lados[i] === lado).sort((a, b) => ys[a] - ys[b]);
    for (let k = 1; k < idx.length; k++) ys[idx[k]] = Math.max(ys[idx[k]], ys[idx[k - 1]] + ALTURA);
  }
  return partes.map((_, i) => ({ y: ys[i], lado: lados[i] }));
}

function Pedestal({ planos, k, f, cam, tm, some, nevoa }: { planos: PlanoQ[]; k: number; f: number; cam: THREE.PerspectiveCamera; tm: Tomada; some: number; nevoa: number }) {
  const p = planos[k];
  const nome = p.objeto!;
  const t = f - p.de;
  const a = abertura(planos, k, f);
  const { s, w } = medida(nome, a);
  const q = enquadramento(nome);
  const Obj = OBJETOS_3D[nome].Comp;

  // troca de objeto: o anterior encolhe girando, o novo nasce com mola (o mesmo objeto continua, sem troca)
  const anterior = planos[k - 1];
  const troca = anterior && anterior.objeto && anterior.objeto !== nome && tipoDe(anterior.plano) === "pedestal";
  const entra = k === 0 ? mola(f, 0, { damping: 14 }) : troca ? mola(f, p.de, { damping: 13 }) : 1;
  const proximo = planos[k + 1];
  const saiObj = proximo && proximo.objeto && proximo.objeto !== nome && tipoDe(proximo.plano) === "pedestal" ? entre(f, proximo.de - 10, proximo.de, [0, 1], ease) : 0;
  const escala = Math.max(0.001, entra * (1 - saiObj)) * s;
  const giro = giroDoObjeto(nome, a, t) + saiObj * 2.5;
  const inclina = (q.inclina ?? 0) * (1 - a);
  const raio = Math.max(w * 0.62, 0.55) + 0.1;
  const dist = Math.hypot(tm.pos[0] - tm.alvo[0], tm.pos[1] - tm.alvo[1], tm.pos[2] - tm.alvo[2]);
  // as placas ficam bem perto da câmera: com a câmera baixa, mais longe o chão passava na frente das de baixo
  const dPlaca = dist * 0.33;

  // partes: a âncora (em metros, objeto aberto) vai para o mundo com o giro e a escala do objeto
  const ancoras = q.ancoras ?? [];
  const partes: ParteNaTela[] = p.placas.map((x) => {
    if (p.abre === undefined || x.ancora === undefined || !ancoras[x.ancora]) return { texto: x.texto, em: x.em };
    const v = new THREE.Vector3(...ancoras[x.ancora]).applyEuler(new THREE.Euler(inclina, giro, 0)).multiplyScalar(escala);
    return { texto: x.texto, em: x.em, ancora: v, px: naTela(cam, v) };
  });
  const vagas = p.abre !== undefined ? vagasDasPartes(partes) : [];

  // névoa: some com a cena (entre cenas de tipo diferente e na entrada do Fio)
  const n = nevoa;
  return (
    <>
      <color attach="background" args={[FUNDO]} />
      <fog attach="fog" args={[FUNDO, (dist + 2) * (1 - n), (dist + 14) * (1 - n) + dist * 0.3 * n]} />
      <hemisphereLight args={["#fff6ec", "#b9a48f", 1.1]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 6, 4.5]}
        intensity={2.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-2.2}
        shadow-camera-right={2.2}
        shadow-camera-top={2.2}
        shadow-camera-bottom={-2.2}
        shadow-bias={-0.0004}
      />
      {/* luz de contorno por trás: separa as peças escuras (a máquina fechada) do fundo */}
      <directionalLight position={[-2.5, 3.5, -4]} intensity={1.6} color="#ffe2cc" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#e8dccb" roughness={1} />
      </mesh>
      <Cilindro p={[0, -0.045, 0]} r={raio + 0.03} h={0.07} cor={C.acento} />
      <Cilindro p={[0, -0.035, 0]} r={raio} h={0.07} cor="#f4ece2" roughness={0.8} />
      <group rotation={[inclina, giro, 0]} scale={escala}>
        <Obj f={f} aberto={a} />
      </group>
      {/* etiquetas (vitrine) empilhadas embaixo do objeto: até 3, a mais velha sai */}
      {p.abre === undefined &&
        p.placas.map((x, i) => {
          const entraram = p.placas.filter((y) => f >= y.em).length;
          const primeira = Math.max(0, entraram - 3);
          if (i < primeira) return null;
          return <Etiqueta key={`${i}-${x.texto}`} cam={cam} d={dPlaca} texto={x.texto} em={x.em} f={f} vaga={i - primeira} some={some} />;
        })}
      {/* partes (porDentro) dos dois lados, com a linha até a peça */}
      {p.abre !== undefined && partes.map((x, i) => <Parte key={`${i}-${x.texto}`} cam={cam} d={dPlaca} parte={x} f={f} y={vagas[i].y} lado={vagas[i].lado} some={some} />)}
    </>
  );
}

// ---------- viagem no tempo ----------

const CAMERA_VIAGEM: V3 = [-3.0, 2.15, 1.2];
/** para onde a câmera olha: baixo o bastante para a faixa da legenda (y 1330 a 1430) cair no piso, não no barbeiro */
const ALVO_VIAGEM: V3 = [0.4, 0.72, -2.0];
/**
 * o barbeiro fica de pé entre as duas estações, perto da parede do fundo, olhando para a câmera: um pouco para o lado
 * da 2ª, para o encosto alto da cadeira de 1920 não o esconder, sem chegar a tapar a 2ª estação
 */
const BARBEIRO_VIAGEM: V3 = [(estacoes(CADEIRAS)[0] + estacoes(CADEIRAS)[1]) / 2 + 0.35, 0, -2.0];
/** na ponte, a câmera sobe por cima das paredes até ver a sala de cima (casa de boneca) */
const VIAGEM_DE_CIMA: Tomada = { pos: [5.5, 9.5, 9], alvo: [0, 0.6, -0.5], fov: FOV_BARBEARIA };

function tomadaBarbearia(t: number): Tomada {
  // de lado, pela esquerda: as cadeiras de perfil (a de porcelana mostra o pé) e os espelhos na parede do fundo
  const base: Tomada = { pos: CAMERA_VIAGEM, alvo: ALVO_VIAGEM, fov: FOV_BARBEARIA };
  // deriva: gira devagar em volta do alvo e chega um pouco mais perto
  const a = Math.min(0.2, Math.max(0, t) * 0.0011);
  const dx = base.pos[0] - base.alvo[0];
  const dz = base.pos[2] - base.alvo[2];
  const perto = 1 - Math.min(0.08, Math.max(0, t) * 0.0004);
  return { ...base, pos: [base.alvo[0] + (dx * Math.cos(a) + dz * Math.sin(a)) * perto, base.pos[1] - Math.min(0.25, t * 0.0012), base.alvo[2] + (-dx * Math.sin(a) + dz * Math.cos(a)) * perto] };
}

/** a placa do ano: a de antes escura com letra creme (some no painel de madeira se for marrom), a de hoje branca com letra terracota (a parede de hoje é terracota) */
const ANO_ANTES = C.escuro;
const ANO_HOJE = "#ffffff";
const CARTAO_ANO = (texto: string, frente: boolean): Cartao => ({
  trechos: [{ t: texto, cor: frente ? "#f6e7d3" : C.acento, peso: 800 }],
  tam: 104,
  largura: 700,
  ajusta: true,
  centro: true,
  fundo: frente ? ANO_ANTES : ANO_HOJE,
  padX: 60,
  padY: 22,
  raio: 34,
});

/** A placa do ano no alto da tela: gira no próprio eixo e mostra o outro ano atrás. */
function PlacaAno({ cam, anos, de, vira, f, some }: { cam: THREE.PerspectiveCamera; anos: [string, string]; de: number; vira: number; f: number; some: number }) {
  const pronto = useFontesProntas("anos 3D");
  const antes = useCartao(CARTAO_ANO(anos[0], true), pronto);
  const depois = useCartao(CARTAO_ANO(anos[1], false), pronto);
  if (!antes || !depois || some >= 1) return null;
  const entra = mola(f, de + 4, { damping: 13 }) * (1 - some);
  const gira = mola(f, vira, { damping: 11, stiffness: 120 });
  const d = 2.2;
  const { p, k, q } = noPixel(cam, 540, 255, d);
  return (
    <group position={p} quaternion={q} scale={Math.max(0.001, (k / PX) * entra)}>
      <group rotation={[0, gira * Math.PI, 0]}>
        <Placa cartao={antes} cor={ANO_ANTES} />
        <group rotation={[0, Math.PI, 0]} position={[0, 0, -0.06]}>
          <Placa cartao={depois} cor={ANO_HOJE} />
        </group>
      </group>
    </group>
  );
}

function Viagem({ p, f, cam, some, nevoa }: { p: PlanoQ; f: number; cam: THREE.PerspectiveCamera; some: number; nevoa: number }) {
  const [v0, v1] = p.vira!;
  const epoca = entre(f, v0, v1, [0, 1], (x) => x);
  const plano = p.plano as Extract<Plano3D, { modo: "viagemNoTempo" }>;
  return (
    <>
      <Barbearia3D
        f={f}
        cadeiras={CADEIRAS}
        v={() => 1}
        ladrilho={() => 1}
        pintura={1}
        barbeiro={{ p: BARBEIRO_VIAGEM, rot: Math.atan2(-(CAMERA_VIAGEM[0] - BARBEIRO_VIAGEM[0]), -(CAMERA_VIAGEM[2] - BARBEIRO_VIAGEM[2])) }}
        cliente={0}
        epoca={epoca}
        nevoa={nevoa}
      />
      <PlacaAno cam={cam} anos={plano.anos} de={p.de} vira={v0 + 6} f={f} some={some} />
    </>
  );
}

// ---------- o vídeo ----------

export function Atracao3D({ roteiro: r, tempos, voz, musica }: PropsAtracao3D) {
  const f = useCurrentFrame();
  const calc = useMemo(() => {
    if (!r || !tempos) return null;
    const planos = planosEmQuadros(r, tempos);
    const ponte = quadro(tempos, r.ponte);
    const fio = quadro(tempos, r.fio.de) - ANTES;
    const final = quadro(tempos, r.final.de) - ANTES;
    const telas = r.fio.telas.map((x, i) => ({ de: i === 0 ? fio : quadro(tempos, x.em), src: `motor/${r.id}/tela-${i + 1}.png` }));
    const frases = r.fio.frases.map((x) => ({ de: quadro(tempos, x.em), texto: x.texto }));
    // trocas de cena com névoa: onde o tipo muda (pedestal ↔ barbearia)
    const nevoas = planos.filter((p, k) => k > 0 && tipoDe(p.plano) !== tipoDe(planos[k - 1].plano)).map((p) => p.de);
    const nFinal = Number(/^(\d+)/.exec(String(r.final.de))?.[1] ?? tempos.falas.length);
    const voltaLegenda = nFinal < tempos.falas.length ? quadro(tempos, String(nFinal + 1)) - 4 : Infinity;
    // cada plano de pedestal olha de um jeito (o primeiro, o de sempre)
    let nPedestal = 0;
    const jeitos = planos.map((p) => (p.objeto ? nPedestal++ : 0));
    return { planos, jeitos, ponte, fio, final, telas, frases, nevoas, voltaLegenda, blocos: montarBlocos(tempos.palavras) };
  }, [r, tempos]);
  if (!r || !tempos || !calc) return <AbsoluteFill style={{ background: FUNDO }} />;
  const { planos, jeitos, ponte, fio, final, telas, frases, nevoas, voltaLegenda, blocos } = calc;

  // ---- qual plano está no ar ----
  let k = 0;
  while (k + 1 < planos.length && f >= planos[k + 1].de) k++;
  const p = planos[k];

  // ---- câmera: a tomada do plano, misturada com a do plano anterior na troca, e afastando na ponte ----
  const tomadaDo = (j: number): Tomada => {
    const q = planos[j];
    return q.objeto ? tomadaPedestal(q.objeto, abertura(planos, j, f), f - q.de, jeitos[j]) : tomadaBarbearia(f - q.de);
  };
  let tm = tomadaDo(k);
  if (k > 0 && tipoDe(planos[k - 1].plano) === tipoDe(p.plano)) tm = misturaT(tomadaDo(k - 1), tm, entre(f, p.de - 4, p.de + 22));
  // a câmera já sai andando no começo da ponte (começa rápido e assenta), em vez de demorar a se mexer
  const afasta = entre(f, ponte, fio, [0, 1], sai);
  if (afasta > 0 && p.objeto) {
    // no pedestal, recua pela mesma linha e sobe um pouco
    const ida = misturaV([0, 0, 0], [tm.pos[0] - tm.alvo[0], tm.pos[1] - tm.alvo[1], tm.pos[2] - tm.alvo[2]], 1 + 1.3 * afasta);
    tm = { ...tm, pos: [tm.alvo[0] + ida[0], tm.alvo[1] + ida[1] + afasta * 0.6, tm.alvo[2] + ida[2]] };
  } else if (afasta > 0) tm = misturaT(tm, VIAGEM_DE_CIMA, afasta);
  const cam = cameraDeConta(tm);

  // ---- névoa: nas trocas de tipo de cena e na entrada do Fio ----
  const nevoa = Math.max(0, ...nevoas.map((q) => 1 - Math.abs(f - q) / (NEVOA / 2 + 2)), entre(f, fio - 14, fio));
  // as placas somem quando a ponte começa (a câmera afasta e elas ficariam soltas na tela)
  const some = entre(f, ponte - 2, ponte + 10);
  // na névoa as placas somem antes da cena (no dobro da velocidade), para não ficarem soltas no creme
  const someTudo = Math.max(some, Math.min(1, nevoa * 2));

  const noFio = f >= fio;
  const semLegenda = f >= final + 4 && f < voltaLegenda;

  return (
    <AbsoluteFill style={{ background: FUNDO }}>
      <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: FOV_PEDESTAL, near: 0.05, far: 200, position: tm.pos }} gl={{ antialias: true }}>
        {noFio ? (
          <>
            <Camera pos={[0, 0, 5.6]} alvo={[0, 0, 0]} fov={FOV_FIO3D} />
            <CenaFio3D f={f} telas={telas} frases={frases} entrada={fio} final={final} />
          </>
        ) : (
          <>
            <Camera {...tm} />
            {p.objeto ? <Pedestal planos={planos} k={k} f={f} cam={cam} tm={tm} some={someTudo} nevoa={nevoa} /> : <Viagem p={p} f={f} cam={cam} some={someTudo} nevoa={nevoa} />}
          </>
        )}
      </ThreeCanvas>

      {!semLegenda && <LegendaDinamica f={f} blocos={blocos} chaves={r.chaves ?? []} topo={LEGENDA_Y} firme />}

      {/* sons */}
      {planos.map((q, j) => (
        <React.Fragment key={j}>
          {j > 0 && <Som em={q.de - 6} tipo={nevoas.includes(q.de) ? "whooshLongo" : "whoosh"} vol={0.8} />}
          {q.abre !== undefined && <Som em={q.abre} tipo="whoosh" />}
          {q.placas.map((x, i) => (
            <React.Fragment key={i}>
              <Som em={x.em} tipo="pop" />
              {q.abre !== undefined && <Som em={x.em + 3} tipo="tecla" vol={0.7} />}
            </React.Fragment>
          ))}
          {q.vira && <Som em={q.vira[0]} tipo="whooshLongo" />}
          {q.vira && [0, 1, 2, 3, 4, 5, 6].map((i) => <Som key={`v${i}`} em={Math.round(q.vira![0] + (q.vira![1] - q.vira![0]) * (i * 0.12 + 0.14))} tipo="pop" vol={0.55} />)}
          {q.vira && <Som em={q.vira[1]} tipo="sino" vol={0.7} />}
        </React.Fragment>
      ))}
      <Som em={ponte} tipo="whoosh" vol={0.6} />
      <Som em={fio - 8} tipo="whooshLongo" />
      {telas.slice(1).map((x) => (
        <Som key={x.de} em={x.de} tipo="toque" vol={0.7} />
      ))}
      {frases.map((x) => (
        <Som key={x.de} em={x.de} tipo="pop" />
      ))}
      <Som em={final + 4} tipo="sino" vol={0.8} />
      {voz && <Audio src={staticFile(voz)} />}
      {musica && <Audio src={staticFile(musica)} volume={0.55} />}
    </AbsoluteFill>
  );
}
