const mysql = require('mysql2/promise');

async function connectDB() {
    if (global.connection && global.connection.state !== 'disconnected') {
        return global.connection;
    }

    const connetion = await mysql.createConnection(
        {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'podwave',
            charset: 'utf8mb4'
        }
    );

    console.log('Conectou ao MySQL!');

    global.connection = connetion;
    return global.connection;
}

async function inserirUsuario(usuario) {
    const conexao = await connectDB();
    const sql = 'INSERT INTO usuarios (usunome, usuemail, ususenha) VALUES (?, ?, ?)';
    const [result] = await conexao.query(sql, [usuario.nome, usuario.email, usuario.password]);
    return result && result.length > 0 ? result[0] : {};
}

async function buscarUsuario(usuario) {
    const conexao = await connectDB();
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ? and ususenha = ?';
    const [usuarioEncontrado] = await conexao.query(sql, [usuario.email, usuario.password]);
    return usuarioEncontrado && usuarioEncontrado.length > 0 ? usuarioEncontrado[0] : {};
}

async function buscarUsuarioPorEmail(email) {
    const conexao = await connectDB();
    const sql = 'SELECT * FROM usuarios WHERE usuemail = ?';
    const [rows] = await conexao.query(sql, [email]);
    return rows.length > 0 ? rows[0] : null;
}

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
  return result;
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
  const [result] = await conn.query(sql, [
    podcast.podnome,
    podcast.poddescricao,
    podcast.podurl,
    podcast.catcodigo,
    podcast.podcodigo,
    podcast.usucodigo
  ]);
  return result.affectedRows > 0;
}

async function deletarPodcast(podcodigo, usucodigo) {
  const conn = await connectDB();
  const sql = 'DELETE FROM podcasts WHERE podcodigo = ? AND usucodigo = ?';
  const [result] = await conn.query(sql, [podcodigo, usucodigo]);
  return result.affectedRows > 0;
}

async function buscarCatcodigoPorNome(catnome) {
  const conn = await connectDB();
  const [rows] = await conn.query('SELECT catcodigo FROM categorias WHERE catnome = ?', [catnome]);
  return rows[0]?.catcodigo || null;
}

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

// Função para inserir um episódio
async function inserirEpisodio(episodio) {
  const conn = await connectDB();
  try {
    const sql = 'INSERT INTO episodios (podcodigo, epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await conn.query(sql, [
      episodio.podcodigo,
      episodio.epititulo,
      episodio.epidescricao,
      episodio.epiurl,
      episodio.epiduracao,
      episodio.epidata,
      episodio.epinumero,
      episodio.epireproducoes
    ]);
    return result.insertId;
  } catch (err) {
    console.error('Erro ao inserir episódio:', err);
    return null;
  }
}

// Função para atualizar um episódio
async function atualizarEpisodio(episodio) {
  const conn = await connectDB();
  try {
    const sql = 'UPDATE episodios SET epititulo = ?, epidescricao = ?, epiurl = ?, epiduracao = ?, epidata = ?, epinumero = ?, epireproducoes = ? WHERE epicodigo = ? AND podcodigo = ?';
    const [result] = await conn.query(sql, [
      episodio.epititulo,
      episodio.epidescricao,
      episodio.epiurl,
      episodio.epiduracao,
      episodio.epidata,
      episodio.epinumero,
      episodio.epireproducoes,
      episodio.epicodigo,
      episodio.podcodigo
    ]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error('Erro ao atualizar episódio:', err);
    return false;
  }
}

// Função para deletar um episódio
async function deletarEpisodio(epicodigo, podcodigo) {
  const conn = await connectDB();
  try {
    const sql = 'DELETE FROM episodios WHERE epicodigo = ? AND podcodigo = ?';
    const [result] = await conn.query(sql, [epicodigo, podcodigo]);
    return result.affectedRows > 0;
  } catch (err) {
    console.error('Erro ao deletar episódio:', err);
    return false;
  }
}

connectDB()

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
  inserirEpisodio, // Novo
  atualizarEpisodio, // Novo
  deletarEpisodio // Novo
};