import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesApi, type Case } from '../api/client';
import PredictionPanel, { BandBadge, DelayRiskIndicator } from '../components/PredictionPanel';
import { useToast } from '../components/Toast';

function StatCard({ label, value, sub, variant }: { label: string; value: string | number; sub?: string; variant?: string }) {
    return (
        <div className={`stat-card ${variant ?? ''}`}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

export default function Dashboard() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await casesApi.listPrioritized();
            setCases(data);
        } catch {
            showToast('error', 'Failed to load cases');
        } finally {
            setLoading(false);
        }
    }

    const totalCases = cases.length;
    const criticalCount = cases.filter(c => c.prediction?.urgencyBand === 'critical').length;
    const highCount = cases.filter(c => c.prediction?.urgencyBand === 'high').length;
    const delayRiskCount = cases.filter(c => c.prediction?.delayRisk).length;
    const avgScore = cases.length > 0
        ? Math.round(cases.reduce((s, c) => s + (c.prediction?.priorityScore ?? 0), 0) / cases.length)
        : 0;

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'var(--color-critical)';
        if (score >= 55) return 'var(--color-high)';
        if (score >= 35) return 'var(--color-medium)';
        return 'var(--color-low)';
    };

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Dashboard</h1>
                    <p>Overview of judicial case prioritization system</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary btn-sm" onClick={load}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                        </svg>
                        Refresh
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/cases/new')}>
                        + New Case
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <StatCard label="Total Cases" value={totalCases} sub="In system" variant="accent" />
                    <StatCard label="Critical" value={criticalCount} sub="Require immediate attention" variant="critical" />
                    <StatCard label="High Priority" value={highCount} sub="Expedited review needed" variant="high" />
                    <StatCard label="Delay Risk" value={delayRiskCount} sub="Risk of further delay" variant="medium" />
                    <StatCard label="Avg. Score" value={`${avgScore}/100`} sub="System average priority" variant="low" />
                </div>

                {/* Top Critical Cases */}
                {criticalCount > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div className="section-header">
                            <div>
                                <div className="section-title">🚨 Critical Cases — Immediate Attention Required</div>
                                <div className="section-subtitle">These cases have the highest urgency scores and require priority scheduling consideration</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                            {cases.filter(c => c.prediction?.urgencyBand === 'critical').slice(0, 6).map(c => (
                                <div
                                    key={c.id}
                                    className="card"
                                    style={{ borderColor: 'var(--color-critical-border)', cursor: 'pointer' }}
                                    onClick={() => setSelectedCase(c)}
                                >
                                    <div style={{ background: 'var(--color-critical-bg)', padding: '12px 16px', borderBottom: '1px solid var(--color-critical-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="case-number">{c.caseNumber}</span>
                                        <BandBadge band="critical" />
                                    </div>
                                    <div className="card-body" style={{ padding: '14px 16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: 'var(--color-text-primary)' }}>{c.title}</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                                            {c.petitioner} vs. {c.respondent}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-critical)' }}>
                                                {c.prediction?.priorityScore ?? '–'}
                                            </span>
                                            {c.prediction && <DelayRiskIndicator risk={c.prediction.delayRisk} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Cases Table */}
                <div className="section-header">
                    <div>
                        <div className="section-title">All Cases — Prioritized View</div>
                        <div className="section-subtitle">Sorted by AI priority score (highest first)</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/cause-list')}>
                        View Full Cause List →
                    </button>
                </div>

                {loading ? (
                    <div className="loading-page">
                        <div className="loading-spinner" />
                        Loading cases...
                    </div>
                ) : cases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">⚖️</div>
                        <div className="empty-title">No cases in the system yet</div>
                        <div className="empty-desc">Create your first case to see AI-generated prioritization scores</div>
                        <button className="btn btn-primary" onClick={() => navigate('/cases/new')}>
                            + Create First Case
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Case Number</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Filed</th>
                                    <th>Adj / Hrg</th>
                                    <th>Score</th>
                                    <th>Band</th>
                                    <th>Delay Risk</th>
                                    <th>Est. Wait</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.slice(0, 20).map((c, idx) => (
                                    <tr key={c.id} onClick={() => setSelectedCase(c)}>
                                        <td className="rank-cell">{idx + 1}</td>
                                        <td><span className="case-number">{c.caseNumber}</span></td>
                                        <td style={{ maxWidth: 200 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                {c.petitioner} vs. {c.respondent}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-badge">{c.caseType}</span>
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                            {new Date(c.filingDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ fontSize: 12, textAlign: 'center' }}>
                                            {c.adjournments} / {c.hearings}
                                        </td>
                                        <td className="score-bar-cell">
                                            {c.prediction ? (
                                                <div className="score-bar-wrapper">
                                                    <div className="score-bar-bg">
                                                        <div
                                                            className="score-bar-fill"
                                                            style={{
                                                                width: `${c.prediction.priorityScore}%`,
                                                                background: getScoreColor(c.prediction.priorityScore),
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="score-bar-number" style={{ color: getScoreColor(c.prediction.priorityScore) }}>
                                                        {c.prediction.priorityScore}
                                                    </span>
                                                </div>
                                            ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>—</span>}
                                        </td>
                                        <td>
                                            {c.prediction ? <BandBadge band={c.prediction.urgencyBand} /> : '—'}
                                        </td>
                                        <td>
                                            {c.prediction ? <DelayRiskIndicator risk={c.prediction.delayRisk} /> : '—'}
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                            {c.prediction ? `~${c.prediction.predictedDays}d` : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Case Detail Modal */}
            {selectedCase && (
                <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <span className="case-number" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                                    {selectedCase.caseNumber}
                                </span>
                                <div className="modal-title">{selectedCase.title}</div>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedCase(null)} aria-label="Close">✕</button>
                        </div>
                        <div className="modal-body">
                            {/* Case Info */}
                            <div className="info-grid" style={{ marginBottom: 20 }}>
                                <div className="info-item"><label>Petitioner</label><span>{selectedCase.petitioner || '—'}</span></div>
                                <div className="info-item"><label>Respondent</label><span>{selectedCase.respondent || '—'}</span></div>
                                <div className="info-item"><label>Case Type</label><span style={{ textTransform: 'capitalize' }}>{selectedCase.caseType}</span></div>
                                <div className="info-item"><label>Court</label><span>{selectedCase.courtName || '—'}</span></div>
                                <div className="info-item"><label>Judge</label><span>{selectedCase.judge || '—'}</span></div>
                                <div className="info-item"><label>Filed On</label><span>{new Date(selectedCase.filingDate).toLocaleDateString('en-IN')}</span></div>
                                <div className="info-item"><label>Hearings</label><span>{selectedCase.hearings}</span></div>
                                <div className="info-item"><label>Adjournments</label><span>{selectedCase.adjournments}</span></div>
                                <div className="info-item"><label>Vulnerable Flag</label><span>{selectedCase.vulnerableFlag ? '✓ Yes' : '✕ No'}</span></div>
                                <div className="info-item"><label>Status</label><span className="status-badge">{selectedCase.status}</span></div>
                            </div>
                            {selectedCase.description && (
                                <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                                    {selectedCase.description}
                                </div>
                            )}
                            <div className="divider" />
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--color-text-primary)' }}>
                                🤖 AI Priority Analysis
                            </div>
                            {selectedCase.prediction ? (
                                <PredictionPanel prediction={selectedCase.prediction} />
                            ) : (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No prediction available</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
