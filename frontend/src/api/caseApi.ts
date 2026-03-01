import type { CaseRecord } from '../types/Case';

export async function fetchCases(): Promise<CaseRecord[]> {
  const res = await fetch('/cases');
  if (!res.ok) throw new Error('Failed to fetch cases');
  return await res.json();
}

export async function createCase(payload: Partial<CaseRecord>) {
  const res = await fetch('/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create case');
  return await res.json();
}
