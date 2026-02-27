import { ThemeType } from './types';

export interface ThemeConfig {
  name: string;
  id: ThemeType;
  bg: string;
  panel: string;
  border: string;
  accent: string;
  text: string;
  dim: string;
  selection: string;
  cursor: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  OXIDIANA: {
    name: 'OXIDIANA // ORIGINAL',
    id: 'OXIDIANA',
    bg: '#050505',
    panel: '#111111',
    border: '#333333',
    accent: '#ff003c',
    text: '#e5e5e5',
    dim: '#888888',
    selection: '#ff003c',
    cursor: '#ff003c',
  },
  LIGHT_MINIMAL: {
    name: 'NEURAL // LIGHT',
    id: 'LIGHT_MINIMAL',
    bg: '#f5f5f5',
    panel: '#ffffff',
    border: '#d1d1d1',
    accent: '#2563eb',
    text: '#1a1a1a',
    dim: '#666666',
    selection: '#bfdbfe',
    cursor: '#2563eb',
  },
  HIGH_CONTRAST: {
    name: 'TACTICAL // CONTRAST',
    id: 'HIGH_CONTRAST',
    bg: '#000000',
    panel: '#000000',
    border: '#ffffff',
    accent: '#ffff00',
    text: '#ffffff',
    dim: '#aaaaaa',
    selection: '#ffff00',
    cursor: '#ffff00',
  },
  CYBER_CYAN: {
    name: 'GRID // CYAN',
    id: 'CYBER_CYAN',
    bg: '#00080a',
    panel: '#00141a',
    border: '#003d4d',
    accent: '#00f2ff',
    text: '#c2f9ff',
    dim: '#008080',
    selection: '#00f2ff',
    cursor: '#00f2ff',
  },
};
