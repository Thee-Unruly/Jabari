import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Bookmark, FolderOpen, ChevronDown, Check } from 'lucide-react';

const ChatInterface = ({ documentId, initialSources = [] }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural Vault syncronized. Select a document for specific grounding, or query the entire vault.' }
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

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name || "Universal Vault Analysis";

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
      {/* 🏛️ GROUNDING HEADER (Source Selector) */}
      <div className="p-4 border-b border-jabari-border flex items-center justify-between bg-jabari-surface/50">
         <div className="relative">
            <button 
               onClick={() => setShowDocSelector(!showDocSelector)}
               className="flex items-center gap-3 px-4 py-2 bg-jabari-surface border border-jabari-border hover:border-jabari-gray/40 transition-all rounded-sm group"
            >
               <FolderOpen className="w-3 h-3 text-jabari-cream" />
               <span className="text-[10px] font-black uppercase tracking-widest text-jabari-nearWhite">{activeDocName}</span>
               <ChevronDown className={`w-3 h-3 text-jabari-dim transition-transform ${showDocSelector ? 'rotate-180' : ''}`} />
            </button>

            {showDocSelector && (
               <div className="absolute top-12 left-0 w-80 bg-jabari-surface border border-jabari-border shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-[8px] font-black tracking-widest text-jabari-dim p-2 uppercase border-b border-jabari-border mb-2">NEURAL_GROUNDING SOURCE</div>
                  
                  <button 
                     onClick={() => { setGroundedDocId(null); setShowDocSelector(false); }}
                     className="w-full flex items-center justify-between p-3 hover:bg-jabari-surface2 rounded-sm text-left transition-colors mb-1"
                  >
                     <span className="text-[10px] font-bold text-jabari-gray">UNIVERSAL VAULT ANALYSIS (CROSS-DOC)</span>
                     {!groundedDocId && <Check className="w-3 h-3 text-jabari-cream" />}
                  </button>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
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
         </div>
         <div className="flex items-center gap-4 text-[9px] font-black tracking-widest text-jabari-dim">
            <div className="w-2 h-2 rounded-full bg-jabari-cream" />
            LLAMA-3 ENGINE ACTIVE
         </div>
      </div>

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
                     <div key={cidx} className="p-3 bg-jabari-bg/30 border border-jabari-border/10 rounded-sm hover:border-jabari-cream/20 transition-all cursor-default group">
                        <div className="text-[9px] font-bold text-jabari-cream mb-1">{cite.filename}</div>
                        <div className="text-[10px] text-jabari-gray italic leading-relaxed opacity-60 group-hover:opacity-100 transition-all">
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

      <div className="p-6 bg-jabari-bg border-t border-jabari-border">
        <div className="relative max-w-4xl mx-auto">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Instruct Assistant (${groundedDocId ? 'Grounded Mode' : 'Universal Mode'})...`}
            className="w-full bg-jabari-surface border border-jabari-border p-5 pr-14 text-sm text-jabari-nearWhite placeholder:text-jabari-dim focus:outline-none focus:border-jabari-cream transition-all rounded-sm shadow-2xl"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-jabari-dim hover:text-jabari-cream disabled:opacity-30 transition-all"
          >
            <Send className="w-5 h-5 text-jabari-cream" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
