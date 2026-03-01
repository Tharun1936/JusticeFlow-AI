import { getDb } from '../db/database.js';

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

export function computeFairnessMetrics(): FairnessMetrics {
  const db = getDb();
  const now = new Date();

  const cases = db.prepare(`
    SELECT c.*, p.priorityScore, p.urgencyBand, p.delayRisk, p.predictedDays
    FROM cases c
    LEFT JOIN predictions p ON p.caseId = c.id
  `).all() as Record<string, unknown>[];

  const totalCases = cases.length;
  const predictionsGenerated = cases.filter(c => c['priorityScore'] != null).length;

  // By Urgency Band
  const byUrgencyBand: Record<string, number> = {
    critical: 0, high: 0, medium: 0, low: 0, unscored: 0,
  };
  cases.forEach(c => {
    const band = (c['urgencyBand'] as string) ?? 'unscored';
    byUrgencyBand[band] = (byUrgencyBand[band] ?? 0) + 1;
  });

  // By Party Type
  const byPartyType: Record<string, { count: number; totalScore: number; totalDelayRisk: number }> = {};
  cases.forEach(c => {
    const pt = (c['partyType'] as string) ?? 'unknown';
    if (!byPartyType[pt]) byPartyType[pt] = { count: 0, totalScore: 0, totalDelayRisk: 0 };
    byPartyType[pt]!.count++;
    byPartyType[pt]!.totalScore += (c['priorityScore'] as number) ?? 0;
    byPartyType[pt]!.totalDelayRisk += (c['delayRisk'] as number) ?? 0;
  });

  const byPartyTypeResult: Record<string, { count: number; avgScore: number; avgDelayRisk: number }> = {};
  for (const [pt, stats] of Object.entries(byPartyType)) {
    byPartyTypeResult[pt] = {
      count: stats.count,
      avgScore: stats.count > 0 ? Math.round((stats.totalScore / stats.count) * 10) / 10 : 0,
      avgDelayRisk: stats.count > 0 ? Math.round((stats.totalDelayRisk / stats.count) * 100) : 0,
    };
  }

  // By Case Type
  const byCaseTypeTemp: Record<string, { count: number; totalScore: number }> = {};
  cases.forEach(c => {
    const ct = (c['caseType'] as string) ?? 'unknown';
    if (!byCaseTypeTemp[ct]) byCaseTypeTemp[ct] = { count: 0, totalScore: 0 };
    byCaseTypeTemp[ct]!.count++;
    byCaseTypeTemp[ct]!.totalScore += (c['priorityScore'] as number) ?? 0;
  });

  const byCaseType: Record<string, { count: number; avgScore: number }> = {};
  for (const [ct, stats] of Object.entries(byCaseTypeTemp)) {
    byCaseType[ct] = {
      count: stats.count,
      avgScore: stats.count > 0 ? Math.round((stats.totalScore / stats.count) * 10) / 10 : 0,
    };
  }

  // Average Pendency Days
  let totalPendencyDays = 0;
  cases.forEach(c => {
    const filing = new Date(c['filingDate'] as string);
    const ageDays = Math.floor((now.getTime() - filing.getTime()) / (1000 * 60 * 60 * 24));
    totalPendencyDays += ageDays;
  });
  const averagePendencyDays = totalCases > 0 ? Math.round(totalPendencyDays / totalCases) : 0;

  // Delay Risk Rate
  const delayRiskCount = cases.filter(c => c['delayRisk']).length;
  const delayRiskRate = predictionsGenerated > 0 ? Math.round((delayRiskCount / predictionsGenerated) * 100) : 0;

  // Vulnerable vs Non-Vulnerable
  const vulnerableCases = cases.filter(c => c['vulnerableFlag']);
  const nonVulnerableCases = cases.filter(c => !c['vulnerableFlag']);

  function groupStats(group: Record<string, unknown>[]) {
    const count = group.length;
    const avgScore = count > 0
      ? Math.round(group.reduce((s, c) => s + ((c['priorityScore'] as number) ?? 0), 0) / count * 10) / 10
      : 0;
    const avgPendency = count > 0
      ? Math.round(group.reduce((s, c) => {
        const d = new Date(c['filingDate'] as string);
        return s + Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      }, 0) / count)
      : 0;
    return { count, avgScore, avgPendency };
  }

  // Score Distribution
  const scoreDistribution = [
    { range: '0-20', count: 0 },
    { range: '21-40', count: 0 },
    { range: '41-60', count: 0 },
    { range: '61-80', count: 0 },
    { range: '81-100', count: 0 },
  ];
  cases.forEach(c => {
    const score = (c['priorityScore'] as number) ?? 0;
    if (score <= 20) scoreDistribution[0]!.count++;
    else if (score <= 40) scoreDistribution[1]!.count++;
    else if (score <= 60) scoreDistribution[2]!.count++;
    else if (score <= 80) scoreDistribution[3]!.count++;
    else scoreDistribution[4]!.count++;
  });

  return {
    totalCases,
    byUrgencyBand,
    byPartyType: byPartyTypeResult,
    byCaseType,
    averagePendencyDays,
    delayRiskRate,
    vulnerableCaseStats: groupStats(vulnerableCases),
    nonVulnerableCaseStats: groupStats(nonVulnerableCases),
    scoreDistribution,
    predictionsGenerated,
  };
}
