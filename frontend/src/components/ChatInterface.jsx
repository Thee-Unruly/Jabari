import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2, Bookmark } from 'lucide-react';

const ChatInterface = ({ documentId }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Neural Vault syncronized. How can I assist your analysis today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

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
        document_id: documentId
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.answer,
        citations: response.data.citations 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I encountered a neural disconnect. Ensure the backend is running on Port 8500." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-jabari-bg">
      <div className="p-6 border-b border-jabari-border flex items-center justify-between">
         <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-jabari-cream" />
            <span className="text-[10px] font-black uppercase tracking-widest text-jabari-gray">NEURAL_ASSISTANT ACTIVE</span>
         </div>
         <span className="text-[10px] font-black text-jabari-dim uppercase tracking-[0.2em] animate-pulse">Ready</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 mb-3 opacity-30 uppercase text-[9px] font-black tracking-widest`}>
               {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
               <span>{msg.role}</span>
            </div>
            <div className={`
              max-w-[85%] p-5 rounded-sm font-light leading-relaxed text-sm
              ${msg.role === 'user' ? 'bg-jabari-surface2 text-jabari-nearWhite border border-jabari-border' : 'text-jabari-gray border-l-2 border-jabari-cream bg-jabari-surface/30'}
            `}>
              {msg.content}
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-jabari-border/30 space-y-2">
                   <div className="text-[8px] font-black uppercase tracking-widest text-jabari-dim flex items-center gap-2">
                      <Bookmark className="w-2 h-2" /> GROUNDED CITATIONS
                   </div>
                   {msg.citations.map((cite, cidx) => (
                     <div key={cidx} className="text-[10px] text-jabari-cream/60 italic leading-snug">
                        Ref: {cite.filename} — "...{cite.snippet}"
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-jabari-dim p-4">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-widest">Synthesizing Response...</span>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-jabari-border">
        <div className="relative">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query the Intelligent Vault..."
            className="w-full bg-jabari-surface border border-jabari-border p-4 pr-12 text-sm text-jabari-nearWhite placeholder:text-jabari-dim focus:outline-none focus:border-jabari-cream transition-all rounded-sm"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-jabari-dim hover:text-jabari-cream disabled:opacity-30 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
