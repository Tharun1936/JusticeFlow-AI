
import type { Prediction, ExplanationFactor } from '../api/client';

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, band }: { score: number; band: string }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;

    const colorMap: Record<string, string> = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#22c55e',
    };
    const color = colorMap[band] ?? '#4f8ef7';

    return (
        <div className="score-ring-container">
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle
                    cx="55" cy="55" r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                />
                <circle
                    cx="55" cy="55" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeDasharray={`${progress} ${circumference - progress}`}
                    strokeDashoffset={circumference * 0.25}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color}60)` }}
                />
            </svg>
            <div className="score-ring-label">
                <span className="score-ring-value" style={{ color }}>{score}</span>
                <span className="score-ring-sub">/ 100</span>
            </div>
        </div>
    );
}

// ── Band Badge ────────────────────────────────────────────────────────────────
export function BandBadge({ band }: { band: string }) {
    const dotMap: Record<string, string> = {
        critical: '●', high: '◆', medium: '▲', low: '◉',
    };
    return (
        <span className={`band-badge ${band}`}>
            {dotMap[band]} {band.toUpperCase()}
        </span>
    );
}

// ── Delay Risk ────────────────────────────────────────────────────────────────
export function DelayRiskIndicator({ risk }: { risk: boolean }) {
    return (
        <div className="delay-risk-indicator">
            <div className={`delay-risk-dot ${risk ? 'risk' : 'safe'}`} />
            <span style={{ color: risk ? 'var(--color-critical)' : 'var(--color-low)' }}>
                {risk ? 'High Risk' : 'On Track'}
            </span>
        </div>
    );
}

// ── Explanation Factor ────────────────────────────────────────────────────────
function ExplanationFactorItem({ factor }: { factor: ExplanationFactor }) {
    const barColor = factor.direction === 'positive'
        ? 'var(--color-critical)' : 'var(--color-text-muted)';
    const pct = Math.round((factor.contribution / factor.weight) * 100);

    return (
        <div className="explanation-item">
            <div className="explanation-item-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="explanation-factor-name">{factor.factor}</span>
                    <span className={`impact-tag ${factor.impact}`}>{factor.impact}</span>
                </div>
                <div className="explanation-contribution">
                    <div className="contribution-bar-bg">
                        <div
                            className="contribution-bar-fill"
                            style={{ width: `${pct}%`, background: barColor }}
                        />
                    </div>
                    <span className="contribution-value" style={{ color: barColor }}>
                        +{factor.contribution}
                    </span>
                </div>
            </div>
            <p className="explanation-detail">{factor.detail}</p>
        </div>
    );
}

// ── Main Prediction Panel ─────────────────────────────────────────────────────
interface PredictionPanelProps {
    prediction: Prediction;
    compact?: boolean;
}

export default function PredictionPanel({ prediction, compact = false }: PredictionPanelProps) {
    return (
        <div>
            {/* Header Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
                <ScoreRing score={prediction.priorityScore} band={prediction.urgencyBand} />
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                            Urgency Band
                        </div>
                        <BandBadge band={prediction.urgencyBand} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Delay Risk</div>
                            <DelayRiskIndicator risk={prediction.delayRisk} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Est. Wait</div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                ~{prediction.predictedDays} days
                            </span>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
                        Generated: {new Date(prediction.generatedAt).toLocaleString()}
                    </div>
                </div>
            </div>

            {!compact && (
                <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        AI Decision Factors
                    </div>
                    <div className="explanation-list">
                        {prediction.explanation.map((factor, i) => (
                            <ExplanationFactorItem key={i} factor={factor} />
                        ))}
                    </div>
                    <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--color-accent-dim)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        ℹ️ <strong style={{ color: 'var(--color-accent)' }}>Decision Support Only.</strong> This AI-generated score is a recommendation tool and does not automatically schedule or assign cases. Final scheduling decisions rest with the presiding judicial officer.
                    </div>
                </>
            )}
        </div>
    );
}
