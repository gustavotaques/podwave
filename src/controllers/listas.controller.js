import { buscarTodosPodcasts, buscarPodcastsPorCategoria, buscarCategorias } from '../repositories/podcasts.repository.js';

export async function listarPodcasts(req, res) {
  try {
    const catcodigo = req.query.catcodigo || null;
    const podcasts = catcodigo
      ? await buscarPodcastsPorCategoria(catcodigo)
      : await buscarTodosPodcasts();
    const categorias = await buscarCategorias();

    res.render('listas', {
      title: 'Podwave - Listas de Podcasts',
      podcasts,
      categorias,
      usuarioEmail: req.session.usuario.email,
      query: req.query
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao carregar podcasts:', err);
    res.render('listas', {
      title: 'Podwave - Listas de Podcasts',
      podcasts: [],
      categorias: [],
      usuarioEmail: req.session.usuario.email,
      query: req.query
    });
  }
}
