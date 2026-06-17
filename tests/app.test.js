/**
 * Testes unitários: exercitam as rotas HTTP com os repositories mockados
 * (sem banco). O login usa o fluxo real: POST /login com buscarUsuario
 * mockado, via agente do supertest que preserva o cookie de sessão.
 */
import { jest } from '@jest/globals';
import request from 'supertest';

// Os mocks precisam ser registrados ANTES do import do app
jest.unstable_mockModule('../src/repositories/usuarios.repository.js', () => ({
    inserirUsuario: jest.fn(),
    buscarUsuario: jest.fn(),
    buscarUsuarioPorEmail: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/podcasts.repository.js', () => ({
    inserirPodcast: jest.fn(),
    buscarPodcastsPorUsuario: jest.fn(),
    buscarPodcastsPorCategoria: jest.fn(),
    buscarTodosPodcasts: jest.fn(),
    buscarPodcastPorId: jest.fn(),
    atualizarPodcast: jest.fn(),
    deletarPodcast: jest.fn(),
    buscarCategorias: jest.fn(),
    buscarCatcodigoPorNome: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/episodios.repository.js', () => ({
    buscarEpisodiosPorPodcast: jest.fn(),
    inserirEpisodio: jest.fn(),
    atualizarEpisodio: jest.fn(),
    deletarEpisodio: jest.fn(),
    buscarEpisodioPorId: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/comentarios.repository.js', () => ({
    inserirComentario: jest.fn(),
    buscarComentariosPorEpisodio: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/avaliacoes.repository.js', () => ({
    inserirAvaliacao: jest.fn(),
    atualizarAvaliacao: jest.fn(),
    buscarAvaliacaoPorUsuario: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/favoritos.repository.js', () => ({
    inserirFavorito: jest.fn(),
    removerFavorito: jest.fn(),
    verificarFavorito: jest.fn()
}));

jest.unstable_mockModule('../src/repositories/progresso.repository.js', () => ({
    inserirProgresso: jest.fn(),
    buscarProgressoPorUsuario: jest.fn()
}));

const usuariosRepo = await import('../src/repositories/usuarios.repository.js');
const podcastsRepo = await import('../src/repositories/podcasts.repository.js');
const episodiosRepo = await import('../src/repositories/episodios.repository.js');
const comentariosRepo = await import('../src/repositories/comentarios.repository.js');
const { default: app } = await import('../src/app.js');

jest.setTimeout(30000);

const USER_1 = { usucodigo: 1, usuemail: 'user@example.com' };
const USER_2 = { usucodigo: 2, usuemail: 'user2@example.com' };

// Loga pelo fluxo real e devolve um agente com o cookie de sessão
async function loginAs(usuario) {
    usuariosRepo.buscarUsuario.mockResolvedValue(usuario);
    const agent = request.agent(app);
    await agent
        .post('/login')
        .send({ email: usuario.usuemail, password: 'senha123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');
    return agent;
}

beforeEach(() => {
    jest.clearAllMocks();
    // Default usado por várias views (listas e formulários pedem categorias)
    podcastsRepo.buscarCategorias.mockResolvedValue([
        { catcodigo: 1, catnome: 'Empreendedorismo' },
        { catcodigo: 2, catnome: 'Geral' }
    ]);
});

describe('Testes - PodWave', () => {

    // Caso de Uso: Cadastrar-se
    describe('Cadastrar-se (POST /signup)', () => {
        it('Teste 1: deve permitir novos usuários a se registrarem com dados válidos', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue(null);
            usuariosRepo.inserirUsuario.mockResolvedValue(1);
            const uniqueEmail = `test_${Date.now()}@example.com`;
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
            expect(usuariosRepo.inserirUsuario).toHaveBeenCalledWith({
                nome: 'Test User',
                email: uniqueEmail,
                password: 'password123'
            });
        });

        it('Teste 2: deve rejeitar registros com emails duplicados', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue({ email: 'duplicate@example.com' });
            const response = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: 'duplicate@example.com', password: '123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/signup?error=Email%20j%C3%A1%20cadastrado');
        });
    });

    // Caso de Uso: Autenticar-se
    describe('Autenticar-se (POST /login)', () => {
        it('Teste 3: deve logar com credenciais válidas', async () => {
            const agent = await loginAs(USER_1);
            // Com a sessão ativa, uma rota protegida responde 200 em vez de redirecionar
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([]);
            await agent.get('/listas').expect(200);
        });

        it('Teste 4: deve bloquear login com credenciais inválidas', async () => {
            usuariosRepo.buscarUsuario.mockResolvedValue(null);
            const response = await request(app)
                .post('/login')
                .send({ email: 'invalid@example.com', password: 'wrongpassword' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login?erro=1');
        });
    });

    // Caso de Uso: Explorar Podcasts
    describe('Explorar Podcasts (GET /listas)', () => {
        it('Teste 5: deve exibir corretamente a lista de podcasts', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([
                { podcodigo: 19, podnome: 'Teste', podcategoria: 'Geral' }
            ]);
            const response = await agent.get('/listas').expect(200);
            expect(podcastsRepo.buscarTodosPodcasts).toHaveBeenCalled();
            expect(response.text).toContain('Teste');
        });

        it('Teste 6: deve filtrar podcasts por categoria', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarPodcastsPorCategoria.mockResolvedValue([
                { podcodigo: 9, podnome: 'Inovação Hoje', podcategoria: 'Empreendedorismo' }
            ]);
            const response = await agent.get('/listas?catcodigo=1').expect(200);
            expect(podcastsRepo.buscarPodcastsPorCategoria).toHaveBeenCalledWith('1');
            expect(response.text).toContain('Inovação Hoje');
        });
    });

    describe('Listar Episódios (GET /episodios/:podcodigo)', () => {
        it('Teste 8: deve listar episódios de um podcast', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.buscarEpisodiosPorPodcast.mockResolvedValue([
                { epicodigo: 4, podcodigo: 19, epititulo: 'Fluminense bate Ulsan' }
            ]);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({
                podcodigo: 19,
                podnome: 'Teste',
                podcategoria: 'Geral'
            });
            const response = await agent.get('/episodios/19').expect(200);
            expect(response.text).toContain('Fluminense bate Ulsan');
        });

        it('Teste 9: deve retornar vazio para podcast inexistente', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.buscarEpisodiosPorPodcast.mockResolvedValue([]);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue(null);
            const response = await agent.get('/episodios/999').expect(200);
            expect(episodiosRepo.buscarEpisodiosPorPodcast).toHaveBeenCalledWith('999');
            // Sem podcast, a rota usa o título de fallback e nenhum episódio é listado
            expect(response.text).toContain('Podcast #999');
        });
    });

    describe('Comentar Episódio (POST /episodios/:podcodigo/:epicodigo/comentar)', () => {
        it('Teste 10: deve permitir usuário a comentar um episódio', async () => {
            const agent = await loginAs(USER_1);
            comentariosRepo.inserirComentario.mockResolvedValue(1);
            const response = await agent
                .post('/episodios/19/4/comentar')
                .send({ comentario: 'Ótimo episódio!' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/episodios/19/4');
            expect(comentariosRepo.inserirComentario).toHaveBeenCalledWith({
                usucodigo: 1,
                podcodigo: 19,
                epicodigo: 4,
                comtexto: 'Ótimo episódio!',
                comdata: expect.any(String)
            });
        });

        it('Teste 11: deve redirecionar se não autenticado', async () => {
            const response = await request(app)
                .post('/episodios/19/4/comentar')
                .send({ comtexto: 'Ótimo episódio!' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    describe('Adicionar Podcast (POST /meusPodcasts/adicionar)', () => {
        it('Teste 12: deve permitir adicionar um novo podcast', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.inserirPodcast.mockResolvedValue(10);
            const response = await agent
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome: 'Novo Podcast',
                    poddescricao: 'Descrição do podcast',
                    podurl: '/images/novo.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.inserirPodcast).toHaveBeenCalledWith({
                podnome: 'Novo Podcast',
                poddescricao: 'Descrição do podcast',
                podurl: '/images/novo.jpg',
                catcodigo: 1,
                usucodigo: 1
            });
        });

        it('Teste 13: deve redirecionar se não autenticado', async () => {
            const response = await request(app)
                .post('/meusPodcasts/adicionar')
                .send({
                    podnome: 'Novo Podcast',
                    poddescricao: 'Descrição do podcast',
                    podurl: '/images/novo.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/login');
        });
    });

    // Caso de Uso: Atualizar Podcast
    describe('Atualizar Podcast (POST /meusPodcasts/editar/:podcodigo)', () => {
        it('Teste 14: deve atualizar um podcast do usuário', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.atualizarPodcast.mockResolvedValue(true);
            const response = await agent
                .post('/meusPodcasts/editar/19')
                .send({
                    podnome: 'Teste Atualizado',
                    poddescricao: 'Descrição atualizada',
                    podurl: '/images/teste.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.atualizarPodcast).toHaveBeenCalledWith({
                podcodigo: 19,
                podnome: 'Teste Atualizado',
                poddescricao: 'Descrição atualizada',
                podurl: '/images/teste.jpg',
                catcodigo: 1,
                usucodigo: 1
            });
        });

        it('Teste 15: não deve atualizar podcast de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.atualizarPodcast.mockResolvedValue(false);
            const response = await agent
                .post('/meusPodcasts/editar/19')
                .send({
                    podnome: 'Teste Atualizado',
                    poddescricao: 'Descrição atualizada',
                    podurl: '/images/teste.jpg',
                    catcodigo: 1
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            // A proteção é via SQL (UPDATE ... WHERE usucodigo = ?): a chamada leva o
            // usucodigo do solicitante, então não afeta linhas de outro usuário
            expect(podcastsRepo.atualizarPodcast).toHaveBeenCalledWith(
                expect.objectContaining({ podcodigo: 19, usucodigo: 2 })
            );
        });
    });

    // Caso de Uso: Deletar Podcast
    describe('Deletar Podcast (POST /meusPodcasts/deletar/:podcodigo)', () => {
        it('Teste 16: deve deletar um podcast do usuário', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.deletarPodcast.mockResolvedValue(true);
            const response = await agent
                .post('/meusPodcasts/deletar/19')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(podcastsRepo.deletarPodcast).toHaveBeenCalledWith('19', 1);
        });

        it('Teste 17: não deve deletar podcast de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.deletarPodcast.mockResolvedValue(false);
            const response = await agent
                .post('/meusPodcasts/deletar/19')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            // A proteção é via SQL (DELETE ... WHERE usucodigo = ?)
            expect(podcastsRepo.deletarPodcast).toHaveBeenCalledWith('19', 2);
        });
    });

    // Caso de Uso: Adicionar Episódio
    describe('Adicionar Episódio (POST /meusEpisodios/:podcodigo/adicionar)', () => {
        it('Teste 18: deve adicionar um novo episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.inserirEpisodio.mockResolvedValue(1);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/adicionar')
                .send({
                    epititulo: 'Novo Episódio',
                    epidescricao: 'Descrição do novo episódio',
                    epiurl: '/images/novo.jpg',
                    epiaudio: 'novoepisodio.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.inserirEpisodio).toHaveBeenCalledWith({
                podcodigo: 19,
                usucodigo: 1,
                epititulo: 'Novo Episódio',
                epidescricao: 'Descrição do novo episódio',
                epiurl: '/images/novo.jpg',
                epiaudio: 'novoepisodio.mp3',
                epinumero: 2,
                epiduracao: 180,
                epireproducoes: 0,
                epidata: expect.any(String)
            });
        });

        it('Teste 19: não deve adicionar episódio se podcast não pertence ao usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/adicionar')
                .send({
                    epititulo: 'Novo Episódio',
                    epidescricao: 'Descrição do novo episódio',
                    epiurl: '/images/novo.jpg',
                    epiaudio: 'novoepisodio.mp3',
                    epinumero: 2,
                    epiduracao: 180,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusPodcasts');
            expect(episodiosRepo.inserirEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Atualizar Episódio
    describe('Atualizar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo)', () => {
        it('Teste 20: deve atualizar um episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.atualizarEpisodio.mockResolvedValue(true);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4')
                .send({
                    epititulo: 'Fluminense bate Ulsan Atualizado',
                    epidescricao: 'Jogo incrível atualizado',
                    epiurl: 'teste 3',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 0,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.atualizarEpisodio).toHaveBeenCalledWith({
                epicodigo: 4,
                podcodigo: 19,
                epititulo: 'Fluminense bate Ulsan Atualizado',
                epidescricao: 'Jogo incrível atualizado',
                epiurl: 'teste 3',
                epiaudio: 'episodio1.mp3',
                epinumero: 0,
                epiduracao: 120,
                epireproducoes: 0,
                epidata: expect.any(String)
            });
        });

        it('Teste 21: não deve atualizar episódio de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4')
                .send({
                    epititulo: 'Fluminense bate Ulsan Atualizado',
                    epidescricao: 'Jogo incrível atualizado',
                    epiurl: 'teste 3',
                    epiaudio: 'episodio1.mp3',
                    epinumero: 0,
                    epiduracao: 120,
                    epireproducoes: 0
                })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.atualizarEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Deletar Episódio
    describe('Deletar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo/delete)', () => {
        it('Teste 22: deve deletar um episódio', async () => {
            const agent = await loginAs(USER_1);
            episodiosRepo.deletarEpisodio.mockResolvedValue(true);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4/delete')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.deletarEpisodio).toHaveBeenCalledWith('4', '19');
        });

        it('Teste 23: não deve deletar episódio de outro usuário', async () => {
            const agent = await loginAs(USER_2);
            podcastsRepo.buscarPodcastPorId.mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
            const response = await agent
                .post('/meusEpisodios/19/4/delete')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(response.headers.location).toBe('/meusEpisodios/19');
            expect(episodiosRepo.deletarEpisodio).not.toHaveBeenCalled();
        });
    });

    // Caso de Uso: Página Inicial
    describe('Página Inicial (GET /)', () => {
        it('Teste 24: deve retornar 200 e renderizar index', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            expect(response.text).toContain('PodWave');
        });
    });

    // Caso de Uso: Integração - Login + Listar Podcasts
    describe('Integração: Login + Listar Podcasts', () => {
        it('Teste 25: deve autenticar usuário e listar podcasts', async () => {
            const agent = await loginAs(USER_1);
            podcastsRepo.buscarTodosPodcasts.mockResolvedValue([
                { podcodigo: 9, podnome: 'Inovação Hoje', podcategoria: 'Empreendedorismo' }
            ]);
            podcastsRepo.buscarCategorias.mockResolvedValue([
                { catcodigo: 1, catnome: 'Empreendedorismo' }
            ]);

            const response = await agent.get('/listas').expect(200);
            expect(response.text).toContain('Inovação Hoje');
            expect(response.text).toContain('Empreendedorismo');
        });
    });

    // Caso de Uso: Integração - Cadastro + Login
    describe('Integração: Cadastro + Login', () => {
        it('Teste 26: deve cadastrar usuário e permitir login', async () => {
            usuariosRepo.buscarUsuarioPorEmail.mockResolvedValue(null);
            usuariosRepo.inserirUsuario.mockResolvedValue(1);
            const uniqueEmail = `test_${Date.now()}@example.com`;
            const signupResponse = await request(app)
                .post('/signup')
                .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(signupResponse.headers.location).toBe('/login');

            usuariosRepo.buscarUsuario.mockResolvedValue({
                usucodigo: 1,
                usuemail: uniqueEmail
            });
            const loginResponse = await request(app)
                .post('/login')
                .send({ email: uniqueEmail, password: 'password123' })
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(302);
            expect(loginResponse.headers.location).toBe('/listas');
        });
    });

    // Caso de Uso: Logout
    describe('Logout (POST /usuarios/logout)', () => {
        it('Teste 27: deve encerrar a sessão e voltar para o login', async () => {
            const agent = await loginAs(USER_1);
            await agent.post('/usuarios/logout').expect(302).expect('location', '/login');
            // Sem sessão, rota protegida volta a redirecionar
            await agent.get('/meusPodcasts').expect(302).expect('location', '/login');
        });
    });
});
