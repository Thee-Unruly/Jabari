import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Wand2, Download, Printer, Copy, Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

const DraftsView = ({ sources = [] }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [draftType, setDraftType] = useState('technical_proposal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async () => {
    if (!selectedDocId) return;

    setIsGenerating(true);
    setDraft(null);

    try {
      const response = await axios.post('http://127.0.0.1:8500/draft', {
        document_id: selectedDocId,
        draft_type: draftType
      });
      setDraft(response.data);
    } catch (err) {
      console.error("Drafting Error", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!draft?.content) return;
    navigator.clipboard.writeText(draft.content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-jabari-bg">
      {/* 🏛️ LEFT: CONFIGURATION PANEL */}
      <aside className="w-96 border-r border-jabari-border flex flex-col p-8 gap-8 bg-jabari-surface/30">
        <div>
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-jabari-dim mb-4">PRODUCTION CONFIG</div>
           <h2 className="text-xl font-serif font-light text-jabari-cream italic">Drafting Parameters</h2>
        </div>

        <div className="space-y-6">
           <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-jabari-gray">SOURCE MATERIAL</label>
              <select 
                className="w-full bg-jabari-surface border border-jabari-border p-4 text-xs text-jabari-nearWhite focus:outline-none focus:border-jabari-cream transition-all rounded-sm"
                onChange={(e) => setSelectedDocId(e.target.value)}
                value={selectedDocId || ''}
              >
                <option value="">Select Vaulted Source...</option>
                {sources.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
           </div>

           <div className="space-y-2">
              <label className="text-[8px] font-black uppercase tracking-widest text-jabari-gray">ARTIFACT TYPE</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'technical_proposal', label: 'Technical Proposal' },
                  { id: 'cover_letter', label: 'Executive Cover Letter' },
                  { id: 'compliance_matrix', label: 'Compliance Matrix' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setDraftType(type.id)}
                    className={`p-4 text-[10px] font-black uppercase tracking-widest text-left border rounded-sm transition-all ${draftType === type.id ? 'bg-jabari-cream text-jabari-ink border-jabari-cream' : 'bg-transparent border-jabari-border text-jabari-dim hover:border-jabari-gray'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
           </div>
        </div>

        <div className="mt-auto">
           <button
             onClick={handleGenerate}
             disabled={!selectedDocId || isGenerating}
             className="w-full py-5 bg-jabari-nearWhite text-jabari-ink font-black text-[11px] uppercase tracking-widest hover:bg-jabari-white transition-all flex items-center justify-center gap-3 disabled:opacity-20 shadow-2xl shadow-black"
           >
             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
             SYNTHESIZE DRAFT
           </button>
        </div>
      </aside>

      {/* 🏛️ RIGHT: PRODUCTION PREVIEW (THE PAPER CANVAS) */}
      <main className="flex-1 overflow-y-auto p-12 bg-jabari-bg custom-scrollbar relative flex justify-center">
        {!draft && !isGenerating ? (
          <div className="flex flex-col items-center justify-center text-center opacity-20 mt-20">
             <FileText className="w-24 h-24 mb-6" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Canvas Ready for Synthesis</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl animate-in zoom-in-95 duration-700">
             <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-jabari-cream animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-jabari-cream">PRODUCTION PREVIEW</span>
                </div>
                <div className="flex items-center gap-4">
                   <button onClick={copyToClipboard} className="p-2 text-jabari-dim hover:text-jabari-cream transition-all flex items-center gap-2">
                      {copySuccess ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-[8px] font-black uppercase tracking-widest">{copySuccess ? 'Copied' : 'Copy'}</span>
                   </button>
                   <button className="p-2 text-jabari-dim opacity-30 cursor-not-allowed flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span className="text-[8px] font-black uppercase tracking-widest">PDF (Phase 3)</span>
                   </button>
                </div>
             </div>

             <div className="bg-jabari-surface/20 border border-jabari-border/30 p-16 min-h-[1000px] shadow-2xl relative shadow-black/40">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-jabari-cream to-transparent opacity-20" />
                
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-96 gap-4">
                     <Loader2 className="w-8 h-8 animate-spin text-jabari-cream" />
                     <p className="text-[10px] font-black uppercase tracking-widest text-jabari-dim animate-pulse">Neural Drafting Engine Engaged...</p>
                  </div>
                ) : (
                  <div className="font-serif leading-relaxed text-jabari-nearWhite/80 whitespace-pre-wrap selection:bg-jabari-cream selection:text-jabari-ink animate-in fade-in duration-1000">
                     {draft?.content}
                  </div>
                )}
             </div>
             
             <div className="mt-12 p-8 border border-jabari-border border-dashed rounded-sm flex items-center gap-4 opacity-50">
                <AlertCircle className="w-5 h-5 text-jabari-cream" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                   AI-GENERATED DRAFT. Review for technical accuracy and firm-specific formatting before submission.
                </p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DraftsView;
