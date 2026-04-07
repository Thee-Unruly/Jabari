import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Jabari design tokens — mirrored from the marketing HTML
   ───────────────────────────────────────────────────────────── */
const tokens = {
  darkBg: '#111110',
  darkSurface: '#1c1c1a',
  darkSurface2: '#242421',
  darkBorder: 'rgba(255,255,255,0.07)',
  darkBorder2: 'rgba(255,255,255,0.12)',
  cream: '#F5F2ED',
  ink: '#1a1a1a',
  muted: '#6b6b68',
  faint: '#9a9a96',
  greenText: '#52b788',
  greenDark: '#1a3020',
};

/* Inline style objects so zero Tailwind config is needed */
const s = {
  wrapper: {
    width: '100%',
    maxWidth: '640px',
    margin: '0 auto',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  zone: (isUploading, hasError) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '320px',
    border: `1.5px dashed ${hasError ? 'rgba(196,90,90,0.4)' : 'rgba(26,26,26,0.15)'}`,
    borderRadius: '12px',
    background: 'rgba(26,26,26,0.04)',
    cursor: isUploading ? 'default' : 'pointer',
    transition: 'border-color 0.25s, background 0.25s',
    padding: '2.5rem',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  }),

  zoneHoverPatch: {
    borderColor: 'rgba(26,26,26,0.28)',
    background: 'rgba(26,26,26,0.07)',
  },

  iconRing: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(26,26,26,0.06)',
    border: '1px solid rgba(26,26,26,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    transition: 'border-color 0.2s',
  },

  uploadIcon: { color: tokens.muted, width: '22px', height: '22px' },

  headline: {
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '20px',
    fontWeight: 400,
    fontStyle: 'italic',
    color: tokens.ink,
    letterSpacing: '-0.01em',
    marginBottom: '6px',
    textAlign: 'center',
  },

  eyebrow: {
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: tokens.faint,
    marginBottom: '2rem',
    textAlign: 'center',
  },

  cta: {
    background: tokens.ink,
    color: tokens.cream,
    border: 'none',
    borderRadius: '24px',
    padding: '10px 28px',
    fontSize: '12px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontWeight: 500,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    textTransform: 'uppercase',
  },

  /* uploading state */
  loaderWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' },
  loaderLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: tokens.ink,
    marginBottom: '6px',
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  loaderSub: {
    fontSize: '10px',
    fontWeight: 400,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: tokens.muted,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  progressTrack: {
    width: '200px',
    height: '2px',
    background: 'rgba(26,26,26,0.12)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: tokens.ink,
    transition: 'width 0.3s ease',
  }),

  /* error state */
  errorLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#c45a5a',
    marginBottom: '8px',
    marginTop: '1.5rem',
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: '12px',
    color: tokens.muted,
    textAlign: 'center',
    maxWidth: '300px',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  retryBtn: {
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: tokens.faint,
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  /* footer pills */
  footer: {
    marginTop: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    opacity: 0.35,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '9px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: tokens.muted,
  },
};

/* ─── Component ─────────────────────────────────────────────── */
const DropZone = ({ onUploadSuccess, activeTenderId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(false);

  const processFile = async (file) => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (activeTenderId) {
      formData.append('tender_id', activeTenderId.toString());
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const response = await axios.post(`${baseUrl}/ingest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(pct);
        },
      });
      onUploadSuccess(response.data);
      setIsUploading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Vault ingestion failed — check connection');
      setIsUploading(false);
    }
  };

  const onFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHovered(false);
    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setHovered(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHovered(false);
  };

  const zoneStyle = {
    ...s.zone(isUploading, !!error),
    ...(hovered && !isUploading && !error ? s.zoneHoverPatch : {}),
  };

  return (
    <div style={s.wrapper}>
      <label
        htmlFor="jabari-file-upload"
        style={zoneStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ── Uploading ── */}
        {isUploading && (
          <div style={s.loaderWrap}>
            <Loader2
              style={{
                width: '40px', height: '40px',
                color: tokens.ink,
                animation: 'jabari-spin 1s linear infinite',
              }}
            />
            <p style={s.loaderLabel}>Ingesting into Vault</p>
            <p style={s.loaderSub}>{progress}% synchronized</p>
            <div style={s.progressTrack}>
              <div style={s.progressFill(progress)} />
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {!isUploading && error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AlertCircle style={{ width: '36px', height: '36px', color: '#c45a5a' }} />
            <p style={s.errorLabel}>Vault Access Error</p>
            <p style={s.errorMsg}>{error}</p>
            <button style={s.retryBtn} onClick={(e) => { e.preventDefault(); setError(null); }}>
              Retry ingestion
            </button>
          </div>
        )}

        {/* ── Idle ── */}
        {!isUploading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={s.iconRing}>
              <Upload style={s.uploadIcon} />
            </div>
            <p style={s.headline}>Deposit Tender Intelligence</p>
            <p style={s.eyebrow}>PDF · DOCX · Scan · Image</p>
            <div style={s.cta} onMouseOver={e => e.currentTarget.style.opacity = '0.82'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              Upload to Vault
            </div>
          </div>
        )}

        <input
          id="jabari-file-upload"
          type="file"
          style={{ display: 'none' }}
          onChange={onFileChange}
          disabled={isUploading}
        />
      </label>

      {/* ── Trust footer ── */}
      <div style={s.footer}>
        {[
          'Encryption Verified',
          'OCR Pipeline Ready',
          'AI Model Initialized',
        ].map((label) => (
          <div key={label} style={s.pill}>
            <CheckCircle2 style={{ width: '10px', height: '10px' }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Spin keyframe injected once */}
      <style>{`@keyframes jabari-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DropZone;