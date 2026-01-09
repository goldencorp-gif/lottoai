
export const settings = {
  general: {
    appName: "Lotto AI",
    version: "1.2 (Crypto)",
    companyName: "AI Power Draw"
  },
  affiliates: {
    // 1. "PLAY NOW" BUTTON LINKS
    // This is the base URL for the "Play Now" buttons generated in the app logic.
    partnerBaseUrl: "https://www.lotteryoffice.com.au",
    trackingParam: "",
    useAffiliateLinks: true
  },
  donation: {
    enabled: true,
    // We keep this for fallback, but the UI will prioritize Crypto
    url: "https://ko-fi.com/lottoai"
  },
  crypto: {
    enabled: true,
    // REPLACE THESE WITH YOUR ACTUAL WALLET ADDRESSES
    // If you leave them as is, people cannot pay you.
    btc: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    eth: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    usdt: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Usually same as ETH (ERC20) or TRC20
    sol: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"
  },
  adsense: {
    publisherId: "ca-pub-8761648075829250",
    showLabel: true,
    slots: {
      sidebar: "1234567890",
      mainResult: "1234567890",
      footer: "1234567890",
      vault: "1234567890"
    }
  },
  customAds: {
    // 3. BANNER IMAGE LINKS (IMAGES ONLY)
    // To show Google Ads, 'enabled' must be set to FALSE.
    sidebar: {
      enabled: false,
      image: "/ad-square.png",
      url: "https://www.1stmg.com.au", 
      alt: "Check out our partner"
    },
    mainResult: {
      enabled: false,
      image: "/ad-banner.png",
      url: "https://www.8milesestate.com.au",
      alt: "Play Now"
    },
    footer: {
      enabled: false,
      image: "/ad-banner.png",
      url: "https://www.8milesestate.com.au", 
      alt: "Support"
    },
    vault: {
      enabled: false,
      image: "/ad-square.png",
      url: "https://www.1stmg.com.au",
      alt: "Premium"
    }
  }
};

export default settings;
