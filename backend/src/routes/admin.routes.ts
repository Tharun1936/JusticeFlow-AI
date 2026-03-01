import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { computeFairnessMetrics } from '../services/fairness.service.js';
import { regenerateAllPredictions } from '../services/case.service.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.get('/fairness', (_req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = computeFairnessMetrics();
        res.json({ data: metrics });
    } catch (err) {
        next(err);
    }
});

router.post('/regenerate-all', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await regenerateAllPredictions();
        res.json({ success: true, regenerated: count, message: `Successfully regenerated predictions for ${count} cases.` });
    } catch (err) {
        next(err);
    }
});

export default router;
