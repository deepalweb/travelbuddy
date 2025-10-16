export interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  language: string;
  homeCurrency: string;
  selectedInterests: string[];
  hasCompletedWizard: boolean;
  isAdmin?: boolean;
  isMerchant?: boolean;
}

export interface Place {
  id: string;
  name: string;
  type: string;
  formatted_address: string;
  rating?: number;
  price_level?: number;
  photos?: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  deal?: Deal;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
  placeName: string;
  placeId?: string;
}

export interface TripPlan {
  id: string;
  title: string;
  destination: string;
  duration: string;
  dailyPlans: DayPlan[];
  introduction: string;
  conclusion: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
  photoUrl?: string;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  duration?: string;
}

export interface Post {
  id: string;
  userId: string;
  author: {
    name: string;
    avatar?: string;
    location: string;
    verified: boolean;
  };
  content: {
    text: string;
    images: string[];
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isBookmarked: boolean;
  };
  timestamp: Date;
  tags: string[];
  category: string;
}

export type ActiveTab = 'home' | 'explore' | 'trips' | 'community' | 'profile';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'system' | 'deal' | 'social' | 'trip';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
}