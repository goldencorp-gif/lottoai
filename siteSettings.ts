
export const settings = {
  general: {
    appName: "Lotto AI",
    version: "1.1 (Stable)",
    companyName: "AI Power Draw"
  },
  affiliates: {
    partnerBaseUrl: "https://www.lotteryoffice.com.au",
    trackingParam: "",
    useAffiliateLinks: true
  },
  donation: {
    enabled: true,
    url: "https://ko-fi.com"
  },
  adsense: {
    publisherId: "ca-pub-XXXXXXXXXXXXXXXX",
    showLabel: true,
    slots: {
      sidebar: "1234567890",
      mainResult: "1234567890",
      footer: "1234567890",
      vault: "1234567890"
    }
  },
  customAds: {
    sidebar: {
      enabled: true,
      image: "/ad-square.png",
      url: "https://your-website.com",
      alt: "Check out our partner"
    },
    mainResult: {
      enabled: true,
      image: "/ad-banner.png",
      url: "https://your-website.com",
      alt: "Play Now"
    },
    footer: {
      enabled: true,
      image: "/ad-banner.png",
      url: "https://your-website.com",
      alt: "Support"
    },
    vault: {
      enabled: true,
      image: "/ad-square.png",
      url: "https://your-website.com",
      alt: "Premium"
    }
  }
};

export default settings;