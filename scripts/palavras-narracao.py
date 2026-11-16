# Transcreve uma narração gravada e grava o momento de cada palavra (faster-whisper, word_timestamps).
#
#   python scripts/palavras-narracao.py <narracao.mp3> <saida.json>
#
# Precisa de faster-whisper e do ffmpeg. O áudio é decodificado pelo ffmpeg (o decodificador do faster-whisper
# falha com algumas versões do pacote "av"). Saída: [{"p": palavra, "a": início, "z": fim}, ...] em segundos.
import json, subprocess, sys

import numpy as np
from faster_whisper import WhisperModel

bruto = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", sys.argv[1], "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(bruto, dtype=np.float32)
modelo = WhisperModel("small", device="cpu", compute_type="int8")
trechos, _ = modelo.transcribe(audio, language="pt", word_timestamps=True)
palavras = [{"p": w.word.strip(), "a": round(w.start, 3), "z": round(w.end, 3)} for t in trechos for w in t.words]
json.dump(palavras, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(palavras)} palavras, até {palavras[-1]['z']:.1f} s")
