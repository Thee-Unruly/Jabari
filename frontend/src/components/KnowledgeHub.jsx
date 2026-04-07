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
            <aside style={{ width: '340px', borderRight: `0.5px solid ${T.border}`, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', overflowY: 'auto' }}>
                <div>
                    <h1 style={{ fontFamily: T.serif, fontSize: '26px', fontStyle: 'italic', marginBottom: '6px' }}>Market Hub</h1>
                    <p style={{ fontSize: '11px', color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Intelligence Ecosystem</p>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '16px', background: '#fff', border: `0.5px solid ${T.border}`, boxShadow: '0 4px 12px -5px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: T.faint, letterSpacing: '0.05em' }}>VERIFIED ARCHIVE</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.success }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 600, margin: 0, color: T.ink }}>{stats.total_records.toLocaleString()}</h2>
                        <span style={{ fontSize: '12px', color: T.muted }}>Records</span>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '16px', background: T.surface, border: `1px dashed ${T.border}`, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RefreshCw size={14} className={isUploading ? "animate-spin" : ""} color={T.muted} />
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: T.muted }}>Command Center</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={handleSync} disabled={isUploading} style={{ padding: '12px', background: T.ink, color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>Portal Sync</button>
                        <label style={{ padding: '12px', border: `0.5px solid ${T.border}`, background: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', color: T.ink }}>
                            Ingest Data <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                        </label>
                    </div>
                </div>

                {uploadStatus.state !== 'idle' && (
                    <div style={{ padding: '12px', borderRadius: '10px', background: uploadStatus.state === 'success' ? '#f0fdf4' : '#fef2f2', border: `0.5px solid ${T.border}`, boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)' }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0', color: T.ink }}>{uploadStatus.message}</p>
                        <p style={{ fontSize: '10px', color: T.muted, margin: 0, lineHeight: 1.4 }}>{uploadStatus.details}</p>
                    </div>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, padding: '3.5rem', paddingBottom: '140px', overflowY: 'auto', position: 'relative' }}>
                
                {/* 🔍 FIXED BOTTOM COMMAND BAR */}
                <div style={{ 
                    position: 'fixed', bottom: '2.5rem', left: '340px', right: 0, zIndex: 100,
                    display: 'flex', justifyContent: 'center', pointerEvents: 'none'
                }}>
                    <div style={{ width: '100%', maxWidth: '850px', padding: '0 2rem', pointerEvents: 'auto' }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Command Market Intelligence... (e.g., Who won the most KeRRA bids?)"
                                style={{ 
                                    width: '100%', padding: '18px 65px 18px 28px', 
                                    border: `1px solid ${T.border}`, borderRadius: '30px', 
                                    background: '#fff', fontSize: '15px', outline: 'none',
                                    boxShadow: '0 12px 50px -12px rgba(0,0,0,0.18)',
                                    fontFamily: T.sans, color: T.ink
                                }}
                            />
                            <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {isThinking && <Loader2 size={22} className="animate-spin" color={T.accent} />}
                                <button onClick={handleSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <Sparkles size={26} color={T.accent} />
                                </button>
                            </div>
                            {(results.length > 0 || aiBrief) && (
                                <button 
                                    onClick={() => {setQuery(''); setResults([]); setAiBrief(null);}} 
                                    style={{ position: 'absolute', right: '24px', top: '-30px', fontSize: '10px', fontWeight: 800, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                                >
                                    Reset Intelligence
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {/* 🧠 NEURAL BRIEF */}
                    {aiBrief && (
                        <div style={{ 
                            background: '#fff', border: `1.5px solid ${T.accent}`, borderRadius: '20px', 
                            padding: '2.5rem', marginBottom: '3.5rem', boxShadow: '0 15px 45px -15px rgba(184, 134, 11, 0.2)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: T.accent }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                                <div style={{ background: T.accent, color: '#fff', padding: '8px', borderRadius: '10px' }}><Brain size={20}/></div>
                                <h3 style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.accent }}>Executive Intelligence Brief</h3>
                            </div>
                            <div style={{ fontSize: '17px', color: T.ink, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: T.serif }}>
                                {aiBrief}
                            </div>
                        </div>
                    )}

                    {results.length === 0 && !isSearching && !isThinking ? (
                        <>
                            <div style={{ marginBottom: '4rem' }}>
                                <h2 style={{ fontFamily: T.serif, fontSize: '42px', fontStyle: 'italic', color: T.ink, marginBottom: '12px', fontWeight: 500 }}>Market Command Center</h2>
                                <p style={{ color: T.muted, fontSize: '16px', maxWidth: '600px', lineHeight: 1.5 }}>Aggregating strategic intelligence across the $1.6 Trillion historical procurement landscape.</p>
                            </div>

                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                                <div style={{ padding: '2rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '16px', boxShadow: '0 4px 15px -5px rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Market Exposure</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', color: T.muted, fontWeight: 500 }}>KSh</span>
                                        <h3 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{((insights?.summary?.total_value || 0) / 1e9).toFixed(1)}B</h3>
                                    </div>
                                </div>
                                <div style={{ padding: '2rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '16px', boxShadow: '0 4px 15px -5px rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Identified Benchmarks</p>
                                    <h3 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{(insights?.summary?.total_records || 0).toLocaleString()}</h3>
                                </div>
                                <div style={{ padding: '2rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '16px', boxShadow: '0 4px 15px -5px rgba(0,0,0,0.02)' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Avg Award Value</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', color: T.muted, fontWeight: 500 }}>KSh</span>
                                        <h3 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{((insights?.summary?.avg_value || 0) / 1e6).toFixed(1)}M</h3>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
                                {/* Leaderboard */}
                                <div style={{ padding: '2.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.03)' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <TrendingUp size={18} color={T.accent} /> Top Procuring Agencies
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {insights?.leaderboard.map((b, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: T.ink }}>{b.name}</span>
                                                    <p style={{ fontSize: '11px', color: T.faint, margin: '2px 0 0' }}>Major Procuring Entity</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink }}>{b.count.toLocaleString()} Tenders</span>
                                                    <p style={{ fontSize: '11px', color: T.accent, margin: 0, fontWeight: 600 }}>KSh {(b.value / 1e6).toFixed(1)}M</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sectors */}
                                <div style={{ padding: '2.5rem', background: T.ink, borderRadius: '20px', color: '#fff', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)' }}>
                                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Share by Sector</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        {insights?.sectors.map((s, i) => (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: 600 }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{s.category || 'General'}</span>
                                                    <span style={{ color: T.accent }}>{(s.value / (insights.summary.total_value || 1) * 100).toFixed(0)}%</span>
                                                </div>
                                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                    <div style={{ width: `${(s.value / (insights.summary.total_value || 1) * 100)}%`, height: '100%', background: T.accent, borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '3rem' }}>
                                <h2 style={{ fontFamily: T.serif, fontSize: '36px', fontStyle: 'italic', fontWeight: 500 }}>Market Findings</h2>
                                <span style={{ fontSize: '14px', color: T.faint }}>Located {results.length} relevant historical archives</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {results.map((r, i) => (
                                    <div key={i} style={{ padding: '2.5rem', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', boxShadow: '0 4px 15px -10px rgba(0,0,0,0.05)', transition: 'all 0.2s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', background: T.surface2, color: T.muted, borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.status || 'Awarded'}</span>
                                                <h3 style={{ fontSize: '22px', fontFamily: T.serif, margin: '14px 0 6px', fontWeight: 500, color: T.ink }}>{r.title}</h3>
                                                <p style={{ fontSize: '14px', color: T.muted, fontWeight: 500 }}>{r.buyer}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '26px', fontWeight: 700, color: T.ink, margin: 0 }}>{r.currency} {r.amount.toLocaleString()}</p>
                                                <p style={{ fontSize: '11px', color: T.faint, marginTop: '4px' }}>OCID: {r.ocid}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2.5rem', borderTop: `0.5px solid ${T.border}`, paddingTop: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.muted }}><MapPin size={16} /> {r.location || 'Nationwide'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.muted }}><Database size={16} /> {r.category || 'General'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: T.muted, marginLeft: 'auto' }}><Calendar size={16} /> {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Archive Record'}</div>
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
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); borderRadius: 10px; }
                input:focus { border-color: ${T.accent} !important; }
            `}</style>
        </div>
    );
};

export default KnowledgeHub;
