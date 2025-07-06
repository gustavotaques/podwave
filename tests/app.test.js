// Ativa o mock de banco.js
jest.mock('../banco', () => ({
  connectDB: jest.fn().mockResolvedValue({
    query: jest.fn().mockResolvedValue([[], {}]),
    end: jest.fn().mockResolvedValue()
  }),
  inserirUsuario: jest.fn().mockResolvedValue({ insertId: 1 }),
  buscarUsuarioPorEmail: jest.fn(),
  buscarUsuario: jest.fn().mockImplementation(({ email, password }) => {
    if (email === 'user@example.com' && password === '123456') {
      return Promise.resolve({ usucodigo: 1, usuemail: 'user@example.com' });
    }
    return Promise.resolve(null);
  }),
  buscarTodosPodcasts: jest.fn().mockResolvedValue([
    { podcodigo: 9, podnome: 'Inovação Hoje', poddescricao: 'Explorando ideias disruptivas', podurl: '/images/figura02.jpg', podcategoria: 'Empreendedorismo' },
    { podcodigo: 19, podnome: 'Teste', poddescricao: 'teste 3', podurl: 'teste 3', podcategoria: 'Geral' },
  ]),
  buscarPodcastsPorCategoria: jest.fn().mockResolvedValue([
    { podcodigo: 9, podnome: 'Inovação Hoje', poddescricao: 'Explorando ideias disruptivas', podurl: '/images/figura02.jpg', podcategoria: 'Empreendedorismo' },
  ]),
  buscarEpisodiosPorPodcast: jest.fn().mockResolvedValue([
    { epicodigo: 4, podcodigo: 19, epititulo: 'Fluminense bate Ulsan', epidescricao: 'Foi um jogo do caraio', epiurl: 'teste 3', epiaudio: 'episodio1.mp3' },
  ]),
  buscarEpisodioPorId: jest.fn().mockResolvedValue({
    epicodigo: 4, podcodigo: 19, epititulo: 'Fluminense bate Ulsan', epidescricao: 'Foi um jogo do caraio', epiurl: 'teste 3', epiaudio: 'episodio1.mp3',
  }),
  inserirComentario: jest.fn().mockResolvedValue({ insertId: 1 }),
  inserirPodcast: jest.fn().mockResolvedValue({ insertId: 10 }),
  inserirEpisodio: jest.fn().mockResolvedValue({ insertId: 5 }),
  atualizarPodcast: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  atualizarEpisodio: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  deletarPodcast: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  deletarEpisodio: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  buscarPodcastsPorUsuario: jest.fn().mockResolvedValue([
    { podcodigo: 19, podnome: 'Teste', podusucriador: 1 },
  ]),
  buscarCategorias: jest.fn().mockResolvedValue([
    { catcodigo: 1, catnome: 'Empreendedorismo' },
    { catcodigo: 2, catnome: 'Geral' },
  ]),
  buscarPodcastPorId: jest.fn().mockImplementation(podcodigo => {
    if (podcodigo === '19') {
      return Promise.resolve({
        podcodigo: 19,
        podnome: 'Teste',
        poddescricao: 'teste 3',
        podurl: 'teste 3',
        podcategoria: 'Geral',
        podusucriador: 1
      });
    }
    return Promise.resolve(null);
  }),
}));

const app = require('../app');
const request = require('supertest');
const http = require('http');
const banco = require('../banco'); // Isso carregará o mock
let server;

// Define um tempo limite global maior para testes
jest.setTimeout(30000); // 30 segundos

beforeAll(async () => {
  try {
    // Inicializa global.banco com o mock
    global.banco = banco;
    console.log('global.banco inicializado:', global.banco ? 'Sucesso' : 'Falha');
    console.log('global.banco.connectDB:', typeof global.banco.connectDB);

    // Inicia o servidor HTTP
    server = http.createServer(app).listen(0);
    console.log('Servidor HTTP iniciado');

    // Chama o mock de connectDB
    await global.banco.connectDB();
    console.log('Mock de conexão com o banco chamado');
  } catch (err) {
    console.error('Erro no beforeAll:', err);
    throw err;
  }
});

afterAll(async () => {
  try {
    if (global.connection && global.connection.state !== 'disconnected') {
      await global.connection.end();
      console.log('Conexão MySQL fechada');
    }
  } catch (err) {
    console.error('Erro ao fechar conexão MySQL:', err);
  }
  try {
    if (server) {
      await new Promise(resolve => server.close(resolve));
      console.log('Servidor HTTP fechado');
    }
  } catch (err) {
    console.error('Erro ao fechar servidor HTTP:', err);
  }
  jest.clearAllTimers();
});

// Limpa mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Testes - PodWave', () => {

  // Caso de Uso: Cadastrar-se
  describe('Cadastrar-se (POST /signup)', () => {
    it('Teste 1: deve permitir novos usuários a se registrarem com dados válidos', async () => {
      banco.buscarUsuarioPorEmail.mockResolvedValue(null); // Simula email novo
      const uniqueEmail = `test_${Date.now()}@example.com`;
      const response = await request(app)
        .post('/signup')
        .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302); // Status esperado
      expect(response.headers.location).toBe('/login');
      expect(banco.inserirUsuario).toHaveBeenCalledWith({
        nome: 'Test User',
        email: uniqueEmail,
        password: 'password123',
      });
    });

    it('Teste 2: deve rejeitar registros com emails duplicados', async () => {
      banco.buscarUsuarioPorEmail.mockResolvedValue({ email: 'duplicate@example.com' });
      const response = await request(app)
        .post('/signup')
        .send({ name: 'Test User', email: 'duplicate@example.com', password: '123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302); // Status esperado
      expect(response.headers.location).toBe('/signup?error=Email%20j%C3%A1%20cadastrado');
    });
  });

  // Caso de Uso: Autenticar-se
  describe('Autenticar-se (POST /login)', () => {
    it('Teste 3: deve logar com credenciais válidas', async () => {
      // Configura o mock para buscarUsuario
      global.banco.buscarUsuario.mockResolvedValue({
        usucodigo: 1,
        usuemail: 'user@example.com'
      });
      const response = await request(app)
        .post('/login')
        .send({ email: 'user@example.com', password: '123456' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302); // Status esperado
      expect(response.headers.location).toBe('/listas');
      expect(global.usuarioCodigo).toBe(1);
      expect(global.usuarioEmail).toBe('user@example.com');
    }, 10000); // Aumenta o timeout para 10 segundos

    it('Teste 4: deve bloquear login com credenciais inválidas', async () => {
      global.banco.buscarUsuario.mockResolvedValue(null); // Credenciais inválidas
      const response = await request(app)
        .post('/login')
        .send({ email: 'invalid@example.com', password: 'wrongpassword' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/login?erro=1');
    }, 10000);
  });

  // Caso de Uso: Explorar Podcasts
  describe('Explorar Podcasts (GET /listas)', () => {
    it('Teste 5: deve exibir corretamente a lista de podcasts', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarTodosPodcasts.mockResolvedValue([
        { podcodigo: 19, podnome: 'Teste', podcategoria: 'Geral' }
      ]);
      global.banco.buscarCategorias.mockResolvedValue([
        { catcodigo: 1, catnome: 'Empreendedorismo' },
        { catcodigo: 2, catnome: 'Geral' }
      ]);
      const response = await request(app)
        .get('/listas')
        .set('Cookie', 'usuarioCodigo=1')
        .expect(200);
      expect(response.body.podcasts).toBeInstanceOf(Array);
      expect(response.body.podcasts.length).toBeGreaterThanOrEqual(0);
    }, 15000);

    it('Teste 6: deve filtrar podcasts por categoria', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarPodcastsPorCategoria.mockResolvedValue([
        { podcodigo: 9, podnome: 'Inovação Hoje', podcategoria: 'Empreendedorismo' }
      ]);
      global.banco.buscarCategorias.mockResolvedValue([
        { catcodigo: 1, catnome: 'Empreendedorismo' },
        { catcodigo: 2, catnome: 'Geral' }
      ]);
      const response = await request(app)
        .get('/listas?catcodigo=1')
        .set('Cookie', 'usuarioCodigo=1')
        .expect(200);
      expect(response.body.podcasts).toBeInstanceOf(Array);
      expect(response.body.podcasts.every(p => p.podcategoria === 'Empreendedorismo')).toBe(true);
    }, 15000);
  });

  describe('Listar Episódios (GET /episodios/:podcodigo)', () => {
    it('Teste 8: deve listar episódios de um podcast', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarEpisodiosPorPodcast.mockResolvedValue([
        { epicodigo: 4, podcodigo: 19, epititulo: 'Fluminense bate Ulsan' }
      ]);
      global.banco.buscarPodcastPorId.mockResolvedValue({
        podcodigo: 19,
        podnome: 'Teste',
        podcategoria: 'Geral'
      });
      const response = await request(app)
        .get('/episodios/19')
        .set('Cookie', 'usuarioCodigo=1')
        .expect(200);
      expect(response.body.episodios).toBeInstanceOf(Array);
      expect(response.body.episodios).toContainEqual(
        expect.objectContaining({ epititulo: 'Fluminense bate Ulsan' })
      );
    }, 15000);

    it('Teste 9: deve retornar vazio para podcast inexistente', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarEpisodiosPorPodcast.mockResolvedValue([]);
      global.banco.buscarPodcastPorId.mockResolvedValue(null);
      const response = await request(app)
        .get('/episodios/999')
        .set('Cookie', 'usuarioCodigo=1')
        .expect(200);
      expect(response.body.episodios).toEqual([]);
    }, 10000);
  });

  describe('Comentar Episódio (POST /episodios/:podcodigo/:epicodigo/comentar)', () => {
    it('Teste 10: deve permitir usuário a comentar um episódio', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarEpisodioPorId.mockResolvedValue({
        epicodigo: 4,
        podcodigo: 19
      });
      global.banco.inserirComentario.mockResolvedValue({ insertId: 1 });
      const response = await request(app)
        .post('/episodios/19/4/comentar')
        .send({ comtexto: 'Ótimo episódio!' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/episodios/19/4');
      expect(global.banco.inserirComentario).toHaveBeenCalledWith({
        usucodigo: '1',
        epicodigo: '4',
        comtexto: 'Ótimo episódio!',
        comdata: expect.any(String)
      });
    }, 10000);

    it('Teste 11: deve redirecionar se não autenticado', async () => {
      global.usuarioCodigo = null; // Usuário não autenticado
      const response = await request(app)
        .post('/episodios/19/4/comentar')
        .send({ comtexto: 'Ótimo episódio!' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/login');
    }, 10000);
  });

  describe('Adicionar Podcast (POST /meusPodcasts/adicionar)', () => {
    it('Teste 12: deve permitir adicionar um novo podcast', async () => {
      global.usuarioCodigo = '1';
      global.banco.inserirPodcast.mockResolvedValue({ insertId: 10 });
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
      expect(response.headers.location).toBe('/meusPodcasts');
      expect(global.banco.inserirPodcast).toHaveBeenCalledWith({
        podnome: 'Novo Podcast',
        poddescricao: 'Descrição do podcast',
        podurl: '/images/novo.jpg',
        catcodigo: 1,
        usucodigo: '1'
      });
    }, 10000);

    it('Teste 13: deve redirecionar se não autenticado', async () => {
      global.usuarioCodigo = null; // Usuário não autenticado
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
    }, 10000);
  });

  // Caso de Uso: Atualizar Podcast
  describe('Atualizar Podcast (POST /meusPodcasts/editar/:podcodigo)', () => {
    it('Teste 14: deve atualizar um podcast do usuário', async () => {
      global.usuarioCodigo = '1';
      global.banco.buscarPodcastPorId.mockResolvedValue({
        podcodigo: 19,
        podusucriador: 1
      });
      global.banco.atualizarPodcast.mockResolvedValue({ affectedRows: 1 });
      const response = await request(app)
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
      expect(global.banco.atualizarPodcast).toHaveBeenCalledWith({
        podcodigo: 19,
        podnome: 'Teste Atualizado',
        poddescricao: 'Descrição atualizada',
        podurl: '/images/teste.jpg',
        catcodigo: 1,
        usucodigo: '1'
      });
    }, 10000);

    it('Teste 15: não deve atualizar podcast de outro usuário', async () => {
      global.usuarioCodigo = '2'; // Usuário diferente
      global.banco.atualizarPodcast = jest.fn().mockResolvedValue(false);
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
        .post('/meusPodcasts/editar/19')
        .send({
          podnome: 'Teste Atualizado',
          poddescricao: 'Descrição atualizada',
          podurl: '/images/teste.jpg',
          catcodigo: 1
        })
        .set('Cookie', ['usuarioCodigo=2'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusPodcasts');
      expect(global.banco.atualizarPodcast).not.toHaveBeenCalled();
    });
  });

  // Caso de Uso: Deletar Podcast
  describe('Deletar Podcast (POST /meusPodcasts/deletar/:podcodigo)', () => {
    it('Teste 16: deve deletar um podcast do usuário', async () => {
      global.usuarioCodigo = '1';
      global.banco.deletarPodcast = jest.fn().mockResolvedValue(true);
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
        .post('/meusPodcasts/deletar/19')
        .set('Cookie', ['usuarioCodigo=1'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusPodcasts');
      expect(global.banco.deletarPodcast).toHaveBeenCalledWith('19', '1');
    });

    it('Teste 17: não deve deletar podcast de outro usuário', async () => {
      global.usuarioCodigo = '2';
      global.banco.deletarPodcast = jest.fn().mockResolvedValue(false);
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
        .post('/meusPodcasts/deletar/19')
        .set('Cookie', ['usuarioCodigo=2'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusPodcasts');
      expect(global.banco.deletarPodcast).not.toHaveBeenCalled();
    });
  });

  // Caso de Uso: Adicionar Episódio
  describe('Adicionar Episódio (POST /meusEpisodios/:podcodigo/adicionar)', () => {
    it('Teste 18: deve adicionar um novo episódio', async () => {
      global.usuarioCodigo = '1';
      global.banco.inserirEpisodio = jest.fn().mockResolvedValue(1);
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
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
        .set('Cookie', ['usuarioCodigo=1'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusEpisodios/19');
      expect(global.banco.inserirEpisodio).toHaveBeenCalledWith({
        podcodigo: 19,
        usucodigo: '1',
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
      global.usuarioCodigo = '2';
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
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
        .set('Cookie', ['usuarioCodigo=2'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusPodcasts');
      expect(global.banco.inserirEpisodio).not.toHaveBeenCalled();
    });
  });

  // Caso de Uso: Atualizar Episódio
  describe('Atualizar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo)', () => {
    it('Teste 20: deve atualizar um episódio', async () => {
      global.usuarioCodigo = '1';
      global.banco.atualizarEpisodio = jest.fn().mockResolvedValue(true);
      global.banco.buscarEpisodioPorId = jest.fn().mockResolvedValue({ epicodigo: 4, podcodigo: 19, usucodigo: 1 });
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
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
        .set('Cookie', ['usuarioCodigo=1'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusEpisodios/19');
      expect(global.banco.atualizarEpisodio).toHaveBeenCalledWith({
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
      global.usuarioCodigo = '2';
      global.banco.atualizarEpisodio = jest.fn().mockResolvedValue(false);
      global.banco.buscarEpisodioPorId = jest.fn().mockResolvedValue({ epicodigo: 4, podcodigo: 19, usucodigo: 1 });
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
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
        .set('Cookie', ['usuarioCodigo=2'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusEpisodios/19');
      expect(global.banco.atualizarEpisodio).not.toHaveBeenCalled();
    });
  });

  // Caso de Uso: Deletar Episódio
  describe('Deletar Episódio (POST /meusEpisodios/:podcodigo/:epicodigo/delete)', () => {
    it('Teste 22: deve deletar um episódio', async () => {
      global.usuarioCodigo = '1';
      global.banco.deletarEpisodio = jest.fn().mockResolvedValue(true);
      global.banco.buscarEpisodioPorId = jest.fn().mockResolvedValue({ epicodigo: 4, podcodigo: 19, usucodigo: 1 });
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
        .post('/meusEpisodios/19/4/delete')
        .set('Cookie', ['usuarioCodigo=1'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusEpisodios/19');
      expect(global.banco.deletarEpisodio).toHaveBeenCalledWith('4', '19');
    });

    it('Teste 23: não deve deletar episódio de outro usuário', async () => {
      global.usuarioCodigo = '2';
      global.banco.deletarEpisodio = jest.fn().mockResolvedValue(false);
      global.banco.buscarEpisodioPorId = jest.fn().mockResolvedValue({ epicodigo: 4, podcodigo: 19, usucodigo: 1 });
      global.banco.buscarPodcastPorId = jest.fn().mockResolvedValue({ podcodigo: 19, usucodigo: 1 });
      const response = await request(app)
        .post('/meusEpisodios/19/4/delete')
        .set('Cookie', ['usuarioCodigo=2'])
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(response.headers.location).toBe('/meusEpisodios/19');
      expect(global.banco.deletarEpisodio).not.toHaveBeenCalled();
    });
  });

  // Caso de Uso: Página Inicial
  describe('Página Inicial (GET /)', () => {
    it('Teste 24: deve retornar 200 e renderizar index', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      expect(response.text).toContain('Podwave'); // Ajuste para o texto real da página
    });
  });

  // Caso de Uso: Integração - Login + Listar Podcasts
  describe('Integração: Login + Listar Podcasts', () => {
    it('Teste 25: deve autenticar usuário e listar podcasts', async () => {
      // Cria um agente para manter a sessão/cookies
      const agent = request.agent(app);

      // Faz login
      await agent
        .post('/login')
        .send({ email: 'user@example.com', password: '123456' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302)
        .expect('location', '/listas');

      // Verifica se global.usuarioCodigo foi definido
      expect(global.usuarioCodigo).toBe(1);
      expect(global.usuarioEmail).toBe('user@example.com');

      // Faz a requisição para listar podcasts usando o mesmo agente
      const response = await agent
        .get('/listas')
        .expect(200);

      expect(response.body.podcasts).toBeInstanceOf(Array);
      expect(response.body.podcasts.length).toBeGreaterThanOrEqual(0);
      expect(response.body.categorias).toBeInstanceOf(Array);
    }, 15000); // Aumenta o timeout para 15 segundos
  });

  // Caso de Uso: Integração - Cadastro + Login
  describe('Integração: Cadastro + Login', () => {
    it('Teste 26: deve cadastrar usuário e permitir login', async () => {
      banco.buscarUsuarioPorEmail.mockResolvedValue(null);
      const uniqueEmail = `test_${Date.now()}@example.com`;
      const signupResponse = await request(app)
        .post('/signup')
        .send({ name: 'Test User', email: uniqueEmail, password: 'password123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(signupResponse.headers.location).toBe('/login');

      banco.buscarUsuarioPorEmail.mockResolvedValue({
        usucodigo: 1,
        usuemail: uniqueEmail,
        ususenha: 'password123',
      });
      const loginResponse = await request(app)
        .post('/login')
        .send({ email: uniqueEmail, password: 'password123' })
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(302);
      expect(loginResponse.headers.location).toBe('/listas');
    }, 10000); // Aumenta o timeout para 10 segundos
  });
});