
import React, { useCallback, useState } from 'react';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

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
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('video-input')?.click()}
      >
        <input 
          id="video-input" 
          type="file" 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileInput} 
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-medium text-slate-300">AI čita video na srpskom...</p>
            <p className="text-sm text-slate-500 italic">Ovo može potrajati par trenutaka</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-cloud-arrow-up text-4xl text-blue-400"></i>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ubaci svoj video</h2>
              <p className="text-slate-400">Klikni ili prevuci fajl ovde da započneš</p>
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
              Podržava MP4, MOV, WEBM
            </div>
          </>
        )}
      </div>
      
      {!isLoading && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-center">
          <div className="p-4">
            <i className="fa-solid fa-language text-blue-400 mb-2"></i>
            <h3 className="font-semibold">Srpska latinica</h3>
            <p className="text-sm text-slate-400">Potpuna podrška za naše pismo</p>
          </div>
          <div className="p-4">
            <i className="fa-solid fa-wand-magic-sparkles text-purple-400 mb-2"></i>
            <h3 className="font-semibold">Pametna transkripcija</h3>
            <p className="text-sm text-slate-400">Automatsko prepoznavanje govora</p>
          </div>
          <div className="p-4">
            <i className="fa-solid fa-palette text-pink-400 mb-2"></i>
            <h3 className="font-semibold">Moderan stil</h3>
            <p className="text-sm text-slate-400">Prilagodi izgled brendu</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
