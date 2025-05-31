var express = require('express');
var router = express.Router();
const { buscarTodosPodcasts } = require('../banco');

/* GET listas page. */
router.get('/', async function(req, res, next) {
    if (!global.usuarioCodigo) {
        return res.redirect('/login');
    }

    try {
        // Buscar todos os podcasts
        const podcasts = await buscarTodosPodcasts();
        
        // Renderizar o template com os podcasts
        res.render('listas', { 
            title: 'Podwave - Listas de Podcasts',
            podcasts: podcasts,
            usuarioEmail: global.usuarioEmail
        });
    } catch (err) {
        console.error('Erro ao carregar podcasts:', err);
        res.render('listas', { 
            title: 'Podwave - Listas de Podcasts',
            podcasts: [],
            usuarioEmail: global.usuarioEmail
        });
    }
});

module.exports = router;