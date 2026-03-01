import { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { useToast } from '../components/Toast';

export default function AdminConsole() {
    const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
    const [regenerating, setRegenerating] = useState(false);
    const [lastRegenResult, setLastRegenResult] = useState<{ regenerated: number; message: string } | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        adminApi.health().then(setHealth).catch(() => { });
    }, []);

    async function handleRegenerateAll() {
        if (!confirm('This will re-run the AI model on ALL cases and overwrite existing predictions. Continue?')) return;
        setRegenerating(true);
        setLastRegenResult(null);
        try {
            const result = await adminApi.regenerateAll();
            setLastRegenResult(result);
            showToast('success', result.message);
        } catch {
            showToast('error', 'Regeneration failed');
        } finally {
            setRegenerating(false);
        }
    }

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Admin Console</h1>
                    <p>System management, bulk operations, and model controls</p>
                </div>
            </div>

            <div className="page-body">
                <div style={{ maxWidth: 760 }}>
                    {/* System Health */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <div className="card-title">🟢 System Health</div>
                        </div>
                        <div className="card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>API Status</label>
                                    <span style={{ color: health?.status === 'ok' ? 'var(--color-low)' : 'var(--color-critical)', fontWeight: 700 }}>
                                        {health ? '● Online' : '○ Checking...'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Last Check</label>
                                    <span>{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}</span>
                                </div>
                                <div className="info-item">
                                    <label>AI Engine</label>
                                    <span style={{ color: 'var(--color-low)' }}>● Rule-Based Heuristic Model v1.0</span>
                                </div>
                                <div className="info-item">
                                    <label>Database</label>
                                    <span style={{ color: 'var(--color-low)' }}>● SQLite (WAL mode)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Model Info */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <div className="card-title">🤖 AI Scoring Model</div>
                        </div>
                        <div className="card-body">
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                                The system uses a <strong style={{ color: 'var(--color-text-primary)' }}>6-factor weighted scoring model</strong> to
                                generate priority scores. Each factor is independently explainable.
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                                {[
                                    { name: 'Case Pendency', weight: 25, color: 'var(--color-critical)' },
                                    { name: 'Adjournment Rate', weight: 20, color: 'var(--color-high)' },
                                    { name: 'Case Type Severity', weight: 20, color: 'var(--color-medium)' },
                                    { name: 'Vulnerable Party', weight: 15, color: 'var(--color-accent)' },
                                    { name: 'Hearing Frequency', weight: 10, color: 'var(--color-low)' },
                                    { name: 'Procedural Complexity', weight: 10, color: '#7c3aed' },
                                ].map(f => (
                                    <div key={f.name} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{f.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ flex: 1, height: 6, background: 'var(--color-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${f.weight / 25 * 100}%`, height: '100%', background: f.color, borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.weight}pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bulk Operations */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div className="card-header">
                            <div className="card-title">⚡ Bulk Operations</div>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Regenerate All */}
                                <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Regenerate All Predictions</div>
                                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                                Re-run the AI scoring model on all cases in the database. This will update all priority scores, urgency bands,
                                                delay risk flags, and explanation factors. Useful after model parameter adjustments or bulk data changes.
                                            </div>
                                            {lastRegenResult && (
                                                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--color-low-bg)', border: '1px solid var(--color-low-border)', borderRadius: 6, fontSize: 12, color: 'var(--color-low)' }}>
                                                    ✓ {lastRegenResult.message}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            id="regenerate-all-btn"
                                            className="btn btn-primary"
                                            disabled={regenerating}
                                            onClick={handleRegenerateAll}
                                            style={{ flexShrink: 0 }}
                                        >
                                            {regenerating ? (
                                                <>
                                                    <div className="loading-spinner" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                                                    </svg>
                                                    Regenerate All
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid var(--color-critical-border)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.7,
                    }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-critical)', marginBottom: 8 }}>⚠️ Important Disclaimer</div>
                        <p>This system is a <strong style={{ color: 'var(--color-text-primary)' }}>decision-support tool only</strong>.</p>
                        <p>AI-generated priority scores and urgency bands are advisory recommendations. No case is automatically scheduled or assigned based on these scores. All scheduling decisions must be reviewed and approved by a qualified judicial officer. The AI may not account for all legal nuances, emergent circumstances, or case-specific contextual factors.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
