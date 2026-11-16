# Carrossel do dia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One educational carousel a day for barbers (7 slides, 1080×1350), written, drawn and queued by the
existing cloud routine at 15h, posted by `instagram-postar`.

**Architecture:**
- **This repo (`fio-videos`, branch `carrossel`):**
  - a pure TS script type and validator: `src/motor/carrossel.ts`;
  - a separate barber theme bank: `src/motor/bancoBarbeiro.ts` and `diario/banco/barbeiro.json`;
  - a Remotion still composition: `carrossel-slide`;
  - a CLI modelled on `stories.mjs`: `scripts/motor/carrossel.mjs`.
- **The app repo (`agendafio`, a fresh worktree from `origin/parte-1`):**
  - an additive migration;
  - `instagram-postar` learns a multi-tick carousel flow.
- The routine only starts making carousels after the owner approves 2 pilots and `carrossel` merges into `main`.

**Tech Stack:**
- Remotion 4.0.536 and React 19;
- Node 24, running `.ts` directly, with tests through `node --test`;
- Supabase: Postgres, Storage and a Deno edge function;
- Instagram Graph API v26.0.

**Spec:** `docs/superpowers/specs/2026-11-16-fio-carrosseis-design.md`

## Global Constraints

- **Format:** 1080×1350 JPEG (`--image-format=jpeg --jpeg-quality=95`), 6 to 8 slides (7 by default). Slide 1 is
  `capa` and the last is `fecho`.
- **Schedule:** 15h Brasília (`T15:00:00-03:00`), 1 per day. The reels run at 8, 11, 13, 18 and 21h, and the
  stories at 9h.
- **Audience:** the barber who owns the shop. Pure education until the final part. `Fio` (capitalized) appears
  only in the `tela` and `fecho` slides and in the legenda.
- **Forbidden words** (in every text and the legenda): sistema, gestão, plataforma, software, solução. Also
  "ferramenta" when it refers to Fio. Reuse `palavrasProibidas` from `src/motor/banco.ts`.
- **Numbers and sources:**
  - every number in a slide text must come from a fato with an `https://` fonte;
  - `fonte: "oficio"` only for numberless practice;
  - never invent;
  - no promises such as "acaba com as faltas";
  - the reminder is never automatic: the barber sends it in one tap.
- **Offer text, exact:** "7 dias grátis, sem cartão" and "a gente monta pra você" (em até 2 dias, sem custo).
- **Brand:** `C`, `F` and `Laco` from `src/base`. Dark and light backgrounds alternate. "n/total" and the tema
  appear at the top, and an arrow "→" on every slide but the last.
- **App screens:** the `TelaStory` names from `src/motor/StoryBloco.tsx` (aviso, agenda, lembretes, whats, link,
  horarios, confirmado, equipe).
- **Theme reuse:** after 60 days (`JANELA_DIAS`).
- **Verification:**
  - logic through `node --test`;
  - visuals by rendering stills and opening every one;
  - `npx tsc --noEmit -p .` must pass;
  - `node scripts/publico/conferir-publico.mjs .` must pass before any push.
- **Never touch the main app checkout** `C:\Users\luisi\Documents\Fio - App` or the `fio-videos` folder
  (another chat works there, on branch `blog`).
- **Push and posting:** never push to `main` or `parte-1`, and never post to Instagram, without the owner's OK.
- **Commits:** in Portuguese, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A long Portuguese word or a long title overflows a slide.** Expect the validator to reject over-limit text
   before render, and every limit to have room at 1080×1350. Owned by Task 3.
2. **A number typed in a slide that is not backed by the theme's fatos.** Expect `conferirCarrossel` to flag any
   digit sequence in `texto`, `lista` or `compara` text that does not appear in some fato's `texto`. Owned by
   Task 1.
3. **The cron ticks while a carousel's child containers are still processing, or one child fails.** Expect the
   post to wait, or to end as `erro`, never half-published, and reels and stories in the same tick to stay
   unaffected. Owned by Task 5.
4. **The routine runs after 15h of DIA, or reruns the same day.** Expect "horário já passou" with no row, or
   "já na fila" with no duplicate. `--trocar` replaces the images only while the post is `agendado`. Owned by
   Task 4.
5. **A carousel theme id collides with a reels theme id, or `carrossel.json` is read as a video script.** The
   reels' `usadosDasPastas` must ignore `carrossel.json`, and the carousel history comes only from
   `carrossel.json`. Owned by Task 2.

---

### Task 1: Script type and validator

**Files:**
- Create: `src/motor/carrossel.ts`
- Test: `src/motor/carrossel.test.ts`

**Interfaces:**
- Consumes: `palavrasProibidas(s: string): string[]` from `src/motor/banco.ts`, `TelaStory` from
  `src/motor/StoryBloco.tsx` (import type only), and `TemaBarbeiro` from Task 2. Define it here as an
  `import type` from `./bancoBarbeiro.ts`; Task 2 creates the file. If Task 1 runs first, create a minimal
  `bancoBarbeiro.ts` containing only the type, and Task 2 extends it.
- Produces:

```ts
export type Slide =
  | { tipo: "capa"; titulo: string; curiosidade: string; ilustracao?: { personagem?: string; objeto?: string; tela?: TelaStory } }
  | { tipo: "texto"; titulo: string; paragrafos: string[]; puxada?: string; fonte?: string }
  | { tipo: "lista"; titulo: string; itens: { termo: string; texto: string }[]; puxada?: string }
  | { tipo: "compara"; titulo: string; a: { rotulo: string; linhas: string[] }; b: { rotulo: string; linhas: string[] }; puxada?: string }
  | { tipo: "tela"; tela: TelaStory; frase: string }
  | { tipo: "fecho"; frase: string };
export type RoteiroCarrossel = { id: string; tema: string; rotulo: string; legenda: string; slides: Slide[] };
export const LIMITES_CARROSSEL: { capaTitulo: 60; curiosidade: 50; titulo: 70; paragrafo: 160; paragrafos: [2, 4]; itens: [3, 5]; item: 120; linhas: [2, 4]; linha: 60; frase: 90; rotulo: 14; slides: [6, 8] };
export function conferirCarrossel(r: RoteiroCarrossel, temas: TemaBarbeiro[]): string[];
```

- [ ] **Step 1: Write the failing tests** in `src/motor/carrossel.test.ts`, using a valid 7-slide fixture
  built in the test:
  - `aceita um carrossel de 7 slides válido` → `[]`.
  - `recusa menos de 6 ou mais de 8 slides`.
  - `recusa capa fora do primeiro e fecho fora do último`.
  - `recusa texto acima do limite`: a 161-char paragraph yields an error naming the slide number and "160".
  - `recusa palavra proibida` in a paragraph and in the legenda ("sistema").
  - `recusa Fio antes da parte final`: "Fio" in slide 3 → error. The same word in the `tela` and `fecho`
    slides → ok. Lowercase "fio da navalha" in slide 3 → ok.
  - `recusa tema fora do banco`.
  - `recusa número sem fato`: a paragraph with "37%" when no fato of that theme contains "37" → error. "R$ 120"
    present in a fato → ok.
  - `recusa tela inexistente` (`tela: {nome: "xyz"}`).
  - `recusa lista com 2 ou 6 itens`.
  - `legenda termina com link na bio`: the legenda must include "link na bio" (case-insensitive) and a "?".
- [ ] **Step 2:** Run `node --test src/motor/carrossel.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `conferirCarrossel`.**
  - Messages are in Portuguese, prefixed `slide N:`.
  - The number check extracts `/\d+([.,]\d+)?/g` from slide texts and requires each match to occur in some
    `fatos[].texto` of the theme.
  - The capitalized-`Fio` rule uses `/\bFio\b/` on every slide whose tipo is not `tela` or `fecho`.
- [ ] **Step 4:** Run `node --test src/motor/carrossel.test.ts`. Expected: PASS. Run `npx tsc --noEmit -p .`.
  Expected: clean.
- [ ] **Step 5: Commit** with the message `feat(carrossel): roteiro e conferência do carrossel`.

### Task 2: Barber theme bank and its CLI

**Files:**
- Create: `src/motor/bancoBarbeiro.ts`, `src/motor/bancoBarbeiro.test.ts`, `diario/banco/barbeiro.json` (3
  seed themes here; Task 6 fills the rest).
- Modify: `scripts/motor/banco.mjs`. `conferir` also checks `barbeiro.json`. The new subcommand
  `livres carrossel [AAAA-MM-DD]` reads history from `diario/*/carrossel.json` only. `usadosDasPastas` skips
  `carrossel.json`.

**Interfaces:**
- Consumes: `JANELA_DIAS` and `palavrasProibidas` from `src/motor/banco.ts`.
- Produces:

```ts
export type FatoBarbeiro = { texto: string; fonte: string }; // fonte: "https://…" ou "oficio"
export type TemaBarbeiro = { id: string; titulo: string; capa: string; formato: "lista" | "compara"; fatos: FatoBarbeiro[]; quadro: string[]; tela: TelaStory["nome"]; ponte: string };
export function conferirBancoBarbeiro(temas: TemaBarbeiro[]): string[];
export function livresBarbeiro(temas: TemaBarbeiro[], usados: { tema: string; dia: string }[], hoje: string): TemaBarbeiro[];
```

- [ ] **Step 1: Write the failing tests:**
  - `conferirBancoBarbeiro` accepts the 3 seed themes;
  - it rejects:
    - a duplicate id;
    - an id not matching `/^[a-z0-9-]+$/`;
    - a fato with a digit whose fonte is `"oficio"`;
    - a fonte that is neither https nor `"oficio"`;
    - fewer than 3 fatos;
    - a `quadro` with fewer than 3 or more than 5 items;
    - an unknown `tela`;
    - a forbidden word in titulo, capa, fatos, quadro or ponte;
  - `livresBarbeiro` hides a theme used 59 days ago and shows it again at 60.
- [ ] **Step 2:** Run `node --test src/motor/bancoBarbeiro.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement both functions. Write 3 real seed themes in `barbeiro.json`, with sources opened
  and read (`WebFetch`). One of them is in `compara` format.
- [ ] **Step 4:** Extend `banco.mjs` as described under Files, then run:
  - `node scripts/motor/banco.mjs conferir`. Expected: `banco ok: … temas` plus the line `barbeiro ok: 3 temas`.
  - `node scripts/motor/banco.mjs livres carrossel 2026-11-20`. Expected: the 3 ids.
  - `node scripts/motor/banco.mjs livres dica 2026-11-20`. Expected: the same output as before the change.
- [ ] **Step 5:** Run `node --test src/motor/*.test.ts`. Expected: everything passes.
- [ ] **Step 6: Commit** with the message `feat(carrossel): banco de temas do barbeiro`.

### Task 3: The slide composition

**Files:**
- Create: `src/motor/CarrosselSlide.tsx`, `diario/teste/carrossel.json` (a 7-slide sample that passes
  `conferirCarrossel`, using a seed theme, with one of each slide tipo; add a second sample
  `diario/teste/carrossel-compara.json` for compara).
- Modify: `src/Raiz.tsx`, to register `<Composition id="carrossel-slide" … width={1080} height={1350} durationInFrames={1}>`.

**Interfaces:**
- Consumes: `Slide` from Task 1; `Tela` and `TelaStory` exported from `src/motor/StoryBloco.tsx`; characters and
  objects from `src/motion/Personagens.tsx` and `src/motion/Objetos.tsx` (`Objeto2D`); `C`, `F` and `Laco`.
- Produces: `export type PropsCarrosselSlide = { rotulo: string; n: number; total: number; slide: Slide }` and
  `export function CarrosselSlide(p: PropsCarrosselSlide)`.

- [ ] **Step 1:** Implement the 6 slide layouts. Follow the G4 pattern in the spec:
  - big title;
  - short paragraphs;
  - the bold `puxada` last;
  - the source in small type;
  - the numbered list as the "save" slide;
  - two columns for compara;
  - the whole phone in frame for tela, never stretched to the edge;
  - for fecho, the laço plus "7 dias grátis, sem cartão · a gente monta pra você" and "Link na bio".

  Odd slides use the dark background and even slides the light one.
- [ ] **Step 2:** Render every slide of both samples to `out/carrossel-teste/`, with
  `npx remotion still src/index.ts carrossel-slide out/carrossel-teste/<n>.jpg --props=<file> --image-format=jpeg --jpeg-quality=95`.
  Write the props file to disk; inline JSON breaks on Windows.
- [ ] **Step 3:** Open EVERY still. Check that:
  - no text is clipped or overlapping;
  - the max-length texts fit. Add a third sample with every field at its `LIMITES_CARROSSEL` maximum and long
    words ("desmarcações", "reagendamento").

  Iterate until all of that holds.
- [ ] **Step 4:** Run `npx tsc --noEmit -p .`. Expected: clean.
- [ ] **Step 5: Commit** with the message `feat(carrossel): slides do carrossel`.

### Task 4: The carousel CLI

**Files:**
- Create: `scripts/motor/carrossel.mjs`, `scripts/motor/carrossel.test.mjs`.

**Interfaces:**
- Consumes: `conferirCarrossel` (Task 1); the bank from `diario/banco/barbeiro.json` (Task 2); `carrossel-slide`
  (Task 3).
- Produces the CLI `node scripts/motor/carrossel.mjs AAAA-MM-DD [--publicar] [--trocar] [--so-conferir]`. It:
  - reads `diario/<dia>/carrossel.json`;
  - renders `out/motor/carrossel/<dia>/<n>.jpg`;
  - with `--publicar`:
    - uploads each image to `instagram/diario/<dia>/carrossel/<n>.jpg`;
    - inserts one row `{ tipo: "carrossel", video: <path of image 1>, imagens: [<all paths in order>], legenda, publicar_em: <dia>T15:00:00-03:00 }`.
  - The other flags:
    - `--so-conferir` only validates, with exit code 1 on errors;
    - `--trocar` re-uploads the images only while the row is `agendado`.

- [ ] **Step 1: Write the failing tests** (spawn the CLI with `--so-conferir` in a temp copy of `diario/`, as
  `fazer-3d.test.mjs` does):
  - a valid file exits 0;
  - a file with "sistema" exits 1 and prints `✗`;
  - a missing file exits 1 with `falta diario/<dia>/carrossel.json`.
- [ ] **Step 2:** Run `node --test scripts/motor/carrossel.test.mjs`. Expected: FAIL.
- [ ] **Step 3:** Implement it, mirroring `stories.mjs`: one bundle, one still per slide, and the same
  `api()`/`subir()` helpers.
  - "Horário já passou": no upload and no row.
  - A row already exists (matched by `video`): "já na fila (estado)" and no duplicate.
  - The `imagens` field is sent only for carrossel.
- [ ] **Step 4:** Run the tests. Expected: PASS. Then run
  `node scripts/motor/carrossel.mjs 2026-11-20 --so-conferir` after copying `diario/teste/carrossel.json` to
  `diario/2026-11-20/`. Remove that folder afterwards.
- [ ] **Step 5: Commit** with the message `feat(carrossel): script que faz e agenda o carrossel`.

### Task 5: Queue and posting function (app repo)

**Files**, all in a NEW worktree of `luisinacio1/agendafio` from `origin/parte-1`, outside the main checkout:
- Create: `supabase/migrations/20261116000001_instagram_carrossel.sql`.
- Modify: `supabase/functions/instagram-postar/index.ts`.

**Interfaces:**
- Produces:
  - the table columns `imagens text[] null` and `filhos text[] null`;
  - `tipo` check `in ('reels','story','carrossel')`.
  - `video` stays NOT NULL; for a carousel it holds image 1.

- [ ] **Step 1: Migration.** It is additive only: drop and recreate the `tipo` check with the 3 values, and add
  the 2 nullable columns.
- [ ] **Step 2: Function.** Add `imagens` and `filhos` to `Post` and to both selects.
  - **Due `carrossel` row:**
    - create one child per image with `{ image_url, is_carousel_item: "true" }`;
    - save `filhos`;
    - set `estado: "processando"`, keeping `container_id` null.
  - **In the processando loop, for a carousel with `container_id` null:**
    - read each child's `status_code`;
    - all `FINISHED` → create the parent `{ media_type: "CAROUSEL", children: filhos.join(","), caption: legenda }` and save it as `container_id`;
    - any child `ERROR` or `EXPIRED` → `estado: "erro"`;
    - otherwise wait for the next tick.
  - **With `container_id` set:** the existing path (check status, then publish).
  - **Isolation:** each post's try/catch stays isolated, so a failing carousel never blocks reels or stories.
- [ ] **Step 3: Verify the deploy order.** Run these from the new worktree:
  1. `npx supabase db push --linked --dry-run`: it must list only the new migration. Then apply it.
  2. `npx supabase functions deploy instagram-postar --project-ref jtcymmkstzmjednnrvxb`.
  3. Query the queue: the reels and stories rows are unchanged, and the next scheduled reel posts normally at
     its hour.
- [ ] **Step 4: Commit** on a branch named `instagram-carrossel` with the message
  `feat(instagram): fila e carteiro aprendem o carrossel`. Push that branch only. Merging into `parte-1`
  waits for the owner's OK.

### Task 6: First barber bank

**Files:**
- Modify: `diario/banco/barbeiro.json`, which ends with about 30 themes. Fewer is fine when sources are missing.

- [ ] **Step 1:** Research with WebSearch and WebFetch. Cover:
  - faltas and their monthly cost;
  - preço and reajuste;
  - the client who disappears;
  - encaixe;
  - peak hours and dead hours;
  - team commission;
  - fidelização;
  - ticket médio;
  - a full agenda without delays;
  - confirmation the day before.

  Prefer sources such as Sebrae, recognised surveys and serious press. A number enters only from a page that was
  opened and read, with its https link. Practice without numbers uses `"oficio"`. Write an honest `ponte` to a
  real Fio feature, or drop the theme. About 1 in 4 themes uses `formato: "compara"`.
- [ ] **Step 2:** Run `node scripts/motor/banco.mjs conferir`. Expected: `barbeiro ok: N temas`.
- [ ] **Step 3: Commit** with the message `feat(carrossel): primeiro banco de temas do barbeiro`.

### Task 7: Routine and guide

**Files:**
- Modify: `diario/GUIA.md` (new section "Carrossel do dia": the rules, the slide catalogue with a JSON example
  of each tipo, the default 7-slide order, the A vs B variant, and the legenda pattern).
- Modify: `diario/ROTINA.md` (new step "Carrossel": `livres carrossel $DIA` → write
  `diario/$DIA/carrossel.json` → `carrossel.mjs $DIA --so-conferir` → `carrossel.mjs $DIA` → open the
  slides in batches → `carrossel.mjs $DIA --publicar`; done while the videos render; the summary lists the
  carousel).
- Modify: `diario/BANCO.md` (Sunday: also refill `barbeiro.json` up to 20 free themes, with the same source
  rules).

- [ ] **Step 1:** Write the three sections. Every command and flag must exist; check each against Tasks 2
  and 4.
- [ ] **Step 2:** Run `node scripts/motor/banco.mjs livres carrossel 2026-11-20` and the `--so-conferir`
  command on the GUIA's full example, copied to a temp day. Expected: both succeed.
- [ ] **Step 3: Commit** with the message `docs(carrossel): rotina, guia e reposição do banco do barbeiro`.

### Task 8: Pilots and owner gate

**Files:**
- Create: `diario/pilotos/carrossel-lista.json` and `diario/pilotos/carrossel-compara.json`.

- [ ] **Step 1:** Write the 2 pilots from bank themes, following the GUIA: one in `lista` format and one in
  `compara` format.
- [ ] **Step 2:** Validate and render both with the CLI. Copy each pilot as `carrossel.json` into a temp day
  folder and run `carrossel.mjs <dia>` without `--publicar`. Open every slide and revise up to 2 rounds.
- [ ] **Step 3:** Copy the JPGs to `C:\Users\luisi\Desktop\Pilotos Fio\Carrossel 1 - …\` and
  `Carrossel 2 - …\`.
- [ ] **Step 4: Commit** with the message `feat(carrossel): pilotos`.
- [ ] **Step 5: STOP.** Show the owner. After approval, with the owner's OK:
  - merge `carrossel` into `main` (run `conferir-publico` first) and push;
  - merge the app branch into `parte-1`;
  - optionally post one pilot.

  From the next run on, the routine makes 1 carousel per day.
