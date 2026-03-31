import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Library, Plus, FileText, ChevronLeft, 
  Settings, User, Info, PanelLeftClose, 
  PanelLeftOpen, ExternalLink, Search
} from 'lucide-react';
import DropZone from './components/DropZone';
import AnalysisSidebar from './components/AnalysisSidebar';

const App = () => {
  const [sources, setSources] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch initial Vault Repository from Postgres
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/sources');
        // Map backend file_name to display name
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
    if (iframe && activeDoc?.metadata?.path) {
      const fileName = activeDoc.file_name;
      iframe.src = `http://127.0.0.1:8000/files/${fileName}#page=${pageNum}`;
    }
  };

  return (
    <div className="flex h-screen bg-jabari-bg text-jabari-nearWhite overflow-hidden selection:bg-jabari-cream selection:text-jabari-ink">
      {/* 1. Left Sidebar: Document Vault (Monochromatic Desk Style) */}
      <aside 
        className={`
          bg-jabari-surface border-r border-jabari-border transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}
        `}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-sm bg-jabari-cream flex items-center justify-center">
                <span className="font-serif font-black text-jabari-ink text-lg italic">J</span>
             </div>
             <div>
                <h1 className="font-black tracking-tighter text-2xl leading-none">JABARI</h1>
                <span className="text-[9px] font-black tracking-widest text-jabari-dim uppercase">SECURE VAULT</span>
             </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] uppercase tracking-widest text-jabari-dim font-black mb-6 px-1">VAULT REPOSITORY</div>
          {sources.length === 0 ? (
            <div className="p-6 border border-jabari-border border-dashed rounded-lg text-center">
              <p className="text-[10px] text-jabari-dim font-bold uppercase tracking-widest leading-relaxed">No vaulted sources currently identified.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-sm transition-all duration-300 group text-left border
                    ${activeDoc?.id === doc.id ? 'bg-jabari-surface2 border-jabari-gray/20' : 'bg-transparent border-transparent hover:bg-jabari-surface2/40 hover:border-jabari-border'}
                  `}
                >
                  <FileText className={`w-5 h-5 ${activeDoc?.id === doc.id ? 'text-jabari-cream' : 'text-jabari-dim group-hover:text-jabari-gray'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate font-bold ${activeDoc?.id === doc.id ? 'text-jabari-white' : 'text-jabari-gray'}`}>
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 opacity-50 uppercase text-[8px] font-black tracking-widest">
                       <span>{doc.category || 'RFP'}</span>
                       <div className="w-1 h-1 rounded-full bg-jabari-gray/40" />
                       <span className={doc.analysis?.status === 'Verified' ? 'text-jabari-white' : 'text-jabari-gray'}>
                         {doc.analysis?.status || 'PENDING'}
                       </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-jabari-border">
           <button 
             onClick={() => setActiveDoc(null)}
             className="w-full py-4 rounded-sm bg-jabari-cream text-jabari-ink font-black text-[11px] uppercase tracking-widest hover:bg-jabari-white transition-all flex items-center justify-center gap-2"
           >
             <Plus className="w-4 h-4" /> RE-INITIALIZE VAULT
           </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative bg-jabari-bg">
        {/* Monochromatic Top Bar */}
        <header className="h-20 border-b border-jabari-border flex items-center justify-between px-10 bg-jabari-bg z-10">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-jabari-surface2 rounded text-jabari-dim transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            {activeDoc && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-jabari-dim">SOURCE IDENTITY</span>
                <span className="font-serif font-light text-xl tracking-tight text-jabari-white italic">{activeDoc.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-6">
             <div className="px-4 py-2 bg-jabari-surface border border-jabari-border text-[9px] font-black text-jabari-gray uppercase tracking-widest">
               PHASE 1: SECURE VAULT ACCESS
             </div>
             <div className="w-10 h-10 rounded-sm bg-jabari-surface border border-jabari-border flex items-center justify-center hover:bg-jabari-surface2 transition-all cursor-pointer group">
               <User className="w-5 h-5 text-jabari-dim group-hover:text-jabari-gray" />
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
                   <p className="text-jabari-gray text-lg leading-relaxed max-w-xl mx-auto font-light">
                     Streamline large-scale tender organization, review, and analysis with an AI-powered secure vault.
                   </p>
                 </div>
                 <DropZone onUploadSuccess={handleUploadSuccess} />
               </div>
            </div>
          ) : (
            <div className="flex h-full animate-in fade-in duration-700">
              {/* Left Viewer Partition: Stark Content Rendering */}
              <div className="flex-1 bg-jabari-bg flex flex-col">
                <div className="flex items-center justify-between border-b border-jabari-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Library className="w-4 h-4 text-jabari-dim" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-jabari-gray">INTERNAL KNOWLEDGE_BASE CONTENT</span>
                  </div>
                  <a 
                    href={`http://127.0.0.1:8000/files/${activeDoc.file_name}`} 
                    target="_blank" 
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-jabari-dim hover:text-jabari-cream transition-colors"
                  >
                    RAW SOURCE <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex-1 p-6">
                   <div className="w-full h-full rounded-sm overflow-hidden border border-jabari-border relative bg-jabari-surface">
                      {activeDoc.category === 'pdf' ? (
                        <iframe 
                           id="pdf-viewer"
                           src={`http://127.0.0.1:8000/files/${activeDoc.file_name}#toolbar=0&navpanes=0`} 
                           className="w-full h-full border-none invert brightness-[0.7] contrast-[1.2] grayscale"
                           title="Ingestion Content"
                        />
                      ) : (
                        <div className="p-16 overflow-y-auto max-h-full font-serif leading-relaxed text-jabari-nearWhite/90 whitespace-pre-wrap selection:bg-jabari-cream selection:text-jabari-ink">
                           {activeDoc.full_content}
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Right Analysis Partition: Monochromatic Study Guide */}
              <div className="w-[480px] border-l border-jabari-border bg-jabari-surface">
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
