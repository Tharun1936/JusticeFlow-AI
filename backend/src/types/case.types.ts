import type { PredictionResult } from './prediction.types.js';

export interface CaseRecord {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  filingDate: string; // ISO date string
  hearings: number;
  adjournments: number;
  partyType: string;
  vulnerableFlag: boolean;
  description: string;
  petitioner: string;
  respondent: string;
  courtName: string;
  judge: string;
  status: string;
  createdAt: string;
  prediction?: PredictionResult | null;
}

export type CaseInput = Omit<CaseRecord, 'id' | 'createdAt' | 'prediction'>;
