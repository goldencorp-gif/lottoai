
// --- GOOGLE ADSENSE CONFIGURATION ---

// 1. Your AdSense Publisher ID (e.g., 'ca-pub-1234567890123456')
// You can find this in AdSense -> Account -> Settings -> Account Information
export const AD_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX';

// 2. Ad Slot IDs (from Google AdSense)
export const AD_SLOTS = {
  SIDEBAR: '1234567890',     // The square/vertical ad in the left sidebar
  MAIN_RESULT: '1234567890', // The banner ad appearing above the ball results
  FOOTER: '1234567890',      // The horizontal ad in the commercial notice area
  VAULT: '1234567890',       // The ad appearing in the saved entries vault
};

// 3. CUSTOM ADS (House Ads)
// If you want to show your OWN image/banner instead of Google Ads for a specific spot,
// set 'enabled' to true and provide the image URL and destination link.

export const CUSTOM_ADS = {
  SIDEBAR: {
    enabled: false, // Set to true to override AdSense
    image: 'https://placehold.co/300x250/1e1b4b/indigo?text=Your+Ad+Here', // Your Banner Image URL
    url: 'https://www.ozlotteries.com', // Where the click goes
    alt: 'Special Offer'
  },
  MAIN_RESULT: {
    enabled: false,
    image: 'https://placehold.co/728x90/1e1b4b/indigo?text=Play+Now+Banner',
    url: 'https://www.ozlotteries.com',
    alt: 'Play Now'
  },
  FOOTER: {
    enabled: false,
    image: 'https://placehold.co/728x90/1e1b4b/indigo?text=Support+Us',
    url: 'https://ko-fi.com',
    alt: 'Support'
  },
  VAULT: {
    enabled: false,
    image: 'https://placehold.co/300x250/1e1b4b/indigo?text=Premium+Feature',
    url: '#',
    alt: 'Premium'
  }
};

// 4. Global Settings
export const SHOW_AD_LABEL = true; // Set to false to hide the "SPONSORED" text
