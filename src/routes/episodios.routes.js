import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
    listarEpisodios,
    exibirEpisodio,
    comentarEpisodio,
    avaliarEpisodio,
    alternarFavorito,
    salvarProgresso,
    transmitirAudio
} from '../controllers/episodios.controller.js';

const router = Router();

router.get('/:podcodigo', requireLogin, listarEpisodios);
router.get('/:podcodigo/:epicodigo', requireLogin, exibirEpisodio);
router.post('/:podcodigo/:epicodigo/comentar', requireLogin, comentarEpisodio);
router.post('/:podcodigo/:epicodigo/avaliar', requireLogin, avaliarEpisodio);
router.post('/:podcodigo/:epicodigo/favoritar', requireLogin, alternarFavorito);
router.post('/:podcodigo/:epicodigo/progresso', requireLogin, salvarProgresso);
router.get('/:podcodigo/:epicodigo/audio', transmitirAudio);

export default router;
