
import React from 'react';
import { Caption } from '../types.ts';

interface CaptionListProps {
  captions: Caption[];
  isLoading: boolean;
  onUpdate: (id: string, text: string) => void;
  onTimeUpdate: (id: string, field: 'start' | 'end', value: number) => void;
  onDelete: (id: string) => void;
  onSplitToWords: () => void;
}

const CaptionList: React.FC<CaptionListProps> = ({ captions, isLoading, onUpdate, onTimeUpdate, onDelete, onSplitToWords }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-slate-900 border-r border-slate-800 scrollbar-hide">
      <div className="sticky top-0 bg-slate-900 pb-4 z-20 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <i className="fa-solid fa-timeline"></i>
            TIMELINE EDITOR
          </h3>
          {isLoading && <span className="animate-pulse text-[9px] bg-blue-500/10 px-2 py-0.5 rounded text-blue-400 font-black">AI RADI...</span>}
        </div>
        
        {captions.length > 0 && (
          <button 
            onClick={onSplitToWords}
            className="group w-full bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-white text-[11px] font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            <i className="fa-solid fa-scissors group-hover:rotate-12 transition-transform text-blue-400 group-hover:text-white"></i>
            RAZBIJ NA REČI
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-blue-600/5 rounded-2xl border border-blue-500/20 mb-6 animate-pulse">
          <div className="w-12 h-12 relative mb-4">
             <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full"></div>
             <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-robot text-blue-400"></i>
             </div>
          </div>
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">AI Transkripcija</span>
          <p className="text-[9px] text-slate-500 text-center uppercase font-bold leading-relaxed">Slušam video i generišem titlove...</p>
        </div>
      )}
      
      <div className="space-y-4 mt-2 pb-24">
        {!isLoading && captions.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
               <i className="fa-solid fa-keyboard text-slate-600"></i>
            </div>
            <p className="text-slate-600 text-xs font-bold uppercase tracking-widest leading-relaxed">Čekam transkripciju ili ručni unos...</p>
          </div>
        )}
        {captions.map((caption) => (
          <div key={caption.id} className="group relative flex flex-col gap-2 p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[7px] text-slate-500 font-black mb-1 uppercase tracking-wider">Start</span>
                  <input 
                    type="number" step="0.01" min="0" value={caption.start}
                    onChange={(e) => onTimeUpdate(caption.id, 'start', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-blue-400 font-mono font-black focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="mt-5 text-slate-600 font-bold text-sm">—</div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[7px] text-slate-500 font-black mb-1 uppercase tracking-wider">End</span>
                  <input 
                    type="number" step="0.01" min="0" value={caption.end}
                    onChange={(e) => onTimeUpdate(caption.id, 'end', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-red-400 font-mono font-black focus:border-red-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button onClick={() => onDelete(caption.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors mt-4">
                <i className="fa-solid fa-trash-can text-[11px]"></i>
              </button>
            </div>
            <textarea
              value={caption.text}
              onChange={(e) => onUpdate(caption.id, e.target.value)}
              className="w-full bg-transparent border-none text-slate-200 text-[13px] focus:ring-0 resize-none py-1 min-h-[36px] leading-tight font-bold"
              rows={1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaptionList;
