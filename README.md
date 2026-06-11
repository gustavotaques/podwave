# PodWave — Plataforma de Podcasts

![Node.js](https://img.shields.io/badge/Node.js-22%2B-green) ![Express](https://img.shields.io/badge/Express-4-black) ![MariaDB](https://img.shields.io/badge/MariaDB-Docker-blue)

O **PodWave** é uma plataforma web para explorar, ouvir e interagir com podcasts. Backend em Node.js/Express, banco MariaDB em Docker e interface responsiva com Tailwind CSS.

## Funcionalidades

- Exploração de podcasts com filtro por categoria
- Reprodução de episódios com streaming de áudio e salvamento de progresso
- Cadastro e login de usuários
- Gerenciamento dos próprios podcasts e episódios (criar, editar, excluir), com verificação de dono
- Comentários, avaliações (1 a 5) e favoritos por episódio
- Interface responsiva para celular, tablet e desktop

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22, Express 4 |
| Views | EJS + Tailwind CSS |
| Banco de dados | MariaDB (Docker), driver mysql2 |
| Testes | Jest + Supertest |

## Como rodar

Pré-requisitos: **Node.js 22.9+** (o start usa a flag `--env-file-if-exists`), **Docker com Docker Compose** (no Windows, Docker Desktop com integração WSL ativada) e **Git**.

```bash
# 1. Clone o repositório
git clone https://github.com/gustavotaques/podwave.git
cd podwave

# 2. Instale as dependências
npm install

# 3. Suba o banco de dados (MariaDB em Docker)
docker compose up -d

# 4. Inicie a aplicação
npm start
```

Acesse em **http://localhost:3000**.

> Para sobrescrever a configuração de conexão (host, porta, usuário...), copie
> `.env.example` para `.env` e ajuste — os padrões já apontam para o container.

## Banco de dados

Na primeira subida, o container `podwave-db` cria o banco `podwave` e importa automaticamente o `podwavebackupfinal.sql` (schema + dados de teste). O banco fica em `localhost:3307` — porta 3307 porque a 3306 costuma estar ocupada por uma instalação local de MySQL no Windows.

Os dados persistem em um volume Docker entre reinicializações. Para **resetar o banco** (apagar tudo e reimportar o dump):

```bash
docker compose down -v && docker compose up -d
```

## Credenciais para teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | gustavo@gmail.com | 123 |
| Usuário comum | joao@gmail.com | 123 |

## Testes

```bash
npm test
```

A suíte (Jest + Supertest) cobre cadastro, login, exploração, comentários e o CRUD de podcasts/episódios com regras de autorização. O relatório HTML é gerado em `relatorio-testes/teste.html`. Para cobertura: `npm run coverage`.

## Licença e autor

Projeto acadêmico sob licença MIT.

Desenvolvido por **Gustavo Vinicius Taques**.
