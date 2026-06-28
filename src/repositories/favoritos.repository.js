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
