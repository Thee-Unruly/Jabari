import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search, Globe, TrendingUp, DollarSign,
    MapPin, Calendar, ExternalLink, Loader2,
    FileText, ShieldCheck, Upload, Database,
    CheckCircle2, AlertCircle, RefreshCw, Trash2,
    Sparkles, Brain, X, ChevronRight
} from 'lucide-react';

/* ─── Jabari design tokens ─── */
const T = {
    cream: '#F5F2ED',
    ink: '#1a1a1a',
    ink2: '#3d3d3a',
    muted: '#6b6b68',
    faint: '#9a9a96',
    border: 'rgba(26,26,26,0.10)',
    surface: 'rgba(26,26,26,0.03)',
    surface2: 'rgba(26,26,26,0.06)',
    accent: '#B8860B', // Dark Goldenrod
    success: '#10b981',
    serif: "'Lora', Georgia, serif",
    sans: "'DM Sans', system-ui, sans-serif",
};

const KnowledgeHub = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [stats, setStats] = useState({ total_records: 0 });
    const [insights, setInsights] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '', details: null });
    const [isUploading, setIsUploading] = useState(false);

    // Neural States
    const [aiBrief, setAiBrief] = useState(null);
    const [isThinking, setIsThinking] = useState(false);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const fetchStats = async () => {
        try {
            const [sRes, iRes] = await Promise.all([
                axios.get(`${baseUrl}/knowledge/stats`),
                axios.get(`${baseUrl}/knowledge/insights`)
            ]);
            setStats(sRes.data);
            setInsights(iRes.data);
        } catch (err) {
            console.error('Failed to fetch intelligence stats', err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsSearching(true);
        // We don't clear results/aiBrief manually so they stay in view while thinking

        const isQuestion = ["who", "what", "how", "compare", "list", "why", "where"].some(q => query.toLowerCase().includes(q));

        if (isQuestion) {
            setIsThinking(true);
            axios.post(`${baseUrl}/assistant/ask`, { question: query })
                .then(res => setAiBrief(res.data.answer))
                .catch(err => console.error("Market Brief Error", err))
                .finally(() => setIsThinking(false));
        }

        try {
            const res = await axios.get(`${baseUrl}/knowledge/search?q=${encodeURIComponent(query)}`);
            setResults(res.data);
        } catch (err) {
            console.error('Benchmark Search Failed', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        setUploadStatus({ state: 'loading', message: `Ingesting ${file.name}...` });
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${baseUrl}/knowledge/ingest`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus({ state: 'success', message: 'Ingestion Complete', details: `${res.data.indexed} records indexed.` });
            fetchStats();
        } catch (err) {
            setUploadStatus({ state: 'error', message: 'Ingestion Failed', details: err.response?.data?.detail || 'Error' });
        } finally {
            setIsUploading(false);
        }
    };

    const [vectorizeStatus, setVectorizeStatus] = useState({ pending: null, running: false });

    const fetchVectorizeStatus = async () => {
        try {
            const res = await axios.get(`${baseUrl}/knowledge/vectorize/status`);
            setVectorizeStatus(v => ({ ...v, pending: res.data.pending }));
        } catch { }
    };

    useEffect(() => { fetchVectorizeStatus(); }, []);

    // Poll while vectorization is running
    useEffect(() => {
        if (!vectorizeStatus.running) return;
        const interval = setInterval(async () => {
            await fetchVectorizeStatus();
            if (vectorizeStatus.pending === 0) {
                setVectorizeStatus(v => ({ ...v, running: false }));
                clearInterval(interval);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [vectorizeStatus.running]);

    const handleVectorize = async () => {
        setVectorizeStatus(v => ({ ...v, running: true }));
        try {
            await axios.post(`${baseUrl}/knowledge/vectorize`);
        } catch (err) {
            setVectorizeStatus(v => ({ ...v, running: false }));
        }
    };

    const handleSync = async () => {
        setIsUploading(true);
        setUploadStatus({ state: 'loading', message: 'Syncing OCDS Portal...' });
        try {
            const res = await axios.post(`${baseUrl}/knowledge/sync`);
            setUploadStatus({ state: 'success', message: 'Sync Complete', details: `${res.data.indexed} records synchronized.` });
            fetchStats();
            fetchVectorizeStatus();
        } catch (err) {
            setUploadStatus({ state: 'error', message: 'Sync Failed', details: 'Endpoint error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: T.cream, fontFamily: T.sans, overflow: 'hidden' }}>

            {/* ── COLUMN 1: SYSTEM (LEFT) ── */}
            <aside style={{ width: '280px', borderRight: `0.5px solid ${T.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexShrink: 0 }}>
                <div>
                    <h1 style={{ fontFamily: T.serif, fontSize: '20px', fontStyle: 'italic', marginBottom: '4px' }}>Strategic Hub</h1>
                    <p style={{ fontSize: '10px', color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kernel Interface</p>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '12px', background: '#fff', border: `0.5px solid ${T.border}` }}>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', marginBottom: '10px' }}>Total Indexed</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>{stats.total_records.toLocaleString()}</h2>
                    </div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '12px', background: T.surface, border: `1px dashed ${T.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button onClick={handleSync} disabled={isUploading} style={{ width: '100%', padding: '10px', background: T.ink, color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Sync Portal</button>
                    <label style={{ width: '100%', padding: '10px', border: `0.5px solid ${T.border}`, background: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>
                        Ingest CSV <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                    </label>
                    <button
                        onClick={handleVectorize}
                        disabled={vectorizeStatus.running || vectorizeStatus.pending === 0}
                        style={{ width: '100%', padding: '10px', background: vectorizeStatus.pending === 0 ? T.surface2 : T.accent, color: vectorizeStatus.pending === 0 ? T.faint : '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: vectorizeStatus.pending === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        {vectorizeStatus.running ? <><Loader2 size={13} className="animate-spin" /> Vectorizing...</> : vectorizeStatus.pending === 0 ? '✓ Vectors Ready' : `Vectorize (${vectorizeStatus.pending ?? '…'} pending)`}
                    </button>
                </div>
            </aside>

            {/* ── COLUMN 2: MARKET COMMAND CENTER (CENTER) ── */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto', background: '#fff' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '3.5rem' }}>
                        <h2 style={{ fontFamily: T.serif, fontSize: '36px', fontStyle: 'italic', color: T.ink, marginBottom: '8px' }}>Market Command Center</h2>
                        <p style={{ color: T.muted, fontSize: '15px' }}>Strategic intelligence overview of the Kenyan procurement landscape.</p>
                    </div>

                    {/* Macro Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                        <div style={{ padding: '1.5rem', background: T.cream, border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Market Exposure</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>KSh {((insights?.summary?.total_value || 0) / 1e9).toFixed(1)}B</h3>
                        </div>
                        <div style={{ padding: '1.5rem', background: T.cream, border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Benchmarks</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>{(insights?.summary?.total_records || 0).toLocaleString()}</h3>
                        </div>
                        <div style={{ padding: '1.5rem', background: T.cream, border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Avg Award</p>
                            <h3 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>KSh {((insights?.summary?.avg_value || 0) / 1e6).toFixed(1)}M</h3>
                        </div>
                    </div>

                    {/* Leaderboard & Sectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                        <div style={{ padding: '2rem', border: `0.5px solid ${T.border}`, borderRadius: '16px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Procuring Entities</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {insights?.leaderboard.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{b.name}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{b.count} Tenders</span>
                                            <p style={{ fontSize: '10px', color: T.accent, margin: 0 }}>KSh {(b.value / 1e6).toFixed(1)}M</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '2rem', background: T.ink, borderRadius: '16px', color: '#fff' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Sectoring</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {insights?.sectors.map((s, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.category || 'General'}</span>
                                            <span style={{ color: T.accent }}>{(s.value / (insights.summary.total_value || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                            <div style={{ width: `${(s.value / (insights.summary.total_value || 1) * 100)}%`, height: '100%', background: T.accent }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── COLUMN 3: NEURAL SIDEBAR (RIGHT) ── */}
            <aside style={{ width: '450px', borderLeft: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: T.cream, flexShrink: 0 }}>

                {/* Search Input Box */}
                <div style={{ padding: '2rem', borderBottom: `0.5px solid ${T.border}`, background: '#fff' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Ask or search tenders..."
                            style={{
                                width: '100%', padding: '12px 45px 12px 18px',
                                border: `1px solid ${T.border}`, borderRadius: '12px',
                                background: T.cream, fontSize: '14px', outline: 'none'
                            }}
                        />
                        <button onClick={handleSearch} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.accent }}>
                            {isSearching || isThinking ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        </button>
                    </div>
                </div>

                {/* Intelligence Feed */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {!aiBrief && results.length === 0 && !isSearching && !isThinking ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
                            <Brain size={48} style={{ margin: '0 auto 1rem' }} />
                            <p style={{ fontSize: '13px' }}>Neural Assistant ready.<br />Ask a question to start market analysis.</p>
                        </div>
                    ) : null}

                    {/* AI Brief Section */}
                    {aiBrief && (
                        <div style={{ background: '#fff', border: `1px solid ${T.accent}`, borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(184, 134, 11, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: T.accent }}>
                                <Brain size={16} />
                                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intelligence Brief</span>
                            </div>
                            <div style={{ fontSize: '14px', lineHeight: 1.6, color: T.ink, fontFamily: T.serif, whiteSpace: 'pre-wrap' }}>{aiBrief}</div>
                        </div>
                    )}

                    {/* Results Section */}
                    {results.map((r, i) => (
                        <div key={i} style={{ padding: '1.25rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 4px 0', lineHeight: 1.4 }}>{r.title}</h5>
                                    <p style={{ fontSize: '11px', color: T.muted }}>{r.buyer}</p>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>{r.currency} {(r.amount / 1e6).toFixed(1)}M</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `0.5px solid ${T.border}`, paddingTop: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '10px', color: T.faint }}>{r.ocid}</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: T.muted }}>{r.status || 'AWARDED'}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {(results.length > 0 || aiBrief) && (
                    <div style={{ padding: '1.5rem', background: '#fff', borderTop: `0.5px solid ${T.border}` }}>
                        <button onClick={() => { setQuery(''); setResults([]); setAiBrief(null); }} style={{ width: '100%', padding: '10px', border: `0.5px solid ${T.border}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: T.muted, cursor: 'pointer' }}>CLEAR RESULTS</button>
                    </div>
                )}
            </aside>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 5px; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); borderRadius: 10px; }
            `}</style>
        </div>
    );
};

export default KnowledgeHub;
