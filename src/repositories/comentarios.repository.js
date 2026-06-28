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
