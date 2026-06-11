/**
 * Testes de integração: exercitam as rotas HTTP contra o MariaDB real
 * (container podwave-db, porta 3307), sem nenhum mock de banco.js.
 *
 * Pré-requisito: docker compose up -d
 *
 * Cada execução usa um prefixo único (RUN) nos dados criados e o afterAll
 * remove tudo na ordem inversa das FKs, então a base volta ao estado original.
 */
const request = require('supertest');
const banco = require('../banco');
const app = require('../app');

// As rotas de login usam global.banco (definido em bin/www em produção)
global.banco = banco;

jest.setTimeout(30000);

const RUN = `it${Date.now()}`;
const userA = { nome: `${RUN} Usuário A`, email: `${RUN}_a@teste.podwave`, password: 'senhaA123' };
const userB = { nome: `${RUN} Usuário B`, email: `${RUN}_b@teste.podwave`, password: 'senhaB123' };

async function login(usuario) {
    await request(app)
        .post('/login')
        .send({ email: usuario.email, password: usuario.password })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');
}

let categoria; // primeira categoria real do banco, usada nos podcasts de teste

beforeAll(async () => {
    userA.usucodigo = await banco.inserirUsuario(userA);
    userB.usucodigo = await banco.inserirUsuario(userB);
    [categoria] = await banco.buscarCategorias();
});

afterAll(async () => {
    const pool = global.connection;
    // Varre também sobras de execuções anteriores abortadas (qualquer it<timestamp>_*)
    const like = 'it%@teste.podwave';
    const [usuarios] = await pool.query('SELECT usucodigo FROM usuarios WHERE usuemail LIKE ?', [like]);
    const ids = usuarios.map(u => u.usucodigo);
    if (ids.length > 0) {
        await pool.query('DELETE FROM progresso_reproducao WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM favoritos WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM avaliacoes WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM comentarios WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM episodios WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM podcasts WHERE usucodigo IN (?)', [ids]);
        await pool.query('DELETE FROM usuarios WHERE usucodigo IN (?)', [ids]);
    }
    await pool.end();
    global.connection = null;
});

beforeEach(() => {
    // Estado de sessão é global no app; cada teste parte deslogado
    global.usuarioCodigo = null;
    global.usuarioEmail = null;
});

describe('Integração - PodWave (banco real)', () => {

    describe('Cadastro (POST /signup)', () => {
        const novo = { nome: `${RUN} Novato`, email: `${RUN}_novo@teste.podwave`, password: 'senha123' };

        it('deve persistir um novo usuário no banco', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ name: novo.nome, email: novo.email, password: novo.password })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');

            const salvo = await banco.buscarUsuarioPorEmail(novo.email);
            expect(salvo).not.toBeNull();
            expect(salvo.usunome).toBe(novo.nome);
        });

        it('deve rejeitar email já cadastrado sem duplicar o usuário', async () => {
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Impostor', email: novo.email, password: 'outrasenha' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/signup?error=Email%20j%C3%A1%20cadastrado');

            const salvo = await banco.buscarUsuarioPorEmail(novo.email);
            expect(salvo.usunome).toBe(novo.nome); // continua o registro original
        });
    });

    describe('Autenticação (POST /login)', () => {
        it('deve logar com credenciais válidas persistidas no banco', async () => {
            await login(userA);
            expect(global.usuarioCodigo).toBe(userA.usucodigo);
            expect(global.usuarioEmail).toBe(userA.email);
        });

        it('deve bloquear login com senha errada', async () => {
            const response = await request(app)
                .post('/login')
                .send({ email: userA.email, password: 'senha-errada' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login?erro=1');
            expect(global.usuarioCodigo).toBeNull();
        });
    });

    describe('Fluxo de podcast (CRUD via /meusPodcasts)', () => {
        const podnome = `${RUN} Podcast A`;

        it('deve criar um podcast e exibi-lo em /meusPodcasts e /listas', async () => {
            await login(userA);
            await request(app)
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome,
                    poddescricao: 'Criado pelo teste de integração',
                    podurl: '/images/figura01.jpg',
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const meus = await request(app).get('/meusPodcasts').expect(200);
            expect(meus.text).toContain(podnome);

            const listas = await request(app).get('/listas').expect(200);
            expect(listas.text).toContain(podnome);
        });

        it('deve atualizar o podcast no banco', async () => {
            await login(userA);
            const [podcast] = await banco.buscarPodcastsPorUsuario(userA.usucodigo);
            await request(app)
                .post(`/meusPodcasts/editar/${podcast.podcodigo}`)
                .send({
                    podnome: `${podnome} (editado)`,
                    poddescricao: 'Descrição editada',
                    podurl: podcast.podurl,
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const atualizado = await banco.buscarPodcastPorId(podcast.podcodigo);
            expect(atualizado.podnome).toBe(`${podnome} (editado)`);
            expect(atualizado.poddescricao).toBe('Descrição editada');
        });

        it('não deve permitir que outro usuário edite o podcast', async () => {
            const [podcast] = await banco.buscarPodcastsPorUsuario(userA.usucodigo);
            await login(userB);
            await request(app)
                .post(`/meusPodcasts/editar/${podcast.podcodigo}`)
                .send({
                    podnome: 'Invadido',
                    poddescricao: 'Não deveria salvar',
                    podurl: 'x',
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);

            const intacto = await banco.buscarPodcastPorId(podcast.podcodigo);
            expect(intacto.podnome).toBe(`${podnome} (editado)`); // permanece como o dono deixou
        });

        it('não deve permitir que outro usuário delete o podcast', async () => {
            const [podcast] = await banco.buscarPodcastsPorUsuario(userA.usucodigo);
            await login(userB);
            await request(app)
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302);

            expect(await banco.buscarPodcastPorId(podcast.podcodigo)).not.toBeNull();
        });

        it('deve deletar o podcast quando o dono solicita', async () => {
            await login(userA);
            const [podcast] = await banco.buscarPodcastsPorUsuario(userA.usucodigo);
            await request(app)
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302)
                .expect('location', '/meusPodcasts');

            expect(await banco.buscarPodcastPorId(podcast.podcodigo)).toBeNull();
        });

        it('deve redirecionar para /login quando não autenticado', async () => {
            await request(app)
                .get('/meusPodcasts')
                .expect(302)
                .expect('location', '/login');
        });
    });

    describe('Fluxo de episódio (CRUD via /meusEpisodios)', () => {
        let podcodigo;
        const epititulo = `${RUN} Episódio 1`;

        beforeAll(async () => {
            podcodigo = await banco.inserirPodcast({
                podnome: `${RUN} Podcast Episódios`,
                poddescricao: 'Suporte aos testes de episódio',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
        });

        it('deve criar um episódio e exibi-lo na listagem do podcast', async () => {
            await login(userA);
            await request(app)
                .post(`/meusEpisodios/${podcodigo}/adicionar`)
                .send({
                    epititulo,
                    epidescricao: 'Episódio do teste de integração',
                    epiurl: '/images/figura01.jpg',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 1,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            const [episodio] = await banco.buscarEpisodiosPorPodcast(podcodigo);
            expect(episodio.epititulo).toBe(epititulo);

            const pagina = await request(app).get(`/episodios/${podcodigo}`).expect(200);
            expect(pagina.text).toContain(epititulo);
        });

        it('não deve criar episódio em podcast de outro usuário', async () => {
            await login(userB);
            await request(app)
                .post(`/meusEpisodios/${podcodigo}/adicionar`)
                .send({ epititulo: 'Invasor', epinumero: 99 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const episodios = await banco.buscarEpisodiosPorPodcast(podcodigo);
            expect(episodios).toHaveLength(1);
        });

        it('deve atualizar o episódio no banco', async () => {
            await login(userA);
            const [episodio] = await banco.buscarEpisodiosPorPodcast(podcodigo);
            await request(app)
                .post(`/meusEpisodios/${podcodigo}/${episodio.epicodigo}`)
                .send({
                    epititulo: `${epititulo} (editado)`,
                    epidescricao: 'Descrição editada',
                    epiurl: episodio.epiurl,
                    epiaudio: 'episodio1.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            const atualizado = await banco.buscarEpisodioPorId(episodio.epicodigo);
            expect(atualizado.epititulo).toBe(`${epititulo} (editado)`);
            expect(atualizado.epinumero).toBe(2);
        });

        it('deve deletar o episódio quando o dono solicita', async () => {
            await login(userA);
            const [episodio] = await banco.buscarEpisodiosPorPodcast(podcodigo);
            await request(app)
                .post(`/meusEpisodios/${podcodigo}/${episodio.epicodigo}/delete`)
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            expect(await banco.buscarEpisodioPorId(episodio.epicodigo)).toBeNull();
        });
    });

    describe('Interações com episódio (comentário, avaliação, favorito, progresso)', () => {
        let podcodigo;
        let epicodigo;

        beforeAll(async () => {
            podcodigo = await banco.inserirPodcast({
                podnome: `${RUN} Podcast Interações`,
                poddescricao: 'Suporte aos testes de interação',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
            epicodigo = await banco.inserirEpisodio({
                podcodigo,
                usucodigo: userA.usucodigo,
                epititulo: `${RUN} Episódio Interações`,
                epidescricao: 'Episódio para comentar/avaliar/favoritar',
                epiurl: '/images/figura01.jpg',
                epiaudio: 'episodio1.mp3',
                epiduracao: 120,
                epidata: new Date().toISOString().split('T')[0],
                epinumero: 1,
                epireproducoes: 0
            });
        });

        it('deve gravar um comentário e exibi-lo na página do episódio', async () => {
            await login(userB);
            const texto = `${RUN} ótimo episódio!`;
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/comentar`)
                .send({ comentario: texto })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}`);

            const comentarios = await banco.buscarComentariosPorEpisodio(epicodigo);
            expect(comentarios.some(c => c.comtexto === texto)).toBe(true);

            const pagina = await request(app).get(`/episodios/${podcodigo}/${epicodigo}`).expect(200);
            expect(pagina.text).toContain(texto);
        });

        it('deve gravar uma avaliação e atualizá-la em novo envio', async () => {
            await login(userB);
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 4 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}?avaliacao=4`);
            expect((await banco.buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(4);

            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 5 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await banco.buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve rejeitar nota fora do intervalo 1-5', async () => {
            await login(userB);
            const response = await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 9 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toContain('error=');
            expect((await banco.buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve favoritar e desfavoritar o episódio (toggle)', async () => {
            await login(userB);
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await banco.verificarFavorito(userB.usucodigo, epicodigo)).toBe(true);

            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await banco.verificarFavorito(userB.usucodigo, epicodigo)).toBe(false);
        });

        it('deve gravar e sobrescrever o progresso de reprodução', async () => {
            await login(userB);
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 45 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await banco.buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(45);

            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 90 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await banco.buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(90);
        });

        it('deve exigir login para interagir com episódios', async () => {
            await request(app)
                .post(`/episodios/${podcodigo}/${epicodigo}/comentar`)
                .send({ comentario: 'anônimo' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/login');
        });
    });
});
