const mysql = require('mysql2/promise');

async function connectDB() {
    if (global.connection && global.connection.state !== 'disconnected') {
        return global.connection;
    }

    const connection = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'podwave',
        charset: 'utf8mb4'
    });

    console.log('Conectou ao MySQL!');
    global.connection = connection;
    return global.connection;
}

// Usuários
async function inserirUsuario(usuario) {
    const conexao = await connectDB();
    const sql = 'INSERT INTO usuarios (usunome, usuemail, ususenha) VALUES (?, ?, ?)';
    const [result] = await conexao.query(sql, [usuario.nome, usuario.email, usuario.password]);
    return result && result.affectedRows > 0 ? result.insertId : null;
}

async function buscarUsuario(usuario) {
    const conexao = await connectDB();
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ? AND ususenha = ?';
    const [rows] = await conexao.query(sql, [usuario.email, usuario.password]);
    return rows.length > 0 ? rows[0] : null;
}

async function buscarUsuarioPorEmail(email) {
    const conexao = await connectDB();
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ?';
    const [rows] = await conexao.query(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
}

// Podcasts
async function inserirPodcast(podcast) {
    const conn = await connectDB();
    const sql = 'INSERT INTO podcasts (podnome, poddescricao, podurl, usucodigo, catcodigo) VALUES (?, ?, ?, ?, ?)';
    const [result] = await conn.query(sql, [
        podcast.podnome,
        podcast.poddescricao,
        podcast.podurl,
        podcast.usucodigo,
        podcast.catcodigo || (await buscarCatcodigoPorNome('Geral'))
    ]);
    return result.insertId;
}

async function buscarPodcastsPorUsuario(usucodigo) {
    const conn = await connectDB();
    try {
        const [rows] = await conn.query(
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

async function buscarPodcastsPorCategoria(catcodigo) {
    const conn = await connectDB();
    try {
        const [rows] = await conn.query(
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

async function buscarTodosPodcasts() {
    const conn = await connectDB();
    try {
        const [rows] = await conn.query(
            'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, c.catnome AS podcategoria ' +
            'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo'
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar todos os podcasts:', err);
        return [];
    }
}

async function buscarCategorias() {
    const conn = await connectDB();
    try {
        const [rows] = await conn.query('SELECT catcodigo, catnome FROM categorias');
        return rows;
    } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        return [];
    }
}

async function inserirCategoria(catnome) {
    const conn = await connectDB();
    try {
        const [result] = await conn.query(
            'INSERT INTO categorias (catnome) VALUES (?) ON DUPLICATE KEY UPDATE catnome = ?',
            [catnome, catnome]
        );
        const [row] = await conn.query('SELECT catcodigo FROM categorias WHERE catnome = ?', [catnome]);
        return row[0].catcodigo;
    } catch (err) {
        console.error('Erro ao inserir categoria:', err);
        return null;
    }
}

async function buscarPodcastPorId(podcodigo) {
    const conn = await connectDB();
    const [rows] = await conn.query(
        'SELECT p.podcodigo, p.podnome, p.poddescricao, p.podurl, p.usucodigo, p.catcodigo, c.catnome AS podcategoria ' +
        'FROM podcasts p JOIN categorias c ON p.catcodigo = c.catcodigo WHERE p.podcodigo = ?',
        [podcodigo]
    );
    return rows[0] || null;
}

async function atualizarPodcast(podcast) {
    const conn = await connectDB();
    const sql = 'UPDATE podcasts SET podnome = ?, poddescricao = ?, podurl = ?, catcodigo = ? WHERE podcodigo = ? AND usucodigo = ?';
    console.log(`Atualizando podcast podcodigo=${podcast.podcodigo}, usucodigo=${podcast.usucodigo}, dados:`, podcast);
    const [result] = await conn.query(sql, [
        podcast.podnome,
        podcast.poddescricao,
        podcast.podurl,
        podcast.catcodigo,
        podcast.podcodigo,
        podcast.usucodigo
    ]);
    console.log(`Resultado da atualização: affectedRows=${result.affectedRows}`);
    return result.affectedRows > 0;
}

async function deletarPodcast(podcodigo, usucodigo) {
    const conn = await connectDB();
    const sql = 'DELETE FROM podcasts WHERE podcodigo = ? AND usucodigo = ?';
    console.log(`Deletando podcast podcodigo=${podcodigo}, usucodigo=${usucodigo}`);
    const [result] = await conn.query(sql, [podcodigo, usucodigo]);
    console.log(`Resultado da deleção: affectedRows=${result.affectedRows}`);
    return result.affectedRows > 0;
}

async function buscarCatcodigoPorNome(catnome) {
    const conn = await connectDB();
    const [rows] = await conn.query('SELECT catcodigo FROM categorias WHERE catnome = ?', [catnome]);
    return rows[0]?.catcodigo || null;
}

// Episódios
async function buscarEpisodiosPorPodcast(podcodigo) {
    const conn = await connectDB();
    try {
        const [rows] = await conn.query(
            'SELECT epicodigo, podcodigo, epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes FROM episodios WHERE podcodigo = ?',
            [podcodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar episódios por podcast:', err);
        return [];
    }
}

async function inserirEpisodio(episodio) {
    const conn = await connectDB();
    const sql = `
        INSERT INTO episodios (podcodigo, usucodigo, epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
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
    ];
    const [result] = await conn.query(sql, values);
    return result.insertId;
}

async function atualizarEpisodio(episodio) {
    const conn = await connectDB();
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
    const [result] = await conn.query(sql, [
        episodio.epititulo,
        episodio.epidescricao,
        episodio.epiurl,
        episodio.epiduracao,
        episodio.epidata,
        episodio.epinumero,
        episodio.epireproducoes,
        episodio.epiaudio, // Adicionado para atualizar o campo epiaudio
        episodio.epicodigo,
        episodio.podcodigo
    ]);
    return result.affectedRows > 0;
}

async function deletarEpisodio(epicodigo, podcodigo) {
    const conn = await connectDB();
    const sql = 'DELETE FROM episodios WHERE epicodigo = ? AND podcodigo = ?';
    const [result] = await conn.query(sql, [epicodigo, podcodigo]);
    return result.affectedRows > 0;
}

async function buscarEpisodioPorId(epicodigo) {
    const conn = await connectDB();
    const [rows] = await conn.query(
        'SELECT epicodigo, podcodigo, epititulo, epidescricao, epiurl, epiaudio, epiduracao, epidata, epinumero, epireproducoes FROM episodios WHERE epicodigo = ?',
        [epicodigo]
    );
    return rows[0] || null;
}

// Comentários
async function inserirComentario(comentario) {
    const conn = await connectDB();
    const sql = 'INSERT INTO comentarios (usucodigo, epicodigo, comtexto, comdata) VALUES (?, ?, ?, ?)';
    const [result] = await conn.query(sql, [
        comentario.usucodigo,
        comentario.epicodigo,
        comentario.texto,
        comentario.data
    ]);
    return result.insertId;
}

async function buscarComentariosPorEpisodio(epicodigo) {
    const conn = await connectDB();
    const sql = `
        SELECT c.*, u.usuemail AS usuarioEmail
        FROM comentarios c
        JOIN usuarios u ON c.usucodigo = u.usucodigo
        WHERE c.epicodigo = ?
    `;
    const [rows] = await conn.query(sql, [epicodigo]);
    return rows;
}

// Avaliações
async function inserirAvaliacao(avaliacao) {
    const conn = await connectDB();
    const sql = 'INSERT INTO avaliacoes (usucodigo, epicodigo, avanota, avacomentario, avadata) VALUES (?, ?, ?, ?, ?)';
    const [result] = await conn.query(sql, [
        avaliacao.usucodigo,
        avaliacao.epicodigo,
        avaliacao.nota,
        avaliacao.comentario || null,  // Opcional, usa NULL se não fornecido
        avaliacao.data || new Date().toISOString().split('T')[0]  // Opcional, usa data atual
    ]);
    return result.insertId;
}

async function atualizarAvaliacao(avaliacao) {
    const conn = await connectDB();
    const sql = 'UPDATE avaliacoes SET avanota = ?, avacomentario = ?, avadata = ? WHERE usucodigo = ? AND epicodigo = ?';
    const [result] = await conn.query(sql, [
        avaliacao.nota,
        avaliacao.comentario || null,
        avaliacao.data || new Date().toISOString().split('T')[0],
        avaliacao.usucodigo,
        avaliacao.epicodigo
    ]);
    return result.affectedRows > 0;
}

async function buscarAvaliacaoPorUsuario(usucodigo, epicodigo) {
    const conn = await connectDB();
    const sql = 'SELECT avanota FROM avaliacoes WHERE usucodigo = ? AND epicodigo = ?';
    const [rows] = await conn.query(sql, [usucodigo, epicodigo]);
    return rows[0] || null;
}

// Favoritos
async function inserirFavorito(favorito) {
    const conn = await connectDB();
    const sql = 'INSERT INTO favoritos (usucodigo, epicodigo, data) VALUES (?, ?, ?)';
    const [result] = await conn.query(sql, [
        favorito.usucodigo,
        favorito.epicodigo,
        favorito.data || new Date().toISOString().split('T')[0]  // Valor padrão se não fornecido
    ]);
    return result.insertId;
}

async function removerFavorito(usucodigo, epicodigo) {
    const conn = await connectDB();
    const sql = 'DELETE FROM favoritos WHERE usucodigo = ? AND epicodigo = ?';
    const [result] = await conn.query(sql, [usucodigo, epicodigo]);
    return result.affectedRows > 0;
}

async function verificarFavorito(usucodigo, epicodigo) {
    const conn = await connectDB();
    const sql = 'SELECT COUNT(*) as count FROM favoritos WHERE usucodigo = ? AND epicodigo = ?';
    const [rows] = await conn.query(sql, [usucodigo, epicodigo]);
    return rows[0].count > 0;
}

// Progresso
async function inserirProgresso(progresso) {
    const conn = await connectDB();
    const sql = `
        INSERT INTO progresso_reproducao (usucodigo, epicodigo, proprogresso, prodata)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        proprogresso = VALUES(proprogresso),
        prodata = VALUES(prodata)
    `;
    const values = [
        progresso.usucodigo,
        progresso.epicodigo,
        progresso.proprogresso,
        progresso.prodata
    ];
    const [result] = await conn.query(sql, values);
    return result.insertId || result.affectedRows;
}

async function buscarProgressoPorUsuario(usucodigo, epicodigo) {
    const conn = await connectDB();
    const sql = `
        SELECT proprogresso
        FROM progresso_reproducao
        WHERE usucodigo = ? AND epicodigo = ?
        ORDER BY prodata DESC
        LIMIT 1
    `;
    const [rows] = await conn.query(sql, [usucodigo, epicodigo]);
    return rows[0] || null;
}

connectDB();

module.exports = {
    buscarUsuario,
    inserirUsuario,
    buscarUsuarioPorEmail,
    buscarPodcastsPorUsuario,
    buscarTodosPodcasts,
    buscarPodcastsPorCategoria,
    buscarPodcastPorId,
    atualizarPodcast,
    deletarPodcast,
    buscarCategorias,
    inserirPodcast,
    buscarEpisodiosPorPodcast,
    inserirEpisodio,
    atualizarEpisodio,
    deletarEpisodio,
    buscarEpisodioPorId,
    inserirComentario,
    buscarComentariosPorEpisodio,
    inserirAvaliacao,
    atualizarAvaliacao,
    buscarAvaliacaoPorUsuario,
    inserirFavorito,
    removerFavorito,
    verificarFavorito,
    inserirProgresso,
    buscarProgressoPorUsuario,
    buscarCatcodigoPorNome
};