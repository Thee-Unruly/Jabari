import React, { useState, useEffect } from 'react';
import { 
  Library, Plus, FileText, ChevronLeft, 
  Settings, User, Info, PanelLeftClose, 
  PanelLeftOpen, ExternalLink, Search,
  MessageCircle, BarChart3, Database, Command
} from 'lucide-react';
import axios from 'axios';
import DropZone from './components/DropZone';
import AnalysisSidebar from './components/AnalysisSidebar';
import ChatInterface from './components/ChatInterface';

const App = () => {
  const [sources, setSources] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [view, setView] = useState('vault'); // 'vault' or 'assistant'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis'); // inner tab for vault view

  // Fetch initial Vault Repository from Postgres
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8500/sources');
        const mappedSources = response.data.map(d => ({
           ...d,
           name: d.file_name
        }));
        setSources(mappedSources);
      } catch (err) {
        console.error("Vault Recall Failed:", err);
      }
    };
    fetchSources();
  }, []);

  const handleUploadSuccess = (data) => {
    const newDoc = {
      ...data,
      name: data.file_name,
    };
    setSources([newDoc, ...sources]);
    setActiveDoc(newDoc);
  };

  const jumpToPage = (pageNum) => {
    const iframe = document.getElementById('pdf-viewer');
    if (iframe && activeDoc?.file_name) {
      iframe.src = `http://127.0.0.1:8500/files/${encodeURIComponent(activeDoc.file_name)}#page=${pageNum}`;
    }
  };

  return (
    <div className="flex h-screen bg-jabari-bg text-jabari-nearWhite overflow-hidden selection:bg-jabari-cream selection:text-jabari-ink">
      
      {/* 🏛️ 1. PRIMARY NAVIGATION (STARK MONOCHROMATIC) */}
      <nav className="w-20 bg-jabari-surface border-r border-jabari-border flex flex-col items-center py-8 gap-10">
         <div className="w-10 h-10 rounded-sm bg-jabari-cream flex items-center justify-center mb-4">
            <span className="font-serif font-black text-jabari-ink text-lg italic uppercase">J</span>
         </div>
         <div className="flex flex-col gap-6 flex-1">
            <button 
               onClick={() => setView('vault')}
               className={`p-3 rounded-sm transition-all ${view === 'vault' ? 'bg-jabari-bg text-jabari-cream border border-jabari-border/30 shadow-lg shadow-black' : 'text-jabari-dim hover:text-jabari-gray'}`}
               title="Secure Vault"
            >
               <Database className="w-6 h-6" />
            </button>
            <button 
               onClick={() => setView('assistant')}
               className={`p-3 rounded-sm transition-all ${view === 'assistant' ? 'bg-jabari-bg text-jabari-cream border border-jabari-border/30 shadow-lg shadow-black' : 'text-jabari-dim hover:text-jabari-gray'}`}
               title="Neural Assistant"
            >
               <MessageCircle className="w-6 h-6" />
            </button>
            <button className="p-3 text-jabari-dim hover:text-jabari-gray" title="Settings">
               <Settings className="w-6 h-6" />
            </button>
         </div>
         <div className="flex flex-col gap-6 p-4">
            <div className="w-10 h-10 rounded-sm bg-jabari-surface2 border border-jabari-border flex items-center justify-center">
               <User className="w-5 h-5 text-jabari-dim" />
            </div>
         </div>
      </nav>

      {/* 🏛️ 2. VIEWPORT PARTITION */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* --- VIEW: VAULT (DOCUMENT MANAGEMENT) --- */}
        {view === 'vault' ? (
          <div className="flex h-full animate-in fade-in slide-in-from-left-4 duration-500">
             {/* Vault Repository Sidebar */}
             <aside className={`bg-jabari-surface/50 border-r border-jabari-border flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6">
                   <div className="text-[10px] uppercase tracking-widest text-jabari-dim font-black mb-6">VAULT REPOSITORY</div>
                   <div className="space-y-2 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
                      {sources.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setActiveDoc(doc)}
                          className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all duration-300 group text-left border ${activeDoc?.id === doc.id ? 'bg-jabari-surface2 border-jabari-gray/20' : 'bg-transparent border-transparent hover:bg-jabari-surface2/40 hover:border-jabari-border'}`}
                        >
                          <FileText className={`w-5 h-5 ${activeDoc?.id === doc.id ? 'text-jabari-cream' : 'text-jabari-dim group-hover:text-jabari-gray'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate font-bold ${activeDoc?.id === doc.id ? 'text-jabari-white' : 'text-jabari-gray'}`}>{doc.name}</p>
                            <div className="flex items-center gap-2 mt-1 opacity-50 uppercase text-[8px] font-black tracking-widest">
                               <span>{doc.category || 'PDF'}</span>
                               <div className="w-1 h-1 rounded-full bg-jabari-gray/40" />
                               <span>{doc.analysis?.status || 'VERIFIED'}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
                <div className="mt-auto p-6 border-t border-jabari-border">
                   <button 
                     onClick={() => setActiveDoc(null)}
                     className="w-full py-4 rounded-sm bg-jabari-cream text-jabari-ink font-black text-[11px] uppercase tracking-widest hover:bg-jabari-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/20"
                   >
                     <Plus className="w-4 h-4" /> RE-INITIALIZE VAULT
                   </button>
                </div>
             </aside>

             {/* Main Content: Viewer or Dropzone */}
             <main className="flex-1 flex flex-col bg-jabari-bg relative overflow-hidden">
                <header className="h-20 border-b border-jabari-border flex items-center justify-between px-10">
                   <div className="flex items-center gap-8">
                      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-jabari-dim hover:bg-jabari-surface2 rounded transition-colors">
                        {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-jabari-dim">JABARI_SYSTEM //</span>
                        <span className="font-serif font-light text-xl tracking-wide text-jabari-cream italic">Secure Vault Repository</span>
                      </div>
                   </div>
                </header>

                <div className="flex-1 overflow-hidden relative">
                   {!activeDoc ? (
                     <div className="h-full flex items-center justify-center p-12 overflow-y-auto">
                        <div className="max-w-3xl w-full">
                           <div className="text-center mb-16">
                              <h2 className="text-6xl font-serif font-light tracking-tight text-jabari-cream mb-6 italic leading-tight">Turn Days of Review <br/>Into Minutes</h2>
                              <p className="text-jabari-gray/80 text-lg leading-relaxed max-w-xl mx-auto font-light">Ground your executive intelligence in a high-security, neural-indexed vault.</p>
                           </div>
                           <DropZone onUploadSuccess={handleUploadSuccess} />
                        </div>
                     </div>
                   ) : (
                     <div className="flex h-full animate-in zoom-in duration-500">
                        {/* Stark Document Viewer Area */}
                        <div className="flex-1 flex flex-col bg-jabari-bg border-r border-jabari-border">
                           <div className="px-8 py-4 border-b border-jabari-border flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <FileText className="w-4 h-4 text-jabari-dim" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-jabari-white">{activeDoc.name}</span>
                              </div>
                              <a href={`http://127.0.0.1:8500/files/${encodeURIComponent(activeDoc.file_name)}`} target="_blank" className="text-[10px] font-black text-jabari-dim hover:text-jabari-cream transition-all uppercase tracking-widest">Raw Access</a>
                           </div>
                           <div className="flex-1 p-8">
                              <div className="w-full h-full border border-jabari-border/30 rounded-sm bg-jabari-surface overflow-hidden">
                                 {activeDoc.category === 'pdf' ? (
                                    <iframe 
                                       id="pdf-viewer"
                                       src={`http://127.0.0.1:8500/files/${encodeURIComponent(activeDoc.file_name)}#toolbar=0&navpanes=0`} 
                                       className="w-full h-full border-none invert brightness-[0.7] grayscale contrast-[1.2]"
                                       title="Vault Material"
                                    />
                                 ) : (
                                    <div className="p-16 overflow-y-auto h-full font-serif text-jabari-nearWhite/90 leading-relaxed whitespace-pre-wrap selection:bg-jabari-cream selection:text-jabari-ink">
                                       {activeDoc.full_content}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* Analysis Partition Toggle */}
                        <div className="w-[480px] bg-jabari-bg flex flex-col">
                           <div className="h-14 border-b border-jabari-border flex bg-jabari-surface">
                              <button onClick={() => setActiveTab('analysis')} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'text-jabari-cream border-b-2 border-jabari-cream' : 'text-jabari-dim hover:text-jabari-gray'}`}>Briefing</button>
                              <button onClick={() => setActiveTab('chat')} className={`flex-1 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'text-jabari-cream border-b-2 border-jabari-cream' : 'text-jabari-dim hover:text-jabari-gray'}`}>Fast Query</button>
                           </div>
                           <div className="flex-1 overflow-hidden">
                              {activeTab === 'analysis' ? <AnalysisSidebar data={activeDoc} onJumpToPage={jumpToPage} /> : <ChatInterface documentId={activeDoc.id} />}
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </main>
          </div>
        ) : (
          /* --- VIEW: ASSISTANT (DEDICATED CONVERSATION) --- */
          <div className="flex-1 flex flex-col bg-jabari-bg animate-in slide-in-from-right-4 duration-500">
             <header className="h-20 border-b border-jabari-border flex items-center justify-between px-10">
                <div className="flex items-center gap-3">
                   <Command className="w-5 h-5 text-jabari-cream" />
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-jabari-dim leading-none">NEURAL CENTRAL //</span>
                      <h2 className="font-serif font-light text-xl tracking-wide text-jabari-cream italic leading-none mt-1">Jabari Executive Assistant</h2>
                   </div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-jabari-dim opacity-40">Phase 2 Intelligent Chat</div>
             </header>
             <div className="flex-1 max-w-5xl mx-auto w-full p-8 overflow-hidden flex flex-col">
                <div className="flex-1 rounded-sm border border-jabari-border/30 bg-jabari-surface/40 overflow-hidden shadow-2xl">
                   <ChatInterface documentId={activeDoc?.id} />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
