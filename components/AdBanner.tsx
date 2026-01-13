
import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const ad1Ref = useRef<HTMLDivElement>(null);
  const ad2Ref = useRef<HTMLDivElement>(null);
  const ad3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Native Banner (Top of ads)
    if (ad3Ref.current && !ad3Ref.current.dataset.loaded) {
      const scriptNative = document.createElement('script');
      scriptNative.async = true;
      scriptNative.setAttribute('data-cfasync', 'false');
      scriptNative.src = 'https://pl28466942.effectivegatecpm.com/9d02445368550e7c1eb4afe50ebb5cf5/invoke.js';
      ad3Ref.current.appendChild(scriptNative);
      ad3Ref.current.dataset.loaded = "true";
    }

    // 2. Veliki Banner (468x60)
    if (ad1Ref.current && !ad1Ref.current.dataset.loaded) {
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
      ad1Ref.current.appendChild(scriptOptions);
      ad1Ref.current.appendChild(scriptInvoke);
      ad1Ref.current.dataset.loaded = "true";
    }

    // 3. Mali Banner (320x50)
    if (ad2Ref.current && !ad2Ref.current.dataset.loaded) {
      const scriptOptions2 = document.createElement('script');
      scriptOptions2.innerHTML = `
        atOptions = {
          'key' : 'fd92fe41824cf6d0dee6ce5c5f4238e8',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      const scriptInvoke2 = document.createElement('script');
      scriptInvoke2.src = 'https://www.highperformanceformat.com/fd92fe41824cf6d0dee6ce5c5f4238e8/invoke.js';
      ad2Ref.current.appendChild(scriptOptions2);
      ad2Ref.current.appendChild(scriptInvoke2);
      ad2Ref.current.dataset.loaded = "true";
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 mt-6 w-full pb-10">
      
      {/* 1. NATIVE BANNER (Prvi ispod uploadera) */}
      <div className="flex flex-col items-center gap-1.5 w-full max-w-2xl">
        <span className="text-[7px] text-slate-700 uppercase font-black tracking-[0.4em]">PREPORUČENO ZA VAS</span>
        <div ref={ad3Ref} className="w-full bg-slate-900/30 rounded-xl overflow-hidden border border-slate-800/50 min-h-[100px] shadow-lg">
           <div id="container-9d02445368550e7c1eb4afe50ebb5cf5" className="w-full"></div>
        </div>
      </div>

      {/* 2. VELIKI BANNER (468x60) */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[7px] text-slate-700 uppercase font-black tracking-[0.4em]">SPONZORISANO #1</span>
        <div ref={ad1Ref} className="bg-slate-900/30 rounded-lg overflow-hidden border border-slate-800/50 flex items-center justify-center min-h-[60px] min-w-[468px] shadow-md">
          {/* Adsterra 468x60 */}
        </div>
      </div>

      {/* 3. MALI BANNER (320x50) */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[7px] text-slate-700 uppercase font-black tracking-[0.4em]">SPONZORISANO #2</span>
        <div ref={ad2Ref} className="bg-slate-900/30 rounded-lg overflow-hidden border border-slate-800/50 flex items-center justify-center min-h-[50px] min-w-[320px] shadow-md">
          {/* Adsterra 320x50 */}
        </div>
      </div>
      
      <p className="text-[8px] text-slate-700 font-bold opacity-40 uppercase tracking-[0.2em] mt-2">Podrži nas klikom na sponzore</p>
    </div>
  );
};

export default AdBanner;
