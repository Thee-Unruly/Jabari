// ChatInterface — Harvey-style assistant UI
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Loader2, Bookmark, Paperclip,
  Check, Database, X, Search, FileText,
  ChevronDown, ChevronRight,
  PenTool, Layers, List, Mic, Settings2, Plus,
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

const StepIcon = ({ type, status }) => {
  if (status === 'loading') return <Loader2 size={13} style={{ color: T.muted, animation: 'jabari-spin 1s linear infinite' }} />;
  const s = { color: T.muted, flexShrink: 0 };
  if (type === 'review') return <Layers size={13} style={s} />;
  if (type === 'terms') return <List size={13} style={s} />;
  if (type === 'market') return <Search size={13} style={s} />;
  return <span style={{ color: T.faint, fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>◦</span>;
};

const ThinkingTrace = ({ steps, collapsed, onToggle, isDone }) => {
  if (!steps || steps.length === 0) return null;
  const label = isDone ? `Finished in ${steps.length} steps` : 'Working…';
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: '2px 0', fontFamily: T.sans, fontSize: '13px', marginBottom: collapsed ? 0 : '1.25rem' }}>
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        {label}
      </button>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, marginTop: '1px', width: '16px', display: 'flex', justifyContent: 'center' }}>
                <StepIcon type={step.type} status={step.status} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 500, color: T.ink2 }}>{step.title}</p>
                {step.content && <p style={{ margin: '0 0 6px', fontSize: '13px', color: T.muted, lineHeight: 1.6 }}>{step.content}</p>}
                {step.files?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {step.files.map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', background: '#fff', border: `0.5px solid ${T.border}`, fontSize: '13px', color: T.ink, fontWeight: 500 }}>
                        <FileText size={14} style={{ color: '#e53e3e', flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>
                )}
                {step.chips?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {step.chips.map((chip, ci) => (
                      <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', border: `0.5px solid ${T.border}`, background: '#fff', fontSize: '12px', color: T.ink2 }}>
                        <Search size={10} style={{ color: T.faint }} />{chip}
                      </div>
                    ))}
                  </div>
                )}
                {step.entities?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {step.entities.map((e, ei) => (
                      <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', border: `0.5px solid ${T.border}`, background: '#fff', fontSize: '11px', color: T.ink2 }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Search size={7} style={{ color: '#fff' }} />
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

// Harvey-style left-aligned message block
const MessageBlock = ({ msg }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: `0.5px solid ${T.border}`, background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div style={{ flex: 1, paddingTop: '4px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: T.ink, lineHeight: 1.65, fontFamily: T.sans }}>{msg.content}</p>
          {msg.attachment && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 10px', borderRadius: '6px', background: T.surface2, border: `0.5px solid ${T.border}`, fontSize: '12px', color: T.muted }}>
              <FileText size={12} style={{ color: '#e53e3e' }} />{msg.attachment}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', fontFamily: T.sans }}>J</span>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
        {msg.steps?.length > 0 && (
          <ThinkingTrace steps={msg.steps} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} isDone={true} />
        )}
        <div style={{ fontSize: '14px', color: T.ink2, lineHeight: 1.8, fontFamily: T.sans }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({ node, ...props }) => <h1 style={{ fontFamily: T.serif, fontSize: '20px', fontWeight: 600, color: T.ink, margin: '0 0 1rem', lineHeight: 1.3 }} {...props} />,
            h2: ({ node, ...props }) => <h2 style={{ fontSize: '16px', fontWeight: 600, color: T.ink, margin: '1.5rem 0 0.75rem' }} {...props} />,
            h3: ({ node, ...props }) => <h3 style={{ fontSize: '14px', fontWeight: 600, color: T.ink, margin: '1.25rem 0 0.5rem' }} {...props} />,
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
              <Bookmark size={10} /> Sources
            </p>
            {msg.citations.map((cite, ci) => (
              <div key={ci} style={{ padding: '10px 12px', background: T.surface, border: `0.5px solid ${T.border}`, borderRadius: '6px', marginBottom: '6px' }}>
                <p style={{ fontSize: '10px', fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cite.filename}</p>
                <p style={{ fontSize: '12px', color: T.muted, fontStyle: 'italic', lineHeight: 1.6, fontFamily: T.serif, margin: 0 }}>"…{cite.snippet}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared textarea input card — used both on home and in conversation
const InputCard = ({ value, onChange, onSend, onScopeClick, isLoading, scopeLabel, compact = false }) => (
  <div style={{ background: T.cream, border: `0.5px solid ${T.border}`, borderRadius: '14px', overflow: 'hidden' }}>
    {!compact && (
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px 0', fontFamily: T.sans }}>
        <button onClick={onScopeClick} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: '13px', padding: 0 }}>
          {scopeLabel || 'Client matter'} <ChevronDown size={12} />
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, fontFamily: T.sans, fontSize: '13px', padding: 0 }}>
          Prompts <ChevronDown size={12} />
        </button>
      </div>
    )}
    <textarea
      value={value}
      onChange={onChange}
      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
      placeholder="Ask Jabari anything. Type @ to add sources."
      rows={compact ? 2 : 3}
      style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', fontSize: '14px', color: T.ink, fontFamily: T.sans, outline: 'none', lineHeight: 1.65, padding: '12px 16px', boxSizing: 'border-box' }}
    />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderTop: `0.5px solid ${T.border2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button onClick={onScopeClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px 5px 0', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: '13px' }}>
          <Paperclip size={14} /> Files
        </button>
        <button onClick={onScopeClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontFamily: T.sans, fontSize: '13px' }}>
          <Database size={14} /> Sources
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <button style={{ padding: '5px 7px', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, display: 'flex' }}><Settings2 size={14} /></button>
        <div style={{ width: '0.5px', height: '14px', background: T.border, margin: '0 2px' }} />
        <button style={{ padding: '5px 7px', background: 'none', border: 'none', cursor: 'pointer', color: T.faint, display: 'flex' }}><Mic size={14} /></button>
        {value.trim() && (
          <button onClick={onSend} disabled={isLoading} style={{ marginLeft: '6px', width: '32px', height: '32px', borderRadius: '8px', background: T.ink, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? <Loader2 size={13} style={{ color: '#fff', animation: 'jabari-spin 1s linear infinite' }} /> : <Send size={13} style={{ color: '#fff' }} />}
          </button>
        )}
      </div>
    </div>
  </div>
);

const ChatInterface = ({ documentId, tenderId, tenderName, initialSources = [], initialQuestion = '', onInitialQuestionConsumed }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState(initialSources);
  const [tenders, setTenders] = useState([]);
  const [groundedDocId, setGroundedDocId] = useState(documentId);
  const [groundedTenderId, setGroundedTenderId] = useState(tenderId);
  const [showScopeSelector, setShowScopeSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSteps, setLiveSteps] = useState([]);
  const [liveCollapsed, setLiveCollapsed] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [viewingConversationId, setViewingConversationId] = useState(null);
  const [viewingConversationTitle, setViewingConversationTitle] = useState('');
  const scrollRef = useRef(null);

  const isHome = messages.length === 0 && !isLoading && !viewingConversationId;

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    if (sources.length === 0) axios.get(`${base}/sources`).then(r => setSources(r.data.map(d => ({ ...d, name: d.file_name })))).catch(() => { });
    if (tenders.length === 0) axios.get(`${base}/tenders`).then(r => setTenders(r.data)).catch(() => { });
    try { setRecentChats(JSON.parse(localStorage.getItem('jabari_recent_chats') || '[]')); } catch { }
  }, []);

  useEffect(() => { setGroundedDocId(documentId); }, [documentId]);
  useEffect(() => { setGroundedTenderId(tenderId); }, [tenderId]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, liveSteps]);
  useEffect(() => {
    if (initialQuestion && !isLoading) {
      if (onInitialQuestionConsumed) onInitialQuestionConsumed();
      handleSendWith(initialQuestion);
    }
  }, [initialQuestion]);
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') setShowScopeSelector(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name;
  const displayTenderName = tenders.find(t => t.id === groundedTenderId)?.name || tenderName;
  const filteredSources = sources.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTenders = tenders.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const saveRecent = (question, msgHistory) => {
    try {
      // Read fresh from localStorage to avoid stale closure
      const stored = JSON.parse(localStorage.getItem('jabari_recent_chats') || '[]');
      const id = Date.now();
      const entry = {
        id,
        title: question.length > 60 ? question.slice(0, 57) + '\u2026' : question,
        date: 'Today',
        fullQuestion: question,
        messages: msgHistory,
      };
      const updated = [entry, ...stored.slice(0, 8)];
      setRecentChats(updated);
      localStorage.setItem('jabari_recent_chats', JSON.stringify(updated));
    } catch { }
  };

  const loadConversation = (chatId) => {
    try {
      // Read fresh from localStorage — state may be stale on first load
      const stored = JSON.parse(localStorage.getItem('jabari_recent_chats') || '[]');
      const chat = stored.find(c => c.id === chatId);
      if (chat?.messages?.length > 0) {
        setMessages(chat.messages);
        setViewingConversationId(chatId);
        setViewingConversationTitle(chat.fullQuestion || chat.title);
        setInput('');
        setLiveSteps([]);
      } else if (chat) {
        // Older entry saved before messages were stored — re-run the question
        handleSendWith(chat.fullQuestion || chat.title);
      }
    } catch { }
  };

  const backToHome = () => {
    setMessages([]);
    setViewingConversationId(null);
    setViewingConversationTitle('');
    setInput('');
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const q = input.trim();
    setInput('');
    await handleSendWith(q);
  };

  const handleSendWith = async (question) => {
    if (!question || isLoading) return;
    // Clear viewing state when asking a new question
    setViewingConversationId(null);
    setViewingConversationTitle('');
    setMessages(prev => [...prev, { role: 'user', content: question, attachment: activeDocName }]);
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
      addStep({ type: 'terms', title: 'Checking for key terms in attached file', chips: terms, status: 'done' });
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
      const aiMsg = { role: 'assistant', content: response.data.answer, citations: response.data.citations, steps: finalSteps };
      setMessages(prev => {
        const next = [...prev, aiMsg];
        saveRecent(question, next);
        return next;
      });
    } catch {
      updateLast({ status: 'done' });
      const errMsg = { role: 'assistant', content: 'Connection error — please try again.', steps: [...steps] };
      setMessages(prev => {
        const next = [...prev, errMsg];
        saveRecent(question, next);
        return next;
      });
    } finally {
      setLiveSteps([]);
      setIsLoading(false);
    }
  };

  const pickerBtn = (active) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', borderRadius: '6px', border: `0.5px solid ${active ? T.ink : T.border}`,
    background: active ? T.ink : 'transparent', color: active ? '#fff' : T.ink,
    cursor: 'pointer', textAlign: 'left', marginBottom: '4px', fontFamily: T.sans,
  });

  const scopeLabel = activeDocName || displayTenderName || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: T.sans, position: 'relative', overflow: 'hidden' }}>

      {/* Scope selector modal */}
      {showScopeSelector && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div onClick={() => setShowScopeSelector(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(245,242,237,0.8)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', zIndex: 50, width: '100%', maxWidth: '480px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px', boxShadow: '0 8px 40px rgba(26,26,26,0.12)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Search size={14} style={{ color: T.muted }} />
              <input autoFocus type="text" placeholder="Search documents…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: T.ink, outline: 'none', fontFamily: T.sans }} />
              <button onClick={() => setShowScopeSelector(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}><X size={14} /></button>
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '340px', padding: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '0 4px 8px', margin: 0 }}>Scope</p>
              <button style={pickerBtn(!groundedDocId && !groundedTenderId)} onClick={() => { setGroundedDocId(null); setGroundedTenderId(null); setShowScopeSelector(false); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Database size={14} /><span style={{ fontSize: '13px' }}>Universal Vault</span></div>
                {!groundedDocId && !groundedTenderId && <Check size={13} />}
              </button>
              {filteredTenders.length > 0 && (
                <>
                  <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '10px 4px 6px', margin: 0 }}>Projects</p>
                  {filteredTenders.map(t => (
                    <button key={t.id} style={pickerBtn(!groundedDocId && groundedTenderId === t.id)} onClick={() => { setGroundedTenderId(t.id); setGroundedDocId(null); setShowScopeSelector(false); }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <Database size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                      </div>
                      {!groundedDocId && groundedTenderId === t.id && <Check size={13} />}
                    </button>
                  ))}
                </>
              )}
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '10px 4px 6px', margin: 0 }}>Documents</p>
              {filteredSources.map(doc => (
                <button key={doc.id} style={pickerBtn(groundedDocId === doc.id)} onClick={() => { setGroundedDocId(doc.id); setShowScopeSelector(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <FileText size={14} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</span>
                  </div>
                  {groundedDocId === doc.id && <Check size={13} />}
                </button>
              ))}
            </div>
            <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${T.border}` }}>
              <span style={{ fontSize: '10px', color: T.faint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Esc to close</span>
            </div>
          </div>
        </div>
      )}

      {/* ── HOME SCREEN ── */}
      {isHome && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '4rem 2rem 3rem' }}>
          <div style={{ width: '100%', maxWidth: '680px' }}>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '3rem' }}>
              <button onClick={() => { }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', fontSize: '13px', color: T.ink2, cursor: 'pointer', fontFamily: T.sans }}>
                <PenTool size={13} style={{ color: T.muted }} /> Draft document
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '20px', fontSize: '13px', color: T.ink2, cursor: 'pointer', fontFamily: T.sans }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                Review table
              </button>
            </div>

            {/* Big input card */}
            <InputCard
              value={input}
              onChange={e => setInput(e.target.value)}
              onSend={handleSend}
              onScopeClick={() => setShowScopeSelector(true)}
              isLoading={isLoading}
              scopeLabel={scopeLabel}
            />

            {/* Source scope chips */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
              {[
                { key: 'vault', label: 'Vault', icon: <Database size={12} />, active: !groundedDocId && !groundedTenderId, onClick: () => { setGroundedDocId(null); setGroundedTenderId(null); } },
                { key: 'ocds', label: 'OCDS Portal', icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />, active: false, onClick: () => { } },
                { key: 'kb', label: 'Knowledge Base', icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />, active: false, onClick: () => { } },
              ].map(s => (
                <button key={s.key} onClick={s.onClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: `0.5px solid ${s.active ? T.ink : T.border}`, background: s.active ? T.ink : '#fff', color: s.active ? '#fff' : T.muted, cursor: 'pointer', fontSize: '12px', fontFamily: T.sans }}>
                  {s.icon} {s.label} <Plus size={10} style={{ marginLeft: '2px', opacity: 0.5 }} />
                </button>
              ))}
            </div>

            {/* Recent */}
            {recentChats.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: T.muted, marginBottom: '12px', fontFamily: T.sans }}>Recent</p>
                <div>
                  {recentChats.map((chat, i) => (
                    <div key={chat.id} onClick={() => loadConversation(chat.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 6px', borderTop: `0.5px solid ${T.border}`, cursor: 'pointer', borderRadius: '4px', transition: 'background 0.1s' }}
                      onMouseOver={e => e.currentTarget.style.background = T.surface}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: T.surface2, border: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
                        </div>
                        <span style={{ fontSize: '13px', color: i === 0 ? T.ink : T.muted, fontWeight: i === 0 ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: T.faint, flexShrink: 0, marginLeft: '16px' }}>{chat.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONVERSATION VIEW ── */}
      {!isHome && (
        <>
          {/* Conversation header with back button */}
          {viewingConversationId && (
            <div style={{ height: '54px', borderBottom: `0.5px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 2rem', background: '#fff' }}>
              <button onClick={backToHome} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '13px', fontFamily: T.sans }}>
                <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <div style={{ flex: 1, marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '13px', color: T.muted }}>Reviewing</span>
                <span style={{ fontSize: '13px', color: T.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{viewingConversationTitle}</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '3rem 3.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
            {messages.map((msg, idx) => <MessageBlock key={idx} msg={msg} />)}
            {isLoading && liveSteps.length > 0 && (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>J</span>
                </div>
                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <ThinkingTrace steps={liveSteps} collapsed={liveCollapsed} onToggle={() => setLiveCollapsed(c => !c)} isDone={false} />
                </div>
              </div>
            )}
          </div>

          {/* Compact bottom input */}
          <div style={{ padding: '1rem 2rem 1.5rem', borderTop: `0.5px solid ${T.border}`, background: '#fff' }}>
            {scopeLabel && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '20px', background: T.ink, color: '#fff', fontSize: '11px', marginBottom: '8px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                {scopeLabel}
                <button onClick={() => { setGroundedDocId(null); setGroundedTenderId(null); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.6, display: 'flex' }}><X size={10} /></button>
              </div>
            )}
            <InputCard
              value={input}
              onChange={e => setInput(e.target.value)}
              onSend={handleSend}
              onScopeClick={() => setShowScopeSelector(true)}
              isLoading={isLoading}
              scopeLabel={scopeLabel}
              compact
            />
          </div>
        </>
      )}

      <style>{`@keyframes jabari-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.08);border-radius:10px}`}</style>
    </div>
  );
};

export default ChatInterface;
