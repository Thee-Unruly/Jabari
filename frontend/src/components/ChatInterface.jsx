import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Bookmark, Paperclip, ChevronUp, Check, Database, X, Search, FileText, Command as CommandIcon } from 'lucide-react';

const ChatInterface = ({ documentId, initialSources = [] }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural Vault syncronized. Engage the Command Palette (Clip Icon) to ground your analysis.' }
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
        .catch(err => console.error("Source Fetch Error", err));
    }
  }, []);

  const activeDocName = sources.find(d => d.id === groundedDocId)?.name;
  const filteredSources = sources.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
      setMessages(prev => [...prev, { role: 'assistant', content: "Neural sync error. Verify Port 8500." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-jabari-bg relative overflow-hidden">
      
      {/* 🏛️ NEURAL COMMAND PALETTE (MODAL OVERLAY) */}
      {showDocSelector && (
         <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 lg:p-20 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-jabari-bg/80 backdrop-blur-md" onClick={() => setShowDocSelector(false)} />
            
            <div className="w-full max-w-2xl bg-jabari-surface border border-jabari-border shadow-[0_30px_100px_rgba(0,0,0,0.9)] flex flex-col rounded-sm animate-in zoom-in-95 duration-300 overflow-hidden">
               <div className="p-6 border-b border-jabari-border flex items-center gap-4">
                  <Search className="w-5 h-5 text-jabari-dim" />
                  <input 
                     autoFocus
                     type="text" 
                     placeholder="Search Vaulted Intelligence..." 
                     className="bg-transparent border-none text-xl font-serif text-jabari-nearWhite focus:outline-none w-full italic"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <X className="w-5 h-5 text-jabari-dim cursor-pointer hover:text-jabari-cream" onClick={() => setShowDocSelector(false)} />
               </div>

               <div className="flex-1 overflow-y-auto max-h-[400px] p-2 custom-scrollbar">
                  <div className="px-4 py-3 text-[9px] font-black tracking-widest text-jabari-dim uppercase opacity-50">Global Scopes</div>
                  <button 
                     onClick={() => { setGroundedDocId(null); setShowDocSelector(false); }}
                     className={`w-full flex items-center justify-between p-4 rounded-sm text-left transition-all mb-1 ${!groundedDocId ? 'bg-jabari-surface2 border border-jabari-gray/20 shadow-lg' : 'hover:bg-jabari-surface2/50 border border-transparent'}`}
                  >
                     <div className="flex items-center gap-4">
                        <Database className="w-4 h-4 text-jabari-cream" />
                        <span className="text-[11px] font-black tracking-[0.1em] uppercase">UNIVERSAL_VAULT_ANALYSIS</span>
                     </div>
                     {!groundedDocId && <Check className="w-4 h-4 text-jabari-cream" />}
                  </button>

                  <div className="px-4 py-3 text-[9px] font-black tracking-widest text-jabari-dim uppercase opacity-50 mt-4">Vaulted Sources</div>
                  {filteredSources.map(doc => (
                     <button 
                        key={doc.id}
                        onClick={() => { setGroundedDocId(doc.id); setShowDocSelector(false); }}
                        className={`w-full flex items-center justify-between p-4 rounded-sm text-left transition-all mb-1 ${groundedDocId === doc.id ? 'bg-jabari-surface2 border border-jabari-gray/20 shadow-lg' : 'hover:bg-jabari-surface2/50 border border-transparent'}`}
                     >
                        <div className="flex items-center gap-4">
                           <FileText className={`w-4 h-4 ${groundedDocId === doc.id ? 'text-jabari-cream' : 'text-jabari-dim'}`} />
                           <span className="text-xs text-jabari-nearWhite font-light">{doc.name}</span>
                        </div>
                        {groundedDocId === doc.id && <Check className="w-4 h-4 text-jabari-cream" />}
                     </button>
                   ))}
               </div>
               <div className="p-4 bg-jabari-bg/50 border-t border-jabari-border flex items-center justify-between text-[8px] font-black tracking-[0.2em] text-jabari-dim uppercase">
                  <span>ESC to Close</span>
                  <span className="flex items-center gap-2"><CommandIcon className="w-2.5 h-2.5" /> + Selection</span>
               </div>
            </div>
         </div>
      )}

      {/* 💬 CHAT FEED */}
      <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in duration-1000'}`}>
            <div className={`flex items-center gap-2 mb-3 opacity-30 uppercase text-[9px] font-black tracking-[0.2em]`}>
               {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
               <span>{msg.role}</span>
            </div>
            <div className={`
              max-w-[85%] p-7 rounded-sm font-light leading-loose text-[15px]
              ${msg.role === 'user' ? 'bg-jabari-surface2 text-jabari-nearWhite border border-jabari-border shadow-xl' : 'text-jabari-gray border-l-2 border-jabari-cream/40 bg-jabari-surface/10'}
            `}>
              {msg.content}
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-10 pt-8 border-t border-jabari-border/20 space-y-4">
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] text-jabari-dim flex items-center gap-2">
                      <Bookmark className="w-2.5 h-2.5" /> GROUNDED EVIDENCE
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {msg.citations.map((cite, cidx) => (
                        <div key={cidx} className="p-4 bg-jabari-bg/50 border border-jabari-border/10 rounded-sm hover:border-jabari-cream/30 transition-all cursor-default">
                           <div className="text-[10px] font-bold text-jabari-cream mb-2 uppercase tracking-[0.1em]">{cite.filename}</div>
                           <div className="text-[12px] text-jabari-gray/70 italic leading-relaxed">
                              "...{cite.snippet}"
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-4 text-jabari-dim p-6">
             <Loader2 className="w-5 h-5 animate-spin text-jabari-cream" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Neural Synthesis in Progress...</span>
          </div>
        )}
      </div>

      {/* 🚀 INTEGRATED COMMAND BAR */}
      <div className="p-8 bg-jabari-bg border-t border-jabari-border relative">
        <div className="max-w-4xl mx-auto relative group">
          
          {/* Grounding Status */}
          {activeDocName && (
             <div className="absolute -top-12 left-0 flex items-center gap-3 px-4 py-2 bg-jabari-surface border border-jabari-border rounded-sm animate-in slide-in-from-bottom-2 shadow-2xl">
                <div className="w-1.5 h-1.5 rounded-full bg-jabari-cream animate-pulse" />
                <span className="text-[9px] font-black text-jabari-nearWhite uppercase tracking-widest">GROUNDED: {activeDocName}</span>
                <button onClick={() => setGroundedDocId(null)} className="ml-2 hover:text-jabari-cream transition-all">
                   <X className="w-3 h-3" />
                </button>
             </div>
          )}

          <div className="flex items-stretch bg-jabari-surface border border-jabari-border rounded-sm shadow-2xl focus-within:border-jabari-cream/50 transition-all overflow-hidden">
            <button 
              onClick={() => setShowDocSelector(true)}
              className={`p-6 border-r border-jabari-border hover:bg-jabari-surface2 transition-all group ${groundedDocId ? 'text-jabari-cream' : 'text-jabari-dim'}`}
              title="Open Neural Palette"
            >
              <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={groundedDocId ? "Instruction grounded in document context..." : "Universal vault query..."}
              className="flex-1 bg-transparent p-6 text-base text-jabari-nearWhite placeholder:text-jabari-dim/50 focus:outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-8 text-jabari-dim hover:text-jabari-cream disabled:opacity-20 transition-all flex items-center gap-3 bg-jabari-surface2 border-l border-jabari-border group"
            >
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">Process</span>
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
