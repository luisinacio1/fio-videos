# Junta as falas de um roteiro do motor com os tempos da narração gravada e grava os tempos no formato do motor
# ({falas: [{a, z}], palavras: [{p, f, a, z}]}, ver src/motor/roteiro.ts).
#
#   python scripts/alinhar-falas.py <palavras-narracao.json> <roteiro.json> <tempos.json>
#
# O texto mostrado é sempre o do roteiro; só o tempo vem da transcrição, que erra algumas palavras.
# Palavra sem par ganha um tempo entre as vizinhas.
import difflib, json, re, sys, unicodedata

norm = lambda t: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode())

ouvidas = [o for o in json.load(open(sys.argv[1], encoding="utf-8")) if norm(o["p"])]
roteiro = json.load(open(sys.argv[2], encoding="utf-8"))

palavras = [{"p": p, "f": f} for f, fala in enumerate(roteiro["falas"]) for p in fala["texto"].split()]
a = [norm(p["p"]) for p in palavras]
b = [norm(o["p"]) for o in ouvidas]
casadas = 0
for bloco in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for k in range(bloco.size):
        o = ouvidas[bloco.b + k]
        palavras[bloco.a + k].update(a=o["a"], z=o["z"])
        casadas += 1

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
        palavras[k].update(a=round(ini + passo * (k - i), 3), z=round(ini + passo * (k - i + 1), 3))
    i = j

falas = []
for f in range(len(roteiro["falas"])):
    ps = [p for p in palavras if p["f"] == f]
    falas.append({"a": ps[0]["a"], "z": ps[-1]["z"]})
json.dump({"falas": falas, "palavras": palavras}, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{casadas} de {len(palavras)} palavras do roteiro casaram com a narração")
