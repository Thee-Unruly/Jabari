import React, { useState } from 'react';
import { 
  FileBox, Mail, MessageSquare, Cloud, 
  ShieldCheck, ExternalLink, Settings2,
  AlertCircle, CheckCircle2, Globe2, 
  Building2, Lock, Smartphone, Zap
} from 'lucide-react';

const T = {
  cream: '#F5F2ED',
  ink: '#1a1a1a',
  muted: '#6b6b68',
  faint: '#9a9a96',
  border: 'rgba(26,26,26,0.10)',
  border2: 'rgba(26,26,26,0.06)',
  surface: 'rgba(26,26,26,0.03)',
  accent: '#B8860B',
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const IntegrationCard = ({ icon: Icon, name, description, status, type, color }) => {
  const isConnected = status === 'Connected' || status === 'Live data';
  
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${T.border}`,
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          background: `${color}15`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: color
        }}>
          <Icon size={22} />
        </div>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: 600, 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em',
          padding: '4px 8px',
          borderRadius: '20px',
          background: isConnected ? '#e6f4ea' : T.surface,
          color: isConnected ? '#1e7e34' : T.muted,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {isConnected && <CheckCircle2 size={10} />}
          {status}
        </span>
      </div>

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: T.ink, margin: '0 0 4px 0' }}>{name}</h3>
        <p style={{ fontSize: '12px', color: T.muted, lineHeight: 1.5, margin: 0 }}>{description}</p>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
        <button style={{ 
          flex: 1, 
          padding: '8px', 
          fontSize: '11px', 
          fontWeight: 500, 
          background: T.ink, 
          color: '#fff', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {isConnected ? 'Manage' : 'Connect'}
        </button>
        <button style={{ 
          padding: '8px', 
          background: 'transparent', 
          color: T.muted, 
          border: `0.5px solid ${T.border}`, 
          borderRadius: '6px', 
          cursor: 'pointer' 
        }}>
          <Settings2 size={14} />
        </button>
      </div>
    </div>
  );
};

const IntegrationsHub = () => {
    const integrations = [
        {
            group: "Productivity Suite",
            items: [
                { name: "Microsoft Word", icon: FileBox, description: "Draft bids and verify compliance directly in Word.", status: "Connected", color: "#2b579a" },
                { name: "Outlook", icon: Mail, description: "Track tender emails and draft responses in one click.", status: "Connected", color: "#0078d4" },
                { name: "Gmail", icon: Mail, description: "Archive procurement threads to the Jabari Vault.", status: "Connected", color: "#ea4335" },
                { name: "Google Drive", icon: Cloud, description: "Automatic two-way sync for bid documentation.", status: "Connected", color: "#34a853" },
            ]
        },
        {
            group: "Kenyan Procurement Portals",
            items: [
                { name: "PPRA Portal", icon: Globe2, description: "Real-time OCDS sync and tender publishing alerts.", status: "Live data", color: "#B8860B" },
                { name: "AGPO Registry", icon: ShieldCheck, description: "Verified status tracking for youth/women builders.", status: "Live data", color: "#1e7e34" },
                { name: "NCA Registry", icon: Building2, description: "Live checking for contractor classification levels.", status: "Live data", color: "#c0392b" },
                { name: "Custom API", icon: Zap, description: "Connect Jabari to your own internal ERP or IFMIS.", status: "Configure", color: T.ink },
            ]
        },
        {
            group: "Field & Mobile Connectivity",
            items: [
                { name: "WhatsApp Business", icon: MessageSquare, description: "Instant tender alerts and Assistant access via chat.", status: "Connected", color: "#25d366" },
                { name: "Mobile App", icon: Smartphone, description: "Secure bid review and approvals on the go.", status: "Beta Access", color: T.muted },
                { name: "Shield Security", icon: Lock, description: "Enterprise-grade encryption and access logs.", status: "Connected", color: T.accent },
            ]
        }
    ];

    return (
        <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontFamily: T.serif, fontSize: '32px', fontStyle: 'italic', marginBottom: '8px' }}>Ecosystem & Integrations</h2>
                <p style={{ color: T.muted, fontSize: '15px' }}>Access Jabari across every tool your team already uses — no switching, no friction.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {integrations.map((group, idx) => (
                    <div key={idx}>
                        <h3 style={{ 
                            fontSize: '11px', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.1em', 
                            color: T.faint, 
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {group.group}
                            <div style={{ flex: 1, height: '1px', background: T.border }}></div>
                        </h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                            gap: '1.5rem' 
                        }}>
                            {group.items.map((item, i) => (
                                <IntegrationCard key={i} {...item} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ 
                marginTop: '4rem', 
                padding: '2rem', 
                background: T.ink, 
                borderRadius: '12px', 
                color: T.cream,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Need a custom integration?</h4>
                    <p style={{ fontSize: '14px', color: T.faint, margin: 0 }}>Connect Jabari to your proprietary systems via our Enterprise API.</p>
                </div>
                <button style={{ 
                    padding: '12px 24px', 
                    borderRadius: '8px', 
                    background: T.cream, 
                    color: T.ink, 
                    border: 'none', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                }}>
                    Developer Docs
                </button>
            </div>
        </div>
    );
};

export default IntegrationsHub;
