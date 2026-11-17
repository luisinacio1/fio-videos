# Guia dos vídeos diários do Fio

Todo dia saem **5 vídeos**: 2 de atração (um em 2D e um em 3D) e 3 informativos (uma curiosidade, uma dica e um
conceito). Cada roteiro é um JSON que o motor transforma em vídeo: voz grátis, cenários desenhados, telas reais do app,
legenda dinâmica e música. O passo a passo do dia está em `diario/ROTINA.md`.

- **O padrão de qualidade são os 5 pilotos aprovados pelo dono**, em `diario/pilotos/`: `atracao-2d.json`,
  `atracao-3d.json`, `curiosidade.json`, `dica.json` e `conceito.json`. Antes de escrever, abra o piloto do mesmo tipo
  e copie o jeito dele: o tamanho, o ritmo, a ponte, a parte do Fio e o fecho.
- Os exemplos curtos de cada peça estão em `diario/teste/pecas/`.
- O formato completo do 2D está em `src/motor/roteiro.ts`. O do 3D está em `src/custo3d/atracao.ts` (planos) e
  `src/custo3d/roteiro.ts` ("Quanto custa montar", com etapas).

Todos os caminhos deste guia são a partir da pasta dos vídeos (a que tem `diario/`, `scripts/` e `src/`).

## Os 5 horários

| Hora | Vídeo | Tipo no roteiro | Formato | Como faz |
|---|---|---|---|---|
| 8h | Informativo | `curiosidade`, `dica` ou `conceito` | 2D | `scripts/motor/fazer.mjs` |
| 11h | Atração 2D | `atracao-2d` | 2D | `scripts/motor/fazer.mjs` |
| 13h | Informativo | `curiosidade`, `dica` ou `conceito` | 2D | `scripts/motor/fazer.mjs` |
| 18h | Atração 3D | `atracao-3d` | 3D | `scripts/motor/fazer-3d.mjs` |
| 21h | Informativo | `curiosidade`, `dica` ou `conceito` | 2D | `scripts/motor/fazer.mjs` |

- Os 3 informativos do dia são **um de cada tipo**: uma `curiosidade`, uma `dica` e um `conceito`. A ordem gira de um
  dia para o outro (a conta está na ROTINA).
- Os stories são 1 bloco por dia, às 9h, com 4 quadros (veja "Stories do dia", no fim).

O que é cada tipo:

- **Atração:** produção maior, contada como história ou minidocumentário. Em 2D, com personagens, cenários e objetos.
  Em 3D, com objetos girando, abrindo por dentro, a barbearia de 1920 virando a de hoje ou o "Quanto custa montar".
- **Curiosidade:** um fato surpreendente e verdadeiro, com fonte.
- **Dica:** algo prático que a pessoa usa hoje ("Como pedir o corte que você quer sem dar errado").
- **Conceito:** explica um termo ou uma ideia ("Degradê baixo, médio e alto: qual a diferença?").

## Restrições globais (valem para todo vídeo)

| Regra | O que fazer |
|---|---|
| 2D ou 3D | Cada vídeo é 2D **ou** 3D, nunca os dois. No 3D, só a legenda dinâmica fica por cima; o celular e o fecho são objetos 3D. |
| Gancho | A fala 1 tem **no máximo 9 palavras**. |
| Tempos | Conteúdo, ponte, Fio e total dentro das metas (veja "Os limites de tempo"). |
| Fio só depois da ponte | Antes da fala da `ponte`, nenhuma fala escreve `Fio` com F maiúsculo, nem no começo da frase ("Fio da navalha…" é recusado). "o fio da navalha", em minúscula, pode. |
| Chamada dupla | Texto exato, numa fala só: "É barbeiro? Link na bio. Não é? Manda esse vídeo pro seu barbeiro." |
| Palavras proibidas | Nunca: sistema, gestão, plataforma, software, solução. "Ferramenta" também é proibida para falar do Fio. Vale para falas, legenda do post, título, gancho, ponte, frases e etiquetas. O validador (2D e 3D) recusa essas palavras nas falas, no título e na legenda, e "ferramenta" da ponte em diante. |
| Fatos | Só os `fatos` do tema escolhido no banco. Nada de fato novo. |
| Preços no 3D | Só os de `diario/precos-3d.json`, com o rodapé "Valores médios · 2026". |
| Reuso | Um tema só volta 60 dias depois do último uso. O mesmo objeto (o poste, por exemplo) não é assunto de dois vídeos perto um do outro (veja a ROTINA). |
| Voz | A voz grátis, sem mudar `voz` nem `velocidade` e sem `pausa` acima de 0.3. |
| Celular | Sempre inteiro em cena. A tela nunca é esticada até a borda do vídeo. |

## Os limites de tempo

Mire na **meta**. O validador aceita uma folga para não recusar um roteiro bom por um segundo de voz, mas um roteiro
fora da meta é para corrigir.

| Parte | Vai de… até… | Meta | O validador aceita | Palavras (voz grátis, ~3,2 por segundo) |
|---|---|---|---|---|
| Gancho | a fala 1 | até 9 palavras | até 9 palavras | — |
| Conteúdo | o começo até a fala da `ponte` | 45 a 100 s (mire em 50 a 70 s) | 45 a 100 s | 165 a 220 palavras, em 16 a 20 falas |
| Ponte | a fala da `ponte` até a fala do `fio` | 5 a 10 s | 3 a 12 s | 16 a 25 palavras, em 1 ou 2 falas |
| Fio com calma | a fala do `fio` até o começo do fecho ("Fio. …") | 20 a 30 s | 18 a 35 s | 75 a 85 palavras, em 6 a 8 falas |
| Total | o vídeo inteiro (a última fala + 2,6 s) | 75 a 140 s | até 150 s | 290 a 330 palavras |

Os 5 pilotos ficaram com conteúdo de 51 a 57 s, ponte de 5 a 8 s, Fio de 22 a 25 s e total de 91 a 103 s.

Use números de fala simples em `ponte`, `fio` e no `de` do fecho (`"ponte": "17"`, não `"17:palavra"`). O `--so-voz`
(2D e 3D) mostra no fim a linha `conteúdo … s · ponte … s · Fio … s · total … s`: compare com a meta.

## Linha única: o mesmo caminho em todo vídeo

1. **Gancho (0 a 3 s).** Uma pergunta ou um fato que surpreende, em até 9 palavras. A primeira cena já começa em
   movimento. O banco traz uma sugestão (`gancho`); escreva 3 ganchos e fique com o mais forte.
   - Exemplos aprovados: "As listras do poste não sobem. Parece, mas não." · "Pediu um corte e saiu outro? Faz isso."
2. **Conteúdo (45 a 100 s).** O assunto desenvolvido em 3 a 5 partes, só com os `fatos` do tema, **sem falar do Fio**.
   Uma cena nova a cada 3 a 6 s. Feche o conteúdo com uma frase que resume ("Quase cem anos depois, o poste continua
   enganando o olho de todo mundo.").
3. **Ponte (5 a 10 s).** Uma ou duas falas que **saem do próprio assunto** e chegam no problema que o Fio resolve:
   cliente que falta, que esquece, "tem horário?", celular apitando no meio do corte, caderno. Parta da `ponte` do
   tema. Um tema sem ponte honesta não é usado.
   - "O poste avisava de longe: aqui tem barbeiro. Hoje o cliente quer saber outra coisa: tem horário?"
   - "O poste engana o olho: parece que sobe, mas só gira. Agenda de caderno também engana. Parece certa, até o
     cliente não aparecer."
4. **Fio com calma (20 a 30 s).** O que é o Fio, em 2 ou 3 telas reais ligadas ao tema, para quem ele é (o barbeiro
   que trabalha sozinho ou numa barbearia pequena) e "a gente monta pra você". Só com o que está em "O que o Fio faz".
5. **Fecho e chamada dupla (cerca de 10 s).** Três falas, nesta ordem:
   - `"Fio. <frase curta>"`, com `"pausa": 0.3` (é onde o fecho começa; a frase vira o texto da tela final).
     Exemplos: "Fio. A agenda que diminui as faltas." · "Fio. Seu link avisa que tem horário."
   - `"É barbeiro? Link na bio. Não é? Manda esse vídeo pro seu barbeiro."` (exatamente assim)
   - Uma pergunta para comentar, ligada ao tema, terminando com "Conta aqui." ("E o seu barbeiro, fala do quê na
     cadeira? Conta aqui.")

### A parte do Fio, fala por fala (o molde dos pilotos)

No 2D:

| Fala | Exemplo | Cena |
|---|---|---|
| Entrada do Fio (a fala do `fio`) | "Pra isso existe o Fio, a agenda do barbeiro." | `apresentaFio` com a tela ligada ao tema e 3 frases |
| 1 ou 2 falas do que ele faz | "Escolhe o serviço, vê só os horários livres e confirma." | continua o `apresentaFio` |
| 1 ou 2 falas com outra tela | "Na véspera, às seis da tarde, chega a lista de quem lembrar." · "A mensagem vem pronta. Você aperta enviar no WhatsApp. Um toque." | `app` (`bloqueio`, `lembretes`, `agenda` ou `equipe`) |
| A gente monta (2 falas) | "Ainda anota tudo no caderno? Manda sua lista pra gente no direct." · "A gente monta a sua agenda pra você. Sem custo." | `sala` com o barbeiro e os 2 `zap` abaixo |
| Fecho | "Fio. A agenda que diminui as faltas." | `final` |

Os 2 `zap` de "a gente monta" vão em `extras`, com estes textos (N = a fala do "Manda sua lista", N+1 = a do "A gente
monta"):

```json
{ "tipo": "zap", "em": "N:manda", "ate": "N+1:fim", "de": "Você", "texto": "@agendafio, segue minha lista de clientes e serviços." },
{ "tipo": "zap", "em": "N+1:monta", "ate": "N+1:fim", "de": "@agendafio", "texto": "Recebido! Em até 2 dias sua agenda fica pronta." }
```

No 3D é a mesma sequência de falas, mas tudo acontece no palco: `fio.telas` troca a tela do celular 3D e `fio.frases`
são as 3 frases ao lado (veja "Vídeo 3D").

Qual tela combina com o `tela` do tema:

| `tela` do tema | 2D (`app` e `apresentaFio`) | 3D (`fio.telas`) |
|---|---|---|
| `agendamento` | `agendamento` (o cliente marcando) | `link`, `horarios`, `confirmado` |
| `lembretes` | `bloqueio` com o aviso `lembretes`, depois `lembretes` | `aviso` (`lembretes`), `whats`, `lembretes` |
| `agenda` | `agenda` | `agenda` |
| `bloqueio` | `bloqueio` com o aviso que combina (`novo`, `cliente`, `cancelado`) | `aviso` |
| `equipe` | `equipe` | `equipe` |

## Só temas do banco

- O banco fica em `diario/banco/temas.json`. Cada tema tem `id`, `tipo`, `titulo`, `gancho`, `fatos` (cada um com
  `texto` e `fonte`), `ponte`, `tela` e `pecas`.
- **Todo vídeo sai de um tema do banco**, escolhido pelo `node scripts/motor/banco.mjs livres <tipo> <dia>`. Não invente
  tema.
- **Use só os `fatos` desse tema.** Pode explicar, dar exemplo e reorganizar, mas não acrescente fato, número, data,
  nome ou lugar que não esteja no texto do fato. Se um fato diz "por volta de 1900", a fala diz "por volta de 1900".
- Nada de estatística, preço ou promessa de saúde que não esteja no fato. No 3D de "Quanto custa", os valores vêm só
  de `diario/precos-3d.json`.
- O roteiro leva `"tema": "<id do tema>"` e o `id` do vídeo termina com o mesmo id do tema
  (`AAAA-MM-DD-HHh-<id do tema>`). É assim que a rotina sabe que o tema já foi usado.
- `pecas` diz quais peças o tema pede. Use pelo menos essas; pode juntar outras.
- Se um fato parecer errado ou exagerado, não use o tema e conte no resumo do dia.

## Posicionamento (vale para vídeo, legenda e story)

Estratégia completa em `founder/estrategia.md` (no repositório do app). O resumo que guia cada roteiro:

- **Para quem é o Fio:** o barbeiro autônomo ou de barbearia pequena (1 a 5 cadeiras) que perde horário com cliente
  que falta, vive no WhatsApp e no Instagram e **não quer "sistema"**. Não falamos com rede de barbearias nem com quem
  quer "gestão completa".
- **Frase-mãe:** "A agenda que diminui as faltas. E a gente monta pra você." Todo vídeo puxa para uma das duas metades.
- **Palavras nossas:** agenda, link, cadeira vazia, horário furado, cliente que some, "a gente monta".
  **Nunca:** sistema, gestão, plataforma, software, solução, ferramenta (para o Fio).
- **Não copie concorrente:** nada de "agenda cheia" ou "enche a cadeira" (são frases de outros apps).
- O app não é o herói. O herói é o barbeiro que para de perder horário; o Fio é o empurrão.

## Quem assiste e o tom

- **Quem assiste:** o público em geral ("o povão") e os barbeiros, no Instagram (Reels). O cliente que assiste é quem
  manda o vídeo pro barbeiro dele; por isso o assunto interessa aos dois.
- O sucesso é comentário e compartilhamento ("manda pro seu barbeiro"), além das curtidas.
- Português do Brasil do dia a dia. O narrador conversa com quem assiste ("Olha esse poste…", "Bora ver como isso
  começou."), com graça e carinho, sem palavra difícil. Quando usar um termo (transição, sangria), explique na hora.
- Falas curtas (até 14 palavras), faladas como gente fala.

## O que o Fio faz (só isso pode aparecer; nada de inventar)

- **Link de agendamento:** o cliente abre o link da barbearia, escolhe serviço, dia e horário (só aparecem os livres),
  coloca nome e telefone e confirma. Não baixa aplicativo e não cria conta.
- **Aviso de novo agendamento** no celular do barbeiro ("Novo agendamento · nome · serviço · dia e hora"), se ele
  ativou as notificações.
- **Às 18h**, aviso "Lembretes de amanhã" dizendo quantos clientes lembrar.
- **Lembretes:** na lista de amanhã, o botão "Lembrar no WhatsApp" abre o WhatsApp do próprio barbeiro com a mensagem
  pronta; **ele aperta enviar** (não é automático, é um toque por cliente). Quem já foi avisado fica marcado.
- **Aviso para o cliente** algumas horas antes ("Seu horário é hoje às 10:00"), se o cliente ativou na confirmação.
- **Cliente cancela ou remarca pelo link**; o barbeiro recebe o aviso "Agendamento cancelado pelo cliente".
- **Agenda** do dia e da semana, horários de funcionamento, folgas e bloqueios (o que está fechado some do link).
- **Atendimento realizado:** o barbeiro marca, escolhe a forma de pagamento e a receita entra no financeiro.
- **Comissão:** cada atendimento realizado já entra com a comissão; o dono vê a comissão do mês de cada barbeiro
  (Equipe). Equipe é do **plano Equipe** (R$ 69,90/mês); o teste grátis e o plano grátis têm 1 profissional.
- **Teste grátis por 7 dias**, sem cartão.
- **A gente monta pra você (feito por pessoas, não pelo app):** o barbeiro manda pelo direct do @agendafio a lista de
  clientes, os serviços com os preços e as fotos dos cortes, e a gente deixa tudo pronto no Fio em até 2 dias, sem
  custo. Não existe tela de "importar": mostre a conversa no direct (os 2 `zap` da parte do Fio) e depois a agenda
  pronta.

**Não faz** (nunca diga nem mostre): cobrar ou receber pagamento (o Fio não processa pagamentos), **mandar WhatsApp
sozinho** (quem envia o lembrete é o barbeiro, num toque), chatbot, SMS, nota fiscal, programa de fidelidade, estoque
automático. Não invente números de resultado ("aumenta 30%"). Contas do dia a dia são permitidas se forem claramente
um exemplo ("3 faltas de R$ 40 = R$ 120").

Frases certas e erradas sobre o lembrete:
- Certo: "A mensagem vem pronta. Você aperta enviar no WhatsApp. Um toque." · "Na véspera, o barbeiro te manda o
  lembrete no WhatsApp, em um toque."
- Errado: "O Fio manda o lembrete pro cliente." · "O lembrete sai sozinho."

## O roteiro 2D (8h, 11h, 13h e 21h)

Campos do roteiro (o formato completo está em `src/motor/roteiro.ts`; o exemplo é o piloto de curiosidade, com o id
que ele teria na rotina):

```json
{
  "id": "2026-11-20-08h-poste-de-barbeiro",
  "tipo": "curiosidade",
  "tema": "poste-de-barbeiro",
  "titulo": "Por que o poste de barbeiro é vermelho e branco",
  "legenda": "…",
  "falas": [{ "texto": "Esse poste listrado esconde uma história de sangue." }, "…"],
  "chaves": ["sangue", "cirurgia", "bastão", "bacia", "vermelho", "horário"],
  "ponte": "18",
  "fio": "20",
  "cenas": ["…", { "tipo": "final", "de": "27" }],
  "extras": ["…"]
}
```

- `tipo`: `curiosidade`, `dica`, `conceito` ou `atracao-2d`. Com `tipo`, o vídeo é conferido pelos limites de tempo e
  o fecho usa a chamada dupla sozinho.
- `ponte`: a fala em que a ponte começa. `fio`: a fala em que a parte do Fio começa.
- `chaves`: de 4 a 6 palavras que ganham etiqueta na legenda do vídeo (palavras que estão nas falas). Não repita
  palavras que já aparecem escritas na cena (o rótulo de um corte, por exemplo).
- A última cena é sempre `{ "tipo": "final", "de": "<a fala Fio. …>" }`. Não use `chamada` nem `subchamada` (com a
  chamada dupla elas não aparecem).

### Referências de tempo

Cada cena começa numa palavra da narração (`"de"`). Referência: `"3"` (começo da fala 3), `"3:palavra"`,
`"3:palavra#2"` (2ª vez na mesma fala) ou `"3:fim"`. A palavra precisa estar escrita igual à fala (acento não importa).

Armadilhas:
- **Ano ou número depois de preposição não serve de referência.** A voz grátis junta "em 1935" numa palavra só, e
  `"18:1935"` falha. Use outra palavra da fala (`"18:saiu"`). O mesmo vale para números em geral: prefira ancorar numa
  palavra comum.
- Se a referência falhar, o `--so-voz` mostra as palavras que a voz entendeu naquela fala. Use uma delas.
- **Fio só depois da ponte.** Antes da fala da `ponte`, nenhuma fala escreve `Fio` com F maiúsculo, nem no começo da frase ("Fio da navalha…" é recusado). "o fio da navalha", em minúscula, pode. O validador procura a palavra `Fio` com F maiúsculo em
  qualquer lugar da fala, por isso a maiúscula do começo da frase também conta.

### Catálogo das peças 2D

Peças de sempre:

| tipo | o que mostra | campos |
|---|---|---|
| `quarto` | personagem na cama, relógio, placa ABERTO/FECHADO, celular no criado-mudo | `personagem`, `hora`, `placa`, `viraPlaca`, `celularAcende`, `amanhece`, `comecaNoRelogio`, `reacoes` |
| `sala` | personagem no sofá com o celular | `personagem`, `pensamento {em, rotulo, titulo, texto}`, `mensagem {em, para, texto, apaga}`, `cabeloBagunca` (só o Matheus), `closeNoRosto`, `reacoes` |
| `barbearia` | barbeiro cortando, cliente na cadeira, mensagens chegando no celular | `barbeiro`, `cliente` (sem cliente = cadeira vazia), `mensagens [{em, de, texto}]`, `olhaCelular`, `reacoes` |
| `cidade` | o fio atravessando a cidade à noite (transição) | `sentido: "ida" \| "volta"` |
| `app` | tela real do Fio dentro do celular | `tela` (veja "Telas do app") |
| `texto` | frase grande, palavras em destaque, número que sobe | `linhas`, `destaque`, `fundo: "escuro" \| "claro" \| "acento"`, `numero {de, ate, prefixo, sufixo, em}` |
| `final` | laço + "Fio" + a frase da fala "Fio. …" + a chamada dupla | `de` (só isso) |

Peças novas, com um exemplo mínimo de cada:

**`corte`**: a cabeça grande no centro e o cabelo trocando (a máquina passa) no tempo de cada estilo; o rótulo sai numa
pílula embaixo. Estilos: `degrade-baixo`, `degrade-medio`, `degrade-alto`, `social`, `navalhado`, `topete`, `risco`,
`pezinho`.

```json
{ "tipo": "corte", "de": "9", "personagem": "davi", "estilos": [
  { "em": "9:baixo", "estilo": "degrade-baixo", "rotulo": "Baixo: perto da orelha" },
  { "em": "10:médio", "estilo": "degrade-medio", "rotulo": "Médio: meio da lateral" }
] }
```
- Não use o `carlos` (é calvo, o corte não aparece) nem a `bia` (cabelo longo). Para mostrar os níveis do degradê,
  prefira cabelo castanho (`davi`, `matheus`), que dá mais contraste que o branco do `ze`.
- `social`, `baixo` e `topete` são parecidos de lado: diga na fala o que muda e use o rótulo.

**`objeto`**: um objeto de barbearia grande e animado; cada etiqueta surge no seu momento, com uma linha até o objeto.
Objetos: `poste`, `toalha`, `navalha`, `maquina`, `tesoura`, `pente`, `cadeiraAntiga`, `pincel`, `pomada`.

```json
{ "tipo": "objeto", "de": "9", "objeto": "poste", "fundo": "escuro", "variante": "vermelhoBranco",
  "etiquetas": [{ "em": "9:ele", "texto": "O bastão da sangria" }] }
```
- `variante: "vermelhoBranco"` só vale para o `poste`: listras só vermelhas e brancas. Use sempre que a fala falar de
  "vermelho e branco"; o poste padrão tem uma listra azul.
- De 1 a 3 etiquetas curtas por cena.

**`linhaDoTempo`**: os anos numa linha; a câmera anda de um marco para o outro.

```json
{ "tipo": "linhaDoTempo", "de": "8", "marcos": [
  { "em": "8", "ano": "Grécia", "texto": "Corte e conversa na praça", "objeto": "navalha" },
  { "em": "8:roma", "ano": "296 a.C.", "texto": "A barbearia chega a Roma", "objeto": "tesoura" }
] }
```
- O `texto` de cada marco cabe em até 3 linhas (até uns 32 letras). Mais que isso encosta na legenda do vídeo.

**`compara`**: duas colunas lado a lado; os itens aparecem nos tempos de `revela` (esquerda primeiro, depois direita) e
o vencedor ganha destaque.

```json
{ "tipo": "compara", "de": "13",
  "esquerda": { "titulo": "Baixo", "itens": ["Começa na orelha", "Mais cabelo do lado"], "objeto": "maquina" },
  "direita": { "titulo": "Alto", "itens": ["Começa nas têmporas", "Quase até a pele"], "objeto": "navalha" },
  "vencedor": "direita",
  "revela": ["13:baixo", "13:orelha", "14:têmporas", "14:pele"] }
```
- `titulo` de cada lado com até 15 letras (mais que isso estoura a coluna).
- Com `vencedor`, deixe **cerca de 1 s de fala depois do último item** antes da próxima cena; senão o destaque do
  vencedor não chega a aparecer.

**`passos`**: de 2 a 5 passos numerados, cada um entrando no tempo da sua palavra.

```json
{ "tipo": "passos", "de": "17", "titulo": "Antes de sentar", "passos": [
  { "em": "17:foto", "texto": "Foto de frente, lado e trás" },
  { "em": "18:número", "texto": "O número do pente", "objeto": "maquina" }
] }
```
- O 1º passo pode entrar no começo da cena (`"em": "17"`), para a cena não começar vazia.

**`barbeariaAntiga`**: barbearia de época, em sépia, com cadeira de ferro, poste de parede, placa com o ano e o barbeiro
de colete e bigode (sem celular). Mesmas reações da `barbearia`.

```json
{ "tipo": "barbeariaAntiga", "de": "13", "barbeiro": "rafa", "cliente": "ze", "ano": "1900",
  "reacoes": [{ "em": "14:jogo", "boca": "sorriso" }] }
```
- `ano` só com o que o fato diz. Sem ano certo, use `"sempre"` (a placa fica "Desde sempre"). Nunca invente um ano.

**`apresentaFio`**: o celular com a tela real do app e as 3 frases curtas surgindo ao lado, uma de cada vez. É a
entrada da parte "Fio com calma".

```json
{ "tipo": "apresentaFio", "de": "19",
  "tela": { "nome": "agendamento", "cliente": "Matheus Lima", "hora": "14:20",
            "toques": { "servico": "19:marca", "dia": "20:escolhe", "horario": "20:livres", "confirmar": "20:confirma" } },
  "frases": [
    { "em": "19:marca", "texto": "Cliente marca sozinho pelo link" },
    { "em": "20:livres", "texto": "Só os horários livres aparecem" },
    { "em": "21:chama", "texto": "Ninguém te chama no meio do corte" }
  ] }
```
- Exatamente 3 frases, cada uma com até 40 letras.

**`final`** (fecho com a chamada dupla): o laço, "Fio", a frase da fala "Fio. …" e as duas linhas "É barbeiro? Link na
bio." e "Não é? Manda esse vídeo pro seu barbeiro.".

```json
{ "tipo": "final", "de": "26" }
```
- A pergunta para comentar é falada durante o fecho, mas não aparece escrita no vídeo. Por isso ela vai também no fim
  da legenda do post.

**Elenco:**

| nome | quem é |
|---|---|
| `rafa` | barbeiro dono, de barba |
| `juninho` | barbeiro jovem, de boné |
| `matheus` | cliente jovem, cabelo bagunçado |
| `carlos` | Seu Carlos, cliente mais velho, calvo, de óculos |
| `bia` | Bia, cliente mulher, cabelo longo |
| `ze` | Seu Zé, senhor de cabelo branco e bigode |
| `davi` | Davi, cliente garoto, cabelo castanho e sardas |

Reações: `{em, boca: "neutra" | "sorriso" | "aberta" | "torta", olhar: "cima" | "celular" | "frente" | "lado", sacode, acorda}`.

### Telas do app (cenas `app` e `apresentaFio`)

- `agendamento` (cliente marcando): `cliente`, `hora` (da barra do celular), `toques {servico, dia, horario, nome,
  confirmar}`. Precisa de uns 5 s entre `servico` e `confirmar`; `confirmar` é quando aparece "Agendamento confirmado".
- `agenda` (barbeiro): `clientes [{hora, nome, servico}]`, `destaque {nome, em}` ou `realizar {nome, em}` (toca, marca
  como realizado, PIX, confirma).
- `lembretes`: `toques: [{toque, enviar}]` (cada um precisa de ~1,5 s), `todos` (marca o resto como avisado).
- `equipe`: `contar` (as comissões sobem e aparece o total somado).
- `bloqueio` (celular bloqueado): `hora`, `data`, `avisos [{em, tipo: "novo" | "lembretes" | "cliente" | "cancelado", ...}]`.

Serviços que existem no exemplo: "Corte masculino" (R$ 40, 45 min), "Barba" (R$ 30, 30 min), "Corte + barba" (R$ 65).

Extras por cima de qualquer cena (`extras`): `selo {texto, em, ate, cor}`, `aviso {em, ate, aviso: {tipo, ...}}`,
`zap {em, ate, de, texto}`. Transição (`entrada`), se quiser trocar a automática: `chicote`, `zoom`, `mergulho`,
`onda`, `subir`, `corte`.

### Uma data só nas telas

As telas `agendamento` e `agenda` mostram sempre a data fixa **"Segunda-feira, 2 de novembro"** (vem do motor). Para
as telas não se contradizerem, use esse mesmo dia em todas as outras:

- `bloqueio` (2D) e `aviso` (3D): `"data": "segunda-feira, 2 de novembro"`.
- `quando` dos avisos, dias dessa mesma semana: `"seg 02/11 às 15:00"`, `"ter 03/11 às 11:00"`.

## Vídeo 3D (18h)

O 3D é feito pelo `scripts/motor/fazer-3d.mjs`. Há dois formatos, e o tema diz qual usar pelo `pecas`:

- `vitrine`, `porDentro` ou `viagemNoTempo` → o **vídeo de planos** (`src/custo3d/atracao.ts`);
- `montar` → o **"Quanto custa montar"** com etapas (`src/custo3d/roteiro.ts`), no formato novo, com `fio`.

Nos dois, a parte do Fio é 3D: um celular 3D com as telas reais do app, as 3 frases surgindo ao lado e o fecho 3D com
a chamada dupla. Só a legenda dinâmica fica por cima.

### Vídeo de planos

Uma sequência de planos no palco 3D, um por vez. Depois vem a ponte (a câmera se afasta), a parte do Fio e o fecho.
O exemplo é o piloto `diario/pilotos/atracao-3d.json`, encurtado, com o id que ele teria na rotina:

```json
{
  "id": "2026-11-20-18h-poste-por-dentro",
  "tipo": "atracao-3d",
  "tema": "poste-por-dentro",
  "titulo": "Por dentro do poste de barbeiro: por que as listras parecem subir",
  "legenda": "…",
  "chaves": ["motor", "ilusão", "cérebro", "Wallach", "lembretes", "WhatsApp", "link", "monta"],
  "falas": ["…"],
  "planos": ["…"],
  "ponte": "20",
  "fio": {
    "de": "22",
    "telas": [
      { "em": "22", "tela": { "nome": "agenda" } },
      { "em": "23", "tela": { "nome": "aviso", "aviso": { "tipo": "lembretes", "quantidade": 4 }, "hora": "18:00", "data": "segunda-feira, 2 de novembro" } },
      { "em": "24:mensagem", "tela": { "nome": "whats" } }
    ],
    "frases": [
      { "em": "23:lembretes", "texto": "Lembretes de amanhã, todo dia às 18h" },
      { "em": "24:enviar", "texto": "Mensagem pronta, você só envia" },
      { "em": "25:aviso", "texto": "Desmarcou pelo link? Você é avisado" }
    ]
  },
  "final": { "de": "28" }
}
```

Os 3 modos de plano:

**`vitrine`**: o objeto girando no pedestal, a câmera passeando e as etiquetas surgindo embaixo (ficam até 3; a mais
velha sai).

```json
{ "modo": "vitrine", "de": "1", "objeto": "poste", "etiquetas": [
  { "em": "2:poste", "texto": "Poste de barbeiro" },
  { "em": "3:subir", "texto": "Parece que sobe" }
] }
```
Objetos: `poste`, `cadeiraAntiga`, `cadeiraModerna`, `maquina`, `navalha`, `tesoura`, `espelho`, `toalha`, `pente`.

**`porDentro`**: o objeto se abre em `abre`, e cada parte ganha uma placa com uma linha até a peça. Só com `maquina`,
`navalha`, `tesoura` ou `poste`.

```json
{ "modo": "porDentro", "de": "5", "objeto": "poste", "abre": "5:abre", "partes": [
  { "em": "6:tampa", "texto": "tampa" },
  { "em": "7:motor", "texto": "motor" }
] }
```
- As partes entram depois de `abre`. Sem `partes`, entram os nomes padrão do objeto.

**`viagemNoTempo`**: a barbearia de 1920 virando a de hoje, peça por peça, a partir de `vira` (leva de 2 a 6 s).

```json
{ "modo": "viagemNoTempo", "de": "4", "anos": ["1920", "hoje"], "vira": "5:hoje" }
```
- `anos`: 2 textos de até 8 letras, só com o que o fato diz.

Regras dos planos:
- Cada plano dura pelo menos 1,5 s. Mire em planos de 3 a 15 s, com um acontecimento (etiqueta, parte, troca) **a
  cada 2 a 5 s**. Plano longo sem nada novo fica parado: divida em mais planos ou dê mais etiquetas.
- Planos seguidos do mesmo objeto mudam de ângulo sozinhos. O piloto usou 5 planos e 16 placas em 57 s de conteúdo.
- Etiquetas e partes: até 24 letras cada, dentro do próprio plano.
- Use a `cadeiraModerna` para "hoje" e a `cadeiraAntiga` para o passado.
- Do `ponte` até o `fio.de`, a câmera se afasta do último plano (no pedestal, recua; na barbearia, sobe).

### A parte do Fio em 3D (`fio`)

- `fio.de`: a fala em que a parte do Fio começa.
- `fio.telas`: a tela do celular troca em cada `em`. Telas: `aviso` (com `aviso {tipo, …}`, `hora` e `data`),
  `agenda`, `lembretes`, `whats`, `link`, `horarios`, `confirmado`, `equipe`.
- `fio.frases`: exatamente 3, cada uma com até 40 letras. Mire em até 36: com 37 letras a frase quebrou em 4 linhas e
  encostou nas outras.
- Telas e frases entram entre `fio.de` e `final.de`, cada uma depois da anterior.
- `final`: só `{ "de": "<a fala Fio. …>" }`. O fecho 3D já tem a chamada dupla.

### "Quanto custa montar" (pecas `montar`)

A barbearia é montada peça por peça, e cada etapa soma no contador do topo. **Os valores vêm só de
`diario/precos-3d.json`**: "por cadeira" multiplica pelo número de cadeiras; "por tamanho" usa a coluna de 1, 2 ou 3
cadeiras. A soma das etapas é o total dito na fala. Rodapé: `"rodape": "Valores médios · 2026"`. Diga na fala e na
legenda que é sem o aluguel e que os valores mudam com a cidade. Os `fatos` do tema (Sebrae: documentos, ponto,
equipamentos) entram nas falas, sem inventar outros.

```json
{
  "id": "2026-11-20-18h-montar-1-cadeira",
  "tipo": "atracao-3d",
  "tema": "montar-1-cadeira",
  "titulo": "Quanto custa montar uma barbearia de 1 cadeira",
  "legenda": "…",
  "cadeiras": 1,
  "contador": "CUSTO DA BARBEARIA",
  "chaves": ["reforma", "cadeira", "fachada", "lembrete", "monta"],
  "falas": ["…"],
  "etapas": [
    { "em": "3:Piso", "rotulo": "Piso", "valor": 3000, "pecas": ["piso"] },
    { "em": "4:cadeira", "rotulo": "1 cadeira", "valor": 2500, "pecas": ["cadeiras"] }
  ],
  "total": "14:Somando",
  "ponte": "16",
  "fio": {
    "de": "18",
    "telas": [{ "em": "18", "tela": { "nome": "link" } }, { "em": "20", "tela": { "nome": "whats" } }, { "em": "21", "tela": { "nome": "agenda" } }],
    "frases": [
      { "em": "18:link", "texto": "Cliente marca sozinho pelo link" },
      { "em": "20:enviar", "texto": "Mensagem pronta, você só envia" },
      { "em": "21:agenda", "texto": "O dia inteiro num lugar só" }
    ]
  },
  "final": { "de": "24" },
  "rodape": "Valores médios · 2026"
}
```
- Peças das etapas: `piso`, `pintura`, `luz`, `cano`, `cadeiras`, `espelhos`, `lavatorio`, `ferramentas`, `recepcao`,
  `produtos`, `fachada` (cada uma numa etapa só).
- A primeira etapa vem depois do começo da fala 2, as etapas ficam a pelo menos 1 s uma da outra, e a ordem é:
  etapas → `total` → `ponte` → `fio` → `final`. `falta {marca, some, parada}` (o cliente que marca e não aparece) é
  opcional e fica depois do total.
- Não use `app` (o celular 2D antigo) nem `chamada`/`subchamada` no `final`: com `fio`, eles não valem.

## Legenda do post

Na ordem, em parágrafos curtos e com no máximo 2 emojis:

1. O gancho e a ideia do vídeo.
2. O conteúdo por escrito: o resumo dos fatos (curiosidade e atração) ou a dica/conceito completo para copiar (dica e
   conceito; termine com "Salva pra usar no próximo corte." ou parecido).
3. As fontes, quando os fatos têm link: `Fontes: verbete "Barber's pole" (Wikipédia em inglês).` (o nome da página e
   do site, não o link).
4. "É barbeiro? Link na bio. Não é? Manda esse vídeo pro seu barbeiro."
5. A mesma pergunta para comentar do fim do vídeo.

Sem hashtags (entram sozinhas). Sem palavras proibidas.

## Padrão de qualidade

Antes de escrever, pense como quem rola o feed: por que essa pessoa pararia aqui? E por que mandaria pro barbeiro?

- **Gancho no 1º segundo**, com a primeira cena já em movimento (o objeto girando, o cabelo trocando, o barbeiro
  falando).
- **Uma cena nova a cada 3 a 6 s.** Nada de duas cenas `texto` paradas seguidas: troque uma por `passos`, `objeto`,
  `corte` ou uma cena com personagem.
- **Uma ideia só por vídeo**, contada em 3 a 5 partes, só com os fatos do tema.
- **O app nunca abre o vídeo.** Ele entra pela ponte, com calma.
- **A tela combina com a fala.** O que a narração diz é o que aparece (se a fala diz "vermelho e branco", o poste é
  `vermelhoBranco`; se diz "marca pelo link", a tela é o agendamento).
- **Termina com uma pergunta** para comentar, ligada ao tema.
- **Revisão completa:** abra **todos** os quadros de conferência, não uma amostra, em lotes de 6 a 10 por mensagem
  (veja "Como abrir os quadros" na ROTINA). Gancho fraco, cena parada, texto
  cortado, legenda tapando o que importa, rótulo ou etiqueta que não combina com a fala, letra estranha nas placas 3D:
  reescreva e refaça.

## Regras para não errar

- Cada cena 2D dura pelo menos 1,3 s; cada plano 3D, pelo menos 1,5 s.
- O conteúdo precisa de pelo menos 45 s. Se o `--so-voz` der menos, acrescente uma fala com um fato do tema que ainda
  não entrou (não invente fato).
- Varie entre os vídeos do dia: personagens, cenários, telas do app e a frase "Fio. …". Pelo menos um vídeo do dia
  mostra o link de agendamento.
- Não repita o gancho nem a primeira frase dos últimos 15 posts (veja `node scripts/motor/historico.mjs 40`).
- Fio só depois da ponte: Antes da fala da `ponte`, nenhuma fala escreve `Fio` com F maiúsculo, nem no começo da frase ("Fio da navalha…" é recusado). "o fio da navalha", em minúscula, pode.
- Referências de tempo em palavras comuns, nunca num ano depois de preposição ("em 1935").
- Datas das telas: sempre "segunda-feira, 2 de novembro" e dias da mesma semana.
- Use `--so-voz` antes de renderizar: ele confere as referências e os tempos em poucos minutos.

## Stories do dia (blocos de fim de funil)

Todo dia sai **1 bloco só**, às **9h**, com **4 quadros** (o dono pediu menos: com mais, a maioria não via até o fim).
O bloco é uma história curta sobre **um tema só** e sai inteiro
de uma vez, em sequência (um quadro por minuto). O objetivo é um só: a pessoa começar o teste grátis pelo link na bio.
Formato do arquivo e das telas: `src/motor/StoryBloco.tsx`. Exemplo: `diario/2026-11-07/stories.json` (formato antigo, com 2 blocos de 5 quadros: copie só o jeito de escrever;
o arquivo agora tem 1 bloco, `"hora": "9h"`, com os 4 quadros abaixo, e o `stories.mjs` recusa o resto).

Os 4 quadros do bloco, nesta ordem (sem quadro de objeção):

1. **dor**: a situação ruim, concreta, com número ou hora quando der ("23h, cliente no Zap pedindo horário."). Até 70
   letras.
2. **prova**: o Fio resolvendo, com a tela real (`aviso`, `agenda`, `lembretes`, `whats`, `link`, `horarios`,
   `confirmado`, `equipe`). A frase descreve o que a tela mostra. Até 80 letras.
3. **beneficios**: a lista é fixa no código (não escreva itens). Só `{ "tipo": "beneficios" }`.
4. **chamada**: uma frase que fecha o tema e manda agir ("Amanhã sua agenda já pode estar no link."). O quadro já
   mostra "7 dias grátis · sem cartão" e "Toque no perfil → link na bio". Até 70 letras.

`tema` aparece no topo de todos os quadros (até 14 letras, ex.: "Faltas", "Agenda 24h", "Lembretes").
`destaque` é um trecho que está no texto e fica colorido. O tema do bloco é diferente
dos blocos dos últimos 3 dias (veja `diario/<dia>/stories.json` dos dias anteriores, quando existirem).

Objeções comuns, para usar como ideia de tema ou de frase na `dor` e na `chamada` (resposta sempre dentro do que o Fio faz):
- "Meu cliente não vai baixar aplicativo." → nem precisa: é um link, sem baixar e sem criar conta.
- "Não tenho tempo pra configurar." → a gente monta tudo pra você em até 2 dias, sem custo.
- "Já uso outro app." → manda seus clientes e serviços no direct; a gente passa tudo pro Fio.
- "E se eu não gostar?" → 7 dias grátis, sem cartão: não cobra nada.
- "Meu cliente só marca pelo Zap." → o link vai pelo próprio WhatsApp; ele marca sozinho.
- "Mandar lembrete pra cada um dá trabalho." → a mensagem já vem pronta; é um toque por cliente.
- "Já uso caderno." → o caderno não te avisa que alguém marcou às 23h.
- "Cliente vai marcar em cima de outro." → só aparecem os horários livres.
- "E quando o cliente desiste?" → ele mesmo cancela ou remarca pelo link, e você é avisado.

Não pode: enquete, "vídeo novo" com botão de play, promessa de resultado ("acaba com as faltas"), preço diferente
de "7 dias grátis, sem cartão", lembrete automático (quem envia é o barbeiro, em um toque).

## Carrossel do dia (educação para o barbeiro)

Todo dia sai **1 carrossel às 15h**. Ele fala **com o barbeiro dono da barbearia** e ensina a cuidar do negócio
(faltas, preço, cliente que some, encaixe, horário de pico, comissão, fidelização), no modelo dos carrosséis do G4:
um caso ou número real, a lição, um quadro prático para salvar e, no fim, o Fio como parte disso. O objetivo é o
barbeiro **salvar e mandar pra outro barbeiro**. Não é venda do começo ao fim.

Formato do roteiro: `src/motor/carrossel.ts`. Desenho: `src/motor/CarrosselSlide.tsx` (1080×1350). Temas:
`diario/banco/barbeiro.json` (só eles, e só os fatos de cada tema).

### A ordem dos 7 slides (6 a 8)

1. **capa:** manchete que prende (até 60 letras) e uma linha de curiosidade (até 50). Pode ter um personagem, um
   objeto ou uma tela de ilustração.
2. **texto:** o problema com o número e a fonte.
3. **texto:** a virada "na sua barbearia": o que isso significa no dia a dia do barbeiro.
4. **lista:** o quadro prático numerado (3 a 5 itens), o slide que se salva. Termine com "Salve pra lembrar." ou
   parecido.
5. **texto** ou **compara:** o exemplo ou o detalhe.
6. **tela:** o Fio fazendo parte disso, com a tela do app que combina com o tema.
7. **fecho:** a frase que fecha a lição e liga ao Fio. O slide já mostra "7 dias grátis, sem cartão", "A gente monta
   pra você" e "Link na bio".

**Formato "A vs B"** (`formato: "compara"` no tema): os slides 2 a 5 viram `compara`, cada um comparando um aspecto
(espera, dia do barbeiro, cliente que falta…). O lado B é sempre o melhor.

### Regras do carrossel

- **O Fio só aparece nos 2 slides finais** (`tela` e `fecho`) e na legenda. Antes disso, é educação pura.
- **Todo número dos slides de conteúdo está num fato do tema.** A conferência recusa número sem fato. Não arredonde
  nem faça conta nova ("1 em cada 5") se ela não está escrita num fato.
- No slide do número, ponha a fonte curta em `fonte` ("Professional Beauty, levantamento Fresha").
- Limites de letras: título 70, parágrafo 140 (2 ou 3 por slide), puxada 90, item da lista 90 (termo + texto),
  linha do compara 40, frase da tela e do fecho 90, rótulo do topo 14. Frases curtas, de conversa.
- A `puxada` (a última linha em destaque) leva para o próximo slide: "E o pior: …", "O que fazer, então?".
- O que o Fio faz é só a lista de "O que o Fio faz" deste GUIA. O lembrete **não é automático**: a mensagem vem
  pronta e o barbeiro envia em um toque.
- Palavras proibidas valem aqui também. Nada de promessa ("acaba com as faltas") nem de frase de coach.

### Legenda do carrossel

3 ou 4 parágrafos curtos com a lição, a fonte dos números, "Link na bio pra testar 7 dias grátis." e uma pergunta
para o barbeiro comentar ("Quantas faltas você teve essa semana?"). Sem a chamada dupla dos reels: aqui o leitor já
é o barbeiro.

### Exemplo completo

O arquivo `diario/teste/carrossel.json` é um carrossel completo que passa na conferência (tema
`faltas-uma-em-cinco`): copie a estrutura, não o texto.

Tipos de slide e campos: `capa` (titulo, curiosidade, ilustracao? com personagem do elenco, objeto 2D ou tela),
`texto` (titulo, paragrafos, puxada?, fonte?), `lista` (titulo, itens [{termo, texto}], puxada?), `compara`
(titulo, a/b {rotulo, linhas}, puxada?), `tela` (tela {nome}, frase), `fecho` (frase). Telas: aviso, agenda,
lembretes, whats, link, horarios, confirmado, equipe.
