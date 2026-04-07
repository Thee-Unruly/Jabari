import React, { useState, useEffect } from 'react';
import {
  Plus, FileText,
  Settings, User,
  PanelLeftClose, PanelLeftOpen,
  MessageCircle, Database, Command, PenTool, Globe
} from 'lucide-react';
import axios from 'axios';
import DropZone from './components/DropZone';
import AnalysisSidebar from './components/AnalysisSidebar';
import ChatInterface from './components/ChatInterface';
import DraftsView from './components/DraftsView';
import KnowledgeHub from './components/KnowledgeHub';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');

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
    padding: '10px',
    borderRadius: '6px',
    border: active ? `1px solid ${T.border}` : '1px solid transparent',
    background: active ? T.cream : 'transparent',
    color: active ? T.ink : T.faint,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? '0 1px 4px rgba(26,26,26,0.08)' : 'none',
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
        width: '64px',
        background: T.cream,
        borderRight: `0.5px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem 0',
        gap: '8px',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          background: T.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}>
          <span style={{ fontFamily: T.serif, color: T.cream, fontSize: '16px', fontStyle: 'italic', fontWeight: 600 }}>J</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <button style={navBtn(view === 'vault')} onClick={() => setView('vault')} title="Secure Vault">    <Database style={{ width: '18px', height: '18px' }} /></button>
          <button style={navBtn(view === 'assistant')} onClick={() => setView('assistant')} title="Neural Assistant"><MessageCircle style={{ width: '18px', height: '18px' }} /></button>
          <button style={navBtn(view === 'drafts')} onClick={() => setView('drafts')} title="Drafting Engine"> <PenTool style={{ width: '18px', height: '18px' }} /></button>
          <button style={navBtn(view === 'knowledge')} onClick={() => setView('knowledge')} title="Jabari Knowledge"><Globe style={{ width: '18px', height: '18px' }} /></button>
          <button style={{ ...navBtn(false), marginTop: '8px' }} title="Settings"><Settings style={{ width: '18px', height: '18px' }} /></button>
        </div>

        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: `1px solid ${T.border}`,
          background: T.surface2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <User style={{ width: '15px', height: '15px', color: T.muted }} />
        </div>
      </nav>

      {/* ── 2. VIEWPORT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ══ VAULT VIEW ══ */}
        {view === 'vault' && (
          <div style={{ display: 'flex', height: '100%' }}>

            {/* Sidebar */}
            <aside style={{
              width: sidebarOpen ? '280px' : '0',
              opacity: sidebarOpen ? 1 : 0,
              overflow: 'hidden',
              borderRight: `0.5px solid ${T.border}`,
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.3s, opacity 0.3s',
              background: T.cream,
              flexShrink: 0,
            }}>
              <div style={{ padding: '1.5rem', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Tenders Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, fontWeight: 500, margin: 0 }}>
                      Projects / Tenders
                    </p>
                    <button onClick={() => setShowCreateTender(!showCreateTender)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 0 }}><Plus size={14}/></button>
                  </div>
                  
                  {showCreateTender && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                      <input 
                        value={newTenderName} 
                        onChange={e => setNewTenderName(e.target.value)} 
                        autoFocus
                        placeholder="Project Name..." 
                        style={{ flex: 1, border: `0.5px solid ${T.border}`, padding: '6px 8px', borderRadius: '4px', background: 'transparent', fontSize: '12px', color: T.ink, outline: 'none', fontFamily: T.sans }} 
                        onKeyDown={e => e.key === 'Enter' && handleCreateTender()}
                      />
                      <button onClick={handleCreateTender} style={{ background: T.ink, color: T.cream, border: 'none', padding: '0 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={() => setActiveTenderId(null)} style={{ width: '100%', textAlign: 'left', background: activeTenderId === null ? T.surface2 : 'transparent', border: `0.5px solid ${activeTenderId === null ? T.border : 'transparent'}`, padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: activeTenderId === null ? T.ink : T.ink2, fontWeight: activeTenderId === null ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.sans }}>
                      Universal Vault
                    </button>
                    {tenders.map(t => (
                      <button key={t.id} onClick={() => setActiveTenderId(t.id)} style={{ width: '100%', textAlign: 'left', background: activeTenderId === t.id ? T.surface2 : 'transparent', border: `0.5px solid ${activeTenderId === t.id ? T.border : 'transparent'}`, padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: activeTenderId === t.id ? T.ink : T.ink2, fontWeight: activeTenderId === t.id ? 500 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: T.sans }}>
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, fontWeight: 500, marginBottom: '1rem' }}>
                  Vaulted Sources
                </p>
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sources.filter(d => activeTenderId ? d.tender_id === activeTenderId : true).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setActiveDoc(doc)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `0.5px solid ${activeDoc?.id === doc.id ? T.border : 'transparent'}`,
                        background: activeDoc?.id === doc.id ? T.surface2 : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        fontFamily: T.sans,
                      }}
                    >
                      <FileText style={{ width: '16px', height: '16px', color: activeDoc?.id === doc.id ? T.ink : T.muted, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: T.ink, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</p>
                        <p style={{ fontSize: '9px', color: T.faint, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '3px 0 0', fontWeight: 500 }}>
                          {doc.category || 'PDF'} · {doc.analysis?.status || 'Verified'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Re-initialize */}
              <div style={{ padding: '1.25rem', borderTop: `0.5px solid ${T.border}` }}>
                <button
                  onClick={() => setActiveDoc(null)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '24px',
                    border: 'none',
                    background: T.ink,
                    color: T.cream,
                    fontSize: '11px',
                    fontFamily: T.sans,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  <Plus style={{ width: '14px', height: '14px' }} /> Re-initialize Vault
                </button>
              </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.cream, overflow: 'hidden' }}>
              {/* Header */}
              <header style={{
                height: '54px',
                borderBottom: `0.5px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                gap: '1rem',
                background: T.cream,
              }}>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{ padding: '6px', borderRadius: '6px', border: 'none', background: 'transparent', color: T.muted, cursor: 'pointer' }}
                >
                  {sidebarOpen ? <PanelLeftClose style={{ width: '18px', height: '18px' }} /> : <PanelLeftOpen style={{ width: '18px', height: '18px' }} />}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint }}>Jabari System //</span>
                  <span style={{ fontFamily: T.serif, fontSize: '17px', fontWeight: 400, fontStyle: 'italic', color: T.ink }}>Secure Vault Repository</span>
                </div>
              </header>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {!activeDoc ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '640px', width: '100%' }}>
                      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontFamily: T.serif, fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 500, color: T.ink, fontStyle: 'italic', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                          Turn Days of Review<br />Into Minutes
                        </h2>
                        <p style={{ fontSize: '15px', color: T.muted, lineHeight: 1.7, maxWidth: '420px', margin: '0 auto' }}>
                          Ground your bid intelligence in a secure, AI-indexed vault.
                        </p>
                      </div>
                      <DropZone onUploadSuccess={handleUploadSuccess} activeTenderId={activeTenderId} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '100%' }}>
                    {/* PDF Viewer */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `0.5px solid ${T.border}` }}>
                      <div style={{ padding: '0.75rem 1.5rem', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText style={{ width: '14px', height: '14px', color: T.muted }} />
                          <span style={{ fontSize: '12px', fontWeight: 500, color: T.ink }}>{activeDoc.name}</span>
                        </div>
                        <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/files/${encodeURIComponent(activeDoc.file_name)}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: '11px', color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', textDecoration: 'none' }}>
                          Raw Access
                        </a>
                      </div>
                      <div style={{ flex: 1, padding: '1.5rem' }}>
                        <div style={{ width: '100%', height: '100%', border: `0.5px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                          {activeDoc.category === 'pdf' ? (
                            <iframe
                              id="pdf-viewer"
                              src={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/files/${encodeURIComponent(activeDoc.file_name)}#toolbar=0&navpanes=0`}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              title="Vault Material"
                            />
                          ) : (
                            <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', fontFamily: T.serif, color: T.ink2, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                              {activeDoc.full_content}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Analysis panel */}
                    <div style={{ width: '420px', display: 'flex', flexDirection: 'column', flexShrink: 0, background: T.cream }}>
                      <div style={{ height: '46px', borderBottom: `0.5px solid ${T.border}`, display: 'flex' }}>
                        {['analysis', 'chat'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            flex: 1, fontSize: '10px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase',
                            border: 'none', borderBottom: activeTab === tab ? `2px solid ${T.ink}` : '2px solid transparent',
                            background: 'transparent', color: activeTab === tab ? T.ink : T.faint, cursor: 'pointer', fontFamily: T.sans,
                          }}>
                            {tab === 'analysis' ? 'Briefing' : 'Fast Query'}
                          </button>
                        ))}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        {activeTab === 'analysis'
                          ? <AnalysisSidebar data={activeDoc} onJumpToPage={jumpToPage} />
                          : <ChatInterface documentId={activeDoc.id} tenderId={activeTenderId} tenderName={tenders.find(t=>t.id===activeTenderId)?.name} />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        )}

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
                <ChatInterface documentId={activeDoc?.id} tenderId={activeTenderId} tenderName={tenders.find(t=>t.id===activeTenderId)?.name} initialSources={sources.filter(d => activeTenderId ? d.tender_id === activeTenderId : true)} />
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
      </div>
    </div>
  );
};

export default App;