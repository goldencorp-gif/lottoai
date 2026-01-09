
export const settings = {
  general: {
    appName: "Lotto AI",
    version: "1.2 (Affiliate)",
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
    // Disabled because Ko-fi/PayPal block gambling apps.
    enabled: false,
    url: "https://ko-fi.com/lottoai"
  },
  crypto: {
    // Set this to TRUE only when you have your own wallet addresses.
    enabled: false, 
    // PASTE YOUR ADDRESSES HERE LATER
    btc: "", 
    eth: "",
    usdt: "",
    sol: ""
  },
  adsense: {
    // YOUR ADSENSE ID: This connects the app to your Google Account.
    // 1. Go to adsense.google.com -> Account -> Settings -> Account Information
    // 2. Copy your "Publisher ID" and paste it below.
    // 3. Google will pay the bank account linked to THAT AdSense account.
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
