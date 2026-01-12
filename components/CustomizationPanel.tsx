
import React from 'react';
import { CaptionStyle, DisplayMode, TextCasing, AnimationType } from '../types.ts';
import { FONTS } from '../constants.ts';

interface CustomizationPanelProps {
  style: CaptionStyle;
  onChange: (style: Partial<CaptionStyle>) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ style, onChange }) => {
  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 overflow-y-auto flex flex-col scrollbar-hide">
      
      <section className="p-5 border-b border-slate-800 bg-blue-600/5">
        <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-star"></i> Mod & Animacija
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
             <label className="text-[9px] text-slate-500 uppercase font-bold">Mod Prikaza</label>
             <select 
              value={style.displayMode}
              onChange={(e) => onChange({ displayMode: e.target.value as DisplayMode })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="word">Reč po reč</option>
              <option value="two-words">2 po 2</option>
              <option value="sentence">Cela rečenica</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-slate-500 uppercase font-bold">Animacija Reči</label>
            <select 
              value={style.animation}
              onChange={(e) => onChange({ animation: e.target.value as AnimationType })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
            >
              <option value="none">Bez animacije</option>
              <option value="pop">Pop (Jump)</option>
              <option value="fade">Fast Fade</option>
              <option value="slide-up">Slide Up</option>
            </select>
          </div>
        </div>
      </section>

      <section className="p-5 border-b border-slate-800">
        <h3 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-font"></i> Tekst & Pismo
        </h3>
        <div className="space-y-4">
          <select 
            value={style.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ isBold: !style.isBold })}
              className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${style.isBold ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              B
            </button>
            <button
              onClick={() => onChange({ removePunctuation: !style.removePunctuation })}
              className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${style.removePunctuation ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
              Bez znaka
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'uppercase', label: 'AA' },
              { id: 'lowercase', label: 'aa' },
              { id: 'titlecase', label: 'Aa' },
              { id: 'none', label: '—' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => onChange({ casing: c.id as TextCasing })}
                className={`py-1.5 rounded border text-[10px] font-bold transition-all ${style.casing === c.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-750'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
              <span>Veličina Teksta</span>
              <span className="text-blue-400">{style.fontSize}</span>
            </div>
            <input type="range" min="16" max="160" value={style.fontSize} onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500" />
          </div>

          <div className="flex items-center gap-3">
             <input type="color" value={style.color} onChange={(e) => onChange({ color: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer overflow-hidden p-0" />
             <span className="text-[10px] text-slate-500 uppercase font-bold">Boja Teksta</span>
          </div>
        </div>
      </section>

      <section className="p-5 border-b border-slate-800 bg-slate-900/40">
        <h3 className="text-[11px] font-black text-purple-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-pen-nib"></i> Okvir (Stroke)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <input type="color" value={style.strokeColor} onChange={(e) => onChange({ strokeColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0" />
             <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-1">
                   <span>Debljina</span>
                   <span className="text-blue-400">{style.strokeWidth}</span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={style.strokeWidth} onChange={(e) => onChange({ strokeWidth: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-blue-500" />
             </div>
          </div>
        </div>
      </section>

      <section className="p-5 border-b border-slate-800 bg-pink-500/5">
        <h3 className="text-[11px] font-black text-pink-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-moon"></i> Senka (Shadow)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <input type="color" value={style.shadowColor} onChange={(e) => onChange({ shadowColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0" />
             <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                   <span>Prozirnost</span>
                   <span className="text-pink-400">{Math.round(style.shadowOpacity * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={style.shadowOpacity} onChange={(e) => onChange({ shadowOpacity: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500" />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-600 uppercase font-bold">Offset X</label>
              <input type="range" min="-30" max="30" value={style.shadowOffsetX} onChange={(e) => onChange({ shadowOffsetX: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-600 uppercase font-bold">Offset Y</label>
              <input type="range" min="-30" max="30" value={style.shadowOffsetY} onChange={(e) => onChange({ shadowOffsetY: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
              <span>Blur (Zamućenje)</span>
              <span className="text-pink-400">{style.shadowBlur}</span>
            </div>
            <input type="range" min="0" max="80" value={style.shadowBlur} onChange={(e) => onChange({ shadowBlur: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-pink-500" />
          </div>
        </div>
      </section>

      <section className="p-5 border-b border-slate-800 bg-yellow-500/5">
        <h3 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-sun"></i> Sjaj (Glow)
        </h3>
        <div className="space-y-4">
           <div className="flex items-center gap-3">
             <input type="color" value={style.glowColor} onChange={(e) => onChange({ glowColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0" />
             <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                   <span>Intenzitet</span>
                   <span className="text-yellow-400">{style.glowIntensity}</span>
                </div>
                <input type="range" min="0" max="80" step="1" value={style.glowIntensity} onChange={(e) => onChange({ glowIntensity: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500" />
             </div>
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                <span>Jačina (Opacity)</span>
                <span className="text-yellow-400">{Math.round(style.glowOpacity * 100)}%</span>
             </div>
             <input type="range" min="0" max="1" step="0.05" value={style.glowOpacity} onChange={(e) => onChange({ glowOpacity: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-yellow-500" />
          </div>
        </div>
      </section>

      <section className="p-5 border-b border-slate-800 bg-green-500/5">
        <h3 className="text-[11px] font-black text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i className="fa-solid fa-up-down-left-right"></i> Pozicija
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-1">
            {(['top', 'middle', 'bottom'] as const).map(pos => (
              <button
                key={pos}
                onClick={() => onChange({ position: pos })}
                className={`py-1.5 rounded border text-[10px] font-bold transition-all ${style.position === pos ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                {pos === 'top' ? 'Gore' : pos === 'middle' ? 'Sredina' : 'Dole'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                <span>Pomeranje Y</span>
                <span className="text-green-400">{style.offsetY}px</span>
             </div>
             <input type="range" min="-400" max="400" value={style.offsetY} onChange={(e) => onChange({ offsetY: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-green-500" />
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                <span>Pomeranje X</span>
                <span className="text-green-400">{style.offsetX}%</span>
             </div>
             <input type="range" min="-50" max="50" value={style.offsetX} onChange={(e) => onChange({ offsetX: parseInt(e.target.value) })} className="w-full h-1 bg-slate-700 rounded-lg accent-green-500" />
          </div>
        </div>
      </section>
      
      <div className="pb-10"></div>
    </div>
  );
};

export default CustomizationPanel;
