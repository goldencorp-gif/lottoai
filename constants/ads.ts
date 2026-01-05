
import { settings } from '../siteSettings';

// --- GOOGLE ADSENSE CONFIGURATION ---

// 1. Your AdSense Publisher ID (e.g., 'ca-pub-1234567890123456')
export const AD_PUBLISHER_ID = settings.adsense.publisherId;

// 2. Ad Slot IDs (from Google AdSense)
export const AD_SLOTS = {
  SIDEBAR: settings.adsense.slots.sidebar,
  MAIN_RESULT: settings.adsense.slots.mainResult,
  FOOTER: settings.adsense.slots.footer,
  VAULT: settings.adsense.slots.vault,
};

// 3. CUSTOM ADS (House Ads)
// If you want to show your OWN image/banner instead of Google Ads for a specific spot,
// set 'enabled' to true and provide the image URL and destination link.

export const CUSTOM_ADS = {
  SIDEBAR: settings.customAds.sidebar,
  MAIN_RESULT: settings.customAds.mainResult,
  FOOTER: settings.customAds.footer,
  VAULT: settings.customAds.vault
};

// 4. Global Settings
export const SHOW_AD_LABEL = settings.adsense.showLabel;
