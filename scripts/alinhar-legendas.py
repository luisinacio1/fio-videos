# Junta o texto do roteiro com os tempos da transcrição (faster-whisper, word_timestamps) e grava
# o momento de cada palavra do roteiro: é o que guia legendas e animações de um vídeo feito sob medida.
#
#   python scripts/alinhar-legendas.py <palavras-whisper.json> <roteiro.json> <saida.json>
#
# A transcrição erra algumas palavras ("Barberia", "Leo"); por isso o texto mostrado é sempre o do roteiro,
# e só o tempo vem da transcrição. Palavra sem par ganha um tempo entre as vizinhas.
import difflib, json, re, sys, unicodedata

norm = lambda t: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode())

ouvidas = json.load(open(sys.argv[1], encoding="utf-8"))
roteiro = json.load(open(sys.argv[2], encoding="utf-8"))

palavras = []
for f, cena in enumerate(roteiro["cenas"]):
    for p in cena["fala"].split():
        palavras.append({"p": p, "f": f})

a = [norm(p["p"]) for p in palavras]
b = [norm(o["p"]) for o in ouvidas]
for bloco in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for k in range(bloco.size):
        o = ouvidas[bloco.b + k]
        palavras[bloco.a + k].update(a=o["a"], z=o["z"])

# sem par: reparte o intervalo entre a última palavra com tempo e a próxima
i = 0
while i < len(palavras):
    if "a" in palavras[i]:
        i += 1
        continue
    j = i
    while j < len(palavras) and "a" not in palavras[j]:
        j += 1
    ini = palavras[i - 1]["z"] if i > 0 else 0.0
    fim = palavras[j]["a"] if j < len(palavras) else ini + 0.4 * (j - i)
    passo = (fim - ini) / (j - i)
    for k in range(i, j):
        palavras[k].update(a=round(ini + passo * (k - i), 2), z=round(ini + passo * (k - i + 1), 2))
    i = j

falas = []
for f in range(len(roteiro["cenas"])):
    ps = [p for p in palavras if p["f"] == f]
    falas.append({"a": ps[0]["a"], "z": ps[-1]["z"]})

json.dump({"falas": falas, "palavras": palavras}, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(palavras), "palavras;", sum("a" in p for p in palavras), "com tempo")
for f, x in enumerate(falas):
    print(f"fala {f + 1:02d}  {x['a']:6.2f} - {x['z']:6.2f}")
