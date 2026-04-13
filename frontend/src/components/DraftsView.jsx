import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Wand2, Download, Copy, Loader2,
  AlertCircle, CheckCircle2, Check, ChevronDown, FileDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentEditorContainerComponent, Toolbar } from '@syncfusion/ej2-react-documenteditor';

// ─── Syncfusion Styles ─── 
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-documenteditor/styles/material.css';

/* ─── Jabari cream tokens ───────────────────────────────────── */
const T = {
  cream: '#F5F2ED',
  ink: '#1a1a1a',
  ink2: '#3d3d3a',
  muted: '#6b6b68',
  faint: '#9a9a96',
  border: 'rgba(26,26,26,0.10)',
  border2: 'rgba(26,26,26,0.06)',
  surface: 'rgba(26,26,26,0.03)',
  surface2: 'rgba(26,26,26,0.06)',
  serif: "'Lora', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
};

const DRAFT_TYPES = [
  { id: 'technical_proposal', label: 'Technical Proposal' },
  { id: 'cover_letter', label: 'Executive Cover Letter' },
  { id: 'compliance_matrix', label: 'Compliance Matrix' },
];

const DraftsView = ({ sources = [] }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [draftType, setDraftType] = useState('technical_proposal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTenderDropdown, setShowTenderDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const tenderDropdownRef = useRef(null);
  const docEditorRef = useRef(null);

  const filteredSources = sources.filter(d => selectedTenderId ? d.tender_id === selectedTenderId : true);
  const activeSourceName = filteredSources.find(d => d.id === selectedDocId)?.name;
  const activeTenderName = tenders.find(t => t.id === selectedTenderId)?.name;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setShowDropdown(false);
      if (tenderDropdownRef.current && !tenderDropdownRef.current.contains(e.target))
        setShowTenderDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (tenders.length === 0) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      axios.get(`${baseUrl}/tenders`)
        .then(res => setTenders(res.data))
        .catch(err => console.error('Tenders Fetch Error', err));
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedDocId) return;
    setIsGenerating(true);
    setDraft(null);
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await axios.post(`${baseUrl}/draft`, {
        document_id: selectedDocId,
        draft_type: draftType,
      });
      setDraft(response.data);
    } catch (err) {
      console.error('Drafting Error', err);
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
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    try {
      // Export directly from Syncfusion editor for all draft types
      if (docEditorRef.current) {
        docEditorRef.current.documentEditor.save(draft.title.replace(/ /g, '_') + '.docx', 'Docx');
        setIsExporting(false);
        return;
      }

      // Fallback to API endpoint
      const response = await axios.post(
        `${baseUrl}/export/docx`,
        { title: draft.title, content: draft.content },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${draft.title.replace(/ /g, '_')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  /* ── tiny style helpers ── */
  const eyebrow = {
    fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: T.faint, fontFamily: T.sans,
    display: 'block', marginBottom: '8px',
  };

  const actionBtn = (disabled) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 12px', border: `0.5px solid ${T.border}`,
    borderRadius: '6px', background: 'transparent',
    color: disabled ? T.faint : T.muted, fontSize: '10px', fontWeight: 500,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: T.sans,
    opacity: disabled ? 0.4 : 1, transition: 'color 0.15s',
  });

  // ─── Convert Markdown to basic HTML for Word editor ─── 
  const convertMarkdownToHtml = (markdown) => {
    if (!markdown) return '';
    let html = markdown
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
    return html;
  };

  return (
    <div style={{
      display: 'flex', flex: 1, overflow: 'hidden',
      background: T.cream, fontFamily: T.sans,
    }}>

      {/* ── LEFT: CONFIG PANEL ── */}
      <aside style={{
        width: '300px', flexShrink: 0,
        borderRight: `0.5px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '2rem', gap: '2rem',
        background: T.cream, position: 'relative',
        overflowY: 'auto',
      }}>

        {/* Heading */}
        <div>
          <span style={eyebrow}>Production Config</span>
          <h2 style={{
            fontFamily: T.serif, fontSize: '22px', fontWeight: 400,
            fontStyle: 'italic', color: T.ink, margin: 0, letterSpacing: '-0.01em',
          }}>
            Drafting Parameters
          </h2>
        </div>

        {/* Project Selector */}
        <div style={{ position: 'relative', zIndex: showTenderDropdown ? 60 : 20, marginBottom: '-8px' }} ref={tenderDropdownRef}>
          <span style={eyebrow}>Workspace Scope</span>
          <button
            onClick={() => { setShowTenderDropdown(p => !p); setShowDropdown(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '10px 14px',
              border: `0.5px solid ${showTenderDropdown ? T.ink : T.border}`,
              borderRadius: '6px', background: T.surface,
              color: T.ink,
              fontSize: '13px', cursor: 'pointer', fontFamily: T.sans,
              textAlign: 'left', transition: 'border-color 0.15s',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
              {activeTenderName ?? 'Universal Vault'}
            </span>
            <ChevronDown style={{
              width: '14px', height: '14px', color: T.muted, flexShrink: 0,
              transform: showTenderDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          </button>

          {showTenderDropdown && (
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: 'calc(100% + 4px)', zIndex: 70,
              background: T.cream, border: `0.5px solid ${T.border}`,
              borderRadius: '6px',
              boxShadow: '0 8px 32px rgba(26,26,26,0.12)',
              overflow: 'hidden',
            }}>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <button
                  onClick={() => { setSelectedTenderId(null); setSelectedDocId(null); setShowTenderDropdown(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '11px 14px',
                    border: 'none', borderBottom: `0.5px solid ${T.border2}`,
                    background: selectedTenderId === null ? T.surface2 : 'transparent',
                    color: selectedTenderId === null ? T.ink : T.ink2,
                    fontSize: '13px', fontWeight: selectedTenderId === null ? 500 : 400,
                    cursor: 'pointer', textAlign: 'left', fontFamily: T.sans,
                  }}
                  onMouseOver={e => { if (selectedTenderId !== null) e.currentTarget.style.background = T.surface; }}
                  onMouseOut={e => { if (selectedTenderId !== null) e.currentTarget.style.background = 'transparent'; }}
                >
                  Universal Vault
                  {selectedTenderId === null && <Check style={{ width: '13px', height: '13px', flexShrink: 0, color: T.ink }} />}
                </button>

                {tenders.map((tender, i) => (
                  <button
                    key={tender.id}
                    onClick={() => { setSelectedTenderId(tender.id); setSelectedDocId(null); setShowTenderDropdown(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '11px 14px',
                      border: 'none', borderBottom: i < tenders.length - 1 ? `0.5px solid ${T.border2}` : 'none',
                      background: selectedTenderId === tender.id ? T.surface2 : 'transparent',
                      color: selectedTenderId === tender.id ? T.ink : T.ink2,
                      fontSize: '13px', fontWeight: selectedTenderId === tender.id ? 500 : 400,
                      cursor: 'pointer', textAlign: 'left', fontFamily: T.sans,
                    }}
                    onMouseOver={e => { if (selectedTenderId !== tender.id) e.currentTarget.style.background = T.surface; }}
                    onMouseOut={e => { if (selectedTenderId !== tender.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                      {tender.name}
                    </span>
                    {selectedTenderId === tender.id && <Check style={{ width: '13px', height: '13px', flexShrink: 0, color: T.ink }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Source selector */}
        <div style={{ position: 'relative', zIndex: showDropdown ? 50 : 10 }} ref={dropdownRef}>
          <span style={eyebrow}>Source Material</span>

          <button
            onClick={() => { setShowDropdown(p => !p); setShowTenderDropdown(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '10px 14px',
              border: `0.5px solid ${showDropdown ? T.ink : T.border}`,
              borderRadius: '6px', background: T.surface,
              color: selectedDocId ? T.ink : T.muted,
              fontSize: '13px', cursor: 'pointer', fontFamily: T.sans,
              textAlign: 'left', transition: 'border-color 0.15s',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
              {activeSourceName ?? 'Select Vaulted Source…'}
            </span>
            <ChevronDown style={{
              width: '14px', height: '14px', color: T.muted, flexShrink: 0,
              transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          </button>

          {/* Dropdown list */}
          {showDropdown && (
            <div style={{
              position: 'absolute', left: 0, right: 0,
              top: 'calc(100% + 4px)', zIndex: 60,
              background: T.cream, border: `0.5px solid ${T.border}`,
              borderRadius: '6px',
              boxShadow: '0 8px 32px rgba(26,26,26,0.12)',
              overflow: 'hidden',
            }}>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {filteredSources.length === 0 && (
                  <div style={{ padding: '14px 16px', fontSize: '11px', color: T.faint, textAlign: 'center', fontStyle: 'italic' }}>
                    No vaulted sources in this scope
                  </div>
                )}
                {filteredSources.map((doc, i) => (
                  <button
                    key={`doc-${doc.id}`}
                    onClick={() => { setSelectedDocId(doc.id); setShowDropdown(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '11px 14px',
                      border: 'none', borderBottom: i < filteredSources.length - 1 ? `0.5px solid ${T.border2}` : 'none',
                      background: selectedDocId === doc.id ? T.surface2 : 'transparent',
                      color: selectedDocId === doc.id ? T.ink : T.ink2,
                      fontSize: '13px', fontWeight: selectedDocId === doc.id ? 500 : 400,
                      cursor: 'pointer', textAlign: 'left', fontFamily: T.sans,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => { if (selectedDocId !== doc.id) e.currentTarget.style.background = T.surface; }}
                    onMouseOut={e => { if (selectedDocId !== doc.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                      {doc.name}
                    </span>
                    {selectedDocId === doc.id && <Check style={{ width: '13px', height: '13px', flexShrink: 0, color: T.ink }} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Artifact type */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <span style={eyebrow}>Artifact Type</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {DRAFT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setDraftType(type.id)}
                style={{
                  padding: '11px 14px', textAlign: 'left',
                  border: `0.5px solid ${draftType === type.id ? T.ink : T.border}`,
                  borderRadius: '6px',
                  background: draftType === type.id ? T.ink : 'transparent',
                  color: draftType === type.id ? T.cream : T.muted,
                  fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em',
                  textTransform: 'uppercase', cursor: 'pointer', fontFamily: T.sans,
                  transition: 'all 0.15s',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button — pinned to bottom */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={handleGenerate}
            disabled={!selectedDocId || isGenerating}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '24px', border: 'none',
              background: !selectedDocId || isGenerating ? T.surface2 : T.ink,
              color: !selectedDocId || isGenerating ? T.faint : T.cream,
              fontSize: '12px', fontWeight: 500, letterSpacing: '0.07em',
              textTransform: 'uppercase', cursor: !selectedDocId || isGenerating ? 'not-allowed' : 'pointer',
              fontFamily: T.sans, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '8px', transition: 'all 0.15s',
            }}
          >
            {isGenerating
              ? <><Loader2 style={{ width: '14px', height: '14px', animation: 'jabari-spin 1s linear infinite' }} /> Synthesising…</>
              : <><Wand2 style={{ width: '14px', height: '14px' }} /> Synthesize Draft</>
            }
          </button>
        </div>
      </aside>

      {/* ── RIGHT: PREVIEW ── */}
      <main style={{
        flex: 1, overflowY: 'auto', padding: '2rem',
        background: T.cream, display: 'flex', justifyContent: 'center',
      }}>
        {!draft && !isGenerating ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', opacity: 0.25, marginTop: '5rem', textAlign: 'center',
          }}>
            <FileText style={{ width: '64px', height: '64px', marginBottom: '1rem', color: T.ink }} />
            <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink }}>
              Canvas Ready for Synthesis
            </p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '760px' }}>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.ink, opacity: 0.4 }} />
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>
                  Production Preview
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={copyToClipboard}
                  style={actionBtn(false)}
                  onMouseOver={e => e.currentTarget.style.color = T.ink}
                  onMouseOut={e => e.currentTarget.style.color = T.muted}
                >
                  {copySuccess
                    ? <><CheckCircle2 style={{ width: '13px', height: '13px' }} /> Copied</>
                    : <><Copy style={{ width: '13px', height: '13px' }} /> Copy</>
                  }
                </button>
                <button
                  onClick={handleExportDocx}
                  disabled={isExporting}
                  style={actionBtn(isExporting)}
                  onMouseOver={e => { if (!isExporting) e.currentTarget.style.color = T.ink; }}
                  onMouseOut={e => { if (!isExporting) e.currentTarget.style.color = T.muted; }}
                >
                  {isExporting
                    ? <><Loader2 style={{ width: '13px', height: '13px', animation: 'jabari-spin 1s linear infinite' }} /> Exporting…</>
                    : <><Download style={{ width: '13px', height: '13px' }} /> Export Word</>
                  }
                </button>
              </div>
            </div>

            {/* Document canvas */}
            <div style={{
              background: '#fff',
              border: `0.5px solid ${T.border}`,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(26,26,26,0.07)',
            }}>
              {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '600px', gap: '12px', background: '#fff' }}>
                  <Loader2 style={{ width: '28px', height: '28px', color: T.ink, animation: 'jabari-spin 1s linear infinite' }} />
                  <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>
                    Drafting Engine Engaged…
                  </p>
                </div>
              ) : draft?.error ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '600px', gap: '12px', color: '#c45a5a', background: '#fff' }}>
                  <AlertCircle style={{ width: '32px', height: '32px' }} />
                  <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Neural Synthesis Failed
                  </p>
                  <p style={{ fontSize: '13px', textAlign: 'center', fontFamily: T.sans, opacity: 0.8 }}>
                    {draft.error}
                  </p>
                </div>
              ) : draft ? (
                // ─── SYNCFUSION WORD EDITOR ─── 
                <DocumentEditorContainerComponent
                  ref={docEditorRef}
                  id="jabari-document-editor"
                  serviceUrl="https://ej2services.syncfusion.com/production/web-services/api/documenteditor/"
                  enableToolbar={true}
                  height="600px"
                  style={{ width: '100%' }}
                  created={() => {
                    if (docEditorRef.current && draft?.content) {
                      const editor = docEditorRef.current.documentEditor;
                      const htmlContent = `<html><body>${convertMarkdownToHtml(draft.content)}</body></html>`;
                      editor.open(htmlContent);
                    }
                  }}
                />
              ) : (
                <div style={{
                  padding: '3.5rem 4rem',
                  minHeight: '600px',
                  fontFamily: T.serif, fontSize: '15px', lineHeight: 1.85,
                  color: T.ink2,
                  background: '#fff',
                }}>
                  {draft?.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 style={{ fontSize: '28px', fontWeight: 600, marginTop: '24px', marginBottom: '16px', color: T.ink, fontStyle: 'normal' }} {...props} />,
                        h2: ({ node, ...props }) => <h2 style={{ fontSize: '22px', fontWeight: 600, marginTop: '24px', marginBottom: '16px', color: T.ink, fontStyle: 'normal' }} {...props} />,
                        h3: ({ node, ...props }) => <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '20px', marginBottom: '12px', color: T.ink, fontStyle: 'normal' }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'disc' }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'decimal' }} {...props} />,
                        li: ({ node, ...props }) => <li style={{ marginBottom: '8px' }} {...props} />,
                        p: ({ node, ...props }) => <p style={{ marginBottom: '16px' }} {...props} />,
                        strong: ({ node, ...props }) => <strong style={{ fontWeight: 700, color: T.ink }} {...props} />,
                        em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                        table: ({ node, ...props }) => <div style={{ overflowX: 'auto', marginBottom: '24px', fontFamily: T.sans }}><table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.border}` }} {...props} /></div>,
                        th: ({ node, ...props }) => <th style={{ padding: '12px', backgroundColor: T.surface, border: `1px solid ${T.border}`, textAlign: 'left', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: T.ink }} {...props} />,
                        td: ({ node, ...props }) => <td style={{ padding: '12px', border: `1px solid ${T.border}`, fontSize: '13px' }} {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: `2px solid ${T.muted}`, paddingLeft: '16px', fontStyle: 'italic', color: T.muted, margin: '24px 0' }} {...props} />
                      }}
                    >
                      {draft?.content || ''}
                    </ReactMarkdown>
                  ) : null}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '1.5rem', marginBottom: '3rem',
              padding: '14px 18px',
              border: `0.5px dashed ${T.border}`,
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '10px',
              opacity: 0.55,
            }}>
              <AlertCircle style={{ width: '14px', height: '14px', color: T.muted, flexShrink: 0 }} />
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted, margin: 0, lineHeight: 1.6 }}>
                AI-generated draft. Review for technical accuracy before submission.
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`@keyframes jabari-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DraftsView;