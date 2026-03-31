import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Send, Bot, User, Loader2, Bookmark,
  Paperclip, Check, Database, X, Search,
  FileText, Command as CommandIcon
} from 'lucide-react';

/* ─── Jabari cream tokens ───────────────────────────────────── */
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

const ChatInterface = ({ documentId, tenderId, tenderName, initialSources = [] }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Vault synchronised. Use the clip icon to ground your analysis to a specific document.' }
  ]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState(initialSources);
  const [groundedDocId, setGroundedDocId] = useState(documentId);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (sources.length === 0) {
      axios.get('http://127.0.0.1:8500/sources')
        .then(res => setSources(res.data.map(d => ({ ...d, name: d.file_name }))))
        .catch(err => console.error('Source Fetch Error', err));
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowDocSelector(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name;
  const filteredSources = sources.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8500/chat', {
        message: input,
        document_id: groundedDocId,
        tender_id: tenderId,
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.answer,
        citations: response.data.citations,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sync error — verify connection on port 8500.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ── shared doc-picker button ── */
  const pickerBtn = (active) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: '6px',
    border: `0.5px solid ${active ? T.ink : T.border}`,
    background: active ? T.ink : 'transparent',
    color: active ? T.cream : T.ink,
    cursor: 'pointer',
    textAlign: 'left',
    marginBottom: '6px',
    transition: 'all 0.15s',
    fontFamily: T.sans,
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: T.cream,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: T.sans,
    }}>

      {/* ── DOC SELECTOR MODAL ── */}
      {showDocSelector && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setShowDocSelector(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(245,242,237,0.75)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal card */}
          <div style={{
            position: 'relative',
            zIndex: 50,
            width: '100%',
            maxWidth: '560px',
            background: T.cream,
            border: `0.5px solid ${T.border}`,
            borderRadius: '10px',
            boxShadow: '0 8px 40px rgba(26,26,26,0.14)',
            overflow: 'hidden',
          }}>
            {/* Search bar */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: `0.5px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Search style={{ width: '16px', height: '16px', color: T.muted, flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search vaulted documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: T.ink,
                  outline: 'none',
                }}
              />
              <button
                onClick={() => setShowDocSelector(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex' }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', maxHeight: '380px', padding: '1rem' }}>
              {/* Scope label */}
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '0 4px 8px', margin: 0 }}>
                Neural Scopes
              </p>

              {/* Universal vault */}
              <button
                style={pickerBtn(!groundedDocId)}
                onClick={() => { setGroundedDocId(null); setShowDocSelector(false); }}
                onMouseOver={e => { if (groundedDocId) e.currentTarget.style.background = T.surface2; }}
                onMouseOut={e => { if (groundedDocId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database style={{ width: '15px', height: '15px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Universal Vault Analysis
                  </span>
                </div>
                {!groundedDocId && <Check style={{ width: '14px', height: '14px' }} />}
              </button>

              {/* Sources label */}
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, padding: '12px 4px 8px', margin: 0 }}>
                Vaulted Sources
              </p>

              {filteredSources.map(doc => (
                <button
                  key={doc.id}
                  style={pickerBtn(groundedDocId === doc.id)}
                  onClick={() => { setGroundedDocId(doc.id); setShowDocSelector(false); }}
                  onMouseOver={e => { if (groundedDocId !== doc.id) e.currentTarget.style.background = T.surface2; }}
                  onMouseOut={e => { if (groundedDocId !== doc.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <FileText style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {doc.name}
                    </span>
                  </div>
                  {groundedDocId === doc.id && <Check style={{ width: '14px', height: '14px', flexShrink: 0 }} />}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 16px',
              borderTop: `0.5px solid ${T.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.faint }}>Esc to close</span>
              <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.faint, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CommandIcon style={{ width: '10px', height: '10px' }} /> + Selection
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT FEED ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {/* Role label */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '6px',
              opacity: 0.45,
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: T.muted,
            }}>
              {msg.role === 'assistant'
                ? <Bot style={{ width: '11px', height: '11px' }} />
                : <User style={{ width: '11px', height: '11px' }} />}
              <span>{msg.role === 'assistant' ? 'Jabari' : 'You'}</span>
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '82%',
              padding: '14px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: 1.75,
              fontWeight: 400,
              ...(msg.role === 'user' ? {
                background: T.surface2,
                border: `0.5px solid ${T.border}`,
                color: T.ink,
              } : {
                background: 'transparent',
                borderLeft: `2px solid ${T.border}`,
                color: T.ink2,
                paddingLeft: '20px',
              }),
            }}>
              {msg.content}

              {/* Citations */}
              {msg.citations?.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `0.5px solid ${T.border}` }}>
                  <div style={{
                    fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: T.faint,
                    display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px',
                  }}>
                    <Bookmark style={{ width: '10px', height: '10px' }} /> Grounded Evidence
                  </div>
                  {msg.citations.map((cite, cidx) => (
                    <div key={cidx} style={{
                      padding: '10px 12px',
                      background: T.surface2,
                      border: `0.5px solid ${T.border}`,
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cite.filename}
                      </div>
                      <div style={{ fontSize: '12px', color: T.muted, fontStyle: 'italic', lineHeight: 1.6, fontFamily: T.serif }}>
                        "…{cite.snippet}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: T.muted, padding: '4px 0' }}>
            <Loader2 style={{ width: '16px', height: '16px', animation: 'jabari-spin 1s linear infinite', color: T.ink }} />
            <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Synthesising…
            </span>
          </div>
        )}
      </div>

      {/* ── COMMAND BAR ── */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: `0.5px solid ${T.border}`,
        background: T.cream,
      }}>
        {/* Grounding pill */}
        {(activeDocName || tenderName) && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '24px',
            background: T.ink,
            color: T.cream,
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '10px',
            maxWidth: '100%',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: T.cream, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeDocName || tenderName}
            </span>
            {activeDocName && (
              <button
                onClick={() => setGroundedDocId(null)}
                style={{ background: 'none', border: 'none', color: T.cream, cursor: 'pointer', display: 'flex', padding: '0', flexShrink: 0, opacity: 0.7 }}
              >
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            )}
          </div>
        )}

        {/* Input row */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          border: `0.5px solid ${T.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          background: T.surface,
          transition: 'border-color 0.2s',
        }}>
          {/* Clip / doc picker */}
          <button
            onClick={() => setShowDocSelector(true)}
            title="Select document scope"
            style={{
              padding: '0 14px',
              border: 'none',
              borderRight: `0.5px solid ${T.border}`,
              background: 'transparent',
              color: groundedDocId ? T.ink : T.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Paperclip style={{ width: '16px', height: '16px' }} />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={groundedDocId ? 'Ask about this document…' : tenderId ? 'Ask about this project…' : 'Ask anything across your vault…'}
            style={{
              flex: 1,
              padding: '13px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              color: T.ink,
              outline: 'none',
              fontFamily: T.sans,
            }}
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              padding: '0 16px',
              border: 'none',
              borderLeft: `0.5px solid ${T.border}`,
              background: 'transparent',
              color: input.trim() ? T.ink : T.faint,
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.15s',
              fontFamily: T.sans,
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Send</span>
            <Send style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      <style>{`@keyframes jabari-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ChatInterface;