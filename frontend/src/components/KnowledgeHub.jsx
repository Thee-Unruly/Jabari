import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Globe, TrendingUp, DollarSign, 
  MapPin, Calendar, ExternalLink, Loader2,
  FileText, ShieldCheck, Upload, Database, 
  CheckCircle2, AlertCircle, RefreshCw
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
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const KnowledgeHub = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [stats, setStats] = useState({ total_records: 0 });
    const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '', details: null });
    const [isUploading, setIsUploading] = useState(false);

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${baseUrl}/knowledge/stats`);
            setStats(res.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsSearching(true);
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
            setUploadStatus({ 
                state: 'success', 
                message: 'Ingestion Complete', 
                details: `${res.data.indexed} records added to the knowledge vault.` 
            });
            fetchStats();
        } catch (err) {
            setUploadStatus({ 
                state: 'error', 
                message: 'Ingestion Failed', 
                details: err.response?.data?.detail || 'An unexpected error occurred during processing.' 
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSync = async () => {
        setIsUploading(true);
        setUploadStatus({ state: 'loading', message: 'Syncing with OCDS Portal...' });
        try {
            const res = await axios.post(`${baseUrl}/knowledge/sync`);
            setUploadStatus({ 
                state: 'success', 
                message: 'Live Sync Complete', 
                details: `${res.data.indexed} new records indexed from the portal.` 
            });
            fetchStats();
        } catch (err) {
            setUploadStatus({ 
                state: 'error', 
                message: 'Sync Failed', 
                details: err.response?.data?.detail || 'Could not connect to the OCDS data source.' 
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: T.cream, fontFamily: T.sans }}>
            
            {/* ── LEFT: SEARCH & FILTERS ── */}
            <aside style={{ width: '380px', borderRight: `0.5px solid ${T.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontFamily: T.serif, fontSize: '24px', fontStyle: 'italic', marginBottom: '4px' }}>Market Intelligence</h1>
                        <p style={{ fontSize: '11px', color: T.faint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jabari Knowledge Engine</p>
                    </div>
                    <button 
                        onClick={handleSync}
                        disabled={isUploading}
                        title="Sync Live Data"
                        style={{ 
                            background: T.surface, 
                            border: `0.5px solid ${T.border}`, 
                            borderRadius: '8px', 
                            padding: '8px', 
                            cursor: 'pointer',
                            color: T.muted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RefreshCw size={14} className={isUploading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <input 
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search tender benchmarks..."
                            style={{ 
                                width: '100%', 
                                padding: '12px 40px 12px 14px', 
                                border: `0.5px solid ${T.border}`, 
                                borderRadius: '8px', 
                                background: '#fff', 
                                fontSize: '13px', 
                                color: T.ink,
                                outline: 'none'
                            }}
                        />
                        <button 
                            onClick={handleSearch}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}
                        >
                            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#fff', border: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase' }}>Database Status</span>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '32px', fontWeight: 600, margin: 0 }}>{stats.total_records.toLocaleString()}</h2>
                        <span style={{ fontSize: '12px', color: T.muted }}>Verified Records</span>
                    </div>
                    <div style={{ height: '4px', background: T.surface, borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: '70%', height: '100%', background: T.accent }}></div>
                    </div>
                </div>

                {/* UPLOAD PANEL */}
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: T.surface, border: `0.5px dashed ${T.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Upload size={14} style={{ color: T.muted }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: T.ink, textTransform: 'uppercase' }}>Ingest OCDS Data</span>
                    </div>
                    
                    <label style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '1.5rem', 
                        border: `1px dashed ${T.border}`, 
                        borderRadius: '8px', 
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                        opacity: isUploading ? 0.6 : 1,
                        background: '#fff'
                    }}>
                        <Database size={24} style={{ color: T.faint }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '12px', fontWeight: 500, margin: 0 }}>Click to upload</p>
                            <p style={{ fontSize: '10px', color: T.faint, margin: '2px 0 0' }}>JSONL.GZ, CSV, or XLSX</p>
                        </div>
                        <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
                    </label>

                    {uploadStatus.state !== 'idle' && (
                        <div style={{ marginTop: '1rem', padding: '10px', borderRadius: '6px', background: uploadStatus.state === 'error' ? '#fef2f2' : '#f0fdf4', border: `0.5px solid ${uploadStatus.state === 'error' ? '#fee2e2' : '#dcfce7'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                {uploadStatus.state === 'loading' ? <RefreshCw size={14} className="animate-spin" /> : 
                                 uploadStatus.state === 'success' ? <CheckCircle2 size={14} color="#10b981" /> : <AlertCircle size={14} color="#ef4444" />}
                                <span style={{ fontSize: '11px', fontWeight: 600, color: T.ink }}>{uploadStatus.message}</span>
                            </div>
                            {uploadStatus.details && <p style={{ fontSize: '10px', color: T.muted, margin: 0 }}>{uploadStatus.details}</p>}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: T.faint }}>
                    <ShieldCheck size={14} />
                    <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Secured Intelligence Layer</span>
                </div>
            </aside>

            {/* ── RIGHT: RESULTS FEED ── */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {!results.length && !isSearching ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                        <Globe size={84} style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontFamily: T.serif, fontSize: '32px', fontStyle: 'italic', fontWeight: 400 }}>Awaiting Query</h2>
                        <p style={{ fontSize: '14px', maxWidth: '300px', textAlign: 'center', lineHeight: 1.6 }}>Scan the historical procurement landscape of Kenya to discover pricing benchmarks.</p>
                    </div>
                ) : (
                    <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontFamily: T.serif, fontSize: '32px', fontStyle: 'italic', fontWeight: 400, color: T.ink, marginBottom: '4px' }}>
                                    Market Findings
                                </h2>
                                <p style={{ fontSize: '12px', color: T.faint }}>Located {results.length} relevant historical archives</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ padding: '8px 16px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                                    Sort: Recency
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {results.map((r, i) => (
                                <div key={i} style={{ 
                                    padding: '2rem', 
                                    background: '#fff', 
                                    border: `0.5px solid ${T.border}`, 
                                    borderRadius: '16px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '1.5rem',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }} onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.05)';
                                    e.currentTarget.style.borderColor = T.accent;
                                }} onMouseOut={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = T.border;
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', background: T.surface, color: T.muted, borderRadius: '4px', textTransform: 'uppercase' }}>
                                                    {r.status || 'Awarded'}
                                                </span>
                                                <span style={{ fontSize: '10px', color: T.faint }}>{r.ocid}</span>
                                            </div>
                                            <h3 style={{ fontSize: '20px', fontFamily: T.serif, fontWeight: 500, color: T.ink, margin: 0, lineHeight: 1.3 }}>
                                                {r.title}
                                            </h3>
                                            <p style={{ fontSize: '13px', color: T.muted, margin: '8px 0 0' }}>{r.buyer}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '24px', fontWeight: 600, color: T.ink, margin: 0 }}>
                                                {r.currency} {r.amount.toLocaleString()}
                                            </p>
                                            <p style={{ fontSize: '11px', color: T.faint, margin: '4px 0 0' }}>
                                                {r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '2rem', borderTop: `0.5px solid ${T.border}`, paddingTop: '1.25rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.muted }}>
                                            <MapPin size={14} strokeWidth={1.5} /> {r.location || 'Kenya Nationwide'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.muted }}>
                                            <Database size={14} strokeWidth={1.5} /> {r.category || 'General Procurement'}
                                        </div>
                                        <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                            View Details <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); borderRadius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
            `}</style>
        </div>
    );
};

export default KnowledgeHub;
