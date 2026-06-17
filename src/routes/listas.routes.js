import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import { listarPodcasts } from '../controllers/listas.controller.js';

const router = Router();

router.get('/', requireLogin, listarPodcasts);

export default router;
