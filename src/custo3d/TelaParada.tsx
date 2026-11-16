import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../base";
import { LARGURA_TELA, ALTURA_TELA } from "../motion/TelasFio";
import { Tela, type TelaStory } from "../motor/StoryBloco";

/**
 * Uma tela do app parada, em 390x844, para virar textura do celular 3D.
 * Mesmo tamanho e fundo da tela dentro do Celular dos stories; renderize com --scale=3 (1170x2532).
 */
export type PropsTelaParada = { tela: TelaStory };

export function TelaParada({ tela }: PropsTelaParada) {
  return (
    <AbsoluteFill>
      <div style={{ position: "relative", width: LARGURA_TELA, height: ALTURA_TELA, overflow: "hidden", background: C.fundo }}>
        <Tela t={tela} />
      </div>
    </AbsoluteFill>
  );
}
