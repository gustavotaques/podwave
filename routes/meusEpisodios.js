var express = require('express');
var router = express.Router();
const {
    buscarPodcastPorId,
    buscarEpisodiosPorPodcast,
    inserirEpisodio,
    atualizarEpisodio,
    deletarEpisodio,
    buscarEpisodioPorId
} = require('../banco');

router.get('/:podcodigo', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || podcast.usucodigo !== global.usuarioCodigo) {
            return res.redirect('/meusPodcasts?error=Podcast não encontrado ou não pertence ao usuário');
        }
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        res.render('meusEpisodios', {
            title: 'Podwave - Meus Episódios',
            episodios: episodios || [],
            podcodigo: podcodigo,
            usuarioEmail: global.usuarioEmail,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar gestão de episódios:', err);
        res.redirect('/meusPodcasts?error=Erro ao carregar gestão de episódios');
    }
});

router.get('/:podcodigo/adicionar', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast || podcast.usucodigo !== global.usuarioCodigo) {
            return res.redirect('/meusPodcasts');
        }
        res.render('adicionar-episodio', {
            title: 'Podwave - Adicionar Episódio',
            podcodigo: podcodigo,
            usuarioEmail: global.usuarioEmail,
            error: req.query.error
        });
    } catch (err) {
        console.error('Erro ao carregar formulário de adição de episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao carregar formulário`);
    }
});

router.post('/:podcodigo/adicionar', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const { epititulo, epidescricao, epiurl, epiduracao, epidata, epinumero, epireproducoes, epiaudio } = req.body;
        await inserirEpisodio({
            podcodigo: parseInt(podcodigo),
            usucodigo: global.usuarioCodigo,
            epititulo,
            epidescricao,
            epiurl,
            epiduracao: epiduracao ? parseInt(epiduracao) : null,
            epidata: epidata || new Date().toISOString().split('T')[0],
            epinumero: parseInt(epinumero) || 0,
            epireproducoes: parseInt(epireproducoes) || 0,
            epiaudio // Incluindo o campo epiaudio para streaming
        });
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao adicionar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}/adicionar?error=Erro ao adicionar episódio`);
    }
});

router.get('/:podcodigo/:epicodigo/editar', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const epicodigo = req.params.epicodigo;
        const episodio = await buscarEpisodioPorId(epicodigo);
        if (!episodio || episodio.podcodigo !== parseInt(podcodigo) || !await buscarPodcastPorId(podcodigo) || (await buscarPodcastPorId(podcodigo)).usucodigo !== global.usuarioCodigo) {
            return res.redirect(`/meusEpisodios/${podcodigo}`);
        }
        res.render('editar-episodio', {
            title: 'Podwave - Editar Episódio',
            episodio: episodio,
            usuarioEmail: global.usuarioEmail,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar edição de episódio:', err);
        res.redirect(`/meusEpisodios/${req.params.podcodigo}?error=Erro ao carregar edição`);
    }
});

router.post('/:podcodigo/:epicodigo', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const epicodigo = req.params.epicodigo;
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
            epiaudio // Adicionado para suportar atualização do caminho do áudio
        });
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao atualizar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}/${epicodigo}/editar?error=Erro ao atualizar episódio`);
    }
});

router.post('/:podcodigo/:epicodigo/delete', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const epicodigo = req.params.epicodigo;
        await deletarEpisodio(epicodigo, podcodigo);
        res.redirect(`/meusEpisodios/${podcodigo}`);
    } catch (err) {
        console.error('Erro ao deletar episódio:', err);
        res.redirect(`/meusEpisodios/${podcodigo}?error=Erro ao deletar episódio`);
    }
});

module.exports = router;