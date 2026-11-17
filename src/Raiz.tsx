import React from "react";
import { Audio, Composition, staticFile } from "remotion";
import { DURACAO, FPS } from "./base";
import { V1Link } from "./V1Link";
import { V2Lembretes } from "./V2Lembretes";
import { V3Agenda } from "./V3Agenda";
import { V4Equipe } from "./V4Equipe";
import { V5Financeiro } from "./V5Financeiro";
import { DURACAO_06, V6Faltas } from "./V6Faltas";
import { DURACAO_13, V13Comissao } from "./V13Comissao";
import { DURACAO_14, V14Piloto } from "./V14Piloto";
import { Narrado, type PropsNarrado } from "./Narrado";
import { Tour, linhaDoTempo, type Gravacao, type PropsTour } from "./Tour";
import { Story, type PropsStory } from "./Story";
import { StoryBloco, type PropsStoryBloco } from "./motor/StoryBloco";
import { CarrosselSlide, type PropsCarrosselSlide } from "./motor/CarrosselSlide";
import { Motor, type PropsMotor } from "./motor/Motor";
import { duracao } from "./motor/roteiro";
import { Custo3D, type PropsCusto3D } from "./custo3d/Custo3D";
import { Atracao3D, type PropsAtracao3D } from "./custo3d/Atracao3D";
import { TelaParada, type PropsTelaParada } from "./custo3d/TelaParada";
import { DURACAO_VITRINE, Vitrine3D, type PropsVitrine3D } from "./custo3d/Vitrine3D";
import tourPc from "./tour/pc.json";
import tourCel from "./tour/cel.json";

export const VIDEOS: { id: string; componente: React.FC; duracao?: number }[] = [
  { id: "01-agendamento-pelo-link", componente: V1Link },
  { id: "02-lembretes-whatsapp", componente: V2Lembretes },
  { id: "03-agenda-e-bloqueios", componente: V3Agenda },
  { id: "04-equipe-e-comissao", componente: V4Equipe },
  { id: "05-financeiro", componente: V5Financeiro },
  { id: "06-reels-cliente-nao-veio", componente: V6Faltas, duracao: DURACAO_06 },
  { id: "07-reels-cliente-nao-veio-narrado", componente: V6Faltas, duracao: DURACAO_06 },
  { id: "13-juninho-comissao", componente: V13Comissao, duracao: DURACAO_13 },
  { id: "14-piloto-cliente-marcou-de-noite", componente: V14Piloto, duracao: DURACAO_14 },
];

/** O vídeo com a trilha dele (gerada por scripts/audio.mjs). */
function comSom(Video: React.FC, numero: string): React.FC {
  return function ComSom() {
    return (
      <>
        <Video />
        <Audio src={staticFile(`audio/${numero}.wav`)} />
      </>
    );
  };
}

const EXEMPLO_NARRADO: PropsNarrado = {
  cenas: [
    { tipo: "titulo", texto: "Exemplo de vídeo narrado.", destaque: ["narrado."], fala: "" },
    { tipo: "fim", frase: "Seus lembretes prontos em 1 toque.", fala: "" },
  ],
  inicios: [0, 90],
  duracao: 210,
  audio: null,
  imagens: {},
};

const EXEMPLO_MOTOR: PropsMotor = {
  roteiro: { id: "exemplo", titulo: "Exemplo", legenda: "", falas: [{ texto: "Fio. Sua agenda cheia." }], cenas: [{ tipo: "final", de: "1" }] },
  tempos: { falas: [{ a: 0.3, z: 2.2 }], palavras: [{ p: "Fio.", f: 0, a: 0.3, z: 0.8 }, { p: "Sua", f: 0, a: 1.0, z: 1.3 }, { p: "agenda", f: 0, a: 1.3, z: 1.8 }, { p: "cheia.", f: 0, a: 1.8, z: 2.2 }] },
  voz: null,
  musica: null,
};

export function Raiz() {
  return (
    <>
      {VIDEOS.map((v) => (
        <Composition key={v.id} id={v.id} component={comSom(v.componente, v.id.slice(0, 2))} durationInFrames={v.duracao ?? DURACAO} fps={FPS} width={1080} height={1920} />
      ))}
      {/* tour gravado da plataforma (videos/gravacao/gravar-tour.mjs); extras alongam cada etapa para caber a narração */}
      <Composition
        id="tour-pc"
        component={Tour}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={DURACAO}
        defaultProps={{ gravacao: tourPc as Gravacao, extras: {}, audio: "audio/tour-pc-sem-voz.wav" } satisfies PropsTour}
        calculateMetadata={({ props }) => ({ durationInFrames: linhaDoTempo(props.gravacao, props.extras).total })}
      />
      <Composition
        id="tour-cel"
        component={Tour}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={DURACAO}
        defaultProps={{ gravacao: tourCel as Gravacao, extras: {}, audio: "audio/tour-cel-sem-voz.wav" } satisfies PropsTour}
        calculateMetadata={({ props }) => ({ durationInFrames: linhaDoTempo(props.gravacao, props.extras).total })}
      />
      {/* stories em imagem (scripts/stories.mjs renderiza cada um com as props do stories.json da semana) */}
      <Composition id="carrossel-slide" component={CarrosselSlide} fps={FPS} width={1080} height={1350} durationInFrames={1} defaultProps={{ rotulo: "Faltas", n: 1, total: 7, slide: { tipo: "capa", titulo: "Na barbearia, quase 1 em cada 5 clientes falta", curiosidade: "Quanto isso custa no seu mês?" } } as PropsCarrosselSlide} />
      <Composition id="story-bloco" component={StoryBloco} fps={FPS} width={1080} height={1920} durationInFrames={1} defaultProps={{ tema: "Faltas", n: 1, total: 5, quadro: { tipo: "dor", titulo: "3 faltas na semana são R$ 120 de cadeira vazia.", destaque: "R$ 120" } } as PropsStoryBloco} />
      <Composition id="story" component={Story} fps={FPS} width={1080} height={1920} durationInFrames={1} defaultProps={{ tipo: "gancho", rotulo: "Bom dia", titulo: "Exemplo de story do Fio.", destaque: "story" } as PropsStory} />
      {/* vídeos diários do motor (scripts/motor/fazer.mjs): roteiro, tempos, voz e música chegam por props */}
      <Composition
        id="motor"
        component={Motor}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={DURACAO}
        defaultProps={EXEMPLO_MOTOR}
        calculateMetadata={({ props }) => ({ durationInFrames: duracao(props.tempos) })}
      />
      {/* vídeos 3D "Quanto custa…?" (scripts/motor/fazer-3d.mjs): roteiro, tempos, voz e música chegam por props */}
      <Composition
        id="custo3d"
        component={Custo3D}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={DURACAO}
        defaultProps={{ roteiro: null, tempos: null, voz: null, musica: null } as PropsCusto3D}
        calculateMetadata={({ props }) => ({ durationInFrames: props.tempos ? duracao(props.tempos) : DURACAO })}
      />
      {/* vídeos 3D de atração (scripts/motor/fazer-3d.mjs, roteiros sem "etapas"): vitrine, por dentro, viagem no tempo e o Fio em 3D */}
      <Composition
        id="atracao3d"
        component={Atracao3D}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={DURACAO}
        defaultProps={{ roteiro: null, tempos: null, voz: null, musica: null } as PropsAtracao3D}
        calculateMetadata={({ props }) => ({ durationInFrames: props.tempos ? duracao(props.tempos) : DURACAO })}
      />
      {/* tela do app parada em imagem, textura do celular 3D: npx remotion still src/index.ts tela-parada <png> --props=<json> --scale=3 */}
      <Composition id="tela-parada" component={TelaParada} fps={FPS} width={390} height={844} durationInFrames={1} defaultProps={{ tela: { nome: "agenda" } } as PropsTelaParada} />
      {/* vitrine dos objetos 3D, para conferir (props: so, aberto, variante): npx remotion still src/index.ts vitrine3d <png> --frame=<n> --gl=angle */}
      <Composition id="vitrine3d" component={Vitrine3D} fps={FPS} width={1080} height={1920} durationInFrames={DURACAO_VITRINE} defaultProps={{} as PropsVitrine3D} />
      {/* vídeos narrados das semanas: roteiro, tempos e trilha chegam por props (scripts/semana.mjs) */}
      <Composition
        id="narrado"
        component={Narrado}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={DURACAO}
        defaultProps={EXEMPLO_NARRADO}
        calculateMetadata={({ props }) => ({ durationInFrames: props.duracao })}
      />
    </>
  );
}
