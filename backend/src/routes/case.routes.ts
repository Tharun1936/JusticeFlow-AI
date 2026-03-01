import { Router } from 'express';
import {
    createCase,
    listCases,
    listPrioritizedCases,
    getCase,
    patchCaseStatus,
} from '../controllers/case.controller.js';

const router = Router();

router.get('/', listCases);
router.get('/prioritized', listPrioritizedCases);
router.get('/:id', getCase);
router.post('/', createCase);
router.patch('/:id/status', patchCaseStatus);

export default router;
