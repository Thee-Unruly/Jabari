import React, { useState } from 'react';
import { 
  Library, Plus, FileText, ChevronLeft, 
  Settings, User, Info, PanelLeftClose, 
  PanelLeftOpen, ExternalLink
} from 'lucide-react';
import DropZone from './components/DropZone';
import AnalysisSidebar from './components/AnalysisSidebar';

const App = () => {
  const [sources, setSources] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleUploadSuccess = (data) => {
    const newDoc = {
      id: Date.now(),
      name: data.file_name,
      ...data
    };
    setSources([newDoc, ...sources]);
    setActiveDoc(newDoc);
  };

  const jumpToPage = (pageNum) => {
    // PDF Viewer iframe logic
    const iframe = document.getElementById('pdf-viewer');
    if (iframe && activeDoc?.metadata?.path) {
      const fileName = activeDoc.file_name;
      iframe.src = `http://localhost:8000/files/${fileName}#page=${pageNum}`;
    }
  };

  return (
    <div className="flex h-screen bg-jabari-bg text-jabari-cream overflow-hidden selection:bg-blue-500/30">
      {/* 1. Left Sidebar: Source Gallery (Matching Landing Page Table Style) */}
      <aside 
        className={`
          bg-jabari-card border-r border-white/5 transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}
        `}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl">
              <span className="font-black text-black text-lg">J</span>
            </div>
            <div>
              <h1 className="font-black tracking-tighter text-2xl leading-none">JABARI</h1>
              <span className="text-[9px] font-black tracking-widest text-white/20 uppercase">Intelligence Vault</span>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-widest text-[#a1a1a1] font-black mb-6 px-2 opacity-50">Document Library</div>
          {sources.length === 0 ? (
            <div className="px-2 py-8 border border-white/5 rounded-2xl bg-white/[0.02] text-center">
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest px-4">Your vault is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group text-left border
                    ${activeDoc?.id === doc.id ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-transparent border-transparent hover:bg-white/[0.02]'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeDoc?.id === doc.id ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate font-bold tracking-tight ${activeDoc?.id === doc.id ? 'text-white' : 'text-white/60'}`}>
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] font-black text-white/40 border border-white/5 uppercase">{doc.category || 'RFP'}</span>
                       <span className={`w-1.5 h-1.5 rounded-full ${doc.analysis?.status === 'Verified' ? 'bg-jabari-risk-none' : 'bg-jabari-risk-medium'}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5">
           <button 
             onClick={() => setActiveDoc(null)}
             className="w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2"
           >
             <Plus className="w-4 h-4" /> New Ingestion
           </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-jabari-bg">
        {/* Top Navbar */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-jabari-bg/80 backdrop-blur-xl z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-xl text-white/40 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            {activeDoc && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Active Source</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="font-serif font-light text-xl tracking-tight text-jabari-cream/90 italic">{activeDoc.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
             <div className="px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
               VAULT FOUNDATION ONLINE
             </div>
             <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-white/20 transition-all cursor-pointer">
               <User className="w-5 h-5 text-white/40 group-hover:text-white/70" />
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden relative">
          {!activeDoc ? (
            <div className="h-full flex items-center justify-center p-12">
               <div className="max-w-3xl w-full">
                 <div className="text-center mb-16">
                   <h2 className="text-6xl font-serif font-light tracking-tight text-jabari-cream mb-6 italic leading-tight">
                     Turn Days of Review <br/>Into Minutes
                   </h2>
                   <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto font-light">
                     Streamline large-scale tender organization, review, and analysis with Vault.
                   </p>
                 </div>
                 <DropZone onUploadSuccess={handleUploadSuccess} />
               </div>
            </div>
          ) : (
            <div className="flex h-full animate-in fade-in duration-500">
              {/* Left Viewer Partition: PDF Style Rendering */}
              <div className="flex-1 bg-black/40 border-r border-white/5 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Source Content</span>
                  </div>
                  <a 
                    href={`http://localhost:8000/files/${activeDoc.file_name}`} 
                    target="_blank" 
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                  >
                    Open Original <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden glass border border-white/10 relative shadow-2xl">
                   {activeDoc.category === 'pdf' ? (
                     <iframe 
                        id="pdf-viewer"
                        src={`http://localhost:8000/files/${activeDoc.file_name}#toolbar=0&navpanes=0`} 
                        className="w-full h-full border-none invert brightness-90 contrast-125 rounded-xl grayscale-[0.3]"
                        title="Document Viewer"
                     />
                   ) : (
                     <div className="p-12 overflow-y-auto max-h-full font-serif leading-relaxed text-blue-50/70 whitespace-pre-wrap selection:bg-blue-500/30">
                        {activeDoc.full_content}
                     </div>
                   )}
                </div>
              </div>

              {/* Right Analysis Partition: NotebookLM "Study Guide" */}
              <div className="w-[450px] bg-[#080808]">
                <AnalysisSidebar data={activeDoc} onJumpToPage={jumpToPage} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
