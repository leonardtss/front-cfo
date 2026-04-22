export const T = {
  bg0: '#0b0d0b', bg1: '#131613', bg2: '#191c19', bg3: '#1f231f',
  cream: '#f4f1e8', creamMuted: '#e8e4d6',
  fg0: '#f0ede4', fg1: 'rgba(240,237,228,0.65)', fg2: 'rgba(240,237,228,0.38)', fg3: 'rgba(240,237,228,0.18)',
  inv: '#1a1c1a', inv1: 'rgba(26,28,26,0.6)',
  green: '#2d5a40', greenMid: '#3d7a56', greenBright: '#52a874', greenText: '#7ecfa0',
  greenPale: 'rgba(82,168,116,0.12)',
  gold: '#b8923a', goldLight: '#d4aa56', goldPale: 'rgba(184,146,58,0.12)',
  navy: '#1e2d4a', navyMid: '#2a3f6a', navyBright: '#4a6fa5', navyText: '#8aabdf',
  border0: 'rgba(240,237,228,0.08)', border1: 'rgba(240,237,228,0.14)', border2: 'rgba(240,237,228,0.28)',
  sans: "'DM Sans', system-ui, sans-serif",
  serif: "'Cormorant Garamond', Georgia, serif",
  mono: "'IBM Plex Mono', monospace",
};

export function getAccentTokens(accent) {
  if (accent === 'gold') return { base: T.gold, mid: T.goldLight, bright: T.goldLight, text: T.goldLight, pale: T.goldPale };
  if (accent === 'navy') return { base: T.navy, mid: T.navyMid, bright: T.navyBright, text: T.navyText, pale: 'rgba(74,111,165,0.12)' };
  return { base: T.green, mid: T.greenMid, bright: T.greenBright, text: T.greenText, pale: T.greenPale };
}
