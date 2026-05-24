# Regex Tester Visual

Ferramenta web de produtividade para devs: testa expressoes regulares com highlight em tempo real, lista de grupos capturados (numerados e nomeados) e historico persistente em `localStorage`. Sem backend, sem cadastro.

Projeto da disciplina **IA Generativa com AIOX** — 7ª fase de Sistemas de Informacao (UNIVALI).

## Demo
- **Vercel:** _adicionar URL apos deploy_
- **Repo:** _adicionar URL do GitHub_

## Funcionalidades
- Input de padrao com deteccao de erro
- Toggle de flags `g i m s u y`
- Highlight visual de todos os matches no texto de teste
- Tabela de grupos capturados (`g1`, `g2`, ..., e nomeados `?<nome>`)
- Historico de ate 12 padroes salvos (localStorage)
- Tema dark / light (persistido)
- Copy `/padrao/flags` para clipboard

## Stack
- Vite 8 + React 19 + TypeScript
- CSS puro com custom properties (sem Tailwind)
- Deploy: Vercel (zero config — detecta Vite)

## Dev local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve dist/ local
```

## Estrutura
```
src/
  App.tsx       toda a logica + UI
  App.css       tokens + componentes
  index.css     reset minimo
  main.tsx      bootstrap
AIOX-LOG.md     log do workflow AIOX
```

## Workflow AIOX
Veja [AIOX-LOG.md](./AIOX-LOG.md) para o registro completo dos agentes usados: `@aiox-master` -> `@pm` -> `@architect` -> `@ux-design-expert` -> `@sm` -> `@po` -> `@dev` -> `@qa` -> `@devops`.

## Autor
David Willian — 7ª fase Sistemas de Informacao, UNIVALI.
