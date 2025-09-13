
import { SubscriptionTier, UserInterest } from './types.ts';

export const Colors = {
  // --- Glassmorphic Indigo Theme ---
  // Primary Colors
  primary: '#6366F1',           // Indigo 500
  primaryDark: '#4338CA',        // Indigo 700
  primaryGradientEnd: '#8B5CF6', // Purple 500, for gradients
  
  // Accent Colors
  accentPurple: '#8B5CF6',     // Purple 500
  accentHighlight: '#8B5CF6',
  accentSuccess: '#22C55E',       // Green 500
  accentInfo: '#3B82F6',         // Blue 500
  accentError: '#EF4444',       // Red 500
  accentWarning: '#F59E0B',     // Amber 500
  
  // Common Aliases (from fixed errors)
  secondary: '#22C55E', // Alias for accentSuccess
  highlight: '#F59E0B', // Alias for accentWarning

  // Backgrounds & Surfaces
  background: '#F9FAFB',
  surface: '#FFFFFF',
  glassBg: 'rgba(255, 255, 255, 0.4)',
  cardBackground: '#FFFFFF', // Alias for surface
  inputBackground: '#F9FAFB', // Alias for background
  
  // Text
  text: '#111827',
  text_primary: '#111827',
  text_secondary: '#6B7280',
  textOnDark: '#FFFFFF',
  textOnDark_secondary: '#E5E7EB',

  // Status & System Colors
  gold: '#F59E0B',
  lock: '#9CA3AF',

  // Borders & Dividers
  cardBorder: 'rgba(255, 255, 255, 0.2)', // For glass
  
  // Shadows
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  boxShadowSoft: '0 2px 8px rgba(0, 0, 0, 0.05)',
  boxShadowButton: '0 4px 15px -2px rgba(79, 70, 229, 0.4)',
  boxShadowHeader: '0 2px 8px rgba(0, 0, 0, 0.07)',
};


// API related constants
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash';

// Nearby search defaults
export const DEFAULT_PLACES_RADIUS_M = 20000; // 20 km default radius

// localStorage keys
export const LOCAL_STORAGE_FAVORITE_PLACES_KEY = 'travelBuddyFavoritePlaceIds';
export const LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY = 'travelBuddySavedTripPlans';
export const LOCAL_STORAGE_SAVED_ONE_DAY_ITINERARIES_KEY = 'travelBuddySavedOneDayItineraries';
export const LOCAL_STORAGE_EMERGENCY_CONTACTS_KEY = 'travelBuddyEmergencyContacts';
export const LOCAL_STORAGE_CURRENT_USER_KEY = 'travelBuddyCurrentUser';
export const LOCAL_STORAGE_COMMUNITY_PHOTOS_KEY = 'travelBuddyCommunityPhotos';
export const LOCAL_STORAGE_USER_REVIEWS_KEY = 'travelBuddyUserReviews';
export const LOCAL_STORAGE_COMMUNITY_POSTS_KEY = 'travelBuddyCommunityPosts';
export const LOCAL_STORAGE_SELECTED_RADIUS_M = 'travelBuddySelectedRadiusM';


export const COMMON_CURRENCIES = [
  { code: "USD", name: "United States Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "GBP", name: "British Pound Sterling" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "KRW", name: "South Korean Won" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "MXN", name: "Mexican Peso" },
];

// i18n constants
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
];

// Subscription Tiers


export interface TierFeature {
  textKey: string;
  detailsKey?: string;
  isHighlighted?: boolean;
}

export interface SubscriptionTierInfo {
  key: SubscriptionTier;
  nameKey: string;
  priceMonthly: number;
  priceAnnually?: number;
  descriptionKey: string;
  features: TierFeature[];
  ctaKey: string;
  isCurrent?: boolean;
  isRecommended?: boolean;
  badgeTextKey?: string;
  badgeColor?: string; 
}

export const SUBSCRIPTION_TIERS: SubscriptionTierInfo[] = [
  {
    key: 'free',
    nameKey: 'subscriptionTiers.free.name',
    priceMonthly: 0,
    descriptionKey: 'subscriptionTiers.free.description',
    features: [
      { textKey: 'subscriptionTiers.features.placeDiscoveryBasic' },
      { textKey: 'subscriptionTiers.features.userReviewsRead' },
      { textKey: 'subscriptionTiers.features.dealsNearbyViewOnly' },
      { textKey: 'subscriptionTiers.features.emergencySOS', isHighlighted: true },
    ],
    ctaKey: 'subscriptionTiers.free.cta',
  },
  {
    key: 'basic',
    nameKey: 'subscriptionTiers.basic.name',
    priceMonthly: 1.99,
    priceAnnually: 19.99,
    descriptionKey: 'subscriptionTiers.basic.description',
    features: [
      { textKey: 'subscriptionTiers.features.allFree', isHighlighted: true },
      { textKey: 'subscriptionTiers.features.placeDiscoveryFull' },
      { textKey: 'subscriptionTiers.features.favorites' },
      { textKey: 'subscriptionTiers.features.oneDayItineraryGeneration' },
      { textKey: 'subscriptionTiers.features.communityViewAndLike' },
    ],
    ctaKey: 'subscriptionTiers.basic.cta',
    isRecommended: true,
  },
  {
    key: 'premium',
    nameKey: 'subscriptionTiers.premium.name',
    priceMonthly: 5.99,
    priceAnnually: 59.99,
    descriptionKey: 'subscriptionTiers.premium.description',
    features: [
      { textKey: 'subscriptionTiers.features.allBasic', isHighlighted: true },
      { textKey: 'subscriptionTiers.features.aiTripPlanner' },
      { textKey: 'subscriptionTiers.features.dealsNearbyPremium' },
      { textKey: 'subscriptionTiers.features.surpriseMe' },
      { textKey: 'subscriptionTiers.features.aiPlaceHelpers' },
      { textKey: 'subscriptionTiers.features.communityCreateAndShare' },
      { textKey: 'subscriptionTiers.features.userReviewsWrite' },
    ],
    ctaKey: 'subscriptionTiers.premium.cta',
    badgeTextKey: 'subscriptionTiers.premium.badge',
    badgeColor: Colors.primary,
  },
  {
    key: 'pro',
    nameKey: 'subscriptionTiers.pro.name',
    priceMonthly: 9.99,
    priceAnnually: 99.99,
    descriptionKey: 'subscriptionTiers.pro.description',
    features: [
      { textKey: 'subscriptionTiers.features.allPremium', isHighlighted: true },
      { textKey: 'subscriptionTiers.features.prioritySupport' },
      { textKey: 'subscriptionTiers.features.earlyAccess' },
    ],
    ctaKey: 'subscriptionTiers.pro.cta',
  },
];

export const AVAILABLE_USER_INTERESTS: UserInterest[] = Object.values(UserInterest);