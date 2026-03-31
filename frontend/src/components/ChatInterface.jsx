import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Bookmark, Paperclip, ChevronUp, Check, Database, X } from 'lucide-react';

const ChatInterface = ({ documentId, initialSources = [] }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural Vault syncronized. Use the vault icon in the input box to ground the model in specific documents.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState(initialSources);
  const [groundedDocId, setGroundedDocId] = useState(documentId);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const scrollRef = useRef(null);

  // Auto-fetch sources if not provided
  useEffect(() => {
    if (sources.length === 0) {
      axios.get('http://127.0.0.1:8500/sources')
        .then(res => setSources(res.data.map(d => ({ ...d, name: d.file_name }))))
        .catch(err => console.error("Source Fetch Error", err));
    }
  }, []);

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8500/chat', {
        message: input,
        document_id: groundedDocId
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.answer,
        citations: response.data.citations 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Neural disconnect. Verify Port 8500 status." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-jabari-bg">
      {/* 💬 CHAT FEED */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in duration-700'}`}>
            <div className={`flex items-center gap-2 mb-3 opacity-30 uppercase text-[8px] font-black tracking-widest`}>
               {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
               <span>{msg.role}</span>
            </div>
            <div className={`
              max-w-[90%] p-6 rounded-sm font-light leading-relaxed text-sm shadow-sm
              ${msg.role === 'user' ? 'bg-jabari-surface2 text-jabari-nearWhite border border-jabari-border' : 'text-jabari-gray border-l border-jabari-cream/40 bg-jabari-surface/20'}
            `}>
              {msg.content}
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-jabari-border/20 space-y-3">
                   <div className="text-[8px] font-black uppercase tracking-widest text-jabari-dim flex items-center gap-2">
                      <Bookmark className="w-2 h-2" /> VERIFIED EVIDENCE SOURCES
                   </div>
                   {msg.citations.map((cite, cidx) => (
                     <div key={cidx} className="p-3 bg-jabari-bg/30 border border-jabari-border/10 rounded-sm">
                        <div className="text-[9px] font-bold text-jabari-cream mb-1">{cite.filename}</div>
                        <div className="text-[10px] text-jabari-gray italic leading-relaxed opacity-60">
                           "...{cite.snippet}"
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-jabari-dim p-4">
             <Loader2 className="w-4 h-4 animate-spin text-jabari-cream" />
             <span className="text-[9px] font-black uppercase tracking-widest animate-pulse">Consulting Neural Indexed Vault...</span>
          </div>
        )}
      </div>

      {/* 🚀 INTEGRATED COMMAND BOX */}
      <div className="p-6 bg-jabari-bg border-t border-jabari-border">
        <div className="max-w-4xl mx-auto relative">
          
          {/* Grounding Indicator Pill */}
          {activeDocName && (
             <div className="absolute -top-10 left-0 flex items-center gap-2 px-3 py-1 bg-jabari-surface border border-jabari-border rounded-sm animate-in slide-in-from-bottom-2">
                <Database className="w-2 h-2 text-jabari-cream" />
                <span className="text-[8px] font-black text-jabari-nearWhite uppercase tracking-widest">Grounded: {activeDocName}</span>
                <button onClick={() => setGroundedDocId(null)} className="ml-1 hover:text-jabari-cream transition-all">
                   <X className="w-2 h-2" />
                </button>
             </div>
          )}

          {/* Doc Selector Popover */}
          {showDocSelector && (
             <div className="absolute bottom-20 left-0 w-full max-w-sm bg-jabari-surface border border-jabari-border shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-[8px] font-black tracking-widest text-jabari-dim p-3 uppercase border-b border-jabari-border mb-2 flex items-center justify-between">
                   SELECT NEURAL SOURCE
                   <X className="w-3 h-3 cursor-pointer" onClick={() => setShowDocSelector(false)} />
                </div>
                <button 
                   onClick={() => { setGroundedDocId(null); setShowDocSelector(false); }}
                   className="w-full flex items-center justify-between p-3 hover:bg-jabari-surface2 rounded-sm text-left transition-colors mb-1"
                >
                   <span className="text-[9px] font-bold text-jabari-gray uppercase tracking-widest">UNIVERSAL_VAULT (ALL)</span>
                   {!groundedDocId && <Check className="w-3 h-3 text-jabari-cream" />}
                </button>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                   {sources.map(doc => (
                      <button 
                         key={doc.id}
                         onClick={() => { setGroundedDocId(doc.id); setShowDocSelector(false); }}
                         className="w-full flex items-center justify-between p-3 hover:bg-jabari-surface2 rounded-sm text-left transition-colors"
                      >
                         <span className="text-[10px] text-jabari-nearWhite/80 truncate pr-4">{doc.name}</span>
                         {groundedDocId === doc.id && <Check className="w-3 h-3 text-jabari-cream" />}
                      </button>
                   ))}
                </div>
             </div>
          )}

          <div className="relative group">
            <button 
              onClick={() => setShowDocSelector(!showDocSelector)}
              className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 transition-all ${groundedDocId ? 'text-jabari-cream' : 'text-jabari-dim hover:text-jabari-gray'}`}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={groundedDocId ? "Query grounded document..." : "Query the entire vault..."}
              className="w-full bg-jabari-surface border border-jabari-border p-6 pl-16 pr-16 text-sm text-jabari-nearWhite placeholder:text-jabari-dim focus:outline-none focus:border-jabari-cream transition-all rounded-sm shadow-2xl"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-jabari-dim hover:text-jabari-cream disabled:opacity-30 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group"
            >
              <span className="hidden group-hover:inline transition-all duration-500">Analyze</span>
              <Send className="w-5 h-5 text-jabari-cream" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
