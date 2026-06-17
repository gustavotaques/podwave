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
