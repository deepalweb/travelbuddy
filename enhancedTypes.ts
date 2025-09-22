export interface EnhancedActivity {
  id: string;
  title: string;
  description: string;
  timeSlot: string;
  estimatedDuration: string;
  type: ActivityType;
  location: ActivityLocation;
  costInfo: CostInfo;
  travelInfo: TravelInfo;
  contextInfo: ContextualInfo;
  actionableLinks: ActionableLink[];
}

export interface CostInfo {
  entryFee: number;
  currency: string;
  mealCosts: Record<string, number>;
  transportCost: number;
  paymentMethods: string[];
  hasDiscounts: boolean;
}

export interface TravelInfo {
  fromPrevious: string;
  travelTime: number;
  recommendedMode: TransportMode;
  estimatedCost: number;
  routeInstructions: string;
  isAccessible: boolean;
}

export interface ContextualInfo {
  crowdLevel: 'Low' | 'Moderate' | 'High';
  bestTimeToVisit: string;
  weatherTips: string[];
  localTips: string[];
  safetyAlerts: string[];
  isIndoorActivity: boolean;
}

export interface ActionableLink {
  title: string;
  url: string;
  type: ActionType;
}

export interface ActivityLocation {
  address: string;
  latitude: number;
  longitude: number;
}

export enum ActivityType {
  LANDMARK = 'landmark',
  RESTAURANT = 'restaurant',
  MUSEUM = 'museum',
  NATURE = 'nature',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment'
}

export enum TransportMode {
  WALK = 'walk',
  METRO = 'metro',
  BUS = 'bus',
  TAXI = 'taxi',
  BIKE = 'bike'
}

export enum ActionType {
  MAP = 'map',
  BOOKING = 'booking',
  RESERVATION = 'reservation',
  TICKETS = 'tickets'
}

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}