import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { C, F } from "../base";
import { LegendaDinamica, montarBlocos } from "../motion/LegendaDinamica";
import { App } from "../motor/cenas/App";
import { Final } from "../motor/cenas/Texto";
import { TRANSICAO, duracao, quadro, type Tempos } from "../motor/roteiro";
import { ProvedorCena, Som, entre, mola, sai } from "../motor/util";
import { Barbearia3D, FUNDO, PORTA_X, estacoes, largura } from "./Barbearia3D";
import { CenaFio3D, FOV_FIO3D } from "./Fio3D";
import { cortes, linhaDasEtapas, type Peca, type Roteiro3D } from "./roteiro";

/**
 * Vídeo 3D "Quanto custa…?": a barbearia pronta, a obra "volta no tempo" e é montada peça por peça no tempo da
 * narração, com o contador de custo subindo no topo. Depois o total, o cliente que não aparece, o celular com o Fio
 * e a tela final (as duas últimas são as mesmas peças do motor dos vídeos do dia).
 *
 * Formato novo (roteiro com `fio`): no lugar do celular e da tela final 2D, a névoa creme engole a barbearia e entra
 * o palco do Fio em 3D (CenaFio3D: o celular 3D com as telas, as 3 frases e o Final3D com a chamada dupla), como no
 * vídeo de atração (Atracao3D). Sem `fio`, tudo fica como antes.
 */

export type PropsCusto3D = { roteiro: Roteiro3D | null; tempos: Tempos | null; voz: string | null; musica: string | null };

type V3 = [number, number, number];
type Tomada = { pos: V3; alvo: V3 };

/** Onde a câmera fica para mostrar cada coisa. */
function tomadas(cadeiras: number): Record<Peca | "abertura" | "obra" | "total" | "cadeira" | "parada", Tomada> {
  const W = largura(cadeiras);
  const D = FUNDO;
  const xs = estacoes(cadeiras);
  const meio = (xs[0] + xs[xs.length - 1]) / 2;
  return {
    abertura: { pos: [8.8, 11.5, 16], alvo: [0.3, 1, 0.8] },
    obra: { pos: [0.5, 17, D / 2 + 9], alvo: [0, 0, -0.5] },
    piso: { pos: [-3, 15, D / 2 + 8], alvo: [0, 0, -0.6] },
    pintura: { pos: [1.5, 7, D / 2 + 9], alvo: [-0.4, 1.4, -1.8] },
    luz: { pos: [meio - 0.8, 3.1, D / 2 + 1.2], alvo: [meio, 2.4, -D / 2 + 1.2] },
    cano: { pos: [-W / 2 + 3.4, 2.5, 1.2], alvo: [-W / 2 + 0.3, 0.6, -1.5] },
    cadeiras: { pos: [meio + 3.2, 2.9, 2.4], alvo: [meio - 0.3, 0.6, -D / 2 + 1.5] },
    espelhos: { pos: [meio + 0.6, 1.9, 1.3], alvo: [meio, 1.4, -D / 2] },
    lavatorio: { pos: [-W / 2 + 3.3, 2.1, 0.9], alvo: [-W / 2 + 0.7, 0.7, -1.6] },
    ferramentas: { pos: [xs[0] + 0.9, 1.75, -D / 2 + 1.9], alvo: [xs[0], 0.95, -D / 2 + 0.3] },
    recepcao: { pos: [1.4, 2.6, D / 2 + 1.6], alvo: [-W / 2 + 0.8, 0.5, 1.4] },
    produtos: { pos: [-W / 2 + 3, 2.1, 1.4], alvo: [-W / 2 + 0.1, 1.5, -0.3] },
    fachada: { pos: [2.5, 3.4, D / 2 + 10], alvo: [0, 2, D / 2] },
    total: { pos: [9.3, 11, 16.6], alvo: [0.3, 1, 0.6] },
    // de lado (pela esquerda), para o encosto não tapar quem está sentado
    cadeira: { pos: [xs[0] - 2.1, 1.8, -D / 2 + 2.6], alvo: [xs[0] + 0.2, 0.9, -D / 2 + 1.4] },
    parada: { pos: [xs[0] - 1.8, 1.45, -D / 2 + 3.1], alvo: [xs[0] + 0.1, 0.85, -D / 2 + 1.3] },
  };
}

/** Câmera parada numa tomada, girando devagar em volta do alvo (`t` = quadros desde que chegou). */
function deriva(tm: Tomada, t: number): Tomada {
  const a = Math.min(0.22, Math.max(0, t) * 0.0016);
  const dx = tm.pos[0] - tm.alvo[0];
  const dz = tm.pos[2] - tm.alvo[2];
  const aproxima = 1 - Math.min(0.08, Math.max(0, t) * 0.0006);
  return {
    pos: [tm.alvo[0] + (dx * Math.cos(a) - dz * Math.sin(a)) * aproxima, tm.pos[1] - Math.min(0.4, t * 0.002), tm.alvo[2] + (dx * Math.sin(a) + dz * Math.cos(a)) * aproxima],
    alvo: tm.alvo,
  };
}

const misturaV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function Camera({ pos, alvo }: Tomada) {
  const camera = useThree((s) => s.camera);
  camera.position.set(...pos);
  camera.lookAt(new THREE.Vector3(...alvo));
  camera.updateProjectionMatrix();
  return null;
}

/** Some junto com a névoa do Fio em 3D. Sem ela (formato antigo), não embrulha nada: a página fica igual à de antes. */
function ComNevoa({ nevoa, children }: { nevoa?: number; children: React.ReactNode }) {
  return nevoa === undefined ? <>{children}</> : <AbsoluteFill style={{ opacity: 1 - nevoa }}>{children}</AbsoluteFill>;
}

const reais = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;

export function Custo3D({ roteiro: r, tempos, voz, musica }: PropsCusto3D) {
  const f = useCurrentFrame();
  const calc = useMemo(() => {
    if (!r || !tempos) return null;
    const etapas = linhaDasEtapas(r, tempos);
    const { app, final } = cortes(r, tempos);
    const volta = quadro(tempos, "2") - 4;
    const total = quadro(tempos, r.total);
    const falta = r.falta ? { marca: quadro(tempos, r.falta.marca), some: quadro(tempos, r.falta.some), parada: r.falta.parada ? quadro(tempos, r.falta.parada) : Infinity } : null;
    const tm = tomadas(r.cadeiras);
    const chaves: { f: number; t: Tomada }[] = [
      { f: 0, t: tm.abertura },
      { f: volta, t: tm.obra },
      ...etapas.map((e) => ({ f: e.q, t: tm[e.pecas[0]] })),
      { f: total, t: tm.total },
      ...(falta ? [{ f: falta.marca, t: tm.cadeira }, ...(Number.isFinite(falta.parada) ? [{ f: falta.parada, t: tm.parada }] : [])] : []),
    ];
    const quando = new Map<Peca, number>();
    etapas.forEach((e) => e.pecas.forEach((p) => quando.set(p, e.q)));
    // o Fio em 3D: a primeira tela já está no celular quando ele entra; as frases entram no tempo de cada uma
    const fio3d = r.fio
      ? {
          telas: r.fio.telas.map((x, i) => ({ de: i === 0 ? app : quadro(tempos, x.em), src: `motor/${r.id}/tela-${i + 1}.png` })),
          frases: r.fio.frases.map((x) => ({ de: quadro(tempos, x.em), texto: x.texto })),
        }
      : null;
    return { etapas, app, final, volta, total, falta, chaves, quando, fio3d, blocos: montarBlocos(tempos.palavras), fim: duracao(tempos) };
  }, [r, tempos]);
  if (!r || !tempos || !calc) return <AbsoluteFill style={{ background: C.fundo }} />;
  const { etapas, app, final, volta, total, falta, chaves, quando, fio3d, blocos, fim } = calc;

  // ---- câmera: fica em cada tomada e viaja para a próxima um pouco antes da palavra ----
  let k = 0;
  while (k + 1 < chaves.length && f >= chaves[k + 1].f - 14) k++;
  let cam = deriva(chaves[k].t, f - chaves[k].f);
  if (k > 0) {
    const anterior = deriva(chaves[k - 1].t, f - chaves[k - 1].f);
    const t = entre(f, chaves[k].f - 14, chaves[k].f + 18);
    cam = { pos: misturaV(anterior.pos, cam.pos, t), alvo: misturaV(anterior.alvo, cam.alvo, t) };
  }

  // ---- peças: prontas na abertura, somem quando a obra volta no tempo, e caem uma a uma ----
  const encolhe = 1 - entre(f, volta, volta + 12);
  const v = (p: Peca) => (f < volta + 12 ? encolhe : mola(f, quando.get(p) ?? Infinity, { damping: 11, stiffness: 150 }));
  const qPiso = quando.get("piso") ?? Infinity;
  const ladrilho = (i: number, j: number) => (f < volta + 12 ? encolhe : mola(f, qPiso + (i + (FUNDO / 0.5 - 1 - j)) * 0.9, { damping: 13, stiffness: 190 }));
  const pintura = f < volta + 12 ? encolhe : entre(f, quando.get("pintura") ?? Infinity, (quando.get("pintura") ?? Infinity) + 26);

  // ---- o barbeiro: na calçada na abertura, olhando a obra durante a montagem, do lado da cadeira na falta ----
  const W = largura(r.cadeiras);
  const xs = estacoes(r.cadeiras);
  const naCalcada: V3 = [PORTA_X + 1.5, 0, FUNDO / 2 + 1.1];
  const naObra: V3 = [-0.4, 0, 1.3];
  const naCadeira: V3 = [xs[0] + 0.95, 0, -FUNDO / 2 + 2.1];
  const anda = (de: V3, para: V3, a: number) => misturaV(de, para, entre(f, a, a + 26));
  let pb = anda(naCalcada, naObra, volta);
  if (falta) pb = anda(pb, naCadeira, falta.marca - 30);
  const olhaPara = f < volta ? cam.pos : falta && f >= falta.marca - 10 ? ([PORTA_X, 0, FUNDO / 2] as V3) : cam.alvo;
  const rot = Math.atan2(-(olhaPara[0] - pb[0]), -(olhaPara[2] - pb[2]));
  const cliente = falta ? mola(f, falta.marca, { damping: 14 }) * (1 - entre(f, falta.some, falta.some + 14)) : 0;

  // ---- contador e etiquetas ----
  const atual = etapas.filter((e) => f >= e.q);
  const ultima = atual[atual.length - 1];
  const penultimaSoma = atual.length > 1 ? atual[atual.length - 2].soma : 0;
  const valor = ultima ? penultimaSoma + (ultima.soma - penultimaSoma) * entre(f, ultima.q + 2, ultima.q + 18, [0, 1], sai) : 0;
  const pulo = ultima ? 1 + 0.08 * Math.sin(Math.min(1, (f - ultima.q) / 10) * Math.PI) : 1;
  const aparece = mola(f, etapas[0].q - 2, { damping: 14 });
  const grande = entre(f, total, total + 16, [0, 1], sai) * (1 - entre(f, (falta?.marca ?? app) - 12, (falta?.marca ?? app) + 4));
  // com o Fio em 3D, a névoa creme engole a barbearia antes de o palco do Fio entrar (sem o círculo do 2D)
  const tresD = fio3d ? f < app : f < app + TRANSICAO;
  const nevoaFio = fio3d ? entre(f, app - 14, app) : undefined;
  const noApp = f >= app && f < final;
  // na tela final a frase já está grande: a legenda só volta se houver fala depois dela (a pergunta dos comentários)
  const nFinal = Number(/^(\d+)/.exec(String(r.final.de))?.[1] ?? tempos.falas.length);
  const voltaLegenda = nFinal < tempos.falas.length ? quadro(tempos, String(nFinal + 1)) - 4 : Infinity;
  const semLegenda = f >= final + 4 && f < voltaLegenda;

  return (
    <AbsoluteFill style={{ background: C.escuro }}>
      {tresD && (
        <AbsoluteFill>
          <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 50, near: 0.1, far: 200, position: cam.pos }} gl={{ antialias: true }}>
            <Camera pos={cam.pos} alvo={cam.alvo} />
            <Barbearia3D f={f} cadeiras={r.cadeiras} v={v} ladrilho={ladrilho} pintura={pintura} barbeiro={{ p: pb, rot }} cliente={cliente} nevoa={nevoaFio} />
          </ThreeCanvas>
          {/* o que fica por cima (vinheta, contador, etiquetas, rodapé) some junto com a névoa */}
          <ComNevoa nevoa={nevoaFio}>
            {/* leve vinheta para o texto respirar */}
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(26,21,17,0.28) 0%, rgba(26,21,17,0) 22%, rgba(26,21,17,0) 62%, rgba(26,21,17,0.35) 100%)" }} />

            {/* contador de custo */}
            {f >= etapas[0].q - 4 && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 120 + grande * 170, display: "flex", justifyContent: "center", transform: `scale(${aparece * pulo * (1 + grande * 0.45)})` }}>
                <div style={{ background: grande > 0.5 ? C.acento : "rgba(26,21,17,0.9)", borderRadius: 34, padding: "22px 54px 26px", textAlign: "center", boxShadow: "0 24px 50px -20px rgba(0,0,0,0.6)" }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 30, letterSpacing: "0.12em", color: grande > 0.5 ? "#fbe9e2" : "#e7b9a9" }}>{r.contador}</div>
                  <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 92, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>{reais(valor)}</div>
                </div>
              </div>
            )}

            {/* etiquetas das últimas peças */}
            {f < total - 4 &&
              atual.slice(-3).map((e, i, lista) => {
                const s = mola(f, e.q, { damping: 12, stiffness: 200 });
                const velha = lista.length - 1 - i;
                return (
                  <div key={e.q} style={{ position: "absolute", left: 60, top: 360 + velha * 92, transform: `translateX(${(1 - s) * -500}px)`, opacity: velha ? 0.6 : 1, display: "flex", alignItems: "center", gap: 18, background: "rgba(26,21,17,0.86)", borderRadius: 999, padding: "16px 30px", fontFamily: F.sans, fontWeight: 700, fontSize: 40, color: "#fff" }}>
                    {e.rotulo}
                    <span style={{ color: "#f0a58f", fontWeight: 800 }}>{reais(e.valor)}</span>
                  </div>
                );
              })}

            {/* o cliente que não veio */}
            {falta && f >= falta.some && f < app && (
              <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", transform: `scale(${mola(f, falta.some, { damping: 9, stiffness: 220 })}) rotate(-4deg)` }}>
                <div style={{ border: `8px solid ${C.acento}`, color: C.acento, background: "rgba(255,255,255,0.92)", borderRadius: 24, padding: "10px 46px", fontFamily: F.sans, fontWeight: 900, fontSize: 96, letterSpacing: "0.06em" }}>FALTOU</div>
              </div>
            )}

            {r.rodape && f >= total && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: "rgba(255,255,255,0.85)", opacity: entre(f, total + 10, total + 24) }}>{r.rodape}</div>
            )}
          </ComNevoa>
        </AbsoluteFill>
      )}

      {/* formato novo: o palco do Fio em 3D (celular, frases e o fecho com a chamada dupla) */}
      {fio3d && f >= app && (
        <AbsoluteFill>
          <ThreeCanvas width={1080} height={1920} camera={{ fov: FOV_FIO3D, near: 0.05, far: 200, position: [0, 0, 5.6] }} gl={{ antialias: true }}>
            <CenaFio3D f={f} telas={fio3d.telas} frases={fio3d.frases} entrada={app} final={final} />
          </ThreeCanvas>
        </AbsoluteFill>
      )}

      {/* o celular com o Fio (entra por um círculo que abre do meio) */}
      {!fio3d && r.app && f >= app && f < final + TRANSICAO && (
        <Sequence from={app} durationInFrames={final + TRANSICAO - app}>
          <AbsoluteFill style={{ clipPath: `circle(${entre(f - app, 0, TRANSICAO, [0, 1], sai) * 1400}px at 540px 960px)` }}>
            <ProvedorCena value={{ tempos, inicio: app, dur: final + TRANSICAO - app }}>
              <App c={{ tipo: "app", de: r.app.de, tela: r.app.tela }} />
            </ProvedorCena>
          </AbsoluteFill>
        </Sequence>
      )}
      {!fio3d && f >= final && (
        <Sequence from={final} durationInFrames={fim - final}>
          <AbsoluteFill style={{ clipPath: `circle(${entre(f - final, 0, TRANSICAO, [0, 1], sai) * 2400}px at 540px 960px)` }}>
            <ProvedorCena value={{ tempos, inicio: final, dur: fim - final }}>
              <Final c={{ tipo: "final", de: r.final.de, chamada: r.final.chamada, subchamada: r.final.subchamada }} />
            </ProvedorCena>
          </AbsoluteFill>
        </Sequence>
      )}

      {/* no Fio em 3D a legenda fica logo abaixo do celular (1330), como no vídeo de atração */}
      {!semLegenda && <LegendaDinamica f={f} blocos={blocos} chaves={r.chaves ?? []} topo={fio3d && f >= app ? 1330 : noApp ? 1500 : f >= final ? 1620 : 1380} firme={!!fio3d} />}

      {/* sons */}
      <Som em={volta} tipo="whooshLongo" />
      {etapas.map((e) => (
        <React.Fragment key={e.q}>
          <Som em={e.q} tipo="pop" />
          <Som em={e.q + 4} tipo="tecla" />
        </React.Fragment>
      ))}
      <Som em={total} tipo="bumbo" />
      {falta && <Som em={falta.marca} tipo="pop" vol={0.6} />}
      {falta && <Som em={falta.some} tipo="boing" />}
      <Som em={app} tipo="whooshLongo" />
      {fio3d?.telas.slice(1).map((x) => <Som key={`t${x.de}`} em={x.de} tipo="toque" vol={0.7} />)}
      {fio3d?.frases.map((x) => <Som key={`f${x.de}`} em={x.de} tipo="pop" />)}
      {fio3d && <Som em={final + 4} tipo="sino" vol={0.8} />}
      {voz && <Audio src={staticFile(voz)} />}
      {musica && <Audio src={staticFile(musica)} volume={0.55} />}
    </AbsoluteFill>
  );
}
