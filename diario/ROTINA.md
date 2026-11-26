# Rotina diária: os 5 vídeos, os stories e o carrossel do DIA

Você está rodando sozinho (GitHub Actions), sem ninguém para perguntar. Faça os 5 vídeos, o bloco de stories e o carrossel do
dia `DIA` e ponha tudo na fila do Instagram. Quem posta é a função do Supabase, na hora marcada.

**Onde trabalhar.** Rode todos os comandos de dentro da pasta dos vídeos, a que tem `diario/`, `scripts/` e `src/`. No
repositório `fio-videos`, ela é a própria raiz. Se você estiver num repositório com uma pasta `videos/` que tem esses
itens, entre nela (`cd videos`) antes de cada comando.

**A data.** `DIA` (AAAA-MM-DD) vem na mensagem que iniciou a rotina e também na variável de ambiente `DIA`. Quase
sempre é **amanhã** (a rotina prepara o dia seguinte). Nos comandos abaixo, **escreva a data por extenso no lugar de
`$DIA`** (ex.: `diario/2026-11-20/08h.json`), para nada depender de variável.

**Os ids nos comandos.** Onde um comando tiver `<tema>` ou `<id>`, troque pelo valor real antes de rodar: `<tema>` é o
id do tema (ex.: `poste-por-dentro`) e `<id>` é o id do vídeo (ex.: `2026-11-20-18h-poste-por-dentro`).

**O tempo.** O trabalho inteiro tem um limite de 3 horas, contando a instalação. Os vídeos renderizam em segundo plano
enquanto você faz os stories e o carrossel. **Passadas 2 horas e 10 minutos do começo**, pare as revisões e publique o que estiver pronto (veja "Se algo der errado").

## O dia

| Hora | Arquivo | Tipo | Formato | id do vídeo |
|---|---|---|---|---|
| 8h | `diario/$DIA/08h.json` | informativo A | 2D | `$DIA-08h-<tema>` |
| 11h | `diario/$DIA/11h.json` | `atracao-2d` | 2D | `$DIA-11h-<tema>` |
| 13h | `diario/$DIA/13h.json` | informativo B | 2D | `$DIA-13h-<tema>` |
| 18h | `diario/$DIA/18h.json` | `atracao-2d` (a segunda do dia) | 2D | `$DIA-18h-<tema>` |
| 21h | `diario/$DIA/21h.json` | informativo C | 2D | `$DIA-21h-<tema>` |

`<tema>` é o `id` do tema no banco, igualzinho. O roteiro também leva `"tema": "<id do tema>"`.

**Os informativos A, B e C** giram pelo dia do ano. Rode (com a data no lugar de `$DIA`):

```sh
node -e 'const [a,m,d]=process.argv[1].split("-").map(Number);const n=(Date.UTC(a,m-1,d)-Date.UTC(a,0,1))/864e5+1;console.log("dia do ano",n,"resto",n%3)' $DIA
```

| resto | 8h | 13h | 21h |
|---|---|---|---|
| 0 | `curiosidade` | `dica` | `conceito` |
| 1 | `dica` | `conceito` | `curiosidade` |
| 2 | `conceito` | `curiosidade` | `dica` |

Exemplo: 2026-11-20 é o dia 324 do ano, resto 0: 8h curiosidade, 13h dica, 21h conceito.

**Cada tipo sai uma vez só no dia**, menos a atração 2D, que sai duas vezes (11h e 18h) com **temas diferentes**. Nunca
repita um tipo para cobrir outro horário.

**Sem 3D.** O dono pediu para parar os vídeos 3D (não estavam bons nem performando). Não use `fazer-3d.mjs`, os temas
`atracao-3d` nem a seção "Vídeo 3D" do GUIA.

## Passo a passo

### 1. Prepare e leia

1. Marque a hora do começo: `mkdir -p out && date +%s > out/inicio.txt`. Para ver quanto tempo passou:
   `echo $(( ($(date +%s) - $(cat out/inicio.txt)) / 60 )) min`.
2. Se a pasta `diario/$DIA/` já tiver roteiros (a rotina rodou de novo no mesmo dia), não escolha outro tema para
   esses horários: aproveite os roteiros que já existem e faça só o que falta.
3. Leia **inteiro** o `diario/GUIA.md`: os horários, as restrições, os limites de tempo, a linha única, o que o Fio faz,
   as peças e o padrão de qualidade.
4. Leia os 5 pilotos em `diario/pilotos/`. Eles são o padrão que o dono aprovou: copie o tamanho, o ritmo, a ponte, a
   parte do Fio e o fecho.
5. Veja o que já saiu: `node scripts/motor/historico.mjs 40`.

### 2. Escolha os 5 temas

Para cada tipo do dia, liste os temas livres:

```sh
node scripts/motor/banco.mjs livres atracao-2d $DIA
node scripts/motor/banco.mjs livres curiosidade $DIA
node scripts/motor/banco.mjs livres dica $DIA
node scripts/motor/banco.mjs livres conceito $DIA
```

Cada linha é `id — título`. A lista já tira os temas usados nos últimos 60 dias (pelos roteiros salvos em `diario/`,
pela fila do Instagram e pelos temas dos pilotos, presos até 12/01/2027). Regras:

- **Escolha só da lista.** Nunca invente tema.
- **Lista vazia:** se a lista de um tipo vier vazia, **aquele horário fica sem vídeo**. Não troque por outro tipo, não
  repita um tipo do dia e não use tema de outro tipo. Conte no resumo qual horário ficou vazio e por quê.
- Leia o tema escolhido em `diario/banco/temas.json`: os `fatos`, a `ponte`, a `tela` e as `pecas`.
- **Um objeto é assunto de um vídeo só, por vários dias.** Os 5 temas do dia têm assuntos diferentes, e o objeto
  principal (poste, navalha, máquina, tesoura, pente, cadeira, toalha, espelho) não pode ter sido assunto nos últimos 7
  dias. Confira os `tema` e `titulo` dos roteiros em `diario/<dia>/*.json` dos 7 dias anteriores. Exemplo: dois vídeos
  do poste (a história do sangue e a ilusão das listras) são temas diferentes, mas não saem perto um do outro. Se a
  regra do objeto deixar a lista de um tipo sem opção, ela cede: escolha o tema livre cujo objeto saiu há mais tempo.
- Varie as telas do Fio entre os vídeos do dia (o campo `tela` dos temas).
- As duas atrações (11h e 18h) saem da mesma lista `atracao-2d`, com temas e assuntos diferentes.

### 3. Os 5 vídeos 2D

1. Leia `src/motor/roteiro.ts`.
2. Escreva `diario/$DIA/08h.json`, `11h.json`, `13h.json`, `18h.json` e `21h.json`, cada um com o `tipo` do seu horário, seguindo
   o piloto do mesmo tipo e o GUIA. Para cada um, escreva 3 ganchos e fique com o mais forte.
3. Confira a voz e os tempos dos 5 de uma vez:

   ```sh
   node scripts/motor/fazer.mjs diario/$DIA/08h.json diario/$DIA/11h.json diario/$DIA/13h.json diario/$DIA/18h.json diario/$DIA/21h.json --so-voz
   ```

   Para cada roteiro, ele mostra o tempo de cada fala e, no fim, a linha `conteúdo … s · ponte … s · Fio … s · total
   … s`. Se aparecer `✗` ou um tempo dessa linha fora das metas do GUIA, corrija o roteiro e rode de novo só aquele.
   Se o comando parar no meio (erro sem `✗`, como uma falha da voz), rode de novo só os roteiros que não chegaram a
   mostrar a linha de tempos.
4. Comece o render dos 2D em segundo plano. **Cada vídeo roda no seu próprio processo, um depois do outro**: se um
   quebrar, os outros continuam. Troque cada `<id>` pelo id do vídeo:

   ```sh
   rm -rf out/motor/<id do 08h> out/motor/<id do 11h> out/motor/<id do 13h> out/motor/<id do 18h> out/motor/<id do 21h>
   nohup sh -c 'for h in 08h 11h 13h 18h 21h; do echo "▶▶ $h"; node scripts/motor/fazer.mjs diario/$DIA/$h.json --quadros; echo "FIM $h: código $?"; done; echo "FIM: tudo"' > out/log-2d.txt 2>&1 < /dev/null &
   echo $! > out/pid-2d.txt
   ```

   Nesse comando, troque `$DIA` pela data escrita (ex.: `diario/2026-11-20/$h.json`); o `$h` fica como está.

   Tire da lista `08h 11h 13h 18h 21h` o horário que ficou sem tema.

### Como esperar um trabalho em segundo plano

Não use laços de `sleep`. Espere assim (nessa chamada, use o tempo de espera máximo da ferramenta, 600000 ms):

```sh
timeout 540 tail --pid=$(cat out/pid-2d.txt) -f /dev/null; tail -n 20 out/log-2d.txt
```

Ele volta quando o trabalho termina ou depois de 9 minutos. Repita até o fim do log mostrar que acabou:
- 2D (`out/log-2d.txt`, `out/pid-2d.txt`): a linha `FIM: tudo`. Cada vídeo tem a sua linha `FIM 08h: código …`;
  código 0 é sucesso.

Outro código ou uma linha com `✗` é erro: leia o log para saber o motivo. Enquanto espera, adiante outro passo (os
stories, por exemplo).

### Como abrir os quadros

São dezenas de quadros por vídeo. **Abra em lotes**: numa mesma mensagem, faça de 6 a 10 chamadas da ferramenta de ler
arquivo, uma por quadro, e só depois olhe o resultado. Nunca abra um quadro por mensagem: as rodadas acabam antes do
fim do trabalho. Liste os quadros com `ls out/motor/<id>/` (troque `<id>` pelo id do vídeo) e abra **todos**, em ordem.

### 4. Revise os 2D

1. Quando o `out/log-2d.txt` tiver `FIM: tudo`, veja quais vídeos saíram (`ls out/motor/*.mp4`) e o código de cada
   um (`grep FIM out/log-2d.txt`).
2. **Vídeo sem `.mp4` ficou para trás:** leia o motivo no log (`✗` ou a mensagem de erro), corrija se for do roteiro e
   rode só ele (passo 4.4).
3. Para cada vídeo que saiu, abra **todos** os quadros em `out/motor/<id>/` (em lotes) e confira o "Padrão de
   qualidade" do GUIA.
4. Se precisar corrigir, corrija o roteiro e refaça **só aquele vídeo** (no máximo 2 voltas por vídeo). Troque `<id>`
   pelo id do vídeo e `13h` pelo horário dele:

   ```sh
   rm -rf out/motor/<id>
   nohup sh -c 'node scripts/motor/fazer.mjs diario/$DIA/13h.json --quadros; echo "FIM: código $?"' > out/log-13h.txt 2>&1 < /dev/null &
   echo $! > out/pid-13h.txt
   ```

   Espere com `out/pid-13h.txt` e `out/log-13h.txt` (a linha `FIM: código …`).
5. Publique cada vídeo aprovado assim que ele estiver pronto (passo 5). Não espere os outros.

### 5. Publique

Um comando por vídeo pronto (o `.mp4` precisa existir em `out/motor/<id>.mp4`):

```sh
node scripts/motor/publicar.mjs $DIA 8h:diario/$DIA/08h.json
node scripts/motor/publicar.mjs $DIA 11h:diario/$DIA/11h.json
node scripts/motor/publicar.mjs $DIA 13h:diario/$DIA/13h.json
node scripts/motor/publicar.mjs $DIA 18h:diario/$DIA/18h.json
node scripts/motor/publicar.mjs $DIA 21h:diario/$DIA/21h.json
```

- `agendado: …` é sucesso. `já na fila` quer dizer que ele já estava agendado.
- Se você refez um vídeo que já estava na fila, use `--trocar` no fim do comando (só troca se ainda não foi postado).
- `horário já passou`: aquele horário ficou para trás (acontece quando o GitHub atrasa muito e `DIA` é hoje). Não
  tente outro horário; só conte no resumo.

### 6. Stories

Igual a antes (veja "Stories do dia" no GUIA):

1. Se `diario/$DIA/stories.json` ainda não existir, escreva o bloco único das 9h, com 4 quadros.
2. Faça as imagens: `node scripts/motor/stories.mjs $DIA`. Se aparecer `✗`, corrija e rode de novo.
3. Abra as imagens em `out/motor/stories/$DIA/` (em lotes) e confira texto cortado ou sobreposto.
4. Publique: `node scripts/motor/stories.mjs $DIA --publicar`.

Os stories são rápidos: se os vídeos ainda estiverem renderizando, faça os stories enquanto espera.

### 7. Carrossel (15h)

Um carrossel por dia, às 15h, que **ensina o barbeiro** a cuidar do negócio (veja "Carrossel do dia" no GUIA). Também
é rápido: faça enquanto os vídeos renderizam.

1. Escolha o tema (troque `$DIA` pela data): `node scripts/motor/banco.mjs livres carrossel $DIA`. Prefira um assunto
   diferente dos carrosséis dos últimos 7 dias (veja `diario/*/carrossel.json`). Se a lista vier vazia, não faça
   carrossel e conte no resumo.
2. Escreva `diario/$DIA/carrossel.json` seguindo o GUIA. Use só os fatos do tema; todo número tem que estar num fato.
3. Confira: `node scripts/motor/carrossel.mjs $DIA --so-conferir`. Se aparecer `✗`, corrija e rode de novo.
4. Faça as imagens: `node scripts/motor/carrossel.mjs $DIA`.
5. Abra os slides em `out/motor/carrossel/$DIA/` (em lotes) e confira texto cortado, sobreposto ou difícil de ler.
6. Publique: `node scripts/motor/carrossel.mjs $DIA --publicar`. Se precisar trocar as imagens de um carrossel que
   ainda não saiu, rode de novo com `--publicar --trocar`.

### 8. Resumo

Termine com um resumo curto:
- os 5 horários, com o tema, o gancho escolhido e os tempos (conteúdo, ponte, Fio e total) de cada um;
- o tema do bloco de stories;
- o tema do carrossel e a capa;
- o que foi agendado;
- o que falhou e por quê (com a linha de erro do log), e o que ficou de fora (horário sem tema, horário que já
  tinha passado, vídeo cortado pelo tempo).

## Se algo der errado

- **Um vídeo falhou:** os outros saem normalmente. Publique os que deram certo e explique no resumo o que falhou.
- **A voz falhou** (`NoAudioReceived`, ou a voz não devolveu palavras): a voz já tenta de novo sozinha. Se mesmo assim
  falhar, rode o mesmo comando outra vez. Se a mesma fala falhar de novo, reescreva essa fala com outras palavras (ex.:
  "Pra entender" virou "Para entender").
- **Referência que não existe** (`a palavra "…" não está na fala N`): use uma das palavras que a mensagem mostra.
  Lembre que ano depois de preposição ("em 1935") vira uma palavra só.
- **Palavra proibida** (`usa palavra proibida` ou `chama o Fio de "ferramenta"`): reescreva a fala ou a legenda.
- **O tempo está acabando:** passadas **2 horas e 10 minutos** do começo (veja `out/inicio.txt`), pare as voltas de
  revisão, não comece render novo, publique o que estiver pronto e aprovado, faça os stories e escreva o resumo. Um
  render que ainda está rodando só é publicado se terminar antes de você escrever o resumo.
- **`banco.mjs livres` sem a chave do Supabase** só enxerga os roteiros em `diario/` (e os pilotos). Na nuvem a chave
  existe; se ela faltar, conte no resumo.

## Regras

- Mude só os roteiros, os stories e o carrossel do dia (`diario/$DIA/`). Não mexa nos bancos de temas (`diario/banco/`), nos
  pilotos, no GUIA, nesta rotina nem no código do motor ou do app.
- **Não faça commit nem push.** Um passo do próprio workflow salva `diario/` no repositório depois que você termina.
- Nunca mostre nem escreva chaves ou senhas (nem em log, nem no resumo, nem nos arquivos).
- Nenhuma fala ou legenda usa "sistema", "gestão", "plataforma", "software" ou "solução", nem chama o Fio de
  "ferramenta".
- Fatos só do tema do banco. Se um fato parecer errado, troque de tema (do mesmo tipo) e conte no resumo.
