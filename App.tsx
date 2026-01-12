
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
  const [style, setStyle] = useState<CaptionStyle>(prev => {
    // Pokušaj učitavanja prethodnih podešavanja iz browsera
    const saved = localStorage.getItem('srb_caption_style');
    return saved ? JSON.parse(saved) : DEFAULT_STYLE;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Sačuvaj stil kad god se promeni
  useEffect(() => {
    localStorage.setItem('srb_caption_style', JSON.stringify(style));
  }, [style]);
  
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

      if (field === 'end' && index < newCaptions.length - 1) {
        newCaptions[index + 1] = { ...newCaptions[index + 1], start: sanitizedValue };
      }
      
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
    }
  };

  const handleExport = async () => {
    if (!video) return;
    
    // 1. Otvori SmartLink u novom tabu (Adsterra)
    window.open('https://is.gd/8GvRR9', '_blank');

    setIsExporting(true);
    setExportProgress(0);

    try {
      const videoEl = document.createElement('video');
      videoEl.src = video.url;
      videoEl.muted = true;
      videoEl.crossOrigin = "anonymous";
      
      await new Promise((resolve) => {
        videoEl.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context error");

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000 
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      const downloadPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `SrbCaption_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      mediaRecorder.start();

      // BRZI RENDER: Ne puštamo video, nego skačemo s frejma na frejm
      const fps = 30;
      const step = 1 / fps;
      let currentTime = 0;

      while (currentTime < videoEl.duration) {
        videoEl.currentTime = currentTime;
        
        // Čekamo da browser izrenda frejm na toj poziciji
        await new Promise((resolve) => {
          videoEl.onseeked = resolve;
        });

        // 1. Crtanje videa
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        // 2. Pronalaženje aktivnog titla za trenutno vreme
        const active = captions.find(c => currentTime >= c.start && currentTime <= c.end);
        
        if (active) {
          let textToDraw = active.text;

          // Isti sistem podele na reči kao u VideoPreview.tsx
          if (style.displayMode !== 'sentence') {
            const words = active.text.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              const duration = active.end - active.start;
              const wordDuration = duration / words.length;
              const currentWordIndex = Math.floor((currentTime - active.start) / wordDuration);
              const safeIndex = Math.max(0, Math.min(currentWordIndex, words.length - 1));

              if (style.displayMode === 'word') {
                textToDraw = words[safeIndex] || '';
              } else if (style.displayMode === 'two-words') {
                const startIndex = Math.floor(safeIndex / 2) * 2;
                textToDraw = words.slice(startIndex, startIndex + 2).join(' ');
              }
            }
          }

          // Procesuiranje stila (pismo, znakovi)
          if (style.removePunctuation) textToDraw = textToDraw.replace(/[.,?!:;]/g, "");
          if (style.casing === 'uppercase') textToDraw = textToDraw.toUpperCase();
          else if (style.casing === 'lowercase') textToDraw = textToDraw.toLowerCase();
          else if (style.casing === 'titlecase') {
            textToDraw = textToDraw.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }

          // Podešavanje Canvas parametara (SKALIRANJE)
          const scaleFactor = canvas.height / 720; // Bazirano na 720p previewu
          const finalFontSize = style.fontSize * scaleFactor;
          
          ctx.font = `${style.isBold ? '900' : '500'} ${finalFontSize}px "${style.fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Pozicija
          let x = canvas.width / 2 + (style.offsetX / 100) * canvas.width;
          let y = canvas.height * 0.85 + (style.offsetY * scaleFactor);
          if (style.position === 'top') y = canvas.height * 0.15 + (style.offsetY * scaleFactor);
          if (style.position === 'middle') y = canvas.height * 0.5 + (style.offsetY * scaleFactor);

          // SENKE (Stacking za jači efekat)
          if (style.shadowOpacity > 0) {
            ctx.shadowColor = style.shadowColor;
            ctx.shadowBlur = style.shadowBlur;
            ctx.shadowOffsetX = style.shadowOffsetX;
            ctx.shadowOffsetY = style.shadowOffsetY;
            // Prvi prolaz senke
            ctx.fillText(textToDraw, x, y);
            // Drugi prolaz za dodatni punch (kao u CSS-u)
            ctx.shadowBlur = style.shadowBlur * 0.2;
            ctx.shadowOffsetX = style.shadowOffsetX * 0.5;
            ctx.shadowOffsetY = style.shadowOffsetY * 0.5;
            ctx.fillText(textToDraw, x, y);
          }

          // GLOW
          if (style.glowIntensity > 0) {
            ctx.shadowColor = style.glowColor;
            ctx.shadowBlur = style.glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillText(textToDraw, x, y);
          }

          // STROKE
          if (style.strokeWidth > 0) {
            ctx.shadowBlur = 0; // Reset da stroke ne bi bio "sjajan"
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = style.strokeWidth * scaleFactor * 2;
            ctx.lineJoin = 'round';
            ctx.strokeText(textToDraw, x, y);
          }

          // FINALNI FILL (Tekst na vrhu)
          ctx.shadowBlur = 0;
          ctx.fillStyle = style.color;
          ctx.fillText(textToDraw, x, y);
        }

        currentTime += step;
        setExportProgress(Math.round((currentTime / videoEl.duration) * 100));
      }

      mediaRecorder.stop();
      await downloadPromise;
      
    } catch (err: any) {
      console.error(err);
      alert("Greška: Browser je odbio rendering. Probaj ponovo ili koristi Chrome.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

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
              className={`bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Rendering {exportProgress}%
                </>
              ) : (
                <>
                  <i className="fa-solid fa-download"></i>
                  Eksportuj Video
                </>
              )}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Export Overlay */}
        {isExporting && (
          <div className="absolute inset-0 z-[100] bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center animate-fade">
            <div className="w-24 h-24 mb-6 relative">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-slate-800 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                <circle 
                  className="text-blue-500 stroke-current transition-all duration-300" 
                  strokeWidth="8" 
                  strokeDasharray={2 * Math.PI * 40} 
                  strokeDashoffset={2 * Math.PI * 40 * (1 - exportProgress / 100)} 
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white">
                {exportProgress}%
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">UBRZANI RENDERING...</h2>
            <p className="text-slate-400 max-w-md">
              Sada "lepimo" titlove direktno u video frejm po frejm. Molimo te da ne zatvaraš tab dok se proces ne završi.
            </p>
            <div className="mt-8 flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
              <i className="fa-solid fa-bolt"></i>
              Turbo Export v2.1
            </div>
          </div>
        )}

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
           <span className="font-mono opacity-50 uppercase tracking-tighter">verzija 2.1.0 PRO</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
