# PodWave - Plataforma de Podcasts

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)  

![Docker](https://img.shields.io/badge/Docker-Compose-blue)

Integrantes:

Gustavo Vinicius Taques

## Sobre o Podwave

O **Podwave** é uma plataforma web para explorar e descobrir podcasts, com backend Node.js, banco de dados MySQL/MariaDB e interface responsiva estilizada com Tailwind CSS.

## Funcionalidades
- Exploração de podcasts em grid responsivo (1 coluna em telas pequenas, 2 em telas médias, 3 em telas grandes).
- Menu de usuário com opções de perfil, gerenciamento de podcasts e logout.
- Design responsivo para dispositivos móveis, tablets e desktops.
- Navegação com links para "Sobre Nós", "Fale Conosco" e "Nossos Podcasts".
- Integração com redes sociais (Facebook, X, LinkedIn, YouTube).
- Listagem dinâmica de podcasts do banco de dados MySQL/MariaDB (Docker).
- Autenticação de usuário com login e redirecionamento.
- Gerenciamento de favoritos, avaliações, comentários e progresso de reprodução.

## Pré-requisitos

- Node.js versão 18 ou superior
- Docker com Docker Compose (no Windows, Docker Desktop com integração WSL ativada)
- Git instalado na máquina

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

## Como Executar

Inicie o servidor Node.js com:

`npm start`

Acesse a aplicação no navegador através de:

http://localhost:3000

## Credenciais para Teste

**Acesso Administrativo:**  

Email: gustavo@gmail.com  

Senha: 123

**Usuário Comum:**  

Email: joao@gmail.com  

Senha: 123

## Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo LICENSE para obter detalhes.
