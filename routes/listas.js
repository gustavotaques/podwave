var express = require('express');
var router = express.Router();
const { buscarTodosPodcasts, buscarPodcastsPorCategoria, buscarCategorias } = require('../banco');

/* GET listas page. */
router.get('/', async function(req, res, next) {
  if (!global.usuarioCodigo) {
    return res.redirect('/login');
  }

  try {
    const catcodigo = req.query.catcodigo || null;
    const podcasts = catcodigo 
      ? await buscarPodcastsPorCategoria(catcodigo) 
      : await buscarTodosPodcasts();
    const categorias = await buscarCategorias();
    
    res.render('listas', { 
      title: 'Podwave - Listas de Podcasts',
      podcasts: podcasts,
      categorias: categorias,
      usuarioEmail: global.usuarioEmail,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar podcasts:', err);
    res.render('listas', { 
      title: 'Podwave - Listas de Podcasts',
      podcasts: [],
      categorias: [],
      usuarioEmail: global.usuarioEmail,
      query: req.query
    });
  }
});

module.exports = router;