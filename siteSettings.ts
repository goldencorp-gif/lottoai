
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
      enabled: false,
      image: "https://placehold.co/300x250/1e1b4b/indigo?text=Your+Ad+Here",
      url: "https://www.ozlotteries.com",
      alt: "Special Offer"
    },
    mainResult: {
      enabled: false,
      image: "https://placehold.co/728x90/1e1b4b/indigo?text=Play+Now+Banner",
      url: "https://www.ozlotteries.com",
      alt: "Play Now"
    },
    footer: {
      enabled: false,
      image: "https://placehold.co/728x90/1e1b4b/indigo?text=Support+Us",
      url: "https://ko-fi.com",
      alt: "Support"
    },
    vault: {
      enabled: false,
      image: "https://placehold.co/300x250/1e1b4b/indigo?text=Premium+Feature",
      url: "#",
      alt: "Premium"
    }
  }
};

export default settings;