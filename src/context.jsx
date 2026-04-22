import { createContext } from 'react';

export const TWEAK_DEFAULTS = {
  tagline: 0,
  accent: 'green',
  showDashboard: true,
  carouselActive: true,
};

export const TweaksCtx = createContext(TWEAK_DEFAULTS);
