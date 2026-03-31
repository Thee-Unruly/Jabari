import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Upload, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const DropZone = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("--- INITIATING VAULT UPLOAD ---", file.name);
      const response = await axios.post('http://127.0.0.1:8500/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s timeout for deep neural analysis
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      console.log("--- UPLOAD SUCCESS ---", response.data);
      onUploadSuccess(response.data);
      setIsUploading(false);
    } catch (err) {
      console.error("VAULT UPLOAD ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Vault Ingestion Failed (Check Connection)');
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <label 
        className={`
          flex flex-col items-center justify-center w-full h-80 
          border-2 border-dashed rounded-lg cursor-pointer
          transition-all duration-300 group
          ${isUploading ? 'bg-jabari-surface border-jabari-gray/20' : 'bg-jabari-surface/50 border-jabari-border hover:bg-jabari-surface hover:border-jabari-gray/30'}
        `}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-12 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-jabari-cream animate-spin mb-6" />
              <p className="text-sm font-black uppercase tracking-widest text-jabari-cream mb-2">INTELLIGENCE INGESTION IN PROGRESS</p>
              <p className="text-[10px] font-bold text-jabari-gray uppercase tracking-widest">{progress}% VAULT_SYNCHRONIZATION</p>
              
              <div className="w-64 h-1 bg-jabari-border mt-8 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-jabari-cream transition-all duration-300"
                   style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-jabari-cream mb-6" />
              <p className="text-sm font-black uppercase tracking-widest text-jabari-cream mb-2">VAULT_ACCESS ERROR</p>
              <p className="text-xs text-jabari-dim uppercase tracking-widest max-w-xs">{error}</p>
              <p className="mt-8 text-[10px] font-black underline cursor-pointer text-jabari-gray" onClick={() => setError(null)}>RETRY INGESTION_CHAIN</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-jabari-surface2 border border-jabari-border flex items-center justify-center mb-8 group-hover:border-jabari-gray/30 transition-all">
                <Upload className="w-6 h-6 text-jabari-dim group-hover:text-jabari-gray" />
              </div>
              <p className="text-lg font-serif font-light text-jabari-nearWhite mb-2 italic">Deposit Tender Intelligence</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-jabari-dim mb-8">PDF // DOCX // SCAN // IMAGE</p>
              
              <div className="mt-4 px-10 py-5 rounded-sm bg-jabari-cream text-jabari-ink font-black text-xs uppercase tracking-widest transition-all group-hover:bg-jabari-white">
                Upload to Secure Vault
              </div>
            </>
          )}
        </div>
        <input type="file" className="hidden" onChange={onFileChange} disabled={isUploading} />
      </label>
      
      <div className="mt-8 flex items-center justify-center gap-12 opacity-10">
         <div className="flex items-center gap-3"><CheckCircle2 className="w-3 h-3"/><span className="text-[9px] font-bold uppercase tracking-widest uppercase">Encryption_Verified</span></div>
         <div className="flex items-center gap-3"><CheckCircle2 className="w-3 h-3"/><span className="text-[9px] font-bold uppercase tracking-widest uppercase">OCR_Pipeline_Ready</span></div>
         <div className="flex items-center gap-3"><CheckCircle2 className="w-3 h-3"/><span className="text-[9px] font-bold uppercase tracking-widest uppercase">AI_Model_Llama-3-Initialized</span></div>
      </div>
    </div>
  );
};

export default DropZone;
