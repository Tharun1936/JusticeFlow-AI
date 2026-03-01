import type { Request, Response, NextFunction } from 'express';
import { generatePredictionForCase } from '../services/case.service.js';
import { getCaseById } from '../services/case.service.js';

export async function predict(req: Request, res: Response, next: NextFunction) {
  try {
    const { caseId } = req.body as { caseId: string };
    if (!caseId) {
      res.status(400).json({ error: 'caseId is required' });
      return;
    }

    const prediction = await generatePredictionForCase(caseId);
    if (!prediction) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.json({ prediction });
  } catch (err) {
    next(err);
  }
}

export async function getPredictionForCase(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as { id: string };
    const caseData = getCaseById(id);
    if (!caseData) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json({ prediction: caseData.prediction });
  } catch (err) {
    next(err);
  }
}
