# Narração com a voz grátis (edge-tts), uma fala por arquivo, com o tempo de cada palavra.
# Lê o roteiro (json com voz, velocidade e falas[].texto) e grava em <saida>/:
#   fala-01.mp3, fala-02.mp3, ...  e  palavras.json  ([[{p, a, z}, ...] por fala], em segundos)
# Uso: python scripts/voz-gratis.py <roteiro.json> <pasta-de-saida>
# Se o serviço não devolver áudio numa fala (NoAudioReceived, acontece de vez em quando), ela é tentada de novo.
import asyncio
import json
import os
import sys

import edge_tts


async def falar(texto, voz, velocidade, arquivo):
    com = edge_tts.Communicate(texto, voz, rate=velocidade, boundary="WordBoundary")
    palavras = []
    with open(arquivo, "wb") as f:
        async for parte in com.stream():
            if parte["type"] == "audio":
                f.write(parte["data"])
            elif parte["type"] == "WordBoundary":
                a = parte["offset"] / 1e7
                palavras.append({"p": parte["text"], "a": round(a, 3), "z": round(a + parte["duration"] / 1e7, 3)})
    return palavras


async def falar_com_volta(texto, voz, velocidade, arquivo, vezes=6):
    """A voz grátis às vezes não devolve áudio (NoAudioReceived) numa fala qualquer: tenta de novo, com uma espera curta."""
    for n in range(1, vezes + 1):
        try:
            return await falar(texto, voz, velocidade, arquivo)
        except edge_tts.exceptions.NoAudioReceived:
            if n == vezes:
                raise
            print(f"  (sem áudio na fala, tentando de novo: {n}/{vezes - 1})", file=sys.stderr, flush=True)
            await asyncio.sleep(2 * n)


async def main():
    roteiro_arq, saida = sys.argv[1], sys.argv[2]
    with open(roteiro_arq, encoding="utf8") as f:
        roteiro = json.load(f)
    os.makedirs(saida, exist_ok=True)
    todas = []
    for i, fala in enumerate(roteiro["falas"], 1):
        arquivo = os.path.join(saida, f"fala-{i:02d}.mp3")
        ps = await falar_com_volta(fala["texto"], roteiro.get("voz", "pt-BR-AntonioNeural"), fala.get("velocidade", roteiro.get("velocidade", "+0%")), arquivo)
        todas.append(ps)
        print(arquivo, " ".join(p["p"] for p in ps))
    with open(os.path.join(saida, "palavras.json"), "w", encoding="utf8") as f:
        json.dump(todas, f, ensure_ascii=False, indent=1)


asyncio.run(main())
