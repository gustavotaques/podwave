import {
  inserirEpisodio,
  atualizarEpisodio,
  deletarEpisodio,
  buscarEpisodioPorId,
  buscarEpisodiosPorPodcast
} from '../repositories/episodios.repository.js';
import { buscarPodcastPorId } from '../repositories/podcasts.repository.js';

export async function listarMeusEpisodios(req, res) {
  const usuario = req.session.usuario;
  try {
    const podcodigo = req.params.podcodigo;
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect('/meusPodcasts?error=Podcast não encontrado ou não pertence ao usuário');
    }
    const episodios = await buscarEpisodiosPorPodcast(podcodigo);
    res.render('meusEpisodios', {
      title: 'Podwave - Meus Episódios',
      episodios: episodios || [],
      podcodigo,
      usuarioEmail: usuario.email,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar gestão de episódios:', err);
    res.redirect('/meusPodcasts?error=Erro ao carregar gestão de episódios');
  }
}

export async function exibirAdicaoEpisodio(req, res) {
  const usuario = req.session.usuario;
  const podcodigo = req.params.podcodigo;
  try {
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect('/meusPodcasts');
    }
    res.render('adicionar-episodio', {
      title: 'Podwave - Adicionar Episódio',
      podcodigo,
      usuarioEmail: usuario.email,
      error: req.query.error
    });
  } catch (err) {
    console.error('Erro ao carregar formulário de adição de episódio:', err);
    res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao carregar formulário`);
  }
}

export async function adicionarEpisodio(req, res) {
  const usuario = req.session.usuario;
  const podcodigo = req.params.podcodigo;
  try {
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect('/meusPodcasts');
    }
    const { epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio } = req.body;
    await inserirEpisodio({
      podcodigo: parseInt(podcodigo),
      usucodigo: usuario.codigo,
      epititulo,
      epidescricao,
      epiurl,
      epiduracao: epiduracao ? parseInt(epiduracao) : null,
      epidata: epidata || new Date().toISOString().split('T')[0],
      epinumero: parseInt(epinumero) || 0,
      epireproducoes: parseInt(epireproducoes) || 0,
      epiaudio
    });
    res.redirect(`/meusEpisodios/${podcodigo}`);
  } catch (err) {
    console.error('Erro ao adicionar episódio:', err);
    res.redirect(`/meusEpisodios/${podcodigo}/adicionar?error=Erro ao adicionar episódio`);
  }
}

export async function exibirEdicaoEpisodio(req, res) {
  const usuario = req.session.usuario;
  try {
    const { podcodigo, epicodigo } = req.params;
    const episodio = await buscarEpisodioPorId(epicodigo);
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!episodio || episodio.podcodigo !== parseInt(podcodigo) || !podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect(`/meusEpisodios/${podcodigo}`);
    }
    res.render('editar-episodio', {
      title: 'Podwave - Editar Episódio',
      episodio,
      usuarioEmail: usuario.email,
      query: req.query
    });
  } catch (err) {
    console.error('Erro ao carregar edição de episódio:', err);
    res.redirect(`/meusEpisodios/${req.params.podcodigo}?error=Erro ao carregar edição`);
  }
}

export async function editarEpisodio(req, res) {
  const usuario = req.session.usuario;
  const { podcodigo, epicodigo } = req.params;
  try {
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect(`/meusEpisodios/${podcodigo}`);
    }
    const { epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio } = req.body;
    await atualizarEpisodio({
      epicodigo: parseInt(epicodigo),
      podcodigo: parseInt(podcodigo),
      epititulo,
      epidescricao,
      epiurl,
      epiduracao: epiduracao ? parseInt(epiduracao) : null,
      epidata: epidata || new Date().toISOString().split('T')[0],
      epinumero: parseInt(epinumero) || 0,
      epireproducoes: parseInt(epireproducoes) || 0,
      epiaudio
    });
    res.redirect(`/meusEpisodios/${podcodigo}`);
  } catch (err) {
    console.error('Erro ao atualizar episódio:', err);
    res.redirect(`/meusEpisodios/${podcodigo}/${epicodigo}/editar?error=Erro ao atualizar episódio`);
  }
}

export async function excluirEpisodio(req, res) {
  const usuario = req.session.usuario;
  const { podcodigo, epicodigo } = req.params;
  try {
    const podcast = await buscarPodcastPorId(podcodigo);
    if (!podcast || String(podcast.usucodigo) !== String(usuario.codigo)) {
      return res.redirect(`/meusEpisodios/${podcodigo}`);
    }
    await deletarEpisodio(epicodigo, podcodigo);
    res.redirect(`/meusEpisodios/${podcodigo}`);
  } catch (err) {
    console.error('Erro ao deletar episódio:', err);
    res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao deletar episódio`);
  }
}
