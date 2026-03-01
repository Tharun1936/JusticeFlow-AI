/**
 * AI Priority Scoring Engine
 * 
 * This module implements a rule-based + heuristic scoring model to prioritize
 * judicial cases. It is designed as an explainable decision-support system —
 * every score comes with a breakdown of contributing factors.
 * 
 * Scoring dimensions (total: 100 points):
 *  1. Case Age / Pendency           (0-25 pts)
 *  2. Adjournment Rate              (0-20 pts)
 *  3. Case Type Severity            (0-20 pts)
 *  4. Vulnerable Party Flag         (0-15 pts)
 *  5. Hearing Frequency             (0-10 pts)
 *  6. Procedural Intensity          (0-10 pts)
 */

import { v4 as uuidv4 } from 'uuid';
import type { CaseRecord } from '../types/case.types.js';
import type { PredictionResult, ExplanationFactor } from '../types/prediction.types.js';

// ─── Case Type Severity Map ───────────────────────────────────────────────────
const CASE_TYPE_SEVERITY: Record<string, number> = {
  'criminal': 20,
  'habeas-corpus': 20,
  'child-custody': 18,
  'domestic-violence': 18,
  'bail': 17,
  'land-acquisition': 14,
  'family': 13,
  'civil': 10,
  'consumer': 8,
  'commercial': 8,
  'tax': 6,
  'labour': 9,
  'revenue': 6,
  'other': 5,
};

// ─── Party Type Score Modifier ────────────────────────────────────────────────
const PARTY_TYPE_BOOST: Record<string, number> = {
  'individual': 4,
  'minor': 10,
  'senior': 8,
  'government': 2,
  'corporation': 1,
  'ngo': 3,
};

// ─── Delay Prediction Parameters ─────────────────────────────────────────────
function estimateDelayDays(
  ageDays: number,
  adjournments: number,
  hearings: number
): number {
  const adjournmentFactor = adjournments > 0 ? adjournments * 30 : 0;
  const hearingFactor = hearings < 3 ? 90 : hearings < 8 ? 45 : 15;
  const ageFactor = ageDays > 730 ? 30 : ageDays > 365 ? 60 : 90;
  const predicted = Math.round((adjournmentFactor + hearingFactor + ageFactor) / 2);
  return Math.max(14, Math.min(predicted, 730)); // clamp between 14 days and 2 years
}

// ─── Urgency Band Classifier ──────────────────────────────────────────────────
function classifyUrgencyBand(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

// ─── Core Scoring Function ────────────────────────────────────────────────────
export async function runModel(caseData: CaseRecord): Promise<PredictionResult> {
  const now = new Date();
  const filingDate = new Date(caseData.filingDate);
  const ageDays = Math.max(0, Math.floor((now.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24)));

  const factors: ExplanationFactor[] = [];
  let totalScore = 0;

  // ────────────────────────────────────────────────
  // FACTOR 1: Case Age / Pendency (0-25 pts)
  // ────────────────────────────────────────────────
  let agencyScore: number;
  let ageLabel: string;
  let ageImpact: 'high' | 'medium' | 'low';

  if (ageDays >= 1825) {          // 5+ years
    agencyScore = 25;
    ageLabel = `Case has been pending for over ${Math.floor(ageDays / 365)} years — extremely high urgency.`;
    ageImpact = 'high';
  } else if (ageDays >= 1095) {   // 3-5 years
    agencyScore = 20;
    ageLabel = `Case has been pending for ${Math.floor(ageDays / 365)}+ years — high urgency.`;
    ageImpact = 'high';
  } else if (ageDays >= 365) {    // 1-3 years
    agencyScore = Math.round(10 + (ageDays - 365) / (1095 - 365) * 10);
    ageLabel = `Case pending for over ${Math.floor(ageDays / 30)} months — moderate urgency.`;
    ageImpact = 'medium';
  } else if (ageDays >= 90) {     // 3-12 months
    agencyScore = Math.round(4 + (ageDays - 90) / (365 - 90) * 6);
    ageLabel = `Case filed ${Math.floor(ageDays / 30)} months ago — normal timeline.`;
    ageImpact = 'low';
  } else {
    agencyScore = Math.round(ageDays / 90 * 4);
    ageLabel = `Recently filed case (${ageDays} days ago) — low urgency from age.`;
    ageImpact = 'low';
  }
  totalScore += agencyScore;
  factors.push({
    factor: 'Case Pendency',
    impact: ageImpact,
    direction: ageImpact === 'low' ? 'negative' : 'positive',
    detail: ageLabel,
    weight: 25,
    contribution: agencyScore,
  });

  // ────────────────────────────────────────────────
  // FACTOR 2: Adjournment Rate (0-20 pts)
  // ────────────────────────────────────────────────
  const adjRate = caseData.hearings > 0
    ? caseData.adjournments / caseData.hearings
    : caseData.adjournments > 0 ? 1 : 0;

  let adjScore: number;
  let adjLabel: string;
  let adjImpact: 'high' | 'medium' | 'low';

  if (adjRate >= 0.7) {
    adjScore = 20;
    adjLabel = `Critically high adjournment rate (${Math.round(adjRate * 100)}%). Case appears persistently delayed.`;
    adjImpact = 'high';
  } else if (adjRate >= 0.5) {
    adjScore = 15;
    adjLabel = `High adjournment rate (${Math.round(adjRate * 100)}%). Consistent delays observed.`;
    adjImpact = 'high';
  } else if (adjRate >= 0.3) {
    adjScore = 10;
    adjLabel = `Moderate adjournment rate (${Math.round(adjRate * 100)}%). Some delays present.`;
    adjImpact = 'medium';
  } else if (caseData.adjournments > 0) {
    adjScore = 5;
    adjLabel = `Low adjournment rate. ${caseData.adjournments} adjournment(s) in ${caseData.hearings} hearing(s).`;
    adjImpact = 'low';
  } else {
    adjScore = 0;
    adjLabel = `No adjournments recorded. Case proceeding smoothly.`;
    adjImpact = 'low';
  }
  totalScore += adjScore;
  factors.push({
    factor: 'Adjournment Rate',
    impact: adjImpact,
    direction: adjScore > 8 ? 'positive' : 'negative',
    detail: adjLabel,
    weight: 20,
    contribution: adjScore,
  });

  // ────────────────────────────────────────────────
  // FACTOR 3: Case Type Severity (0-20 pts)
  // ────────────────────────────────────────────────
  const typeKey = caseData.caseType.toLowerCase().replace(/\s+/g, '-');
  const typeScore = CASE_TYPE_SEVERITY[typeKey] ?? CASE_TYPE_SEVERITY['other']!;
  let typeSeverityImpact: 'high' | 'medium' | 'low';
  if (typeScore >= 16) typeSeverityImpact = 'high';
  else if (typeScore >= 10) typeSeverityImpact = 'medium';
  else typeSeverityImpact = 'low';

  totalScore += typeScore;
  factors.push({
    factor: 'Case Type Severity',
    impact: typeSeverityImpact,
    direction: 'positive',
    detail: `Case type "${caseData.caseType}" carries ${typeSeverityImpact} inherent priority based on potential human rights and liberty implications.`,
    weight: 20,
    contribution: typeScore,
  });

  // ────────────────────────────────────────────────
  // FACTOR 4: Vulnerable Party (0-15 pts)
  // ────────────────────────────────────────────────
  let vulnerableScore = 0;
  let vulnerableLabel: string;
  let vulnerableImpact: 'high' | 'medium' | 'low';

  const partyTypeKey = caseData.partyType.toLowerCase();
  const partyBoost = PARTY_TYPE_BOOST[partyTypeKey] ?? 1;

  if (caseData.vulnerableFlag) {
    vulnerableScore = Math.min(15, 10 + partyBoost);
    vulnerableLabel = `Vulnerable party flag is SET. Party type: "${caseData.partyType}" — significant priority boost applied.`;
    vulnerableImpact = 'high';
  } else {
    vulnerableScore = Math.round(partyBoost * 0.5);
    vulnerableLabel = `No vulnerable flag. Party type "${caseData.partyType}" minor adjustment applied.`;
    vulnerableImpact = 'low';
  }
  totalScore += vulnerableScore;
  factors.push({
    factor: 'Vulnerable Party Protection',
    impact: vulnerableImpact,
    direction: caseData.vulnerableFlag ? 'positive' : 'negative',
    detail: vulnerableLabel,
    weight: 15,
    contribution: vulnerableScore,
  });

  // ────────────────────────────────────────────────
  // FACTOR 5: Hearing Frequency (0-10 pts)
  // ────────────────────────────────────────────────
  let hearingScore: number;
  let hearingLabel: string;
  let hearingImpact: 'high' | 'medium' | 'low';

  const expectedHearings = Math.max(1, Math.floor(ageDays / 60)); // 1 hearing per 2 months expected
  const hearingRatio = caseData.hearings / expectedHearings;

  if (hearingRatio < 0.3) {
    hearingScore = 10;
    hearingLabel = `Significantly below expected hearing frequency (${caseData.hearings} of ~${expectedHearings} expected). Case may be stalled.`;
    hearingImpact = 'high';
  } else if (hearingRatio < 0.6) {
    hearingScore = 6;
    hearingLabel = `Below expected hearing frequency. Case moving slower than normal pace.`;
    hearingImpact = 'medium';
  } else if (hearingRatio < 1.0) {
    hearingScore = 3;
    hearingLabel = `Near expected hearing frequency. Case progressing at a reasonable pace.`;
    hearingImpact = 'low';
  } else {
    hearingScore = 1;
    hearingLabel = `Hearing frequency is adequate. Case actively moving through the system.`;
    hearingImpact = 'low';
  }
  totalScore += hearingScore;
  factors.push({
    factor: 'Hearing Frequency',
    impact: hearingImpact,
    direction: hearingScore > 5 ? 'positive' : 'negative',
    detail: hearingLabel,
    weight: 10,
    contribution: hearingScore,
  });

  // ────────────────────────────────────────────────
  // FACTOR 6: Procedural Intensity (0-10 pts)
  // ────────────────────────────────────────────────
  const totalProceedings = caseData.hearings + caseData.adjournments;
  let proceduralScore: number;
  let proceduralLabel: string;
  let proceduralImpact: 'high' | 'medium' | 'low';

  if (totalProceedings >= 30) {
    proceduralScore = 10;
    proceduralLabel = `High procedural complexity (${totalProceedings} total proceedings). Extensive procedural history warrants priority.`;
    proceduralImpact = 'high';
  } else if (totalProceedings >= 15) {
    proceduralScore = 6;
    proceduralLabel = `Moderate procedural load (${totalProceedings} proceedings). Some complexity present.`;
    proceduralImpact = 'medium';
  } else if (totalProceedings >= 5) {
    proceduralScore = 3;
    proceduralLabel = `Light procedural load (${totalProceedings} proceedings). Standard complexity.`;
    proceduralImpact = 'low';
  } else {
    proceduralScore = 1;
    proceduralLabel = `Minimal proceedings (${totalProceedings}). Early-stage case.`;
    proceduralImpact = 'low';
  }
  totalScore += proceduralScore;
  factors.push({
    factor: 'Procedural Complexity',
    impact: proceduralImpact,
    direction: proceduralScore > 5 ? 'positive' : 'negative',
    detail: proceduralLabel,
    weight: 10,
    contribution: proceduralScore,
  });

  // ─── Normalize to 0-100 ───────────────────────────────────────────────────
  const maxPossible = 25 + 20 + 20 + 15 + 10 + 10; // 100
  const normalizedScore = Math.min(100, Math.round((totalScore / maxPossible) * 100));

  // ─── Determine Delay Risk ─────────────────────────────────────────────────
  const delayRisk = adjRate >= 0.4 || ageDays >= 730 || (caseData.hearings > 0 && hearingRatio < 0.4);

  // ─── Predict Days to Resolution ──────────────────────────────────────────
  const predictedDays = estimateDelayDays(ageDays, caseData.adjournments, caseData.hearings);

  // ─── Urgency Classification ───────────────────────────────────────────────
  const urgencyBand = classifyUrgencyBand(normalizedScore);

  return {
    id: uuidv4(),
    caseId: caseData.id,
    priorityScore: normalizedScore,
    urgencyBand,
    delayRisk,
    predictedDays,
    explanation: factors,
    generatedAt: new Date().toISOString(),
  };
}
