import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Search, TrendingUp, DollarSign, Database,
    Loader2, RefreshCw, Upload, Sparkles,
    Brain, X, ChevronDown, ChevronUp, ArrowUpDown,
    Filter, MapPin, Calendar,
} from 'lucide-react';

const T = {
    cream: '#F5F2ED',
    ink: '#1a1a1a',
    ink2: '#3d3d3a',
    muted: '#6b6b68',
    faint: '#9a9a96',
    border: 'rgba(26,26,26,0.10)',
    border2: 'rgba(26,26,26,0.06)',
    surface: 'rgba(26,26,26,0.03)',
    surface2: 'rgba(26,26,26,0.06)',
    accent: '#B8860B',
    serif: "'Lora', Georgia, serif",
    sans: "'DM Sans', system-ui, sans-serif",
};

const STATUS_COLORS = {
    active: { bg: '#dbeafe', text: '#1d4ed8' },
    open: { bg: '#dbeafe', text: '#1d4ed8' },
    planning: { bg: '#fef9c3', text: '#854d0e' },
    planned: { bg: '#fef9c3', text: '#854d0e' },
    tender: { bg: '#fef9c3', text: '#854d0e' },
    awarded: { bg: '#dcfce7', text: '#15803d' },
    complete: { bg: '#dcfce7', text: '#15803d' },
    implementation: { bg: '#dcfce7', text: '#15803d' },
    cancelled: { bg: '#fee2e2', text: '#b91c1c' },
    unsuccessful: { bg: '#fee2e2', text: '#b91c1c' },
    withdrawn: { bg: '#fee2e2', text: '#b91c1c' },
};

const statusColor = (s) => {
    const key = (s || '').toLowerCase().trim();
    for (const [k, v] of Object.entries(STATUS_COLORS)) {
        if (key.includes(k)) return v;
    }
    return { bg: T.surface2, text: T.muted };
};

const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1e9) return `KSh ${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `KSh ${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `KSh ${(n / 1e3).toFixed(0)}K`;
    return `KSh ${n.toFixed(0)}`;
};

const COLS = [
    { key: 'title', label: 'Tender Title', sortable: true, width: '30%' },
    { key: 'buyer', label: 'Procuring Entity', sortable: true, width: '20%' },
    { key: 'category', label: 'Category', sortable: false, width: '12%' },
    { key: 'status', label: 'Status', sortable: false, width: '10%' },
    { key: 'amount', label: 'Value', sortable: true, width: '11%' },
    { key: 'date', label: 'Date', sortable: true, width: '9%' },
    { key: 'location', label: 'Location', sortable: false, width: '8%' },
];

const KnowledgeHub = () => {
    const [stats, setStats] = useState({ total_records: 0 });
    const [insights, setInsights] = useState(null);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false); const [isInitialLoad, setIsInitialLoad] = useState(true);
    // Filters
    const [query, setQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [sortBy, setSortBy] = useState('amount');
    const [sortDir, setSortDir] = useState('desc');
    const [facets, setFacets] = useState({ statuses: [], categories: [] });

    // AI brief
    const [aiBrief, setAiBrief] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Sidebar controls
    const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '' });
    const [vectorizeStatus, setVectorizeStatus] = useState({ pending: null, running: false });

    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    // ── Load initial data ──
    const loadBrowse = async (overrides = {}) => {
        setLoading(true);
        const isInitial = overrides._initial === true;
        const p = {
            page: 1, limit: isInitial ? 15 : 200,
            status: overrides.status ?? filterStatus,
            category: overrides.category ?? filterCategory,
            sort_by: overrides.sortBy ?? sortBy,
            sort_dir: overrides.sortDir ?? sortDir,
        };
        const params = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null));
        try {
            const res = await axios.get(`${base}/knowledge/browse`, { params });
            setRows(res.data.records);
            setTotal(res.data.total);
            if (isInitial) setIsInitialLoad(true);
            else setIsInitialLoad(false);
        } catch (err) {
            console.error('browse error', err);
        } finally { setLoading(false); }
    };

    const loadFacets = async () => {
        try {
            const res = await axios.get(`${base}/knowledge/facets`);
            setFacets(res.data);
        } catch { }
    };

    const loadStats = async () => {
        try {
            const [s, i] = await Promise.all([
                axios.get(`${base}/knowledge/stats`),
                axios.get(`${base}/knowledge/insights`),
            ]);
            setStats(s.data);
            setInsights(i.data);
        } catch { }
    };

    const fetchVectorizeStatus = async () => {
        try {
            const res = await axios.get(`${base}/knowledge/vectorize/status`);
            setVectorizeStatus(v => ({ ...v, pending: res.data.pending }));
        } catch { }
    };

    useEffect(() => {
        loadStats();
        loadBrowse({ _initial: true });
        loadFacets();
        fetchVectorizeStatus();
    }, []);

    // Poll while vectorizing
    useEffect(() => {
        if (!vectorizeStatus.running) return;
        const id = setInterval(async () => {
            await fetchVectorizeStatus();
            if (vectorizeStatus.pending === 0) {
                setVectorizeStatus(v => ({ ...v, running: false }));
            }
        }, 3000);
        return () => clearInterval(id);
    }, [vectorizeStatus.running]);

    // ── Search ──
    const handleSearch = async () => {
        if (!query.trim()) { loadBrowse({ _initial: true }); setAiBrief(null); return; }
        setIsInitialLoad(false);
        setLoading(true);
        const isQuestion = /\b(who|what|how|why|where|compare|list|show|find|give|all)\b/i.test(query);
        if (isQuestion) {
            setAiLoading(true);
            axios.post(`${base}/assistant/ask`, { question: query })
                .then(r => setAiBrief(r.data.answer))
                .catch(() => { })
                .finally(() => setAiLoading(false));
        }
        try {
            const res = await axios.get(`${base}/knowledge/search?q=${encodeURIComponent(query)}`);
            setRows(res.data);
            setTotal(res.data.length);
        } catch { }
        finally { setLoading(false); }
    };

    // ── Sort click ──
    const handleSort = (key) => {
        const newDir = sortBy === key && sortDir === 'desc' ? 'asc' : 'desc';
        setSortBy(key);
        setSortDir(newDir);
        if (!query.trim()) loadBrowse({ sortBy: key, sortDir: newDir });
    };

    // ── Filter change ──
    const applyFilter = (field, val) => {
        setIsInitialLoad(false);
        if (field === 'status') { setFilterStatus(val); if (!query.trim()) loadBrowse({ status: val }); }
        if (field === 'category') { setFilterCategory(val); if (!query.trim()) loadBrowse({ category: val }); }
    };

    // ── Sidebar actions ──
    const handleSync = async () => {
        setUploadStatus({ state: 'loading', message: 'Syncing OCDS Portal…' });
        try {
            const res = await axios.post(`${base}/knowledge/sync`);
            setUploadStatus({ state: 'success', message: `Synced — ${res.data.indexed} records` });
            loadStats(); loadBrowse(); loadFacets(); fetchVectorizeStatus();
        } catch { setUploadStatus({ state: 'error', message: 'Sync failed' }); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        setUploadStatus({ state: 'loading', message: `Ingesting ${file.name}…` });
        const fd = new FormData(); fd.append('file', file);
        try {
            const res = await axios.post(`${base}/knowledge/ingest`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUploadStatus({ state: 'success', message: `${res.data.indexed} records indexed` });
            loadStats(); loadBrowse(); loadFacets();
        } catch { setUploadStatus({ state: 'error', message: 'Ingestion failed' }); }
    };

    const handleVectorize = async () => {
        setVectorizeStatus(v => ({ ...v, running: true }));
        try { await axios.post(`${base}/knowledge/vectorize`); }
        catch { setVectorizeStatus(v => ({ ...v, running: false })); }
    };

    const SortIcon = ({ col }) => {
        if (!col.sortable) return null;
        if (sortBy !== col.key) return <ArrowUpDown size={11} style={{ color: T.faint, marginLeft: 4 }} />;
        return sortDir === 'desc'
            ? <ChevronDown size={11} style={{ color: T.ink, marginLeft: 4 }} />
            : <ChevronUp size={11} style={{ color: T.ink, marginLeft: 4 }} />;
    };

    return (
        <div style={{ display: 'flex', height: '100%', background: '#fff', fontFamily: T.sans, overflow: 'hidden' }}>

            {/* ── LEFT SIDEBAR ── */}
            <aside style={{ width: '240px', borderRight: `0.5px solid ${T.border}`, padding: '1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flexShrink: 0, background: T.cream, overflowY: 'auto' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Market Intelligence</p>
                    <h1 style={{ fontFamily: T.serif, fontSize: '18px', fontStyle: 'italic', color: T.ink, margin: 0 }}>Knowledge Hub</h1>
                </div>

                {/* Record count */}
                <div style={{ padding: '1.25rem', borderRadius: '10px', background: '#fff', border: `0.5px solid ${T.border}` }}>
                    <p style={{ fontSize: '9px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Total Records</p>
                    <p style={{ fontSize: '26px', fontWeight: 600, margin: 0 }}>{(stats.total_records || 0).toLocaleString()}</p>
                    {insights && (
                        <p style={{ fontSize: '11px', color: T.muted, marginTop: '4px' }}>
                            KSh {((insights.summary?.total_value || 0) / 1e9).toFixed(1)}B total value
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={handleSync} style={{ width: '100%', padding: '9px', background: T.ink, color: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <RefreshCw size={12} /> Sync Portal
                    </button>
                    <label style={{ width: '100%', padding: '9px', border: `0.5px solid ${T.border}`, background: '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Upload size={12} /> Ingest CSV<input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                    </label>
                    <button onClick={handleVectorize} disabled={vectorizeStatus.running || vectorizeStatus.pending === 0}
                        style={{ width: '100%', padding: '9px', background: vectorizeStatus.pending === 0 ? T.surface2 : T.accent, color: vectorizeStatus.pending === 0 ? T.faint : '#fff', borderRadius: '8px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: vectorizeStatus.pending === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {vectorizeStatus.running ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Vectorizing…</> : vectorizeStatus.pending === 0 ? '✓ Vectors Ready' : `Vectorize (${vectorizeStatus.pending ?? '…'})`}
                    </button>
                </div>

                {/* Status message */}
                {uploadStatus.state !== 'idle' && (
                    <div style={{ padding: '10px 12px', borderRadius: '8px', background: uploadStatus.state === 'error' ? '#fee2e2' : uploadStatus.state === 'loading' ? T.surface2 : '#dcfce7', fontSize: '11px', color: uploadStatus.state === 'error' ? '#b91c1c' : uploadStatus.state === 'loading' ? T.muted : '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {uploadStatus.state === 'loading' && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                        {uploadStatus.message}
                    </div>
                )}

                {/* Sectors list */}
                {insights?.sectors?.length > 0 && (
                    <div>
                        <p style={{ fontSize: '9px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Top Sectors</p>
                        {insights.sectors.slice(0, 6).map((s, i) => (
                            <div key={i} style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                    <span style={{ color: T.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{s.category || 'General'}</span>
                                    <span style={{ color: T.accent, flexShrink: 0, marginLeft: '4px' }}>{((s.value / (insights.summary?.total_value || 1)) * 100).toFixed(0)}%</span>
                                </div>
                                <div style={{ height: '3px', background: T.border, borderRadius: '2px' }}>
                                    <div style={{ width: `${(s.value / (insights.summary?.total_value || 1)) * 100}%`, height: '100%', background: T.accent, borderRadius: '2px' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Stats strip */}
                <div style={{ display: 'flex', gap: '1px', borderBottom: `0.5px solid ${T.border}`, flexShrink: 0, background: T.border }}>
                    {[
                        { label: 'Total Records', value: (insights?.summary?.total_records || stats.total_records || 0).toLocaleString(), icon: <Database size={13} /> },
                        { label: 'Market Exposure', value: `KSh ${((insights?.summary?.total_value || 0) / 1e9).toFixed(1)}B`, icon: <TrendingUp size={13} /> },
                        { label: 'Avg Award Value', value: `KSh ${((insights?.summary?.avg_value || 0) / 1e6).toFixed(1)}M`, icon: <DollarSign size={13} /> },
                    ].map((s, i) => (
                        <div key={i} style={{ flex: 1, padding: '1.1rem 1.5rem', background: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: T.faint }}>{s.icon}</span>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 2px' }}>{s.label}</p>
                                <p style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: T.ink }}>{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar: Search + Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 1.5rem', borderBottom: `0.5px solid ${T.border}`, background: '#fff', flexShrink: 0, flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '200px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.faint }} />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search tenders, buyers, categories…"
                            style={{ width: '100%', padding: '9px 38px 9px 34px', border: `0.5px solid ${T.border}`, borderRadius: '8px', background: T.cream, fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: T.sans, color: T.ink }}
                        />
                        {query && (
                            <button onClick={() => { setQuery(''); setAiBrief(null); loadBrowse({ _initial: true }); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, display: 'flex' }}>
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Status filter */}
                    <div style={{ position: 'relative' }}>
                        <Filter size={11} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: T.faint, pointerEvents: 'none' }} />
                        <select value={filterStatus} onChange={e => applyFilter('status', e.target.value)}
                            style={{ padding: '8px 28px 8px 26px', border: `0.5px solid ${T.border}`, borderRadius: '8px', background: filterStatus ? T.ink : '#fff', color: filterStatus ? '#fff' : T.ink2, fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: T.sans, appearance: 'none' }}>
                            <option value="">All Statuses</option>
                            {facets.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: filterStatus ? '#fff' : T.faint }} />
                    </div>

                    {/* Category filter */}
                    <div style={{ position: 'relative' }}>
                        <select value={filterCategory} onChange={e => applyFilter('category', e.target.value)}
                            style={{ padding: '8px 28px 8px 12px', border: `0.5px solid ${T.border}`, borderRadius: '8px', background: filterCategory ? T.ink : '#fff', color: filterCategory ? '#fff' : T.ink2, fontSize: '12px', outline: 'none', cursor: 'pointer', fontFamily: T.sans, appearance: 'none' }}>
                            <option value="">All Categories</option>
                            {facets.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown size={11} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: filterCategory ? '#fff' : T.faint }} />
                    </div>

                    {/* Search button */}
                    <button onClick={handleSearch}
                        style={{ padding: '8px 16px', background: T.ink, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: T.sans, flexShrink: 0 }}>
                        {(loading || aiLoading) ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                        Search
                    </button>

                    <span style={{ fontSize: '11px', color: T.faint, marginLeft: 'auto', flexShrink: 0 }}>
                        {isInitialLoad
                            ? `Showing first ${rows.length} of ${total.toLocaleString()} records — search or filter to explore`
                            : `${rows.length.toLocaleString()} result${rows.length !== 1 ? 's' : ''}`
                        }
                    </span>
                </div>

                {/* AI Brief */}
                {(aiBrief || aiLoading) && (
                    <div style={{ margin: '12px 1.5rem', padding: '1rem 1.25rem', background: '#fffbeb', border: `0.5px solid ${T.accent}`, borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start', flexShrink: 0 }}>
                        <Brain size={15} style={{ color: T.accent, flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Intelligence Brief</p>
                            {aiLoading
                                ? <p style={{ fontSize: '13px', color: T.muted, margin: 0 }}>Analysing…</p>
                                : <p style={{ fontSize: '13px', color: T.ink2, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', fontFamily: T.serif }}>{aiBrief}</p>
                            }
                        </div>
                        <button onClick={() => setAiBrief(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.faint, flexShrink: 0 }}><X size={13} /></button>
                    </div>
                )}

                {/* Table */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: T.cream, borderBottom: `0.5px solid ${T.border}` }}>
                                {COLS.map(col => (
                                    <th key={col.key} onClick={() => col.sortable && handleSort(col.key)}
                                        style={{ padding: '11px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: sortBy === col.key ? T.ink : T.faint, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: col.sortable ? 'pointer' : 'default', width: col.width, whiteSpace: 'nowrap', userSelect: 'none' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                            {col.label}<SortIcon col={col} />
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading && rows.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: T.faint }}>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                                </td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: T.faint, fontSize: '13px' }}>
                                    No records found. Try syncing the OCDS Portal or adjusting filters.
                                </td></tr>
                            ) : rows.map((r, i) => {
                                const sc = statusColor(r.status);
                                return (
                                    <tr key={r.id ?? i}
                                        style={{ borderBottom: `0.5px solid ${T.border2}`, background: i % 2 === 0 ? '#fff' : T.surface, transition: 'background 0.1s', cursor: 'default' }}
                                        onMouseOver={e => e.currentTarget.style.background = T.cream}
                                        onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : T.surface}>
                                        {/* Title */}
                                        <td style={{ padding: '12px 14px', maxWidth: '0', overflow: 'hidden' }}>
                                            <p style={{ margin: 0, fontWeight: 500, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.title}>{r.title || '—'}</p>
                                            {r.ocid && <p style={{ margin: '2px 0 0', fontSize: '10px', color: T.faint }}>{r.ocid}</p>}
                                        </td>
                                        {/* Buyer */}
                                        <td style={{ padding: '12px 14px', maxWidth: '0' }}>
                                            <p style={{ margin: 0, color: T.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.buyer}>{r.buyer || '—'}</p>
                                        </td>
                                        {/* Category */}
                                        <td style={{ padding: '12px 14px' }}>
                                            {r.category
                                                ? <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', background: T.surface2, color: T.ink2, fontSize: '11px', whiteSpace: 'nowrap' }}>{r.category}</span>
                                                : <span style={{ color: T.faint }}>—</span>}
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '12px 14px' }}>
                                            {r.status
                                                ? <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', background: sc.bg, color: sc.text, fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{r.status}</span>
                                                : <span style={{ color: T.faint }}>—</span>}
                                        </td>
                                        {/* Amount */}
                                        <td style={{ padding: '12px 14px', fontWeight: 600, color: T.ink, whiteSpace: 'nowrap' }}>
                                            {fmt(r.amount)}
                                        </td>
                                        {/* Date */}
                                        <td style={{ padding: '12px 14px', color: T.muted, whiteSpace: 'nowrap', fontSize: '12px' }}>
                                            {r.date || '—'}
                                        </td>
                                        {/* Location */}
                                        <td style={{ padding: '12px 14px', color: T.muted, fontSize: '12px' }}>
                                            {r.location
                                                ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} style={{ flexShrink: 0 }} />{r.location}</span>
                                                : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
                ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default KnowledgeHub;

