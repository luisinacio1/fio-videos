# Corta uma narração gravada de uma vez em um arquivo por parágrafo do texto.
# Usa os tempos de cada palavra da transcrição (faster-whisper, word_timestamps) para achar onde cada parágrafo começa.
#
#   python scripts/separar-narracao.py <palavras-whisper.json> <narracao-44k.wav> <texto.txt> <pasta-saida>
#
# Saída: fala-01.wav, fala-02.wav… (um por parágrafo) e a lista do que foi ouvido em cada um, para conferir.
import difflib, json, os, re, sys, unicodedata, wave

norm = lambda t: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode())

ouvidas = json.load(open(sys.argv[1], encoding="utf-8"))
paragrafos = [p.strip() for p in open(sys.argv[3], encoding="utf-8").read().split("\n\n") if p.strip()]
saida = sys.argv[4]
os.makedirs(saida, exist_ok=True)

esp, dono = [], []
for f, texto in enumerate(paragrafos):
    for w in texto.split():
        n = norm(w)
        if n:
            esp.append(n)
            dono.append(f)
ouv = [norm(o["p"]) for o in ouvidas]
mapa = {}
for b in difflib.SequenceMatcher(None, esp, ouv, autojunk=False).get_matching_blocks():
    for k in range(b.size):
        mapa[b.a + k] = b.b + k

inicio = []
for f in range(len(paragrafos)):
    idx = [mapa[i] for i in range(len(esp)) if dono[i] == f and i in mapa]
    inicio.append(min(idx) if idx else None)
# primeira palavra não reconhecida: começa logo depois da última reconhecida do parágrafo anterior
for f in range(1, len(paragrafos)):
    if dono.index(f) not in mapa or inicio[f] is None:
        anteriores = [mapa[i] for i in range(len(esp)) if dono[i] == f - 1 and i in mapa]
        inicio[f] = max(anteriores) + 1
assert inicio == sorted(inicio), f"ordem quebrada: {inicio}"

w = wave.open(sys.argv[2])
sr, canais, larg = w.getframerate(), w.getnchannels(), w.getsampwidth()
x = w.readframes(w.getnframes())
total = w.getnframes() / sr
cortes = [0.0] + [(ouvidas[i - 1]["z"] + ouvidas[i]["a"]) / 2 for i in inicio[1:]] + [total]
passo = canais * larg
for f in range(len(paragrafos)):
    a, z = cortes[f], cortes[f + 1]
    o = wave.open(os.path.join(saida, f"fala-{f + 1:02d}.wav"), "wb")
    o.setnchannels(canais)
    o.setsampwidth(larg)
    o.setframerate(sr)
    o.writeframes(x[int(a * sr) * passo:int(z * sr) * passo])
    o.close()
    fim = (inicio[f + 1] if f + 1 < len(paragrafos) else len(ouvidas)) - 1
    ouvido = " ".join(p["p"] for p in ouvidas[inicio[f]:fim + 1])
    nota = difflib.SequenceMatcher(None, norm(paragrafos[f]), norm(ouvido)).ratio()
    print(f"fala {f + 1:02d}  {a:6.2f}-{z:6.2f}  semelhança {nota:.2f} | {ouvido}")
