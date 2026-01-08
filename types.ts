
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  TEACHING = 'TEACHING',
  SUCCESS = 'SUCCESS'
}

export type Difficulty = 'easy' | 'moderate' | 'hard';
export type QuestionType = 'find_sum' | 'find_num1' | 'find_num2';

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
  questionType: QuestionType;
}
