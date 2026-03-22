const tintColorLight = '#2E7D32';
const tintColorDark = '#81C784';

export default {
  light: {
    text: '#1B1B1B',
    secondaryText: '#6B6B6B',
    background: '#FAFAFA',
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#9E9E9E',
    tabIconSelected: tintColorLight,
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    accent: '#66BB6A',
  },
  dark: {
    text: '#FAFAFA',
    secondaryText: '#BDBDBD',
    background: '#121212',
    card: '#1E1E1E',
    tint: tintColorDark,
    tabIconDefault: '#757575',
    tabIconSelected: tintColorDark,
    border: '#333333',
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    accent: '#81C784',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
