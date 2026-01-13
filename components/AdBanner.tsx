
import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const adLargeRef = useRef<HTMLDivElement>(null);
  const adNativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Native Banner
    if (adNativeRef.current && !adNativeRef.current.dataset.loaded) {
      const scriptNative = document.createElement('script');
      scriptNative.async = true;
      scriptNative.setAttribute('data-cfasync', 'false');
      scriptNative.src = 'https://pl28466942.effectivegatecpm.com/9d02445368550e7c1eb4afe50ebb5cf5/invoke.js';
      adNativeRef.current.appendChild(scriptNative);
      adNativeRef.current.dataset.loaded = "true";
    }

    // 2. Veliki Banner (468x60)
    if (adLargeRef.current && !adLargeRef.current.dataset.loaded) {
      const scriptOptions = document.createElement('script');
      scriptOptions.innerHTML = `
        atOptions = {
          'key' : '73eae2849568fb2f689bee4816f9bde3',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      const scriptInvoke = document.createElement('script');
      scriptInvoke.src = 'https://www.highperformanceformat.com/73eae2849568fb2f689bee4816f9bde3/invoke.js';
      adLargeRef.current.appendChild(scriptOptions);
      adLargeRef.current.appendChild(scriptInvoke);
      adLargeRef.current.dataset.loaded = "true";
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 mt-6 w-full pb-10">
      {/* NATIVE BANNER */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-2xl">
        <span className="text-[7px] text-slate-700 uppercase font-black tracking-[0.4em]">PREPORUČENO ZA VAS</span>
        <div ref={adNativeRef} className="w-full bg-slate-900/30 rounded-xl overflow-hidden border border-slate-800/50 min-h-[100px] shadow-lg">
           <div id="container-9d02445368550e7c1eb4afe50ebb5cf5" className="w-full"></div>
        </div>
      </div>

      {/* VELIKI BANNER (468x60) */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[7px] text-slate-700 uppercase font-black tracking-[0.4em]">SPONZORISANO</span>
        <div ref={adLargeRef} className="bg-slate-900/30 rounded-lg overflow-hidden border border-slate-800/50 flex items-center justify-center min-h-[60px] min-w-[468px] shadow-md">
          {/* Adsterra 468x60 */}
        </div>
      </div>
      
      <p className="text-[8px] text-slate-700 font-bold opacity-40 uppercase tracking-[0.2em]">Srb Caption - Free Tool</p>
    </div>
  );
};

export default AdBanner;
