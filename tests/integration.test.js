/**
 * Testes de integração: exercitam as rotas HTTP contra o MariaDB real
 * (container podwave-db, porta 3307), sem nenhum mock.
 *
 * Pré-requisito: docker compose up -d
 *
 * Cada execução usa um prefixo único (RUN) nos dados criados e o afterAll
 * remove tudo na ordem inversa das FKs, então a base volta ao estado original.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/database.js';
import { inserirUsuario, buscarUsuarioPorEmail } from '../src/repositories/usuarios.repository.js';
import {
    inserirPodcast,
    buscarPodcastPorId,
    buscarPodcastsPorUsuario,
    buscarCategorias
} from '../src/repositories/podcasts.repository.js';
import {
    inserirEpisodio,
    buscarEpisodioPorId,
    buscarEpisodiosPorPodcast
} from '../src/repositories/episodios.repository.js';
import { buscarComentariosPorEpisodio } from '../src/repositories/comentarios.repository.js';
import { buscarAvaliacaoPorUsuario } from '../src/repositories/avaliacoes.repository.js';
import { verificarFavorito } from '../src/repositories/favoritos.repository.js';
import { buscarProgressoPorUsuario } from '../src/repositories/progresso.repository.js';

jest.setTimeout(30000);

const RUN = `it${Date.now()}`;
const userA = { nome: `${RUN} Usuário A`, email: `${RUN}_a@teste.podwave`, password: 'senhaA123' };
const userB = { nome: `${RUN} Usuário B`, email: `${RUN}_b@teste.podwave`, password: 'senhaB123' };

// Loga pelo fluxo real e devolve um agente que carrega o cookie de sessão
async function login(usuario) {
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email: usuario.email, password: usuario.password })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');
    return agent;
}

let categoria; // primeira categoria real do banco, usada nos podcasts de teste

beforeAll(async () => {
    userA.usucodigo = await inserirUsuario(userA);
    userB.usucodigo = await inserirUsuario(userB);
    [categoria] = await buscarCategorias();
});

afterAll(async () => {
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

            const salvo = await buscarUsuarioPorEmail(novo.email);
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

            const salvo = await buscarUsuarioPorEmail(novo.email);
            expect(salvo.usunome).toBe(novo.nome); // continua o registro original
        });
    });

    describe('Autenticação (POST /login)', () => {
        it('deve logar com credenciais válidas persistidas no banco', async () => {
            const agent = await login(userA);
            // A sessão vale para a próxima requisição do mesmo agente
            await agent.get('/meusPodcasts').expect(200);
        });

        it('deve bloquear login com senha errada', async () => {
            const agent = request.agent(app);
            const response = await agent
                .post('/login')
                .send({ email: userA.email, password: 'senha-errada' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login?erro=1');
            // Sem sessão, rota protegida redireciona
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });

        it('deve encerrar a sessão no logout', async () => {
            const agent = await login(userA);
            await agent.post('/usuarios/logout').expect(302).expect('location', '/login');
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });
    });

    describe('Fluxo de podcast (CRUD via /meusPodcasts)', () => {
        const podnome = `${RUN} Podcast A`;

        it('deve criar um podcast e exibi-lo em /meusPodcasts e /listas', async () => {
            const agent = await login(userA);
            await agent
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

            const meus = await agent.get('/meusPodcasts').expect(200);
            expect(meus.text).toContain(podnome);

            const listas = await agent.get('/listas').expect(200);
            expect(listas.text).toContain(podnome);
        });

        it('deve atualizar o podcast no banco', async () => {
            const agent = await login(userA);
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            await agent
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

            const atualizado = await buscarPodcastPorId(podcast.podcodigo);
            expect(atualizado.podnome).toBe(`${podnome} (editado)`);
            expect(atualizado.poddescricao).toBe('Descrição editada');
        });

        it('não deve permitir que outro usuário edite o podcast', async () => {
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            const agent = await login(userB);
            await agent
                .post(`/meusPodcasts/editar/${podcast.podcodigo}`)
                .send({
                    podnome: 'Invadido',
                    poddescricao: 'Não deveria salvar',
                    podurl: 'x',
                    catcodigo: categoria.catcodigo
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);

            const intacto = await buscarPodcastPorId(podcast.podcodigo);
            expect(intacto.podnome).toBe(`${podnome} (editado)`); // permanece como o dono deixou
        });

        it('não deve permitir que outro usuário delete o podcast', async () => {
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            const agent = await login(userB);
            await agent
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302);

            expect(await buscarPodcastPorId(podcast.podcodigo)).not.toBeNull();
        });

        it('deve deletar o podcast quando o dono solicita', async () => {
            const agent = await login(userA);
            const [podcast] = await buscarPodcastsPorUsuario(userA.usucodigo);
            await agent
                .post(`/meusPodcasts/deletar/${podcast.podcodigo}`)
                .expect(302)
                .expect('location', '/meusPodcasts');

            expect(await buscarPodcastPorId(podcast.podcodigo)).toBeNull();
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
            podcodigo = await inserirPodcast({
                podnome: `${RUN} Podcast Episódios`,
                poddescricao: 'Suporte aos testes de episódio',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
        });

        it('deve criar um episódio e exibi-lo na listagem do podcast', async () => {
            const agent = await login(userA);
            await agent
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

            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            expect(episodio.epititulo).toBe(epititulo);

            const pagina = await agent.get(`/episodios/${podcodigo}`).expect(200);
            expect(pagina.text).toContain(epititulo);
        });

        it('não deve criar episódio em podcast de outro usuário', async () => {
            const agent = await login(userB);
            await agent
                .post(`/meusEpisodios/${podcodigo}/adicionar`)
                .send({ epititulo: 'Invasor', epinumero: 99 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', '/meusPodcasts');

            const episodios = await buscarEpisodiosPorPodcast(podcodigo);
            expect(episodios).toHaveLength(1);
        });

        it('deve atualizar o episódio no banco', async () => {
            const agent = await login(userA);
            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            await agent
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

            const atualizado = await buscarEpisodioPorId(episodio.epicodigo);
            expect(atualizado.epititulo).toBe(`${epititulo} (editado)`);
            expect(atualizado.epinumero).toBe(2);
        });

        it('deve deletar o episódio quando o dono solicita', async () => {
            const agent = await login(userA);
            const [episodio] = await buscarEpisodiosPorPodcast(podcodigo);
            await agent
                .post(`/meusEpisodios/${podcodigo}/${episodio.epicodigo}/delete`)
                .expect(302)
                .expect('location', `/meusEpisodios/${podcodigo}`);

            expect(await buscarEpisodioPorId(episodio.epicodigo)).toBeNull();
        });
    });

    describe('Interações com episódio (comentário, avaliação, favorito, progresso)', () => {
        let podcodigo;
        let epicodigo;

        beforeAll(async () => {
            podcodigo = await inserirPodcast({
                podnome: `${RUN} Podcast Interações`,
                poddescricao: 'Suporte aos testes de interação',
                podurl: '/images/figura01.jpg',
                usucodigo: userA.usucodigo,
                catcodigo: categoria.catcodigo
            });
            epicodigo = await inserirEpisodio({
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
            const agent = await login(userB);
            const texto = `${RUN} ótimo episódio!`;
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/comentar`)
                .send({ comentario: texto })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}`);

            const comentarios = await buscarComentariosPorEpisodio(epicodigo);
            expect(comentarios.some(c => c.comtexto === texto)).toBe(true);

            const pagina = await agent.get(`/episodios/${podcodigo}/${epicodigo}`).expect(200);
            expect(pagina.text).toContain(texto);
        });

        it('deve gravar uma avaliação e atualizá-la em novo envio', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 4 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302)
                .expect('location', `/episodios/${podcodigo}/${epicodigo}?avaliacao=4`);
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(4);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 5 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve rejeitar nota fora do intervalo 1-5', async () => {
            const agent = await login(userB);
            const response = await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/avaliar`)
                .send({ nota: 9 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toContain('error=');
            expect((await buscarAvaliacaoPorUsuario(userB.usucodigo, epicodigo)).avanota).toBe(5);
        });

        it('deve favoritar e desfavoritar o episódio (toggle)', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await verificarFavorito(userB.usucodigo, epicodigo)).toBe(true);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/favoritar`)
                .expect(302);
            expect(await verificarFavorito(userB.usucodigo, epicodigo)).toBe(false);
        });

        it('deve gravar e sobrescrever o progresso de reprodução', async () => {
            const agent = await login(userB);
            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 45 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(45);

            await agent
                .post(`/episodios/${podcodigo}/${epicodigo}/progresso`)
                .send({ progresso_segundos: 90 })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect((await buscarProgressoPorUsuario(userB.usucodigo, epicodigo)).proprogresso).toBe(90);
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
