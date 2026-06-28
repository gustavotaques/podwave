import { buscarUsuario, inserirUsuario, buscarUsuarioPorEmail } from '../repositories/usuarios.repository.js';

export function exibirLogin(req, res) {
  if (req.session.usuario) {
    return res.redirect('/listas');
  }
  res.render('login', { title: 'Podwave - Login', error: req.query.erro });
}

export async function efetuarLogin(req, res) {
  const { email, password } = req.body;
  try {
    const usuario = await buscarUsuario({ email, password });
    if (!usuario) {
      return res.redirect('/login?erro=1');
    }
    req.session.usuario = { codigo: usuario.usucodigo, email: usuario.usuemail };
    return res.redirect('/listas');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Erro ao fazer login:', err);
    return res.redirect('/login?erro=1');
  }
}

export function exibirSignup(req, res) {
  if (req.session.usuario) {
    return res.redirect('/listas');
  }
  res.render('signup', { title: 'Podwave - Registre-se' });
}

export async function efetuarSignup(req, res) {
  const { name: nome, email, password } = req.body;

  const usuarioExistente = await buscarUsuarioPorEmail(email);
  if (usuarioExistente) {
    return res.redirect('/signup?error=Email já cadastrado');
  }

  const usuario = await inserirUsuario({ nome, email, password });
  if (!usuario) {
    return res.redirect('/signup?error=Erro ao inserir usuário');
  }
  return res.redirect('/login');
}

export function efetuarLogout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}
