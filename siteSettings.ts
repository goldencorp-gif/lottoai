
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
      image: "https://placehold.co/300x250/1e1b4b/indigo?text=Visit+My+Website",
      url: "https://example.com/my-website",
      alt: "Check out our partner"
    },
    mainResult: {
      enabled: true,
      image: "https://placehold.co/728x90/1e1b4b/indigo?text=Exclusive+Offer+-+Click+Here",
      url: "https://example.com/special-offer",
      alt: "Play Now"
    },
    footer: {
      enabled: true,
      image: "https://placehold.co/728x90/1e1b4b/indigo?text=Advertise+With+Us",
      url: "https://example.com/contact",
      alt: "Support"
    },
    vault: {
      enabled: true,
      image: "https://placehold.co/300x250/1e1b4b/indigo?text=Premium+Services",
      url: "https://example.com/premium",
      alt: "Premium"
    }
  }
};

export default settings;