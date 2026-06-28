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
