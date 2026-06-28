import mysql from 'mysql2/promise';

// Pool em vez de conexão única: conexões derrubadas pelo servidor
// (wait_timeout, restart do container) são descartadas e recriadas
// automaticamente, em vez de ficarem mortas no cache.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'podwave',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

export default pool;
