import bcrypt from 'bcrypt';
import pool from '../config/database.js';

export async function inserirUsuario(usuario) {
  const hash = await bcrypt.hash(usuario.password, 10);
  const sql = 'INSERT INTO usuarios (usunome, usuemail, ususenha) VALUES (?, ?, ?)';
  const [result] = await pool.query(sql, [usuario.nome, usuario.email, hash]);
  return result && result.affectedRows > 0 ? result.insertId : null;
}

export async function buscarUsuario(usuario) {
  const sql = 'SELECT * FROM usuarios WHERE usuemail = ?';
  const [rows] = await pool.query(sql, [usuario.email]);
  if (rows.length === 0) {return null;}
  const match = await bcrypt.compare(usuario.password, rows[0].ususenha);
  return match ? rows[0] : null;
}

export async function buscarUsuarioPorEmail(email) {
  const sql = 'SELECT * FROM usuarios WHERE usuemail = ?';
  const [rows] = await pool.query(sql, [email]);
  return rows.length > 0 ? rows[0] : null;
}
