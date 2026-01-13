
import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader.tsx';
import VideoPreview from './components/VideoPreview.tsx';
import CustomizationPanel from './components/CustomizationPanel.tsx';
import CaptionList from './components/CaptionList.tsx';
import AdBanner from './components/AdBanner.tsx';
import { Caption, CaptionStyle, VideoData } from './types.ts';
import { DEFAULT_STYLE } from './constants.ts';
import { transcribeVideo } from './services/geminiService.ts';

const App: React.FC = () => {
  const [video, setVideo] = useState<VideoData | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [style, setStyle] = useState<CaptionStyle>(prev => {
    const saved = localStorage.getItem('srb_caption_style');
    return saved ? JSON.parse(saved) : DEFAULT_STYLE;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem('srb_caption_style', JSON.stringify(style));
  }, [style]);
  
  const handleUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    setVideo({ file, url });
    setCaptions([]);
    setIsLoading(true);

    try {
      const transcribedCaptions = await transcribeVideo(file);
      setCaptions(transcribedCaptions);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleChange = (newStyle: Partial<CaptionStyle>) => setStyle(prev => ({ ...prev, ...newStyle }));
  const handleCaptionUpdate = (id: string, text: string) => setCaptions(prev => prev.map(c => c.id === id ? { ...c, text } : c));
  const handleCaptionTimeUpdate = (id: string, field: 'start' | 'end', value: number) => {
    setCaptions(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      const newCaptions = [...prev];
      const sanitizedValue = Math.max(0, parseFloat(value.toFixed(2)));
      newCaptions[index] = { ...newCaptions[index], [field]: sanitizedValue };
      if (field === 'end' && index < newCaptions.length - 1) newCaptions[index + 1].start = sanitizedValue;
      if (field === 'start' && index > 0) newCaptions[index - 1].end = sanitizedValue;
      return newCaptions;
    });
  };
  const handleCaptionDelete = (id: string) => setCaptions(prev => prev.filter(c => c.id !== id));
  const handleSplitToWords = () => {
    const newCaptions: Caption[] = [];
    captions.forEach(c => {
      const words = c.text.split(/\s+/).filter(Boolean);
      if (words.length <= 1) { newCaptions.push(c); return; }
      const dur = c.end - c.start;
      const wordDur = dur / words.length;
      words.forEach((word, idx) => {
        newCaptions.push({
          id: `split-${c.id}-${idx}-${Date.now()}`,
          text: word,
          start: parseFloat((c.start + idx * wordDur).toFixed(2)),
          end: parseFloat((c.start + (idx + 1) * wordDur).toFixed(2))
        });
      });
    });
    setCaptions(newCaptions);
  };

  const handleReset = () => {
    if (window.confirm("Nazad na početak?")) {
      if (video) URL.revokeObjectURL(video.url);
      setVideo(null);
      setCaptions([]);
    }
  };

  const handleExport = async () => {
    if (!video) return;
    window.open('https://is.gd/8GvRR9', '_blank');
    setIsExporting(true);
    setExportProgress(0);

    try {
      const videoEl = document.createElement('video');
      videoEl.src = video.url; videoEl.muted = true; videoEl.playsInline = true; videoEl.crossOrigin = "anonymous";
      await new Promise((resolve) => videoEl.onloadedmetadata = resolve);

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error("Canvas Error");

      const stream = canvas.captureStream(60); 
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 16000000 });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      const downloadPromise = new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = `SrbCaption_${Date.now()}.webm`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url); resolve();
        };
      });

      mediaRecorder.start();
      videoEl.play();

      const renderLoop = () => {
        if (videoEl.ended || (videoEl.paused && videoEl.currentTime >= videoEl.duration)) { mediaRecorder.stop(); return; }
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const time = videoEl.currentTime;
        setExportProgress(Math.round((time / videoEl.duration) * 100));

        const active = captions.find(c => time >= c.start && time <= c.end);
        if (active) {
          let textToDraw = active.text;
          let segmentStart = active.start;
          if (style.displayMode !== 'sentence') {
            const words = active.text.split(/\s+/).filter(Boolean);
            if (words.length > 0) {
              const dur = active.end - active.start;
              const wDur = dur / words.length;
              const idx = Math.floor((time - active.start) / wDur);
              const safeIdx = Math.max(0, Math.min(idx, words.length - 1));
              segmentStart = active.start + (safeIdx * wDur);
              if (style.displayMode === 'word') textToDraw = words[safeIdx] || '';
              else {
                const pIdx = Math.floor(safeIdx / 2) * 2;
                textToDraw = words.slice(pIdx, pIdx + 2).join(' ');
                segmentStart = active.start + (pIdx * wDur);
              }
            }
          }
          if (style.removePunctuation) textToDraw = textToDraw.replace(/[.,?!:;]/g, "");
          if (style.casing === 'uppercase') textToDraw = textToDraw.toUpperCase();
          else if (style.casing === 'lowercase') textToDraw = textToDraw.toLowerCase();
          else if (style.casing === 'titlecase') textToDraw = textToDraw.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          const elapsed = time - segmentStart;
          let sF = 1.0, oF = 1.0, yO = 0;
          if (style.animation === 'pop' && elapsed < 0.25) {
            const p = elapsed / 0.25;
            sF = p < 0.7 ? 0.7 + (p / 0.7) * 0.4 : 1.1 - ((p - 0.7) / 0.3) * 0.1;
          } else if (style.animation === 'fade') oF = Math.min(1, elapsed / 0.15);
          else if (style.animation === 'slide-up' && elapsed < 0.2) {
            const p = elapsed / 0.2; oF = p; yO = 20 * (1 - p);
          }

          const resScale = canvas.height / 720;
          const fontSize = style.fontSize * resScale * sF;
          ctx.save();
          ctx.font = `${style.isBold ? '900' : '500'} ${fontSize}px "${style.fontFamily}", sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = oF;
          const x = canvas.width / 2 + (style.offsetX / 100) * canvas.width;
          let yB = (style.position === 'top' ? canvas.height * 0.15 : style.position === 'middle' ? canvas.height * 0.5 : canvas.height * 0.85) + (style.offsetY * resScale);
          const y = yB + (yO * resScale);

          if (style.shadowOpacity > 0) {
            ctx.save(); ctx.shadowColor = style.shadowColor; ctx.shadowBlur = style.shadowBlur * resScale; ctx.shadowOffsetX = style.shadowOffsetX * resScale; ctx.shadowOffsetY = style.shadowOffsetY * resScale; ctx.globalAlpha = style.shadowOpacity * oF;
            ctx.fillStyle = style.shadowColor; ctx.fillText(textToDraw, x, y); ctx.restore();
          }
          if (style.glowIntensity > 0) {
            ctx.save(); ctx.shadowColor = style.glowColor; ctx.shadowBlur = style.glowIntensity * resScale; ctx.globalAlpha = style.glowOpacity * oF;
            ctx.fillStyle = style.color; ctx.fillText(textToDraw, x, y); ctx.fillText(textToDraw, x, y); ctx.restore();
          }
          if (style.strokeWidth > 0) {
            ctx.save(); ctx.strokeStyle = style.strokeColor; ctx.lineWidth = style.strokeWidth * resScale * 2; ctx.lineJoin = 'round'; ctx.strokeText(textToDraw, x, y); ctx.restore();
          }
          ctx.fillStyle = style.color; ctx.fillText(textToDraw, x, y); ctx.restore();
        }
        requestAnimationFrame(renderLoop);
      };
      renderLoop(); await downloadPromise;
    } catch (err: any) { alert("Greška."); } finally { setIsExporting(false); setExportProgress(0); }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          {video && <button onClick={handleReset} className="mr-2 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-all"><i className="fa-solid fa-arrow-left text-sm"></i></button>}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"><i className="fa-solid fa-closed-captioning text-white text-sm"></i></div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Srb Caption</h1>
        </div>
        {video && <button onClick={handleExport} disabled={isExporting} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2 rounded-full shadow-lg shadow-blue-600/20 active:scale-95 transition-all">{isExporting ? `RENDERING ${exportProgress}%` : 'EKSPORTUJ'}</button>}
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {isExporting && (
          <div className="absolute inset-0 z-[100] bg-slate-950/98 flex flex-col items-center justify-center text-center animate-fade">
             <div className="w-32 h-32 mb-8 relative">
               <svg className="w-full h-full" viewBox="0 0 100 100"><circle className="text-slate-800 stroke-current" strokeWidth="4" fill="transparent" r="45" cx="50" cy="50" /><circle className="text-blue-500 stroke-current" strokeWidth="6" strokeDasharray={283} strokeDashoffset={283 * (1 - exportProgress/100)} fill="transparent" r="45" cx="50" cy="50" transform="rotate(-90 50 50)" /></svg>
               <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-white tracking-tighter">{exportProgress}%</div>
             </div>
             <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Master Quality Render...</h2>
             <p className="text-slate-400 max-w-sm text-sm font-medium">Lepimo titlove, senke i animacije. Nemoj gasiti tab.</p>
          </div>
        )}

        {!video ? (
          <div className="w-full h-full flex flex-col items-center bg-gradient-to-b from-slate-950 to-slate-900 p-8 overflow-y-auto pt-8">
             <VideoUploader onUpload={handleUpload} />
             <AdBanner />
          </div>
        ) : (
          <div className="flex w-full h-full animate-fade">
            <div className="w-80 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900">
               <CaptionList captions={captions} isLoading={isLoading} onUpdate={handleCaptionUpdate} onTimeUpdate={handleCaptionTimeUpdate} onDelete={handleCaptionDelete} onSplitToWords={handleSplitToWords} />
            </div>
            <div className="flex-1 flex flex-col bg-black/40 p-4 min-w-0">
               <VideoPreview videoUrl={video.url} captions={captions} style={style} />
            </div>
            <CustomizationPanel style={style} onChange={handleStyleChange} />
          </div>
        )}
      </main>

      <footer className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Gemini 2.5 Pro Engine</span>
          <span className="text-slate-600">Srb Caption v2.6 Passive</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
