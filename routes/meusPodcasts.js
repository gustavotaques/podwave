var express = require('express');
var router = express.Router();
const {
  buscarPodcastsPorUsuario,
  inserirPodcast,
  buscarPodcastPorId,
  atualizarPodcast,
  deletarPodcast,
  buscarCategorias
} = require('../banco');

router.get('/', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    const podcasts = await buscarPodcastsPorUsuario(global.usuarioCodigo);
    const categorias = await buscarCategorias();
    res.render('meusPodcasts', {
      title: 'Podwave - Gerenciar Meus Podcasts',
      podcasts: podcasts,
      categorias: categorias,
      usuarioEmail: global.usuarioEmail,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar gestão de podcasts:', err);
    res.render('meusPodcasts', {
      title: 'Podwave - Gerenciar Meus Podcasts',
      podcasts: [],
      categorias: [],
      usuarioEmail: global.usuarioEmail,
      query: req.query
    });
  }
});

router.get('/editar/:podcodigo', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    const podcast = await buscarPodcastPorId(req.params.podcodigo);
    if (!podcast || podcast.usucodigo !== global.usuarioCodigo) {
        return res.redirect('/meusPodcasts');
    }
    const categorias = await buscarCategorias();
    res.render('editar-podcast', {
      title: 'Podwave - Editar Podcast',
      podcast: podcast,
      categorias: categorias,
      usuarioEmail: global.usuarioEmail,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar edição de podcast:', err);
    res.redirect('/meusPodcasts');
  }
});

router.get('/adicionar', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    const categorias = await buscarCategorias();
    res.render('adicionar-podcast', {
      title: 'Podwave - Adicionar Podcast',
      categorias: categorias,
      usuarioEmail: global.usuarioEmail,
      error: req.query.error
    });
  } catch (err) {
    console.error('Erro ao carregar formulário de adição:', err);
    res.redirect('/meusPodcasts?error=Erro ao carregar formulário');
  }
});

router.post('/adicionar', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    const { podnome, poddescricao, podurl, catcodigo } = req.body;
    await inserirPodcast({
      podnome,
      poddescricao,
      podurl,
      usucodigo: global.usuarioCodigo,
      catcodigo: parseInt(catcodigo) || (await buscarCatcodigoPorNome('Geral'))
    });
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao adicionar podcast:', err);
    res.redirect('/meusPodcasts/adicionar?error=Erro ao adicionar podcast');
  }
});

router.post('/atualizar', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    const { podcodigo, podnome, poddescricao, podurl, catcodigo } = req.body;
    await atualizarPodcast({
      podcodigo: parseInt(podcodigo),
      podnome,
      poddescricao,
      podurl,
      catcodigo: parseInt(catcodigo),
      usucodigo: global.usuarioCodigo
    });
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao atualizar podcast:', err);
    res.redirect('/meusPodcasts?error=Erro ao atualizar podcast');
  }
});

router.post('/deletar/:podcodigo', async function(req, res, next) { 
  if (!global.usuarioCodigo) return res.redirect('/login');
  try {
    await deletarPodcast(req.params.podcodigo, global.usuarioCodigo);
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao deletar podcast:', err);
    res.redirect('/meusPodcasts?error=Erro ao deletar podcast');
  }
});

module.exports = router;