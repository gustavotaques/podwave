import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
    listarMeusPodcasts,
    exibirEdicaoPodcast,
    exibirAdicaoPodcast,
    adicionarPodcast,
    editarPodcast,
    excluirPodcast
} from '../controllers/meusPodcasts.controller.js';

const router = Router();

router.use(requireLogin);

router.get('/', listarMeusPodcasts);
router.get('/adicionar', exibirAdicaoPodcast);
router.post('/adicionar', adicionarPodcast);
router.get('/editar/:podcodigo', exibirEdicaoPodcast);
router.post('/editar/:podcodigo', editarPodcast);
router.post('/deletar/:podcodigo', excluirPodcast);

export default router;
