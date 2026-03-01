import type { Request, Response, NextFunction } from 'express';
import {
  createCaseRecord,
  listAllCases,
  listCasesPrioritized,
  getCaseById,
  updateCaseStatus,
} from '../services/case.service.js';

export async function listCases(_req: Request, res: Response, next: NextFunction) {
  try {
    const cases = listAllCases();
    res.json({ data: cases, total: cases.length });
  } catch (err) {
    next(err);
  }
}

export async function listPrioritizedCases(_req: Request, res: Response, next: NextFunction) {
  try {
    const cases = listCasesPrioritized();
    res.json({ data: cases, total: cases.length });
  } catch (err) {
    next(err);
  }
}

export async function getCase(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as { id: string };
    const c = getCaseById(id);
    if (!c) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json({ data: c });
  } catch (err) {
    next(err);
  }
}

export async function createCase(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body as Record<string, unknown>;
    const created = await createCaseRecord(payload as any);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}

export async function patchCaseStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const ok = updateCaseStatus(id, status);
    if (!ok) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
