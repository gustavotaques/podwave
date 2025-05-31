var express = require('express');
const { inserirUsuario, buscarUsuarioPorEmail } = require('../banco');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if(global.usuarioCodigo && global.usuarioCodigo != "") {
    return res.redirect('/listas');
  }

  res.render('signup', { title: 'Podwave - Registre-se' });
});

router.post('/', async function(req, res, next) {
    const nome = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    const usuarioExistente = await buscarUsuarioPorEmail(email);
    if (usuarioExistente) {
        return res.redirect('/signup?error=Email já cadastrado');
    }

    const usuario = await inserirUsuario({nome, email, password});

    if(!usuario) {
        return res.redirect('/signup?error=Erro ao inserir usuário');
    }

    return res.redirect('/login');
});


module.exports = router;