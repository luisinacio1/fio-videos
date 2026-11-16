# Rotina de domingo: repor o banco de temas

Você está rodando sozinho (GitHub Actions), sem ninguém para perguntar. Todo vídeo do dia sai de um tema do banco
(`diario/banco/temas.json`), e cada tema só volta depois de 60 dias. Sua tarefa é **repor o banco até ter 25 temas
livres de cada tipo**, com fatos pesquisados na web e conferidos.

Rode todos os comandos de dentro da pasta dos vídeos, a que tem `diario/`, `scripts/` e `src/`. No repositório
`fio-videos`, ela é a própria raiz. Se você estiver num repositório com uma pasta `videos/` que tem esses itens, entre
nela (`cd videos`) antes de cada comando.

**Quando parar.** Marque a hora do começo (`mkdir -p out && date +%s > out/inicio-banco.txt`; para ver quanto passou:
`echo $(( ($(date +%s) - $(cat out/inicio-banco.txt)) / 60 )) min`). Pare de pesquisar quando **todos os tipos tiverem
25 temas livres** ou quando **passarem 2 horas** do começo, o que vier primeiro. Ao parar, termine o tema que está
escrevendo só se ele já tiver todos os fatos lidos; senão, deixe-o de fora. Depois vá direto para "Confira".

## 1. Leia

1. `diario/GUIA.md`: "Posicionamento", "O que o Fio faz", "Linha única", "Restrições globais" e os catálogos de peças
   (2D e 3D). O tema precisa caber nas peças que existem e ter uma ponte honesta para o Fio.
2. `src/motor/banco.ts`: o formato do tema e o que a conferência recusa.
3. `diario/banco/temas.json` inteiro, para não repetir tema nem ângulo.

## 2. Conte o que falta

Para cada tipo, conte os temas livres hoje:

```sh
node scripts/motor/banco.mjs livres curiosidade | grep -c " — "
node scripts/motor/banco.mjs livres dica | grep -c " — "
node scripts/motor/banco.mjs livres conceito | grep -c " — "
node scripts/motor/banco.mjs livres atracao-2d | grep -c " — "
node scripts/motor/banco.mjs livres atracao-3d | grep -c " — "
```

Faltam `25 − N` temas daquele tipo. Se já tiver 25 ou mais, não acrescente nenhum. Faça no máximo 10 temas novos de
cada tipo por domingo; comece pelo tipo com menos temas livres e vá alternando entre os tipos, para o limite de 2 horas
não deixar um tipo inteiro sem tema novo.

Veja também como as telas e as peças estão distribuídas no banco inteiro:

```sh
node -e 'const t=require("./diario/banco/temas.json");const c=(k)=>{const o={};for(const x of t)for(const v of [].concat(x[k]))o[v]=(o[v]||0)+1;return o};console.log("tela",c("tela"));console.log("pecas",c("pecas"))'
```

## 3. Pesquise

Use a busca e a leitura de páginas da web. Para cada fato:

- **Só entra um fato que você abriu e leu na página.** Abra o link, ache o trecho que diz aquilo e só então escreva o
  fato. Resultado de busca, resumo ou memória não contam.
- **A fonte é o link `https://` da página onde o fato está**, não da página inicial do site.
- **Fontes confiáveis:** enciclopédias (Wikipédia em português ou inglês, só o que o verbete diz), museus, universidades,
  órgãos públicos, Sebrae, dicionários, jornais e revistas grandes, livros e artigos citados. **Não servem:** blog de
  marca vendendo produto, loja, fórum, página sem autor nem fonte, texto que parece feito por IA.
- **Escreva o fato do tamanho que a página diz.** Não exagere nem complete: se a página diz "por volta de 1900", o
  fato diz "por volta de 1900"; se ela não diz o país, o fato não diz o país; "procedimentos" não vira "cirurgias".
  Uma frase por fato, em português simples.
- **Proibido:** promessa de saúde (crescer cabelo, curar queda, tratar caspa), produto milagroso, preço inventado e
  estatística sem fonte. Preço só entra em tema `montar`, e os valores do vídeo vêm só de `diario/precos-3d.json`.
- Cada tema precisa de **pelo menos 3 fatos** (as atrações, **pelo menos 4**), o bastante para 45 a 100 s de conteúdo.
  Esses números são o mínimo: tema com menos fatos não entra. Mais fatos (até uns 6) deixam o vídeo mais rico.

### `fonte: "oficio"`

- Só vale para `dica` e `conceito`, e só para conhecimento de ofício que qualquer barbeiro confirma (o que é um
  pezinho, o respiro entre um cliente e outro, o que pedir na cadeira).
- `curiosidade`, `atracao-2d` e `atracao-3d`: todo fato com link `https://`, sempre.
- Nada que precise de número, data, nome ou lei usa "oficio": isso pede link.

## 4. Escreva o tema

Acrescente no fim de `diario/banco/temas.json`, neste formato:

```json
{
  "id": "id-curto-do-tema",
  "tipo": "curiosidade",
  "titulo": "…",
  "gancho": "…",
  "fatos": [
    { "texto": "…", "fonte": "https://…" }
  ],
  "ponte": "…",
  "tela": "lembretes",
  "pecas": ["objeto", "linhaDoTempo", "texto"]
}
```

- **`id`**: curto, só minúsculas, números e hífen, sem repetir nenhum id do banco. Não repita o ângulo de um tema que
  já existe com outras palavras.
- **`tipo`**: `curiosidade`, `dica`, `conceito`, `atracao-2d` ou `atracao-3d`.
- **`gancho`**: uma sugestão de fala 1, com no máximo 9 palavras, sem "Fio" e sem as palavras proibidas.
- **`ponte`**: uma ou duas frases que **saem do próprio assunto** e chegam num problema que o Fio resolve de verdade
  (cliente que falta ou esquece, "tem horário?", mensagem no meio do corte, caderno, cancelamento, agenda bagunçada).
  Só com o que está em "O que o Fio faz" no GUIA. **Se não existir uma ponte honesta, o tema não entra.** Nada de
  "sistema", "gestão", "plataforma", "software", "solução" nem "ferramenta" para o Fio.
  - Boa: "O poste avisava de longe: aqui tem barbeiro. Hoje o cliente quer saber outra coisa: tem horário?"
  - Ruim (forçada): "Falando em navalha, conheça o Fio."
- **`tela`**: `agendamento`, `lembretes`, `agenda`, `bloqueio` ou `equipe`, a que combina com a ponte. **Equilibre:**
  o banco tem muito `agendamento`. Quando a ponte combinar com mais de uma tela, prefira a que tem menos temas
  (`lembretes`, `agenda`, `bloqueio`). `equipe` só quando o tema for sobre equipe ou comissão.
- **`pecas`**: as peças que o vídeo vai usar.
  - 2D (`curiosidade`, `dica`, `conceito`, `atracao-2d`): `quarto`, `sala`, `barbearia`, `cidade`, `app`, `texto`,
    `final`, `corte`, `objeto`, `linhaDoTempo`, `compara`, `passos`, `barbeariaAntiga`, `apresentaFio`.
  - 3D (`atracao-3d`): `vitrine`, `porDentro`, `viagemNoTempo`, `montar`.
  - Nunca misture 2D e 3D, e nunca deixe a lista vazia.
  - **Equilibre:** varie as peças (não ponha `texto` em tudo) e prefira as que aparecem menos na contagem do passo 2.
    No 3D, `porDentro` só com máquina, navalha, tesoura ou poste; `vitrine` com poste, cadeira antiga, cadeira
    moderna, máquina, navalha, tesoura, espelho, toalha ou pente; `viagemNoTempo` é a barbearia de 1920 virando a de
    hoje. Tema `montar` novo só com um ângulo diferente dos que já existem e com valores que estão em
    `diario/precos-3d.json` (barbearia de 1, 2 ou 3 cadeiras).
  - **Varie os objetos:** o poste já tem vários temas. Prefira assuntos com outros objetos ou sem objeto.

## 5. Confira

```sh
node scripts/motor/banco.mjs conferir
```

Ele precisa dizer `banco ok: N temas`, sem erro. Se aparecer `✗`, corrija o tema e rode de novo. Depois, conte de novo
os livres (passo 2) para o resumo.

Antes de terminar, releia cada tema novo e confirme:
- todo fato tem a página aberta e lida, e diz só o que a página diz;
- nenhuma promessa de saúde, produto milagroso, preço ou estatística sem fonte;
- a ponte é honesta e só fala do que o Fio faz;
- `tela` e `pecas` ajudam a equilibrar o banco.

## 6. Resumo

Termine com um resumo curto: quantos temas livres cada tipo tinha e tem agora, os ids novos (com o título), os sites
usados como fonte e os temas que você pensou e deixou de fora (e por quê: sem fonte, sem ponte honesta, repetido).

## Regras

- Mude só `diario/banco/temas.json`. Não apague nem renomeie temas que já existem: o histórico dos vídeos usa os ids.
  Se achar um fato errado num tema antigo, corrija o texto pela fonte e conte no resumo.
- **Não faça commit nem push.** O workflow confere o banco de novo e salva o arquivo se a conferência passar.
- Nunca mostre nem escreva chaves ou senhas.
