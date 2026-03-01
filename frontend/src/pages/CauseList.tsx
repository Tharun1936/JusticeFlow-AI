import { useEffect, useState } from 'react';
import { casesApi, predictionsApi, type Case } from '../api/client';
import PredictionPanel, { BandBadge, DelayRiskIndicator } from '../components/PredictionPanel';
import { useToast } from '../components/Toast';

type FilterBand = 'all' | 'critical' | 'high' | 'medium' | 'low';
type FilterRisk = 'all' | 'risk' | 'safe';

export default function CauseList() {
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [bandFilter, setBandFilter] = useState<FilterBand>('all');
    const [riskFilter, setRiskFilter] = useState<FilterRisk>('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await casesApi.listPrioritized();
            setCases(data);
        } catch {
            showToast('error', 'Failed to load prioritized cases');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegenerate(caseId: string) {
        setRegeneratingId(caseId);
        try {
            const prediction = await predictionsApi.generate(caseId);
            setCases(prev => prev.map(c => c.id === caseId ? { ...c, prediction } : c));
            if (selectedCase?.id === caseId) {
                setSelectedCase(prev => prev ? { ...prev, prediction } : null);
            }
            showToast('success', 'Prediction regenerated successfully');
        } catch {
            showToast('error', 'Failed to regenerate prediction');
        } finally {
            setRegeneratingId(null);
        }
    }

    const caseTypes = ['all', ...new Set(cases.map(c => c.caseType))];

    const filtered = cases.filter(c => {
        if (bandFilter !== 'all' && c.prediction?.urgencyBand !== bandFilter) return false;
        if (riskFilter === 'risk' && !c.prediction?.delayRisk) return false;
        if (riskFilter === 'safe' && c.prediction?.delayRisk) return false;
        if (typeFilter !== 'all' && c.caseType !== typeFilter) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                c.caseNumber.toLowerCase().includes(term) ||
                c.title.toLowerCase().includes(term) ||
                c.petitioner.toLowerCase().includes(term) ||
                c.respondent.toLowerCase().includes(term)
            );
        }
        return true;
    });

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
                    <h1>Cause List</h1>
                    <p>AI-prioritized case queue — {filtered.length} of {cases.length} cases shown</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={load}>
                    ↻ Refresh
                </button>
            </div>

            <div className="page-body">
                {/* Filters */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-body" style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Search */}
                            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    id="cause-list-search"
                                    className="form-input"
                                    style={{ paddingLeft: 32 }}
                                    placeholder="Search cases..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Urgency Band Filter */}
                            <select
                                id="band-filter"
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={bandFilter}
                                onChange={e => setBandFilter(e.target.value as FilterBand)}
                            >
                                <option value="all">All Bands</option>
                                <option value="critical">🔴 Critical</option>
                                <option value="high">🟠 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low</option>
                            </select>

                            {/* Delay Risk Filter */}
                            <select
                                id="risk-filter"
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={riskFilter}
                                onChange={e => setRiskFilter(e.target.value as FilterRisk)}
                            >
                                <option value="all">All Risk</option>
                                <option value="risk">High Delay Risk</option>
                                <option value="safe">On Track</option>
                            </select>

                            {/* Case Type Filter */}
                            <select
                                id="type-filter"
                                className="form-select"
                                style={{ width: 'auto' }}
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                            >
                                {caseTypes.map(ct => (
                                    <option key={ct} value={ct}>{ct === 'all' ? 'All Types' : ct.charAt(0).toUpperCase() + ct.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    {(['critical', 'high', 'medium', 'low'] as const).map(band => {
                        const count = cases.filter(c => c.prediction?.urgencyBand === band).length;
                        return (
                            <button
                                key={band}
                                className={`band-badge ${band}`}
                                style={{ cursor: 'pointer', border: '1px solid', fontSize: 11 }}
                                onClick={() => setBandFilter(bandFilter === band ? 'all' : band)}
                            >
                                {band.toUpperCase()} ({count})
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="loading-page">
                        <div className="loading-spinner" />
                        Loading prioritized cases...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No cases match your filters</div>
                        <div className="empty-desc">Try adjusting the filters above</div>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Case No.</th>
                                    <th>Case Details</th>
                                    <th>Type</th>
                                    <th>Court</th>
                                    <th>Filed</th>
                                    <th style={{ textAlign: 'center' }}>Adj/Hrg</th>
                                    <th>AI Score</th>
                                    <th>Band</th>
                                    <th>Delay</th>
                                    <th>Est. Wait</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, idx) => (
                                    <tr key={c.id} onClick={() => setSelectedCase(c)}>
                                        <td className="rank-cell">#{idx + 1}</td>
                                        <td><span className="case-number">{c.caseNumber}</span></td>
                                        <td style={{ maxWidth: 220 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                                {c.petitioner} vs. {c.respondent}
                                            </div>
                                            {c.vulnerableFlag && (
                                                <span style={{ fontSize: 10, color: 'var(--color-high)', fontWeight: 700, marginTop: 2, display: 'block' }}>
                                                    ⚠ VULNERABLE PARTY
                                                </span>
                                            )}
                                        </td>
                                        <td><span className="status-badge" style={{ textTransform: 'capitalize' }}>{c.caseType}</span></td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.courtName || '—'}
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {new Date(c.filingDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: 12 }}>
                                            {c.adjournments}/{c.hearings}
                                        </td>
                                        <td className="score-bar-cell">
                                            {c.prediction ? (
                                                <div className="score-bar-wrapper">
                                                    <div className="score-bar-bg">
                                                        <div
                                                            className="score-bar-fill"
                                                            style={{ width: `${c.prediction.priorityScore}%`, background: getScoreColor(c.prediction.priorityScore) }}
                                                        />
                                                    </div>
                                                    <span className="score-bar-number" style={{ color: getScoreColor(c.prediction.priorityScore) }}>
                                                        {c.prediction.priorityScore}
                                                    </span>
                                                </div>
                                            ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                                        </td>
                                        <td>{c.prediction ? <BandBadge band={c.prediction.urgencyBand} /> : '—'}</td>
                                        <td>{c.prediction ? <DelayRiskIndicator risk={c.prediction.delayRisk} /> : '—'}</td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                                            {c.prediction ? `~${c.prediction.predictedDays}d` : '—'}
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                title="Regenerate AI prediction"
                                                disabled={regeneratingId === c.id}
                                                onClick={() => handleRegenerate(c.id)}
                                            >
                                                {regeneratingId === c.id ? <div className="loading-spinner" style={{ width: 12, height: 12 }} /> : '↻'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedCase && (
                <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <span className="case-number" style={{ display: 'block', marginBottom: 4 }}>{selectedCase.caseNumber}</span>
                                <div className="modal-title">{selectedCase.title}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    disabled={regeneratingId === selectedCase.id}
                                    onClick={() => handleRegenerate(selectedCase.id)}
                                >
                                    {regeneratingId === selectedCase.id ? <><div className="loading-spinner" style={{ width: 12, height: 12 }} /> Scoring...</> : '↻ Rescore'}
                                </button>
                                <button className="btn-icon" onClick={() => setSelectedCase(null)}>✕</button>
                            </div>
                        </div>
                        <div className="modal-body">
                            <div className="info-grid" style={{ marginBottom: 20 }}>
                                <div className="info-item"><label>Petitioner</label><span>{selectedCase.petitioner || '—'}</span></div>
                                <div className="info-item"><label>Respondent</label><span>{selectedCase.respondent || '—'}</span></div>
                                <div className="info-item"><label>Case Type</label><span style={{ textTransform: 'capitalize' }}>{selectedCase.caseType}</span></div>
                                <div className="info-item"><label>Court</label><span>{selectedCase.courtName || '—'}</span></div>
                                <div className="info-item"><label>Judge</label><span>{selectedCase.judge || '—'}</span></div>
                                <div className="info-item"><label>Filed</label><span>{new Date(selectedCase.filingDate).toLocaleDateString('en-IN')}</span></div>
                                <div className="info-item"><label>Hearings</label><span>{selectedCase.hearings}</span></div>
                                <div className="info-item"><label>Adjournments</label><span>{selectedCase.adjournments}</span></div>
                                <div className="info-item"><label>Vulnerable</label><span>{selectedCase.vulnerableFlag ? '⚠ YES' : 'No'}</span></div>
                            </div>
                            {selectedCase.description && (
                                <div style={{ padding: '12px 14px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                                    {selectedCase.description}
                                </div>
                            )}
                            <div className="divider" />
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🤖 AI Priority Analysis</div>
                            {selectedCase.prediction ? (
                                <PredictionPanel prediction={selectedCase.prediction} />
                            ) : <div style={{ color: 'var(--color-text-muted)' }}>No prediction available</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
