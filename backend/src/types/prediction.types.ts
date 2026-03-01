export interface PredictionResult {
  id: string;
  caseId: string;
  priorityScore: number;       // 0-100
  urgencyBand: 'critical' | 'high' | 'medium' | 'low';
  delayRisk: boolean;
  predictedDays: number;       // days to hearing likely needed
  explanation: ExplanationFactor[];
  generatedAt: string;
}

export interface ExplanationFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  direction: 'positive' | 'negative';
  detail: string;
  weight: number;
  contribution: number;
}
