# Design: Atividade N3E1 — ESLint no Podwave

**Data:** 2026-06-17  
**Disciplina:** Qualidade de Software  
**Projeto-base:** Podwave (Node.js + ESM, ~1100 linhas em `src/`)

---

## Contexto

A atividade N3E1 exige aplicar ESLint em um projeto Node.js, documentar o processo em relatório PDF (mínimo 8 páginas) e entregar o código-fonte antes e depois das correções.

O Podwave é um sistema de gerenciamento de podcasts com autenticação, CRUD de podcasts/episódios e listas de reprodução. Possui 5+ arquivos-fonte, 1100+ linhas de código, uso de módulos ESM, funções, condicionais, loops e interação com banco de dados MySQL — atende todos os requisitos da Parte 1.

---

## Estrutura geral

Duas frentes executadas em sequência:

### Frente técnica (código)

1. Tag git `eslint-antes` para preservar estado "antes"
2. Instalar ESLint: `npm install eslint --save-dev`
3. Criar `eslint.config.js` com as 10 regras selecionadas
4. Executar `npx eslint src/` e capturar output completo
5. Executar `npx eslint src/ --fix` (correção automática)
6. Aplicar correções manuais no restante
7. Commit estado "depois" com tag `eslint-depois`

### Frente documental (relatório)

- Arquivo: `docs/relatorio-eslint.md`
- Formato: Markdown → PDF (VS Code "Markdown PDF" ou Pandoc)
- Screenshots: marcados com `> 📸 SCREENSHOT: [descrição]` no `.md`

---

## Configuração ESLint (`eslint.config.js`)

Abordagem C: `eslint:recommended` + regras de estilo selecionadas.

| Regra | Nível | Justificativa |
|---|---|---|
| `no-console` | `warn` | Logs esquecidos em produção |
| `eqeqeq` | `error` | `==` causa bugs de coerção de tipo |
| `semi` | `error` (always) | Consistência; ASI pode surpreender |
| `quotes` | `error` (single) | Padroniza aspas no projeto |
| `indent` | `error` (2 espaços) | Legibilidade e consistência |
| `no-unused-vars` | `warn` | Variáveis mortas acumulam débito técnico |
| `no-var` | `error` | `var` tem escopo de função — `let`/`const` são mais seguros |
| `prefer-const` | `error` | Imutabilidade explícita onde possível |
| `curly` | `error` | Obriga `{}` em todos os blocos `if`/`for`/`while` |
| `no-trailing-spaces` | `error` | Ruído em diffs git |

Estilo adotado: aspas simples, 2 espaços de indentação (reflete o estilo já predominante no projeto).

---

## Estrutura do relatório (`docs/relatorio-eslint.md`)

```
1. Introdução / Descrição do Projeto         (Parte 1)
2. Estudo Teórico — ESLint e Análise Estática (Parte 2)
3. Instalação e Configuração                  (Parte 3) + screenshots
4. Execução do ESLint — resultados "antes"    (Parte 4) + screenshot
5. Correção Automática                        (Parte 5) + screenshot
6. Comparação Antes e Depois — 10 exemplos    (Parte 6)
7. Avaliação Crítica dos Resultados           (Parte 7)
```

Seções teóricas (Partes 2 e 7): redigidas por Claude em português.  
Seções técnicas (Partes 3–6): geradas a partir dos resultados reais do ESLint no podwave.

---

## Entregáveis

1. **Código-fonte antes:** referenciado pela tag git `eslint-antes`
2. **Código-fonte depois:** commit com correções + tag `eslint-depois`
3. **Relatório:** `docs/relatorio-eslint.md` → converter para PDF para entrega
4. **Screenshots:** capturados pelo aluno nos pontos marcados no `.md`

---

## Fora de escopo

- Conversão do `.md` para PDF (feita manualmente pelo aluno)
- Captura dos screenshots (feita pelo aluno)
- Criação de nova aplicação (podwave já atende Parte 1)
