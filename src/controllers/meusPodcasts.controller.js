import {
  buscarPodcastsPorUsuario,
  inserirPodcast,
  buscarPodcastPorId,
  atualizarPodcast,
  deletarPodcast,
  buscarCategorias
} from '../repositories/podcasts.repository.js';

export async function listarMeusPodcasts(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcasts = await buscarPodcastsPorUsuario(usuario.codigo);
    const categorias = await buscarCategorias();
    res.render('meusPodcasts', {
      title: 'Podwave - Gerenciar Meus Podcasts',
      podcasts,
      categorias,
      usuarioEmail: usuario.email,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar gestão de podcasts:', err);
    res.render('meusPodcasts', {
      title: 'Podwave - Gerenciar Meus Podcasts',
      podcasts: [],
      categorias: [],
      usuarioEmail: usuario.email,
      query: req.query
    });
  }
}

export async function exibirEdicaoPodcast(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcast = await buscarPodcastPorId(req.params.podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect('/meusPodcasts');
    }
    const categorias = await buscarCategorias();
    res.render('editar-podcast', {
      title: 'Podwave - Editar Podcast',
      podcast,
      categorias,
      usuarioEmail: usuario.email,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar edição de podcast:', err);
    res.redirect('/meusPodcasts');
  }
}

export async function exibirAdicaoPodcast(req, res) {
  const usuario = req.session.usuario;
  try {
    const categorias = await buscarCategorias();
    res.render('adicionar-podcast', {
      title: 'Podwave - Adicionar Podcast',
      categorias,
      usuarioEmail: usuario.email,
      error: req.query.error
    });
  } catch (err) {
    console.error('Erro ao carregar formulário de adição:', err);
    res.redirect('/meusPodcasts?error=Erro ao carregar formulário');
  }
}

export async function adicionarPodcast(req, res) {
  const usuario = req.session.usuario;
  try {
    const { podnome, poddescricao, podurl, catcodigo } = req.body;
    await inserirPodcast({
      podnome,
      poddescricao,
      podurl,
      usucodigo: usuario.codigo,
      // null deixa o repository aplicar o default 'Geral' (a versão antiga
      // referenciava buscarCatcodigoPorNome sem importar — ReferenceError latente)
      catcodigo: parseInt(catcodigo) || null
    });
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao adicionar podcast:', err);
    res.redirect('/meusPodcasts/adicionar?error=Erro ao adicionar podcast');
  }
}

export async function editarPodcast(req, res) {
  const usuario = req.session.usuario;
  const podcodigo = req.params.podcodigo;
  try {
    const { podnome, poddescricao, podurl, catcodigo } = req.body;
    await atualizarPodcast({
      podcodigo: parseInt(podcodigo),
      podnome,
      poddescricao,
      podurl,
      catcodigo: parseInt(catcodigo),
      usucodigo: usuario.codigo
    });
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao atualizar podcast:', err);
    res.redirect(`/meusPodcasts/editar/${podcodigo}?error=Erro ao atualizar podcast`);
  }
}

export async function excluirPodcast(req, res) {
  const usuario = req.session.usuario;
  try {
    await deletarPodcast(req.params.podcodigo, usuario.codigo);
    res.redirect('/meusPodcasts');
  } catch (err) {
    console.error('Erro ao deletar podcast:', err);
    res.redirect('/meusPodcasts?error=Erro ao deletar podcast');
  }
}
