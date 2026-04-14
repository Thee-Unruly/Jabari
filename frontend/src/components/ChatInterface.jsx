// ChatInterface — Harvey-style agentic thinking UI
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, User, Loader2, Bookmark, Paperclip,
  Check, Database, X, Search, FileText,
  Command as CommandIcon, ChevronDown, ChevronRight,
  Globe, Brain, Sparkles,
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
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const extractKeyTerms = (q) => {
  const stop = new Set([
    'who', 'are', 'the', 'most', 'for', 'from', 'at', 'to', 'in', 'is', 'a', 'an', 'and', 'of', 'with',
    'all', 'give', 'me', 'show', 'find', 'list', 'get', 'what', 'how', 'why', 'when', 'where', 'which',
    'do', 'does', 'did', 'has', 'have', 'been', 'be', 'was', 'were', 'will', 'would', 'could', 'should',
    'can', 'my', 'your', 'their', 'this', 'that', 'these', 'those', 'about', 'some', 'any', 'its',
  ]);
  return [...new Set(
    q.split(/\s+/).map(w => w.replace(/[?.,!;:]/g, '').toLowerCase()).filter(w => w.length > 2 && !stop.has(w))
  )].slice(0, 7);
};

const ThinkingTrace = ({ steps, collapsed, onToggle }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: '4px 0', fontFamily: T.sans, fontSize: '13px', fontWeight: 500, marginBottom: collapsed ? 0 : '1.5rem' }}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        Working…
      </button>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '2px', width: '16px', display: 'flex', justifyContent: 'center' }}>
                {step.status === 'loading'
                  ? <Loader2 size={14} style={{ color: T.muted, animation: 'jabari-spin 1s linear infinite' }} />
                  : <span style={{ color: T.faint, fontSize: '16px', lineHeight: 1 }}>◦</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 500, color: T.ink2 }}>{step.title}</p>
                {step.content && <p style={{ margin: '0 0 8px', fontSize: '13px', color: T.muted, lineHeight: 1.65 }}>{step.content}</p>}
                {step.files?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {step.files.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '8px', background: '#fff', border: `0.5px solid ${T.border}`, fontSize: '13px', color: T.ink, fontWeight: 500, boxShadow: '0 1px 4px rgba(26,26,26,0.06)' }}>
                        <FileText size={14} style={{ color: '#e53e3e', flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>
                )}
                {step.chips?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {step.chips.map((chip, ci) => (
                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', border: `0.5px solid ${T.border}`, background: '#fff', fontSize: '12px', color: T.ink2 }}>
                        <Search size={11} style={{ color: T.faint }} />{chip}
                      </div>
                    ))}
                  </div>
                )}
                {step.entities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {step.entities.map((e, ei) => (
                      <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', border: `0.5px solid ${T.border}`, background: '#fff', fontSize: '11px', color: T.ink2 }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Globe size={8} style={{ color: '#fff' }} />
                        </div>{e}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageBlock = ({ msg }) => {
  const [collapsed, setCollapsed] = useState(true);
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '72%', padding: '12px 16px', background: T.surface2, border: `0.5px solid ${T.border}`, borderRadius: '12px 12px 4px 12px', fontSize: '14px', color: T.ink, lineHeight: 1.65 }}>
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: '2.5rem', maxWidth: '92%' }}>
      {msg.steps?.length > 0 && <ThinkingTrace steps={msg.steps} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />}
      <div style={{ fontSize: '14px', color: T.ink2, lineHeight: 1.8, fontFamily: T.sans }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          table: ({ node, ...props }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '13px' }} {...props} />,
          th: ({ node, ...props }) => <th style={{ borderBottom: `2px solid ${T.border}`, padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: T.ink }} {...props} />,
          td: ({ node, ...props }) => <td style={{ borderBottom: `1px solid ${T.border2}`, padding: '10px 12px', verticalAlign: 'top', color: T.ink2 }} {...props} />,
          strong: ({ node, ...props }) => <strong style={{ fontWeight: 600, color: T.ink }} {...props} />,
          ul: ({ node, ...props }) => <ul style={{ paddingLeft: '20px', margin: '0 0 1rem' }} {...props} />,
          li: ({ node, ...props }) => <li style={{ marginBottom: '6px' }} {...props} />,
          p: ({ node, ...props }) => <p style={{ margin: '0 0 1rem' }} {...props} />,
          code: ({ node, ...props }) => <code style={{ background: T.surface2, padding: '2px 5px', borderRadius: '4px', fontSize: '12px', color: T.ink }} {...props} />,
        }}>{msg.content}</ReactMarkdown>
      </div>
      {msg.citations?.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `0.5px solid ${T.border}` }}>
          <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, display: 'flex', alignItems: 'center', gap: '5px', margin: '0 0 8px' }}>
            <Bookmark size={10} /> Grounded Evidence
          </p>
          {msg.citations.map((cite, ci) => (
            <div key={ci} style={{ padding: '10px 12px', background: T.surface2, border: `0.5px solid ${T.border}`, borderRadius: '6px', marginBottom: '6px' }}>
              <p style={{ fontSize: '10px', fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cite.filename}</p>
              <p style={{ fontSize: '12px', color: T.muted, fontStyle: 'italic', lineHeight: 1.6, fontFamily: T.serif, margin: 0 }}>"…{cite.snippet}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChatInterface = ({ documentId, tenderId, tenderName, initialSources = [], initialQuestion = '', onInitialQuestionConsumed }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState(initialSources);
  const [tenders, setTenders] = useState([]);
  const [groundedDocId, setGroundedDocId] = useState(documentId);
  const [groundedTenderId, setGroundedTenderId] = useState(tenderId);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSteps, setLiveSteps] = useState([]);
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    if (sources.length === 0) axios.get(`${base}/sources`).then(r => setSources(r.data.map(d => ({ ...d, name: d.file_name })))).catch(() => { });
    if (tenders.length === 0) axios.get(`${base}/tenders`).then(r => setTenders(r.data)).catch(() => { });
  }, []);

  useEffect(() => { setGroundedDocId(documentId); }, [documentId]);
  useEffect(() => { setGroundedTenderId(tenderId); }, [tenderId]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, liveSteps]);
  useEffect(() => {
    if (initialQuestion && !isLoading) {
      setInput(initialQuestion);
      if (onInitialQuestionConsumed) onInitialQuestionConsumed();
      // Use timeout to let input state settle before sending
      setTimeout(() => handleSendWith(initialQuestion), 50);
    }
  }, [initialQuestion]);
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setShowDocSelector(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name;
  const displayTenderName = tenders.find(t => t.id === groundedTenderId)?.name || tenderName;
  const filteredSources = sources.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTenders = tenders.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const question = input.trim();
    await handleSendWith(question);
  };

  const handleSendWith = async (question) => {
    if (!question || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setLiveSteps([]);
    setLiveCollapsed(false);
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const steps = [];
    const addStep = (s) => { steps.push(s); setLiveSteps([...steps]); };
    const updateLast = (upd) => { Object.assign(steps[steps.length - 1], upd); setLiveSteps([...steps]); };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    const assessText = groundedDocId
      ? 'I will analyse the attached document and extract relevant information to answer this query.'
      : groundedTenderId
        ? 'I will search the project workspace and market intelligence to address this query.'
        : 'I will search across the full vault and market intelligence base to provide a grounded answer.';
    addStep({ type: 'assess', title: 'Assessing query', content: assessText, status: 'done' });
    await wait(350);

    const doc = sources.find(s => s.id === groundedDocId);
    addStep({
      type: 'review',
      title: groundedDocId ? 'Reviewing attached file' : 'Searching vault',
      files: doc ? [doc.name] : [],
      content: !groundedDocId ? 'Searching across all vaulted documents.' : null,
      status: 'done',
    });
    await wait(300);

    const terms = extractKeyTerms(question);
    if (terms.length > 0) {
      addStep({ type: 'terms', title: 'Checking for key terms', chips: terms, status: 'done' });
      await wait(300);
    }

    const mktWords = ['price', 'cost', 'award', 'benchmark', 'market', 'tender', 'active', 'list', 'show', 'give', 'find', 'who', 'won', 'winning', 'all', 'compare'];
    if (mktWords.some(w => question.toLowerCase().includes(w))) {
      addStep({ type: 'market', title: 'Searching market intelligence', entities: ['OCDS Kenya', 'Procurement Portal', 'Historical Awards'], status: 'done' });
      await wait(300);
    }

    addStep({ type: 'synthesise', title: 'Preparing response', status: 'loading' });

    try {
      const response = await axios.post(`${base}/chat`, { message: question, document_id: groundedDocId, tender_id: groundedTenderId });
      updateLast({ status: 'done' });
      const finalSteps = [...steps];
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer, citations: response.data.citations, steps: finalSteps }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sync error — verify connection.', steps: [] }]);
    } finally {
      setLiveSteps([]);
      setIsLoading(false);
    }
  };

  const pickerBtn = (active) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderRadius: '6px', border: `0.5px solid ${active ? T.ink : T.border}`,
    background: active ? T.ink : 'transparent', color: active ? T.cream : T.ink,
    cursor: 'pointer', textAlign: 'left', marginBottom: '6px', transition: 'all 0.15s', fontFamily: T.sans,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', position: 'relative', overflow: 'hidden', fontFamily: T.sans }}>

      {showDocSelector && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={() => setShowDocSelector(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(245,242,237,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 50, width: '100%', maxWidth: '520px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '10px', boxShadow: '0 8px 40px rgba(26,26,26,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Search size={15} style={{ color: T.muted, flexShrink: 0 }} />
              <input autoFocus type="text" placeholder="Search vaulted documents…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: T.serif, fontStyle: 'italic', fontSize: '15px', color: T.ink, outline: 'none' }} />
              <button onClick={() => setShowDocSelector(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}><X size={15} /></button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '360px', padding: '1rem' }}>
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '0 4px 8px', margin: 0 }}>Neural Scopes</p>
              <button style={pickerBtn(!groundedDocId && !groundedTenderId)} onClick={() => { setGroundedDocId(null); setGroundedTenderId(null); setShowDocSelector(false); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Database size={14} /><span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Universal Vault</span></div>
                {!groundedDocId && !groundedTenderId && <Check size={13} />}
              </button>
              {filteredTenders.length > 0 && (
                <>
                  <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '10px 4px 8px', margin: 0 }}>Project Workspaces</p>
                  {filteredTenders.map(t => (
                    <button key={t.id} style={pickerBtn(!groundedDocId && groundedTenderId === t.id)} onClick={() => { setGroundedTenderId(t.id); setGroundedDocId(null); setShowDocSelector(false); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <Database size={14} style={{ flexShrink: 0, color: !groundedDocId && groundedTenderId === t.id ? T.cream : T.muted }} />
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                      </div>
                      {!groundedDocId && groundedTenderId === t.id && <Check size={13} style={{ flexShrink: 0 }} />}
                    </button>
                  ))}
                </>
              )}
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '10px 4px 8px', margin: 0 }}>Vaulted Sources</p>
              {filteredSources.map(doc => (
                <button key={doc.id} style={pickerBtn(groundedDocId === doc.id)} onClick={() => { setGroundedDocId(doc.id); setShowDocSelector(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <FileText size={14} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</span>
                  </div>
                  {groundedDocId === doc.id && <Check size={13} style={{ flexShrink: 0 }} />}
                </button>
              ))}
            </div>
            <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10px', color: T.faint, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Esc to close</span>
              <span style={{ fontSize: '10px', color: T.faint, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}><CommandIcon size={10} /> + Selection</span>
            </div>
          </div>
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '3rem 3rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && !isLoading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.35, textAlign: 'center', paddingBottom: '4rem' }}>
            <Brain size={42} style={{ marginBottom: '1rem', color: T.ink }} />
            <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: '19px', color: T.ink, margin: '0 0 6px' }}>Jabari Assistant</p>
            <p style={{ fontSize: '13px', color: T.muted, margin: 0 }}>Ask anything about your documents or the procurement market.</p>
          </div>
        )}
        {messages.map((msg, idx) => <MessageBlock key={idx} msg={msg} />)}
        {isLoading && liveSteps.length > 0 && (
          <div style={{ maxWidth: '92%' }}>
            <ThinkingTrace steps={liveSteps} collapsed={liveCollapsed} onToggle={() => setLiveCollapsed(c => !c)} />
          </div>
        )}
      </div>

      <div style={{ padding: '1rem 1.5rem 1.25rem', borderTop: `0.5px solid ${T.border}`, background: '#fff' }}>
        {(activeDocName || displayTenderName) && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '24px', background: T.ink, color: T.cream, fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px', maxWidth: '100%' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeDocName || displayTenderName}</span>
            <button onClick={() => { setGroundedDocId(null); setGroundedTenderId(null); }} style={{ background: 'none', border: 'none', color: T.cream, cursor: 'pointer', display: 'flex', padding: 0, flexShrink: 0, opacity: 0.6 }}><X size={11} /></button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', border: `0.5px solid ${T.border}`, borderRadius: '10px', overflow: 'hidden', background: T.cream }}>
          <button onClick={() => setShowDocSelector(true)} title="Select document scope"
            style={{ padding: '0 14px', border: 'none', borderRight: `0.5px solid ${T.border}`, background: 'transparent', color: groundedDocId ? T.ink : T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
            <Paperclip size={15} />
          </button>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={groundedDocId ? 'Ask about this document…' : displayTenderName ? `Ask about ${displayTenderName}…` : 'Ask anything…'}
            style={{ flex: 1, padding: '13px 16px', border: 'none', background: 'transparent', fontSize: '14px', color: T.ink, outline: 'none', fontFamily: T.sans }} />
          <button onClick={handleSend} disabled={isLoading || !input.trim()}
            style={{ padding: '0 16px', border: 'none', borderLeft: `0.5px solid ${T.border}`, background: 'transparent', cursor: isLoading || !input.trim() ? 'default' : 'pointer', color: isLoading || !input.trim() ? T.faint : T.ink, display: 'flex', alignItems: 'center', alignSelf: 'stretch' }}>
            {isLoading ? <Loader2 size={16} style={{ animation: 'jabari-spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <style>{`@keyframes jabari-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:10px}`}</style>
    </div>
  );
};

export default ChatInterface;
