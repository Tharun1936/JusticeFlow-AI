import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import { adminApi, type FairnessMetrics } from '../api/client';
import { useToast } from '../components/Toast';

const BAND_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    unscored: '#4e5d7a',
};

const SCORE_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
                {payload.map((p: any, i: number) => (
                    <p key={i} style={{ color: p.color, fontSize: 13 }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
                ))}
            </div>
        );
    }
    return null;
};

export default function FairnessDashboard() {
    const [metrics, setMetrics] = useState<FairnessMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await adminApi.fairness();
            setMetrics(data);
        } catch {
            showToast('error', 'Failed to load fairness metrics');
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div>
            <div className="page-header">
                <div className="page-header-left"><h1>Fairness Dashboard</h1></div>
            </div>
            <div className="page-body">
                <div className="loading-page"><div className="loading-spinner" /> Loading fairness metrics...</div>
            </div>
        </div>
    );

    if (!metrics) return null;

    const bandData = Object.entries(metrics.byUrgencyBand)
        .filter(([, count]) => count > 0)
        .map(([band, count]) => ({ name: band.toUpperCase(), value: count, color: BAND_COLORS[band] ?? '#888' }));

    const partyTypeData = Object.entries(metrics.byPartyType).map(([pt, stats]) => ({
        name: pt.charAt(0).toUpperCase() + pt.slice(1),
        avgScore: stats.avgScore,
        count: stats.count,
        delayRisk: stats.avgDelayRisk,
    }));

    const caseTypeData = Object.entries(metrics.byCaseType)
        .map(([ct, stats]) => ({
            name: ct.charAt(0).toUpperCase() + ct.slice(1),
            avgScore: stats.avgScore,
            count: stats.count,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);

    const scoreDistData = metrics.scoreDistribution;

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Fairness Dashboard</h1>
                    <p>Bias monitoring across demographics, case types, and urgency distribution</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={load}>↻ Refresh</button>
            </div>

            <div className="page-body">

                {/* Top Stats */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card accent">
                        <div className="stat-label">Total Cases</div>
                        <div className="stat-value">{metrics.totalCases}</div>
                    </div>
                    <div className="stat-card accent">
                        <div className="stat-label">Predictions Generated</div>
                        <div className="stat-value">{metrics.predictionsGenerated}</div>
                        <div className="stat-sub">{metrics.totalCases > 0 ? Math.round((metrics.predictionsGenerated / metrics.totalCases) * 100) : 0}% coverage</div>
                    </div>
                    <div className="stat-card medium">
                        <div className="stat-label">Avg. Pendency</div>
                        <div className="stat-value">{metrics.averagePendencyDays}<span style={{ fontSize: 14 }}>d</span></div>
                        <div className="stat-sub">{Math.round(metrics.averagePendencyDays / 30)} months average</div>
                    </div>
                    <div className="stat-card critical">
                        <div className="stat-label">Delay Risk Rate</div>
                        <div className="stat-value">{metrics.delayRiskRate}<span style={{ fontSize: 14 }}>%</span></div>
                        <div className="stat-sub">of scored cases</div>
                    </div>
                </div>

                {/* Vulnerable vs Non-Vulnerable Comparison */}
                <div style={{ marginBottom: 24 }}>
                    <div className="section-header">
                        <div>
                            <div className="section-title">⚖️ Vulnerable Party Equity Analysis</div>
                            <div className="section-subtitle">Comparing priority allocation between vulnerable and non-vulnerable parties</div>
                        </div>
                    </div>
                    <div className="fairness-compare">
                        <div className="fairness-group" style={{ borderColor: 'var(--color-high-border)' }}>
                            <div className="fairness-group-title" style={{ color: 'var(--color-high)' }}>⚠ Vulnerable Party Cases</div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Case Count</span>
                                <span className="fairness-stat-value">{metrics.vulnerableCaseStats.count}</span>
                            </div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Average Priority Score</span>
                                <span className="fairness-stat-value" style={{ color: 'var(--color-high)' }}>
                                    {metrics.vulnerableCaseStats.avgScore} / 100
                                </span>
                            </div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Average Pendency</span>
                                <span className="fairness-stat-value">{metrics.vulnerableCaseStats.avgPendency} days</span>
                            </div>
                        </div>
                        <div className="fairness-group" style={{ borderColor: 'var(--color-low-border)' }}>
                            <div className="fairness-group-title" style={{ color: 'var(--color-low)' }}>✓ Non-Vulnerable Cases</div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Case Count</span>
                                <span className="fairness-stat-value">{metrics.nonVulnerableCaseStats.count}</span>
                            </div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Average Priority Score</span>
                                <span className="fairness-stat-value" style={{ color: 'var(--color-low)' }}>
                                    {metrics.nonVulnerableCaseStats.avgScore} / 100
                                </span>
                            </div>
                            <div className="fairness-stat">
                                <span className="fairness-stat-label">Average Pendency</span>
                                <span className="fairness-stat-value">{metrics.nonVulnerableCaseStats.avgPendency} days</span>
                            </div>
                        </div>
                    </div>
                    {metrics.vulnerableCaseStats.count > 0 && metrics.nonVulnerableCaseStats.count > 0 && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                            {metrics.vulnerableCaseStats.avgScore >= metrics.nonVulnerableCaseStats.avgScore
                                ? `✅ Equity check passed: Vulnerable party cases receive a ${(metrics.vulnerableCaseStats.avgScore - metrics.nonVulnerableCaseStats.avgScore).toFixed(1)}-point higher average priority score. The system appropriately elevates vulnerable cases.`
                                : `⚠️ Potential equity concern: Vulnerable party cases are scoring ${(metrics.nonVulnerableCaseStats.avgScore - metrics.vulnerableCaseStats.avgScore).toFixed(1)} points lower than non-vulnerable cases on average. Review case data quality.`
                            }
                        </div>
                    )}
                </div>

                {/* Charts Row: Band Distribution + Score Distribution */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Pie Chart: Urgency Band */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Urgency Band Distribution</div>
                        </div>
                        <div className="card-body">
                            {bandData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={bandData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey="value"
                                            label={({ name, value }) => `${name} (${value})`}
                                            labelLine={false}
                                        >
                                            {bandData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data yet</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bar Chart: Score Distribution */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Priority Score Distribution</div>
                        </div>
                        <div className="card-body">
                            {scoreDistData.some(d => d.count > 0) ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={scoreDistData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="range" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                                        <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="count" name="Cases" radius={[4, 4, 0, 0]}>
                                            {scoreDistData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={SCORE_COLORS[index] ?? '#4f8ef7'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-state" style={{ padding: '40px 0' }}>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No scored cases yet</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bar: Average Score by Party Type */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <div className="card-title">Average Priority Score by Party Type</div>
                    </div>
                    <div className="card-body">
                        {partyTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={partyTypeData} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="avgScore" name="Avg Score" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state" style={{ padding: '30px 0' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data yet</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bar: Average Score by Case Type */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header">
                        <div className="card-title">Average Priority Score by Case Type</div>
                    </div>
                    <div className="card-body">
                        {caseTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={caseTypeData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={60} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="avgScore" name="Avg Score" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-state" style={{ padding: '30px 0' }}>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data yet</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Party Type Detailed Table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">Party Type Breakdown</div>
                    </div>
                    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Party Type</th>
                                    <th style={{ textAlign: 'right' }}>Cases</th>
                                    <th style={{ textAlign: 'right' }}>Avg. Score</th>
                                    <th style={{ textAlign: 'right' }}>Delay Risk %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partyTypeData.sort((a, b) => b.avgScore - a.avgScore).map(pt => (
                                    <tr key={pt.name}>
                                        <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{pt.name}</td>
                                        <td style={{ textAlign: 'right' }}>{pt.count}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: pt.avgScore >= 55 ? 'var(--color-critical)' : pt.avgScore >= 35 ? 'var(--color-medium)' : 'var(--color-low)' }}>
                                            {pt.avgScore}
                                        </td>
                                        <td style={{ textAlign: 'right', color: pt.delayRisk > 40 ? 'var(--color-critical)' : 'var(--color-text-secondary)' }}>
                                            {pt.delayRisk}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
