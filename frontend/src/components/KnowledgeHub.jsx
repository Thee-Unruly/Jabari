import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Globe, TrendingUp, DollarSign, 
  MapPin, Calendar, ExternalLink, Loader2,
  FileText, ShieldCheck, Upload, Database, 
  CheckCircle2, AlertCircle, RefreshCw, Trash2,
  Sparkles, Brain
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
    
    // Neural Mode States
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
        if (!query.trim()) { 
            setResults([]); 
            setAiBrief(null);
            return; 
        }
        
        setIsSearching(true);
        setAiBrief(null);

        // If it looks like a question, trigger the AI Brain simultaneously
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

    const handleSync = async () => {
        setIsUploading(true);
        setUploadStatus({ state: 'loading', message: 'Syncing OCDS Portal...' });
        try {
            const res = await axios.post(`${baseUrl}/knowledge/sync`);
            setUploadStatus({ state: 'success', message: 'Sync Complete', details: `${res.data.indexed} records synchronized.` });
            fetchStats();
        } catch (err) {
            setUploadStatus({ state: 'error', message: 'Sync Failed', details: 'Endpoint error' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: T.cream, fontFamily: T.sans }}>
            
            {/* ── LEFT SIDEBAR ── */}
            <aside style={{ width: '340px', borderRight: `0.5px solid ${T.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                <div>
                    <h1 style={{ fontFamily: T.serif, fontSize: '24px', fontStyle: 'italic', marginBottom: '4px' }}>Market Hub</h1>
                    <p style={{ fontSize: '11px', color: T.faint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jabari Knowledge Engine</p>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#fff', border: `0.5px solid ${T.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: T.faint }}>LIVE REPOSITORY</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.success }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{stats.total_records.toLocaleString()}</h2>
                        <span style={{ fontSize: '12px', color: T.muted }}>Verified</span>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '12px', background: T.surface, border: `0.5px dashed ${T.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={14} className={isUploading ? "animate-spin" : ""} />
                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Ingestion Pipeline</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSync} disabled={isUploading} style={{ flex: 1, padding: '10px', background: T.ink, color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Portal Sync</button>
                        <label style={{ flex: 1, padding: '10px', border: `0.5px solid ${T.border}`, background: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>
                            Upload <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                {uploadStatus.state !== 'idle' && (
                    <div style={{ padding: '12px', borderRadius: '8px', background: uploadStatus.state === 'success' ? '#f0fdf4' : '#fef2f2', border: `0.5px solid ${T.border}` }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, margin: '0 0 4px 0' }}>{uploadStatus.message}</p>
                        <p style={{ fontSize: '10px', color: T.muted, margin: 0 }}>{uploadStatus.details}</p>
                    </div>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '0', overflowY: 'auto' }}>
                
                {/* 🔍 TOP FLOATING OMNIBAR */}
                <div style={{ 
                    position: 'sticky', top: 0, zIndex: 10, padding: '1.5rem 3rem', 
                    background: 'rgba(245, 242, 237, 0.8)', backdropFilter: 'blur(8px)',
                    borderBottom: `0.5px solid ${T.border}`
                }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
                        <input 
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Connect to market intelligence... Ask a question or search tenders"
                            style={{ 
                                width: '100%', padding: '16px 50px 16px 20px', 
                                border: `1px solid ${T.border}`, borderRadius: '12px', 
                                background: '#fff', fontSize: '15px', outline: 'none',
                                boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                                fontFamily: T.sans
                            }}
                        />
                        <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isThinking && <Loader2 size={20} className="animate-spin" color={T.accent} />}
                            <button onClick={handleSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.accent }}>
                                <Sparkles size={22} />
                            </button>
                        </div>
                        {(results.length > 0 || aiBrief) && (
                            <button 
                                onClick={() => {setQuery(''); setResults([]); setAiBrief(null);}} 
                                style={{ position: 'absolute', right: '15px', bottom: '-25px', fontSize: '10px', fontWeight: 600, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                CLEAR DASHBOARD
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ padding: '3rem' }}>
                    {/* 🧠 NEURAL BRIEF */}
                    {aiBrief && (
                        <div style={{ 
                            maxWidth: '1000px', margin: '0 auto 3rem',
                            background: '#fff', border: `1px solid ${T.accent}`, borderRadius: '16px', 
                            padding: '2rem', boxShadow: '0 8px 32px -10px rgba(184, 134, 11, 0.15)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: T.accent }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                                <div style={{ background: T.accent, color: '#fff', padding: '6px', borderRadius: '8px' }}><Brain size={18}/></div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.accent }}>Market Intelligence Brief</h3>
                            </div>
                            <div style={{ fontSize: '16px', color: T.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: T.serif }}>
                                {aiBrief}
                            </div>
                        </div>
                    )}

                    {results.length === 0 && !isSearching && !isThinking ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ marginBottom: '3rem' }}>
                                <h2 style={{ fontFamily: T.serif, fontSize: '36px', fontStyle: 'italic', marginBottom: '8px' }}>Market Command Center</h2>
                                <p style={{ color: T.muted, fontSize: '15px' }}>Strategic intelligence overview of the historical procurement landscape.</p>
                            </div>

                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                                <div style={{ padding: '1.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '1rem' }}>Total Market Exposure</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: T.muted }}>KSh</span>
                                        <h3 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>{((insights?.summary?.total_value || 0) / 1e9).toFixed(1)}B</h3>
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '1rem' }}>Identified Benchmarks</p>
                                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>{(insights?.summary?.total_records || 0).toLocaleString()}</h3>
                                </div>
                                <div style={{ padding: '1.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', marginBottom: '1rem' }}>Avg Award Value</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                        <span style={{ fontSize: '12px', color: T.muted }}>KSh</span>
                                        <h3 style={{ fontSize: '28px', fontWeight: 600, margin: 0 }}>{((insights?.summary?.avg_value || 0) / 1e6).toFixed(1)}M</h3>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                <div style={{ padding: '2rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <TrendingUp size={16} color={T.accent} /> Top Procuring Agencies
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {insights?.leaderboard.map((b, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 500 }}>{b.name}</span>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{b.count} Tenders</span>
                                                    <p style={{ fontSize: '10px', color: T.faint, margin: 0 }}>KSh {(b.value / 1e6).toFixed(1)}M</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ padding: '2rem', background: T.ink, borderRadius: '16px', color: '#fff' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1.5rem' }}>Market Share by Sector</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {insights?.sectors.map((s, i) => (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                                                    <span>{s.category || 'General'}</span>
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
                    ) : (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <h2 style={{ fontFamily: T.serif, fontSize: '32px', marginBottom: '2.5rem' }}>Market Findings ({results.length})</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {results.map((r, i) => (
                                    <div key={i} style={{ padding: '2.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', transition: 'all 0.2s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', background: T.surface, color: T.muted, borderRadius: '4px', textTransform: 'uppercase' }}>{r.status || 'Awarded'}</span>
                                                <h3 style={{ fontSize: '20px', fontFamily: T.serif, margin: '12px 0 6px', fontWeight: 500 }}>{r.title}</h3>
                                                <p style={{ fontSize: '14px', color: T.muted }}>{r.buyer}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '24px', fontWeight: 600, color: T.ink }}>{r.currency} {r.amount.toLocaleString()}</p>
                                                <p style={{ fontSize: '11px', color: T.faint }}>OCID: {r.ocid}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem', borderTop: `0.5px solid ${T.border}`, paddingTop: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.muted }}><MapPin size={16} /> {r.location || 'Nationwide'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.muted }}><Database size={16} /> {r.category || 'General'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: T.muted }}><Calendar size={16} /> {r.date ? new Date(r.date).toLocaleDateString() : 'Historical'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); borderRadius: 10px; }
            `}</style>
        </div>
    );
};

export default KnowledgeHub;
