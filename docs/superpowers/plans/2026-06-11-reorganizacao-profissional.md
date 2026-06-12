# Reorganização Profissional do PodWave — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar o app em camadas profissionais (`src/` com routes/controllers/repositories), migrar para ES Modules e trocar a "sessão" via globals por `express-session` — mantendo URLs e comportamento, com a suíte verde ao final.

**Architecture:** Camadas técnicas: routes só mapeiam URL → controller; controllers cuidam de req/res, validação e render; repositories concentram o SQL (fatiamento do `banco.js`). Autenticação via `express-session` (cookie de sessão) com middleware `requireLogin`. O fluxo de execução tem uma "fase vermelha" controlada: os arquivos novos em `src/` são ESM e só passam a ser carregáveis na Tarefa 8 (flip do `package.json`); a suíte volta a rodar na Tarefa 11.

**Tech Stack:** Node 22 (ESM, `import.meta.dirname`), Express 4, EJS, express-session, mysql2 (pool), Jest 29 com `--experimental-vm-modules` + `jest.unstable_mockModule`, supertest.

**Spec:** `docs/superpowers/specs/2026-06-11-reorganizacao-profissional-design.md`

**Baseline:** 45/45 testes verdes (25 unit + 20 integração). Ao final: **47/47** (os 45 portados + 2 novos de logout). Os testes de integração exigem o banco em Docker: `docker compose up -d` (porta 3307).

**Decisões de comportamento (as únicas mudanças visíveis):**
1. `POST /usuarios/logout` passa a existir (hoje o botão Sair dá 404).
2. Sessão por usuário via cookie — dois usuários simultâneos não se atropelam mais.
3. Bug latente corrigido: `routes/meusPodcasts.js:82` usa `buscarCatcodigoPorNome` sem importar (ReferenceError se `catcodigo` não for numérico). O controller novo passa `parseInt(catcodigo) || null` e deixa o default 'Geral' para o repository (que já faz isso).
4. Limpezas sem efeito visível: `inserirCategoria` (código morto, nunca chamado) não é portado; o if/else de ramos idênticos na rota de progresso vira uma chamada única; `console.log` de debug saem das queries e do streaming de áudio; dependência `debug` removida.

---

## Tarefa 1: Branch, dependência e variáveis de ambiente

**Files:**
- Modify: `package.json` (via npm), `.env.example`

- [ ] **Step 1: Criar branch de trabalho**

```bash
git checkout -b refactor/reorganizacao-profissional
```

- [ ] **Step 2: Instalar express-session**

```bash
npm install express-session
```

Esperado: `added 1 package` (ou similar), sem erros.

- [ ] **Step 3: Adicionar SESSION_SECRET ao .env.example**

Conteúdo completo do novo `.env.example`:

```bash
# Conexão com o banco — os padrões abaixo já apontam para o container Docker,
# então o .env só é necessário se você quiser sobrescrever algo.
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=podwave

# Segredo usado para assinar o cookie de sessão (defina um valor próprio em produção)
SESSION_SECRET=troque-este-segredo
```

- [ ] **Step 4: Verificar que a suíte atual continua verde** (express-session ainda não é usado)

```bash
docker compose up -d && npm test
```

Esperado: `Tests: 45 passed, 45 total`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: adiciona express-session e SESSION_SECRET ao ambiente"
```

---

## Tarefa 2: Pool de conexão em src/config/database.js

**Files:**
- Create: `src/config/database.js`

> A partir daqui até a Tarefa 8, os arquivos novos são ESM dentro de um pacote ainda CommonJS — eles não são importados por ninguém e **não podem ser executados nem checados com `node --check`** até o flip do `package.json` (Tarefa 8). A verificação é por revisão + suíte na Tarefa 11.

- [ ] **Step 1: Criar o arquivo**

```js
import mysql from 'mysql2/promise';

// Pool em vez de conexão única: conexões derrubadas pelo servidor
// (wait_timeout, restart do container) são descartadas e recriadas
// automaticamente, em vez de ficarem mortas no cache.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3307),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'podwave',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10
});

export default pool;
```

O hack `global.connection` do `banco.js` morre: módulo ESM é singleton por natureza (o `createPool` roda uma vez no primeiro import). `createPool` não conecta de imediato — a primeira query é que abre conexão, então importar este módulo sem banco de pé não quebra nada.

- [ ] **Step 2: Commit**

```bash
git add src/config/database.js
git commit -m "feat: pool de conexão em src/config/database.js"
```

---

## Tarefa 3: Repositories (fatiamento do banco.js)

**Files:**
- Create: `src/repositories/usuarios.repository.js`
- Create: `src/repositories/podcasts.repository.js`
- Create: `src/repositories/episodios.repository.js`
- Create: `src/repositories/comentarios.repository.js`
- Create: `src/repositories/avaliacoes.repository.js`
- Create: `src/repositories/favoritos.repository.js`
- Create: `src/repositories/progresso.repository.js`

SQL e assinaturas idênticos ao `banco.js` atual. Diferenças intencionais: `console.log` de debug removidos (atualizarPodcast/deletarPodcast) e `inserirCategoria` não portado (nunca é chamado por rota ou teste).

- [ ] **Step 1: Criar `src/repositories/usuarios.repository.js`**

```js
import pool from '../config/database.js';

export async function inserirUsuario(usuario) {
    const sql = 'INSERT INTO usuarios (usunome, usuemail, ususenha) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [usuario.nome, usuario.email, usuario.password]);
    return result && result.affectedRows > 0 ? result.insertId : null;
}

export async function buscarUsuario(usuario) {
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ? AND ususenha = ?';
    const [rows] = await pool.query(sql, [usuario.email, usuario.password]);
    return rows.length > 0 ? rows[0] : null;
}

export async function buscarUsuarioPorEmail(email) {
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ?';
    const [rows] = await pool.query(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
}
```

- [ ] **Step 2: Criar `src/repositories/podcasts.repository.js`** (inclui categorias — só são usadas pelos fluxos de podcast)

```js
import pool from '../config/database.js';

export async function inserirPodcast(podcast) {
    const sql = 'INSERT INTO podcasts (podnome, poddescricao, podurl, usucodigo, catcodigo) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [
        podcast.podnome,
        podcast.poddescricao,
        podcast.podurl,
        podcast.usucodigo,
        podcast.catcodigo || (await buscarCatcodigoPorNome('Geral'))
    ]);
    return result.insertId;
}

export async function buscarPodcastsPorUsuario(usucodigo) {
    try {
        const [rows] = await pool.query(
            'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, c.catnome AS podcategoria ' +
            'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo WHERE p.usucodigo = ?',
            [usucodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar podcasts por usuário:', err);
        return [];
    }
}

export async function buscarPodcastsPorCategoria(catcodigo) {
    try {
        const [rows] = await pool.query(
            'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, c.catnome AS podcategoria ' +
            'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo WHERE c.catcodigo = ?',
            [catcodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar podcasts por categoria:', err);
        return [];
    }
}

export async function buscarTodosPodcasts() {
    try {
        const [rows] = await pool.query(
            'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, c.catnome AS podcategoria ' +
            'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo'
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar todos os podcasts:', err);
        return [];
    }
}

export async function buscarPodcastPorId(podcodigo) {
    const [rows] = await pool.query(
        'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, p.usucodigo, p.catcodigo, c.catnome AS podcategoria ' +
        'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo WHERE p.podcodigo = ?',
        [podcodigo]
    );
    return rows[0] || null;
}

export async function atualizarPodcast(podcast) {
    const sql = 'UPDATE podcasts SET podnome = ?, poddescricao = ?, podurl = ?, catcodigo = ? WHERE podcodigo = ? AND usucodigo = ?';
    const [result] = await pool.query(sql, [
        podcast.podnome,
        podcast.poddescricao,
        podcast.podurl,
        podcast.catcodigo,
        podcast.podcodigo,
        podcast.usucodigo
    ]);
    return result.affectedRows > 0;
}

export async function deletarPodcast(podcodigo, usucodigo) {
    const sql = 'DELETE FROM podcasts WHERE podcodigo = ? AND usucodigo = ?';
    const [result] = await pool.query(sql, [podcodigo, usucodigo]);
    return result.affectedRows > 0;
}

export async function buscarCategorias() {
    try {
        const [rows] = await pool.query('SELECT catcodigo, catnome FROM categorias');
        return rows;
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        return [];
    }
}

export async function buscarCatcodigoPorNome(catnome) {
    const [rows] = await pool.query('SELECT catcodigo FROM categorias WHERE catnome = ?', [catnome]);
    return rows[0]?.catcodigo || null;
}
```

- [ ] **Step 3: Criar `src/repositories/episodios.repository.js`**

```js
import pool from '../config/database.js';

export async function buscarEpisodiosPorPodcast(podcodigo) {
    try {
        const [rows] = await pool.query(
            'SELECT epicodigo, podcodigo, epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes FROM episodios WHERE podcodigo = ?',
            [podcodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar episódios por podcast:', err);
        return [];
    }
}

export async function inserirEpisodio(episodio) {
    const sql = `
        INSERT INTO episodios (podcodigo, usucodigo, epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        episodio.podcodigo,
        episodio.usucodigo,
        episodio.epititulo,
        episodio.epidescricao,
        episodio.epiurl,
        episodio.epiduracao,
        episodio.epidata,
        episodio.epinumero,
        episodio.epireproducoes,
        episodio.epiaudio
    ]);
    return result.insertId;
}

export async function atualizarEpisodio(episodio) {
    const sql = `
        UPDATE episodios
        SET epititulo = ?,
            epidescricao = ?,
            epiurl = ?,
            epiduracao = ?,
            epidata = ?,
            epinumero = ?,
            epireproducoes = ?,
            epiaudio = ?
        WHERE epicodigo = ? AND podcodigo = ?
    `;
    const [result] = await pool.query(sql, [
        episodio.epititulo,
        episodio.epidescricao,
        episodio.epiurl,
        episodio.epiduracao,
        episodio.epidata,
        episodio.epinumero,
        episodio.epireproducoes,
        episodio.epiaudio,
        episodio.epicodigo,
        episodio.podcodigo
    ]);
    return result.affectedRows > 0;
}

export async function deletarEpisodio(epicodigo, podcodigo) {
    const sql = 'DELETE FROM episodios WHERE epicodigo = ? AND podcodigo = ?';
    const [result] = await pool.query(sql, [epicodigo, podcodigo]);
    return result.affectedRows > 0;
}

export async function buscarEpisodioPorId(epicodigo) {
    const [rows] = await pool.query(
        'SELECT epicodigo, podcodigo, epititulo, epidescricao, epiurl, epiaudio, epiduracao, epidata, epinumero, epireproducoes FROM episodios WHERE epicodigo = ?',
        [epicodigo]
    );
    return rows[0] || null;
}
```

- [ ] **Step 4: Criar `src/repositories/comentarios.repository.js`**

```js
import pool from '../config/database.js';

export async function inserirComentario(comentario) {
    const sql = 'INSERT INTO comentarios (usucodigo, podcodigo, epicodigo, comtexto, comdata) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [
        comentario.usucodigo,
        comentario.podcodigo,
        comentario.epicodigo,
        comentario.comtexto,
        comentario.comdata
    ]);
    return result.insertId;
}

export async function buscarComentariosPorEpisodio(epicodigo) {
    const sql = `
        SELECT c.*, u.usuemail AS usuarioEmail
        FROM comentarios c
        JOIN usuarios u ON c.usucodigo = u.usucodigo
        WHERE c.epicodigo = ?
    `;
    const [rows] = await pool.query(sql, [epicodigo]);
    return rows;
}
```

- [ ] **Step 5: Criar `src/repositories/avaliacoes.repository.js`**

```js
import pool from '../config/database.js';

export async function inserirAvaliacao(avaliacao) {
    const sql = 'INSERT INTO avaliacoes (usucodigo, podcodigo, epicodigo, avanota, avacomentario, avadata) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(sql, [
        avaliacao.usucodigo,
        avaliacao.podcodigo,
        avaliacao.epicodigo,
        avaliacao.nota,
        avaliacao.comentario || null,
        avaliacao.data || new Date().toISOString().split('T')[0]
    ]);
    return result.insertId;
}

export async function atualizarAvaliacao(avaliacao) {
    const sql = 'UPDATE avaliacoes SET avanota = ?, avacomentario = ?, avadata = ? WHERE usucodigo = ? AND epicodigo = ?';
    const [result] = await pool.query(sql, [
        avaliacao.nota,
        avaliacao.comentario || null,
        avaliacao.data || new Date().toISOString().split('T')[0],
        avaliacao.usucodigo,
        avaliacao.epicodigo
    ]);
    return result.affectedRows > 0;
}

export async function buscarAvaliacaoPorUsuario(usucodigo, epicodigo) {
    const sql = 'SELECT avanota FROM avaliacoes WHERE usucodigo = ? AND epicodigo = ?';
    const [rows] = await pool.query(sql, [usucodigo, epicodigo]);
    return rows[0] || null;
}
```

- [ ] **Step 6: Criar `src/repositories/favoritos.repository.js`**

```js
import pool from '../config/database.js';

export async function inserirFavorito(favorito) {
    const sql = 'INSERT INTO favoritos (usucodigo, podcodigo, epicodigo) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [
        favorito.usucodigo,
        favorito.podcodigo,
        favorito.epicodigo
    ]);
    return result.insertId;
}

export async function removerFavorito(usucodigo, epicodigo) {
    const sql = 'DELETE FROM favoritos WHERE usucodigo = ? AND epicodigo = ?';
    const [result] = await pool.query(sql, [usucodigo, epicodigo]);
    return result.affectedRows > 0;
}

export async function verificarFavorito(usucodigo, epicodigo) {
    const sql = 'SELECT COUNT(*) as count FROM favoritos WHERE usucodigo = ? AND epicodigo = ?';
    const [rows] = await pool.query(sql, [usucodigo, epicodigo]);
    return rows[0].count > 0;
}
```

- [ ] **Step 7: Criar `src/repositories/progresso.repository.js`**

```js
import pool from '../config/database.js';

export async function inserirProgresso(progresso) {
    const sql = `
        INSERT INTO progresso_reproducao (usucodigo, epicodigo, proprogresso, prodata)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        proprogresso = VALUES(proprogresso),
        prodata = VALUES(prodata)
    `;
    const [result] = await pool.query(sql, [
        progresso.usucodigo,
        progresso.epicodigo,
        progresso.proprogresso,
        progresso.prodata
    ]);
    return result.insertId || result.affectedRows;
}

export async function buscarProgressoPorUsuario(usucodigo, epicodigo) {
    const sql = `
        SELECT proprogresso
        FROM progresso_reproducao
        WHERE usucodigo = ? AND epicodigo = ?
        ORDER BY prodata DESC
        LIMIT 1
    `;
    const [rows] = await pool.query(sql, [usucodigo, epicodigo]);
    return rows[0] || null;
}
```

- [ ] **Step 8: Commit**

```bash
git add src/repositories/
git commit -m "feat: fatia banco.js em repositories por entidade"
```

---

## Tarefa 4: Middleware de autenticação e controllers auth/home

**Files:**
- Create: `src/middlewares/auth.js`
- Create: `src/controllers/auth.controller.js`
- Create: `src/controllers/home.controller.js`

- [ ] **Step 1: Criar `src/middlewares/auth.js`**

```js
export function requireLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    next();
}
```

- [ ] **Step 2: Criar `src/controllers/auth.controller.js`**

```js
import { buscarUsuario, inserirUsuario, buscarUsuarioPorEmail } from '../repositories/usuarios.repository.js';

export function exibirLogin(req, res) {
    if (req.session.usuario) {
        return res.redirect('/listas');
    }
    res.render('login', { title: 'Podwave - Login', error: req.query.erro });
}

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

export function exibirSignup(req, res) {
    if (req.session.usuario) {
        return res.redirect('/listas');
    }
    res.render('signup', { title: 'Podwave - Registre-se' });
}

export async function efetuarSignup(req, res) {
    const { name: nome, email, password } = req.body;

    const usuarioExistente = await buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
        return res.redirect('/signup?error=Email já cadastrado');
    }

    const usuario = await inserirUsuario({ nome, email, password });
    if (!usuario) {
        return res.redirect('/signup?error=Erro ao inserir usuário');
    }
    return res.redirect('/login');
}

export function efetuarLogout(req, res) {
    req.session.destroy(() => {
        res.redirect('/login');
    });
}
```

- [ ] **Step 3: Criar `src/controllers/home.controller.js`**

```js
export function exibirHome(req, res) {
    res.render('index', { title: 'Podwave' });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/middlewares/ src/controllers/
git commit -m "feat: middleware requireLogin e controllers de auth/home"
```

---

## Tarefa 5: Controllers listas, meusPodcasts e meusEpisodios

**Files:**
- Create: `src/controllers/listas.controller.js`
- Create: `src/controllers/meusPodcasts.controller.js`
- Create: `src/controllers/meusEpisodios.controller.js`

Todos assumem `req.session.usuario` presente (garantido pelo `requireLogin` nas rotas).

- [ ] **Step 1: Criar `src/controllers/listas.controller.js`**

```js
import { buscarTodosPodcasts, buscarPodcastsPorCategoria, buscarCategorias } from '../repositories/podcasts.repository.js';

export async function listarPodcasts(req, res) {
    try {
        const catcodigo = req.query.catcodigo || null;
        const podcasts = catcodigo
            ? await buscarPodcastsPorCategoria(catcodigo)
            : await buscarTodosPodcasts();
        const categorias = await buscarCategorias();

        res.render('listas', {
            title: 'Podwave - Listas de Podcasts',
            podcasts,
            categorias,
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar podcasts:', err);
        res.render('listas', {
            title: 'Podwave - Listas de Podcasts',
            podcasts: [],
            categorias: [],
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    }
}
```

- [ ] **Step 2: Criar `src/controllers/meusPodcasts.controller.js`**

```js
import {
    buscarPodcastsPorUsuario,
    inserirPodcast,
    buscarPodcastPorId,
    atualizarPodcast,
    deletarPodcast,
    buscarCategorias
} from '../repositories/podcasts.repository.js';

export async function listarMeusPodcasts(req, res) {
    const usuario = req.session.usuario;
    try {
        const podcasts = await buscarPodcastsPorUsuario(usuario.codigo);
        const categorias = await buscarCategorias();
        res.render('meusPodcasts', {
            title: 'Podwave - Gerenciar Meus Podcasts',
            podcasts,
            categorias,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar gestão de podcasts:', err);
        res.render('meusPodcasts', {
            title: 'Podwave - Gerenciar Meus Podcasts',
            podcasts: [],
            categorias: [],
            usuarioEmail: usuario.email,
            query: req.query
        });
    }
}

export async function exibirEdicaoPodcast(req, res) {
    const usuario = req.session.usuario;
    try {
        const podcast = await buscarPodcastPorId(req.params.podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect('/meusPodcasts');
        }
        const categorias = await buscarCategorias();
        res.render('editar-podcast', {
            title: 'Podwave - Editar Podcast',
            podcast,
            categorias,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar edição de podcast:', err);
        res.redirect('/meusPodcasts');
    }
}

export async function exibirAdicaoPodcast(req, res) {
    const usuario = req.session.usuario;
    try {
        const categorias = await buscarCategorias();
        res.render('adicionar-podcast', {
            title: 'Podwave - Adicionar Podcast',
            categorias,
            usuarioEmail: usuario.email,
            error: req.query.error
        });
    } catch (err) {
        console.error('Erro ao carregar formulário de adição:', err);
        res.redirect('/meusPodcasts?error=Erro ao carregar formulário');
    }
}

export async function adicionarPodcast(req, res) {
    const usuario = req.session.usuario;
    try {
        const { podnome, poddescricao, podurl, catcodigo } = req.body;
        await inserirPodcast({
            podnome,
            poddescricao,
            podurl,
            usucodigo: usuario.codigo,
            // null deixa o repository aplicar o default 'Geral' (a versão antiga
            // referenciava buscarCatcodigoPorNome sem importar — ReferenceError latente)
            catcodigo: parseInt(catcodigo) || null
        });
        res.redirect('/meusPodcasts');
    } catch (err) {
        console.error('Erro ao adicionar podcast:', err);
        res.redirect('/meusPodcasts/adicionar?error=Erro ao adicionar podcast');
    }
}

export async function editarPodcast(req, res) {
    const usuario = req.session.usuario;
    const podcodigo = req.params.podcodigo;
    try {
        const { podnome, poddescricao, podurl, catcodigo } = req.body;
        await atualizarPodcast({
            podcodigo: parseInt(podcodigo),
            podnome,
            poddescricao,
            podurl,
            catcodigo: parseInt(catcodigo),
            usucodigo: usuario.codigo
        });
        res.redirect('/meusPodcasts');
    } catch (err) {
        console.error('Erro ao atualizar podcast:', err);
        res.redirect(`/meusPodcasts/editar/${podcodigo}?error=Erro ao atualizar podcast`);
    }
}

export async function excluirPodcast(req, res) {
    const usuario = req.session.usuario;
    try {
        await deletarPodcast(req.params.podcodigo, usuario.codigo);
        res.redirect('/meusPodcasts');
    } catch (err) {
        console.error('Erro ao deletar podcast:', err);
        res.redirect('/meusPodcasts?error=Erro ao deletar podcast');
    }
}
```

- [ ] **Step 3: Criar `src/controllers/meusEpisodios.controller.js`**

```js
import {
    inserirEpisodio,
    atualizarEpisodio,
    deletarEpisodio,
    buscarEpisodioPorId,
    buscarEpisodiosPorPodcast
} from '../repositories/episodios.repository.js';
import { buscarPodcastPorId } from '../repositories/podcasts.repository.js';

export async function listarMeusEpisodios(req, res) {
    const usuario = req.session.usuario;
    try {
        const podcodigo = req.params.podcodigo;
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect('/meusPodcasts?error=Podcast não encontrado ou não pertence ao usuário');
        }
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        res.render('meusEpisodios', {
            title: 'Podwave - Meus Episódios',
            episodios: episodios || [],
            podcodigo,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar gestão de episódios:', err);
        res.redirect('/meusPodcasts?error=Erro ao carregar gestão de episódios');
    }
}

export async function exibirAdicaoEpisodio(req, res) {
    const usuario = req.session.usuario;
    const podcodigo = req.params.podcodigo;
    try {
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect('/meusPodcasts');
        }
        res.render('adicionar-episodio', {
            title: 'Podwave - Adicionar Episódio',
            podcodigo,
            usuarioEmail: usuario.email,
            error: req.query.error
        });
    } catch (err) {
        console.error('Erro ao carregar formulário de adição de episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao carregar formulário`);
    }
}

export async function adicionarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const podcodigo = req.params.podcodigo;
    try {
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect('/meusPodcasts');
        }
        const { epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio } = req.body;
        await inserirEpisodio({
            podcodigo: parseInt(podcodigo),
            usucodigo: usuario.codigo,
            epititulo,
            epidescricao,
            epiurl,
            epiduracao: epiduracao ? parseInt(epiduracao) : null,
            epidata: epidata || new Date().toISOString().split('T')[0],
            epinumero: parseInt(epinumero) || 0,
            epireproducoes: parseInt(epireproducoes) || 0,
            epiaudio
        });
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao adicionar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}/adicionar?error=Erro ao adicionar episódio`);
    }
}

export async function exibirEdicaoEpisodio(req, res) {
    const usuario = req.session.usuario;
    try {
        const { podcodigo, epicodigo } = req.params;
        const episodio = await buscarEpisodioPorId(epicodigo);
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!episodio || episodio.podcodigo !== parseInt(podcodigo) || !podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect(`/meusEpisodios/${podcodigo}`);
        }
        res.render('editar-episodio', {
            title: 'Podwave - Editar Episódio',
            episodio,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar edição de episódio:', err);
        res.redirect(`/meusEpisodios/${req.params.podcodigo}?error=Erro ao carregar edição`);
    }
}

export async function editarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect(`/meusEpisodios/${podcodigo}`);
        }
        const { epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio } = req.body;
        await atualizarEpisodio({
            epicodigo: parseInt(epicodigo),
            podcodigo: parseInt(podcodigo),
            epititulo,
            epidescricao,
            epiurl,
            epiduracao: epiduracao ? parseInt(epiduracao) : null,
            epidata: epidata || new Date().toISOString().split('T')[0],
            epinumero: parseInt(epinumero) || 0,
            epireproducoes: parseInt(epireproducoes) || 0,
            epiaudio
        });
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao atualizar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}/${epicodigo}/editar?error=Erro ao atualizar episódio`);
    }
}

export async function excluirEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
            return res.redirect(`/meusEpisodios/${podcodigo}`);
        }
        await deletarEpisodio(epicodigo, podcodigo);
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao deletar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao deletar episódio`);
    }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/controllers/
git commit -m "feat: controllers de listas, meusPodcasts e meusEpisodios"
```

---

## Tarefa 6: Controller de episódios (interações + streaming)

**Files:**
- Create: `src/controllers/episodios.controller.js`

Mudanças intencionais vs. rota antiga: `console.log` de debug do streaming removidos; o if/else de ramos idênticos do progresso vira uma chamada única (o `ON DUPLICATE KEY UPDATE` do SQL já faz o upsert). A rota de áudio continua **sem** exigir login (o `<audio>` do player faz GET direto).

- [ ] **Step 1: Criar `src/controllers/episodios.controller.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import rangeParser from 'range-parser';
import { buscarEpisodiosPorPodcast, buscarEpisodioPorId } from '../repositories/episodios.repository.js';
import { buscarPodcastPorId } from '../repositories/podcasts.repository.js';
import { inserirComentario, buscarComentariosPorEpisodio } from '../repositories/comentarios.repository.js';
import { inserirAvaliacao, atualizarAvaliacao, buscarAvaliacaoPorUsuario } from '../repositories/avaliacoes.repository.js';
import { inserirFavorito, removerFavorito, verificarFavorito } from '../repositories/favoritos.repository.js';
import { inserirProgresso, buscarProgressoPorUsuario } from '../repositories/progresso.repository.js';

const AUDIO_DIR = path.join(import.meta.dirname, '../../public/audios');

export async function listarEpisodios(req, res) {
    const { podcodigo } = req.params;
    try {
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        const podcast = await buscarPodcastPorId(podcodigo);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios,
            podnome: podcast ? podcast.podnome : `Podcast #${podcodigo}`,
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar episódios:', err);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: [],
            podnome: `Podcast #${podcodigo}`,
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    }
}

export async function exibirEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const episodio = await buscarEpisodioPorId(epicodigo);
        if (!episodio) {
            return res.status(404).send('Episódio não encontrado');
        }

        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast) {
            return res.status(404).send('Podcast não encontrado');
        }

        const comentarios = await buscarComentariosPorEpisodio(epicodigo);
        const avaliacaoUsuario = await buscarAvaliacaoPorUsuario(usuario.codigo, epicodigo);
        const isFavorito = await verificarFavorito(usuario.codigo, epicodigo);
        const progresso = await buscarProgressoPorUsuario(usuario.codigo, epicodigo);

        res.render('episodio-detalhe', {
            title: `PodWave - ${episodio.epititulo}`,
            episodio,
            podnome: podcast.podnome,
            comentarios: comentarios || [],
            avaliacaoUsuario: avaliacaoUsuario ? avaliacaoUsuario.avanota : null,
            isFavorito,
            progresso: progresso ? progresso.proprogresso : 0,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar detalhes do episódio:', err);
        res.redirect(`/episodios/${podcodigo}?error=Erro ao carregar episódio`);
    }
}

export async function comentarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { comentario } = req.body;
        await inserirComentario({
            usucodigo: usuario.codigo,
            podcodigo: parseInt(podcodigo),
            epicodigo: parseInt(epicodigo),
            comtexto: comentario,
            comdata: new Date().toISOString().split('T')[0]
        });
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao adicionar comentário:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao comentar`);
    }
}

export async function avaliarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { nota } = req.body;

        if (!nota || isNaN(nota) || nota < 1 || nota > 5) {
            return res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Nota inválida. Use valores de 1 a 5.`);
        }

        const avaliacaoExistente = await buscarAvaliacaoPorUsuario(usuario.codigo, epicodigo);
        if (avaliacaoExistente) {
            await atualizarAvaliacao({
                usucodigo: usuario.codigo,
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        } else {
            await inserirAvaliacao({
                usucodigo: usuario.codigo,
                podcodigo: parseInt(podcodigo),
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        }

        res.redirect(`/episodios/${podcodigo}/${epicodigo}?avaliacao=${nota}`);
    } catch (err) {
        console.error('Erro ao avaliar episódio:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao processar a avaliação`);
    }
}

export async function alternarFavorito(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const isFavorito = await verificarFavorito(usuario.codigo, epicodigo);
        if (isFavorito) {
            await removerFavorito(usuario.codigo, epicodigo);
        } else {
            await inserirFavorito({
                usucodigo: usuario.codigo,
                podcodigo: parseInt(podcodigo),
                epicodigo: parseInt(epicodigo)
            });
        }
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao favoritar/desfavoritar:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao favoritar`);
    }
}

export async function salvarProgresso(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { progresso_segundos } = req.body;
        // O INSERT ... ON DUPLICATE KEY UPDATE do repository já faz o upsert
        await inserirProgresso({
            usucodigo: usuario.codigo,
            epicodigo: parseInt(epicodigo),
            proprogresso: parseInt(progresso_segundos),
            prodata: new Date().toISOString().split('T')[0]
        });
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao atualizar progresso:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao atualizar progresso`);
    }
}

export function transmitirAudio(req, res) {
    const { epicodigo } = req.params;

    buscarEpisodioPorId(epicodigo)
        .then(episodio => {
            if (!episodio) {
                return res.status(404).send('Episódio não encontrado');
            }

            const audioFile = episodio.epiaudio || episodio.epiurl;
            const audioPath = path.join(AUDIO_DIR, audioFile);

            if (!fs.existsSync(audioPath)) {
                return res.status(404).send('Arquivo de áudio não encontrado');
            }

            const stat = fs.statSync(audioPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const ranges = rangeParser(fileSize, range);
                if (ranges === -1) {
                    return res.status(416).send('Range inválido');
                }
                if (ranges === -2) {
                    return res.status(200).send('Range não satisfazível');
                }

                const start = ranges[0].start;
                const end = ranges[0].end;
                const chunksize = end - start + 1;
                const file = fs.createReadStream(audioPath, { start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg'
                });
                file.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg'
                });
                fs.createReadStream(audioPath).pipe(res);
            }
        })
        .catch(err => {
            console.error('Erro ao carregar áudio:', err);
            res.status(500).send('Erro ao carregar o áudio');
        });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/episodios.controller.js
git commit -m "feat: controller de episódios com interações e streaming"
```

---

## Tarefa 7: Rotas, app.js e server.js

**Files:**
- Create: `src/routes/home.routes.js`
- Create: `src/routes/auth.routes.js`
- Create: `src/routes/listas.routes.js`
- Create: `src/routes/episodios.routes.js`
- Create: `src/routes/meusPodcasts.routes.js`
- Create: `src/routes/meusEpisodios.routes.js`
- Create: `src/routes/index.js`
- Create: `src/app.js`
- Create: `src/server.js`

- [ ] **Step 1: Criar `src/routes/home.routes.js`**

```js
import { Router } from 'express';
import { exibirHome } from '../controllers/home.controller.js';

const router = Router();

router.get('/', exibirHome);

export default router;
```

- [ ] **Step 2: Criar `src/routes/auth.routes.js`**

```js
import { Router } from 'express';
import { exibirLogin, efetuarLogin, exibirSignup, efetuarSignup, efetuarLogout } from '../controllers/auth.controller.js';

const router = Router();

router.get('/login', exibirLogin);
router.post('/login', efetuarLogin);
router.get('/signup', exibirSignup);
router.post('/signup', efetuarSignup);
router.post('/usuarios/logout', efetuarLogout);

export default router;
```

- [ ] **Step 3: Criar `src/routes/listas.routes.js`**

```js
import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import { listarPodcasts } from '../controllers/listas.controller.js';

const router = Router();

router.get('/', requireLogin, listarPodcasts);

export default router;
```

- [ ] **Step 4: Criar `src/routes/episodios.routes.js`** (a rota de áudio fica sem `requireLogin`, como hoje)

```js
import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
    listarEpisodios,
    exibirEpisodio,
    comentarEpisodio,
    avaliarEpisodio,
    alternarFavorito,
    salvarProgresso,
    transmitirAudio
} from '../controllers/episodios.controller.js';

const router = Router();

router.get('/:podcodigo', requireLogin, listarEpisodios);
router.get('/:podcodigo/:epicodigo', requireLogin, exibirEpisodio);
router.post('/:podcodigo/:epicodigo/comentar', requireLogin, comentarEpisodio);
router.post('/:podcodigo/:epicodigo/avaliar', requireLogin, avaliarEpisodio);
router.post('/:podcodigo/:epicodigo/favoritar', requireLogin, alternarFavorito);
router.post('/:podcodigo/:epicodigo/progresso', requireLogin, salvarProgresso);
router.get('/:podcodigo/:epicodigo/audio', transmitirAudio);

export default router;
```

- [ ] **Step 5: Criar `src/routes/meusPodcasts.routes.js`**

```js
import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
    listarMeusPodcasts,
    exibirEdicaoPodcast,
    exibirAdicaoPodcast,
    adicionarPodcast,
    editarPodcast,
    excluirPodcast
} from '../controllers/meusPodcasts.controller.js';

const router = Router();

router.use(requireLogin);

router.get('/', listarMeusPodcasts);
router.get('/adicionar', exibirAdicaoPodcast);
router.post('/adicionar', adicionarPodcast);
router.get('/editar/:podcodigo', exibirEdicaoPodcast);
router.post('/editar/:podcodigo', editarPodcast);
router.post('/deletar/:podcodigo', excluirPodcast);

export default router;
```

- [ ] **Step 6: Criar `src/routes/meusEpisodios.routes.js`**

```js
import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
    listarMeusEpisodios,
    exibirAdicaoEpisodio,
    adicionarEpisodio,
    exibirEdicaoEpisodio,
    editarEpisodio,
    excluirEpisodio
} from '../controllers/meusEpisodios.controller.js';

const router = Router();

router.use(requireLogin);

router.get('/:podcodigo', listarMeusEpisodios);
router.get('/:podcodigo/adicionar', exibirAdicaoEpisodio);
router.post('/:podcodigo/adicionar', adicionarEpisodio);
router.get('/:podcodigo/:epicodigo/editar', exibirEdicaoEpisodio);
router.post('/:podcodigo/:epicodigo', editarEpisodio);
router.post('/:podcodigo/:epicodigo/delete', excluirEpisodio);

export default router;
```

- [ ] **Step 7: Criar `src/routes/index.js`** (agregador)

```js
import { Router } from 'express';
import homeRoutes from './home.routes.js';
import authRoutes from './auth.routes.js';
import listasRoutes from './listas.routes.js';
import episodiosRoutes from './episodios.routes.js';
import meusPodcastsRoutes from './meusPodcasts.routes.js';
import meusEpisodiosRoutes from './meusEpisodios.routes.js';

const router = Router();

router.use('/', homeRoutes);
router.use('/', authRoutes);
router.use('/listas', listasRoutes);
router.use('/episodios', episodiosRoutes);
router.use('/meusPodcasts', meusPodcastsRoutes);
router.use('/meusEpisodios', meusEpisodiosRoutes);

export default router;
```

- [ ] **Step 8: Criar `src/app.js`**

```js
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import createError from 'http-errors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import routes from './routes/index.js';

const app = express();

// Garante UTF-8 nas páginas renderizadas
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    next();
});

app.set('views', path.join(import.meta.dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, '..', 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'podwave-dev-secret',
    resave: false,
    saveUninitialized: false
}));

app.use(routes);

// 404 → error handler
app.use((req, res, next) => {
    next(createError(404));
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

export default app;
```

- [ ] **Step 9: Criar `src/server.js`** (substitui `bin/www`; o teste de conexão que vivia na carga do `banco.js` migra para cá)

```js
import app from './app.js';
import pool from './config/database.js';

const port = Number(process.env.PORT || 3000);

try {
    await pool.query('SELECT 1');
    console.log('Conectou ao MySQL!');
} catch (err) {
    console.error(`Não foi possível conectar ao banco (${err.message}).`);
    console.error('Verifique se o container está rodando: docker compose up -d');
}

const server = app.listen(port, () => {
    console.log(`PodWave no ar em http://localhost:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`A porta ${port} já está em uso.`);
        process.exit(1);
    }
    throw err;
});
```

- [ ] **Step 10: Commit**

```bash
git add src/routes/ src/app.js src/server.js
git commit -m "feat: rotas em camadas, app.js com sessão e server.js como entry point"
```

---

## Tarefa 8: Mover views e virar a chave para ESM

**Files:**
- Move: `views/` → `src/views/`
- Modify: `package.json`

> A partir deste commit, o código antigo (`app.js`, `routes/`, `banco.js`, `bin/www`) e os testes atuais **quebram** (são CommonJS num pacote ESM). É esperado — cada arquivo de teste volta a rodar quando for reescrito (Tarefas 9 e 10), a suíte completa na Tarefa 11, e o código antigo é removido na Tarefa 12. Não rode `npm test` sem filtro até a Tarefa 11.

- [ ] **Step 1: Mover as views**

```bash
git mv views src/views
```

- [ ] **Step 2: Atualizar `package.json`**

Adicionar `"type": "module"`, trocar os scripts, remover a dependência `debug` (só o `bin/www` usava) e adicionar `"transform": {}` ao bloco jest (desativa o babel-jest, desnecessário em ESM puro). O arquivo fica assim (mantenha as versões de `express-session` e demais deps como o npm gravou na Tarefa 1):

```json
{
  "name": "podwave",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "nodemon -- --env-file-if-exists=.env src/server.js",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests --detectOpenHandles",
    "coverage": "NODE_OPTIONS=--experimental-vm-modules jest --coverage"
  },
  "dependencies": {
    "@tailwindcss/cli": "^4.1.3",
    "cookie-parser": "~1.4.4",
    "ejs": "~2.6.1",
    "express": "~4.16.1",
    "express-session": "^1.18.2",
    "http-errors": "~1.6.3",
    "morgan": "~1.9.1",
    "mysql2": "^3.14.0",
    "range-parser": "^1.2.1",
    "tailwindcss": "^4.1.3"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "jest-html-reporter": "^4.1.0",
    "nodemon": "^3.1.10",
    "supertest": "^7.1.1"
  },
  "jest": {
    "transform": {},
    "reporters": [
      "default",
      [
        "jest-html-reporter",
        {
          "pageTitle": "Relatório de Testes",
          "outputPath": "./relatorio-testes/teste.html",
          "includeFailureMsg": true,
          "includeConsoleLog": true
        }
      ]
    ]
  }
}
```

```bash
npm install
```

(para o lockfile refletir a remoção de `debug`).

- [ ] **Step 3: Smoke test do app novo** (o banco precisa estar de pé: `docker compose up -d`)

```bash
node --env-file-if-exists=.env src/server.js & SERVER_PID=$!
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/meusPodcasts
kill $SERVER_PID
```

Esperado: `200` (login renderiza) e `302` (rota protegida redireciona sem sessão). No console do servidor: `Conectou ao MySQL!`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: migra o pacote para ESM e aponta o start para src/server.js"
```

---

## Tarefa 9: Reescrever tests/app.test.js (unit, repositories mockados)

**Files:**
- Rewrite: `tests/app.test.js`

Mudanças estruturais: `jest.unstable_mockModule` (caminho ESM do Jest) no lugar de `jest.mock`; login simulado pelo fluxo real (POST /login com `buscarUsuario` mockado + agente do supertest que guarda o cookie de sessão) no lugar de `global.usuarioCodigo = '1'`. Como o `usucodigo` agora vem do objeto do usuário mockado, as asserções que esperavam `'1'`/`'2'` (string) passam a esperar `1`/`2` (número). Os 25 testes originais são mantidos (mesmos nomes) + 1 novo de logout (Teste 27).

- [ ] **Step 1: Substituir o conteúdo de `tests/app.test.js` por:**

```js
/**
 * Testes unitários: exercitam as rotas HTTP com os repositories mockados
 * (sem banco). O login usa o fluxo real: POST /login com buscarUsuario
 * mockado, via agente do supertest que preserva o cookie de sessão.
 */
import { jest } from '@jest/globals';
import request from 'supertest';

// Os mocks precisam ser registrados ANTES do import do app
jest.unstable_mockModule('../src/repositories/usuarios.repository.js', () => ({
    inserirUsuario: jest.fn(),
    buscarUsuario: jest.fn(),
    buscarUsuarioPorEmail: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/podcasts.repository.js', () => ({
    inserirPodcast: jest.fn(),
    buscarPodcastsPorUsuario: jest.fn(),
    buscarPodcastsPorCategoria: jest.fn(),
    buscarTodosPodcasts: jest.fn(),
    buscarPodcastPorId: jest.fn(),
    atualizarPodcast: jest.fn(),
    deletarPodcast: jest.fn(),
    buscarCategorias: jest.fn(),
    buscarCatcodigoPorNome: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/episodios.repository.js', () => ({
    buscarEpisodiosPorPodcast: jest.fn(),
    inserirEpisodio: jest.fn(),
    atualizarEpisodio: jest.fn(),
    deletarEpisodio: jest.fn(),
    buscarEpisodioPorId: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/comentarios.repository.js', () => ({
    inserirComentario: jest.fn(),
    buscarComentariosPorEpisodio: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/avaliacoes.repository.js', () => ({
    inserirAvaliacao: jest.fn(),
    atualizarAvaliacao: jest.fn(),
    buscarAvaliacaoPorUsuario: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/favoritos.repository.js', () => ({
    inserirFavorito: jest.fn(),
    removerFavorito: jest.fn(),
    verificarFavorito: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/progresso.repository.js', () => ({
    inserirProgresso: jest.fn(),
    buscarProgressoPorUsuario: jest.fn()
}));

const usuariosRepo = await import('../src/repositories/usuarios.repository.js');
const podcastsRepo = await import('../src/repositories/podcasts.repository.js');
const episodiosRepo = await import('../src/repositories/episodios.repository.js');
const comentariosRepo = await import('../src/repositories/comentarios.repository.js');
const { default: app } = await import('../src/app.js');

jest.setTimeout(30000);

const USER_1 = { usucodigo: 1, usuemail: 'user@example.com' };
const USER_2 = { usucodigo: 2, usuemail: 'user2@example.com' };

// Loga pelo fluxo real e devolve um agente com o cookie de sessão
async function loginAs(usuario) {
    usuariosRepo.buscarUsuario.mockResolvedValue(usuario);
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email: usuario.usuemail, password: 'senha123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');
    return agent;
}

beforeEach(() => {
    jest.clearAllMocks();
    // Default usado por várias views (listas e formulários pedem categorias)
    podcastsRepo.buscarCategorias.mockResolvedValue([
        { catcodigo: 1, catnome: 'Empreendedorismo' },
        { catcodigo: 2, catnome: 'Geral' }
    ]);
});

describe('Testes - PodWave', () => {

    // Caso de Uso: Cadastrar-se
    describe('Cadastrar-se (POST /signup)', () => {
        it('Teste 1: deve permitir novos usuários a se registrarem com dados válidos', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue(null);
            usuariosRepo.inserirUsuario.mockResolvedValue(1);
            const uniqueEmail = `test_${Date.now()}@example.com`;
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
            expect(usuariosRepo.inserirUsuario).toHaveBeenCalledWith({
                nome: 'Test User',
                email: uniqueEmail,
                password: 'password123'
            });
        });

        it('Teste 2: deve rejeitar registros com emails duplicados', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue({ email: 'duplicate@example.com' });
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: 'duplicate@example.com', password: '123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/signup?error=Email%20j%C3%A1%20cadastrado');
        });
    });

    // Caso de Uso: Autenticar-se
    describe('Autenticar-se (POST /login)', () => {
        it('Teste 3: deve logar com credenciais válidas', async () => {
            const agent = await loginAs(USER_1);
            // Com a sessão ativa, uma rota protegida responde 200 em vez de redirecionar
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([]);
            await agent.get('/listas').expect(200);
        });

        it('Teste 4: deve bloquear login com credenciais inválidas', async () => {
            usuariosRepo.buscarUsuario.mockResolvedValue(null);
            const response = await request(app)
                .post('/login')
                .send({ email: 'invalid@example.com', password: 'wrongpassword' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login?erro=1');
        });
    });

    // Caso de Uso: Explorar Podcasts
    describe('Explorar Podcasts (GET /listas)', () => {
        it('Teste 5: deve exibir corretamente a lista de podcasts', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([
                { podcodigo: 19, podnome: 'Teste', podcategoria: 'Geral' }
            ]);
            const response = await agent.get('/listas').expect(200);
            expect(podcastsRepo.buscarTodosPodcasts).toHaveBeenCalled();
            expect(response.text).toContain('Teste');
        });

        it('Teste 6: deve filtrar podcasts por categoria', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarPodcastsPorCategoria.mockResolvedValue([
                { podcodigo: 9, podnome: 'Inovação Hoje', podcategoria: 'Empreendedorismo' }
            ]);
            const response = await agent.get('/listas?catcodigo=1').expect(200);
            expect(podcastsRepo.buscarPodcastsPorCategoria).toHaveBeenCalledWith('1');
            expect(response.text).toContain('Inovação Hoje');
        });
    });

    describe('Listar Episódios (GET /episodios/:podcodigo)', () => {
        it('Teste 8: deve listar episódios de um podcast', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.buscarEpisodiosPorPodcast.mockResolvedValue([
                { epicodigo: 4, podcodigo: 19, epititulo: 'Fluminense bate Ulsan' }
            ]);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({
                podcodigo: 19,
                podnome: 'Teste',
                podcategoria: 'Geral'
            });
            const response = await agent.get('/episodios/19').expect(200);
            expect(response.text).toContain('Fluminense bate Ulsan');
        });

        it('Teste 9: deve retornar vazio para podcast inexistente', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.buscarEpisodiosPorPodcast.mockResolvedValue([]);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue(null);
            const response = await agent.get('/episodios/999').expect(200);
            expect(episodiosRepo.buscarEpisodiosPorPodcast).toHaveBeenCalledWith('999');
            // Sem podcast, a rota usa o título de fallback e nenhum episódio é listado
            expect(response.text).toContain('Podcast #999');
        });
    });

    describe('Comentar Episódio (POST /episodios/:podcodigo/:epicodigo/comentar)', () => {
        it('Teste 10: deve permitir usuário a comentar um episódio', async () => {
            const agent = await loginAs(USER_1);
            comentariosRepo.inserirComentario.mockResolvedValue(1);
            const response = await agent
                .post('/episodios/19/4/comentar')
                .send({ comentario: 'Ótimo episódio!' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/episodios/19/4');
            expect(comentariosRepo.inserirComentario).toHaveBeenCalledWith({
                usucodigo: 1,
                podcodigo: 19,
                epicodigo: 4,
                comtexto: 'Ótimo episódio!',
                comdata: expect.any(String)
            });
        });

        it('Teste 11: deve redirecionar se não autenticado', async () => {
            const response = await request(app)
                .post('/episodios/19/4/comentar')
                .send({ comtexto: 'Ótimo episódio!' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    describe('Adicionar Podcast (POST /meusPodcasts/adicionar)', () => {
        it('Teste 12: deve permitir adicionar um novo podcast', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.inserirPodcast.mockResolvedValue(10);
            const response = await agent
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome: 'Novo Podcast',
                    poddescricao: 'Descrição do podcast',
                    podurl: '/images/novo.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.inserirPodcast).toHaveBeenCalledWith({
                podnome: 'Novo Podcast',
                poddescricao: 'Descrição do podcast',
                podurl: '/images/novo.jpg',
                catcodigo: 1,
                usucodigo: 1
            });
        });

        it('Teste 13: deve redirecionar se não autenticado', async () => {
            const response = await request(app)
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome: 'Novo Podcast',
                    poddescricao: 'Descrição do podcast',
                    podurl: '/images/novo.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    // Caso de Uso: Atualizar Podcast
    describe('Atualizar Podcast (POST /meusPodcasts/editar/:podcodigo)', () => {
        it('Teste 14: deve atualizar um podcast do usuário', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.atualizarPodcast.mockResolvedValue(true);
            const response = await agent
                .post('/meusPodcasts/editar/19')
                .send({
                    podnome: 'Teste Atualizado',
                    poddescricao: 'Descrição atualizada',
                    podurl: '/images/teste.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.atualizarPodcast).toHaveBeenCalledWith({
                podcodigo: 19,
                podnome: 'Teste Atualizado',
                poddescricao: 'Descrição atualizada',
                podurl: '/images/teste.jpg',
                catcodigo: 1,
                usucodigo: 1
            });
        });

        it('Teste 15: não deve atualizar podcast de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.atualizarPodcast.mockResolvedValue(false);
            const response = await agent
                .post('/meusPodcasts/editar/19')
                .send({
                    podnome: 'Teste Atualizado',
                    poddescricao: 'Descrição atualizada',
                    podurl: '/images/teste.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            // A proteção é via SQL (UPDATE ... WHERE usucodigo = ?): a chamada leva o
            // usucodigo do solicitante, então não afeta linhas de outro usuário
            expect(podcastsRepo.atualizarPodcast).toHaveBeenCalledWith(
                expect.objectContaining({ podcodigo: 19, usucodigo: 2 })
            );
        });
    });

    // Caso de Uso: Deletar Podcast
    describe('Deletar Podcast (POST /meusPodcasts/deletar/:podcodigo)', () => {
        it('Teste 16: deve deletar um podcast do usuário', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.deletarPodcast.mockResolvedValue(true);
            const response = await agent
                .post('/meusPodcasts/deletar/19')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.deletarPodcast).toHaveBeenCalledWith('19', 1);
        });

        it('Teste 17: não deve deletar podcast de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.deletarPodcast.mockResolvedValue(false);
            const response = await agent
                .post('/meusPodcasts/deletar/19')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            // A proteção é via SQL (DELETE ... WHERE usucodigo = ?)
            expect(podcastsRepo.deletarPodcast).toHaveBeenCalledWith('19', 2);
        });
    });

    // Caso de Uso: Adicionar Episódio
    describe('Adicionar Episódio (POST /meusEpisodios/:podcodigo/adicionar)', () => {
        it('Teste 18: deve adicionar um novo episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.inserirEpisodio.mockResolvedValue(1);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/adicionar')
                .send({
                    epititulo: 'Novo Episódio',
                    epidescricao: 'Descrição do novo episódio',
                    epiurl: '/images/novo.jpg',
                    epiaudio: 'novoepisodio.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.inserirEpisodio).toHaveBeenCalledWith({
                podcodigo: 19,
                usucodigo: 1,
                epititulo: 'Novo Episódio',
                epidescricao: 'Descrição do novo episódio',
                epiurl: '/images/novo.jpg',
                epiaudio: 'novoepisodio.mp3',
                epinumero: 2,
                epiduracao: 180,
                epireproducoes: 0,
                epidata: expect.any(String)
            });
        });

        it('Teste 19: não deve adicionar episódio se podcast não pertence ao usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/adicionar')
                .send({
                    epititulo: 'Novo Episódio',
                    epidescricao: 'Descrição do novo episódio',
                    epiurl: '/images/novo.jpg',
                    epiaudio: 'novoepisodio.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(episodiosRepo.inserirEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Atualizar Episódio
    describe('Atualizar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo)', () => {
        it('Teste 20: deve atualizar um episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.atualizarEpisodio.mockResolvedValue(true);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4')
                .send({
                    epititulo: 'Fluminense bate Ulsan Atualizado',
                    epidescricao: 'Jogo incrível atualizado',
                    epiurl: 'teste 3',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 0,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.atualizarEpisodio).toHaveBeenCalledWith({
                epicodigo: 4,
                podcodigo: 19,
                epititulo: 'Fluminense bate Ulsan Atualizado',
                epidescricao: 'Jogo incrível atualizado',
                epiurl: 'teste 3',
                epiaudio: 'episodio1.mp3',
                epinumero: 0,
                epiduracao: 120,
                epireproducoes: 0,
                epidata: expect.any(String)
            });
        });

        it('Teste 21: não deve atualizar episódio de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4')
                .send({
                    epititulo: 'Fluminense bate Ulsan Atualizado',
                    epidescricao: 'Jogo incrível atualizado',
                    epiurl: 'teste 3',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 0,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.atualizarEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Deletar Episódio
    describe('Deletar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo/delete)', () => {
        it('Teste 22: deve deletar um episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.deletarEpisodio.mockResolvedValue(true);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4/delete')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.deletarEpisodio).toHaveBeenCalledWith('4', '19');
        });

        it('Teste 23: não deve deletar episódio de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4/delete')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.deletarEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Página Inicial
    describe('Página Inicial (GET /)', () => {
        it('Teste 24: deve retornar 200 e renderizar index', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            expect(response.text).toContain('PodWave');
        });
    });

    // Caso de Uso: Integração - Login + Listar Podcasts
    describe('Integração: Login + Listar Podcasts', () => {
        it('Teste 25: deve autenticar usuário e listar podcasts', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([
                { podcodigo: 9, podnome: 'Inovação Hoje', podcategoria: 'Empreendedorismo' }
            ]);
            podcastsRepo.buscarCategorias.mockResolvedValue([
                { catcodigo: 1, catnome: 'Empreendedorismo' }
            ]);

            const response = await agent.get('/listas').expect(200);
            expect(response.text).toContain('Inovação Hoje');
            expect(response.text).toContain('Empreendedorismo');
        });
    });

    // Caso de Uso: Integração - Cadastro + Login
    describe('Integração: Cadastro + Login', () => {
        it('Teste 26: deve cadastrar usuário e permitir login', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue(null);
            usuariosRepo.inserirUsuario.mockResolvedValue(1);
            const uniqueEmail = `test_${Date.now()}@example.com`;
            const signupResponse = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(signupResponse.headers.location).toBe('/login');

            usuariosRepo.buscarUsuario.mockResolvedValue({
                usucodigo: 1,
                usuemail: uniqueEmail
            });
            const loginResponse = await request(app)
                .post('/login')
                .send({ email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(loginResponse.headers.location).toBe('/listas');
        });
    });

    // Caso de Uso: Logout
    describe('Logout (POST /usuarios/logout)', () => {
        it('Teste 27: deve encerrar a sessão e voltar para o login', async () => {
            const agent = await loginAs(USER_1);
            await agent.post('/usuarios/logout').expect(302).expect('location', '/login');
            // Sem sessão, rota protegida volta a redirecionar
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });
    });
});
```

- [ ] **Step 2: Rodar só este arquivo**

```bash
npm test -- tests/app.test.js
```

Esperado: `Tests: 26 passed, 26 total` (Testes 1–6, 8–27; o arquivo original também não tinha "Teste 7").

- [ ] **Step 3: Commit**

```bash
git add tests/app.test.js
git commit -m "test: porta os testes unitários para ESM com mocks de repositories e sessão real"
```

---

## Tarefa 10: Reescrever tests/integration.test.js (banco real)

**Files:**
- Rewrite: `tests/integration.test.js`

Mudanças estruturais: imports dos repositories e do pool (`src/config/database.js`) no lugar de `banco.js`/`global.connection`; o helper `login()` devolve um **agente** do supertest (cookie de sessão) e cada teste usa o agente para as requisições autenticadas. Os 20 testes originais + 1 novo de logout.

- [ ] **Step 1: Substituir o conteúdo de `tests/integration.test.js` por:**

```js
/**
 * Testes de integração: exercitam as rotas HTTP contra o MariaDB real
 * (container podwave-db, porta 3307), sem nenhum mock.
 *
 * Pré-requisito: docker compose up -d
 *
 * Cada execução usa um prefixo único (RUN) nos dados criados e o afterAll
 * remove tudo na ordem inversa das FKs, então a base volta ao estado original.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/database.js';
import { inserirUsuario, buscarUsuarioPorEmail } from '../src/repositories/usuarios.repository.js';
import {
    inserirPodcast,
    buscarPodcastPorId,
    buscarPodcastsPorUsuario,
    buscarCategorias
} from '../src/repositories/podcasts.repository.js';
import {
    inserirEpisodio,
    buscarEpisodioPorId,
    buscarEpisodiosPorPodcast
} from '../src/repositories/episodios.repository.js';
import { buscarComentariosPorEpisodio } from '../src/repositories/comentarios.repository.js';
import { buscarAvaliacaoPorUsuario } from '../src/repositories/avaliacoes.repository.js';
import { verificarFavorito } from '../src/repositories/favoritos.repository.js';
import { buscarProgressoPorUsuario } from '../src/repositories/progresso.repository.js';

jest.setTimeout(30000);

const RUN = `it${Date.now()}`;
const userA = { nome: `${RUN} Usuário A`, email: `${RUN}_a@teste.podwave`, password: 'senhaA123' };
const userB = { nome: `${RUN} Usuário B`, email: `${RUN}_b@teste.podwave`, password: 'senhaB123' };

// Loga pelo fluxo real e devolve um agente que carrega o cookie de sessão
async function login(usuario) {
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email: usuario.email, password: usuario.password })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');
    return agent;
}

let categoria; // primeira categoria real do banco, usada nos podcasts de teste

beforeAll(async () => {
    userA.usucodigo = await inserirUsuario(userA);
    userB.usucodigo = await inserirUsuario(userB);
    [categoria] = await buscarCategorias();
});

afterAll(async () => {
    // Varre também sobras de execuções anteriores abortadas (qualquer it<timestamp>_*)
    const like = 'it%@teste.podwave';
    const [usuarios] = await pool.query('SELECT usucodigo FROM usuarios WHERE usuemail LIKE ?', [like]);
    const ids = usuarios.map(u => u.usucodigo);
    if (ids.length > 0) {
        await pool.query('DELETE FROM progresso_reproducao WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM favoritos WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM avaliacoes WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM comentarios WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM episodios WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM podcasts WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM usuarios WHERE usucodigo IN (?)', [ids]);
    }
    await pool.end();
});

describe('Integração - PodWave (banco real)', () => {

    describe('Cadastro (POST /signup)', () => {
        const novo = { nome: `${RUN} Novato`, email: `${RUN}_novo@teste.podwave`, password: 'senha123' };

        it('deve persistir um novo usuário no banco', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ name: novo.nome, email: novo.email, password: novo.password })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');

            const salvo = await buscarUsuarioPorEmail(novo.email);
            expect(salvo).not.toBeNull();
            expect(salvo.usunome).toBe(novo.nome);
        });

        it('deve rejeitar email já cadastrado sem duplicar o usuário', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Impostor', email: novo.email, password: 'outrasenha' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/signup?error=Email%20j%C3%A1%20cadastrado');

            const salvo = await buscarUsuarioPorEmail(novo.email);
            expect(salvo.usunome).toBe(novo.nome); // continua o registro original
        });
    });

    describe('Autenticação (POST /login)', () => {
        it('deve logar com credenciais válidas persistidas no banco', async () => {
            const agent = await login(userA);
            // A sessão vale para a próxima requisição do mesmo agente
            await agent.get('/meusPodcasts').expect(200);
        });

        it('deve bloquear login com senha errada', async () => {
            const agent = request.agent(app);
            const response = await agent
                .post('/login')
                .send({ email: userA.email, password: 'senha-errada' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login?erro=1');
            // Sem sessão, rota protegida redireciona
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });

        it('deve encerrar a sessão no logout', async () => {
            const agent = await login(userA);
            await agent.post('/usuarios/logout').expect(302).expect('location', '/login');
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });
    });

    describe('Fluxo de podcast (CRUD via /meusPodcasts)', () => {
        const podnome = `${RUN} Podcast A`;

        it('deve criar um podcast e exibi-lo em /meusPodcasts e /listas', async () => {
            const agent = await login(userA);
            await agent
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome,
                    poddescricao: 'Criado pelo teste de integração',
                    podurl: '/images/figura01.jpg',
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const meus = await agent.get('/meusPodcasts').expect(200);
            expect(meus.text).toContain(podnome);

            const listas = await agent.get('/listas').expect(200);
            expect(listas.text).toContain(podnome);
        });

        it('deve atualizar o podcast no banco', async () => {
            const agent = await login(userA);
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            await agent
                .post(`/meusPodcasts/editar/${podcast.podcodigo}`)
                .send({
                    podnome: `${podnome} (editado)`,
                    poddescricao: 'Descrição editada',
                    podurl: podcast.podurl,
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const atualizado = await buscarPodcastPorId(podcast.podcodigo);
            expect(atualizado.podnome).toBe(`${podnome} (editado)`);
            expect(atualizado.poddescricao).toBe('Descrição editada');
        });

        it('não deve permitir que outro usuário edite o podcast', async () => {
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            const agent = await login(userB);
            await agent
                .post(`/meusPodcasts/editar/${podcast.podcodigo}`)
                .send({
                    podnome: 'Invadido',
                    poddescricao: 'Não deveria salvar',
                    podurl: 'x',
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);

            const intacto = await buscarPodcastPorId(podcast.podcodigo);
            expect(intacto.podnome).toBe(`${podnome} (editado)`); // permanece como o dono deixou
        });

        it('não deve permitir que outro usuário delete o podcast', async () => {
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            const agent = await login(userB);
            await agent
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302);

            expect(await buscarPodcastPorId(podcast.podcodigo)).not.toBeNull();
        });

        it('deve deletar o podcast quando o dono solicita', async () => {
            const agent = await login(userA);
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            await agent
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302)
                .expect('location', '/meusPodcasts');

            expect(await buscarPodcastPorId(podcast.podcodigo)).toBeNull();
        });

        it('deve redirecionar para /login quando não autenticado', async () => {
            await request(app)
                .get('/meusPodcasts')
                .expect(302)
                .expect('location', '/login');
        });
    });

    describe('Fluxo de episódio (CRUD via /meusEpisodios)', () => {
        let podcodigo;
        const epititulo = `${RUN} Episódio 1`;

        beforeAll(async () => {
            podcodigo = await inserirPodcast({
                podnome: `${RUN} Podcast Episódios`,
                poddescricao: 'Suporte aos testes de episódio',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
        });

        it('deve criar um episódio e exibi-lo na listagem do podcast', async () => {
            const agent = await login(userA);
            await agent
                .post(`/meusEpisodios/${podcodigo}/adicionar`)
                .send({
                    epititulo,
                    epidescricao: 'Episódio do teste de integração',
                    epiurl: '/images/figura01.jpg',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 1,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            expect(episodio.epititulo).toBe(epititulo);

            const pagina = await agent.get(`/episodios/${podcodigo}`).expect(200);
            expect(pagina.text).toContain(epititulo);
        });

        it('não deve criar episódio em podcast de outro usuário', async () => {
            const agent = await login(userB);
            await agent
                .post(`/meusEpisodios/${podcodigo}/adicionar`)
                .send({ epititulo: 'Invasor', epinumero: 99 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const episodios = await buscarEpisodiosPorPodcast(podcodigo);
            expect(episodios).toHaveLength(1);
        });

        it('deve atualizar o episódio no banco', async () => {
            const agent = await login(userA);
            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            await agent
                .post(`/meusEpisodios/${podcodigo}/${episodio.epicodigo}`)
                .send({
                    epititulo: `${epititulo} (editado)`,
                    epidescricao: 'Descrição editada',
                    epiurl: episodio.epiurl,
                    epiaudio: 'episodio1.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            const atualizado = await buscarEpisodioPorId(episodio.epicodigo);
            expect(atualizado.epititulo).toBe(`${epititulo} (editado)`);
            expect(atualizado.epinumero).toBe(2);
        });

        it('deve deletar o episódio quando o dono solicita', async () => {
            const agent = await login(userA);
            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            await agent
                .post(`/meusEpisodios/${podcodigo}/${episodio.epicodigo}/delete`)
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            expect(await buscarEpisodioPorId(episodio.epicodigo)).toBeNull();
        });
    });

    describe('Interações com episódio (comentário, avaliação, favorito, progresso)', () => {
        let podcodigo;
        let epicodigo;

        beforeAll(async () => {
            podcodigo = await inserirPodcast({
                podnome: `${RUN} Podcast Interações`,
                poddescricao: 'Suporte aos testes de interação',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
            epicodigo = await inserirEpisodio({
                podcodigo,
                usucodigo: userA.usucodigo,
                epititulo: `${RUN} Episódio Interações`,
                epidescricao: 'Episódio para comentar/avaliar/favoritar',
                epiurl: '/images/figura01.jpg',
                epiaudio: 'episodio1.mp3',
                epiduracao: 120,
                epidata: new Date().toISOString().split('T')[0],
                epinumero: 1,
                epireproducoes: 0
            });
        });

        it('deve gravar um comentário e exibi-lo na página do episódio', async () => {
            const agent = await login(userB);
            const texto = `${RUN} ótimo episódio!`;
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/comentar`)
                .send({ comentario: texto })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}`);

            const comentarios = await buscarComentariosPorEpisodio(epicodigo);
            expect(comentarios.some(c => c.comtexto === texto)).toBe(true);

            const pagina = await agent.get(`/episodios/${podcodigo}/${epicodigo}`).expect(200);
            expect(pagina.text).toContain(texto);
        });

        it('deve gravar uma avaliação e atualizá-la em novo envio', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 4 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}?avaliacao=4`);
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(4);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 5 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve rejeitar nota fora do intervalo 1-5', async () => {
            const agent = await login(userB);
            const response = await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 9 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toContain('error=');
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve favoritar e desfavoritar o episódio (toggle)', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await verificarFavorito(userB.usucodigo, epicodigo)).toBe(true);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await verificarFavorito(userB.usucodigo, epicodigo)).toBe(false);
        });

        it('deve gravar e sobrescrever o progresso de reprodução', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 45 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(45);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 90 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(90);
        });

        it('deve exigir login para interagir com episódios', async () => {
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/comentar`)
                .send({ comentario: 'anônimo' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/login');
        });
    });
});
```

- [ ] **Step 2: Rodar só este arquivo** (banco de pé: `docker compose up -d`)

```bash
npm test -- tests/integration.test.js
```

Esperado: `Tests: 21 passed, 21 total`.

- [ ] **Step 3: Commit**

```bash
git add tests/integration.test.js
git commit -m "test: porta os testes de integração para ESM com sessão por agente"
```

---

## Tarefa 11: Suíte completa verde

- [ ] **Step 1: Rodar tudo**

```bash
npm test
```

Esperado: `Test Suites: 2 passed, 2 total` / `Tests: 47 passed, 47 total`.

Se algo falhar: use a skill superpowers:systematic-debugging antes de mexer no código — a causa mais provável é diferença de tipo (número vs. string) em asserções `toHaveBeenCalledWith` ou mock de repository faltando no `unstable_mockModule`.

- [ ] **Step 2: Commit do relatório regenerado (se mudou)**

```bash
git add relatorio-testes/
git commit -m "test: atualiza relatório HTML da suíte" || echo "nada a commitar"
```

---

## Tarefa 12: Remover o código antigo

**Files:**
- Delete: `app.js`, `banco.js`, `bin/www`, `routes/` (os 7 arquivos)

- [ ] **Step 1: Confirmar que nada mais referencia os arquivos antigos**

```bash
grep -rn "require('../banco')\|require('./banco')\|require('../app')\|require('./app')\|bin/www" src/ tests/ package.json
```

Esperado: nenhuma ocorrência.

- [ ] **Step 2: Deletar**

```bash
git rm -r app.js banco.js bin routes
```

- [ ] **Step 3: Rodar a suíte de novo**

```bash
npm test
```

Esperado: `Tests: 47 passed, 47 total`.

- [ ] **Step 4: Smoke test manual do servidor**

```bash
node --env-file-if-exists=.env src/server.js & SERVER_PID=$!
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # esperado: 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/listas    # esperado: 302 (sem sessão)
kill $SERVER_PID
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove o código antigo da raiz (app.js, banco.js, bin/www, routes/)"
```

---

## Tarefa 13: Atualizar o README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Adicionar a seção "Estrutura do projeto"** logo após a seção "Stack":

````markdown
## Estrutura do projeto

```
src/
├── app.js           # montagem do Express (middlewares, rotas, erros)
├── server.js        # entry point: sobe o servidor
├── config/          # pool de conexão com o banco
├── middlewares/     # requireLogin (autenticação via sessão)
├── routes/          # mapeiam URL → controller
├── controllers/     # req/res, validação, render
├── repositories/    # SQL, um arquivo por entidade
└── views/           # templates EJS
public/              # assets estáticos (imagens, áudios, CSS)
tests/               # testes unitários (mocks) e de integração (banco real)
```
````

- [ ] **Step 2: Atualizar a linha da suíte na seção "Testes"** — trocar:

> A suíte (Jest + Supertest) cobre cadastro, login, exploração, comentários e o CRUD de podcasts/episódios com regras de autorização.

por:

> A suíte (Jest + Supertest) cobre cadastro, login/logout com sessão, exploração, comentários e o CRUD de podcasts/episódios com regras de autorização — 26 testes unitários (repositories mockados) e 21 de integração contra o banco real (exigem `docker compose up -d`).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: documenta a estrutura em camadas no README"
```

---

## Tarefa 14: Integrar a branch

- [ ] **Step 1: Verificação final na branch**

```bash
npm test && git log --oneline main..HEAD
```

Esperado: 47/47 verdes e a lista de commits da refatoração.

- [ ] **Step 2: Merge e push** (siga a skill superpowers:finishing-a-development-branch)

```bash
git checkout main
git merge --no-ff refactor/reorganizacao-profissional -m "refactor: reorganiza o app em camadas src/ com ESM e sessão real"
git push origin main
git branch -d refactor/reorganizacao-profissional
```
