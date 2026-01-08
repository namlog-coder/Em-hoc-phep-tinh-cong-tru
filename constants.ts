
import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'fish',
    name: 'Bể cá',
    bg: 'bg-sky-100',
    emoji: '🐠',
    accent: 'text-sky-600',
    boxBg: 'bg-white/60',
    boxBorder: 'border-sky-400',
    textColor: 'text-sky-900'
  },
  {
    id: 'zoo',
    name: 'Vườn thú',
    bg: 'bg-emerald-100',
    emoji: '🐰',
    accent: 'text-emerald-600',
    boxBg: 'bg-white/60',
    boxBorder: 'border-emerald-400',
    textColor: 'text-emerald-900'
  },
  {
    id: 'sky',
    name: 'Bầu trời',
    bg: 'bg-indigo-900',
    emoji: '⭐',
    accent: 'text-yellow-400',
    boxBg: 'bg-white/10',
    boxBorder: 'border-yellow-400',
    textColor: 'text-white'
  },
  {
    id: 'farm',
    name: 'Nông trại',
    bg: 'bg-orange-50',
    emoji: '🍎',
    accent: 'text-orange-600',
    boxBg: 'bg-white/60',
    boxBorder: 'border-orange-400',
    textColor: 'text-orange-900'
  },
  {
    id: 'road',
    name: 'Đường phố',
    bg: 'bg-slate-200',
    emoji: '🚗',
    accent: 'text-slate-600',
    boxBg: 'bg-white/60',
    boxBorder: 'border-slate-500',
    textColor: 'text-slate-900'
  }
];

export const INITIAL_MAX_RANGE = 5;
