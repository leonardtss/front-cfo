import { createContext, useContext, useState, useEffect } from 'react';
import { TDark, TLight } from './tokens';

const ThemeContext = createContext({ T: TDark, isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('cfo-theme') !== 'light';
  });

  useEffect(() => {
    document.body.style.background = isDark ? TDark.bg0 : TLight.bg0;
  }, [isDark]);

  function toggle() {
    setIsDark(d => {
      localStorage.setItem('cfo-theme', d ? 'light' : 'dark');
      return !d;
    });
  }

  return (
    <ThemeContext.Provider value={{ T: isDark ? TDark : TLight, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
