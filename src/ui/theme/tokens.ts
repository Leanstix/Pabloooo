export const lightColors = {
  background: '#F5F5F0',
  surface: '#FFFFFF',
  raised: '#EBEEE8',
  ink: '#182D27',
  muted: '#708078',
  line: '#E3E8E2',
  accent: '#C6F36B',
  accentInk: '#18301E',
  positive: '#287653',
  negative: '#C25646',
  violet: '#DCD6F9',
  orange: '#FFD7B7',
  hero: '#19382D',
  heroText: '#F5F9ED',
  overlay: 'rgba(12,25,20,.45)',
};
export const darkColors: typeof lightColors = {
  background: '#111C18',
  surface: '#1A2A23',
  raised: '#23372C',
  ink: '#F0F4EB',
  muted: '#A0B1A5',
  line: '#2B3F33',
  accent: '#C6F36B',
  accentInk: '#18301E',
  positive: '#A8DDA7',
  negative: '#F5AA9C',
  violet: '#62597E',
  orange: '#73523D',
  hero: '#234B39',
  heroText: '#F5F9ED',
  overlay: 'rgba(0,0,0,.65)',
};
export type Colors = typeof lightColors;
export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28, xxl: 36 };
export const radius = { sm: 12, md: 20, lg: 28, pill: 999 };
