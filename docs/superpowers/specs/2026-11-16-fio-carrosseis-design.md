# Carrossel do dia: educação para o barbeiro

Data: 2026-11-16. Aprovado em conversa com o dono, que tem a palavra final.

## Por que

O perfil @agendafio já posta:
- 5 reels por dia, para o público em geral indicar o Fio ao barbeiro;
- 1 bloco de stories às 9h, de fim de funil.

Falta o carrossel. O dono quer que ele cumpra um **papel de educação**, no estilo dos carrosséis do G4
(@g4.business), e que fale **com o barbeiro**: ensinar o dono da barbearia a cuidar do negócio, como o G4 faz
com o empresário, e no fim mostrar que a agenda faz parte disso.

Sucesso é o barbeiro **salvar e compartilhar** o carrossel e, por confiança, entrar no link da bio. Uma curtida
solta não conta.

## O que o G4 faz e copiamos na forma

Analisamos 2 carrosséis do G4 slide por slide, em 16/11: o caso Havaianas, com 7 slides, e "Como contratar
Geração Z vs Millennials".

1. **Capa como manchete:** um caso ou dado real, mais uma pergunta que deixa curiosidade ("O que ela fez de
   diferente?"), com seta para arrastar.
2. **O caso com números**, que vêm de fonte.
3. **A virada para quem lê:** "Sua empresa pode estar…". O caso vira lição.
4. **Um quadro prático numerado** ("Antes de investir, analise estes 4 indicadores"). É o slide que se salva.
5. **A última linha de cada slide, em negrito, puxa para o próximo.**
6. **O último slide liga a lição ao produto**, com "Acesse o link na bio", sem forçar.
7. **Visual:** fundos escuro e claro se alternando, título grande, 3 ou 4 parágrafos curtos por slide e 7
   slides.
8. **Formato alternativo "A vs B":** um aspecto por slide.

Copiamos a estrutura, não o conteúdo nem a identidade visual do G4.

## Metas, não metas e o que seria fracasso

**Metas**
- 1 carrossel por dia, às **15h** (Brasília), feito e agendado pela rotina diária da nuvem, sem o dono tocar
  em nada.
- Conteúdo útil de verdade para o barbeiro dono do negócio, com cada número com fonte.

**Não metas**
- Fotos reais ou geradas por IA (a nuvem não tem como produzir).
- Carrossel para o público em geral (isso é dos reels).
- Mudar os reels, os stories ou o blog.

**Fracasso, mesmo que funcione**
- Número inventado, ou estatística sem fonte aberta e lida.
- Texto genérico de "coach" ("acredite no seu potencial").
- Promessa de resultado ("acaba com as faltas").
- Tom de venda do começo ao fim.
- Usar as palavras proibidas.
- Dizer que o Fio faz algo que ele não faz. O caso mais comum: dizer que o lembrete é automático, quando quem
  envia é o barbeiro, em um toque.

## Restrições que já valem

- Posicionamento, frase-mãe e lista fixa do que o Fio faz: as de `diario/GUIA.md`.
- Palavras proibidas: sistema, gestão, plataforma, software, solução, e "ferramenta" quando fala do Fio.
- Oferta: "7 dias grátis, sem cartão" e "a gente monta pra você" (em até 2 dias, sem custo).
- Cores e fontes do Fio: `C`, `F` e `Laco` em `src/base`.
- Limite do Instagram: até 10 imagens por carrossel. A fila do dia fica em 5 reels, 4 stories e 1 carrossel,
  bem abaixo do limite diário de publicação da API.
- Os reels saem às 8h, 11h, 13h, 18h e 21h, e os stories às 9h. O carrossel às 15h não bate com nenhum.

## Caminhos considerados

1. **Escolhido: desenhar os slides com o mesmo motor dos stories** (uma composição do Remotion renderizada
   como imagem). A rotina da nuvem que já faz os reels e os stories também escreve e desenha o carrossel e o põe
   na fila. Reaproveita as telas do app, os personagens e objetos 2D, a marca e a fila.
2. **Canva ou outro serviço externo:** custo mensal, e a nuvem não usa sozinha. Descartado.
3. **Fotos reais, como as do G4:** a nuvem não tem como produzir. Descartado. No lugar delas entram as telas
   reais do app e os desenhos 2D que já existem.

## O que o dono decidiu

- Papel: educação, com o G4 como modelo.
- Público: **o barbeiro**.
- 1 carrossel por dia.
- Formato e horário que propus e ele aprovou:
  - 7 slides no modelo do G4: capa, problema com números, virada "na sua barbearia", quadro prático numerado
    e fecho ligando ao Fio com "Link na bio";
  - às vezes, o formato "A vs B";
  - banco de temas próprio para barbeiros, com fonte em cada número;
  - às 15h;
  - a função que posta aprende o formato carrossel.

## O desenho

### Slides (1080×1350, retrato 4:5)

Uma composição nova, `carrossel-slide`, renderizada como imagem (JPEG de alta qualidade), um slide por vez,
como o `story-bloco` faz hoje. Os tipos de slide:

- **capa:**
  - manchete grande (no máximo cerca de 60 letras) e linha de curiosidade (no máximo cerca de 50);
  - ilustração opcional: um personagem ou objeto 2D do motor, ou uma tela do app;
  - "Arraste →" no rodapé.
- **texto:**
  - título (no máximo cerca de 70 letras) e de 2 a 4 parágrafos curtos (cada um com no máximo cerca de 160
    letras);
  - a `puxada` em negrito no fim, que leva ao próximo slide;
  - fonte em letra pequena, quando o slide traz um número.
- **lista:** título e de 3 a 5 itens numerados, cada um com termo em negrito e explicação curta. É o slide de
  salvar.
- **compara:** título e duas colunas (A e B) com 2 a 4 linhas cada. É o formato "A vs B".
- **tela:** o celular com uma tela real do app (os mesmos nomes de tela dos stories) e uma frase do que ela
  mostra. Só pode aparecer na parte final, ligada ao Fio.
- **fecho:**
  - a frase que fecha a lição e liga ao Fio, com o laço do Fio;
  - "7 dias grátis, sem cartão · a gente monta pra você";
  - "Link na bio".

Mais regras de visual:
- Fundos escuro e claro se alternando, nas cores do Fio.
- Em todos os slides: o número do slide ("3/7") e o tema no topo.
- A seta → em todos menos o último.

### Estrutura de um carrossel

7 slides, com tolerância de 6 a 8. Por padrão:

1. capa;
2. texto com o problema e os números;
3. texto com a virada para "na sua barbearia";
4. lista, o quadro prático;
5. texto ou compara, com o detalhe ou o exemplo;
6. tela (o Fio fazendo parte disso);
7. fecho.

No formato "A vs B", os slides 2 a 5 viram `compara`, cada um com um aspecto.

O Fio só aparece nos 2 slides finais: tela e fecho. Antes disso o carrossel é educação pura.

### Conteúdo: banco de temas do barbeiro

Um banco separado em `diario/banco/barbeiro.json`, no mesmo espírito do banco dos reels. Cada tema tem:

- `id`, `titulo`, `capa` (sugestão de manchete) e `formato` (`lista` ou `compara`);
- `fatos`: cada um com `texto` e `fonte`.
  - **Todo número tem fonte https** aberta e lida (Sebrae, pesquisas e reportagens confiáveis).
  - `fonte: "oficio"` só vale para prática de ofício sem número.
- `quadro`: os itens práticos do slide de lista;
- `tela`: a tela do app que combina;
- `ponte`: a frase honesta que liga a lição ao Fio. Um tema sem ponte honesta não entra.

Assuntos, para começar:
- faltas e quanto custam no mês;
- preço e reajuste;
- cliente que some;
- encaixe;
- horário de pico e horário morto;
- comissão de equipe;
- fidelização;
- ticket médio;
- agenda cheia sem atraso;
- confirmação na véspera.

O primeiro banco é montado e conferido agora, com uns 30 temas, o bastante para um mês. A rotina de domingo
(`diario/BANCO.md`) passa a repor este banco também, com as mesmas regras de fonte.

Um tema só volta depois de 60 dias. A conferência do banco (`scripts/motor/banco.mjs conferir`, ou uma irmã
dela) também confere este banco.

### Roteiro e conferência

- A nuvem escreve `diario/<DIA>/carrossel.json`: tema, slides e legenda.
- Um script novo, no padrão de `stories.mjs`, faz o trabalho:
  `node scripts/motor/carrossel.mjs AAAA-MM-DD [--publicar] [--trocar]`.
  - confere o roteiro;
  - desenha os slides em `out/motor/carrossel/<DIA>/`;
  - com `--publicar`, sobe as imagens para o bucket `instagram` e põe na fila às 15h.
- O script **recusa**:
  - um carrossel fora de 6 a 8 slides;
  - capa que não é o primeiro slide, ou fecho que não é o último;
  - texto acima dos limites;
  - palavras proibidas;
  - "Fio" com maiúscula antes da parte final;
  - tema fora do banco;
  - número sem fonte num slide de texto.
- **Legenda do post**, educativa como a do G4:
  - um resumo da lição em 3 ou 4 parágrafos;
  - a fonte dos números;
  - "Link na bio pra testar 7 dias grátis";
  - uma pergunta para o barbeiro comentar.

### Postagem

- **Fila:** a tabela `instagram_post` ganha o tipo `carrossel` e uma coluna com a lista ordenada das imagens.
  Hoje ela só aceita `reels` e `story`, com um arquivo por post. Isso é uma migração no repositório do app
  (`luisinacio1/agendafio`).
- **Função que posta:** `instagram-postar`, no repositório do app, também aprende o carrossel:
  1. cria um contêiner por imagem (item de carrossel);
  2. cria o contêiner do carrossel com os filhos e a legenda;
  3. segue o mesmo caminho de hoje: processando, conferir status e publicar.

  Reels e stories continuam iguais.

### Rotina

`diario/ROTINA.md` ganha o passo "Carrossel":
1. escolher o tema livre do banco do barbeiro;
2. escrever o roteiro;
3. rodar o script;
4. abrir os slides (em lote);
5. publicar.

É rápido e pode ser feito enquanto os vídeos renderizam. O resumo do dia passa a citar o carrossel. `GUIA.md`
ganha a seção "Carrossel do dia", com as regras acima e um exemplo completo.

### Pilotos antes de ligar

Antes de ligar na rotina, faço **2 carrosséis piloto**: um no formato lista e outro no "A vs B". O dono vê as
imagens e aprova. Só depois a rotina passa a fazer um por dia.

## Decisões técnicas minhas, depois da leitura de quem vai construir

Estas são escolhas minhas. O dono pode corrigir qualquer uma.

- **Acesso e entrega.**
  - O Supabase de produção (`jtcymmkstzmjednnrvxb`) recebe a migração e a função pela CLI do Supabase. Ela
    já está logada nesta máquina e foi usada para buscar chaves e instalar a função em 07/11.
  - A mudança do app é feita num worktree novo, a partir de `origin/parte-1`. O checkout principal do app não é
    tocado, porque é compartilhado com outras conversas.
  - A instalação vai para produção, e o commit vai para `parte-1`, com o OK do dono, que já aprovou mexer na
    função de postar.
- **Ordem sem quebrar o que já roda.**
  1. A migração vem primeiro e só **acrescenta**:
     - o tipo `carrossel` na regra de tipos;
     - uma coluna de imagens que pode ficar vazia;
     - uma coluna de estado dos filhos, se precisar.
     `video` continua obrigatório: num carrossel, guarda o caminho da primeira imagem.
  2. A função atual não lê as colunas novas, então reels e stories seguem iguais. Nenhuma linha de carrossel
     existe até o primeiro piloto.
  3. Depois a função nova é instalada. Só então algum carrossel entra na fila.
- **Máquina de estados do carrossel na função.** Pode levar várias passadas do cron de 5 minutos:
  1. cria os contêineres dos filhos e guarda os ids;
  2. quando todos estiverem prontos, cria o contêiner pai com a legenda;
  3. segue o caminho de hoje: processando, depois publica.
  O limite de tentativas vale para o post inteiro. Um carrossel nunca é publicado pela metade: ou sai inteiro
  ou fica com `erro`.
- **Onde o código vive e quando entra no ar.**
  - Os slides, o script, o banco e as instruções ficam em `luisinacio1/fio-videos`, no ramo `carrossel`
    (`C:\Users\luisi\Documents\fio-videos-carrossel`).
  - O ramo só é juntado ao `main`, que é de onde a rotina roda, **depois que o dono aprovar os 2 pilotos**. Até
    lá a rotina diária não faz carrossel.
  - Os pilotos são postados só com a aprovação do dono.
- **Pesquisa do banco.** Quem constrói tem busca e leitura na web. Um número entra só com a página aberta e
  lida.
  - Se faltar fonte para um número, o tema entra sem o número, com a prática de ofício, ou fica de fora.
  - É melhor começar com menos de 30 temas do que com um dado inventado.
- **Horário e atraso.**
  - Como nos reels, a rotina prepara o dia seguinte (`DIA` é quase sempre amanhã), então as 15h ainda não
    passaram.
  - Se a rotina atrasar e as 15h do dia já tiverem passado, o carrossel não é agendado e o resumo conta isso.
    É o mesmo tratamento dos reels.
- **Repetição de tema.** O histórico vem das pastas `diario/<DIA>/carrossel.json`, que o robô do workflow
  salva no repositório todo dia. Quem constrói escolhe entre isso e os posts já feitos na fila, como o
  `banco.mjs livres` faz para os reels. O banco não guarda a data de uso.

## O que fica com quem constrói

- O desenho exato de cada tipo de slide, desde que siga as regras acima e as cores e fontes do Fio.
- Os limites exatos de letras, ajustados para caber com folga no 1080×1350.
- O formato JSON do roteiro e da coluna de imagens.
- Como a migração e a função nova chegam à produção, sem mexer no checkout principal do app, que é usado por
  outras conversas.
- Em qual horário da rotina o carrossel é feito.
