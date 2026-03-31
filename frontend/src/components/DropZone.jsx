import React, { useState } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';
import axios from 'axios';

const DropZone = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Points to our FastAPI backend
      const response = await axios.post('http://localhost:8000/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Upload failed. Is the backend running?");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <label 
        className={`
          w-full max-w-2xl h-64 flex flex-col items-center justify-center 
          border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300
          ${isUploading ? 'bg-slate-900 border-blue-500' : 'bg-slate-950 border-white/10 hover:border-blue-500 hover:bg-slate-900'}
        `}
      >
        {!isUploading ? (
          <>
            <div className="p-4 bg-blue-500/10 rounded-full mb-4">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-xl font-medium text-white mb-2">Initialize your Vault</p>
            <p className="text-sm text-white/50">Drop your PDF or Word Tenders here</p>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx" />
          </>
        ) : (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-white">The Vault is Analyzing...</p>
            <p className="text-sm text-white/50 mt-2 italic font-serif">OCR & Semantic Parsing in progress</p>
          </div>
        )}
      </label>
      
      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default DropZone;
