var express = require('express');
var router = express.Router();
const { buscarEpisodiosPorPodcast, buscarPodcastPorId } = require('../banco');

router.get('/:podcodigo', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const podcodigo = req.params.podcodigo;
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        const podcast = await buscarPodcastPorId(podcodigo); // Busca o podcast para pegar o podnome
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: episodios,
            podnome: podcast ? podcast.podnome : `Podcast #${podcodigo}`, // Usa podnome ou fallback
            usuarioEmail: global.usuarioEmail || '',
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar episódios:', err);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: [],
            podnome: `Podcast #${podcodigo}`, // Fallback em caso de erro
            usuarioEmail: global.usuarioEmail || '',
            query: req.query
        });
    }
});

module.exports = router;