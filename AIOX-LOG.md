# AIOX Log — Regex Tester Visual

> Ferramenta de produtividade para devs: testa expressoes regulares com highlight em tempo real, lista de grupos capturados (numerados e nomeados) e historico persistente em `localStorage`. Sem backend.

---

## @aiox-master
**Pergunta:** Por onde comecar para construir uma ferramenta web simples de produtividade dev, sem banco, entregavel hoje?

**Resposta resumida:** Siga a sequencia padrao (`@pm` -> `@architect` -> `@ux-design-expert` -> `@sm` -> `@po` -> `@dev` -> `@qa` -> `@devops`). Como o escopo eh pequeno, recomendou rodar o `@dev` em modo **YOLO** apos a aprovacao do PO, mantendo o gate de QA antes do deploy.

---

## @pm
**PRD (resumo):**
- **Problema:** devs perdem tempo abrindo regex101/refletindo sintaxe quando so precisam de um teste rapido offline.
- **Usuario alvo:** desenvolvedores Python/JS/.NET que escrevem regex de validacao, parsing de log e busca em codigo.
- **Proposta:** SPA leve, sem cadastro, com highlight visual instantaneo, lista de grupos capturados, toggle de flags e historico local.
- **Metricas de sucesso:** TTFM (time-to-first-match) abaixo de 5s; zero requisicoes ao servidor apos load; build < 100KB gzip.
- **Funcionalidades MVP (P0):**
  1. Input de padrao com indicacao de erro (regex invalida).
  2. Toggles para flags `g i m s u y`.
  3. Textarea de amostra com highlight dos matches.
  4. Tabela de grupos numerados + nomeados (`(?<nome>...)`).
  5. Historico (max 12) persistido em `localStorage` com restore e remocao.
  6. Toggle de tema dark/light.
- **Fora de escopo:** export, regex cheatsheet completa, replace/substituir, multi-aba.

---

## @architect
**Decisao de stack:**
- **Vite + React 19 + TypeScript** — bundle pequeno, deploy direto no Vercel, HMR rapido. React por ja ser comum no Vercel/portfolio do aluno.
- **CSS puro com CSS custom properties** (sem Tailwind) — evita Tailwind v4 quirks, mantem dependencias minimas, tema dark/light via `data-theme` no `<html>`.
- **Sem backend, sem rota, sem state lib** — uma unica `App.tsx`, estado local com `useState`/`useMemo`. `localStorage` para historico.
- **Build target:** static site -> Vercel zero-config.
- **Estrutura:**
  ```
  src/
    App.tsx        # toda a logica + componentes
    App.css        # tokens de design + estilos
    index.css      # reset minimo
    main.tsx       # bootstrap React
  index.html
  vite.config.ts
  ```
- **Trade-off aceito:** tudo em um arquivo App.tsx — ok para escopo de 1 tela. Refatorar em componentes so se crescer.

---

## @ux-design-expert
**Spec gerada:**

**Layout** (grid 2 colunas, responsivo p/ 1 col abaixo de 720px):
```
+---------------------------+---------------------------+
| [Padrao]                  | [Texto de teste]          |
|  /<input>/<flags>         |  <textarea multiline>     |
|  [g][i][m][s][u][y]       |                           |
|  [copiar] [salvar]        |                           |
+---------------------------+---------------------------+
| [Resultado] N matches                                 |
|  texto com <mark> nos matches, com tooltip range      |
+-------------------------------------------------------+
| [Grupos capturados] tabela: # | match | range | g1..gN | ?<nome> |
+-------------------------------------------------------+
| [Historico] lista clicavel para restaurar             |
+-------------------------------------------------------+
```

**Componentes e props:**
- `<FlagButton flag="g" active={bool} onToggle />` — 34px quadrado, on=accent, off=ghost.
- `<PatternRow value flags error onChange />` — `/` decorativos, input mono, flags-display.
- `<HighlightedSample sample matches />` — `<pre>` com `<mark.match>` por intervalo.
- `<GroupsTable matches />` — colunas dinamicas conforme #grupos.
- `<HistoryList items onRestore onRemove onClear />`.

**Tokens (CSS vars):**
- Dark: `bg #0b1020`, `card #161e38`, `accent #7c9cff`, `match #f6c177`.
- Light: `bg #f5f7ff`, `card #fff`, `accent #4561ff`, `match #ffe7a8`.
- Tipografia: Inter (UI), JetBrains Mono (regex/codigo).

**Interacoes-chave:**
- Erro de regex: borda vermelha + mensagem mono abaixo.
- Zero-width match: protecao contra loop infinito (avancar lastIndex).
- Restore do historico repopula pattern + flags + sample.

---

## @sm
**Stories criadas:**

- **Story 1.1 — Tester core**
  > Como dev, quero digitar um padrao + flags e ver os matches destacados em um texto de teste, para validar minha regex sem sair do navegador.
  - AC1: input de padrao atualiza highlight em < 100ms.
  - AC2: flags `g i m s u y` clicaveis e refletidas no preview `/.../flags`.
  - AC3: regex invalida mostra mensagem de erro, sem quebrar a UI.
  - AC4: tabela lista cada match com range, grupos numerados e nomeados.

- **Story 1.2 — Historico em localStorage**
  > Como dev, quero salvar padroes uteis e restaura-los depois, para nao redigitar regex que ja validei.
  - AC1: botao "salvar" insere `(pattern, flags, sample, createdAt)` no topo.
  - AC2: maximo 12 itens, deduplicado por (pattern+flags).
  - AC3: restore preenche os tres inputs; remover apaga 1 item; "limpar tudo" apaga tudo.
  - AC4: persiste apos refresh (`localStorage` chave `regex-tester-history-v1`).

---

## @po
**Veredicto:** GO 9/10.

Pontos validados:
- PRD coerente com escopo de 60–90min.
- Stack proporcional ao problema, sem over-engineering.
- AC mensuraveis e testaveis manualmente.

Ajuste solicitado e aplicado:
- Adicionar protecao contra **zero-width regex** (ex.: `a*`) para evitar loop. -> Implementado com `if (m.index === re.lastIndex) re.lastIndex++` + guard de 10000 iteracoes.

---

## @dev
**Modo usado:** YOLO (aprovado pelo `@aiox-master` por escopo pequeno).

**Arquivos criados / alterados:**
- `src/App.tsx` — toda a logica (regex build seguro, runMatches com guard, highlight, grupos, historico, tema).
- `src/App.css` — tokens dark/light, grid responsivo, componentes.
- `src/index.css` — reset minimo (substituiu o template Vite).
- `index.html` — titulo + meta description em PT-BR.
- `AIOX-LOG.md` — este arquivo.
- `README.md` — instrucoes de uso e dev.

Decisoes durante implementacao:
- `useMemo` para regex e matches (evita rebuild em re-render).
- Tema persistido em `localStorage` chave `regex-theme`.
- Botao "copiar" exporta `/{pattern}/{flags}` para a clipboard.

---

## @qa
**Veredicto:** PASS.

**Testes manuais executados:**
| # | Cenario | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `\d+` em "abc 123 def 45" com flag `g` | 2 matches: "123", "45" | OK |
| 2 | Email `\b(\w+)@(\w+\.\w+)\b` com `gi` | matches com g1=local, g2=dominio | OK |
| 3 | Regex invalida `(` | mensagem de erro vermelha, UI estavel | OK |
| 4 | Padrao zero-width `a*` em "bbb" | sem loop infinito, matches limitados | OK |
| 5 | Salvar -> refresh -> restore | historico persiste e repreenche inputs | OK |
| 6 | Toggle tema | troca para light/dark, persiste | OK |
| 7 | `npm run build` | sem erro TS, dist ~ 200KB | OK |

**Issues encontrados:** nenhum.

---

## @devops
**Comando de deploy:**
```bash
cd "Projeto-UI-AIOX"
npx vercel --prod
```
Vercel detecta Vite automaticamente (`vite build` -> `dist/`). Sem config adicional.

**URL final:** _[preencher apos `vercel --prod`]_

**Repositorio:** _[preencher com URL do GitHub]_

---

## Reflexao

O que surpreendeu: o `@po` apontou um caso de borda (regex zero-width) que eu nao tinha considerado — sem essa correcao, o app travaria silenciosamente em padroes como `a*` ou `^`. Foi um exemplo concreto de como o gate de PO/QA pega coisas que o `@dev` em modo YOLO pula.

O que travou: definir o escopo no `@pm` — tive vontade de incluir "substituir/replace" e cheatsheet, mas o `@aiox-master` insistiu em manter MVP enxuto para caber em 60–90 minutos. Foi a decisao certa.

O que faria diferente: dividir `App.tsx` em 4-5 arquivos desde o inicio (FlagButton, GroupsTable, HistoryList) — funcionou tudo em um, mas para evoluir (replace, export, multi-padrao) o refactor agora ja seria desconfortavel.
