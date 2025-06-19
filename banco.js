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
            charset: 'utf8mb4' // Adicionando suporte para UTF-8
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
    podcast.catcodigo || 10 // Default: 'Geral' (catcodigo 10)
  ]);
  return result;
}

async function buscarPodcastsPorUsuario(usucodigo) {
    const conn = await global.connection;
    try {
        const [rows] = await conn.query(
            'SELECT podcodigo, podnome, poddescricao, podurl, podcategoria FROM podcasts WHERE usucodigo = ?',
            [usucodigo]
        );
        return rows;
    } catch (err) {
        console.error('Erro ao buscar podcasts:', err);
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

connectDB()

module.exports = {
  buscarUsuario,
  inserirUsuario,
  buscarUsuarioPorEmail,
  buscarPodcastsPorUsuario,
  buscarTodosPodcasts,
  buscarPodcastsPorCategoria,
  buscarCategorias,
  inserirPodcast,
  inserirCategoria
};