// DraftsView — Jabari Drafting Studio
import React, { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  FileText, Wand2, Download, Copy, Loader2, AlertCircle,
  CheckCircle2, Check, ChevronDown, ChevronRight,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo2, Redo2, Table, LayoutGrid, Shield, Mail,
  BookOpen, Clock, Type, Hash,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TableExt from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const T = {
  cream: '#F5F2ED', ink: '#1a1a1a', ink2: '#3d3d3a',
  muted: '#6b6b68', faint: '#9a9a96',
  border: 'rgba(26,26,26,0.10)', border2: 'rgba(26,26,26,0.06)',
  surface: 'rgba(26,26,26,0.03)', surface2: 'rgba(26,26,26,0.06)',
  accent: '#B8860B',
  serif: "'Lora', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif",
};

const DRAFT_TYPES = [
  {
    id: 'technical_proposal',
    label: 'Technical Proposal',
    desc: 'Full methodology, team structure & work plan',
    icon: <LayoutGrid size={18} />,
    color: '#3b82f6',
    bg: '#dbeafe',
  },
  {
    id: 'cover_letter',
    label: 'Executive Cover Letter',
    desc: 'Concise letter aligned to buyer objectives',
    icon: <Mail size={18} />,
    color: '#8b5cf6',
    bg: '#ede9fe',
  },
  {
    id: 'compliance_matrix',
    label: 'Compliance Matrix',
    desc: 'Requirement-by-requirement response table',
    icon: <Shield size={18} />,
    color: '#10b981',
    bg: '#d1fae5',
  },
];

const markdownToHtml = (md) => {
  if (!md) return '';
  let html = md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
  html = html.replace(/((?:^[-*] .+$\n?)+)/gm, (b) =>
    '<ul>' + b.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('') + '</ul>');
  html = html.replace(/((?:^\d+\. .+$\n?)+)/gm, (b) =>
    '<ol>' + b.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('') + '</ol>');
  html = html.split('\n\n').map(b => b.trim().startsWith('<') ? b : `<p>${b.replace(/\n/g, '<br>')}</p>`).join('');
  return html;
};

const DraftsView = ({ sources = [] }) => {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [draftType, setDraftType] = useState('technical_proposal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null); // 'docx' | 'md'
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTenderDropdown, setShowTenderDropdown] = useState(false);
  const [useVaultReuse, setUseVaultReuse] = useState(true);
  const dropdownRef = useRef(null);
  const tenderDropdownRef = useRef(null);

  const filteredSources = sources.filter(d => selectedTenderId ? d.tender_id === selectedTenderId : true);
  const activeSourceName = filteredSources.find(d => d.id === selectedDocId)?.name;
  const activeTenderName = tenders.find(t => t.id === selectedTenderId)?.name;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableExt.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
    ],
    content: '',
    editorProps: { attributes: { class: 'jabari-editor' } },
  });

  // Word count
  const wordCount = useMemo(() => {
    if (!editor) return 0;
    return editor.getText().trim().split(/\s+/).filter(Boolean).length;
  }, [editor?.state]);

  const readingMins = Math.max(1, Math.round(wordCount / 200));
  const estPages = Math.max(1, Math.round(wordCount / 250));

  useEffect(() => {
    if (editor && draft?.content) editor.commands.setContent(markdownToHtml(draft.content));
  }, [draft?.content, editor]);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (tenderDropdownRef.current && !tenderDropdownRef.current.contains(e.target)) setShowTenderDropdown(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    axios.get(`${base}/tenders`).then(r => setTenders(r.data)).catch(() => { });
  }, []);

  const handleGenerate = async () => {
    if (!selectedDocId) return;
    setIsGenerating(true); setDraft(null); editor?.commands.setContent('');
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const res = await axios.post(`${base}/draft`, {
        document_id: selectedDocId,
        draft_type: draftType,
        use_vault_reuse: useVaultReuse,
      });
      setDraft(res.data);
    } catch { setDraft({ error: 'Failed to generate draft. Please try again.' }); }
    finally { setIsGenerating(false); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editor ? editor.getText() : draft?.content || '');
    setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExportDocx = async () => {
    if (!draft?.content || !draft?.title) return;
    setIsExporting(true); setExportFormat('docx');
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const res = await axios.post(`${base}/export/docx`, { title: draft.title, content: draft.content }, { responseType: 'blob' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([res.data])), download: `${draft.title.replace(/ /g, '_')}.docx` });
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error(e); } finally { setIsExporting(false); setExportFormat(null); }
  };

  const handleExportMd = () => {
    if (!draft?.content) return;
    const blob = new Blob([draft.content], { type: 'text/markdown' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${(draft?.title || 'draft').replace(/ /g, '_')}.md` });
    document.body.appendChild(a); a.click(); a.remove();
  };

  // Style helpers
  const tb = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '28px', height: '28px', border: 'none', borderRadius: '5px',
    background: active ? 'rgba(26,26,26,0.10)' : 'transparent',
    color: active ? T.ink : T.ink2, cursor: 'pointer',
  });
  const sep = { width: '1px', height: '18px', background: T.border, margin: '0 6px', flexShrink: 0 };
  const dp = (open) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', border: `0.5px solid ${open ? T.ink : T.border}`,
    borderRadius: '8px', background: '#fff', color: T.ink, fontSize: '13px',
    cursor: 'pointer', fontFamily: T.sans, textAlign: 'left',
  });
  const dpl = {
    position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 70,
    background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(26,26,26,0.12)', overflow: 'hidden',
  };
  const di = (active) => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 14px', border: 'none', borderBottom: `0.5px solid ${T.border2}`,
    background: active ? T.surface2 : 'transparent', color: active ? T.ink : T.ink2,
    fontSize: '13px', fontWeight: active ? 500 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: T.sans,
  });

  const hasDraft = draft && !draft.error && !isGenerating;

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: T.cream, fontFamily: T.sans }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{ width: '290px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '1.75rem 1.5rem', gap: '0', background: T.cream }}>

        {/* Branding */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Drafting Studio</p>
          <h1 style={{ fontFamily: T.serif, fontSize: '20px', fontStyle: 'italic', color: T.ink, margin: 0 }}>New Document</h1>
        </div>

        {/* Workspace scope */}
        <div style={{ marginBottom: '1.5rem', position: 'relative', zIndex: showTenderDropdown ? 60 : 20 }} ref={tenderDropdownRef}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Project</p>
          <button onClick={() => { setShowTenderDropdown(p => !p); setShowDropdown(false); }} style={dp(showTenderDropdown)}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', color: activeTenderName ? T.ink : T.muted }}>{activeTenderName ?? 'All documents'}</span>
            <ChevronDown size={13} color={T.faint} style={{ flexShrink: 0, transform: showTenderDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showTenderDropdown && (
            <div style={dpl}><div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <button onClick={() => { setSelectedTenderId(null); setSelectedDocId(null); setShowTenderDropdown(false); }} style={di(!selectedTenderId)}>All documents {!selectedTenderId && <Check size={12} />}</button>
              {tenders.map(t => (
                <button key={t.id} onClick={() => { setSelectedTenderId(t.id); setSelectedDocId(null); setShowTenderDropdown(false); }} style={di(selectedTenderId === t.id)}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{t.name}</span>
                  {selectedTenderId === t.id && <Check size={12} />}
                </button>
              ))}
            </div></div>
          )}
        </div>

        {/* Source document */}
        <div style={{ marginBottom: '1.75rem', position: 'relative', zIndex: showDropdown ? 50 : 10 }} ref={dropdownRef}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>Source Document</p>
          <button onClick={() => { setShowDropdown(p => !p); setShowTenderDropdown(false); }} style={dp(showDropdown)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <FileText size={13} style={{ color: selectedDocId ? '#e53e3e' : T.faint, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedDocId ? T.ink : T.muted, fontSize: '13px' }}>{activeSourceName ?? 'Select a document…'}</span>
            </div>
            <ChevronDown size={13} color={T.faint} style={{ flexShrink: 0, transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showDropdown && (
            <div style={dpl}><div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {filteredSources.length === 0 && <div style={{ padding: '16px', fontSize: '12px', color: T.faint, textAlign: 'center' }}>No documents in this project</div>}
              {filteredSources.map(doc => (
                <button key={doc.id} onClick={() => { setSelectedDocId(doc.id); setShowDropdown(false); }} style={di(selectedDocId === doc.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <FileText size={12} style={{ color: '#e53e3e', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                  </div>
                  {selectedDocId === doc.id && <Check size={12} />}
                </button>
              ))}
            </div></div>
          )}
        </div>

        {/* Draft type cards */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Document Type</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DRAFT_TYPES.map(type => {
              const active = draftType === type.id;
              return (
                <button key={type.id} onClick={() => setDraftType(type.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: `0.5px solid ${active ? T.ink : T.border}`, borderRadius: '10px', background: active ? T.ink : '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: T.sans, transition: 'all 0.15s' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: active ? 'rgba(255,255,255,0.12)' : type.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: active ? '#fff' : type.color }}>
                    {type.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 500, color: active ? '#fff' : T.ink, lineHeight: 1.3 }}>{type.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: active ? 'rgba(255,255,255,0.55)' : T.faint, lineHeight: 1.5 }}>{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vault reuse toggle */}
        <div style={{ marginBottom: '1.75rem', padding: '12px 14px', border: `0.5px solid ${useVaultReuse ? '#B8860B44' : T.border}`, borderRadius: '10px', background: useVaultReuse ? 'rgba(184,134,11,0.05)' : T.surface, transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: useVaultReuse ? '6px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={13} style={{ color: useVaultReuse ? T.accent : T.faint }} />
              <span style={{ fontSize: '12px', fontWeight: 500, color: useVaultReuse ? T.ink : T.muted, fontFamily: T.sans }}>Smart Vault Reuse</span>
            </div>
            {/* Toggle switch */}
            <button onClick={() => setUseVaultReuse(p => !p)}
              style={{ width: '36px', height: '20px', borderRadius: '10px', border: 'none', background: useVaultReuse ? T.accent : T.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '3px', left: useVaultReuse ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          {useVaultReuse && (
            <p style={{ margin: 0, fontSize: '11px', color: T.muted, lineHeight: 1.5, fontFamily: T.sans }}>AI will search your past proposals and adapt relevant sections instead of generating from scratch.</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '0.5px', background: T.border, marginBottom: '1.75rem' }} />

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={!selectedDocId || isGenerating}
          style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: !selectedDocId || isGenerating ? T.surface2 : T.ink, color: !selectedDocId || isGenerating ? T.faint : '#fff', fontSize: '13px', fontWeight: 600, cursor: !selectedDocId || isGenerating ? 'not-allowed' : 'pointer', fontFamily: T.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}>
          {isGenerating
            ? <><Loader2 size={14} style={{ animation: 'jabari-spin 1s linear infinite' }} /> Generating…</>
            : <><Wand2 size={14} /> Generate Draft</>}
        </button>

        {!selectedDocId && (
          <p style={{ fontSize: '11px', color: T.faint, textAlign: 'center', marginTop: '8px' }}>Select a document to enable</p>
        )}
      </aside>

      {/* ── MAIN EDITOR AREA ── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 1rem 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', border: `0.5px solid ${T.border}`, boxShadow: '0 2px 20px rgba(26,26,26,0.07)', background: '#fff', overflow: 'hidden' }}>

          {/* ── Top bar ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', height: '52px', borderBottom: `0.5px solid ${T.border}`, flexShrink: 0, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: T.muted, fontFamily: T.sans }}>
                {hasDraft ? (draft?.title || DRAFT_TYPES.find(t => t.id === draftType)?.label) : 'Untitled Draft'}
              </span>
            </div>
            {hasDraft && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Word count badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 10px', borderRadius: '6px', background: T.surface2, fontSize: '11px', color: T.muted, fontFamily: T.sans }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={10} /> {wordCount.toLocaleString()} words</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {readingMins} min read</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={10} /> ~{estPages} {estPages === 1 ? 'page' : 'pages'}</span>
                </div>
                <div style={{ width: '0.5px', height: '16px', background: T.border }} />
                {/* Copy */}
                <button onClick={copyToClipboard}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: `0.5px solid ${T.border}`, borderRadius: '7px', background: 'transparent', color: T.muted, fontSize: '12px', cursor: 'pointer', fontFamily: T.sans }}>
                  {copySuccess ? <><CheckCircle2 size={13} style={{ color: '#10b981' }} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                {/* Export Markdown */}
                <button onClick={handleExportMd}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: `0.5px solid ${T.border}`, borderRadius: '7px', background: 'transparent', color: T.muted, fontSize: '12px', cursor: 'pointer', fontFamily: T.sans }}>
                  <Type size={13} /> .md
                </button>
                {/* Export DOCX */}
                <button onClick={handleExportDocx} disabled={isExporting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '7px', background: T.ink, color: '#fff', fontSize: '12px', fontWeight: 500, cursor: isExporting ? 'not-allowed' : 'pointer', fontFamily: T.sans, opacity: isExporting ? 0.7 : 1 }}>
                  {isExporting ? <><Loader2 size={13} style={{ animation: 'jabari-spin 1s linear infinite' }} /> Exporting…</> : <><Download size={13} /> Export Word</>}
                </button>
              </div>
            )}
          </div>

          {/* ── Vault references banner ── */}
          {hasDraft && draft?.reused_from?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 1.5rem', borderBottom: `0.5px solid rgba(184,134,11,0.2)`, background: 'rgba(184,134,11,0.06)', flexShrink: 0 }}>
              <BookOpen size={13} style={{ color: T.accent, marginTop: '2px', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: T.accent, fontFamily: T.sans, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reused from vault — </span>
                <span style={{ fontSize: '11px', color: T.muted, fontFamily: T.sans }}>These past proposals were referenced to build this draft:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {draft.reused_from.map((r, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '20px', background: 'rgba(184,134,11,0.10)', border: `0.5px solid rgba(184,134,11,0.25)`, fontSize: '11px', color: '#7a5800', fontFamily: T.sans }}>
                      <FileText size={10} />
                      {r.filename}
                      <span style={{ opacity: 0.6 }}>{Math.round(r.similarity * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          {hasDraft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '6px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.cream, flexWrap: 'wrap', flexShrink: 0 }}>
              <button style={tb(false)} onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo2 size={13} /></button>
              <button style={tb(false)} onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo2 size={13} /></button>
              <div style={sep} />
              <button style={tb(editor?.isActive('heading', { level: 1 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></button>
              <button style={tb(editor?.isActive('heading', { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></button>
              <button style={tb(editor?.isActive('heading', { level: 3 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></button>
              <div style={sep} />
              <button style={tb(editor?.isActive('bold'))} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={14} /></button>
              <button style={tb(editor?.isActive('italic'))} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={14} /></button>
              <button style={tb(editor?.isActive('underline'))} onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={14} /></button>
              <button style={tb(editor?.isActive('strike'))} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></button>
              <div style={sep} />
              <button style={tb(editor?.isActive({ textAlign: 'left' }))} onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={14} /></button>
              <button style={tb(editor?.isActive({ textAlign: 'center' }))} onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={14} /></button>
              <button style={tb(editor?.isActive({ textAlign: 'right' }))} onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={14} /></button>
              <button style={tb(editor?.isActive({ textAlign: 'justify' }))} onClick={() => editor?.chain().focus().setTextAlign('justify').run()}><AlignJustify size={14} /></button>
              <div style={sep} />
              <button style={tb(editor?.isActive('bulletList'))} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={14} /></button>
              <button style={tb(editor?.isActive('orderedList'))} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></button>
              <div style={sep} />
              <button style={tb(false)} onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table size={14} /></button>
            </div>
          )}

          {/* ── Canvas ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Empty state */}
            {!draft && !isGenerating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <FileText size={28} style={{ color: T.faint }} />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: T.ink2, margin: '0 0 8px', fontFamily: T.serif, fontStyle: 'italic' }}>Canvas is ready</p>
                <p style={{ fontSize: '13px', color: T.faint, margin: 0, maxWidth: '320px', lineHeight: 1.6 }}>
                  Select a source document on the left and choose a document type, then hit Generate Draft.
                </p>
                {!selectedDocId && (
                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '340px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: T.faint, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>Available types</p>
                    {DRAFT_TYPES.map(t => (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: `0.5px solid ${T.border}`, borderRadius: '8px', background: T.surface }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.color }}>{React.cloneElement(t.icon, { size: 13 })}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, color: T.ink }}>{t.label}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: T.faint }}>{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generating */}
            {isGenerating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '16px' }}>
                <div style={{ position: 'relative', width: '48px', height: '48px' }}>
                  <Loader2 size={48} style={{ color: T.ink, animation: 'jabari-spin 1s linear infinite', opacity: 0.15 }} />
                  <Wand2 size={18} style={{ position: 'absolute', inset: 0, margin: 'auto', color: T.ink }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: T.ink, margin: '0 0 4px', fontFamily: T.serif, fontStyle: 'italic' }}>Drafting your document…</p>
                  <p style={{ fontSize: '12px', color: T.faint, margin: 0 }}>Analysing source, structuring content</p>
                </div>
              </div>
            )}

            {/* Error */}
            {draft?.error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
                <AlertCircle size={32} style={{ color: '#ef4444' }} />
                <p style={{ fontSize: '13px', color: '#b91c1c', fontFamily: T.sans }}>{draft.error}</p>
                <button onClick={handleGenerate} style={{ padding: '8px 20px', border: `0.5px solid ${T.border}`, borderRadius: '8px', background: 'transparent', color: T.ink, fontSize: '13px', cursor: 'pointer', fontFamily: T.sans }}>Try again</button>
              </div>
            )}

            {/* Editor */}
            {hasDraft && <EditorContent editor={editor} />}
          </div>

          {/* ── Status bar ── */}
          {hasDraft && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 1.5rem', borderTop: `0.5px solid ${T.border2}`, background: T.surface, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={11} style={{ color: T.faint }} />
                <span style={{ fontSize: '10px', color: T.faint, fontFamily: T.sans }}>AI-generated — review before submission</span>
              </div>
              <span style={{ fontSize: '10px', color: T.faint, fontFamily: T.sans }}>{DRAFT_TYPES.find(t => t.id === draftType)?.label}</span>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes jabari-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .jabari-editor { min-height: 500px; padding: 3rem 4rem; font-family: 'Lora', Georgia, serif; font-size: 15px; line-height: 1.9; color: #3d3d3a; outline: none; }
        .jabari-editor h1 { font-size: 26px; font-weight: 700; margin: 24px 0 12px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; letter-spacing: -0.02em; }
        .jabari-editor h2 { font-size: 20px; font-weight: 600; margin: 20px 0 10px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; }
        .jabari-editor h3 { font-size: 15px; font-weight: 600; margin: 16px 0 8px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.04em; }
        .jabari-editor p { margin-bottom: 14px; }
        .jabari-editor ul { padding-left: 24px; margin-bottom: 14px; list-style-type: disc; }
        .jabari-editor ol { padding-left: 24px; margin-bottom: 14px; list-style-type: decimal; }
        .jabari-editor li { margin-bottom: 6px; }
        .jabari-editor strong { font-weight: 700; color: #1a1a1a; }
        .jabari-editor table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px; }
        .jabari-editor th { background: rgba(26,26,26,0.04); font-weight: 600; padding: 10px 14px; border: 1px solid rgba(26,26,26,0.12); text-align: left; }
        .jabari-editor td { padding: 10px 14px; border: 1px solid rgba(26,26,26,0.08); }
        .jabari-editor tr:hover td { background: rgba(26,26,26,0.015); }
        .jabari-editor blockquote { border-left: 3px solid #B8860B; padding-left: 18px; font-style: italic; color: #6b6b68; margin: 20px 0; background: rgba(184,134,11,0.04); padding: 12px 18px; border-radius: 0 6px 6px 0; }
        .jabari-editor .selectedCell { background: rgba(26,26,26,0.05); }
        .jabari-editor:focus-visible { outline: none; }
      `}</style>
    </div>
  );
};

export default DraftsView;
