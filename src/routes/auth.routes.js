import { Router } from 'express';
import { exibirLogin, efetuarLogin, exibirSignup, efetuarSignup, efetuarLogout } from '../controllers/auth.controller.js';

const router = Router();

router.get('/login', exibirLogin);
router.post('/login', efetuarLogin);
router.get('/signup', exibirSignup);
router.post('/signup', efetuarSignup);
router.post('/usuarios/logout', efetuarLogout);

export default router;
