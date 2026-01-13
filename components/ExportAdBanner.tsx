
import React, { useEffect, useRef } from 'react';

const ExportAdBanner: React.FC = () => {
  const adSmallRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adSmallRef.current && !adSmallRef.current.dataset.loaded) {
      const scriptOptions = document.createElement('script');
      scriptOptions.innerHTML = `
        atOptions = {
          'key' : 'fd92fe41824cf6d0dee6ce5c5f4238e8',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      const scriptInvoke = document.createElement('script');
      scriptInvoke.src = 'https://www.highperformanceformat.com/fd92fe41824cf6d0dee6ce5c5f4238e8/invoke.js';
      adSmallRef.current.appendChild(scriptOptions);
      adSmallRef.current.appendChild(scriptInvoke);
      adSmallRef.current.dataset.loaded = "true";
    }
  }, []);

  return (
    <div className="mt-auto pb-12 flex flex-col items-center gap-2">
      <span className="text-[7px] text-slate-600 uppercase font-black tracking-[0.3em]">PODRŽI NAS</span>
      <div ref={adSmallRef} className="bg-slate-900/30 rounded-lg overflow-hidden border border-slate-800/50 flex items-center justify-center min-h-[50px] min-w-[320px]">
        {/* Adsterra 320x50 */}
      </div>
    </div>
  );
};

export default ExportAdBanner;
