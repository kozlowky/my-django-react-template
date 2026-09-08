// packages/design-tokens/src/theme.ts
export const colors = {
  sand: '#F5F0EB',
  cream: '#FFFFFF',
  charcoal: { DEFAULT: '#1A1A1A', muted: '#8A8278' },
  terracotta: { DEFAULT: '#C4956A', dark: '#B08058' },
  border: '#E8E0D8',
  nav: '#2A2A2A',
} as const

export const radius = {
  lg: '16px',
  md: '12px',
} as const

export const fontFamily = {
  heading: ['"Space Grotesk"', 'sans-serif'],
  sans: ['Inter', 'sans-serif'],
} as const