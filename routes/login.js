var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
if (global.usuarioCodigo && global.usuarioCodigo != "") {
    return res.redirect('/listas');
  }

  res.render('login', { title: 'Podwave - Login' });
});

router.post('/', async function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  const usuario = await global.banco.buscarUsuario({ email, password });


  if (!usuario.usucodigo) {
    return res.redirect('/login?erro=1');
  }

  global.usuarioCodigo = usuario.usucodigo;
  global.usuarioEmail = usuario.usuemail;

  return res.redirect('/listas');

});

module.exports = router;