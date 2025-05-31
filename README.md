# PodWave - Plataforma de Podcasts

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)  

![XAMPP](https://img.shields.io/badge/XAMPP-Compatible-orange)

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
- Listagem dinâmica de podcasts do banco de dados MySQL/MariaDB (XAMPP).
- Autenticação de usuário com login e redirecionamento.
- Gerenciamento de favoritos, avaliações, comentários e progresso de reprodução.

## Pré-requisitos

- Node.js versão 18 ou superior

- XAMPP com módulo MySQL ativo

- Git instalado na máquina

## Instalação

1\. Clone o repositório do projeto:

```bash
git clone https://github.com/seu-usuario/podwave.git  
cd podwave
```

2\. Instale todas as dependências do projeto:

`npm install`

3\. Configure o ambiente:

- Vá até a pasta onde está instalado o XAMPP e cole o arquivo `podwavebackup.sql`

- Inicie o serviço MySQL através do XAMPP Control Panel

- Clique em "Shell"

- No shell aberto, execute:

````
mysql -u root
````
- Após inicializar o banco de dados crie o banco `podwave`:

````
CREATE DATABASE podwave;
````

- Saia do banco digitando o comando:
````
quit
````

- Ainda no shell do XAMPP digite o comando abaixo para importar os dados do arquivo `podwavebackup.sql`:

````
mysql -u root podwave < podwavebackup.sql
````

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
