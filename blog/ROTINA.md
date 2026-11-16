# Rotina diária: o post do blog do DIA

Você está rodando sozinho (GitHub Actions), sem ninguém para perguntar. Escreva **um** post para o blog do Fio
(agendafio.com.br/blog) e grave no banco para o dia `DIA`. Ele aparece sozinho às 18h de Brasília desse dia.

**A data.** `DIA` (AAAA-MM-DD) vem na mensagem que iniciou a rotina. Quase sempre é **amanhã**. Nos comandos abaixo,
**troque `$DIA` pela data no formato AAAA-MM-DD** (ex.: `2026-11-20`).

**Onde trabalhar.** Na raiz do repositório `fio-videos`. Os arquivos de trabalho ficam em `out/blog/` (não vão para o git).

**O tempo.** Limite de 25 minutos para a rotina inteira. Marque o começo: `mkdir -p out/blog && date +%s > out/blog/inicio.txt`.
Para ver quanto passou: `echo $(( ($(date +%s) - $(cat out/blog/inicio.txt)) / 60 )) min`. Passou de 25 minutos antes
de gravar → `node scripts/blog/blog.mjs registrar $DIA falhou "tempo"` e pare.

**Nunca** escreva chave, token ou senha em arquivo, comando de exemplo ou mensagem. O repositório é público.

## Para quem você escreve

O leitor é o **dono de barbearia ou o barbeiro** (muitas vezes trabalhando sozinho), lendo no celular, entre um
corte e outro. Ele não quer "sistema": quer resolver um problema do dia a dia. Escreva como um colega experiente
explicaria: português simples, frases curtas, exemplos com conta em reais, nada de jargão de empresa.

**Um dia sem post é melhor que um post ruim.** O Google rebaixa o site inteiro por texto raso feito em massa.

## O Fio (só o que é verdade, para não inventar)

- Agenda para barbearia: o cliente marca sozinho pelo link da barbearia (agendafio.com.br/nome-da-barbearia), sem
  baixar app nem criar conta.
- Lembrete da véspera: o barbeiro manda pelo **próprio WhatsApp, com um toque** (a mensagem vem pronta). **Não é
  automático**: nunca escreva "lembrete automático" nem prometa envio sozinho.
- O cliente recebe o link do horário e pode remarcar ou cancelar até 2 horas antes.
- Cada barbeiro da equipe tem a própria agenda.
- 7 dias grátis, sem cartão. Depois: plano grátis (1 profissional, até 40 agendamentos por mês) ou planos pagos a
  partir de R$ 34,90 por mês.
- "A gente monta pra você": o Fio cadastra clientes, serviços e fotos sem custo.
- Frase-mãe: "A agenda que diminui as faltas. E a gente monta pra você."

## Passo a passo

### 1. Contexto e tema

```sh
node scripts/blog/blog.mjs contexto $DIA > out/blog/contexto.json
```

Leia `out/blog/contexto.json`.
- `jaTemPost: true` → o dia já tem post. Pare sem fazer nada.
- `tema: null` → `node scripts/blog/blog.mjs registrar $DIA falhou "sem tema livre"` e pare.
- Senão, o tema do dia é `tema` (`palavra_chave`, `intencao`, `link_alvo`, `id`).

### 2. Pesquise

Busque na web a `palavra_chave` e leia os primeiros resultados. Anote:
- o que todos dizem (o básico que o post precisa cobrir);
- o que **falta** neles: a conta que ninguém faz, o exemplo do barbeiro pequeno, o erro comum, o passo prático;
- de onde vem cada número que você vai usar. Fontes boas: órgãos oficiais (gov.br, Receita Federal, Banco Central,
  IBGE), Sebrae, jornais e portais de notícia conhecidos, e pesquisas com nome e data. Nunca cite nem linke
  concorrentes (outros apps ou sites de agenda e agendamento). Número sem fonte confiável não entra. Conta sua, com
  exemplo, pode (escreva "por exemplo" ou "na conta" na mesma linha). Cada número com fonte tem a fonte em `fontes`.

Se a busca na web falhar, escreva só com o que é certo e anote no fim do passo 5 que a pesquisa falhou.

### 3. Escreva `out/blog/corpo.md` e `out/blog/post.json`

O texto do post vai em `out/blog/corpo.md` (Markdown puro). O resto vai em `out/blog/post.json`, que aponta para o
texto com `"corpo_arquivo": "corpo.md"` (assim você não precisa escapar o texto dentro do JSON):

```json
{
  "tema_id": "<id do tema do contexto>",
  "slug": "<a palavra-chave em minúsculas, sem acento, com hífen>",
  "palavra_chave": "<a palavra_chave do tema, igual>",
  "titulo": "<até 60 caracteres, com a palavra-chave no começo>",
  "h1": "<título da página, pode ser mais longo e mais humano>",
  "descricao": "<de 120 a 160 caracteres, diz o que a pessoa vai aprender>",
  "corpo_arquivo": "corpo.md",
  "perguntas": [["pergunta?", "resposta curta e direta."]],
  "fontes": [{ "titulo": "Nome da fonte", "url": "https://..." }]
}
```

Regras do texto (`corpo.md`):
- De 900 a 1.600 palavras. Começa respondendo a busca já no primeiro parágrafo, sem enrolação.
- Pelo menos 3 subtítulos `## `. Pode usar listas, **negrito** e `### `. Não use HTML nem imagens.
- Exemplos com conta em reais sempre que o tema permitir (preço, custo, comissão, faltas).
- Pelo menos 2 links internos em Markdown, só para endereços de `linksValidos` do contexto. Prefira o `link_alvo`
  do tema; se ele não combinar de verdade com o assunto, use a guia que combinar. Não force um assunto para caber no link. Ex.: `[como diminuir as faltas](/como-diminuir-faltas-na-barbearia)`. Se houver post antigo
  em `ultimosPosts` que combine, linke também.
- O Fio aparece **no máximo** uma vez no texto, e só onde encaixar de verdade: ligado a faltas, à agenda com link ou a
  "a gente monta pra você". O site já põe o convite para criar conta no fim; o texto não é propaganda.
- Proibido: "sistema", "gestão", "plataforma", "software", "lembrete automático", promessa que o Fio não cumpre,
  número sem fonte, texto genérico que serviria para qualquer negócio.
- De 3 a 5 perguntas frequentes, do jeito que o barbeiro perguntaria, com respostas de 1 a 3 frases.

### 4. Conferidor

```sh
node scripts/blog/conferir-post.mjs out/blog/post.json out/blog/contexto.json
```

Corrija tudo o que ele apontar e rode de novo até sair "Aprovado pelo conferidor." (no máximo 4 tentativas; se não
passar, `registrar $DIA reprovado "<o que o conferidor apontou>" --descartar <tema_id>` e pare).

O conferidor não checa tudo: com uma fonte listada ele não confere mais os números, e não confere quantas vezes o Fio
aparece. Isso é com a leitura de editor.

### 5. Leitura de editor

Releia o post inteiro como um editor exigente que não escreveu o texto, e responda com sinceridade:
1. Um barbeiro que digitou a `palavra_chave` no Google sai daqui com a resposta e sabendo o que fazer amanhã?
2. O post traz algo que os primeiros resultados não trazem (a conta, o exemplo, o passo prático)?
3. Tem alguma afirmação sem base, número sem fonte ou promessa do Fio que não está na lista acima?
4. Soa como propaganda ou como texto genérico de IA (frases vazias, "no mundo de hoje", "em suma")?

Ajuste pequeno (uma frase, uma palavra) você faz e segue para o passo 4 sem contar como reescrita. Se o problema for
de fundo (o texto não responde a busca, é genérico ou é propaganda), reescreva **uma vez só** e volte ao passo 4.
Se depois disso ainda falhar:

```sh
node scripts/blog/blog.mjs registrar $DIA reprovado "<motivo curto>" --descartar <tema_id>
```

e pare.

### 6. Grave

```sh
node scripts/blog/blog.mjs gravar $DIA out/blog/post.json
```

Tem que aparecer "Gravado: /blog/<slug>, aparece em $DIA às 18h." Se aparecer "Reprovado pelo conferidor" (por
exemplo, um post novo com o mesmo slug apareceu nesse meio-tempo), troque o slug uma vez e grave de novo; se falhar
outra vez, `registrar $DIA falhou "<motivo>"` e pare.

### 7. Repor temas (só se `temasLivres` do contexto for menor que 14)

Pesquise de 15 a 20 buscas novas de dono de barbearia ou barbeiro (preço, clientes, agenda, faltas, dinheiro, MEI,
Instagram, equipe, abrir ou organizar a barbearia). Nada de corte, tendência ou barba para o cliente final. Não repita
nem quase repita um tema que já existe nem as 4 guias (agenda para barbearia, como diminuir faltas, lembrete de
horário pelo WhatsApp, agenda para barbeiro autônomo). Escreva `out/blog/temas.json`:

```json
[{ "palavra_chave": "...", "intencao": "...", "link_alvo": "/uma-das-guias", "prioridade": 100, "fonte_da_pesquisa": "de onde saiu a busca" }]
```

```sh
node scripts/blog/blog.mjs temas out/blog/temas.json
```

Se essa parte falhar, tudo bem: o post do dia já está gravado.

## Fim

Escreva em uma linha o que aconteceu: post gravado (slug), reprovado (motivo) ou parado (motivo).
