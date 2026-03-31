import React from 'react';
import { 
  FileText, Calendar, Hash, ShieldAlert, 
  ChevronRight, Bookmark, LayoutGrid, Quote 
} from 'lucide-react';

const InsightCard = ({ icon: Icon, title, value, status, source, onClick }) => {
  // Logic to determine status badge color from the tailwind config
  const riskColorClass = status === 'Verified' ? 'bg-jabari-risk-none/20 text-jabari-risk-none border-jabari-risk-none/30' : 'bg-jabari-risk-medium/20 text-jabari-risk-medium border-jabari-risk-medium/30';

  return (
    <div 
      onClick={onClick}
      className="
        p-5 mb-4 rounded-2xl border border-white/5 bg-jabari-card/40 
        hover:bg-jabari-card/70 hover:border-blue-500/30
        transition-all duration-200 group cursor-pointer
      "
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/40" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#a1a1a1]">{title}</span>
        </div>
        {source && (
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/30 text-[9px] font-black uppercase tracking-tighter border border-white/10">
            Source: Page {source}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold tracking-wide text-white/90">
        {value || (
          <span className="text-white/10 italic font-normal">Extracting...</span>
        )}
      </p>
      {status && (
        <div className="mt-3">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${riskColorClass}`}>
            {status}
          </span>
        </div>
      )}
    </div>
  );
};

const AnalysisSidebar = ({ data, onJumpToPage }) => {
  const analysis = data?.analysis || {};
  
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar bg-jabari-bg/10">
      {/* 2-Sentence Brief (Executive Summary) */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6 opacity-30">
          <Quote className="w-4 h-4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">AI Insight Brief</h3>
        </div>
        <p className="text-xl leading-relaxed text-jabari-cream/90 font-serif font-light mb-4 italic">
          "{analysis.brief || "Awaiting AI synthesis of the vaulted document."}"
        </p>
      </section>

      {/* Primary Auto-Tags (Metadata) */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-8 opacity-30">
          <LayoutGrid className="w-4 h-4 text-white" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">The Vaulted Data</h3>
        </div>
        
        <div className="space-y-4">
          <InsightCard 
            icon={Hash} 
            title="Official Tender ID" 
            value={analysis.tender_id?.value} 
            status={analysis.status}
            source="-"
            onClick={() => onJumpToPage(1)} 
          />
          <InsightCard 
            icon={Calendar} 
            title="Closing Deadline" 
            value={analysis.due_date?.value} 
            status={analysis.status}
            source="-"
            onClick={() => onJumpToPage(3)}
          />
          <InsightCard 
            icon={Bookmark} 
            title="Required NCA Category" 
            value={analysis.nca_category?.value} 
            status={analysis.status}
            source="-"
            onClick={() => onJumpToPage(5)}
          />
        </div>
      </section>

      {/* Risk Flags (NotebookLM critique vibe) */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-8 opacity-30">
          <ShieldAlert className="w-4 h-4 text-white" />
          <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Risk Detection</h3>
        </div>
        
        {analysis.risk_analysis && analysis.risk_analysis.length > 0 ? (
          <div className="space-y-3">
            {analysis.risk_analysis.map((risk, i) => (
              <div key={i} className="px-5 py-4 rounded-2xl bg-jabari-risk-medium/5 border border-jabari-risk-medium/20 flex items-center justify-between">
                <p className="text-[11px] text-jabari-risk-medium font-black uppercase tracking-widest">{risk}</p>
                <div className="px-3 py-1 rounded-full bg-jabari-risk-medium/10 text-[9px] font-black text-jabari-risk-medium">MEDIUM</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-5 rounded-2xl bg-jabari-risk-none/5 border border-jabari-risk-none/10">
             <p className="text-[11px] text-jabari-risk-none font-black uppercase tracking-widest text-center">Low Risk - All Compliance Passed</p>
          </div>
        )}
      </section>

      {/* Footer Info */}
      <div className="mt-auto pt-8 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/5 opacity-40 text-center uppercase leading-tight">
          Phase 1: Ingestion Pipeline<br/>Secure Knowledge Base
        </p>
      </div>
    </div>
  );
};

export default AnalysisSidebar;
