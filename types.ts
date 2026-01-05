
export enum LotteryGameType {
  // USA (The Lottery Office)
  US_POWERBALL = 'USA Power Lotto',
  US_MEGA_MILLIONS = 'USA Mega Lotto',

  // Europe (The Lottery Office)
  EURO_MILLIONS = 'European Millions',
  EURO_JACKPOT = 'European Jackpot',
  ITALIAN_SUPER = 'Italian Super Jackpot',
  UK_LOTTO = 'UK Lotto',
  IRISH_LOTTO = 'Irish Lotto',
  LA_PRIMITIVA = 'La Primitiva',
  
  // Custom
  CUSTOM = 'Custom Game'
}

export type Language = 'en' | 'zh' | 'es' | 'hi' | 'vi';

export interface GameConfig {
  type: LotteryGameType;
  mainCount: number;
  mainRange: number;
  bonusCount: number;
  bonusRange?: number;
  description: string;
  region?: string;
}

export interface WinTier {
  division: string;
  probability: string;
  requirement: string;
}

export interface SavedPrediction {
  id: string;
  timestamp: number;
  game: string;
  numbers: number[][];
  powerballs?: number[]; // Added for Powerball support
  label?: string;
  visualUrl?: string;
}

export interface PredictionResult {
  entries: number[][];
  powerballs?: number[]; // Added for Powerball support
  analysis: string;
  theoriesApplied: string[];
  suggestedNumbers?: number[];
  groundingSources?: { title: string; uri: string }[];
  strategicWeight?: number; 
  systemLabel?: string;
  coverageStats?: WinTier[];
  visualUrl?: string;
}
