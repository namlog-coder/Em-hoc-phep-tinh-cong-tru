
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  TEACHING = 'TEACHING',
  SUCCESS = 'SUCCESS'
}

export type Difficulty = 'easy' | 'moderate' | 'hard';

export interface Theme {
  id: string;
  name: string;
  bg: string;
  emoji: string;
  accent: string;
  boxBg: string;
  boxBorder: string;
  textColor: string;
}

export interface GameData {
  num1: number;
  num2: number;
  sum: number;
  theme: Theme;
}
