import { useNavigate } from 'react-router-dom';
import CaseForm from '../components/CaseForm';

export default function NewCase() {
    const navigate = useNavigate();

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>New Case Entry</h1>
                    <p>Register a case — the AI will automatically score it upon submission</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div className="page-body">
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    {/* Notice box */}
                    <div style={{
                        background: 'var(--color-accent-dim)',
                        border: '1px solid rgba(79,142,247,0.2)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px 20px',
                        marginBottom: 24,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                    }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-accent)', marginBottom: 4 }}>
                                AI-Powered Priority Scoring
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                Upon submission, the system will automatically analyze this case across <strong style={{ color: 'var(--color-text-primary)' }}>6 weighted dimensions</strong> —
                                case pendency, adjournment rate, case type severity, vulnerable party protection, hearing frequency, and procedural complexity —
                                and generate an explainable priority score from 0-100. This is a <strong style={{ color: 'var(--color-text-primary)' }}>decision-support tool only</strong>.
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">⚖️ Case Registration Form</div>
                        </div>
                        <CaseForm
                            onSuccess={() => {
                                navigate('/cause-list');
                            }}
                            onCancel={() => navigate(-1)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
