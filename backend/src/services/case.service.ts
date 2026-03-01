import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { runModel } from './ml.service.js';
import type { CaseRecord, CaseInput } from '../types/case.types.js';
import type { PredictionResult } from '../types/prediction.types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rowToCase(row: Record<string, unknown>): CaseRecord {
  return {
    id: row['id'] as string,
    caseNumber: row['caseNumber'] as string,
    title: row['title'] as string,
    caseType: row['caseType'] as string,
    filingDate: row['filingDate'] as string,
    hearings: row['hearings'] as number,
    adjournments: row['adjournments'] as number,
    partyType: row['partyType'] as string,
    vulnerableFlag: Boolean(row['vulnerableFlag']),
    description: row['description'] as string,
    petitioner: row['petitioner'] as string,
    respondent: row['respondent'] as string,
    courtName: row['courtName'] as string,
    judge: row['judge'] as string,
    status: row['status'] as string,
    createdAt: row['createdAt'] as string,
  };
}

function rowToPrediction(row: Record<string, unknown>): PredictionResult {
  return {
    id: row['id'] as string,
    caseId: row['caseId'] as string,
    priorityScore: row['priorityScore'] as number,
    urgencyBand: row['urgencyBand'] as PredictionResult['urgencyBand'],
    delayRisk: Boolean(row['delayRisk']),
    predictedDays: row['predictedDays'] as number,
    explanation: JSON.parse(row['explanation'] as string),
    generatedAt: row['generatedAt'] as string,
  };
}

// ─── Case CRUD ────────────────────────────────────────────────────────────────
export async function createCaseRecord(payload: Partial<CaseInput>): Promise<CaseRecord & { prediction: PredictionResult }> {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  const caseNumber = payload.caseNumber ?? `CASE/${year}/${seq}`;

  const stmt = db.prepare(`
    INSERT INTO cases (id, caseNumber, title, caseType, filingDate, hearings, adjournments,
      partyType, vulnerableFlag, description, petitioner, respondent, courtName, judge, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    caseNumber,
    payload.title ?? 'Untitled Case',
    payload.caseType ?? 'civil',
    payload.filingDate ?? now.substring(0, 10),
    payload.hearings ?? 0,
    payload.adjournments ?? 0,
    payload.partyType ?? 'individual',
    payload.vulnerableFlag ? 1 : 0,
    payload.description ?? '',
    payload.petitioner ?? '',
    payload.respondent ?? '',
    payload.courtName ?? '',
    payload.judge ?? '',
    payload.status ?? 'pending',
    now,
  );

  const caseRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown>;
  const caseRecord = rowToCase(caseRow);

  // Auto-generate prediction asynchronously
  const prediction = await runModel(caseRecord);
  upsertPrediction(db, prediction);

  return { ...caseRecord, prediction };
}

export function getCaseById(id: string): (CaseRecord & { prediction: PredictionResult | null }) | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const caseRecord = rowToCase(row);
  const predRow = db.prepare('SELECT * FROM predictions WHERE caseId = ?').get(id) as Record<string, unknown> | undefined;
  const prediction = predRow ? rowToPrediction(predRow) : null;

  return { ...caseRecord, prediction };
}

export function listAllCases(): (CaseRecord & { prediction: PredictionResult | null })[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM cases ORDER BY createdAt DESC').all() as Record<string, unknown>[];

  return rows.map(row => {
    const caseRecord = rowToCase(row);
    const predRow = db.prepare('SELECT * FROM predictions WHERE caseId = ?').get(caseRecord.id) as Record<string, unknown> | undefined;
    const prediction = predRow ? rowToPrediction(predRow) : null;
    return { ...caseRecord, prediction };
  });
}

export function listCasesPrioritized(): (CaseRecord & { prediction: PredictionResult | null })[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.id
    FROM cases c
    LEFT JOIN predictions p ON p.caseId = c.id
    ORDER BY COALESCE(p.priorityScore, 0) DESC, c.createdAt ASC
  `).all() as { id: string }[];

  return rows.map(({ id }) => {
    const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown>;
    const caseRecord = rowToCase(row);
    const predRow = db.prepare('SELECT * FROM predictions WHERE caseId = ?').get(id) as Record<string, unknown> | undefined;
    const prediction = predRow ? rowToPrediction(predRow) : null;
    return { ...caseRecord, prediction };
  });
}

export function updateCaseStatus(id: string, status: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE cases SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
}

// ─── Prediction ───────────────────────────────────────────────────────────────
export async function generatePredictionForCase(caseId: string): Promise<PredictionResult | null> {
  const caseData = getCaseById(caseId);
  if (!caseData) return null;

  const db = getDb();
  const prediction = await runModel(caseData);
  upsertPrediction(db, prediction);
  return prediction;
}

export async function regenerateAllPredictions(): Promise<number> {
  const db = getDb();
  const cases = listAllCases();
  let count = 0;

  for (const c of cases) {
    const prediction = await runModel(c);
    upsertPrediction(db, prediction);
    count++;
  }

  return count;
}

function upsertPrediction(db: import('better-sqlite3').Database, prediction: PredictionResult): void {
  db.prepare(`
    INSERT OR REPLACE INTO predictions (id, caseId, priorityScore, urgencyBand, delayRisk, predictedDays, explanation, generatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    prediction.id,
    prediction.caseId,
    prediction.priorityScore,
    prediction.urgencyBand,
    prediction.delayRisk ? 1 : 0,
    prediction.predictedDays,
    JSON.stringify(prediction.explanation),
    prediction.generatedAt,
  );
}
