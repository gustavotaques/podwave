# Design: Banco do PodWave em Docker

**Data:** 2026-06-10
**Status:** Aprovado

## Objetivo

Substituir a dependência de XAMPP/MySQL local pelo banco MariaDB rodando em
container Docker. O app Node continua rodando no WSL com `npm start`.

## Contexto

- O app conecta hoje em `localhost:3306` como `root` sem senha, banco
  `podwave`, com valores hardcoded em `banco.js`.
- O ambiente do desenvolvedor é WSL2 + Docker Desktop (integração WSL a
  ativar). O serviço Windows MySQL80 ocupa a porta 3306 do host.
- O dump `podwavebackupfinal.sql` (MariaDB 10.4, via mysqldump) está na raiz
  do repositório e contém schema + dados de teste.

## Decisões

| Decisão | Escolha |
|---|---|
| Escopo do Docker | Só o banco; app fica fora do container |
| Imagem | `mariadb:lts` |
| População do banco | Importação automática via `/docker-entrypoint-initdb.d` |
| Credenciais | Variáveis de ambiente com padrões apontando para o container |
| Porta no host | `3307` (evita conflito com MySQL80 do Windows na 3306) |

## Componentes

### docker-compose.yml (novo, raiz do projeto)

Serviço único `db`:

- Imagem `mariadb:lts`.
- Porta `3307:3306`.
- Ambiente: `MARIADB_DATABASE=podwave`, `MARIADB_ALLOW_EMPTY_ROOT_PASSWORD=1`
  (compatível com o comportamento atual; ambiente de dev local, sem exposição
  externa).
- `./podwavebackupfinal.sql` montado read-only em
  `/docker-entrypoint-initdb.d/` — importado automaticamente na primeira
  inicialização do volume.
- Volume nomeado para persistência dos dados entre `down`/`up`.
- Healthcheck (`healthcheck.sh --connect --innodb_initialized`).

### banco.js (alterado)

- `createConnection` passa a ler `DB_HOST`, `DB_PORT`, `DB_USER`,
  `DB_PASSWORD`, `DB_NAME` de `process.env`, com padrões `localhost`, `3307`,
  `root`, `''`, `podwave` — `npm start` funciona sem `.env`.
- O `connectDB()` chamado no load do módulo ganha `.catch` com mensagem clara
  orientando a rodar `docker compose up -d` (hoje gera unhandled rejection se
  o banco estiver fora).

### .env.example (novo)

Documenta as cinco variáveis com os valores padrão. Sem dependência nova: o
script `start` usa `nodemon --env-file-if-exists=.env ./bin/www` (suporte
nativo do Node 22).

### README.md (alterado)

Seção de instalação/execução reescrita: pré-requisito vira Docker, passo a
passo do XAMPP substituído por `docker compose up -d` + `npm start`.

## Validação

1. `docker compose up -d` → healthcheck fica saudável.
2. Importação conferida: contagem de tabelas e presença dos usuários de teste
   (`gustavo@gmail.com`, `joao@gmail.com`).
3. `npm start` + login via `curl` em `http://localhost:3000`.
4. Suíte existente `npm test` passa.

## Fora de escopo

- Containerizar o app Node.
- Trocar credenciais/hardening de produção.
- Alterações de schema ou de funcionalidade.
