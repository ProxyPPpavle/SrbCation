
import React, { useState, useEffect, useRef } from 'react';
import VideoUploader from './components/VideoUploader';
import VideoPreview from './components/VideoPreview';
import CustomizationPanel from './components/CustomizationPanel';
import CaptionList from './components/CaptionList';
import { Caption, CaptionStyle, VideoData } from './types';
import { DEFAULT_STYLE } from './constants';
import { transcribeVideo } from './services/geminiService';

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [style, setStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = URL.createObjectURL(file);
      setVideo({ file, url });
      
      const transcribedCaptions = await transcribeVideo(file);
      setCaptions(transcribedCaptions);
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške prilikom obrade videa.');
      setVideo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleChange = (newStyle: Partial<CaptionStyle>) => {
    setStyle(prev => ({ ...prev, ...newStyle }));
  };

  const handleCaptionUpdate = (id: string, text: string) => {
    setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  };

  const handleCaptionDelete = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const handleReset = () => {
    if (video) URL.revokeObjectURL(video.url);
    setVideo(null);
    setCaptions([]);
    setError(null);
  };

  const handleExport = async () => {
    if (!video) return;
    setIsExporting(true);
    alert('Export simulacija: Pustite video do kraja kako biste snimili titlove. U realnoj verziji se koristi Canvas snimanje (uskoro dostupno).');
    setIsExporting(false);
  };

  useEffect(() => {
    return () => {
      if (video) URL.revokeObjectURL(video.url);
    };
  }, [video]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-closed-captioning text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-tight">
              Srb Caption
            </h1>
          </div>
        </div>

        {video && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReset}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
            >
              Restart
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className={`${isExporting ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white text-xs font-bold px-5 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20`}
            >
              {isExporting ? (
                <><i className="fa-solid fa-circle-notch animate-spin"></i> Snimam...</>
              ) : (
                <><i className="fa-solid fa-download"></i> Eksportuj</>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {!video ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}
            <VideoUploader onUpload={handleUpload} isLoading={isLoading} />
          </div>
        ) : (
          <div className="flex w-full h-full">
            {/* Editor Sidebar */}
            <div className="w-72 shrink-0 border-r border-slate-800 flex flex-col">
               <CaptionList 
                captions={captions} 
                onUpdate={handleCaptionUpdate} 
                onDelete={handleCaptionDelete} 
               />
            </div>

            {/* Preview Section */}
            <div className="flex-1 flex flex-col bg-black/20 p-4 min-w-0">
               <VideoPreview 
                  videoUrl={video.url} 
                  captions={captions} 
                  style={style} 
               />
            </div>

            {/* Customization Sidebar */}
            <CustomizationPanel style={style} onChange={handleStyleChange} />
          </div>
        )}
      </main>

      {/* Footer / Status Bar */}
      <footer className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> AI Status: Online</span>
          {video && (
            <div className="flex items-center gap-2 ml-2 border-l border-slate-800 pl-4">
              <span className="flex items-center gap-1.5">
                <kbd className="bg-slate-800 px-1 rounded border border-slate-700 text-slate-300">SPACE</kbd> Play/Pause
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
           <span className="hidden sm:inline italic">Cena obrade: ~0.0001$ po videu</span>
           <span className="font-mono opacity-50">v1.3.0</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
