
import React, { useCallback, useState, useEffect } from 'react';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const LOADING_MESSAGES = [
  "Učitavam video...",
  "Analiziram zvuk...",
  "Prepoznajem srpski govor...",
  "Generišem titlove...",
  "Fino podešavam tajming...",
  "Skoro gotovo..."
];

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onUpload(file);
      } else {
        alert('Molimo unesite validan video fajl.');
      }
    }
  }, [onUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div 
        className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center gap-6 cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'}
          ${isLoading ? 'opacity-100 bg-slate-900 border-blue-500/30' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && document.getElementById('video-input')?.click()}
      >
        <input 
          id="video-input" 
          type="file" 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileInput} 
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                <i className="fa-solid fa-robot"></i>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-white transition-all duration-500 min-h-[28px]">
                {LOADING_MESSAGES[loadingStep]}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">
                Gemini AI procesira zahtev
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up text-4xl text-blue-400"></i>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ubaci svoj video</h2>
              <p className="text-slate-400">Klikni ili prevuci fajl ovde da započneš</p>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              MP4, MOV, WEBM (do 10MB preporučeno)
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
