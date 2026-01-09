
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
    // PAUSED: Set to false until approved by The Lottery Office
    useAffiliateLinks: false
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
    publisherId: "ca-pub-8761648075829250",
    showLabel: true,
    slots: {
      // INSTRUCTIONS:
      // 1. Go to AdSense -> Ads -> By ad unit -> Create new "Display" ad.
      // 2. Copy the 'data-ad-slot' number (e.g., 8473628190) and paste it below.
      // 3. If you want to HIDE a slot, leave the string empty "".
      // 4. If you see a "Setup Required" box, it means you still have the default ID below.
      sidebar: "6456745400",
      mainResult: "6456745400",
      footer: "6456745400",
      vault: "6456745400"
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
