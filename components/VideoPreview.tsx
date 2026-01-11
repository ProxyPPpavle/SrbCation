
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Caption, CaptionStyle } from '../types.ts';

interface VideoPreviewProps {
  videoUrl: string;
  captions: Caption[];
  style: CaptionStyle;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoUrl, captions, style }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const processText = (text: string) => {
    let result = text;
    
    if (style.removePunctuation) {
      result = result.replace(/[.,?!:;]/g, "");
    }

    switch (style.casing) {
      case 'uppercase': result = result.toUpperCase(); break;
      case 'lowercase': result = result.toLowerCase(); break;
      case 'titlecase': 
        result = result.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        break;
      default: break;
    }

    return result;
  };

  const { text: activeText, key: activeKey } = useMemo(() => {
    const active = captions.find(c => currentTime >= c.start && currentTime <= c.end);
    if (!active) return { text: '', key: '' };

    if (style.displayMode === 'sentence') {
      return { text: processText(active.text), key: active.id };
    }

    const words = active.text.split(' ');
    const duration = active.end - active.start;
    const wordDuration = duration / words.length;
    const currentWordIndex = Math.floor((currentTime - active.start) / wordDuration);
    const safeIndex = Math.min(currentWordIndex, words.length - 1);

    if (style.displayMode === 'word') {
      const word = words[safeIndex] || '';
      return { text: processText(word), key: `${active.id}-w-${safeIndex}` };
    } else if (style.displayMode === 'two-words') {
      const startIndex = Math.floor(safeIndex / 2) * 2;
      const pair = words.slice(startIndex, startIndex + 2).join(' ');
      return { text: processText(pair), key: `${active.id}-p-${startIndex}` };
    }

    return { text: '', key: '' };
  }, [captions, currentTime, style.displayMode, style.casing, style.removePunctuation]);

  const getPositionStyles = () => {
    let baseStyles: React.CSSProperties = {
      position: 'absolute',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 50,
      transform: `translate(${style.offsetX}%, ${style.offsetY}px)`,
    };

    if (style.position === 'top') {
      baseStyles.top = '10%';
    } else if (style.position === 'middle') {
      baseStyles.top = '50%';
      baseStyles.marginTop = '-25px'; 
    } else {
      baseStyles.bottom = '15%';
    }

    return baseStyles;
  };

  const getAnimationClass = () => {
    if (!activeText) return '';
    switch (style.animation) {
      case 'pop': return 'animate-pop';
      case 'fade': return 'animate-fade';
      case 'slide-up': return 'animate-slide-up';
      default: return '';
    }
  };

  const hexToRgba = (hex: string, opacity: number) => {
    let r = 0, g = 0, b = 0;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex[0] + cleanHex[1], 16);
      g = parseInt(cleanHex[2] + cleanHex[3], 16);
      b = parseInt(cleanHex[4] + cleanHex[5], 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const shadowStr = `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${hexToRgba(style.shadowColor, style.shadowOpacity)}`;
  const glowStr = style.glowIntensity > 0 ? `0 0 ${style.glowIntensity}px ${hexToRgba(style.glowColor, style.glowOpacity)}` : '';
  const textShadowValue = [shadowStr, glowStr].filter(Boolean).join(', ');

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/40 overflow-hidden">
      <div className="relative max-h-full max-w-full flex items-center justify-center">
        <video 
          ref={videoRef}
          src={videoUrl}
          className="max-h-full w-auto object-contain"
          controls
          playsInline
        />

        {activeText && (
          <div style={getPositionStyles()}>
            <div 
              key={activeKey} 
              className={`inline-block text-center px-6 py-2 rounded-lg thick-outline ${getAnimationClass()}`}
              style={{
                color: style.color,
                fontSize: `${style.fontSize}px`,
                fontFamily: `'${style.fontFamily}', sans-serif`,
                fontWeight: style.isBold ? '900' : '500',
                backgroundColor: `${style.backgroundColor}${Math.round(style.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
                WebkitTextStroke: `${style.strokeWidth}px ${style.strokeColor}`,
                textShadow: textShadowValue,
                lineHeight: 1.1,
              }}
            >
              {activeText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;
