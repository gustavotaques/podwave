# N3E1 — ESLint no Podwave: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar ESLint no projeto Podwave, corrigir os problemas encontrados e gerar o relatório completo `docs/relatorio-eslint.md` pronto para conversão em PDF.

**Architecture:** Frente técnica (tag → install → run → fix → tag) executada primeiro, seguida de frente documental (relatório Markdown gerado com dados reais da execução). Estado "antes" preservado via tag git `eslint-antes`; estado "depois" via tag `eslint-depois`. Todas as capturas de tela são marcadas no relatório para inserção manual pelo aluno.

**Tech Stack:** Node.js 18+ (ESM, `"type": "module"`), ESLint v9 (flat config), Markdown

## Global Constraints

- ESLint v9+ — usar flat config (`eslint.config.js`), não `.eslintrc`
- Projeto ESM: `eslint.config.js` usa `import`/`export`
- Lint apenas em `src/` — excluir `tests/`, `public/`, `relatorio-testes/`, `docs/`
- As 10 regras acordadas: `no-console warn`, `eqeqeq error`, `semi error always`, `quotes error single`, `indent error 2`, `no-unused-vars warn`, `no-var error`, `prefer-const error`, `curly error`, `no-trailing-spaces error`
- Relatório em português, mínimo 8 páginas em PDF
- Screenshots marcados como `> 📸 SCREENSHOT: [descrição]` no relatório

---

### Task 1: Setup — tag git + instalar ESLint + criar eslint.config.js

**Files:**
- Create: `eslint.config.js` (raiz)
- Modify: `package.json` e `package-lock.json` (via npm)

**Interfaces:**
- Produces: `eslint.config.js` com 10 regras; tag git `eslint-antes`

- [ ] **Step 1: Marcar estado "antes"**

```bash
git tag eslint-antes
```

Confirmar: `git tag` deve listar `eslint-antes`.

- [ ] **Step 2: Instalar ESLint**

```bash
npm install eslint --save-dev
```

Saída esperada: `added N packages` sem erros. O `@eslint/js` é incluído automaticamente com ESLint v9.

- [ ] **Step 3: Criar eslint.config.js na raiz**

```js
import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'tests/**',
      'public/**',
      'relatorio-testes/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console':        'warn',
      'eqeqeq':            'error',
      'semi':              ['error', 'always'],
      'quotes':            ['error', 'single'],
      'indent':            ['error', 2],
      'no-unused-vars':    'warn',
      'no-var':            'error',
      'prefer-const':      'error',
      'curly':             'error',
      'no-trailing-spaces':'error',
    },
  },
];
```

- [ ] **Step 4: Verificar que o ESLint é executável**

```bash
npx eslint --version
```

Saída esperada: `v9.x.x`

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js package.json package-lock.json
git commit -m "build: instala ESLint v9 e cria eslint.config.js"
```

---

### Task 2: Executar ESLint e capturar saída "antes"

**Files:**
- Create: `docs/eslint-output-antes.txt`

**Interfaces:**
- Consumes: `eslint.config.js` da Task 1
- Produces: `docs/eslint-output-antes.txt` com saída completa; contagens de erros e warnings para o relatório

- [ ] **Step 1: Executar ESLint e salvar resultado**

```bash
npx eslint src/ 2>&1 | tee docs/eslint-output-antes.txt
```

A saída esperada incluirá linhas como:
```
/home/…/src/app.js
  17:5  error  Expected indentation of 2 spaces but found 4  indent
  18:5  error  Expected indentation of 2 spaces but found 4  indent
  …

/home/…/src/controllers/auth.controller.js
  20:9  warning  Unexpected console statement  no-console
  …

✖ NNN problems (XXX errors, YY warnings)
  ZZZ errors and 0 warnings potentially fixable with the `--fix` option.
```

- [ ] **Step 2: Anotar contagens para o relatório**

```bash
tail -3 docs/eslint-output-antes.txt
```

Registrar os valores de: total de problemas, total de erros, total de warnings, quantos são auto-fixáveis.

- [ ] **Step 3: Listar regras com mais ocorrências**

```bash
grep -oE '\b(indent|no-console|semi|quotes|no-unused-vars|no-var|prefer-const|curly|eqeqeq|no-trailing-spaces)\b' docs/eslint-output-antes.txt | sort | uniq -c | sort -rn
```

- [ ] **Step 4: Commit**

```bash
git add docs/eslint-output-antes.txt
git commit -m "docs: captura saída ESLint antes das correções"
```

---

### Task 3: Correção automática com --fix

**Files:**
- Modify: todos os `.js` em `src/` com violações auto-fixáveis (principalmente indentação)
- Create: `docs/eslint-output-apos-fix.txt`

**Interfaces:**
- Consumes: código em `src/`, `eslint.config.js`
- Produces: código com indentação corrigida para 2 espaços; `docs/eslint-output-apos-fix.txt` mostrando apenas o que restou

- [ ] **Step 1: Executar correção automática**

```bash
npx eslint src/ --fix
```

- [ ] **Step 2: Capturar o que restou após o fix**

```bash
npx eslint src/ 2>&1 | tee docs/eslint-output-apos-fix.txt
```

O que deve restar: apenas warnings de `no-console` (não são auto-fixáveis).

- [ ] **Step 3: Inspecionar o diff para confirmar as correções**

```bash
git diff src/
```

A maior mudança visível será a indentação: cada bloco de 4 espaços → 2 espaços em todos os arquivos de `src/`.

- [ ] **Step 4: Commit**

```bash
git add src/ docs/eslint-output-apos-fix.txt
git commit -m "fix: correção automática de indentação via eslint --fix"
```

---

### Task 4: Correções manuais — suprimir no-console com comentário deliberado

**Files:**
- Modify: `src/server.js`, `src/controllers/auth.controller.js`, `src/controllers/episodios.controller.js`, `src/controllers/listas.controller.js`, `src/controllers/meusPodcasts.controller.js`, `src/controllers/meusEpisodios.controller.js`, `src/repositories/podcasts.repository.js`, `src/repositories/episodios.repository.js`

**Interfaces:**
- Consumes: `docs/eslint-output-apos-fix.txt` (lista de warnings restantes)
- Produces: código sem nenhum erro ou warning ESLint; cada `console.*` precedido de `// eslint-disable-next-line no-console`

Estratégia: `console.error` é intencional para logging de erros em produção. A decisão é suprimir o warning com comentário explícito em cada ocorrência, documentando a justificativa no relatório (Parte 7).

- [ ] **Step 1: Adicionar disable comment antes de cada console.* em src/server.js**

Abrir `src/server.js`. Para cada linha com `console.log` ou `console.error`, adicionar na linha imediatamente anterior:
```js
// eslint-disable-next-line no-console
```

Exemplo — antes:
```js
pool.getConnection((err) => {
    if (err) {
        console.error(`Não foi possível conectar ao banco (${err.message}).`);
        console.error('Verifique se o container está rodando: docker compose up -d');
    } else {
        console.log('Conectou ao MySQL!');
    }
});
```

Depois:
```js
pool.getConnection((err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`Não foi possível conectar ao banco (${err.message}).`);
    // eslint-disable-next-line no-console
    console.error('Verifique se o container está rodando: docker compose up -d');
  } else {
    // eslint-disable-next-line no-console
    console.log('Conectou ao MySQL!');
  }
});
```

- [ ] **Step 2: Adicionar disable comment antes de cada console.error nos controllers**

Fazer o mesmo processo nos arquivos:
- `src/controllers/auth.controller.js` — 1 ocorrência (linha ~20)
- `src/controllers/episodios.controller.js` — 7 ocorrências
- `src/controllers/listas.controller.js` — 1 ocorrência
- `src/controllers/meusPodcasts.controller.js` — 5 ocorrências
- `src/controllers/meusEpisodios.controller.js` — 6 ocorrências

Modelo para cada ocorrência:
```js
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao fazer login:', err);
      return res.redirect('/login?erro=1');
    }
```

- [ ] **Step 3: Adicionar disable comment nos repositories**

Arquivos:
- `src/repositories/podcasts.repository.js` — 4 ocorrências
- `src/repositories/episodios.repository.js` — 1 ocorrência

- [ ] **Step 4: Verificar zero problemas**

```bash
npx eslint src/
```

Saída esperada: nenhuma saída (zero erros, zero warnings).

Se houver problemas remanescentes, ler a mensagem de erro e corrigir linha a linha até limpar.

- [ ] **Step 5: Commit e tag "depois"**

```bash
git add src/
git commit -m "fix: suprime no-console com disable-next-line (logging intencional)"
git tag eslint-depois
```

---

### Task 5: Gerar relatório completo

**Files:**
- Create: `docs/relatorio-eslint.md`

**Interfaces:**
- Consumes: `docs/eslint-output-antes.txt`, `docs/eslint-output-apos-fix.txt`, diff real entre `eslint-antes` e `eslint-depois`
- Produces: `docs/relatorio-eslint.md` com todas as 7 partes prontas para conversão em PDF

- [ ] **Step 1: Obter dados reais para preencher o relatório**

```bash
# contagens finais
tail -5 docs/eslint-output-antes.txt

# diff resumido antes vs depois
git diff eslint-antes eslint-depois -- src/ --stat

# exemplos de indent corrigido (para Parte 6)
git diff eslint-antes eslint-depois -- src/controllers/auth.controller.js | head -60

# exemplos de no-console suprimido
git diff eslint-antes eslint-depois -- src/controllers/meusPodcasts.controller.js | head -40
```

- [ ] **Step 2: Criar docs/relatorio-eslint.md com o conteúdo completo**

Escrever o arquivo com o seguinte conteúdo (substituir `[NNN]`, `[XXX]`, `[YY]` pelos valores reais obtidos no step anterior):

````markdown
# Relatório — Análise de Qualidade de Código com ESLint

**Disciplina:** Qualidade de Software  
**Aluno:** Gustavo Taques  
**Data:** 2026-06-17

---

## Parte 1 — Descrição da Aplicação

### Projeto: Podwave

O **Podwave** é um sistema web de gerenciamento de podcasts desenvolvido com Node.js e o framework Express. A aplicação permite que usuários se cadastrem, façam login, gerenciem seus próprios podcasts e episódios, explorem o catálogo geral e organizem conteúdos em listas de reprodução.

### Tecnologias utilizadas

- **Runtime:** Node.js com módulos ECMAScript (ESM)
- **Framework web:** Express 4
- **Banco de dados:** MySQL 8 (via mysql2 e pool de conexões)
- **Autenticação:** express-session + bcrypt para hash de senhas
- **Template engine:** EJS
- **Estilo:** Tailwind CSS

### Estrutura de arquivos (src/)

```
src/
├── app.js                          # configuração do Express e middlewares
├── server.js                       # inicialização do servidor HTTP
├── config/
│   └── database.js                 # pool de conexões MySQL
├── controllers/
│   ├── auth.controller.js          # login, signup, logout
│   ├── episodios.controller.js     # listagem, detalhe, comentários, avaliações
│   ├── home.controller.js          # página inicial
│   ├── listas.controller.js        # listagem de podcasts por categoria
│   ├── meusEpisodios.controller.js # CRUD de episódios do usuário
│   └── meusPodcasts.controller.js  # CRUD de podcasts do usuário
├── middlewares/
│   └── auth.js                     # proteção de rotas autenticadas
├── repositories/
│   ├── avaliacoes.repository.js
│   ├── comentarios.repository.js
│   ├── episodios.repository.js
│   ├── favoritos.repository.js
│   ├── podcasts.repository.js
│   ├── progresso.repository.js
│   └── usuarios.repository.js
└── routes/
    ├── index.js
    ├── auth.routes.js
    ├── episodios.routes.js
    ├── home.routes.js
    ├── listas.routes.js
    ├── meusEpisodios.routes.js
    └── meusPodcasts.routes.js
```

**Totais:** 24 arquivos JavaScript · ~1.100 linhas de código · 7 entidades de dados.

A aplicação satisfaz todos os requisitos mínimos da Parte 1: mais de 5 arquivos-fonte, mais de 300 linhas de código, uso de funções, condicionais, estruturas de repetição (em queries SQL via array `map`/`forEach`), módulos ESM e interação com banco de dados MySQL.

---

## Parte 2 — Estudo da Ferramenta

### 2.1 O que é o ESLint

**Definição:**  
ESLint é uma ferramenta de análise estática de código-fonte para JavaScript e TypeScript. Ela examina o código sem executá-lo, verificando-o contra um conjunto de regras configuráveis que identificam erros, más práticas e inconsistências de estilo.

**Objetivo:**  
O objetivo principal do ESLint é aumentar a qualidade e a consistência do código-fonte, detectando problemas antes da execução do programa. Ele ajuda times de desenvolvimento a manter padrões uniformes independentemente do número de colaboradores.

**Histórico:**  
O ESLint foi criado por Nicholas C. Zakas em 2013 como uma alternativa mais flexível às ferramentas existentes JSLint e JSHint. Sua arquitetura baseada em plugins e regras configuráveis impulsionou sua adoção massiva. Em 2019, o suporte oficial a TypeScript foi consolidado com o projeto `@typescript-eslint`. Em 2023, a versão 9 introduziu o sistema de configuração plana (*flat config*) com o arquivo `eslint.config.js`, que substitui os formatos legados `.eslintrc.*`. Hoje o ESLint é um dos projetos de código aberto com maior número de downloads no registro npm, com bilhões de instalações semanais.

**Contexto de utilização:**  
O ESLint é utilizado em praticamente todos os projetos JavaScript profissionais modernos. Está integrado a editores como VS Code e JetBrains, a frameworks como React, Vue, Angular e Next.js, e a pipelines de integração contínua (GitHub Actions, GitLab CI, Jenkins). É comum que projetos rejeitem automaticamente commits com erros ESLint via *git hooks* (husky + lint-staged).

---

### 2.2 O que é Análise Estática

**Conceito:**  
A análise estática é uma técnica de verificação de software que examina o código-fonte sem executá-lo. A ferramenta constrói uma representação interna do programa — tipicamente uma Árvore Sintática Abstrata (AST) — e aplica regras sobre sua estrutura para identificar problemas.

**Diferenças entre análise estática e testes:**

| Aspecto | Análise Estática | Testes Automatizados |
|---|---|---|
| Execução do código | Não executa | Executa |
| Momento de uso | Escrita do código | Após implementação |
| O que detecta | Estilo, padrões, bad smells | Comportamento, regressões |
| Cobertura | Todo o código analisado | Limitada aos casos de teste |
| Velocidade | Muito rápida (ms) | Mais lenta (segundos a minutos) |
| Falsos positivos | Possíveis | Raros |

**Vantagens:**
- Detecção de problemas antes da execução
- Custo computacional baixíssimo
- Cobertura automática de 100% do código analisado
- Facilidade de integração com editores e CI/CD
- Feedback imediato ao desenvolvedor

**Limitações:**
- Não detecta erros de lógica complexa nem falhas de integração
- Pode gerar falsos positivos que exigem configuração
- Não substitui testes funcionais ou de integração
- A qualidade da análise depende da qualidade das regras configuradas

---

### 2.3 Aplicações do ESLint

**Padronização de código:**  
O ESLint garante que todo o time use o mesmo estilo: indentação, uso de aspas, ponto-e-vírgula, comprimento de linhas. Isso elimina debates subjetivos de estilo em *code reviews*.

**Identificação de erros:**  
Regras como `no-unused-vars`, `no-undef` e `eqeqeq` detectam variáveis declaradas mas nunca usadas, referências a variáveis inexistentes e comparações frágeis com `==`.

**Manutenção:**  
Código padronizado e sem *dead code* é mais fácil de entender, modificar e passar para outros desenvolvedores.

**Qualidade:**  
O ESLint promove boas práticas de JavaScript moderno: `prefer-const`, `no-var`, `curly`. Essas regras guiam o desenvolvedor em direção a código mais seguro e previsível.

**Trabalho em equipe:**  
Com as mesmas regras configuradas no repositório, todos os membros escrevem código no mesmo padrão. O *code review* pode focar em lógica em vez de estilo.

**Integração contínua:**  
O ESLint é frequentemente adicionado como etapa obrigatória no pipeline de CI: se houver erros, o *merge* é bloqueado. Isso garante que código problemático nunca chegue à branch principal.

---

## Parte 3 — Instalação e Configuração

### 3.1 Instalação

A instalação foi realizada como dependência de desenvolvimento:

```bash
npm install eslint --save-dev
```

> 📸 SCREENSHOT: terminal após execução do npm install — mostrar que o pacote foi instalado sem erros

Versão instalada (verificação):

```bash
npx eslint --version
```

> 📸 SCREENSHOT: saída do comando acima mostrando a versão do ESLint

### 3.2 Inicialização

O ESLint v9 usa *flat config*. Em vez de executar `npx eslint --init` (que gera configuração no formato legado), o arquivo `eslint.config.js` foi criado manualmente para controle total das regras.

### 3.3 Configuração

O arquivo `eslint.config.js` criado na raiz do projeto:

```js
import js from '@eslint/js';

export default [
  {
    ignores: [
      'node_modules/**',
      'tests/**',
      'public/**',
      'relatorio-testes/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      'no-console':         'warn',
      'eqeqeq':             'error',
      'semi':               ['error', 'always'],
      'quotes':             ['error', 'single'],
      'indent':             ['error', 2],
      'no-unused-vars':     'warn',
      'no-var':             'error',
      'prefer-const':       'error',
      'curly':              'error',
      'no-trailing-spaces': 'error',
    },
  },
];
```

**Regras escolhidas e justificativas:**

| Regra | Nível | Justificativa |
|---|---|---|
| `no-console` | warn | `console.*` esquecido em produção polui logs |
| `eqeqeq` | error | `==` realiza coerção de tipo implícita e causa bugs sutis |
| `semi` | error (always) | Inserção automática de ponto-e-vírgula (ASI) pode surpreender |
| `quotes` | error (single) | Padroniza aspas; single é convenção do projeto |
| `indent` | error (2 espaços) | Legibilidade; 2 espaços é padrão amplamente adotado em JS |
| `no-unused-vars` | warn | Variáveis mortas são débito técnico e confundem leitores |
| `no-var` | error | `var` tem escopo de função, gerando bugs de hoisting |
| `prefer-const` | error | Deixa explícito quando uma variável não muda |
| `curly` | error | Omitir `{}` em `if`/`for`/`while` causa bugs ao adicionar linhas |
| `no-trailing-spaces` | error | Espaços no final de linha geram ruído em diffs do git |

> 📸 SCREENSHOT: arquivo eslint.config.js aberto no editor

**Estilo adotado:** aspas simples e 2 espaços de indentação, refletindo a convenção já predominante no projeto.

---

## Parte 4 — Execução da Ferramenta

O ESLint foi executado sobre todos os arquivos JavaScript do diretório `src/`:

```bash
npx eslint src/
```

> 📸 SCREENSHOT: terminal mostrando o início da saída do npx eslint src/ (primeiros problemas listados)

### Resultado

```
[COLAR AQUI O CONTEÚDO DE docs/eslint-output-antes.txt]
```

> 📸 SCREENSHOT: terminal mostrando o final da saída com o totalizador de erros e warnings

### Resumo dos problemas encontrados

| Métrica | Valor |
|---|---|
| Total de problemas | [NNN] |
| Erros (error) | [XXX] |
| Avisos (warning) | [YY] |
| Auto-fixáveis | [ZZZ] |

### Principais categorias

| Regra | Ocorrências | Tipo |
|---|---|---|
| `indent` | [N1] | error |
| `no-console` | [N2] | warning |
| [demais regras com ocorrências] | [N] | [tipo] |

A regra com maior número de ocorrências foi `indent`, pois o projeto adotava 4 espaços de indentação e a configuração exige 2. Todas as ocorrências de `indent` são corrigíveis automaticamente com `--fix`.

---

## Parte 5 — Correção Automática

O ESLint oferece o flag `--fix` para corrigir automaticamente os problemas que permitem correção sem ambiguidade:

```bash
npx eslint src/ --fix
```

> 📸 SCREENSHOT: terminal após execução do --fix (idealmente sem saída ou com saída mínima)

### Verificação após o fix

```bash
npx eslint src/
```

> 📸 SCREENSHOT: terminal mostrando o resultado após o fix — apenas warnings de no-console restantes

```
[COLAR AQUI O CONTEÚDO DE docs/eslint-output-apos-fix.txt]
```

### Problemas corrigidos automaticamente

A correção automática resolveu todos os erros de `indent`: cada bloco de código teve sua indentação ajustada de 4 espaços para 2 espaços. Esse é o tipo de correção mais adequado para automação — mecânica, sem ambiguidade semântica.

### Problemas que precisaram de intervenção manual

Os warnings de `no-console` não são corrigidos automaticamente porque o ESLint não sabe se a intenção é remover o `console.*` ou mantê-lo intencionalmente. Para cada ocorrência, foi necessária uma decisão manual:

Optou-se por manter os `console.error` e `console.log` existentes, pois são parte deliberada do mecanismo de logging da aplicação em ambiente de desenvolvimento e servidor. Cada ocorrência foi suprimida com o comentário padrão do ESLint:

```js
// eslint-disable-next-line no-console
console.error('Mensagem de erro:', err);
```

Esse comentário sinaliza explicitamente que a exceção à regra é **intencional**, documentada e revisada pelo desenvolvedor — ao contrário de simplesmente remover a regra da configuração.

### Limitações da correção automática

- O `--fix` não cria lógica: não sabe como substituir `console.log` por um logger adequado
- Não resolve `no-unused-vars`: remover uma variável pode quebrar código em outros arquivos
- Não resolve ambiguidades de formatação em casos complexos (desestruturação, ternários aninhados)

---

## Parte 6 — Comparação Antes e Depois

A seguir, 10 exemplos de correções realizadas durante o processo de análise.

---

### Exemplo 1 — Indentação em middleware (`src/app.js`)

**Regra:** `indent` (2 espaços)  
**Categoria:** Estilo / auto-fixável

**Antes:**
```js
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});
```

**Depois:**
```js
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  next();
});
```

**Explicação:** O callback do middleware usava 4 espaços de indentação, violando a regra `indent: 2`. A correção foi feita automaticamente com `--fix`. O benefício é a uniformidade visual com o restante do código e conformidade com o padrão adotado no projeto.

---

### Exemplo 2 — Indentação em função assíncrona (`src/controllers/auth.controller.js`)

**Regra:** `indent` (2 espaços)  
**Categoria:** Estilo / auto-fixável

**Antes:**
```js
export async function efetuarLogin(req, res) {
    const { email, password } = req.body;
    try {
        const usuario = await buscarUsuario({ email, password });
        if (!usuario) {
            return res.redirect('/login?erro=1');
        }
        req.session.usuario = { codigo: usuario.usucodigo, email: usuario.usuemail };
        return res.redirect('/listas');
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        return res.redirect('/login?erro=1');
    }
}
```

**Depois:**
```js
export async function efetuarLogin(req, res) {
  const { email, password } = req.body;
  try {
    const usuario = await buscarUsuario({ email, password });
    if (!usuario) {
      return res.redirect('/login?erro=1');
    }
    req.session.usuario = { codigo: usuario.usucodigo, email: usuario.usuemail };
    return res.redirect('/listas');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao fazer login:', err);
    return res.redirect('/login?erro=1');
  }
}
```

**Explicação:** A função usava 4 espaços em todos os níveis. A regra `indent: 2` exige 2 espaços por nível. Toda a hierarquia de indentação foi corrigida automaticamente. Neste exemplo também foi aplicada a supressão de `no-console` manualmente.

---

### Exemplo 3 — Indentação em bloco try/catch de repository (`src/repositories/podcasts.repository.js`)

**Regra:** `indent` (2 espaços)  
**Categoria:** Estilo / auto-fixável

**Antes:**
```js
export async function buscarPodcastsPorUsuario(usucodigo) {
    try {
        const [rows] = await pool.query(
            'SELECT p.podcodigo, p.podnome FROM podcasts p WHERE p.usucodigo = ?',
            [usucodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar podcasts por usuário:', err);
        return [];
    }
}
```

**Depois:**
```js
export async function buscarPodcastsPorUsuario(usucodigo) {
  try {
    const [rows] = await pool.query(
      'SELECT p.podcodigo, p.podnome FROM podcasts p WHERE p.usucodigo = ?',
      [usucodigo]
    );
    return rows;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar podcasts por usuário:', err);
    return [];
  }
}
```

**Explicação:** A regra `indent` é aplicada uniformemente a funções, blocos `try/catch` e argumentos de chamadas de função. O `--fix` ajustou cada linha automaticamente, incluindo os argumentos do `pool.query`.

---

### Exemplo 4 — Indentação em handler de erro do Express (`src/app.js`)

**Regra:** `indent` (2 espaços)  
**Categoria:** Estilo / auto-fixável

**Antes:**
```js
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});
```

**Depois:**
```js
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
```

**Explicação:** Mesmo em callbacks de 4 parâmetros (error handler do Express), a regra `indent` se aplica igualmente. Corrigido automaticamente.

---

### Exemplo 5 — Indentação em condicional aninhado (`src/controllers/meusPodcasts.controller.js`)

**Regra:** `indent` (2 espaços)  
**Categoria:** Estilo / auto-fixável

**Antes:**
```js
export async function exibirEdicaoPodcast(req, res) {
    const usuario = req.session.usuario;
    try {
        const podcast = await buscarPodcastPorId(req.params.podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect('/meusPodcasts');
        }
        const categorias = await buscarCategorias();
        res.render('editar-podcast', { title: 'Podwave - Editar Podcast', podcast, categorias });
    } catch (err) {
        console.error('Erro ao carregar edição de podcast:', err);
        res.redirect('/meusPodcasts');
    }
}
```

**Depois:**
```js
export async function exibirEdicaoPodcast(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcast = await buscarPodcastPorId(req.params.podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect('/meusPodcasts');
    }
    const categorias = await buscarCategorias();
    res.render('editar-podcast', { title: 'Podwave - Editar Podcast', podcast, categorias });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar edição de podcast:', err);
    res.redirect('/meusPodcasts');
  }
}
```

**Explicação:** O condicional dentro do `try` tinha 3 níveis de indentação (função → try → if). Com 4 espaços por nível, o `return` ficaria em 12 espaços; com 2 espaços, fica em 6 — mais legível e econômico.

---

### Exemplo 6 — Supressão de no-console em logging de servidor (`src/server.js`)

**Regra:** `no-console` (warning)  
**Categoria:** Boas práticas / intervenção manual

**Antes:**
```js
pool.getConnection((err) => {
  if (err) {
    console.error(`Não foi possível conectar ao banco (${err.message}).`);
    console.error('Verifique se o container está rodando: docker compose up -d');
  } else {
    console.log('Conectou ao MySQL!');
  }
});
```

**Depois:**
```js
pool.getConnection((err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`Não foi possível conectar ao banco (${err.message}).`);
    // eslint-disable-next-line no-console
    console.error('Verifique se o container está rodando: docker compose up -d');
  } else {
    // eslint-disable-next-line no-console
    console.log('Conectou ao MySQL!');
  }
});
```

**Explicação:** Em `server.js`, o `console.log` e `console.error` são usados para indicar se o servidor conectou ao banco ou não ao iniciar. Essa é uma utilização legítima e intencional de `console`, não um log esquecido. O comentário de supressão documenta essa decisão explicitamente.

---

### Exemplo 7 — Supressão de no-console em tratamento de erro de controller (`src/controllers/episodios.controller.js`)

**Regra:** `no-console` (warning)  
**Categoria:** Boas práticas / intervenção manual

**Antes:**
```js
  } catch (err) {
    console.error('Erro ao carregar episódios:', err);
    res.render('episodios', { title: 'PodWave - Episódios', episodios: [], podnome: `Podcast #${podcodigo}` });
  }
```

**Depois:**
```js
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar episódios:', err);
    res.render('episodios', { title: 'PodWave - Episódios', episodios: [], podnome: `Podcast #${podcodigo}` });
  }
```

**Explicação:** O `console.error` nos blocos `catch` dos controllers serve para registrar erros em tempo de desenvolvimento. É uma prática comum em APIs Express antes da adoção de um sistema de logging dedicado (como Winston ou Pino). A supressão deliberada documenta essa escolha.

---

### Exemplo 8 — Supressão de no-console em repository (`src/repositories/podcasts.repository.js`)

**Regra:** `no-console` (warning)  
**Categoria:** Boas práticas / intervenção manual

**Antes:**
```js
export async function buscarCategorias() {
  try {
    const [rows] = await pool.query('SELECT catcodigo, catnome FROM categorias');
    return rows;
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    return [];
  }
}
```

**Depois:**
```js
export async function buscarCategorias() {
  try {
    const [rows] = await pool.query('SELECT catcodigo, catnome FROM categorias');
    return rows;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar categorias:', err);
    return [];
  }
}
```

**Explicação:** A mesma justificativa se aplica à camada de repository: erros de banco de dados precisam ser registrados para diagnóstico. Em vez de propagar a exceção (o que quebraria a experiência do usuário), o repositório captura o erro, loga e retorna valor padrão.

---

### Exemplo 9 — Supressão de no-console em controller de episódios do usuário (`src/controllers/meusEpisodios.controller.js`)

**Regra:** `no-console` (warning)  
**Categoria:** Boas práticas / intervenção manual

**Antes:**
```js
  } catch (err) {
    console.error('Erro ao adicionar episódio:', err);
    res.redirect('/meusPodcasts');
  }
```

**Depois:**
```js
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao adicionar episódio:', err);
    res.redirect('/meusPodcasts');
  }
```

**Explicação:** Consistência no tratamento de erros: todos os blocos `catch` dos controllers seguem o mesmo padrão após as correções — suprimir o warning explicitamente e manter o log para rastreabilidade.

---

### Exemplo 10 — Supressão de no-console em múltiplas ocorrências (`src/controllers/meusPodcasts.controller.js`)

**Regra:** `no-console` (warning)  
**Categoria:** Boas práticas / intervenção manual

**Antes:**
```js
export async function listarMeusPodcasts(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcasts = await buscarPodcastsPorUsuario(usuario.codigo);
    res.render('meusPodcasts', { title: 'Podwave - Gerenciar Meus Podcasts', podcasts });
  } catch (err) {
    console.error('Erro ao carregar gestão de podcasts:', err);
    res.render('meusPodcasts', { title: 'Podwave - Gerenciar Meus Podcasts', podcasts: [] });
  }
}
```

**Depois:**
```js
export async function listarMeusPodcasts(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcasts = await buscarPodcastsPorUsuario(usuario.codigo);
    res.render('meusPodcasts', { title: 'Podwave - Gerenciar Meus Podcasts', podcasts });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar gestão de podcasts:', err);
    res.render('meusPodcasts', { title: 'Podwave - Gerenciar Meus Podcasts', podcasts: [] });
  }
}
```

**Explicação:** Este controller contém 5 ocorrências de `no-console`. Cada uma foi tratada individualmente com o comentário de supressão, garantindo que a decisão de manter o log seja documentada em cada ponto de uso — não suprimida globalmente via `/* eslint-disable */`, o que ocultaria outros problemas futuros.

---

## Parte 7 — Avaliação dos Resultados

**O ESLint encontrou problemas relevantes?**  
Sim. O principal problema encontrado — indentação inconsistente (4 espaços em vez de 2) — afeta todos os arquivos do projeto. Embora não cause falhas em tempo de execução, dificulta a leitura do código e gera inconsistência nos diffs do git quando diferentes desenvolvedores editam o mesmo arquivo com configurações de editor distintas. Os warnings de `no-console` também são relevantes: em um projeto em produção, logs de `console.error` não gerenciados podem expor informações sensíveis ou sobrecarregar saídas de log.

**Os problemas poderiam causar falhas reais?**  
Os erros de indentação, por si só, não causam falhas em JavaScript (ao contrário de Python). No entanto, a existência de `console.error` em produção pode expor stack traces com informações internas do sistema a logs acessíveis externamente. Em projetos com regras mais rígidas, a ausência de um logger dedicado (como Winston) poderia ser considerada uma falha de segurança ou de observabilidade.

**A ferramenta ajudou a melhorar a legibilidade?**  
Sim, significativamente. A uniformização da indentação para 2 espaços tornou o código mais compacto e consistente. Blocos aninhados com 4 espaços por nível rapidamente ultrapassam a margem de 80 caracteres em monitores menores; com 2 espaços, a leitura fica mais confortável.

**A ferramenta ajudou a padronizar o código?**  
Sim. Antes do ESLint, a indentação era de 4 espaços por convenção não documentada. Após a configuração, a regra é explícita, automaticamente verificada e aplicável a qualquer novo arquivo ou colaborador. A padronização deixou de depender de disciplina individual e passou a ser garantida por automação.

**Quais limitações foram observadas?**  
A principal limitação foi a incapacidade do `--fix` de resolver os warnings de `no-console` — o ESLint não pode decidir automaticamente se um log deve ser removido, substituído por um logger ou suprimido. Isso exigiu revisão manual de cada ocorrência. Outra limitação: o ESLint não detecta erros semânticos (como passar parâmetros na ordem errada para uma função) nem falhas de integração com o banco de dados.

**Você utilizaria essa ferramenta em projetos reais?**  
Sim, sem dúvida. O ESLint é essencial em projetos com mais de um desenvolvedor. A configuração inicial é rápida (menos de 30 minutos) e o benefício é imediato: qualidade de código verificada automaticamente em cada commit, sem custo adicional de revisão manual de estilo. Em um contexto profissional, integraria o ESLint com um *pre-commit hook* via husky e lint-staged para que erros nunca cheguem ao repositório remoto.
````

- [ ] **Step 3: Preencher as seções técnicas com dados reais**

Nos locais marcados com `[COLAR AQUI...]` e `[NNN]`/`[XXX]`/`[YY]`:
- Copiar o conteúdo de `docs/eslint-output-antes.txt` na Parte 4
- Copiar o conteúdo de `docs/eslint-output-apos-fix.txt` na Parte 5
- Substituir `[NNN]`, `[XXX]`, `[YY]`, `[ZZZ]` pelos valores reais da última linha de `eslint-output-antes.txt`
- Substituir `[N1]`, `[N2]` etc. pelas contagens reais da Task 2 Step 3

- [ ] **Step 4: Commit**

```bash
git add docs/relatorio-eslint.md
git commit -m "docs: relatório completo N3E1 — ESLint no Podwave"
```

- [ ] **Step 5: Push**

```bash
git push origin main --tags
```

---

---

### Task 6: Gerar ZIPs de entrega (antes e depois)

**Files:**
- Create: `podwave-antes-eslint.zip` (raiz)
- Create: `podwave-depois-eslint.zip` (raiz)

**Interfaces:**
- Consumes: tags git `eslint-antes` e `eslint-depois` criadas nas Tasks 1 e 4
- Produces: dois arquivos ZIP limpos (sem `node_modules`) prontos para entrega

- [ ] **Step 1: Verificar que as duas tags existem**

```bash
git tag
```

Saída esperada: lista contendo `eslint-antes` e `eslint-depois`.

- [ ] **Step 2: Gerar ZIP do estado "antes"**

```bash
git archive eslint-antes --output=podwave-antes-eslint.zip
```

- [ ] **Step 3: Gerar ZIP do estado "depois"**

```bash
git archive eslint-depois --output=podwave-depois-eslint.zip
```

- [ ] **Step 4: Verificar os ZIPs**

```bash
ls -lh podwave-antes-eslint.zip podwave-depois-eslint.zip
```

Os dois arquivos devem existir com tamanhos diferentes (o "depois" inclui `eslint.config.js` e as correções).

- [ ] **Step 5: Conferir conteúdo do ZIP "antes" (opcional)**

```bash
unzip -l podwave-antes-eslint.zip | head -30
```

Confirmar que `eslint.config.js` **não** aparece na lista (ele não existia no estado eslint-antes).

---

## Instruções de conversão para PDF

Após inserir todos os screenshots nos locais marcados:

**Opção A — VS Code:**
1. Instalar extensão "Markdown PDF" (yzane.markdown-pdf)
2. Abrir `docs/relatorio-eslint.md`
3. Ctrl+Shift+P → "Markdown PDF: Export (pdf)"

**Opção B — Pandoc:**
```bash
pandoc docs/relatorio-eslint.md -o relatorio-eslint.pdf --pdf-engine=wkhtmltopdf
```

**Verificação:** o PDF deve ter pelo menos 8 páginas.
