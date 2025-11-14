export const SUBSCRIPTION_PLANS = {
  // TRAVELERS
  explorer: {
    name: 'Explorer',
    category: 'travelers',
    price: 0,
    features: {
      tripPlanning: { limit: 1, period: 'month' },
      aiTripGeneration: { limit: 0 },
      discoveryResults: { limit: 10 },
      placeSearch: { limit: 5, period: 'day' },
      communityPosting: false,
      communityViewing: true,
      basicMap: true,
      basicWeather: true
    }
  },
  globetrotter: {
    name: 'Globetrotter',
    category: 'travelers',
    price: 9.99,
    features: {
      tripPlanning: { limit: -1 },
      aiTripGeneration: { limit: 20, period: 'month' },
      discoveryResults: { limit: -1 },
      placeSearch: { limit: -1 },
      communityPosting: true,
      advancedFilters: true,
      priorityRecommendations: true,
      basicOfflineMode: true,
      bookingSupport: true,
      unlimitedSaves: true
    }
  },
  wanderpro: {
    name: 'WanderPro+',
    category: 'travelers',
    price: 19.99,
    features: {
      tripPlanning: { limit: -1 },
      aiTripGeneration: { limit: -1 },
      liveAiAssistant: true,
      communityBoost: true,
      pdfExport: true,
      smartPackingList: true,
      expenseCalculator: true,
      fullOfflineMode: true,
      earlyDeals: true,
      aiImageEnhancement: true
    }
  },
  // TRAVEL AGENTS & TRANSPORT
  travelagent: {
    name: 'TravelAgent Pro',
    category: 'business',
    price: 49.99,
    features: {
      agentDashboard: true,
      transportDashboard: true,
      addServices: true,
      bookingRequests: true,
      routePlanner: true,
      customerChat: true,
      aiDescriptionGenerator: true,
      aiItineraryCreator: true,
      analytics: true,
      priorityListing: true,
      verifiedBadge: true
    }
  },
  // PARTNER BUSINESSES
  partner: {
    name: 'Business + Deals',
    category: 'partner',
    price: 29.99,
    features: {
      dealCreation: true,
      dealManagement: true,
      premiumPlacement: true,
      businessPage: true,
      locationVerified: true,
      aiMarketingContent: true,
      businessAnalytics: true,
      customerInbox: true,
      communityInteraction: true
    }
  }
};

export const checkFeatureAccess = (userTier, feature, usage = {}) => {
  const plan = SUBSCRIPTION_PLANS[userTier] || SUBSCRIPTION_PLANS.free;
  const featureConfig = plan.features[feature];
  
  if (!featureConfig) return false;
  if (featureConfig === false) return false;
  if (featureConfig === true) return true;
  
  if (featureConfig.limit === -1) return true;
  if (featureConfig.limit === 0) return false;
  
  return (usage.count || 0) < featureConfig.limit;
};