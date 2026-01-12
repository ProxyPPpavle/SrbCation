
export interface Caption {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export type DisplayMode = 'word' | 'two-words' | 'sentence';
export type TextCasing = 'none' | 'uppercase' | 'lowercase' | 'titlecase';
export type AnimationType = 'none' | 'pop' | 'fade' | 'slide-up';

export interface CaptionStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  isBold: boolean;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  // Shadow properties
  shadowColor: string;
  shadowBlur: number;
  shadowOpacity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Glow properties
  glowColor: string;
  glowIntensity: number;
  glowOpacity: number;
  // Position & Layout
  animation: AnimationType;
  position: 'top' | 'middle' | 'bottom';
  displayMode: DisplayMode;
  casing: TextCasing;
  removePunctuation: boolean;
  offsetX: number;
  offsetY: number;
  // Timing sync
  timingOffset: number; // in seconds (positive = delay text, negative = advance text)
}

export interface VideoData {
  file: File;
  url: string;
}
