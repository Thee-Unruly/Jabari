import React, { useState, useEffect } from 'react';
import { 
  Zap, Play, CheckCircle2, Circle, 
  Clock, Search, FileSearch, Scale, 
  PenTool, BarChart3, AlertTriangle, ChevronRight,
  Plus, Settings2, Activity
} from 'lucide-react';

const T = {
  cream: '#F5F2ED',
  ink: '#1a1a1a',
  muted: '#6b6b68',
  faint: '#9a9a96',
  border: 'rgba(26,26,26,0.10)',
  surface: 'rgba(26,26,26,0.03)',
  accent: '#B8860B',
  success: '#1e7e34',
  warning: '#b08b00',
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const WorkflowAgent = ({ name, steps, currentStep, status }) => {
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${T.border}`,
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: T.ink, borderRadius: '8px', color: '#fff' }}>
            <Zap size={18} />
          </div>
          <div>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faint, margin: 0 }}>Workflow Agent //</p>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: T.ink, margin: 0 }}>{name}</h3>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: '11px', color: T.accent, fontWeight: 600, margin: 0 }}>{status}</p>
           <p style={{ fontSize: '9px', color: T.faint, margin: 0 }}>Estimate: 45s remaining</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: idx > currentStep ? 0.5 : 1 }}>
            {idx < currentStep ? (
              <CheckCircle2 size={16} color={T.success} />
            ) : idx === currentStep ? (
              <Activity size={16} color={T.accent} className="animate-pulse" />
            ) : (
              <Circle size={16} color={T.border} />
            )}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: idx <= currentStep ? T.ink : T.muted }}>{step.label}</span>
                <span style={{ fontSize: '10px', color: T.faint }}>{step.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1.5rem', height: '4px', background: T.surface, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${(currentStep / steps.length) * 100}%`, height: '100%', background: T.ink, transition: 'width 0.5s ease' }}></div>
      </div>
    </div>
  );
};

const AgentCard = ({ icon: Icon, name, description, status, metric, color }) => {
    return (
        <div style={{
            background: '#fff',
            border: `0.5px solid ${T.border}`,
            borderRadius: '10px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ 
                    width: '36px', height: '36px', borderRadius: '8px', 
                    background: `${color}15`, display: 'flex',  alignItems: 'center', 
                    justifyContent: 'center', color: color 
                }}>
                    <Icon size={18} />
                </div>
                <span style={{ 
                    fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '10px',
                    background: status === 'Active' ? '#e6f4ea' : (status === 'Warning' ? '#fff4e5' : T.surface),
                    color: status === 'Active' ? T.success : (status === 'Warning' ? T.warning : T.muted)
                }}>
                    {status}
                </span>
            </div>
            <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0' }}>{name}</h4>
                <p style={{ fontSize: '12px', color: T.muted, lineHeight: 1.4, margin: 0 }}>{description}</p>
            </div>
            <div style={{ marginTop: 'auto', borderTop: `0.5px solid ${T.border}`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: T.faint }}>{metric}</span>
                <button style={{ border: 'none', background: 'none', color: T.ink, cursor: 'pointer' }}><ChevronRight size={14}/></button>
            </div>
        </div>
    );
};

const WorkflowsHub = () => {
    const [running, setRunning] = useState(true);
    const [step, setStep] = useState(2);

    useEffect(() => {
        if (running && step < 5) {
            const timer = setTimeout(() => setStep(step + 1), 3000);
            return () => clearTimeout(timer);
        } else if (step === 5) {
            setRunning(false);
        }
    }, [step, running]);

    const complianceSteps = [
        { label: "Fetch tender from PPRA portal", status: "Done · 2s" },
        { label: "Extract all requirements from RFP", status: "Done · 8s" },
        { label: "Cross-check firm profile vs requirements", status: step === 2 ? "Running..." : "Done · 14s" },
        { label: "Identify compliance gaps", status: step === 3 ? "Running..." : (step > 3 ? "Done · 5s" : "Pending") },
        { label: "Generate gap resolution action plan", status: step === 4 ? "Running..." : (step > 4 ? "Done · 9s" : "Pending") },
        { label: "Draft bid go / no-go recommendation", status: step === 5 ? "Running..." : "Pending" },
    ];

    const agents = [
        { name: "Tender Screening Agent", icon: Search, description: "Filters PPRA daily by your criteria", status: "Active", metric: "32 tenders today", color: "#0078d4" },
        { name: "Proposal Merchant", icon: PenTool, description: "Generates full technical bid responses", status: "Active", metric: "14 drafts created", color: "#B8860B" },
        { name: "Certificate Tracker", icon: Scale, description: "Monitors expiry and renewal dates", status: "Warning", metric: "2 items expiring soon", color: "#ea4335" },
        { name: "Pricing Benchmark", icon: BarChart3, description: "Suggests competitive pricing", status: "Idle", metric: "Last run 2d ago", color: T.muted },
    ];

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                <div>
                    <h2 style={{ fontFamily: T.serif, fontSize: '32px', fontStyle: 'italic', marginBottom: '8px' }}>Workflow Studio</h2>
                    <p style={{ color: T.muted, fontSize: '15px' }}>Design and deploy multi-step agents tailored to your team's bid process.</p>
                </div>
                <button style={{ 
                    padding: '10px 20px', background: T.ink, color: '#fff', 
                    border: 'none', borderRadius: '24px', fontSize: '13px', 
                    fontWeight: 600, cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', gap: '8px' 
                }}>
                    <Plus size={16} /> New Workflow
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
                {/* Left: Active Orchestration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem', borderBottom: `0.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: running ? T.accent : T.success }}></div>
                                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {running ? 'Agent Session Active' : 'Workflow Complete'}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: T.muted }}>Session ID: #WF-2026-09</span>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                                <WorkflowAgent 
                                    name="Bid Compliance Check" 
                                    steps={complianceSteps} 
                                    currentStep={step} 
                                    status={running ? "Running..." : "Task Finished"} 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                         <div style={{ padding: '1.5rem', border: `1px dashed ${T.border}`, borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: T.faint, marginBottom: '8px' }}><Settings2 size={24}/></div>
                            <h5 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Configure Trigger</h5>
                            <p style={{ fontSize: '11px', color: T.faint, margin: 0 }}>Automate based on time or new tenders.</p>
                         </div>
                         <div style={{ padding: '1.5rem', border: `1px dashed ${T.border}`, borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: T.faint, marginBottom: '8px' }}><Plus size={24}/></div>
                            <h5 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>Add Agent Step</h5>
                            <p style={{ fontSize: '11px', color: T.faint, margin: 0 }}>Chain another specialist agent.</p>
                         </div>
                    </div>
                </div>

                {/* Right: Agent Library */}
                <div>
                    <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.faint, marginBottom: '1.25rem' }}>Agent Library</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {agents.map((agent, i) => (
                            <AgentCard key={i} {...agent} />
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.25rem', background: T.surface, borderRadius: '10px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Workflow Statistics</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: T.muted }}>Total Tasks:</span>
                                <span style={{ fontWeight: 600 }}>24,812</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: T.muted }}>Time Saved:</span>
                                <span style={{ fontWeight: 600, color: T.success }}>75%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowsHub;
