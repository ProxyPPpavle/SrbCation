
import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader.tsx';
import VideoPreview from './components/VideoPreview.tsx';
import CustomizationPanel from './components/CustomizationPanel.tsx';
import CaptionList from './components/CaptionList.tsx';
import { Caption, CaptionStyle, VideoData } from './types.ts';
import { DEFAULT_STYLE } from './constants.ts';
import { transcribeVideo } from './services/geminiService.ts';

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
      setError(err.message || 'Greška prilikom obrade videa.');
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

  const handleCaptionTimeUpdate = (id: string, field: 'start' | 'end', value: number) => {
    setCaptions(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      
      const newCaptions = [...prev];
      const sanitizedValue = Math.max(0, parseFloat(value.toFixed(2)));
      
      newCaptions[index] = { ...newCaptions[index], [field]: sanitizedValue };

      // Chained logic: End -> Next Start
      if (field === 'end' && index < newCaptions.length - 1) {
        newCaptions[index + 1] = { ...newCaptions[index + 1], start: sanitizedValue };
      }
      
      // Chained logic: Start -> Prev End
      if (field === 'start' && index > 0) {
        newCaptions[index - 1] = { ...newCaptions[index - 1], end: sanitizedValue };
      }

      return newCaptions;
    });
  };

  const handleCaptionDelete = (id: string) => {
    setCaptions(prev => prev.filter(c => c.id !== id));
  };

  const handleSplitToWords = () => {
    const newCaptions: Caption[] = [];
    captions.forEach(c => {
      const words = c.text.split(/\s+/).filter(Boolean);
      if (words.length <= 1) {
        newCaptions.push(c);
        return;
      }
      
      const totalDuration = c.end - c.start;
      const wordDuration = totalDuration / words.length;
      
      words.forEach((word, idx) => {
        const start = parseFloat((c.start + idx * wordDuration).toFixed(2));
        const end = parseFloat((c.start + (idx + 1) * wordDuration).toFixed(2));
        newCaptions.push({
          id: `split-${c.id}-${idx}-${Date.now()}`,
          text: word,
          start,
          end
        });
      });
    });
    setCaptions(newCaptions);
  };

  const handleReset = () => {
    if (window.confirm("Da li ste sigurni da želite da se vratite? Svi trenutni titlovi će biti obrisani.")) {
      if (video) URL.revokeObjectURL(video.url);
      setVideo(null);
      setCaptions([]);
      setError(null);
      setStyle(DEFAULT_STYLE);
    }
  };

  const handleExport = async () => {
    if (!video) return;
    setIsExporting(true);
    alert('Export funkcija: Pregledajte video sa titlovima. Snimanje finalnog fajla sa ugrađenim titlovima je planirano u sledećoj verziji.');
    setIsExporting(false);
  };

  useEffect(() => {
    return () => {
      if (video?.url) {
        URL.revokeObjectURL(video.url);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          {video && (
            <button 
              onClick={handleReset} 
              className="mr-2 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all shadow-inner"
              title="Nazad na početak"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
            </button>
          )}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-closed-captioning text-white text-sm"></i>
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Srb Caption
          </h1>
        </div>

        {video && !isLoading && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Status</span>
               <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 SPREMNO
               </span>
            </div>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {isExporting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-download"></i>}
              Eksportuj
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden">
        {!video || (video && isLoading && captions.length === 0) ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3 max-w-lg animate-fade">
                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-slate-500 hover:text-white">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}
            <VideoUploader onUpload={handleUpload} isLoading={isLoading} />
          </div>
        ) : (
          <div className="flex w-full h-full animate-fade">
            <div className="w-80 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900">
               <CaptionList 
                captions={captions} 
                onUpdate={handleCaptionUpdate} 
                onTimeUpdate={handleCaptionTimeUpdate}
                onDelete={handleCaptionDelete} 
                onSplitToWords={handleSplitToWords}
               />
            </div>
            <div className="flex-1 flex flex-col bg-black/40 p-4 min-w-0">
               <VideoPreview videoUrl={video.url} captions={captions} style={style} />
               {error && (
                 <div className="mt-2 p-2 bg-red-500/20 text-red-400 text-[10px] text-center rounded border border-red-500/30">
                   {error}
                 </div>
               )}
            </div>
            <CustomizationPanel style={style} onChange={handleStyleChange} />
          </div>
        )}
      </main>

      <footer className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Gemini 2.5 Pro Engine</span>
          <span className="opacity-30">|</span>
          <span className="text-slate-600">Srb Caption - AI Editor</span>
        </div>
        <div className="flex items-center gap-3">
           <span className="font-mono opacity-50 uppercase tracking-tighter">verzija 1.5.8</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
