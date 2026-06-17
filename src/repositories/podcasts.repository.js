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
