var express = require('express');
var router = express.Router();
const { buscarUsuario } = require('../banco');

router.get('/', function(req, res, next) {
    if (req.session && req.session.usuarioCodigo) {
        return res.redirect('/listas');
    }
    res.render('login', { title: 'Podwave - Login', error: req.query.erro });
});

router.post('/', async function(req, res, next) {
    const { email, password } = req.body;
    try {
        const usuario = await global.banco.buscarUsuario({ email, password });
        if (!usuario) {
            return res.redirect('/login?erro=1');
        }
        req.session = req.session || {};
        req.session.usuarioCodigo = usuario.usucodigo;
        req.session.usuarioEmail = usuario.usuemail;
        global.usuarioCodigo = usuario.usucodigo;
        global.usuarioEmail = usuario.usuemail;
        return res.redirect('/listas');
    } catch (err) {
        console.error('Erro ao fazer login:', err);
        return res.redirect('/login?erro=1');
    }
});

module.exports = router;