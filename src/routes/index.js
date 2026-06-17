import { Router } from 'express';
import homeRoutes from './home.routes.js';
import authRoutes from './auth.routes.js';
import listasRoutes from './listas.routes.js';
import episodiosRoutes from './episodios.routes.js';
import meusPodcastsRoutes from './meusPodcasts.routes.js';
import meusEpisodiosRoutes from './meusEpisodios.routes.js';

const router = Router();

router.use('/', homeRoutes);
router.use('/', authRoutes);
router.use('/listas', listasRoutes);
router.use('/episodios', episodiosRoutes);
router.use('/meusPodcasts', meusPodcastsRoutes);
router.use('/meusEpisodios', meusEpisodiosRoutes);

export default router;
