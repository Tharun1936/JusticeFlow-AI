import { Router } from 'express';
import { predict, getPredictionForCase } from '../controllers/prediction.controller.js';

const router = Router();

router.post('/generate', predict);
router.get('/case/:id', getPredictionForCase);

export default router;
