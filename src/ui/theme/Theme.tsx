import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, darkColors, lightColors } from './tokens';
const ThemeContext = createContext<{ colors: Colors; dark: boolean }>({
  colors: lightColors,
  dark: false,
});
export function ThemeProvider({
  mode,
  children,
}: {
  mode: 'system' | 'light' | 'dark';
  children: React.ReactNode;
}) {
  const scheme = useColorScheme();
  const dark = mode === 'dark' || (mode === 'system' && scheme === 'dark');
  return (
    <ThemeContext.Provider value={{ colors: dark ? darkColors : lightColors, dark }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useTheme = () => useContext(ThemeContext);
