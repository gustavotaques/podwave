# Banco do PodWave em Docker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a dependência de XAMPP/MySQL local por um MariaDB em container Docker, com importação automática do dump e conexão configurável por variáveis de ambiente.

**Architecture:** Um `docker-compose.yml` com serviço único `db` (`mariadb:lts`, host porta 3307) que importa `podwavebackupfinal.sql` na primeira subida. `banco.js` passa a ler a configuração de conexão de `process.env` com padrões que já apontam para o container, então `npm start` funciona sem `.env`.

**Tech Stack:** Docker Compose, MariaDB LTS, Node 22 (`--env-file-if-exists`), Express, mysql2, nodemon, jest.

**Spec:** `docs/superpowers/specs/2026-06-10-banco-docker-design.md`

**Pré-requisito de ambiente (só para a Task 5):** Docker Desktop aberto no Windows com a integração WSL ativada para esta distro (Settings → Resources → WSL Integration). As Tasks 1–4 não precisam de Docker.

---

### Task 1: docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Criar o arquivo**

```yaml
services:
  db:
    image: mariadb:lts
    container_name: podwave-db
    ports:
      - "3307:3306"
    environment:
      MARIADB_DATABASE: podwave
      MARIADB_ALLOW_EMPTY_ROOT_PASSWORD: "1"
    volumes:
      - db_data:/var/lib/mysql
      - ./podwavebackupfinal.sql:/docker-entrypoint-initdb.d/podwavebackupfinal.sql:ro
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 12

volumes:
  db_data:
```

Notas para quem não conhece a imagem `mariadb`:
- `MARIADB_DATABASE` cria o banco `podwave` na primeira inicialização do volume.
- Qualquer `.sql` em `/docker-entrypoint-initdb.d/` é importado automaticamente **dentro desse banco**, só na primeira inicialização (volume vazio).
- A porta do host é **3307** porque o serviço Windows MySQL80 ocupa a 3306 e o Docker Desktop encaminha portas publicadas para o host Windows.
- `healthcheck.sh` já vem dentro da imagem oficial.

- [ ] **Step 2: Validar sintaxe**

Run: `docker compose config --quiet && echo OK`
Expected: `OK` (se o Docker ainda não estiver disponível no WSL, pular — a validação real acontece na Task 5).

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: banco MariaDB em Docker via docker-compose"
```

---

### Task 2: banco.js configurável por variáveis de ambiente

**Files:**
- Modify: `banco.js:1-20` (bloco de conexão) e `banco.js:369` (chamada no load do módulo)
- Test: `tests/app.test.js` (suíte existente; mocka `banco.js` inteiro, então só precisa continuar passando)

- [ ] **Step 1: Rodar a suíte existente antes de mexer (linha de base)**

Run: `npm test`
Expected: PASS (todos os testes verdes). Se algo já estiver quebrado, anotar e não atribuir a esta mudança.

- [ ] **Step 2: Extrair a configuração de conexão para `process.env`**

Substituir o trecho `banco.js:1-20` por:

```js
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'podwave',
    charset: 'utf8mb4'
};

async function connectDB() {
    if (global.connection && global.connection.state !== 'disconnected') {
        return global.connection;
    }

    const connection = await mysql.createConnection(DB_CONFIG);

    console.log('Conectou ao MySQL!');
    global.connection = connection;
    return global.connection;
}
```

Atenção: o padrão de `port` muda de 3306 para **3307** (porta do container no host).

- [ ] **Step 3: Tratar falha de conexão no load do módulo**

Substituir a linha `connectDB();` (final do arquivo, antes do `module.exports`) por:

```js
connectDB().catch((err) => {
    console.error(`Não foi possível conectar ao banco em ${DB_CONFIG.host}:${DB_CONFIG.port} (${err.message}).`);
    console.error('Verifique se o container está rodando: docker compose up -d');
});
```

Hoje essa chamada sem `.catch` derruba o processo com unhandled rejection quando o banco está fora.

- [ ] **Step 4: Rodar a suíte para confirmar que nada quebrou**

Run: `npm test`
Expected: PASS, mesmo resultado da linha de base (os testes mockam `banco.js`, então isso valida que `app.js`/rotas não foram afetados).

- [ ] **Step 5: Commit**

```bash
git add banco.js
git commit -m "feat: conexão do banco configurável por variáveis de ambiente"
```

---

### Task 3: .env.example e script start com --env-file

**Files:**
- Create: `.env.example`
- Modify: `package.json` (script `start`)
- Modify: `.gitignore` (garantir que `.env` está ignorado)

- [ ] **Step 1: Criar `.env.example`**

```bash
# Conexão com o banco — os padrões abaixo já apontam para o container Docker,
# então o .env só é necessário se você quiser sobrescrever algo.
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=podwave
```

- [ ] **Step 2: Atualizar o script `start` no `package.json`**

De:
```json
"start": "nodemon ./bin/www",
```
Para:
```json
"start": "nodemon -- --env-file-if-exists=.env ./bin/www",
```

`--env-file-if-exists` é flag nativa do Node ≥ 22.9 (instalado: 22.19); o `--` faz o nodemon repassá-la ao node. Não adicionar dependência `dotenv`.

- [ ] **Step 3: Verificar que o app sobe com o novo script (sem banco, só boot)**

Run: `timeout 8 npm start; true` e observar a saída.
Expected: nodemon inicia sem erro de flag desconhecida; aparece a mensagem amigável de banco indisponível (Task 2 Step 3) se o container não estiver de pé — **não** um stack trace de unhandled rejection.
Fallback se o nodemon não aceitar a flag: reverter para `"start": "nodemon ./bin/www"` — os padrões do `banco.js` já apontam para o container, então `.env` é opcional. Nesse caso, registrar no README que o `.env` não é carregado automaticamente.

- [ ] **Step 4: Garantir `.env` no `.gitignore`**

Conferir se existe `.gitignore` com entrada `.env`; se não houver, adicionar a linha `.env`.

- [ ] **Step 5: Commit**

```bash
git add .env.example package.json .gitignore
git commit -m "feat: .env.example e carga de .env via node --env-file"
```

---

### Task 4: README

**Files:**
- Modify: `README.md` (seções Pré-requisitos, Instalação e Como Executar; badge XAMPP)

- [ ] **Step 1: Substituir badge e pré-requisitos**

Trocar a linha do badge `![XAMPP](https://img.shields.io/badge/XAMPP-Compatible-orange)` por `![Docker](https://img.shields.io/badge/Docker-Compose-blue)` e a seção de pré-requisitos por:

```markdown
## Pré-requisitos

- Node.js versão 18 ou superior
- Docker com Docker Compose (no Windows, Docker Desktop com integração WSL ativada)
- Git instalado na máquina
```

- [ ] **Step 2: Substituir a seção Instalação (passos do XAMPP) por**

```markdown
## Instalação

1. Clone o repositório do projeto:

```bash
git clone https://github.com/seu-usuario/podwave.git
cd podwave
```

2. Instale todas as dependências do projeto:

`npm install`

3. Suba o banco de dados (MariaDB em Docker):

`docker compose up -d`

Na primeira execução o container cria o banco `podwave` e importa
automaticamente o `podwavebackupfinal.sql` (schema + dados de teste).
O banco fica disponível em `localhost:3307`.

> Para configurar a conexão (host, porta, usuário...), copie `.env.example`
> para `.env` e ajuste — os padrões já apontam para o container.
```

(Manter a seção "Como Executar" com `npm start` e a URL `http://localhost:3000`; manter "Credenciais para Teste".)

- [ ] **Step 3: Revisar o README renderizado**

Conferir que não sobrou nenhuma menção a XAMPP/`mysql -u root` e que os blocos de código fecharam corretamente.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README com setup do banco via Docker"
```

---

### Task 5: Validação ponta a ponta

**Files:** nenhum (somente execução). Requer Docker disponível no WSL.

- [ ] **Step 1: Subir o banco**

Run: `docker compose up -d && docker compose ps`
Expected: serviço `db` em execução; aguardar status `healthy` (até ~60s na primeira vez, por causa da importação).

- [ ] **Step 2: Conferir a importação**

(Não há cliente mysql no WSL; usar o mysql2 do projeto.)

Run:
```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({ host: 'localhost', port: 3307, user: 'root', password: '', database: 'podwave' });
  const [t] = await c.query('SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = \"podwave\"');
  const [u] = await c.query('SELECT usuemail FROM usuarios ORDER BY usucodigo');
  console.log('tabelas:', t[0].n, '| usuarios:', u.map(r => r.usuemail).join(', '));
  await c.end();
})()"
```
Expected: contagem de tabelas > 0 e lista de usuários incluindo `gustavo@gmail.com` e `joao@gmail.com`.

- [ ] **Step 3: Suíte de testes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Smoke test do app**

Run: `npm start` em background; depois:
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'email=gustavo@gmail.com&password=123'
```
Expected: `200` na home; `200` ou `302` (redirect pós-login) no POST de login — confirmar no log do servidor a mensagem `Conectou ao MySQL!`. Encerrar o `npm start` ao final.

- [ ] **Step 5: Teste de persistência e reimportação**

Run: `docker compose down && docker compose up -d` (sem `-v`)
Expected: dados persistem (repetir Step 2). Observação: `docker compose down -v` apaga o volume e força reimportação do dump — documentar esse comando na resposta final ao usuário como "reset do banco".

- [ ] **Step 6: Commit final (se algo foi ajustado na validação)**

```bash
git status --short  # commitar apenas ajustes decorrentes da validação, se houver
```
