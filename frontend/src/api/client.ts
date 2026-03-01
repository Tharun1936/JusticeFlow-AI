import axios from 'axios';

const API_BASE = 'http://localhost:4000';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ExplanationFactor {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    direction: 'positive' | 'negative';
    detail: string;
    weight: number;
    contribution: number;
}

export interface Prediction {
    id: string;
    caseId: string;
    priorityScore: number;
    urgencyBand: 'critical' | 'high' | 'medium' | 'low';
    delayRisk: boolean;
    predictedDays: number;
    explanation: ExplanationFactor[];
    generatedAt: string;
}

export interface Case {
    id: string;
    caseNumber: string;
    title: string;
    caseType: string;
    filingDate: string;
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
    prediction: Prediction | null;
}

export interface CaseInput {
    title: string;
    caseNumber?: string;
    caseType: string;
    filingDate: string;
    hearings: number;
    adjournments: number;
    partyType: string;
    vulnerableFlag: boolean;
    description: string;
    petitioner: string;
    respondent: string;
    courtName: string;
    judge: string;
    status?: string;
}

export interface FairnessMetrics {
    totalCases: number;
    byUrgencyBand: Record<string, number>;
    byPartyType: Record<string, { count: number; avgScore: number; avgDelayRisk: number }>;
    byCaseType: Record<string, { count: number; avgScore: number }>;
    averagePendencyDays: number;
    delayRiskRate: number;
    vulnerableCaseStats: { count: number; avgScore: number; avgPendency: number };
    nonVulnerableCaseStats: { count: number; avgScore: number; avgPendency: number };
    scoreDistribution: { range: string; count: number }[];
    predictionsGenerated: number;
}

// ─── Case APIs ─────────────────────────────────────────────────────────────────
export const casesApi = {
    list: async (): Promise<Case[]> => {
        const res = await api.get('/cases');
        return res.data.data;
    },
    listPrioritized: async (): Promise<Case[]> => {
        const res = await api.get('/cases/prioritized');
        return res.data.data;
    },
    get: async (id: string): Promise<Case> => {
        const res = await api.get(`/cases/${id}`);
        return res.data.data;
    },
    create: async (payload: CaseInput): Promise<Case> => {
        const res = await api.post('/cases', payload);
        return res.data.data;
    },
    updateStatus: async (id: string, status: string): Promise<void> => {
        await api.patch(`/cases/${id}/status`, { status });
    },
};

// ─── Prediction APIs ──────────────────────────────────────────────────────────
export const predictionsApi = {
    generate: async (caseId: string): Promise<Prediction> => {
        const res = await api.post('/predictions/generate', { caseId });
        return res.data.prediction;
    },
};

// ─── Admin APIs ───────────────────────────────────────────────────────────────
export const adminApi = {
    health: async () => {
        const res = await api.get('/admin/health');
        return res.data;
    },
    fairness: async (): Promise<FairnessMetrics> => {
        const res = await api.get('/admin/fairness');
        return res.data.data;
    },
    regenerateAll: async (): Promise<{ success: boolean; regenerated: number; message: string }> => {
        const res = await api.post('/admin/regenerate-all');
        return res.data;
    },
};

export default api;
