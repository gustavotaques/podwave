import { Router } from 'express';
import { exibirHome } from '../controllers/home.controller.js';

const router = Router();

router.get('/', exibirHome);

export default router;
