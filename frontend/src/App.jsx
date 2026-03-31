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
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sansSelection">
      {/* 1. Left Sidebar: Source Gallery (NotebookLM Style) */}
      <aside 
        className={`
          glass border-r border-white/5 transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-72' : 'w-0 opacity-0 overflow-hidden'}
        `}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black text-sm">J</span>
            </div>
            <h1 className="font-black tracking-tighter text-xl">JABARI</h1>
          </div>
          <button onClick={() => setActiveDoc(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Plus className="w-4 h-4 text-white/50" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-widest text-white/20 font-black mb-4 px-2">Your Vault</div>
          {sources.length === 0 ? (
            <div className="px-2 py-4 text-xs text-white/20 italic">No sources currently in the vault.</div>
          ) : (
            <div className="space-y-1">
              {sources.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group text-left
                    ${activeDoc?.id === doc.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'}
                  `}
                >
                  <FileText className={`w-4 h-4 ${activeDoc?.id === doc.id ? 'text-blue-400' : 'text-white/20 group-hover:text-white/40'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate font-medium ${activeDoc?.id === doc.id ? 'text-blue-200' : 'text-white/50'}`}>
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-wider mt-0.5">
                      {doc.category || 'PDF'} • {doc.analysis?.status || 'Processing'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-2 text-white/30 hover:text-white/60 cursor-pointer transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Settings</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg text-white/40"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            {activeDoc && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/20">Vault</span>
                <ChevronLeft className="w-4 h-4 text-white/10" />
                <span className="font-black tracking-tight text-blue-200">{activeDoc.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
               Phase 1 Online
             </div>
             <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
               <User className="w-4 h-4 text-white/50" />
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-hidden relative">
          {!activeDoc ? (
            <div className="h-full flex items-center justify-center">
               <div className="max-w-xl w-full text-center">
                 <h2 className="text-3xl font-black tracking-tighter mb-4">Initialize Knowledge Base</h2>
                 <p className="text-white/40 mb-12 text-sm leading-relaxed px-12">
                   Upload your technical tender documents. <br/>Jabari AI will extract metadata, analyze risks, and verify compliance.
                 </p>
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
