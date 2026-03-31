import React from 'react';
import { 
  FileText, Calendar, Hash, ShieldAlert, 
  ChevronRight, Bookmark, LayoutGrid, Quote 
} from 'lucide-react';

const InsightCard = ({ icon: Icon, title, value, status, source, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="
        p-6 mb-4 rounded-sm border border-jabari-border bg-jabari-surface2/40 
        hover:bg-jabari-surface2 hover:border-jabari-gray/30
        transition-all duration-300 group cursor-pointer
      "
    >
      <div className="flex items-center justify-between mb-3 opacity-40">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase font-bold tracking-widest leading-none">{title}</span>
        </div>
        {source && (
          <span className="text-[9px] font-black uppercase tracking-tighter">
            REF SOURCE: PARAGRAPH {source}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold tracking-wide text-jabari-nearWhite/90 font-serif leading-relaxed">
        {value || (
          <span className="text-jabari-dim italic font-normal">Extracting Information...</span>
        )}
      </p>
      {status && (
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${status === 'Verified' ? 'bg-jabari-cream' : 'bg-jabari-dim'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-jabari-gray leading-none">
            {status} CONFIDENCE
          </span>
        </div>
      )}
    </div>
  );
};

const AnalysisSidebar = ({ data, onJumpToPage }) => {
  const analysis = data?.analysis || {};
  
  return (
    <div className="h-full flex flex-col p-10 overflow-y-auto custom-scrollbar bg-jabari-surface selection:bg-jabari-cream selection:text-jabari-ink">
      {/* 2-Sentence Brief (Executive Summary) */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-8 opacity-20">
          <Quote className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">ANALYSIS BRIEF_SUMMARY</h3>
        </div>
        <div className="border-l border-jabari-border pl-6">
           <p className="text-xl leading-[1.6] text-jabari-nearWhite font-serif font-light mb-4 italic italic">
             "{analysis.brief || "Awaiting AI synthesis of the vaulted knowledge base content."}"
           </p>
        </div>
      </section>

      {/* Primary Auto-Tags (Metadata) */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-8 opacity-20">
          <LayoutGrid className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">THE VAULTED PARAMETERS</h3>
        </div>
        
        <div className="space-y-4">
          <InsightCard 
            icon={Hash} 
            title="Official Identification ID" 
            value={analysis.tender_id?.value} 
            status={analysis.status}
            source="01"
            onClick={() => onJumpToPage(1)} 
          />
          <InsightCard 
            icon={Calendar} 
            title="Deadline Critical_Date" 
            value={analysis.due_date?.value} 
            status={analysis.status}
            source="03"
            onClick={() => onJumpToPage(3)}
          />
          <InsightCard 
            icon={Bookmark} 
            title="Document Classification" 
            value={analysis.nca_category?.value} 
            status={analysis.status}
            source="05"
            onClick={() => onJumpToPage(5)}
          />
        </div>
      </section>

      {/* Risk Flags (Monochromatic Indicator) */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-8 opacity-20">
          <ShieldAlert className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">RISK ASSESSMENT MATRIX</h3>
        </div>
        
        {analysis.risk_analysis && analysis.risk_analysis.length > 0 ? (
          <div className="space-y-4">
            {analysis.risk_analysis.map((risk, i) => (
              <div 
                key={i} 
                className="px-6 py-5 border border-jabari-border bg-jabari-surface rounded-none flex items-center justify-between group hover:border-jabari-gray transition-colors"
                onClick={() => onJumpToPage(i*2 + 1)}
              >
                <p className="text-[11px] text-jabari-gray font-black uppercase tracking-[0.2em] group-hover:text-jabari-nearWhite">{risk}</p>
                <div className="w-3 h-3 border border-jabari-dim rounded-full flex items-center justify-center">
                   <div className="w-1 h-1 bg-jabari-cream rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 border border-jabari-border border-dashed text-center">
             <p className="text-[11px] text-jabari-dim font-black uppercase tracking-widest">NO CRITICAL RISKS DETECTED AT THIS PHASE</p>
          </div>
        )}
      </section>

      {/* Status Bar */}
      <div className="mt-auto pt-10 border-t border-jabari-border flex flex-col items-center">
        <div className="flex items-center gap-4 mb-4">
           <div className="w-1.5 h-1.5 rounded-full bg-jabari-cream animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-widest text-jabari-dim">PHASE 1: SECURE KNOWLEDGE BASE ENGINE ACTIVE</span>
        </div>
        <p className="text-[8px] font-black uppercase tracking-widest text-jabari-dim opacity-30">
          JABARI INTELLIGENCE // GEN-01_SECURE_VAULT
        </p>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
