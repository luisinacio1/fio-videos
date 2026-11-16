import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { C, F, fontesCarregadas } from "../base";
import { CHAMADA_DUPLA } from "../motor/roteiro";
import { ease, entre, mola } from "../motor/util";

/**
 * A parte do Fio dos vídeos 3D, feita no próprio palco 3D (o vídeo 3D não mistura cenas 2D):
 * - `Celular3D`: o aparelho com moldura fina, cantos redondos e ilha, com a tela real do app (os PNGs da tela
 *   parada, 1170x2532) trocando nos quadros `de`;
 * - `Frases3D`: placas com texto desenhado em canvas, entrando uma a uma ao lado do celular;
 * - `Final3D`: o laço (um tubo 3D que se desenha), "Fio" e as duas linhas da chamada dupla.
 * - `CenaFio3D`: câmera, luzes e fundo, com as três peças e a viagem da câmera do celular para o fecho.
 *
 * Tudo foi medido para a câmera de `CenaFio3D` (fov 30, a DIST do alvo), em que 1 px do vídeo (1080x1920) vale
 * PX unidades no plano z = 0. Assim dá para pensar o layout em pixels:
 * - celular de y ≈ 270 a 1270, x ≈ 550 a 1020;
 * - frases à esquerda, centradas em y = 470, 740 e 1010 (x de 40 a 580);
 * - fecho com o laço em y ≈ 470, "Fio" em 770 e a chamada em 1000 e 1175 (vai até ≈ 1265).
 * A faixa da legenda dinâmica (y 1330 a 1430) fica livre.
 *
 * As texturas esperam o carregamento com delayRender: a imagem da tela e as fontes do canvas. Quando ficam
 * prontas, pedem um quadro novo ao 3D (advance) antes de soltar o render, como o letreiro de Barbearia3D.
 */

type V3 = [number, number, number];

export const FOV_FIO3D = 30;
const DIST = 5.6;
/** Quanto vale 1 px do vídeo, em unidades do mundo, no plano z = 0 (altura visível / 1920). */
export const PX = (2 * DIST * Math.tan(((FOV_FIO3D / 2) * Math.PI) / 180)) / 1920;
/** de pixel do vídeo (x, y a partir do canto de cima) para o mundo, com a câmera olhando para (0, alvoY, 0) */
const mundo = (x: number, y: number, alvoY = 0): [number, number] => [(x - 540) * PX, alvoY + (960 - y) * PX];

/** Altura do fecho no palco: a câmera sobe até ele. */
const Y_FINAL = 3.4;

const FUNDO = "#efe3d4";

// ---------- ajudantes ----------

/** Retângulo de cantos redondos, centrado na origem. */
function forma(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Laje de cantos redondos com bisel (o corpo do celular e o fundo das placas). A frente fica em z = prof/2. */
function laje(w: number, h: number, r: number, prof: number, bisel: number) {
  const b = Math.min(bisel, prof / 2 - 0.0005);
  const g = new THREE.ExtrudeGeometry(forma(w - 2 * b, h - 2 * b, Math.max(0.001, r - b)), {
    depth: prof - 2 * b,
    bevelEnabled: true,
    bevelSize: b,
    bevelThickness: b,
    bevelSegments: 6,
    curveSegments: 20,
  });
  g.translate(0, 0, -(prof - 2 * b) / 2);
  return g;
}

/** Retângulo redondo plano com as coordenadas de textura indo de 0 a 1 nele todo (para a imagem da tela). */
function placaComUV(w: number, h: number, r: number) {
  const g = new THREE.ShapeGeometry(forma(w, h, r), 24);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

/** Segura o render até as fontes do canvas carregarem; depois pede um quadro novo ao 3D. */
export function useFontesProntas(rotulo: string) {
  const advance = useThree((st) => st.advance);
  const [pronto, setPronto] = useState<{ solta: () => void } | null>(null);
  // a espera nasce no efeito (uma por montagem) e é solta no fim dele: se desmontar antes, não fica presa
  useLayoutEffect(() => {
    const solta = seguraRender(`fontes: ${rotulo}`);
    let vivo = true;
    const ok = () => vivo && setPronto({ solta });
    // primeiro as fontes do Google entram em document.fonts (fontesCarregadas), só então o load as acha
    fontesCarregadas()
      .then(() => Promise.all([document.fonts.load(`800 100px ${F.sans}`), document.fonts.load(`600 100px ${F.sans}`), document.fonts.load(`700 100px ${F.serif}`)]))
      .then(ok, ok);
    return () => {
      vivo = false;
      solta();
    };
  }, [rotulo]);
  useEffect(() => {
    if (!pronto) return;
    advance(performance.now());
    pronto.solta();
  }, [pronto, advance]);
  return pronto !== null;
}

/** delayRender com uma função para soltar que pode ser chamada mais de uma vez (só a primeira conta). */
function seguraRender(rotulo: string, opcoes?: { timeoutInMilliseconds?: number }) {
  const h = delayRender(rotulo, opcoes);
  let solto = false;
  return () => {
    if (solto) return;
    solto = true;
    continueRender(h);
  };
}

/** Libera da placa de vídeo o que foi criado à mão (useMemo) quando muda ou desmonta. */
function useDescarta(itens: ({ dispose: () => void } | null | undefined)[] | { dispose: () => void } | null | undefined) {
  useEffect(() => () => (Array.isArray(itens) ? itens : [itens]).forEach((i) => i?.dispose()), [itens]);
}

/** Endereço da imagem: caminho dentro de public/ (vira staticFile) ou um endereço completo. */
const endereco = (src: string) => (/^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\/+/, "")));

/**
 * Carrega as imagens das telas como textura, segurando o render até todas chegarem (e já subindo para a placa
 * de vídeo). Se faltar uma imagem, o render para com erro, para não sair vídeo com a tela vazia.
 */
function useTexturasTelas(srcs: string[]) {
  const gl = useThree((st) => st.gl);
  const advance = useThree((st) => st.advance);
  const chave = srcs.join("|");
  const [estado, setEstado] = useState<{ chave: string; texs: THREE.Texture[]; solta: () => void } | null>(null);
  // uma espera por lista de telas: nasce no efeito e é solta na limpeza, se ainda não foi (desmontou ou a lista mudou)
  useLayoutEffect(() => {
    const solta = seguraRender(`telas do celular 3D: ${chave}`, { timeoutInMilliseconds: 60000 });
    let vivo = true;
    let carregadas: THREE.Texture[] = [];
    const carregador = new THREE.TextureLoader();
    const lista = chave ? chave.split("|") : [];
    Promise.all(lista.map((s) => carregador.loadAsync(endereco(s)))).then(
      (ts) => {
        if (!vivo) {
          ts.forEach((t) => t.dispose());
          return;
        }
        carregadas = ts;
        const aniso = gl.capabilities.getMaxAnisotropy();
        for (const t of ts) {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = aniso;
          t.generateMipmaps = true;
          t.minFilter = THREE.LinearMipmapLinearFilter;
          t.magFilter = THREE.LinearFilter;
          gl.initTexture(t);
        }
        setEstado({ chave, texs: ts, solta });
      },
      (e) => {
        if (vivo) cancelRender(new Error(`Celular3D: não carregou a tela (${chave}): ${e instanceof Error ? e.message : String(e)}`));
      },
    );
    return () => {
      vivo = false;
      carregadas.forEach((t) => t.dispose());
      solta();
    };
  }, [chave, gl]);
  useEffect(() => {
    if (!estado) return;
    advance(performance.now());
    estado.solta();
  }, [estado, advance]);
  return estado && estado.chave === chave ? estado.texs : null;
}

// ---------- texto no canvas ----------

type Trecho = { t: string; cor: string; peso: 600 | 700 | 800 };
type Palavra = Trecho & { w: number };

/** Quebra os trechos em linhas que cabem em `largura` (px do canvas). */
function quebra(g: CanvasRenderingContext2D, trechos: Trecho[], tam: number, fonte: string, largura: number) {
  const palavras: Palavra[] = [];
  for (const tr of trechos) {
    g.font = `${tr.peso} ${tam}px ${fonte}`;
    for (const p of tr.t.split(/\s+/).filter(Boolean)) palavras.push({ ...tr, t: p, w: g.measureText(p).width });
  }
  g.font = `600 ${tam}px ${fonte}`;
  const espaco = g.measureText(" ").width;
  const linhas: { palavras: Palavra[]; w: number }[] = [];
  for (const p of palavras) {
    const atual = linhas[linhas.length - 1];
    if (atual && atual.w + espaco + p.w <= largura) {
      atual.palavras.push(p);
      atual.w += espaco + p.w;
    } else linhas.push({ palavras: [p], w: p.w });
  }
  return { linhas, espaco };
}

export type Cartao = {
  trechos: Trecho[];
  /** tamanho da letra em px do vídeo */
  tam: number;
  /** largura do cartão em px do vídeo (fixa) ou largura máxima (com `ajusta`) */
  largura: number;
  ajusta?: boolean;
  fundo: string | null;
  barra?: string;
  centro?: boolean;
  fonte?: string;
  padX?: number;
  padY?: number;
  raio?: number;
  alturaLinha?: number;
};

/** Os cartões são desenhados com 2 px de canvas por px do vídeo, para ficarem nítidos. */
const SUPER = 2;

/** Desenha o cartão num canvas novo e devolve o canvas com a medida em px do vídeo. */
function desenhaCartao(c: Cartao) {
  const k = SUPER;
  const fonte = c.fonte ?? F.sans;
  const tam = c.tam * k;
  const padX = (c.padX ?? 36) * k;
  const padY = (c.padY ?? 30) * k;
  const barra = c.barra ? 14 * k : 0;
  const lh = tam * (c.alturaLinha ?? 1.18);
  const cv = document.createElement("canvas");
  const g = cv.getContext("2d")!;
  const maxTexto = c.largura * k - 2 * padX - barra;
  // linhas equilibradas: estreita a largura enquanto o número de linhas não muda (nada de palavra sozinha embaixo)
  let { linhas, espaco } = quebra(g, c.trechos, tam, fonte, maxTexto);
  if (linhas.length > 1) {
    for (let lw = maxTexto - 8; lw > maxTexto * 0.4; lw -= 8) {
      const outra = quebra(g, c.trechos, tam, fonte, lw);
      if (outra.linhas.length !== linhas.length) break;
      ({ linhas, espaco } = outra);
    }
  }
  const maisLarga = Math.max(...linhas.map((l) => l.w));
  const w = Math.ceil(c.ajusta ? maisLarga + 2 * padX + barra : c.largura * k);
  const h = Math.ceil(linhas.length * lh + 2 * padY);
  cv.width = w;
  cv.height = h;
  const raio = (c.raio ?? 30) * k;
  if (c.fundo) {
    g.save();
    g.beginPath();
    g.roundRect(0, 0, w, h, raio);
    g.fillStyle = c.fundo;
    g.fill();
    g.clip();
    if (c.barra) {
      g.fillStyle = c.barra;
      g.fillRect(0, 0, barra, h);
    }
    g.restore();
  }
  g.textBaseline = "middle";
  linhas.forEach((l, i) => {
    let x = c.centro ? (w + barra - l.w) / 2 : padX + barra;
    const y = padY + lh * (i + 0.5) + tam * 0.04;
    for (const p of l.palavras) {
      g.font = `${p.peso} ${tam}px ${fonte}`;
      g.fillStyle = p.cor;
      g.fillText(p.t, x, y);
      x += p.w + espaco;
    }
  });
  return { cv, w: w / k, h: h / k };
}

/** Textura de um cartão (só depois das fontes prontas, para medir certo). Devolve a medida em unidades do mundo. */
export function useCartao(c: Cartao, pronto: boolean) {
  const chave = JSON.stringify(c);
  const cartao = useMemo(() => {
    if (!pronto) return null;
    const { cv, w, h } = desenhaCartao(JSON.parse(chave) as Cartao);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { tex, w: w * PX, h: h * PX, raio: (c.raio ?? 30) * PX };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, pronto]);
  useDescarta(cartao?.tex);
  return cartao;
}

/** Cartão no palco: a imagem do canvas na frente de uma laje com a mesma forma (dá espessura e sombra). */
export function Placa({ cartao, laje: comLaje = true, cor = "#ffffff", sombra = true }: { cartao: NonNullable<ReturnType<typeof useCartao>>; laje?: boolean; cor?: string; sombra?: boolean }) {
  const prof = 0.028;
  const corpo = useMemo(() => (comLaje ? laje(cartao.w, cartao.h, cartao.raio, prof, 0.008) : null), [cartao, comLaje]);
  useDescarta(corpo);
  return (
    <group>
      {corpo && (
        <mesh geometry={corpo} position={[0, 0, -prof / 2 - 0.001]} castShadow={sombra}>
          <meshStandardMaterial color={cor} roughness={0.55} />
        </mesh>
      )}
      <mesh>
        <planeGeometry args={[cartao.w, cartao.h]} />
        <meshBasicMaterial map={cartao.tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------- celular ----------

/** Medidas do celular em unidades do mundo (a tela é 390x844, como a tela parada). */
const TELA_A = 1.52;
const TELA_L = (TELA_A * 390) / 844;
const U = TELA_L / 390; // 1 px da tela do app
const MOLDURA = 10 * U;
const RAIO_TELA = 47 * U;
const PROF = 0.075;
const CORPO_L = TELA_L + 2 * MOLDURA;
const CORPO_A = TELA_A + 2 * MOLDURA;
/** Onde o celular fica no palco (centro): x ≈ 785 px, y ≈ 770 px. */
const [CEL_X, CEL_Y] = mundo(785, 770);

/** botões nas laterais: [lado, altura do centro, comprimento] (volume e ação à esquerda, liga à direita) */
const BOTOES: [number, number, number][] = [
  [-1, 0.42, 0.06],
  [-1, 0.27, 0.11],
  [-1, 0.13, 0.11],
  [1, 0.3, 0.16],
];

const COR_CEL = { aro: "#3b332d", vidro: "#0d0b0a", ilha: "#050404", botao: "#4a4039" };

export function Celular3D({ telas, f, p }: { telas: { de: number; src: string }[]; f: number; p: number }) {
  const texs = useTexturasTelas(telas.map((t) => t.src));
  const geo = useMemo(
    () => ({
      corpo: laje(CORPO_L, CORPO_A, RAIO_TELA + MOLDURA, PROF, 0.016),
      tela: placaComUV(TELA_L, TELA_A, RAIO_TELA),
      ilha: new THREE.ShapeGeometry(forma(92 * U, 24 * U, 12 * U), 12),
      botoes: BOTOES.map(([lado, y, a]) => ({ lado, y, g: new RoundedBoxGeometry(0.012, a, PROF * 0.42, 2, 0.004) })),
    }),
    [],
  );
  const mat = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: COR_CEL.vidro, roughness: 0.18, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: COR_CEL.aro, roughness: 0.32, metalness: 0.75 }),
    ],
    [],
  );
  const feitos = useMemo(() => [geo.corpo, geo.tela, geo.ilha, ...geo.botoes.map((b) => b.g), ...mat], [geo, mat]);
  useDescarta(feitos);

  // qual tela está no ar e a troca rápida (8 quadros) da anterior para ela
  let i = -1;
  telas.forEach((t, k) => {
    if (f >= t.de) i = k;
  });
  const atual = Math.max(0, i);
  const troca = i > 0 ? entre(f, telas[i].de, telas[i].de + 8) : 1;
  const texAtual = texs?.[atual] ?? null;
  const texAntes = i > 0 && troca < 1 ? (texs?.[i - 1] ?? null) : null;

  // entrada (sobe girando) e o balanço parado
  const e = Math.min(1, Math.max(0, p));
  const pos: V3 = [CEL_X + (1 - e) * 0.5, CEL_Y - (1 - e) * 2.4 + Math.sin(f / 46) * 0.012, (1 - e) * -0.6];
  const rot: V3 = [-0.04 + Math.sin(f / 61) * 0.025 + (1 - e) * 0.5, -0.2 + Math.sin(f / 53) * 0.05 + (1 - e) * 1.1, 0.02 + (1 - e) * 0.25];
  const z = PROF / 2;

  return (
    <group position={pos} rotation={rot}>
      <mesh geometry={geo.corpo} material={mat} castShadow />
      {/* botões: volume e ação à esquerda, liga à direita */}
      {geo.botoes.map((b, k) => (
        <mesh key={k} geometry={b.g} position={[b.lado * (CORPO_L / 2 + 0.002), b.y, 0]}>
          <meshStandardMaterial color={COR_CEL.botao} roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      {/* tela do app (sem luz, para ficar com as cores e o brilho da imagem) */}
      {texAntes && (
        <mesh geometry={geo.tela} position={[0, 0, z + 0.0008]}>
          <meshBasicMaterial key="antes" map={texAntes} color="#ffffff" toneMapped={false} />
        </mesh>
      )}
      <mesh geometry={geo.tela} position={[0, 0, z + (texAntes ? 0.0013 : 0.0008)]}>
        {texAtual ? (
          <meshBasicMaterial key="tela" map={texAtual} color="#ffffff" toneMapped={false} transparent={!!texAntes} opacity={texAntes ? troca : 1} />
        ) : (
          <meshBasicMaterial key="vazia" color={C.fundo} toneMapped={false} />
        )}
      </mesh>
      {/* ilha com a câmera */}
      <mesh geometry={geo.ilha} position={[0, TELA_A / 2 - 16 * U, z + 0.002]}>
        <meshBasicMaterial color={COR_CEL.ilha} toneMapped={false} />
      </mesh>
      <mesh position={[30 * U, TELA_A / 2 - 16 * U, z + 0.0026]}>
        <circleGeometry args={[5 * U, 20]} />
        <meshBasicMaterial color="#17202b" toneMapped={false} />
      </mesh>
      <mesh position={[31.5 * U, TELA_A / 2 - 14.5 * U, z + 0.003]}>
        <circleGeometry args={[1.6 * U, 12]} />
        <meshBasicMaterial color="#4b5d73" toneMapped={false} />
      </mesh>
    </group>
  );
}

// ---------- frases ----------

/** Centros (px do vídeo) das três vagas das frases, à esquerda do celular. */
const VAGAS_Y = [470, 740, 1010];
const FRASE_X = 304;
const FRASE_L = 490;

function Frase({ texto, de, vaga, f, pronto }: { texto: string; de: number; vaga: number; f: number; pronto: boolean }) {
  const cartao = useCartao({ trechos: [{ t: texto, cor: C.texto, peso: 800 }], tam: 50, largura: FRASE_L, fundo: "#ffffff", barra: C.acento, padX: 34, padY: 30, raio: 28 }, pronto);
  if (!cartao || f < de) return null;
  const s = mola(f, de, { damping: 13, stiffness: 150 });
  // a posição e o tamanho não passam do ponto final (a mola quica só no giro), para o cartão não invadir o celular
  const sl = Math.min(1, s);
  const [x, y] = mundo(FRASE_X, VAGAS_Y[vaga]);
  return (
    <group position={[x - (1 - sl) * 1.1, y - (1 - sl) * 0.15, 0.15 - (1 - sl) * 0.4]} rotation={[0, 0.13 - (1 - s) * 0.9, 0]} scale={0.7 + 0.3 * sl}>
      <Placa cartao={cartao} />
    </group>
  );
}

export function Frases3D({ frases, f }: { frases: { de: number; texto: string }[]; f: number }) {
  const pronto = useFontesProntas("frases 3D");
  // até três vagas; se vierem mais, as mais novas ocupam as vagas e a mais velha sai
  const entraram = frases.filter((fr) => f >= fr.de).length;
  const primeira = Math.max(0, entraram - VAGAS_Y.length);
  return (
    <group>
      {frases.map((fr, k) =>
        k < primeira ? null : <Frase key={`${k}-${fr.texto}`} texto={fr.texto} de={fr.de} vaga={Math.min(VAGAS_Y.length - 1, k - primeira)} f={f} pronto={pronto} />,
      )}
    </group>
  );
}

// ---------- fecho ----------

const LACO_D = "M3 29c8 5 18.5 7 26-1.5 7-8 13-19.5 9.6-23.6-3.4-4.2-9.6 1.6-9.6 12.6 0 10.5 6.4 19.2 16 17";
const LACO_SEG = 360;
const LACO_LADOS = 16;
/** mais escuro que C.acento porque a luz clareia: aceso, o tubo fica na cor do laço do app */
const COR_LACO = "#7a3324";

/** O laço do Fio como um tubo 3D (o mesmo traço do Laco de src/base), que se desenha com `progresso`. */
function Laco3D({ largura, progresso }: { largura: number; progresso: number }) {
  const { curva, geo, raio } = useMemo(() => {
    const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 40"><path d="${LACO_D}"/></svg>`);
    const pts = svg.paths[0].subPaths[0].getSpacedPoints(240);
    const xs = pts.map((q) => q.x);
    const ys = pts.map((q) => q.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const s = largura / (Math.max(...xs) - Math.min(...xs));
    // um pouco de profundidade para o traço passar por cima dele mesmo no cruzamento
    const curva = new THREE.CatmullRomCurve3(pts.map((q, k) => new THREE.Vector3((q.x - cx) * s, (cy - q.y) * s, Math.sin((k / (pts.length - 1)) * Math.PI * 2) * 0.05)));
    const raio = 1.5 * s;
    return { curva, geo: new THREE.TubeGeometry(curva, LACO_SEG, raio, LACO_LADOS, false), raio };
  }, [largura]);
  useDescarta(geo);
  const pr = Math.min(1, Math.max(0, progresso));
  geo.setDrawRange(0, Math.floor(pr * LACO_SEG) * LACO_LADOS * 6);
  if (pr <= 0) return null;
  const fim = curva.getPointAt(pr);
  const inicio = curva.getPointAt(0);
  return (
    <group>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={COR_LACO} roughness={0.45} metalness={0} envMapIntensity={0.15} toneMapped={false} />
      </mesh>
      {[inicio, fim].map((q, k) => (
        <mesh key={k} position={q}>
          <sphereGeometry args={[raio, LACO_LADOS, 12]} />
          <meshStandardMaterial color={COR_LACO} roughness={0.45} metalness={0} envMapIntensity={0.15} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Final3D({ f, de }: { f: number; de: number }) {
  const pronto = useFontesProntas("fecho 3D");
  const nome = useCartao({ trechos: [{ t: "Fio", cor: C.texto, peso: 700 }], tam: 190, largura: 900, ajusta: true, fundo: null, fonte: F.serif, padX: 10, padY: 0, alturaLinha: 1.15 }, pronto);
  const corte = (l: string) => l.indexOf("?") + 1;
  const [l1, l2] = CHAMADA_DUPLA;
  const cta1 = useCartao(
    { trechos: [{ t: l1.slice(0, corte(l1)), cor: "#ffffff", peso: 800 }, { t: l1.slice(corte(l1)), cor: "#ffffff", peso: 600 }], tam: 50, largura: 900, ajusta: true, fundo: C.acento, centro: true, padX: 50, padY: 30, raio: 70 },
    pronto,
  );
  const cta2 = useCartao(
    { trechos: [{ t: l2.slice(0, corte(l2)), cor: C.acento, peso: 800 }, { t: l2.slice(corte(l2)), cor: C.texto, peso: 600 }], tam: 48, largura: 860, ajusta: true, fundo: "#ffffff", centro: true, padX: 46, padY: 28, raio: 40 },
    pronto,
  );
  if (f < de) return null;
  const t = f - de;
  const laco = entre(t, 4, 32, [0, 1], ease);
  const sNome = mola(t, 12, { damping: 13 });
  const s1 = mola(t, 24, { damping: 12 });
  const s2 = mola(t, 34, { damping: 13, stiffness: 150 });
  const giro = Math.sin(t / 40) * 0.06;
  const lugar = (y: number): V3 => {
    const [x, yy] = mundo(540, y, Y_FINAL);
    return [x, yy, 0];
  };
  return (
    <group>
      <group position={lugar(470)} rotation={[0, giro, 0]}>
        <Laco3D largura={420 * PX} progresso={laco} />
      </group>
      {nome && sNome > 0.001 && (
        <group position={[0, lugar(770)[1] - (1 - sNome) * 0.12, 0]} scale={0.6 + 0.4 * sNome}>
          <Placa cartao={nome} laje={false} />
        </group>
      )}
      {cta1 && t >= 24 && (
        <group position={lugar(1000)} rotation={[(1 - s1) * -1.2, 0, 0]} scale={Math.max(0.001, s1)}>
          <Placa cartao={cta1} cor={C.acento} />
        </group>
      )}
      {cta2 && t >= 34 && (
        <group position={[0, lugar(1175)[1] - (1 - s2) * 0.1, 0]} rotation={[(1 - s2) * -1.2, 0, 0]} scale={Math.max(0.001, s2)}>
          <Placa cartao={cta2} />
        </group>
      )}
    </group>
  );
}

// ---------- palco ----------

function Camera({ pos, alvo }: { pos: V3; alvo: V3 }) {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...alvo));
  camera.updateProjectionMatrix();
  return null;
}

/** Reflexos suaves (uma sala neutra) para o aro e o vidro do celular não ficarem chapados. */
function Ambiente() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const sala = new RoomEnvironment();
    const alvo = pmrem.fromScene(sala, 0.04);
    sala.dispose();
    pmrem.dispose();
    scene.environment = alvo.texture;
    scene.environmentIntensity = 0.7;
    return () => {
      if (scene.environment === alvo.texture) scene.environment = null;
      alvo.dispose();
    };
  }, [gl, scene]);
  return null;
}

/** Brilho terracota bem leve atrás das peças (como os degradês do fecho 2D). */
function Brilho({ p, tam, forca = 0.22 }: { p: V3; tam: number; forca?: number }) {
  const tex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(176,81,58,${forca})`);
    gr.addColorStop(1, "rgba(176,81,58,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [forca]);
  useDescarta(tex);
  return (
    <mesh position={p}>
      <planeGeometry args={[tam, tam]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export type PropsCenaFio3D = {
  f: number;
  telas: { de: number; src: string }[];
  frases: { de: number; texto: string }[];
  /** quadro em que o celular entra */
  entrada: number;
  /** quadro em que a câmera sobe para o fecho */
  final: number;
};

/**
 * O palco inteiro da parte do Fio (vai dentro de um ThreeCanvas com fov FOV_FIO3D): fundo creme, luzes, o
 * celular com as frases e, no quadro `final`, a câmera sobe até o fecho.
 */
export function CenaFio3D({ f, telas, frases, entrada, final }: PropsCenaFio3D) {
  const sobe = entre(f, final - 6, final + 16);
  const alvo: V3 = [0, sobe * Y_FINAL, 0];
  const pos: V3 = [Math.sin(f / 90) * 0.06, alvo[1] + 0.05, DIST];
  const p = mola(f, entrada, { damping: 15, stiffness: 110 });
  return (
    <>
      <Camera pos={pos} alvo={alvo} />
      <color attach="background" args={[FUNDO]} />
      <Ambiente />
      <hemisphereLight args={["#fff6ec", "#b9a48f", 1.0]} />
      <directionalLight position={[-2.5, 3, 4]} intensity={1.8} />
      <directionalLight position={[3, -1, 2]} intensity={0.6} color="#ffd9c8" />
      <Brilho p={[CEL_X - 0.2, CEL_Y, -1.2]} tam={4.2} />
      <Brilho p={[0, Y_FINAL + 0.1, -1.2]} tam={4.6} forca={0.18} />
      {f < final + 20 && (
        <>
          <Celular3D telas={telas} f={f} p={p} />
          <Frases3D frases={frases} f={f} />
        </>
      )}
      <Final3D f={f} de={final} />
    </>
  );
}
