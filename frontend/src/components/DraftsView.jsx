import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Wand2, Download, Printer, Copy, Loader2,
  Database, AlertCircle, CheckCircle2, Check, ChevronUp
} from 'lucide-react';

const DraftsView = ({ sources = [] }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [draftType, setDraftType] = useState('technical_proposal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Custom Dropdown State & Refs
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const activeSourceName = sources.find(d => d.id === selectedDocId)?.name;

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleExportDocx = async () => {
    if (!draft?.content || !draft?.title) return;
    setIsExporting(true);
    try {
      const response = await axios.post('http://127.0.0.1:8500/export/docx', {
        title: draft.title,
        content: draft.content
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${draft.title.replace(/ /g, '_')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-jabari-bg">
      {/* 🏛️ LEFT: CONFIGURATION PANEL */}
      <aside className="w-96 border-r border-jabari-border flex flex-col p-8 gap-8 bg-jabari-surface/30 overflow-visible relative z-10">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-jabari-dim mb-4">PRODUCTION CONFIG</div>
          <h2 className="text-xl font-serif font-light text-jabari-cream italic">Drafting Parameters</h2>
        </div>

        <div className="space-y-6">
          {/* THE FIX: Dynamic Z-Index on the container. 
              When open, it jumps to z-50. When closed, it sits at z-20. 
              This ensures the absolute child floats OVER the Artifact Type section.
          */}
          <div
            className={`space-y-2 relative transition-all duration-300 ${showSourceDropdown ? 'z-50' : 'z-20'}`}
            ref={dropdownRef}
          >
            <label className="text-[8px] font-black uppercase tracking-widest text-jabari-gray">SOURCE MATERIAL</label>

            <button
              onClick={() => setShowSourceDropdown(prev => !prev)}
              className={`w-full bg-jabari-surface border p-4 text-xs text-left focus:outline-none transition-all rounded-sm flex items-center justify-between group
                ${showSourceDropdown ? 'border-jabari-cream ring-1 ring-jabari-cream/20 shadow-[0_0_20px_rgba(212,187,143,0.05)]' : 'border-jabari-border'}`}
            >
              <span className={selectedDocId ? 'text-jabari-nearWhite truncate max-w-[220px]' : 'text-jabari-dim'}>
                {activeSourceName ?? 'Select Vaulted Source...'}
              </span>
              <ChevronUp className={`w-4 h-4 transition-transform duration-300 ${showSourceDropdown ? 'rotate-0 text-jabari-cream' : 'rotate-180 text-jabari-dim'}`} />
            </button>

            {showSourceDropdown && (
              /* The "Floating" Layer: 
                 - top-[calc(100%+4px)]: Anchors it with a slight air-gap.
                 - shadow-black/90: Massive drop shadow for depth.
                 - zoom-in-95: High-end expansion effect.
              */
              <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] bg-jabari-surface2 border border-jabari-border rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {sources.length === 0 && (
                    <div className="px-4 py-4 text-[10px] text-jabari-dim uppercase tracking-widest italic text-center">No vaulted sources available</div>
                  )}
                  {sources.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setShowSourceDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-4 text-[11px] text-left transition-all hover:bg-jabari-surface border-b border-jabari-border/30 last:border-0
                          ${selectedDocId === doc.id ? 'text-jabari-cream font-bold bg-jabari-cream/5' : 'text-jabari-gray font-light'}`}
                    >
                      <span className="truncate max-w-[240px]">{doc.name}</span>
                      {selectedDocId === doc.id && <Check className="w-3 h-3 flex-shrink-0 text-jabari-cream" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ARTIFACT TYPE SECTION — Now safely stays in the background */}
          <div className="space-y-2 relative z-10">
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

        <div className="mt-auto relative z-10">
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

      {/* 🏛️ RIGHT: PRODUCTION PREVIEW */}
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
                  {copySuccess ? <CheckCircle2 className="w-4 h-4 text-jabari-cream" /> : <Copy className="w-4 h-4" />}
                  <span className="text-[8px] font-black uppercase tracking-widest">{copySuccess ? 'Copied' : 'Copy Content'}</span>
                </button>
                <button 
                  onClick={handleExportDocx}
                  disabled={isExporting}
                  className="p-2 text-jabari-dim hover:text-jabari-cream transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-jabari-cream" /> : <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
                  <span className="text-[8px] font-black uppercase tracking-widest">{isExporting ? 'Synthesizing...' : 'Export Word'}</span>
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

            <div className="mt-12 p-8 border border-jabari-border border-dashed rounded-sm flex items-center gap-4 opacity-50 mb-12">
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