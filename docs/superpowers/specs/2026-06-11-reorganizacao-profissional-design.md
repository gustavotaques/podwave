# Design: Reorganização profissional do PodWave

**Data:** 2026-06-11
**Status:** Aprovado

## Contexto

O PodWave é um app Express + EJS no estilo express-generator: `app.js`, `bin/www`,
`routes/`, `views/` e `public/` na raiz. Os problemas que motivam a refatoração:

- `banco.js` é um arquivo-deus de 411 linhas com o pool de conexão e todas as
  queries de 7 entidades.
- As rotas misturam autenticação, validação, lógica de negócio e renderização.
- A "sessão" é feita com `global.usuarioCodigo`/`global.usuarioEmail` (60
  ocorrências em 6 arquivos): todos os usuários compartilham o mesmo login —
  se duas pessoas logarem, a segunda assume a conta da primeira.
- O botão "Sair" envia `POST /usuarios/logout`, mas nenhuma rota trata isso:
  o logout hoje é um 404.
- Mistura de estilos: `var` + CommonJS nas rotas, `const`/`async` no banco.

Baseline de testes: 45/45 verdes (25 unit mockados + 20 integração com banco
real via Docker, porta 3307).

## Decisões

1. **Manter SSR (Express + EJS)** — sem separação API/SPA. Para apps
   server-rendered, views vivem com o servidor; essa é a forma profissional
   desse padrão. A separação em camadas deixa uma futura extração de API barata.
2. **Camadas técnicas** (`routes/`, `controllers/`, `repositories/`) em vez de
   módulos por feature — estrutura mais reconhecível para o tamanho do app.
3. **Sem camada de services** — a lógica das rotas é fina (validação + chamadas
   ao banco); controller → repository direto. YAGNI.
4. **Migrar para ES Modules** (`"type": "module"`, `import/export`).
5. **Trocar globals por `express-session`** e corrigir o logout.
6. **URLs não mudam** (`/meusPodcasts`, `/episodios/:podcodigo`, ...) — as
   views continuam funcionando sem retocar links.

## Estrutura de pastas

```
podwave/
├── src/
│   ├── app.js                      # montagem do Express (middlewares, rotas, erros)
│   ├── server.js                   # entry point: sobe o servidor (substitui bin/www)
│   ├── config/
│   │   └── database.js             # pool mysql2 (sem global.connection)
│   ├── middlewares/
│   │   └── auth.js                 # requireLogin: sem sessão → redirect /login
│   ├── routes/
│   │   ├── index.js                # agrega e exporta todas as rotas
│   │   ├── home.routes.js          # GET /
│   │   ├── auth.routes.js          # /login, /signup, /usuarios/logout
│   │   ├── listas.routes.js
│   │   ├── episodios.routes.js
│   │   ├── meusPodcasts.routes.js
│   │   └── meusEpisodios.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── home.controller.js
│   │   ├── listas.controller.js
│   │   ├── episodios.controller.js
│   │   ├── meusPodcasts.controller.js
│   │   └── meusEpisodios.controller.js
│   ├── repositories/               # banco.js fatiado, 1 arquivo por entidade
│   │   ├── usuarios.repository.js
│   │   ├── podcasts.repository.js  # inclui categorias (só usadas por podcasts)
│   │   ├── episodios.repository.js
│   │   ├── comentarios.repository.js
│   │   ├── avaliacoes.repository.js
│   │   ├── favoritos.repository.js
│   │   └── progresso.repository.js
│   └── views/                      # EJS é código do servidor, vai junto
├── public/                         # assets estáticos ficam na raiz
├── tests/
├── docs/, docker-compose.yml, package.json, .env.example
```

Responsabilidades por camada:

- **routes**: só mapeiam URL → controller (e aplicam `requireLogin`).
- **controllers**: req/res, validação de entrada, render/redirect.
- **repositories**: SQL. Nomes de funções atuais (`buscarPodcastPorId`, etc.)
  e assinaturas se mantêm.

## Sessão (express-session)

- `express-session` com MemoryStore padrão (suficiente para o contexto do
  projeto); `SESSION_SECRET` via `.env` (com default no código e entrada no
  `.env.example`).
- Login/signup fazem `req.session.usuario = { codigo, email }`.
- Toda leitura de `global.usuarioCodigo`/`global.usuarioEmail` vira
  `req.session.usuario`.
- O check repetido `if (!global.usuarioCodigo) return res.redirect('/login')`
  em cada handler vira o middleware `requireLogin` aplicado às rotas protegidas.
- **Nova rota** `POST /usuarios/logout`: `req.session.destroy()` → redirect
  `/login` (conserta o botão Sair).

## Fatiamento do banco.js

- `config/database.js` exporta o pool (e helper de query); repositories
  importam dele. O hack `global.connection` morre — módulo ESM já é singleton.
- Cada repository recebe as funções da sua entidade, sem mudar SQL nem
  assinaturas.
- Os `console.log` de debug nas queries (atualizar/deletar podcast) saem.
- O teste de conexão na carga do módulo (`SELECT 1` + mensagem amigável sobre
  `docker compose up -d`) migra para o `server.js`.

## ESM + tooling

- `"type": "module"` no `package.json`.
- Jest roda com `node --experimental-vm-modules` no script `test` (e
  `coverage`).
- `npm start` vira `nodemon -- --env-file-if-exists=.env src/server.js`.
- `bin/www` e `banco.js` deletados ao final.

## Testes

- **Integração (20):** ajuste de imports apenas — continuam batendo no banco
  real via supertest.
- **Unit (25):** mocks de `../banco` reescritos como mocks dos repositories
  (via `jest.unstable_mockModule`, o caminho ESM do Jest). Mesmos cenários e
  asserções — muda só a fiação. Testes que simulavam login via globals passam
  a logar via supertest agent (mantém cookie de sessão).
- **Critério de pronto: 45/45 verdes**, mesmo baseline de hoje.

## O que não muda

Schema do banco, `docker-compose.yml`, views (zero ou quase zero ajustes),
URLs e comportamento visível — com duas exceções intencionais: o logout passa
a funcionar e dois usuários podem usar o app simultaneamente sem roubar a
sessão um do outro.
