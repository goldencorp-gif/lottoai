
export const settings = {
  general: {
    appName: "Lotto AI",
    version: "1.1 (Stable)",
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
    // 2. DONATION LINK (RECOMMENDED: KO-FI)
    // Ko-fi allows you to accept money to your personal PayPal with 0% fees.
    url: "https://ko-fi.com/lottoai"
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
    // Change the 'url' below to control where the BANNER IMAGES take the user.
    sidebar: {
      enabled: true,
      image: "/ad-square.png",
      url: "https://www.1stmg.com.au", 
      alt: "Check out our partner"
    },
    mainResult: {
      enabled: true,
      image: "/ad-banner.png",
      url: "https://www.8milesestate.com.au",
      alt: "Play Now"
    },
    footer: {
      enabled: true,
      image: "/ad-banner.png",
      url: "https://www.8milesestate.com.au", 
      alt: "Support"
    },
    vault: {
      enabled: true,
      image: "/ad-square.png",
      url: "https://www.1stmg.com.au",
      alt: "Premium"
    }
  }
};

export default settings;
