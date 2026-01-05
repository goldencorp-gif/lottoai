
import { LotteryGameType, GameConfig } from './types';

export const GAME_CONFIGS: Record<LotteryGameType, GameConfig> = {
  // --- USA (The Lottery Office) ---
  [LotteryGameType.US_POWERBALL]: {
    type: LotteryGameType.US_POWERBALL,
    mainCount: 5,
    mainRange: 69,
    bonusCount: 1,
    bonusRange: 26,
    description: 'Pick 5 (1-69) + PB (1-26)',
    region: 'USA'
  },
  [LotteryGameType.US_MEGA_MILLIONS]: {
    type: LotteryGameType.US_MEGA_MILLIONS,
    mainCount: 5,
    mainRange: 70,
    bonusCount: 1,
    bonusRange: 25,
    description: 'Pick 5 (1-70) + Mega (1-25)',
    region: 'USA'
  },

  // --- EUROPE & OTHERS (The Lottery Office) ---
  [LotteryGameType.EURO_MILLIONS]: {
    type: LotteryGameType.EURO_MILLIONS,
    mainCount: 5,
    mainRange: 50,
    bonusCount: 2,
    bonusRange: 12,
    description: 'Pick 5 (1-50) + Stars (1-12)',
    region: 'Europe'
  },
  [LotteryGameType.EURO_JACKPOT]: {
    type: LotteryGameType.EURO_JACKPOT,
    mainCount: 5,
    mainRange: 50,
    bonusCount: 2,
    bonusRange: 12,
    description: 'Pick 5 (1-50) + EuroNums (1-12)',
    region: 'Europe'
  },
  [LotteryGameType.ITALIAN_SUPER]: {
    type: LotteryGameType.ITALIAN_SUPER,
    mainCount: 6,
    mainRange: 90,
    bonusCount: 1,
    description: 'Pick 6 (1-90)',
    region: 'Europe'
  },
  [LotteryGameType.UK_LOTTO]: {
    type: LotteryGameType.UK_LOTTO,
    mainCount: 6,
    mainRange: 59,
    bonusCount: 1,
    description: 'Pick 6 (1-59)',
    region: 'Europe'
  },
  [LotteryGameType.IRISH_LOTTO]: {
    type: LotteryGameType.IRISH_LOTTO,
    mainCount: 6,
    mainRange: 47,
    bonusCount: 1,
    description: 'Pick 6 (1-47)',
    region: 'Europe'
  },
  [LotteryGameType.LA_PRIMITIVA]: {
    type: LotteryGameType.LA_PRIMITIVA,
    mainCount: 6,
    mainRange: 49,
    bonusCount: 1,
    bonusRange: 9,
    description: 'Pick 6 (1-49) + Reintegro (0-9)',
    region: 'Europe'
  },

  // --- CUSTOM ---
  [LotteryGameType.CUSTOM]: {
    type: LotteryGameType.CUSTOM,
    mainCount: 6,
    mainRange: 45,
    bonusCount: 0,
    description: 'User-defined parameters',
    region: 'Global'
  }
};

// --- AFFILIATE CONFIGURATION (THE LOTTERY OFFICE) ---
// STEP 1: Sign up for "The Lottery Office" Affiliate Program.
// STEP 2: Get your tracking parameter (usually looks like '?a_aid=YOUR_ID' or '?ref=YOUR_ID').
// STEP 3: Paste it below.
export const AFFILIATE_QUERY_PARAM = ''; // e.g. '?a_aid=123456'

// STEP 4: Set the Base URL (Default: The Lottery Office)
export const PARTNER_BASE_URL = 'https://www.lotteryoffice.com.au';

// --- DONATION / TIP JAR CONFIGURATION ---
export const DONATION_LINK = 'https://ko-fi.com'; 

// Helper to construct URL safely
const getLink = (path: string) => {
  const hasQuery = AFFILIATE_QUERY_PARAM.length > 0;
  // If the path already has a '?', append with '&', otherwise start with '?'
  const separator = path.includes('?') ? '&' : '?';
  // If AFFILIATE_QUERY_PARAM starts with '?', remove it if we are appending with '&'
  const cleanParam = hasQuery && separator === '&' && AFFILIATE_QUERY_PARAM.startsWith('?') 
    ? AFFILIATE_QUERY_PARAM.substring(1) 
    : AFFILIATE_QUERY_PARAM;

  return `${PARTNER_BASE_URL}${path}${hasQuery ? (separator === '?' ? AFFILIATE_QUERY_PARAM : '&' + cleanParam) : ''}`;
};

// NOTE: The Lottery Office sells "International Matching" tickets (e.g. USA Power Lotto).
export const BUY_LINKS: Partial<Record<LotteryGameType, string>> = {
  // USA
  [LotteryGameType.US_POWERBALL]: getLink('/usa-power-lotto'),
  [LotteryGameType.US_MEGA_MILLIONS]: getLink('/usa-mega-lotto'),
  
  // Europe
  [LotteryGameType.EURO_MILLIONS]: getLink('/european-millions'),
  [LotteryGameType.EURO_JACKPOT]: getLink('/european-jackpot'),
  [LotteryGameType.ITALIAN_SUPER]: getLink('/italian-super-jackpot'),
  [LotteryGameType.UK_LOTTO]: getLink('/uk-lotto'),
  [LotteryGameType.IRISH_LOTTO]: getLink('/irish-lotto'),
  [LotteryGameType.LA_PRIMITIVA]: getLink('/la-primitiva')
};

export const LOTTERY_THEORIES = [
  {
    name: 'Barrel Sequence Theory',
    description: 'Analyzes the order of physical ball extraction to identify mechanical patterns in the drawing machine.'
  },
  {
    name: 'Repeat Numbers Theory',
    description: 'Identifies "hot" numbers that appear frequently across short-term cycles of previous draws.'
  },
  {
    name: 'Landing Areas Theory',
    description: 'Segments the wheel or barrel into physical sectors to identify positional clusters often hit by the machine.'
  },
  {
    name: 'Similar Sequence Theory',
    description: 'Examines numerical order and spacing patterns from previous weeks to identify recurring sequential progressions.'
  },
  {
    name: 'Angel Numbers Theory',
    description: 'Prioritizes "Repdigits" (e.g., 11, 22, 33, 44) and synchronistic patterns associated with spiritual guidance.'
  }
];
