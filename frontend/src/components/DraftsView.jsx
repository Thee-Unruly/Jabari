// DraftsView — TipTap rich text editor
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, Wand2, Download, Copy, Loader2, AlertCircle,
  CheckCircle2, Check, ChevronDown,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3,
  Undo2, Redo2, Table,
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
  serif: "'Lora', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif",
};

const DRAFT_TYPES = [
  { id: 'technical_proposal', label: 'Technical Proposal' },
  { id: 'cover_letter', label: 'Executive Cover Letter' },
  { id: 'compliance_matrix', label: 'Compliance Matrix' },
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
  const [selectedTenderId, setSelectedTenderId] = useState(null);
  const [tenders, setTenders] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTenderDropdown, setShowTenderDropdown] = useState(false);
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
      const res = await axios.post(`${base}/draft`, { document_id: selectedDocId, draft_type: draftType });
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
    setIsExporting(true);
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const res = await axios.post(`${base}/export/docx`, { title: draft.title, content: draft.content }, { responseType: 'blob' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([res.data])), download: `${draft.title.replace(/ /g, '_')}.docx` });
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const ey = { fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.faint, fontFamily: T.sans, display: 'block', marginBottom: '8px' };
  const ab = (d) => ({ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', border: `0.5px solid ${T.border}`, borderRadius: '6px', background: 'transparent', color: d ? T.faint : T.muted, fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: d ? 'not-allowed' : 'pointer', fontFamily: T.sans, opacity: d ? 0.4 : 1, transition: 'color 0.15s' });
  const tb = (a) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 'none', borderRadius: '4px', background: a ? 'rgba(26,26,26,0.10)' : 'transparent', color: a ? T.ink : T.ink2, cursor: 'pointer' });
  const sep = { width: '1px', height: '20px', background: T.border, margin: '0 4px', flexShrink: 0 };
  const dp = (o) => ({ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: `0.5px solid ${o ? T.ink : T.border}`, borderRadius: '6px', background: T.surface, color: T.ink, fontSize: '13px', cursor: 'pointer', fontFamily: T.sans, textAlign: 'left' });
  const dpl = { position: 'absolute', left: 0, right: 0, top: 'calc(100% + 4px)', zIndex: 70, background: T.cream, border: `0.5px solid ${T.border}`, borderRadius: '6px', boxShadow: '0 8px 32px rgba(26,26,26,0.12)', overflow: 'hidden' };
  const di = (a) => ({ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', border: 'none', borderBottom: `0.5px solid ${T.border2}`, background: a ? T.surface2 : 'transparent', color: a ? T.ink : T.ink2, fontSize: '13px', fontWeight: a ? 500 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: T.sans });

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: T.cream, fontFamily: T.sans }}>

      {/* LEFT PANEL */}
      <aside style={{ width: '300px', flexShrink: 0, borderRight: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', padding: '2rem', gap: '2rem', background: T.cream, overflowY: 'auto' }}>
        <div>
          <span style={ey}>Production Config</span>
          <h2 style={{ fontFamily: T.serif, fontSize: '22px', fontWeight: 400, fontStyle: 'italic', color: T.ink, margin: 0 }}>Drafting Parameters</h2>
        </div>

        {/* Workspace */}
        <div style={{ position: 'relative', zIndex: showTenderDropdown ? 60 : 20 }} ref={tenderDropdownRef}>
          <span style={ey}>Workspace Scope</span>
          <button onClick={() => { setShowTenderDropdown(p => !p); setShowDropdown(false); }} style={dp(showTenderDropdown)}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{activeTenderName ?? 'Universal Vault'}</span>
            <ChevronDown size={14} color={T.muted} style={{ flexShrink: 0, transform: showTenderDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showTenderDropdown && (
            <div style={dpl}><div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <button onClick={() => { setSelectedTenderId(null); setSelectedDocId(null); setShowTenderDropdown(false); }} style={di(selectedTenderId === null)}>Universal Vault {selectedTenderId === null && <Check size={13} color={T.ink} />}</button>
              {tenders.map(t => (
                <button key={t.id} onClick={() => { setSelectedTenderId(t.id); setSelectedDocId(null); setShowTenderDropdown(false); }} style={di(selectedTenderId === t.id)}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{t.name}</span>
                  {selectedTenderId === t.id && <Check size={13} color={T.ink} />}
                </button>
              ))}
            </div></div>
          )}
        </div>

        {/* Source */}
        <div style={{ position: 'relative', zIndex: showDropdown ? 50 : 10 }} ref={dropdownRef}>
          <span style={ey}>Source Material</span>
          <button onClick={() => { setShowDropdown(p => !p); setShowTenderDropdown(false); }} style={{ ...dp(showDropdown), color: selectedDocId ? T.ink : T.muted }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{activeSourceName ?? 'Select Vaulted Source…'}</span>
            <ChevronDown size={14} color={T.muted} style={{ flexShrink: 0, transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showDropdown && (
            <div style={dpl}><div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filteredSources.length === 0 && <div style={{ padding: '14px', fontSize: '11px', color: T.faint, textAlign: 'center', fontStyle: 'italic' }}>No vaulted sources in this scope</div>}
              {filteredSources.map(doc => (
                <button key={doc.id} onClick={() => { setSelectedDocId(doc.id); setShowDropdown(false); }} style={di(selectedDocId === doc.id)}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{doc.name}</span>
                  {selectedDocId === doc.id && <Check size={13} color={T.ink} />}
                </button>
              ))}
            </div></div>
          )}
        </div>

        {/* Artifact type */}
        <div>
          <span style={ey}>Artifact Type</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {DRAFT_TYPES.map(type => (
              <button key={type.id} onClick={() => setDraftType(type.id)} style={{ padding: '11px 14px', textAlign: 'left', border: `0.5px solid ${draftType === type.id ? T.ink : T.border}`, borderRadius: '6px', background: draftType === type.id ? T.ink : 'transparent', color: draftType === type.id ? T.cream : T.muted, fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: T.sans, transition: 'all 0.15s' }}>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate */}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleGenerate} disabled={!selectedDocId || isGenerating} style={{ width: '100%', padding: '13px', borderRadius: '24px', border: 'none', background: !selectedDocId || isGenerating ? T.surface2 : T.ink, color: !selectedDocId || isGenerating ? T.faint : T.cream, fontSize: '12px', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: !selectedDocId || isGenerating ? 'not-allowed' : 'pointer', fontFamily: T.sans, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.15s' }}>
            {isGenerating ? <><Loader2 style={{ width: '14px', height: '14px', animation: 'jabari-spin 1s linear infinite' }} /> Synthesising…</> : <><Wand2 style={{ width: '14px', height: '14px' }} /> Synthesize Draft</>}
          </button>
        </div>
      </aside>

      {/* RIGHT: EDITOR */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: T.cream, display: 'flex', justifyContent: 'center' }}>
        {!draft && !isGenerating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.25, marginTop: '5rem', textAlign: 'center' }}>
            <FileText style={{ width: '64px', height: '64px', marginBottom: '1rem', color: T.ink }} />
            <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink }}>Canvas Ready for Synthesis</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '820px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.ink, opacity: 0.4 }} />
                <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>Production Preview</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyToClipboard} style={ab(false)} onMouseOver={e => e.currentTarget.style.color = T.ink} onMouseOut={e => e.currentTarget.style.color = T.muted}>
                  {copySuccess ? <><CheckCircle2 size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button onClick={handleExportDocx} disabled={isExporting} style={ab(isExporting)} onMouseOver={e => { if (!isExporting) e.currentTarget.style.color = T.ink; }} onMouseOut={e => { if (!isExporting) e.currentTarget.style.color = T.muted; }}>
                  {isExporting ? <><Loader2 size={13} style={{ animation: 'jabari-spin 1s linear infinite' }} /> Exporting…</> : <><Download size={13} /> Export Word</>}
                </button>
              </div>
            </div>

            {/* Doc shell */}
            <div style={{ background: '#fff', border: `0.5px solid ${T.border}`, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(26,26,26,0.07)' }}>
              {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '600px', gap: '12px' }}>
                  <Loader2 style={{ width: '28px', height: '28px', color: T.ink, animation: 'jabari-spin 1s linear infinite' }} />
                  <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted }}>Drafting Engine Engaged…</p>
                </div>
              ) : draft?.error ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: '#c45a5a', padding: '2rem' }}>
                  <AlertCircle size={32} />
                  <p style={{ fontSize: '13px', textAlign: 'center', fontFamily: T.sans }}>{draft.error}</p>
                </div>
              ) : draft ? (
                <>
                  {/* Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px', padding: '8px 12px', borderBottom: `0.5px solid ${T.border}`, background: '#fafaf8' }}>
                    <button style={tb(false)} onClick={() => editor?.chain().focus().undo().run()} title="Undo"><Undo2 size={14} /></button>
                    <button style={tb(false)} onClick={() => editor?.chain().focus().redo().run()} title="Redo"><Redo2 size={14} /></button>
                    <div style={sep} />
                    <button style={tb(editor?.isActive('heading', { level: 1 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><Heading1 size={14} /></button>
                    <button style={tb(editor?.isActive('heading', { level: 2 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 size={14} /></button>
                    <button style={tb(editor?.isActive('heading', { level: 3 }))} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><Heading3 size={14} /></button>
                    <div style={sep} />
                    <button style={tb(editor?.isActive('bold'))} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold"><Bold size={14} /></button>
                    <button style={tb(editor?.isActive('italic'))} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><Italic size={14} /></button>
                    <button style={tb(editor?.isActive('underline'))} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={14} /></button>
                    <button style={tb(editor?.isActive('strike'))} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strike"><Strikethrough size={14} /></button>
                    <div style={sep} />
                    <button style={tb(editor?.isActive({ textAlign: 'left' }))} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Left"><AlignLeft size={14} /></button>
                    <button style={tb(editor?.isActive({ textAlign: 'center' }))} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Center"><AlignCenter size={14} /></button>
                    <button style={tb(editor?.isActive({ textAlign: 'right' }))} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Right"><AlignRight size={14} /></button>
                    <button style={tb(editor?.isActive({ textAlign: 'justify' }))} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} title="Justify"><AlignJustify size={14} /></button>
                    <div style={sep} />
                    <button style={tb(editor?.isActive('bulletList'))} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list"><List size={14} /></button>
                    <button style={tb(editor?.isActive('orderedList'))} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list"><ListOrdered size={14} /></button>
                    <div style={sep} />
                    <button style={tb(false)} onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert table"><Table size={14} /></button>
                  </div>

                  {/* Content */}
                  <EditorContent editor={editor} />
                </>
              ) : null}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '1.5rem', marginBottom: '3rem', padding: '14px 18px', border: `0.5px dashed ${T.border}`, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.55 }}>
              <AlertCircle style={{ width: '14px', height: '14px', color: T.muted, flexShrink: 0 }} />
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted, margin: 0, lineHeight: 1.6 }}>
                AI-generated draft. Review for technical accuracy before submission.
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes jabari-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .jabari-editor { min-height: 600px; padding: 3rem 4rem; font-family: 'Lora', Georgia, serif; font-size: 15px; line-height: 1.85; color: #3d3d3a; outline: none; }
        .jabari-editor h1 { font-size: 26px; font-weight: 700; margin: 24px 0 12px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; }
        .jabari-editor h2 { font-size: 20px; font-weight: 600; margin: 20px 0 10px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; }
        .jabari-editor h3 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; color: #1a1a1a; font-family: 'DM Sans', system-ui, sans-serif; }
        .jabari-editor p { margin-bottom: 14px; }
        .jabari-editor ul { padding-left: 24px; margin-bottom: 14px; list-style-type: disc; }
        .jabari-editor ol { padding-left: 24px; margin-bottom: 14px; list-style-type: decimal; }
        .jabari-editor li { margin-bottom: 6px; }
        .jabari-editor strong { font-weight: 700; color: #1a1a1a; }
        .jabari-editor table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 13px; }
        .jabari-editor th { background: rgba(26,26,26,0.04); font-weight: 600; padding: 10px 12px; border: 1px solid rgba(26,26,26,0.12); text-align: left; }
        .jabari-editor td { padding: 10px 12px; border: 1px solid rgba(26,26,26,0.10); }
        .jabari-editor blockquote { border-left: 2px solid #9a9a96; padding-left: 16px; font-style: italic; color: #6b6b68; margin: 20px 0; }
        .jabari-editor .selectedCell { background: rgba(26,26,26,0.05); }
      `}</style>
    </div>
  );
};

export default DraftsView;

