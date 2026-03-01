import { useState } from 'react';
import { casesApi, type CaseInput } from '../api/client';
import { useToast } from './Toast';

const CASE_TYPES = [
    'Criminal', 'Civil', 'Family', 'Habeas-Corpus', 'Child-Custody',
    'Domestic-Violence', 'Bail', 'Land-Acquisition', 'Consumer', 'Commercial',
    'Tax', 'Labour', 'Revenue', 'Other',
];

const PARTY_TYPES = ['Individual', 'Minor', 'Senior', 'Government', 'Corporation', 'NGO'];

const COURTS = [
    'Supreme Court of India',
    'High Court - Delhi',
    'High Court - Mumbai',
    'High Court - Kolkata',
    'High Court - Bengaluru',
    'District Court',
    'Family Court',
    'Consumer Forum',
    'Labour Court',
    'Sessions Court',
];

interface CaseFormProps {
    onSuccess?: (caseId: string) => void;
    onCancel?: () => void;
}

export default function CaseForm({ onSuccess, onCancel }: CaseFormProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().split('T')[0]!;

    const [form, setForm] = useState<CaseInput>({
        title: '',
        caseType: 'Civil',
        filingDate: today,
        hearings: 0,
        adjournments: 0,
        partyType: 'Individual',
        vulnerableFlag: false,
        description: '',
        petitioner: '',
        respondent: '',
        courtName: 'District Court',
        judge: '',
        status: 'pending',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CaseInput, string>>>({});

    function validate(): boolean {
        const e: Partial<Record<keyof CaseInput, string>> = {};
        if (!form.title.trim()) e.title = 'Title is required';
        if (!form.petitioner.trim()) e.petitioner = 'Petitioner name is required';
        if (!form.respondent.trim()) e.respondent = 'Respondent name is required';
        if (!form.filingDate) e.filingDate = 'Filing date is required';
        if (form.adjournments > form.hearings && form.hearings > 0) {
            e.adjournments = 'Adjournments cannot exceed total hearings';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function set<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
        setErrors(prev => ({ ...prev, [key]: undefined }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const created = await casesApi.create({
                ...form,
                caseType: form.caseType.toLowerCase(),
                partyType: form.partyType.toLowerCase(),
            });
            showToast('success', `Case ${created.caseNumber} created and scored successfully!`);
            onSuccess?.(created.id);
        } catch {
            showToast('error', 'Failed to create case. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const inputClass = (key: keyof CaseInput) =>
        `form-input${errors[key] ? ' error' : ''}`;

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div className="form-grid">
                    {/* Title */}
                    <div className="form-group full-width">
                        <label className="form-label">Case Title *</label>
                        <input
                            id="case-title"
                            className={inputClass('title')}
                            placeholder="e.g., State vs. John Doe – Section 302 IPC"
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                        />
                        {errors.title && <span style={{ color: 'var(--color-critical)', fontSize: 11 }}>{errors.title}</span>}
                    </div>

                    {/* Petitioner */}
                    <div className="form-group">
                        <label className="form-label">Petitioner *</label>
                        <input
                            id="case-petitioner"
                            className={inputClass('petitioner')}
                            placeholder="Petitioner / Complainant name"
                            value={form.petitioner}
                            onChange={e => set('petitioner', e.target.value)}
                        />
                        {errors.petitioner && <span style={{ color: 'var(--color-critical)', fontSize: 11 }}>{errors.petitioner}</span>}
                    </div>

                    {/* Respondent */}
                    <div className="form-group">
                        <label className="form-label">Respondent *</label>
                        <input
                            id="case-respondent"
                            className={inputClass('respondent')}
                            placeholder="Respondent / Defendant name"
                            value={form.respondent}
                            onChange={e => set('respondent', e.target.value)}
                        />
                        {errors.respondent && <span style={{ color: 'var(--color-critical)', fontSize: 11 }}>{errors.respondent}</span>}
                    </div>

                    {/* Case Type */}
                    <div className="form-group">
                        <label className="form-label">Case Type *</label>
                        <select
                            id="case-type"
                            className="form-select"
                            value={form.caseType}
                            onChange={e => set('caseType', e.target.value)}
                        >
                            {CASE_TYPES.map(ct => (
                                <option key={ct} value={ct}>{ct}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filing Date */}
                    <div className="form-group">
                        <label className="form-label">Filing Date *</label>
                        <input
                            id="case-filing-date"
                            type="date"
                            className={inputClass('filingDate')}
                            value={form.filingDate}
                            max={today}
                            onChange={e => set('filingDate', e.target.value)}
                        />
                        {errors.filingDate && <span style={{ color: 'var(--color-critical)', fontSize: 11 }}>{errors.filingDate}</span>}
                    </div>

                    {/* Court */}
                    <div className="form-group">
                        <label className="form-label">Court</label>
                        <select
                            id="case-court"
                            className="form-select"
                            value={form.courtName}
                            onChange={e => set('courtName', e.target.value)}
                        >
                            {COURTS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Judge */}
                    <div className="form-group">
                        <label className="form-label">Presiding Judge</label>
                        <input
                            id="case-judge"
                            className="form-input"
                            placeholder="Hon. Justice ..."
                            value={form.judge}
                            onChange={e => set('judge', e.target.value)}
                        />
                    </div>

                    {/* Party Type */}
                    <div className="form-group">
                        <label className="form-label">Party Type</label>
                        <select
                            id="case-party-type"
                            className="form-select"
                            value={form.partyType}
                            onChange={e => set('partyType', e.target.value)}
                        >
                            {PARTY_TYPES.map(pt => (
                                <option key={pt} value={pt}>{pt}</option>
                            ))}
                        </select>
                    </div>

                    {/* Hearings */}
                    <div className="form-group">
                        <label className="form-label">Total Hearings</label>
                        <input
                            id="case-hearings"
                            type="number"
                            className="form-input"
                            min={0}
                            value={form.hearings}
                            onChange={e => set('hearings', Number(e.target.value))}
                        />
                    </div>

                    {/* Adjournments */}
                    <div className="form-group">
                        <label className="form-label">Adjournments</label>
                        <input
                            id="case-adjournments"
                            type="number"
                            className="form-input"
                            min={0}
                            value={form.adjournments}
                            onChange={e => set('adjournments', Number(e.target.value))}
                        />
                        {errors.adjournments && <span style={{ color: 'var(--color-critical)', fontSize: 11 }}>{errors.adjournments}</span>}
                    </div>

                    {/* Vulnerable Flag */}
                    <div className="form-group full-width">
                        <label
                            className="form-checkbox-row"
                            htmlFor="case-vulnerable"
                        >
                            <input
                                id="case-vulnerable"
                                type="checkbox"
                                checked={form.vulnerableFlag}
                                onChange={e => set('vulnerableFlag', e.target.checked)}
                            />
                            <span className="form-checkbox-label">
                                ⚠️ Vulnerable Party Flag — involves a minor, senior citizen, disabled person, or victim of violence
                            </span>
                        </label>
                    </div>

                    {/* Description */}
                    <div className="form-group full-width">
                        <label className="form-label">Case Description</label>
                        <textarea
                            id="case-description"
                            className="form-textarea"
                            placeholder="Brief summary of the case background and key issues..."
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className="modal-footer">
                {onCancel && (
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                )}
                <button type="submit" id="case-submit-btn" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                        <>
                            <div className="loading-spinner" />
                            Analyzing & Scoring...
                        </>
                    ) : (
                        <>
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            Create Case & Generate AI Score
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
