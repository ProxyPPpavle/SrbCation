
import { CaptionStyle } from './types.ts';

export const DEFAULT_STYLE: CaptionStyle = {
  color: '#ffffff',
  fontSize: 56,
  fontFamily: 'Montserrat',
  fontWeight: '700',
  isBold: true,
  strokeColor: '#000000',
  strokeWidth: 2.5,
  backgroundColor: '#000000',
  backgroundOpacity: 0,
  shadowColor: '#000000',
  shadowBlur: 10,
  shadowOpacity: 0.6,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  glowColor: '#ffffff',
  glowIntensity: 0,
  glowOpacity: 0.8,
  animation: 'pop',
  position: 'bottom',
  displayMode: 'word',
  casing: 'uppercase',
  removePunctuation: true,
  offsetX: 0,
  offsetY: 0,
  timingOffset: 0, // Podrazumevano nema pomeranja
};

export const COLOR_PRESETS = [
  '#ffffff', '#ffff00', '#ff0000', '#00ff00', '#00ffff', '#ff00ff', '#fbbf24', '#f87171', '#60a5fa', '#000000'
];

export const FONTS = [
  'Montserrat', 'Inter', 'Bebas Neue', 'Roboto Condensed', 'Oswald', 'Impact', 'Arial', 'Comic Sans MS'
];
