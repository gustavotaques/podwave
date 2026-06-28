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
