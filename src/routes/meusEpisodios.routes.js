import { Router } from 'express';
import { requireLogin } from '../middlewares/auth.js';
import {
  listarMeusEpisodios,
  exibirAdicaoEpisodio,
  adicionarEpisodio,
  exibirEdicaoEpisodio,
  editarEpisodio,
  excluirEpisodio
} from '../controllers/meusEpisodios.controller.js';

const router = Router();

router.use(requireLogin);

router.get('/:podcodigo', listarMeusEpisodios);
router.get('/:podcodigo/adicionar', exibirAdicaoEpisodio);
router.post('/:podcodigo/adicionar', adicionarEpisodio);
router.get('/:podcodigo/:epicodigo/editar', exibirEdicaoEpisodio);
router.post('/:podcodigo/:epicodigo', editarEpisodio);
router.post('/:podcodigo/:epicodigo/delete', excluirEpisodio);

export default router;
