import React from 'react';
import { 
  FileText, Calendar, Hash, ShieldAlert, 
  ChevronRight, Bookmark, LayoutGrid, Quote 
} from 'lucide-react';

const InsightCard = ({ icon: Icon, title, value, status, source, onClick }) => (
  <div 
    onClick={onClick}
    className="
      p-4 mb-4 rounded-xl border border-white/5 bg-white/[0.03] 
      hover:bg-white/[0.05] hover:border-blue-500/30
      transition-all duration-200 group cursor-pointer
      shadow-sm
    "
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400 opacity-60" />
        <span className="text-xs uppercase tracking-widest text-white/40 font-bold">{title}</span>
      </div>
      {source && (
        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
          PAGE {source}
        </span>
      )}
    </div>
    <p className="text-sm font-medium text-white group-hover:text-blue-200">
      {value || (
        <span className="text-white/20 italic font-normal">Not detected</span>
      )}
    </p>
    {status && (
      <div className="mt-2 flex items-center gap-1.5 opacity-60">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className="text-[10px] text-white/50">{status}</span>
      </div>
    )}
  </div>
);

const AnalysisSidebar = ({ data, onJumpToPage }) => {
  const analysis = data?.analysis || {};
  
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      {/* 2-Sentence Brief (Executive Summary) */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Quote className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">Project Brief</h3>
        </div>
        <p className="text-lg leading-relaxed text-blue-100/90 font-serif italic">
          {analysis.brief || "No summary available for this document."}
        </p>
      </section>

      {/* Primary Auto-Tags (Metadata) */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">Vaulted Data</h3>
        </div>
        
        <InsightCard 
          icon={Hash} 
          title="Tender ID" 
          value={analysis.tender_id?.value} 
          status={analysis.status}
          source="-" 
          onClick={() => onJumpToPage(1)} 
        />
        
        <InsightCard 
          icon={Calendar} 
          title="Due Date" 
          value={analysis.due_date?.value} 
          status={analysis.status}
          source="-"
          onClick={() => onJumpToPage(3)}
        />
        
        <InsightCard 
          icon={Bookmark} 
          title="NCA Category" 
          value={analysis.nca_category?.value} 
          status={analysis.status}
          source="-"
          onClick={() => onJumpToPage(5)}
        />
      </section>

      {/* Risk Flags (NotebookLM critique vibe) */}
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest text-red-500/70">Potential Risks</h3>
        </div>
        
        {analysis.risk_analysis && analysis.risk_analysis.length > 0 ? (
          <div className="space-y-2">
            {analysis.risk_analysis.map((risk, i) => (
              <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-red-100/80 leading-relaxed font-semibold tracking-wide uppercase">{risk}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/20 italic">No significant risks identified.</p>
        )}
      </section>

      {/* Chunk Count (Vault stats) */}
      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest">Vault Status</span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 font-bold uppercase tracking-tighter">
          {data.metadata?.chunk_count} Chunks Indexed
        </span>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
