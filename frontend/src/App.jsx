import React, { useState, useEffect } from 'react';
import {
  Plus, FileText, Settings, User,
  MessageCircle, Database, Command, PenTool, Globe, LayoutGrid, Zap,
  ArrowLeft, Upload, Folder, Filter, ChevronRight, Mic,
  LayoutList, Sparkles, X,
} from 'lucide-react';
import axios from 'axios';
import DropZone from './components/DropZone';
import AnalysisSidebar from './components/AnalysisSidebar';
import ChatInterface from './components/ChatInterface';
import DraftsView from './components/DraftsView';
import KnowledgeHub from './components/KnowledgeHub';
import IntegrationsHub from './components/IntegrationsHub';
import WorkflowsHub from './components/WorkflowsHub';

/* ─── Jabari cream design tokens (mirrors the marketing HTML) ─── */
const T = {
  cream: '#F5F2ED',
  ink: '#1a1a1a',
  ink2: '#3d3d3a',
  muted: '#6b6b68',
  faint: '#9a9a96',
  border: 'rgba(26,26,26,0.10)',
  border2: 'rgba(26,26,26,0.06)',
  surface: 'rgba(26,26,26,0.03)',   // very faint tint on cream
  surface2: 'rgba(26,26,26,0.06)',
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const App = () => {
  const [sources, setSources] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [activeTenderId, setActiveTenderId] = useState(null);
  const [showCreateTender, setShowCreateTender] = useState(false);
  const [newTenderName, setNewTenderName] = useState('');
  const [view, setView] = useState('vault');
  const [activeTab, setActiveTab] = useState('analysis');
  const [vaultTab, setVaultTab] = useState('overview');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [initialQuestion, setInitialQuestion] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      try {
        const [sourceRes, tenderRes] = await Promise.all([
          axios.get(`${baseUrl}/sources`),
          axios.get(`${baseUrl}/tenders`)
        ]);
        setSources(sourceRes.data.map(d => ({ ...d, name: d.file_name })));
        setTenders(tenderRes.data);
      } catch (err) {
        console.error('Data Recall Failed:', err);
      }
    };
    fetchData();
  }, []);

  const handleCreateTender = async () => {
    if (!newTenderName.trim()) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const res = await axios.post(`${baseUrl}/tenders`, { name: newTenderName, description: 'Tender Project' });
      setTenders([res.data, ...tenders]);
      setActiveTenderId(res.data.id);
      setNewTenderName('');
      setShowCreateTender(false);
    } catch (err) {
      console.error('Failed to create tender', err);
    }
  };

  const handleUploadSuccess = (data) => {
    const newDoc = { ...data, name: data.file_name };
    setSources([newDoc, ...sources]);
    setActiveDoc(newDoc);
  };

  const jumpToPage = (pageNum) => {
    const iframe = document.getElementById('pdf-viewer');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    if (iframe && activeDoc?.file_name) {
      iframe.src = `${baseUrl}/files/${encodeURIComponent(activeDoc.file_name)}#page=${pageNum}`;
    }
  };

  /* ── shared nav button style ── */
  const navBtn = (active) => ({
    padding: '9px 12px',
    borderRadius: '6px',
    border: active ? `1px solid ${T.border}` : '1px solid transparent',
    background: active ? T.surface2 : 'transparent',
    color: active ? T.ink : T.faint,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px',
    width: '100%',
    fontSize: '13px',
    fontWeight: active ? 500 : 400,
    fontFamily: T.sans,
    boxShadow: active ? '0 1px 4px rgba(26,26,26,0.06)' : 'none',
  });

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: T.cream,
      color: T.ink,
      overflow: 'hidden',
      fontFamily: T.sans,
    }}>

      {/* ── 1. PRIMARY NAV ── */}
      <nav style={{
        width: '200px',
        background: T.cream,
        borderRight: `0.5px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        gap: '2px',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', paddingLeft: '4px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.serif, color: T.cream, fontSize: '14px', fontStyle: 'italic', fontWeight: 600 }}>J</span>
          </div>
          <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: '16px', color: T.ink, fontWeight: 600 }}>Jabari</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <button style={navBtn(view === 'vault')} onClick={() => setView('vault')}>
            <Database style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Vault
          </button>
          <button style={navBtn(view === 'assistant')} onClick={() => setView('assistant')}>
            <MessageCircle style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Assistant
          </button>
          <button style={navBtn(view === 'drafts')} onClick={() => setView('drafts')}>
            <PenTool style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Drafts
          </button>
          <button style={navBtn(view === 'knowledge')} onClick={() => setView('knowledge')}>
            <Globe style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Knowledge
          </button>
          <button style={navBtn(view === 'integrations')} onClick={() => setView('integrations')}>
            <LayoutGrid style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Integrations
          </button>
          <button style={navBtn(view === 'workflows')} onClick={() => setView('workflows')}>
            <Zap style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Workflows
          </button>
          <div style={{ height: '0.5px', background: T.border, margin: '10px 0' }} />
          <button style={navBtn(false)}>
            <Settings style={{ width: '15px', height: '15px', flexShrink: 0 }} /> Settings
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px', marginTop: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `1px solid ${T.border}`, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User style={{ width: '13px', height: '13px', color: T.muted }} />
          </div>
          <span style={{ fontSize: '12px', color: T.muted, fontFamily: T.sans }}>Account</span>
        </div>
      </nav>

      {/* ── 2. VIEWPORT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ══ VAULT VIEW ══ */}
        {view === 'vault' && (() => {
          const activeTender = tenders.find(t => t.id === activeTenderId);
          const visibleDocs = sources.filter(d => activeTenderId ? d.tender_id === activeTenderId : true);
          const ext = (name = '') => (name.split('.').pop() || '').toUpperCase() || 'FILE';
          const catDot = (cat) => {
            const h = [...(cat || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0);
            const palette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
            return palette[h % palette.length];
          };
          const toggleRow = (id) => setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

          // Document open view
          if (activeDoc) return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
              <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => setActiveDoc(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '13px', fontFamily: T.sans }}>
                    <ArrowLeft size={15} /> Vault
                  </button>
                  {activeTender && <><ChevronRight size={13} style={{ color: T.faint }} /><span style={{ fontSize: '13px', color: T.muted }}>{activeTender.name}</span></>}
                  <ChevronRight size={13} style={{ color: T.faint }} />
                  <span style={{ fontSize: '13px', color: T.ink, fontWeight: 500 }}>{activeDoc.name}</span>
                </div>
                <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/files/${encodeURIComponent(activeDoc.file_name)}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: '11px', color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>Raw ↗</a>
              </header>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `0.5px solid ${T.border}` }}>
                  <div style={{ flex: 1, padding: '1.25rem' }}>
                    <div style={{ width: '100%', height: '100%', border: `0.5px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                      {activeDoc.category === 'pdf' ? (
                        <iframe id="pdf-viewer" src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/files/${encodeURIComponent(activeDoc.file_name)}#toolbar=0&navpanes=0`} style={{ width: '100%', height: '100%', border: 'none' }} title="Vault Material" />
                      ) : (
                        <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', fontFamily: T.serif, color: T.ink2, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{activeDoc.full_content}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ width: '420px', display: 'flex', flexDirection: 'column', flexShrink: 0, background: T.cream }}>
                  <div style={{ height: '46px', borderBottom: `0.5px solid ${T.border}`, display: 'flex' }}>
                    {['analysis', 'chat'].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, fontSize: '10px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', border: 'none', borderBottom: activeTab === tab ? `2px solid ${T.ink}` : '2px solid transparent', background: 'transparent', color: activeTab === tab ? T.ink : T.faint, cursor: 'pointer', fontFamily: T.sans }}>
                        {tab === 'analysis' ? 'Briefing' : 'Fast Query'}
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    {activeTab === 'analysis' ? <AnalysisSidebar data={activeDoc} onJumpToPage={jumpToPage} /> : <ChatInterface documentId={activeDoc.id} tenderId={activeTenderId} tenderName={activeTender?.name} />}
                  </div>
                </div>
              </div>
            </div>
          );

          // Data room overview
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

              {/* ── Header ── */}
              <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeTenderId && (
                    <button onClick={() => setActiveTenderId(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '13px', fontFamily: T.sans }}>
                      <ArrowLeft size={15} /> Vault
                    </button>
                  )}
                  {activeTenderId && <ChevronRight size={13} style={{ color: T.faint }} />}
                  <span style={{ fontSize: '14px', fontWeight: activeTenderId ? 500 : 400, color: T.ink, fontFamily: T.sans }}>
                    {activeTender ? activeTender.name : 'Vault'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => setShowUpload(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: T.ink, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: T.sans }}>
                    <Upload size={13} /> Upload
                  </button>
                  <button style={{ padding: '7px 9px', background: 'none', border: `0.5px solid ${T.border}`, borderRadius: '7px', cursor: 'pointer', color: T.muted, display: 'flex' }}>
                    <LayoutList size={14} />
                  </button>
                </div>
              </header>

              {/* ── Tabs ── */}
              <div style={{ display: 'flex', padding: '0 2rem', borderBottom: `0.5px solid ${T.border}`, background: '#fff', flexShrink: 0 }}>
                {['overview', 'recent queries', 'activity', 'settings'].map(tab => (
                  <button key={tab} onClick={() => setVaultTab(tab)}
                    style={{ padding: '14px 6px', marginRight: '24px', background: 'none', border: 'none', borderBottom: vaultTab === tab ? `2px solid ${T.ink}` : '2px solid transparent', fontSize: '13px', fontWeight: vaultTab === tab ? 500 : 400, color: vaultTab === tab ? T.ink : T.muted, cursor: 'pointer', textTransform: 'capitalize', fontFamily: T.sans }}>
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Body ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3rem' }}>

                {/* Upload modal inline */}
                {showUpload && (
                  <div style={{ marginBottom: '2rem', padding: '1.5rem', border: `1px dashed ${T.border}`, borderRadius: '12px', background: T.cream, position: 'relative' }}>
                    <button onClick={() => setShowUpload(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted }}><X size={14} /></button>
                    <DropZone onUploadSuccess={(data) => { handleUploadSuccess(data); setShowUpload(false); }} activeTenderId={activeTenderId} />
                  </div>
                )}

                {/* ── Assistant entry banner ── */}
                <div style={{ maxWidth: '740px', margin: '0 auto 2.5rem', borderRadius: '12px', border: `0.5px solid ${T.border}`, background: T.cream, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 500, color: T.ink, fontFamily: T.sans }}>Ask Jabari about your files</p>
                    <p style={{ margin: 0, fontSize: '12px', color: T.muted, fontFamily: T.sans, lineHeight: 1.5 }}>
                      {activeTender
                        ? <>Searching within <span style={{ fontWeight: 500, color: T.ink2 }}>{activeTender.name}</span> — open the Assistant to ask cross-document questions or explore market intelligence.</>
                        : 'Open the Assistant to ask questions across all vaulted documents, compare tenders, or explore market intelligence.'}
                    </p>
                  </div>
                  <button onClick={() => setView('assistant')}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', background: T.ink, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: T.sans, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <MessageCircle size={14} /> Open Assistant
                  </button>
                </div>

                {/* ── Quick Actions ── */}
                <div style={{ maxWidth: '740px', margin: '0 auto 3rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  {[
                    { label: 'Generate a review', icon: <Sparkles size={13} />, action: () => setView('drafts') },
                    { label: 'Draft a document', icon: <PenTool size={13} />, action: () => setView('drafts') },
                    { label: 'Use a workflow', icon: <Zap size={13} />, action: () => setView('workflows') },
                  ].map(btn => (
                    <button key={btn.label} onClick={btn.action}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '8px', fontSize: '12px', color: T.ink2, cursor: 'pointer', fontFamily: T.sans, fontWeight: 400 }}>
                      {btn.icon} {btn.label}
                    </button>
                  ))}
                </div>

                {/* ── Files Table ── */}
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: T.ink }}>Files</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Create Tender as folder */}
                      <button onClick={() => setShowCreateTender(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '7px', fontSize: '12px', color: T.ink2, cursor: 'pointer', fontFamily: T.sans }}>
                        <Plus size={13} /> Create folder
                      </button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '7px', fontSize: '12px', color: T.ink2, cursor: 'pointer', fontFamily: T.sans }}>
                        <Filter size={13} /> Filters
                      </button>
                    </div>
                  </div>

                  {showCreateTender && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <input value={newTenderName} onChange={e => setNewTenderName(e.target.value)} autoFocus placeholder="Folder / Project name..."
                        style={{ flex: 1, border: `0.5px solid ${T.border}`, padding: '8px 12px', borderRadius: '6px', background: '#fff', fontSize: '13px', color: T.ink, outline: 'none', fontFamily: T.sans }}
                        onKeyDown={e => e.key === 'Enter' && handleCreateTender()} />
                      <button onClick={handleCreateTender} style={{ background: T.ink, color: '#fff', border: 'none', padding: '0 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Add</button>
                      <button onClick={() => setShowCreateTender(false)} style={{ background: 'none', border: `0.5px solid ${T.border}`, padding: '0 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: T.muted }}>Cancel</button>
                    </div>
                  )}

                  {/* Table header */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `0.5px solid ${T.border}` }}>
                        <th style={{ width: '32px', padding: '10px 8px' }}>
                          <input type="checkbox" style={{ cursor: 'pointer' }} />
                        </th>
                        {['File name', 'Category', 'Type', 'Last modified', 'Size'].map(col => (
                          <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: T.faint, letterSpacing: '0.04em', fontFamily: T.sans }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Tender folders (only when in universal vault) */}
                      {!activeTenderId && tenders.map(t => (
                        <tr key={`t-${t.id}`} onClick={() => setActiveTenderId(t.id)}
                          style={{ borderBottom: `0.5px solid ${T.border}`, cursor: 'pointer' }}
                          onMouseOver={e => e.currentTarget.style.background = T.cream}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 8px' }}><input type="checkbox" onClick={e => e.stopPropagation()} /></td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Folder size={16} style={{ color: T.muted, flexShrink: 0 }} />
                              <span style={{ fontSize: '13px', fontWeight: 500, color: T.ink }}>{t.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }} />
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>Folder</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>—</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>—</td>
                        </tr>
                      ))}
                      {/* Document files */}
                      {visibleDocs.map(doc => (
                        <tr key={doc.id} onClick={() => setActiveDoc(doc)}
                          style={{ borderBottom: `0.5px solid ${T.border}`, cursor: 'pointer' }}
                          onMouseOver={e => e.currentTarget.style.background = T.cream}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '12px 8px' }}>
                            <input type="checkbox" checked={selectedRows.has(doc.id)} onChange={() => toggleRow(doc.id)} onClick={e => e.stopPropagation()} />
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FileText size={11} style={{ color: '#ef4444' }} />
                              </span>
                              <span style={{ fontSize: '13px', color: T.ink }}>{doc.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {doc.category && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: T.cream, border: `0.5px solid ${T.border}`, fontSize: '11px', color: T.ink2 }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: catDot(doc.category), flexShrink: 0 }} />
                                {doc.category}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>{ext(doc.file_name)}</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>—</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: T.faint }}>—</td>
                        </tr>
                      ))}
                      {!activeTenderId && tenders.length === 0 && visibleDocs.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', fontSize: '13px', color: T.faint }}>No files yet. Upload a document or create a folder to get started.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══ ASSISTANT VIEW ══ */}
        {view === 'assistant' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, height: '100%' }}>
            <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '10px' }}>
              <Command style={{ width: '16px', height: '16px', color: T.ink }} />
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Neural Central //</span>
              <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Jabari Executive Assistant</span>
            </header>
            <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%', padding: '2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, borderRadius: '8px', border: `0.5px solid ${T.border}`, overflow: 'hidden' }}>
                <ChatInterface documentId={activeDoc?.id} tenderId={activeTenderId} tenderName={tenders.find(t => t.id === activeTenderId)?.name} initialSources={sources.filter(d => activeTenderId ? d.tender_id === activeTenderId : true)} initialQuestion={initialQuestion} onInitialQuestionConsumed={() => setInitialQuestion('')} />
              </div>
            </div>
          </div>
        )}

        {/* ══ DRAFTS VIEW ══ */}
        {view === 'drafts' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, height: '100%' }}>
            <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '10px' }}>
              <PenTool style={{ width: '16px', height: '16px', color: T.ink }} />
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Drafting Command //</span>
              <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Bid Production Studio</span>
            </header>
            <DraftsView sources={sources} />
          </div>
        )}

        {/* ══ KNOWLEDGE VIEW ══ */}
        {view === 'knowledge' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, height: '100%' }}>
            <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '10px' }}>
              <Globe style={{ width: '16px', height: '16px', color: T.ink }} />
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Market Intelligence //</span>
              <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Jabari Knowledge Hub</span>
            </header>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <KnowledgeHub />
            </div>
          </div>
        )}

        {/* ══ INTEGRATIONS VIEW ══ */}
        {view === 'integrations' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, height: '100%' }}>
            <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '10px' }}>
              <LayoutGrid style={{ width: '16px', height: '16px', color: T.ink }} />
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Ecosystem //</span>
              <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Integrations Hub</span>
            </header>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <IntegrationsHub />
            </div>
          </div>
        )}

        {/* ══ WORKFLOWS VIEW ══ */}
        {view === 'workflows' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, height: '100%' }}>
            <header style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', gap: '10px' }}>
              <Zap style={{ width: '16px', height: '16px', color: T.ink }} />
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Workflow Studio //</span>
              <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Multi-Step Agent Orchestrator</span>
            </header>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <WorkflowsHub />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;