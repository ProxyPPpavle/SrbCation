
import React from 'react';
import { Caption } from '../types';

interface CaptionListProps {
  captions: Caption[];
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}

const CaptionList: React.FC<CaptionListProps> = ({ captions, onUpdate, onDelete }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 border-r border-slate-800">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        <i className="fa-solid fa-pen-to-square"></i>
        Uredi tekst
      </h3>
      <div className="space-y-3">
        {captions.length === 0 && (
          <div className="text-center py-12 text-slate-600 italic text-sm">
            Nema dostupnih titlova...
          </div>
        )}
        {captions.map((caption) => (
          <div key={caption.id} className="group relative flex gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all">
            <div className="flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono w-12 border-r border-slate-700/30 pr-2">
              <span>{caption.start.toFixed(1)}s</span>
              <span className="opacity-30">|</span>
              <span>{caption.end.toFixed(1)}s</span>
            </div>
            <textarea
              value={caption.text}
              onChange={(e) => onUpdate(caption.id, e.target.value)}
              className="flex-1 bg-transparent border-none text-slate-200 text-sm focus:ring-0 resize-none py-1 min-h-[40px]"
              rows={Math.max(1, Math.ceil(caption.text.length / 30))}
            />
            <button 
              onClick={() => onDelete(caption.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all self-start"
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaptionList;
