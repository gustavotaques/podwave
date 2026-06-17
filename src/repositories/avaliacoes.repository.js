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
