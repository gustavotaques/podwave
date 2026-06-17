import app from './app.js';
import pool from './config/database.js';

const port = Number(process.env.PORT || 3000);

try {
    await pool.query('SELECT 1');
    console.log('Conectou ao MySQL!');
} catch (err) {
    console.error(`Não foi possível conectar ao banco (${err.message}).`);
    console.error('Verifique se o container está rodando: docker compose up -d');
}

const server = app.listen(port, () => {
    console.log(`PodWave no ar em http://localhost:${port}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`A porta ${port} já está em uso.`);
        process.exit(1);
    }
    throw err;
});
