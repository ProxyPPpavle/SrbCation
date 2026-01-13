
import React, { useCallback, useState } from 'react';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) onUpload(file);
    }
  }, [onUpload]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) onUpload(e.target.files[0]);
  };

  return (
    <div 
      className={`w-full max-w-2xl p-16 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center justify-center gap-6 cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 shadow-2xl'}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById('video-input')?.click()}
    >
      <input id="video-input" type="file" accept="video/*" className="hidden" onChange={handleFileInput} />
      <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
        <i className="fa-solid fa-cloud-arrow-up text-5xl text-white"></i>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Startuj odmah</h2>
        <p className="text-slate-500 font-medium">Klikni ili baci video fajl ovde</p>
      </div>
      <div className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black bg-slate-950 px-5 py-2 rounded-full border border-slate-800">
        MP4, MOV, WEBM
      </div>
    </div>
  );
};

export default VideoUploader;
