import React, { useState, useEffect, useMemo, useRef } from 'react';
// Some environments reported useCallback not being bound; alias from React to be robust
const useCallback = React.useCallback;
import { Place, Deal, TripPlanSuggestion, TripPace, TravelStyle, BudgetLevel, PlaceSummary, SurpriseSuggestion, EmergencyContact, HospitalInfo, CurrentUser, SubscriptionStatus, SubscriptionTier, ExchangeRatesResponse, ExchangeRates, UserInterest, CommunityPhoto, CommunityPhotoUploadData, ActiveTab, PortalView, PlaceExplorerView as PlaceExplorerViewType, ItinerarySuggestion, UserReview, Post, QuickTourPlan, SupportPoint, LocalInfo, ChatMessage, PlannerView, LocalAgencyPlan, SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent, PostCategory, ProfileType } from './types.ts';
import { Colors as lightColors, LOCAL_STORAGE_FAVORITE_PLACES_KEY, LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY, LOCAL_STORAGE_SAVED_ONE_DAY_ITINERARIES_KEY, LOCAL_STORAGE_EMERGENCY_CONTACTS_KEY, LOCAL_STORAGE_CURRENT_USER_KEY, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SUBSCRIPTION_TIERS, LOCAL_STORAGE_USER_REVIEWS_KEY, LOCAL_STORAGE_COMMUNITY_POSTS_KEY, GEMINI_MODEL_TEXT, DEFAULT_PLACES_RADIUS_M, LOCAL_STORAGE_SELECTED_RADIUS_M } from './constants.ts';
import { GoogleGenAI, Chat } from "@google/genai";
import { 
  fetchNearbyPlaces, 
  generateItinerary as generateItineraryService,
  fetchPlaceRecommendations,
  generateSurpriseSuggestion,
  fetchNearbyHospitals,
  fetchCommunityPhotos,
  uploadCommunityPhoto,
  generateQuickTour,
  reverseGeocode,
  fetchSupportLocations,
  fetchLocalInfo,
  generateLocalAgencyPlan
} from './services/geminiService.ts';
import { azureOpenAIService } from './services/azureOpenAIService.ts';
import { fetchExchangeRates } from './services/exchangeRateService.ts';
import Header from './components/Header.tsx';
import ErrorDisplay from './components/ErrorDisplay.tsx';
import { PlaceDetailModal } from './components/PlaceDetailModal.tsx';
import TypeFilter from './components/TypeFilter.tsx';
import PlaceCardSkeleton from './components/PlaceCardSkeleton.tsx';
// import { ItineraryModal } from './components/ItineraryModal.tsx';
import AuthModal from './components/AuthModal.tsx';
import ProfileView from './components/ProfileView.tsx';
import DealCard from './components/DealCard.tsx';
// import { ModernTripPlannerModal } from './components/ModernTripPlannerModal.tsx';
import SurpriseModal from './components/SurpriseModal.tsx';
import { SOSModal } from './components/SOSModal.tsx';
import { useToast } from './contexts/ToastContext.tsx';
import { useNotifications } from './contexts/NotificationContext.tsx';
import { notificationService } from './services/notificationService.ts';
import { pushNotificationService } from './services/pushNotificationService';
import ToastContainer from './components/ToastContainer.tsx'; 
import { getCurrentGeoLocation } from './utils/geolocation.ts';
import SubscriptionRequiredOverlay from './components/SubscriptionRequiredOverlay.tsx';
import { useLanguage } from './contexts/LanguageContext.tsx'; 
import { useTheme } from './contexts/ThemeContext.tsx';
import { useDebounce } from './hooks/useDebounce.ts'; 
import LockIcon from './components/LockIcon.tsx';
import PhotoUploadModal from './components/PhotoUploadModal.tsx';
import HomeView from './components/HomeView.tsx';
import { Footer } from './components/Footer.tsx';
import { useAuth } from './contexts/AuthContext.tsx';
const EnhancedCommunityView = React.lazy(() => import('./components/EnhancedCommunityView.tsx'));
const EditPostModal = React.lazy(() => import('./components/EditPostModal.tsx'));
const CreatePostModal = React.lazy(() => import('./components/CreatePostModal.tsx'));
const AdminPortal = React.lazy(() => import('./admin/AdminPortal.tsx'));
import BottomNavigationBar from './components/BottomNavigationBar.tsx';
import PlaceExplorerView from './components/PlaceExplorerView.tsx';
import AITripPlannerView from './components/AITripPlannerView.tsx';
import WelcomeWizardModal from './components/WelcomeWizardModal.tsx';
import AIAssistantView from './components/AIAssistantView.tsx';
import ProfileTypeOnboarding from './components/ProfileTypeOnboarding.tsx';
import EnhancedOnboardingFlow from './components/EnhancedOnboardingFlow.tsx';
import DynamicDashboard from './components/DynamicDashboard.tsx';
import { moduleService } from './services/moduleService.ts';
import { onboardingService } from './services/onboardingService.ts';
import { CurrencyConverterModal } from './components/CurrencyConverterModal.tsx';
import { FeatureDiscoveryModal } from './components/FeatureDiscoveryModal.tsx';
import { LostAndFoundModal } from './components/LostAndFoundModal.tsx';
import { FlightHelpModal } from './components/FlightHelpModal.tsx';
import SimpleDealsView from './components/SimpleDealsView.tsx';
import OneDayItineraryView from './components/OneDayItineraryView.tsx';
import PlannerHomeView from './components/PlannerHomeView.tsx';
import LocalAgencyPlannerView from './components/LocalAgencyPlannerView.tsx';
import SmartTripPlannerView from './components/SmartTripPlannerView.tsx';
import EnhancedTripPlannerView from './components/EnhancedTripPlannerView.tsx';
import SimpleTripPlannerView from './components/SimpleTripPlannerView.tsx';
import SmartHomeDashboard from './components/SmartHomeDashboard.tsx';
import NearbyPlacesWidget from './components/NearbyPlacesWidget.tsx';
import AdaptiveDashboard from './components/AdaptiveDashboard.tsx';
import OnboardingCompletionToast from './components/OnboardingCompletionToast.tsx';


import ShareModal from './components/ShareModal.tsx';
import LoadingSpinner from './components/LoadingSpinner.tsx';
import RealTimeChatView from './components/RealTimeChatView.tsx';
import { websocketService } from './services/websocketService.ts';
import LandmarkRecognitionModal from './components/LandmarkRecognitionModal.tsx';
import LocationSharingModal from './components/LocationSharingModal.tsx';
import GoogleMapView from './components/GoogleMapView.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import APIUsageMonitor from './components/APIUsageMonitor.tsx';
import DatabaseConnectivityTest from './components/DatabaseConnectivityTest.tsx';
import PlacesPerformanceMonitor from './components/PlacesPerformanceMonitor.tsx';
import APIStatusChecker from './components/APIStatusChecker.tsx';
// Removed Gemini AI imports - now using Azure OpenAI
import { enhancedTripPlanningService } from './services/enhancedTripPlanningService.ts';
import { generatePostImages, generateUserAvatar } from './services/communityImageService.ts';
import { apiService } from './services/apiService.ts';
import { withApiBase } from './services/config';
import { subscriptionService, SubscriptionData } from './services/subscriptionService.ts';
import SubscriptionManagement from './components/SubscriptionManagement.tsx';
import SubscriptionAnalytics from './components/SubscriptionAnalytics.tsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.tsx';
import { analyticsService } from './services/analyticsService.ts';
import MerchantDealManager from './components/MerchantDealManager.tsx';

// Use centralized API base helper for direct fetches

const App: React.FC = () => {
  console.log('[App] App component mounted');
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [previousPlaces, setPreviousPlaces] = useState<Place[]>([]); // Store previous results for smoother transitions
  const [searchCache, setSearchCache] = useState<Map<string, Place[]>>(new Map()); // Cache for instant results
  
  // Search pagination for "Load More" functionality
  const [hasMorePlaces, setHasMorePlaces] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false); // Smooth transition state
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<Place | null>(null);
  
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearchInput = useDebounce(searchInput, 300); // Reduced for faster response
  const [actualSearchTerm, setActualSearchTerm] = useState<string>('');
  const [searchMode, setSearchMode] = useState<'typing' | 'committed'>('committed');
  const [instantResults, setInstantResults] = useState<Place[]>([]);
  const [showInstantResults, setShowInstantResults] = useState<boolean>(false);

  // Context-aware search effects
  useEffect(() => {
    if (searchInput !== actualSearchTerm) {
      setSearchMode('typing');
    } else {
      setSearchMode('committed');
    }
  }, [searchInput, actualSearchTerm]);

  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Default to 'all'
  
  const { addToast, removeToast } = useToast(); 
  const { addNotification } = useNotifications();
  const { language, setLanguage, t } = useLanguage(); 
  const { colors, theme, setTheme } = useTheme();

  // Initialize notification service and push notifications
  useEffect(() => {
    notificationService.setNotificationCallback(addNotification);
    
    // Initialize push notifications
    const initPushNotifications = async () => {
      try {
        const isInitialized = await pushNotificationService.initialize();
        if (isInitialized) {
          addToast({ message: 'Push notifications enabled!', type: 'success', duration: 2000 });
        } else {
          console.log('Push notifications not available or permission denied');
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };
    
    initPushNotifications();
  }, [addNotification, addToast]);

  const [selectedPlaceIdsForItinerary, setSelectedPlaceIdsForItinerary] = useState<string[]>([]);
  // const [showItineraryModal, setShowItineraryModal] = useState<boolean>(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<ItinerarySuggestion | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState<boolean>(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [savedOneDayItineraries, setSavedOneDayItineraries] = useState<ItinerarySuggestion[]>(() => {
    const storedPlans = localStorage.getItem(LOCAL_STORAGE_SAVED_ONE_DAY_ITINERARIES_KEY);
    return storedPlans ? JSON.parse(storedPlans) : [];
  });
  
  // Initialize multi-day trip plans from localStorage so "My Trips" isn't blank when backend is offline or user isn't logged in
  const [savedTripPlans, setSavedTripPlans] = useState<TripPlanSuggestion[]>(() => {
    try {
      const { TripPlanningService } = require('./services/tripPlanningService.ts');
      return TripPlanningService.getSavedPlans();
    } catch (e) {
      console.warn('[App] Failed to load saved trip plans:', e);
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  });

  const [favoritePlaceIds, setFavoritePlaceIds] = useState<string[]>(() => {
    const storedFavorites = localStorage.getItem(LOCAL_STORAGE_FAVORITE_PLACES_KEY);
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showOpenOnly, setShowOpenOnly] = useState<boolean>(false);


  const { user: fbUser, signInWithEmail, registerWithEmail, resetPassword, signOut: fbSignOut } = useAuth();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    if (storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser) as CurrentUser;
            return { 
                ...parsedUser, 
                tier: parsedUser.tier || 'free', 
                homeCurrency: parsedUser.homeCurrency || 'USD',
                language: parsedUser.language || DEFAULT_LANGUAGE, 
                subscriptionStatus: parsedUser.subscriptionStatus || 'none',
                selectedInterests: parsedUser.selectedInterests || [],
                hasCompletedWizard: parsedUser.hasCompletedWizard ?? true,
                hasCompletedProfileSetup: parsedUser.hasCompletedProfileSetup ?? true,
                profileType: parsedUser.profileType || 'traveler',
                enabledModules: parsedUser.enabledModules || ['places', 'trips', 'community', 'favorites'],
            };
        } catch (e) {
            console.error("Error parsing stored user from localStorage:", e);
            localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
            return null;
        }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showWelcomeWizard, setShowWelcomeWizard] = useState<boolean>(false);
  const [showEnhancedOnboarding, setShowEnhancedOnboarding] = useState<boolean>(false);
  const [showProfileTypeOnboarding, setShowProfileTypeOnboarding] = useState<boolean>(false);
  const [showCompletionToast, setShowCompletionToast] = useState<boolean>(false);
  
  // const [showTripPlannerModal, setShowTripPlannerModal] = useState<boolean>(false);
  const [tripDestination, setTripDestination] = useState<string>('');
  const [tripDuration, setTripDuration] = useState<string>('');
  const [tripInterests, setTripInterests] = useState<string>('');
  const [tripPace, setTripPace] = useState<TripPace>(TripPace.Moderate);
  const [tripTravelStyles, setTripTravelStyles] = useState<TravelStyle[]>([]);
  const [tripBudget, setTripBudget] = useState<BudgetLevel>(BudgetLevel.MidRange);
  const [generatedTripPlan, setGeneratedTripPlan] = useState<TripPlanSuggestion | null>(null);
  const [isGeneratingTripPlan, setIsGeneratingTripPlan] = useState<boolean>(false);
  const [tripPlanError, setTripPlanError] = useState<string | null>(null);


  const [surpriseSuggestion, setSurpriseSuggestion] = useState<SurpriseSuggestion | null>(null);
  const [isLoadingSurprise, setIsLoadingSurprise] = useState<boolean>(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState<boolean>(false);
  const [surpriseError, setSurpriseError] = useState<string | null>(null);

  const mainContentRef = useRef<HTMLDivElement>(null);
  const footerSentinelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('placeExplorer'); 
  const [plannerView, setPlannerView] = useState<PlannerView>('hub');

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isFetchingUserLocation, setIsFetchingUserLocation] = useState<boolean>(true); 
  const [userLocationError, setUserLocationError] = useState<string | null>(null);
  const [showSOSModal, setShowSOSModal] = useState<boolean>(false);
  const [nearbyHospitals, setNearbyHospitals] = useState<HospitalInfo[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);

  const [portalView, setPortalView] = useState<PortalView>('userApp');
  const [placeExplorerView, setPlaceExplorerView] = useState<PlaceExplorerViewType>('grid');

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState<boolean>(false);

  const [communityPhotos, setCommunityPhotos] = useState<CommunityPhoto[]>([]);
  const [isLoadingCommunityPhotos, setIsLoadingCommunityPhotos] = useState<boolean>(false);
  const [communityPhotosError, setCommunityPhotosError] = useState<string | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [uploadPhotoError, setUploadPhotoError] = useState<string | null>(null);
  
  const [showCurrencyConverter, setShowCurrencyConverter] = useState<boolean>(false);
  const [featureDiscoveryState, setFeatureDiscoveryState] = useState<{isOpen: boolean, title: string, query: string}>({isOpen: false, title: '', query: ''});
  const [showLostAndFoundModal, setShowLostAndFoundModal] = useState<boolean>(false);
  const [showFlightHelpModal, setShowFlightHelpModal] = useState<boolean>(false);
  const [showRealTimeChat, setShowRealTimeChat] = useState<boolean>(false);
  const [showLandmarkRecognition, setShowLandmarkRecognition] = useState<boolean>(false);
  const [showLocationSharing, setShowLocationSharing] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<{id: string, name: string, price: number} | null>(null);
  const [showMerchantPortal, setShowMerchantPortal] = useState<boolean>(false);
  const [chatRoomId, setChatRoomId] = useState<string>('general');

  const [userReviews, setUserReviews] = useState<UserReview[]>(() => {
    const storedReviews = localStorage.getItem(LOCAL_STORAGE_USER_REVIEWS_KEY);
    return storedReviews ? JSON.parse(storedReviews) : [];
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const storedPosts = localStorage.getItem(LOCAL_STORAGE_COMMUNITY_POSTS_KEY);
    return storedPosts ? JSON.parse(storedPosts) : [];
  });
  const [editPostTarget, setEditPostTarget] = useState<Post | null>(null);
  const [isSavingPostEdit, setIsSavingPostEdit] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState<boolean>(false);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [showAPIStatusChecker, setShowAPIStatusChecker] = useState<boolean>(false);
  const [showCollaborativePlanner, setShowCollaborativePlanner] = useState<boolean>(false);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState<boolean>(false);
  
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const [quickTourPlan, setQuickTourPlan] = useState<QuickTourPlan | null>(null);
  const [isGeneratingQuickTour, setIsGeneratingQuickTour] = useState<boolean>(false);
  const [quickTourError, setQuickTourError] = useState<string | null>(null);

  const [userCity, setUserCity] = useState<string | null>(null);
  const [userCountryCode, setUserCountryCode] = useState<string | null>(null);
  const [supportLocations, setSupportLocations] = useState<SupportPoint[]>([]);
  const [localInfo, setLocalInfo] = useState<LocalInfo | null>(null);
  const [isLoadingHomeData, setIsLoadingHomeData] = useState<boolean>(false);

  // AI Chat Assistant State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isGeneratingAiResponse, setIsGeneratingAiResponse] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // Local Agency Planner State
  const [localAgencyPlan, setLocalAgencyPlan] = useState<LocalAgencyPlan | null>(null);
  const [isGeneratingLocalAgencyPlan, setIsGeneratingLocalAgencyPlan] = useState<boolean>(false);
  const [localAgencyPlanError, setLocalAgencyPlanError] = useState<string | null>(null);

  // Voice Search State
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const hasAccess = useCallback((requiredTier: SubscriptionTier): boolean => {
    return subscriptionService.hasAccess(currentUser, requiredTier);
  }, [currentUser]);

  // Init/Reset AI Chat Session
  useEffect(() => {
    if (activeTab === 'aiAssistant' && hasAccess('premium') && !chatSession) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const newChat = ai.chats.create({
                model: GEMINI_MODEL_TEXT,
                history: [],
                config: {
                    systemInstruction: "You are 'Buddy', a friendly and helpful travel assistant. Your goal is to help users with their travel-related questions and problems. Keep your responses concise, helpful, and use emojis to be friendly.",
                }
            });
            setChatSession(newChat);
            if (chatMessages.length === 0) {
                 setChatMessages([{ role: 'model', parts: [{ text: t('aiAssistantView.welcomeMessage') }] }]);
            }
        } catch (e) {
            console.error("Failed to initialize AI Chat:", e);
            setChatError(t('aiAssistantView.error'));
        }
    }
  }, [activeTab, hasAccess, chatSession, t, chatMessages.length]);

  useEffect(() => {
    if (activeTab !== 'planner') {
      setPlannerView('hub');
    }
  }, [activeTab]);


  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = mainContentRef.current?.scrollTop ?? 0;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsBottomNavVisible(false); // Hide on scroll down
      } else {
        setIsBottomNavVisible(true); // Show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    const mainEl = mainContentRef.current;
    mainEl?.addEventListener('scroll', handleScroll);
    return () => mainEl?.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );

    const currentSentinel = footerSentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, []); 

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_REVIEWS_KEY, JSON.stringify(userReviews));
    } catch (e) {
      console.warn('Failed to persist userReviews to localStorage:', e);
    }
  }, [userReviews]);

  useEffect(() => {
    try {
      // Build a lightweight cache of posts to avoid exceeding localStorage quota.
      // - Strip images (can be large/base64)
      // - Truncate text
      // - Limit tags
      // - Cap total payload size with a safety budget

      const MAX_POSTS = 50; // keep most recent
      const MAX_BYTES = 250 * 1024; // ~250KB budget for this key
      const MAX_TEXT_LEN = 600; // chars
      const MAX_TAGS = 5;

      const toCache = (p: Post) => ({
        id: (p as any).id || (p as any)._id,
        userId: (p as any).userId,
        author: p.author ? {
          name: (p.author as any).name || '',
          avatar: (p.author as any).avatar || '',
          location: (p.author as any).location || '',
          verified: !!(p.author as any).verified,
        } : undefined,
        content: {
          text: (p as any).content?.text ? String((p as any).content.text).slice(0, MAX_TEXT_LEN) : '',
          images: [] as string[], // drop images for cache
        },
        engagement: {
          likes: (p as any).engagement?.likes || 0,
          comments: (p as any).engagement?.comments || 0,
          shares: (p as any).engagement?.shares || 0,
          isLiked: !!(p as any).engagement?.isLiked,
          isBookmarked: !!(p as any).engagement?.isBookmarked,
        },
        timestamp: (p as any).timestamp || (p as any).createdAt || new Date().toISOString(),
        tags: Array.isArray((p as any).tags) ? (p as any).tags.slice(0, MAX_TAGS) : [],
        category: (p as any).category || 'General',
      });

      let trimmed = posts.slice(-MAX_POSTS).map(toCache);
      let serialized = JSON.stringify(trimmed);

      // Shrink until under budget: progressively drop older half
      // Use Blob to get byte size accurately across UTF-16
      // eslint-disable-next-line no-constant-condition
      while (trimmed.length > 5 && new Blob([serialized]).size > MAX_BYTES) {
        trimmed = trimmed.slice(Math.ceil(trimmed.length / 2));
        serialized = JSON.stringify(trimmed);
      }

      localStorage.setItem(LOCAL_STORAGE_COMMUNITY_POSTS_KEY, serialized);
    } catch (e) {
      console.warn('Failed to persist community posts to localStorage:', e);
      try {
        // Final fallback: remove the cache to avoid repeated quota errors
        localStorage.removeItem(LOCAL_STORAGE_COMMUNITY_POSTS_KEY);
      } catch {}
    }
  }, [posts]);


  useEffect(() => {
    if (currentUser?.language && SUPPORTED_LANGUAGES.some(l => l.code === currentUser.language)) {
      setLanguage(currentUser.language);
    } else {
      setLanguage(DEFAULT_LANGUAGE);
    }
  }, [currentUser?.language, setLanguage]);

  // Instant search effect
  useEffect(() => {
    if (debouncedSearchInput.length >= 2) {
      // Show instant results from cache and current places
      const query = debouncedSearchInput.toLowerCase();
      const filtered = allPlaces.filter(place => 
        place.name.toLowerCase().includes(query) ||
        place.type?.toLowerCase().includes(query) ||
        place.formatted_address?.toLowerCase().includes(query)
      ).slice(0, 6);
      
      setInstantResults(filtered);
      setShowInstantResults(true);
      
      // Also trigger full search for more comprehensive results
      if (debouncedSearchInput.length >= 3) {
        setActualSearchTerm(debouncedSearchInput);
      }
    } else {
      setShowInstantResults(false);
      setInstantResults([]);
      if (debouncedSearchInput.length === 0) {
        setActualSearchTerm(debouncedSearchInput);
      }
    }
  }, [debouncedSearchInput, allPlaces]);

  useEffect(() => {
    // Only update search term if it's meaningful (3+ chars) or empty (to show default results)
    if (debouncedSearchInput.length === 0 || debouncedSearchInput.length >= 3) {
      setActualSearchTerm(debouncedSearchInput);
    }
  }, [debouncedSearchInput]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITE_PLACES_KEY, JSON.stringify(favoritePlaceIds));
    } catch (e) {
      console.warn('Failed to persist favoritePlaceIds:', e);
    }
  }, [favoritePlaceIds]);

  useEffect(() => {
    try {
      // Keep only last 10 plans
      const trimmed = savedTripPlans.slice(-10);
      localStorage.setItem(LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to persist savedTripPlans:', e);
    }
  }, [savedTripPlans]);

  useEffect(() => {
    try {
      // Keep only last 15 itineraries
      const trimmed = savedOneDayItineraries.slice(-15);
      localStorage.setItem(LOCAL_STORAGE_SAVED_ONE_DAY_ITINERARIES_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to persist savedOneDayItineraries:', e);
    }
  }, [savedOneDayItineraries]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    // If we already have a stored user with a mongoId, refresh it from server to ensure subscription persistence
    (async () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as CurrentUser;
          console.log('[App] Loading stored user:', {
            tier: parsed.tier,
            status: parsed.subscriptionStatus,
            trialEndDate: parsed.trialEndDate,
            subscriptionEndDate: parsed.subscriptionEndDate
          });
          
          if (parsed?.mongoId) {
            console.log('[App] Refreshing user data from backend...');
            const u = await apiService.getUser(parsed.mongoId);
            if (u && u._id) {
              const refreshedUser = {
                ...parsed,
                // identity
                username: u.username || parsed.username,
                email: u.email || parsed.email,
                profilePicture: u.profilePicture ?? parsed.profilePicture,
                // subscription - prioritize backend data but keep localStorage as fallback
                tier: u.tier || parsed.tier,
                subscriptionStatus: u.subscriptionStatus || parsed.subscriptionStatus,
                trialEndDate: u.trialEndDate || parsed.trialEndDate,
                subscriptionEndDate: u.subscriptionEndDate || parsed.subscriptionEndDate,
                // preferences
                homeCurrency: u.homeCurrency || parsed.homeCurrency,
                language: u.language || parsed.language,
                selectedInterests: Array.isArray(u.selectedInterests) ? u.selectedInterests : parsed.selectedInterests,
                hasCompletedWizard: typeof u.hasCompletedWizard === 'boolean' ? u.hasCompletedWizard : parsed.hasCompletedWizard,
              };
              
              console.log('[App] Refreshed user data:', {
                tier: refreshedUser.tier,
                status: refreshedUser.subscriptionStatus,
                trialEndDate: refreshedUser.trialEndDate,
                subscriptionEndDate: refreshedUser.subscriptionEndDate
              });
              
              setCurrentUser(refreshedUser);
              
              // Update localStorage with refreshed data
              localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(refreshedUser));
            }
          }
        }
      } catch (error) {
        console.error('[App] Error loading user data:', error);
      }
    })();
  }, []);

  useEffect(() => {
    const loadExchangeRates = async () => {
      if (!currentUser?.homeCurrency) return;
      setIsLoadingExchangeRates(true);
      try {
        const ratesResponse = await fetchExchangeRates('USD'); 
        setExchangeRates(ratesResponse.rates);
      } catch (err) {
        console.error("Failed to load exchange rates:", err);
        setExchangeRates(null);
      } finally {
        setIsLoadingExchangeRates(false);
      }
    };
    loadExchangeRates();
  }, [currentUser?.homeCurrency]);

  const checkAndUpdateSubscriptionStatus = useCallback((user: CurrentUser): CurrentUser => {
    const updatedUser = subscriptionService.checkSubscriptionStatus(user);
    
    // Show toasts for status changes
    if (updatedUser.subscriptionStatus !== user.subscriptionStatus) {
      if (updatedUser.subscriptionStatus === 'expired') {
        if (user.subscriptionStatus === 'trial') {
          addToast({ message: t('accountSettings.trialExpiredToast'), type: 'info' });
        } else if (user.subscriptionStatus === 'active') {
          addToast({ message: t('accountSettings.subscriptionExpiredToast'), type: 'info' });
        }
      }
    }
    
    return updatedUser;
  }, [addToast, t]);

  useEffect(() => {
    // Check subscription status only when user first loads or when explicitly needed
    if (currentUser && currentUser.mongoId) {
      const checkedUser = checkAndUpdateSubscriptionStatus(currentUser);
      
      // Only update if subscription status actually changed
      if (checkedUser.subscriptionStatus !== currentUser.subscriptionStatus || 
          checkedUser.tier !== currentUser.tier) {
        setCurrentUser(checkedUser);
      }
    }
  }, [currentUser?.mongoId]); // Only run when mongoId changes (user loads) 

  // Weather notifications
  useEffect(() => {
    if (localInfo?.weather && userCity) {
      try {
        notificationService.checkWeatherAlerts(localInfo.weather, userCity);
      } catch (e) {
        console.warn('Weather notification error:', e);
      }
    }
  }, [localInfo?.weather, userCity]); 

  


  // Add a new state for geolocation status
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  // Add a constant for the default location (customizable)
  const DEFAULT_LOCATION = { latitude: 6.9271, longitude: 79.8612, label: 'Colombo, Sri Lanka' };

  // Refactor loadUserLocation to update status
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const t0 = performance.now?.() || Date.now();
      const [favRes, tripsRes, itRes] = await Promise.all([
        fetch(withApiBase(`/api/users/${userId}/favorites`)).catch(() => null),
        fetch(withApiBase(`/api/users/${userId}/trips`)).catch(() => null),
        fetch(withApiBase(`/api/users/${userId}/itineraries`)).catch(() => null),
      ]);

      if (favRes?.ok) {
        const favorites = await favRes.json();
        setFavoritePlaceIds(Array.isArray(favorites) ? favorites : []);
      }

      if (tripsRes?.ok) {
        const trips = await tripsRes.json();
        const formattedTrips = trips.map((trip: any) => ({
          id: trip._id,
          tripTitle: trip.tripTitle,
          destination: trip.destination,
          duration: trip.duration,
          dailyPlans: trip.dailyPlans,
          introduction: `Explore ${trip.destination} over ${trip.duration}`,
          conclusion: `Have a wonderful time in ${trip.destination}!`
        }));
        if (formattedTrips.length > 0) setSavedTripPlans(formattedTrips);
      }

      if (itRes?.ok) {
        const its = await itRes.json();
        const formattedIts = its.map((it: any) => ({
          id: it._id,
          title: it.title,
          introduction: it.introduction,
          dailyPlan: it.dailyPlan,
          conclusion: it.conclusion,
          travelTips: it.travelTips || []
        }));
        setSavedOneDayItineraries(formattedIts);
      }

      const t1 = performance.now?.() || Date.now();
      if ((t1 - t0) > 500) {
        console.log(`[perf] loadUserData(${userId}) took ~${Math.round(t1 - t0)}ms`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const loadCommunityData = useCallback(async () => {
    try {
      const t0 = performance.now?.() || Date.now();
      // Load posts (request a small page first for faster first paint)
  const postsResponse = await fetch(withApiBase(`/api/posts?limit=20`));
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const formattedPosts = postsData.map((post: any) => ({
          id: post._id,
          userId: post.userId,
          author: post.author,
          content: post.content,
          engagement: {
            ...post.engagement,
            isLiked: false,
            isBookmarked: false
          },
          timestamp: new Date(post.createdAt),
          tags: post.tags,
          category: post.category
        }));
        setPosts(formattedPosts);
        const t1 = performance.now?.() || Date.now();
        if ((t1 - t0) > 300) {
          console.log(`[perf] loadCommunityData: ${formattedPosts.length} posts in ~${Math.round(t1 - t0)}ms`);
        }
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    }
  }, []);

  // Eagerly load community posts on startup so community section is populated
  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  // Reflect Firebase auth -> CurrentUser and load user data
  useEffect(() => {
    if (fbUser) {
      const mapped: CurrentUser = {
        username: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
        email: fbUser.email || '',
        subscriptionStatus: 'none',
        tier: 'free',
        homeCurrency: 'USD',
        language: 'en',
        selectedInterests: [],
        hasCompletedWizard: true,
        profilePicture: fbUser.photoURL || undefined,
      };
      setCurrentUser(mapped);
      setShowAuthModal(false);
      
      // Check if new user needs onboarding
      if (!mapped.hasCompletedWizard || !mapped.hasCompletedProfileSetup) {
        setShowEnhancedOnboarding(true);
      }
      // Verify token with backend, propagate admin claim, and upsert user
      (async () => {
        try {
          // Ensure latest custom claims (e.g., admin) are present on the ID token
          try {
            const { getAuth } = await import('firebase/auth');
            const auth = getAuth();
            await auth.currentUser?.getIdToken?.(true);
          } catch {}
          // Ask backend to verify token and upsert user; returns { ok, user, admin }
          const loginRes = await apiService.authLogin().catch(() => null);
          if (loginRes?.ok && loginRes?.user) {
            const u = loginRes.user;
            // Merge authoritative fields from server so subscription/tier persist correctly
            setCurrentUser((prev) => prev ? {
              ...prev,
              mongoId: u._id,
              isAdmin: !!(loginRes.admin ?? u.isAdmin),
              // identity
              username: u.username || prev.username,
              email: u.email || prev.email,
              profilePicture: u.profilePicture ?? prev.profilePicture,
              // subscription
              tier: u.tier || prev.tier,
              subscriptionStatus: u.subscriptionStatus || prev.subscriptionStatus,
              trialEndDate: u.trialEndDate || prev.trialEndDate,
              subscriptionEndDate: u.subscriptionEndDate || prev.subscriptionEndDate,
              // merchant
              isMerchant: !!u.isMerchant,
              merchantInfo: u.merchantInfo || prev.merchantInfo,
              // preferences
              homeCurrency: u.homeCurrency || prev.homeCurrency,
              language: u.language || prev.language,
              selectedInterests: Array.isArray(u.selectedInterests) ? u.selectedInterests : prev.selectedInterests,
              hasCompletedWizard: typeof u.hasCompletedWizard === 'boolean' ? u.hasCompletedWizard : prev.hasCompletedWizard,
              hasCompletedProfileSetup: typeof u.hasCompletedProfileSetup === 'boolean' ? u.hasCompletedProfileSetup : prev.hasCompletedProfileSetup,
              profileType: u.profileType || prev.profileType || 'traveler',
              enabledModules: Array.isArray(u.enabledModules) ? u.enabledModules : prev.enabledModules || ['places', 'trips', 'community', 'favorites'],
            } : prev);
            await Promise.all([
              loadUserData(u._id),
              loadCommunityData(),
            ]);
            return;
          }
          // Fallback path if auth endpoint disabled: upsert by email
          const usersResponse = await fetch(withApiBase(`/api/users`));
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            const existing = users.find((u: any) => u.email === mapped.email);
            if (existing) {
              setCurrentUser((prev) => prev ? { ...prev, mongoId: existing._id, tier: existing.tier || prev.tier, subscriptionStatus: existing.subscriptionStatus || prev.subscriptionStatus, isAdmin: !!existing.isAdmin } : prev);
              await loadUserData(existing._id);
              await loadCommunityData();
            } else {
              const created = await fetch(withApiBase(`/api/users`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: mapped.username, email: mapped.email })
              });
              if (created.ok) {
                const u = await created.json();
                setCurrentUser((prev) => prev ? { ...prev, mongoId: u._id, isAdmin: !!u.isAdmin } : prev);
                await loadUserData(u._id);
                await loadCommunityData();
              }
            }
          }
        } catch {}
      })();
    } else {
      // Signed out
      setCurrentUser(null);
    }
  }, [fbUser, loadUserData, loadCommunityData]);

  const loadUserLocation = useCallback(async (force = false) => {
    console.log('[App] loadUserLocation called, force:', force);
    
    // Check if we should skip refresh (unless forced)
    const lastLocationTime = localStorage.getItem('lastLocationTime');
    const now = Date.now();
    const LOCATION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    if (!force && lastLocationTime && (now - parseInt(lastLocationTime)) < LOCATION_REFRESH_INTERVAL) {
      console.log('[App] Skipping location refresh - too recent');
      return;
    }
    
    setIsFetchingUserLocation(true);
    setLocationStatus('loading');
    setUserLocationError(null);
    try {
      const location = await getCurrentGeoLocation();
      setUserLocation(location);
      setLocationStatus('success');
      localStorage.setItem('lastLocationTime', now.toString());
      localStorage.setItem('lastKnownLocation', JSON.stringify(location));
    } catch (error) {
      setLocationStatus('error');
      if (error instanceof Error) {
        setUserLocationError(error.message);
        addToast({ message: t('sosModal.locationError', {error: error.message}), type: "warning", duration: 3000 });
      } else {
        setUserLocationError(t('sosModal.unknownLocationError'));
        addToast({ message: t('sosModal.unknownLocationError'), type: 'warning' });
      }
      // Try to use cached location first, then default
      const cached = localStorage.getItem('lastKnownLocation');
      if (cached) {
        try {
          setUserLocation(JSON.parse(cached));
        } catch {
          setUserLocation({ latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude });
        }
      } else {
        setUserLocation({ latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude });
      }
    } finally {
      setIsFetchingUserLocation(false);
    }
  }, [addToast, t]);

  const abortRef = useRef<AbortController | null>(null);
  const [selectedRadiusM, setSelectedRadiusM] = useState<number>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_SELECTED_RADIUS_M);
    const n = stored ? Number(stored) : NaN;
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PLACES_RADIUS_M;
  });

  // Load places only when userLocation is first set (initial load)
  useEffect(() => {
    if (userLocation && !allPlaces.length) {
      setIsLoading(true);
      loadPlaces(''); // Load default places on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  // Persist radius selection
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SELECTED_RADIUS_M, String(selectedRadiusM));
  }, [selectedRadiusM]);

  useEffect(() => {
    loadUserLocation(true); // Force initial load
    loadCommunityData();
  }, [loadUserLocation, loadCommunityData]);
  
  // Auto-refresh location when app becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[App] App became active - refreshing location');
        loadUserLocation(); // Refresh when app becomes active
      }
    };

    const handleFocus = () => {
      console.log('[App] Window focused - refreshing location');
      loadUserLocation(); // Refresh when window gains focus
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadUserLocation]);


  const loadPlaces = useCallback(async (searchQuery: string) => {
    setError(null);
    
    // Create cache key based on search query, location, and category
    const cacheKey = `${searchQuery}-${selectedCategory}-${userLocation?.latitude || 0}-${userLocation?.longitude || 0}`;
    
    // Check cache first for instant results
    if (searchCache.has(cacheKey)) {
      const cachedResults = searchCache.get(cacheKey)!;
      setAllPlaces(cachedResults);
      setIsLoading(false);
      setShowInstantResults(false); // Hide instant results when showing full results
      addToast({ message: `Found ${cachedResults.length} places (cached)`, type: 'success', duration: 1500 });
      return;
    }
    
    // Store previous places before starting new search for smoother transitions
    setPreviousPlaces(prevPlaces => allPlaces.length > 0 ? allPlaces : prevPlaces);
    
    // Always show loading animation until results are loaded
    setIsLoading(true);
    setIsTransitioning(false);
    
    try {
      // Lazy-load the places pipeline to reduce initial bundle size
      const { fetchPlacesPipeline } = await import('./services/placesService.ts');
      // cancel previous in-flight
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;
      
      // Don't show loading toast for small search changes to reduce noise
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        addToast({ message: userLocation ? t('placeExplorer.fetchingNearby') : t('placeExplorer.fetchingDefault'), type: "info", duration: 1200 });
      }
      
      const attractionCategories = ['landmarks', 'culture', 'nature'];
      const commercialCategories = ['food', 'lodging', 'shopping', 'entertainment'];
      
  let allPlaces: Place[] = [];
      
      // New standardized pipeline for all categories
      const lat = userLocation?.latitude || 0;
      const lng = userLocation?.longitude || 0;

      if (attractionCategories.includes(selectedCategory)) {
        allPlaces = await fetchPlacesPipeline(lat, lng, [selectedCategory, searchQuery].filter(Boolean) as string[], selectedRadiusM, { signal, topN: 6 });
      } else if (commercialCategories.includes(selectedCategory)) {
        allPlaces = await fetchPlacesPipeline(lat, lng, [selectedCategory, searchQuery].filter(Boolean) as string[], selectedRadiusM, { signal, topN: 6 });
      } else {
        const [a, b] = await Promise.all([
          fetchPlacesPipeline(lat, lng, ['landmarks', searchQuery].filter(Boolean) as string[], selectedRadiusM, { signal, topN: 6 }),
          fetchPlacesPipeline(lat, lng, [searchQuery].filter(Boolean) as string[], selectedRadiusM, { signal, topN: 6 })
        ]);
        // Dedupe by id or name
        const seen = new Set<string>();
        const merged = [...a, ...b].filter((p) => {
          const key = p.id || p.name;
          if (!key) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        allPlaces = merged as any;
      }
      
      // Merge backend deals into places for commercial categories (hotels, restaurants/food, cafes, shops/shopping, entertainment)
      try {
        const { fetchActiveDeals, toFrontendDeal } = await import('./services/dealsService.ts');
        const backendDeals = await fetchActiveDeals();
        if (backendDeals && backendDeals.length > 0) {
          const commercialSet = new Set(['food', 'restaurants', 'restaurant', 'lodging', 'hotels', 'hotel', 'shopping', 'shops', 'shop', 'entertainment', 'cafe', 'cafes']);
          const byId = new Map(allPlaces.map(p => [p.id, p]));
          for (const d of backendDeals) {
            let place = d.placeId ? byId.get(d.placeId) : undefined;
            // Fallback by placeName (case-insensitive contains) if not found by ID
            if (!place && d.placeName) {
              const needle = d.placeName.toLowerCase();
              place = allPlaces.find(p => (p.name || '').toLowerCase().includes(needle));
            }
            if (!place) continue;
            // Only attach for commercial categories
            const typeLower = (place.type || '').toLowerCase();
            const isCommercial = Array.from(commercialSet).some(k => typeLower.includes(k));
            if (!isCommercial) continue;
            place.deal = toFrontendDeal(d, place.name);
          }
        }
      } catch (_) {
        // Silently ignore if deals service fails
      }

      // Smart result merging: stabilize results by keeping relevant previous places
      const stabilizeResults = (newPlaces: Place[], previousPlaces: Place[]) => {
        if (newPlaces.length < 3 && previousPlaces.length > 0) {
          // If new search yields few results, keep some previous ones for continuity
          const previousIds = new Set(newPlaces.map(p => p.id || p.place_id));
          const relevantPrevious = previousPlaces
            .filter(p => !previousIds.has(p.id || p.place_id))
            .slice(0, 6 - newPlaces.length);
          return [...newPlaces, ...relevantPrevious];
        }
        return newPlaces;
      };

      const stabilizedPlaces = stabilizeResults(allPlaces, previousPlaces);
      setAllPlaces(stabilizedPlaces);
      setShowInstantResults(false); // Hide instant results when showing full results
      
      // Reset pagination and check if more places are available
      setCurrentPage(1);
      setHasMorePlaces(stabilizedPlaces.length >= 6); // If we got 6+ places, there might be more
      
      // Cache the results for future instant access
      setSearchCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, stabilizedPlaces);
        // Limit cache size to prevent memory issues
        if (newCache.size > 20) {
          const firstKey = newCache.keys().next().value;
          if (firstKey) newCache.delete(firstKey);
        }
        return newCache;
      });
      
      addToast({ message: `Found ${stabilizedPlaces.length} places`, type: 'success', duration: 2000 });
    } catch (err: any) {
      const errorMessage = err.message || t('placeExplorer.fetchErrorDefault');
      setError(errorMessage);
      addToast({ message: t('placeExplorer.fetchErrorDetailed', {error: errorMessage}), type: 'error' });
      setAllPlaces([]);
    } finally {
      setIsLoading(false);
      setIsTransitioning(false);
    }
  }, [userLocation, addToast, t, selectedCategory]);

  // Load more places for pagination
  const loadMorePlaces = useCallback(async () => {
    if (isLoadingMore || !hasMorePlaces) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const { fetchPlacesPipeline } = await import('./services/placesService.ts');
      
      const lat = userLocation?.latitude || 0;
      const lng = userLocation?.longitude || 0;
      
      // Fetch more places with larger topN to get fresh results
      const attractionCategories = ['landmarks', 'culture', 'nature'];
      const commercialCategories = ['food', 'lodging', 'shopping', 'entertainment'];
      
      let morePlaces: Place[] = [];
      const totalToFetch = (nextPage) * 6; // Get more places on each load
      
      if (attractionCategories.includes(selectedCategory)) {
        morePlaces = await fetchPlacesPipeline(lat, lng, [selectedCategory, actualSearchTerm].filter(Boolean) as string[], selectedRadiusM, { topN: totalToFetch });
      } else if (commercialCategories.includes(selectedCategory)) {
        morePlaces = await fetchPlacesPipeline(lat, lng, [selectedCategory, actualSearchTerm].filter(Boolean) as string[], selectedRadiusM, { topN: totalToFetch });
      } else {
        const [a, b] = await Promise.all([
          fetchPlacesPipeline(lat, lng, ['landmarks', actualSearchTerm].filter(Boolean) as string[], selectedRadiusM, { topN: Math.ceil(totalToFetch / 2) }),
          fetchPlacesPipeline(lat, lng, [actualSearchTerm].filter(Boolean) as string[], selectedRadiusM, { topN: Math.ceil(totalToFetch / 2) })
        ]);
        morePlaces = [...a, ...b];
      }
      
      // Get only new places not already displayed
      const existingIds = new Set(allPlaces.map(p => p.id || p.place_id));
      const newPlaces = morePlaces.filter(p => !existingIds.has(p.id || p.place_id));
      
      if (newPlaces.length > 0) {
        setAllPlaces(prev => [...prev, ...newPlaces]);
        setCurrentPage(nextPage);
        addToast({ message: `Loaded ${newPlaces.length} more places`, type: 'success', duration: 1500 });
        
        // Check if there are more places to load
        setHasMorePlaces(newPlaces.length >= 6);
      } else {
        setHasMorePlaces(false);
        addToast({ message: 'No more places to load', type: 'info', duration: 1500 });
      }
    } catch (err: any) {
      addToast({ message: `Failed to load more places: ${err.message}`, type: 'error' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePlaces, currentPage, userLocation, selectedCategory, actualSearchTerm, selectedRadiusM, allPlaces, addToast]);

  useEffect(() => {
    if (userLocation) {
      const fetchHomeData = async () => {
        setIsLoadingHomeData(true);
        try {
          const [cityResult, supportResult, infoResult] = await Promise.all([
            reverseGeocode(userLocation.latitude, userLocation.longitude),
            fetchSupportLocations(userLocation.latitude, userLocation.longitude),
            fetchLocalInfo(userLocation.latitude, userLocation.longitude)
          ]);
          setUserCity(cityResult.city);
          setUserCountryCode(cityResult.countryCode);
          setSupportLocations(supportResult);
          setLocalInfo(infoResult);
          
          // Trigger location-based notifications
          if (cityResult.city) {
            try {
              notificationService.checkLocationAlerts(userLocation, cityResult.city);
              notificationService.notifyNearbyEvents(cityResult.city);
            } catch (e) {
              console.warn('Notification service error:', e);
            }
          }
        } catch (err) {
          console.error("Failed to fetch homepage data:", err);
          if (err instanceof Error) {
            addToast({ message: `Could not load local information: ${err.message}`, type: 'warning' });
          }
          setUserCity(null);
          setUserCountryCode(null);
          setSupportLocations([]);
          setLocalInfo(null);
        } finally {
          setIsLoadingHomeData(false);
        }
      };
      fetchHomeData();
    } else {
      setIsLoadingHomeData(false);
    }
  }, [userLocation, addToast]);

  const handleShowAuthModal = (view: 'login' | 'register') => {
    setAuthError(null);
    setAuthModalView(view);
    setShowAuthModal(true);
  };

  const handleLogin = async (identifier: string, pass: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      let emailToUse = identifier.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse);
      if (!isEmail) {
        // Try to resolve username -> email from backend
        try {
          const resp = await fetch(withApiBase(`/api/users`));
          if (resp.ok) {
            const users = await resp.json();
            const match = users.find((u: any) => String(u.username || '').toLowerCase() === emailToUse.toLowerCase());
            if (match?.email) {
              emailToUse = match.email;
            } else {
              throw new Error('username_not_found');
            }
          } else {
            throw new Error('lookup_failed');
          }
        } catch {
          throw new Error('username_lookup_failed');
        }
      }

      await signInWithEmail(emailToUse, pass);
      setShowAuthModal(false);
      addToast({ message: t('header.greeting', { username: (emailToUse.split('@')[0]) }), type: 'success' });
      
      // Add welcome notifications
      setTimeout(() => {
        addNotification({
          type: 'system',
          title: 'Welcome to Travel Buddy!',
          message: 'Discover amazing places and plan your perfect trip.',
          priority: 'medium'
        });
        addNotification({
          type: 'deal',
          title: 'Special Deal Alert',
          message: '30% off at nearby restaurants this week!',
          priority: 'high'
        });
      }, 2000);
    } catch (e: any) {
      let msg = e?.message || 'Login failed';
      if (msg === 'username_lookup_failed') {
        msg = 'Please sign in with your email address.';
      }
      if (e?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      if (e?.code === 'auth/user-not-found' || e?.code === 'auth/wrong-password') {
        msg = 'Invalid email or password.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (username: string, email: string, pass: string) => {
    setAuthLoading(true);
    setAuthError(null);
    if (pass.length < 6) {
      setAuthError(t('authModal.passwordLengthError'));
      setAuthLoading(false);
      return;
    }
    try {
      await registerWithEmail(email, pass, username);
      // Optionally create profile in backend
      try {
  await fetch(withApiBase(`/api/users`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email })
        });
      } catch {}
      setShowAuthModal(false);
      addToast({ message: t('authModal.welcomeUser', { username }), type: 'success' });
      // Show enhanced onboarding for new users
      setShowEnhancedOnboarding(true);
    } catch (e: any) {
      setAuthError(e?.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };
  
  // Google sign-in is handled within the GoogleSignIn component via AuthContext
  
  const handleForgotPassword = async (identifier: string) => {
    // Allow user to enter either email or username; prefer email
    const trimmed = (identifier || '').trim();
    if (!trimmed) {
      setAuthError('Enter your email to reset your password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      let emailToUse = trimmed;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse);
      if (!isEmail) {
        // Try resolve username -> email
        try {
          const resp = await fetch(withApiBase(`/api/users`));
          if (resp.ok) {
            const users = await resp.json();
            const match = users.find((u: any) => String(u.username || '').toLowerCase() === emailToUse.toLowerCase());
            if (match?.email) {
              emailToUse = match.email;
            } else {
              throw new Error('username_not_found');
            }
          } else {
            throw new Error('lookup_failed');
          }
        } catch {
          // If we can't resolve, ask user to provide email directly
          setAuthError('Please enter the email you used to register.');
          setAuthLoading(false);
          return;
        }
      }

      await resetPassword(emailToUse);
      addToast({ message: 'If an account exists for that email, a reset link has been sent.', type: 'info' });
    } catch (e: any) {
      // Do not leak existence of accounts; provide generic message
      addToast({ message: 'If an account exists for that email, a reset link has been sent.', type: 'info' });
    } finally {
      setAuthLoading(false);
    }
  };
  
  const handleLogout = () => {
    const username = currentUser?.username || t('authModal.defaultUser');
    fbSignOut().catch(() => {});
    setCurrentUser(null);
    setSavedTripPlans([]);
    setFavoritePlaceIds([]);
    addToast({ message: t('authModal.goodbyeUser', { username }), type: 'info' });
    setPortalView('userApp');
    setActiveTab('forYou');
  };
  
  const handleCheckInSafe = () => {
    // This is a mock action
    addToast({message: t('features.imSafeNotification'), type: "success"});
  };

  const handleUploadPhoto = async (uploadData: CommunityPhotoUploadData) => {
    if (!currentUser || !hasAccess('premium')) {
      setUploadPhotoError(t('userProfile.loginRequiredToast', {featureName: 'upload photos'}));
      addToast({message: t('userProfile.loginRequiredToast', {featureName: 'upload photos'}), type: 'warning'});
      return;
    }
    setIsUploadingPhoto(true);
    setUploadPhotoError(null);
    try {
      const newPhoto = await uploadCommunityPhoto(uploadData, currentUser.username);
      setCommunityPhotos(prev => [newPhoto, ...prev]);
      addToast({message: t('communityGallery.uploadSuccess'), type: 'success'});
      setShowPhotoUploadModal(false);
    } catch(err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadPhotoError(msg);
      addToast({message: `${t('communityGallery.uploadError')}: ${msg}`, type: 'error'});
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
  const handleCreatePost = async (content: string, imageUrls?: string[], attachedPlaceIds?: string[], attachedDealIds?: string[], category: PostCategory = 'Experience', tags: string[] = []) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', {featureName: 'create posts'}) , type: 'warning' });
      return;
    }
    
    // Create optimistic post for instant UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticPost: Post = {
      id: tempId,
      userId: currentUser.mongoId || tempId,
      author: {
        name: currentUser.username,
        avatar: currentUser.profilePicture,
        location: userCity || 'Unknown Location',
        verified: currentUser.tier === 'pro' || !!currentUser.isAdmin,
      },
      content: {
        text: content,
        images: imageUrls || []
      },
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isBookmarked: false,
      },
      timestamp: new Date(),
      tags: tags,
      category: category,
    };
    
    // Add optimistic post immediately
    setPosts(prev => [optimisticPost, ...prev]);
    addToast({ message: 'Post created!', type: 'success' });
    
    setIsCreatingPost(true);
    
    try {
      // Create user in database if not exists
      let userId = currentUser.mongoId;
      if (!userId) {
  const userResponse = await fetch(withApiBase(`/api/users`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData._id;
          setCurrentUser(prev => prev ? { ...prev, mongoId: userId } : null);
        }
      }
      
      const postData = {
        userId: userId,
        content: {
          text: content,
          images: imageUrls || []
        },
        author: {
          name: currentUser.username,
          avatar: currentUser.profilePicture || undefined,
          location: userCity || 'Unknown Location',
          verified: currentUser.tier === 'pro' || !!currentUser.isAdmin,
        },
        tags: tags,
        category: category
      };
      
  const response = await fetch(withApiBase(`/api/posts`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        const savedPost = await response.json();
        // Replace optimistic post with real post data
        setPosts(prev => prev.map(p => 
          p.id === tempId ? {
            ...p,
            id: savedPost._id,
            timestamp: new Date(savedPost.createdAt || Date.now())
          } : p
        ));
      } else {
        // Revert optimistic update on error
        setPosts(prev => prev.filter(p => p.id !== tempId));
        addToast({ message: 'Failed to create post. Please try again.', type: 'error' });
      }
    } catch (error) {
      // Revert optimistic update on error
      setPosts(prev => prev.filter(p => p.id !== tempId));
      console.error('Failed to create post:', error);
      addToast({ message: 'Failed to create post. Please try again.', type: 'error' });
    } finally {
      setIsCreatingPost(false);
    }
  };
  
  const handleLikePost = async (postId: string) => {
    if (!currentUser) {
        addToast({ message: t('userProfile.loginRequiredToast', {featureName: 'like posts'}), type: 'warning' });
        return;
    }
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== postId) return post;
      const isLiked = post.engagement.isLiked;
      return {
        ...post,
        engagement: {
          ...post.engagement,
          isLiked: !isLiked,
          likes: isLiked ? Math.max(0, post.engagement.likes - 1) : post.engagement.likes + 1,
        },
      };
    }));
    try {
      const payload = { userId: currentUser.mongoId || undefined, username: currentUser.username };
      const result = await apiService.likePost(postId, payload);
      if (result && typeof result.likes === 'number') {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          engagement: { ...p.engagement, likes: result.likes, isLiked: !!result.liked }
        } : p));
      }
    } catch (e) {
      // Revert on error
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id !== postId) return post;
        const isLiked = post.engagement.isLiked;
        return {
          ...post,
          engagement: {
            ...post.engagement,
            isLiked: !isLiked,
            likes: isLiked ? Math.max(0, post.engagement.likes - 1) : post.engagement.likes + 1,
          },
        };
      }));
      addToast({ message: 'Failed to update like. Please try again.', type: 'error' });
    }
    
    // Notify post author of new like
    const post = posts.find(p => p.id === postId);
    if (post && post.author?.name !== currentUser.username) {
      notificationService.notifyNewLike(post.author.name);
    }
  };

  const handleBookmarkPost = (postId: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'bookmark posts' }), type: 'warning' });
      return;
    }
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, engagement: { ...post.engagement, isBookmarked: !post.engagement.isBookmarked } }
          : post
      )
    );
  };

  const handleCommentPost = async (postId: string, text: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'comment' }), type: 'warning' });
      return;
    }
    if (!text || !text.trim()) return;
    // Optimistic comments count bump
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      engagement: { ...p.engagement, comments: (p.engagement.comments || 0) + 1 }
    } : p));
    try {
      await apiService.addComment(postId, {
        userId: currentUser.mongoId || undefined,
        username: currentUser.username,
        text: text.trim()
      });
    } catch (e) {
      // Revert on failure
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        engagement: { ...p.engagement, comments: Math.max(0, (p.engagement.comments || 1) - 1) }
      } : p));
      addToast({ message: 'Failed to add comment. Please try again.', type: 'error' });
    }
    
    // Notify post author of new comment
    const post = posts.find(p => p.id === postId);
    if (post && post.author?.name !== currentUser.username) {
      notificationService.notifyNewComment(post.author.name, currentUser.username);
    }
  };
  
  const handleShareTripPlanToCommunity = async (plan: TripPlanSuggestion) => {
    // Share trip plan as a community post and persist to backend
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', {featureName: 'share trips'}), type: 'warning' });
      return;
    }

    try {
      // Ensure user exists in DB and get userId
      let userId = currentUser.mongoId;
      if (!userId) {
  const userResponse = await fetch(withApiBase(`/api/users`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData._id;
          setCurrentUser(prev => prev ? { ...prev, mongoId: userId } : null);
        }
      }

      const images = plan.dailyPlans.map(p => p.photoUrl).filter((url): url is string => !!url).slice(0, 3);
      const postData = {
        userId,
        content: {
          text: `Check out my trip plan to ${plan.destination}!\n\n${plan.introduction || ''}`,
          images
        },
        author: {
          name: currentUser.username,
          avatar: currentUser.profilePicture || undefined,
          location: userCity || 'Unknown',
          verified: currentUser.tier === 'pro' || !!currentUser.isAdmin,
        },
        tags: [plan.destination, 'trip-plan'],
        category: 'Itinerary'
      };

  const resp = await fetch(withApiBase(`/api/posts`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (resp.ok) {
        const savedPost = await resp.json();
        const newPost: Post = {
          id: savedPost._id,
          author: savedPost.author,
          content: savedPost.content,
          engagement: {
            likes: savedPost.engagement?.likes ?? 0,
            comments: savedPost.engagement?.comments ?? 0,
            shares: savedPost.engagement?.shares ?? 0,
            isLiked: false,
            isBookmarked: false,
          },
          timestamp: new Date(savedPost.createdAt || Date.now()),
          tags: savedPost.tags || [plan.destination, 'trip-plan'],
          category: savedPost.category || 'Itinerary',
        };
        setPosts(prev => [newPost, ...prev]);
        addToast({ message: t('communityTab.tripSharedSuccess'), type: 'success' });
      } else {
        addToast({ message: 'Failed to share trip plan. Please try again.', type: 'error' });
      }
    } catch (e) {
      console.error('Error sharing trip plan:', e);
      addToast({ message: 'Failed to share trip plan. Please try again.', type: 'error' });
    }
  };
  
  const handleAddUserReview = async (placeId: string, rating: number, text: string) => {
    if (!currentUser || !hasAccess('premium')) {
      addToast({ message: t('userProfile.loginRequiredToast', {featureName: 'write reviews'}), type: 'warning' });
      return;
    }
    
    try {
      // Create user in database if not exists
      let userId = currentUser.mongoId;
      if (!userId) {
  const userResponse = await fetch(withApiBase(`/api/users`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData._id;
          setCurrentUser(prev => prev ? { ...prev, mongoId: userId } : null);
        }
      }
      
      if (!userId) {
        addToast({ message: 'Unable to verify user. Review not synced.', type: 'warning' });
        return;
      }

      const reviewData = {
        userId: userId,
        placeId,
        rating,
        text
      };
      
  const response = await fetch(withApiBase(`/api/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
      
      if (response.ok) {
        const savedReview = await response.json();
        const newReview: UserReview = {
          id: savedReview._id,
          placeId,
          userId: userId,
          username: currentUser.username,
          rating,
          text,
          timestamp: savedReview.createdAt,
        };
        setUserReviews(prev => [...prev, newReview]);
        addToast({ message: t('placeDetailModal.reviewSubmittedSuccess'), type: 'success' });
      }
    } catch (error) {
      console.error('Error adding review:', error);
      addToast({ message: 'Failed to submit review', type: 'error' });
    }
  };

  // Enhanced Community Feature Handlers
  const handleReportPost = async (postId: string, reason: string, description?: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'report posts' }), type: 'warning' });
      return;
    }

    try {
      const reportData = {
        postId,
        reporterId: currentUser.mongoId,
        reporterUsername: currentUser.username,
        reason,
        description: description || '',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(withApiBase(`/api/reports`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        addToast({ message: 'Post reported successfully. Thank you for helping keep our community safe.', type: 'success' });
      } else {
        addToast({ message: 'Failed to report post. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      addToast({ message: 'Failed to report post. Please try again.', type: 'error' });
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'block users' }), type: 'warning' });
      return;
    }

    try {
      const blockData = {
        blockerId: currentUser.mongoId,
        blockedUserId: userId,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(withApiBase(`/api/blocks`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });

      if (response.ok) {
        // Remove blocked user's posts from current view
        setPosts(prevPosts => prevPosts.filter(post => 
          post.userId !== userId && post.author?.name !== userId
        ));
        addToast({ message: 'User blocked successfully.', type: 'success' });
      } else {
        addToast({ message: 'Failed to block user. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      addToast({ message: 'Failed to block user. Please try again.', type: 'error' });
    }
  };

  const handleHidePost = (postId: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'hide posts' }), type: 'warning' });
      return;
    }

    // Remove post from local state
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    
    // Store hidden post in localStorage for persistence
    const hiddenPosts = JSON.parse(localStorage.getItem('hiddenPosts') || '[]');
    hiddenPosts.push(postId);
    localStorage.setItem('hiddenPosts', JSON.stringify(hiddenPosts));
    
    addToast({ message: 'Post hidden from your feed.', type: 'success' });
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) {
      addToast({ message: t('userProfile.loginRequiredToast', { featureName: 'delete posts' }), type: 'warning' });
      return;
    }

    try {
      const response = await fetch(withApiBase(`/api/posts/${postId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        addToast({ message: 'Post deleted successfully.', type: 'success' });
      } else {
        addToast({ message: 'Failed to delete post. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      addToast({ message: 'Failed to delete post. Please try again.', type: 'error' });
    }
  };

  const handleSharePost = (post: Post) => {
    setPostToShare(post);
  };

  const handleWelcomeWizardComplete = (preferences: { language: string; homeCurrency: string; selectedInterests: UserInterest[] }) => {
    if (currentUser) {
      setCurrentUser(prev => prev ? ({ 
        ...prev, 
        ...preferences,
        hasCompletedWizard: true,
      }) : null);
      addToast({message: t('welcomeWizard.preferencesSaved'), type: 'success'});
    }
    setShowWelcomeWizard(false);
  };

  const handleEnhancedOnboardingComplete = async (userData: {
    language: string;
    homeCurrency: string;
    selectedInterests: UserInterest[];
    profileType: ProfileType;
    enabledModules: string[];
  }) => {
    if (currentUser) {
      // Update local state immediately
      const updatedUser = {
        ...currentUser,
        ...userData,
        hasCompletedWizard: true,
        hasCompletedProfileSetup: true,
      };
      setCurrentUser(updatedUser);
      
      // Sync with backend if user has mongoId
      if (currentUser.mongoId) {
        try {
          const syncedUser = await onboardingService.completeOnboarding(currentUser.mongoId, {
            ...userData,
            hasCompletedWizard: true,
            hasCompletedProfileSetup: true,
          });
          if (syncedUser) {
            setCurrentUser(prev => prev ? { ...prev, ...syncedUser } : null);
          }
        } catch (error) {
          console.error('Failed to sync onboarding data:', error);
          addToast({ message: 'Profile saved locally. Sync will retry later.', type: 'warning' });
        }
      }
      
      addToast({ message: 'Profile setup completed! Welcome to Travel Buddy!', type: 'success' });
      setShowCompletionToast(true);
    }
    setShowEnhancedOnboarding(false);
  };

  const handleProfileTypeComplete = async (profileType: string, modules: string[]) => {
    if (currentUser) {
      // Update local state immediately
      const updatedUser = {
        ...currentUser,
        profileType: profileType as ProfileType,
        enabledModules: modules,
        hasCompletedProfileSetup: true,
      };
      setCurrentUser(updatedUser);
      
      // Sync with backend if user has mongoId
      if (currentUser.mongoId) {
        try {
          const syncedUser = await onboardingService.completeProfileSetup(currentUser.mongoId, {
            profileType: profileType as ProfileType,
            enabledModules: modules,
          });
          if (syncedUser) {
            setCurrentUser(prev => prev ? { ...prev, ...syncedUser } : null);
          }
        } catch (error) {
          console.error('Failed to sync profile setup:', error);
          addToast({ message: 'Profile saved locally. Sync will retry later.', type: 'warning' });
        }
      }
      
      addToast({ message: `Profile set to ${profileType}!`, type: 'success' });
      setShowCompletionToast(true);
    }
    setShowProfileTypeOnboarding(false);
  };
  
  const handleSendMessage = async (message: string) => {
    if (!chatSession) {
        setChatError(t('aiAssistantView.error'));
        return;
    }
    setChatMessages(prev => [...prev, { role: 'user', parts: [{ text: message }] }]);
    setIsGeneratingAiResponse(true);
    setChatError(null);
    
    try {
        const response = await chatSession.sendMessage({ message });
        setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response.text }] }]);
    } catch (e) {
        console.error("AI Chat send message error:", e);
        setChatError(e instanceof Error ? e.message : t('aiAssistantView.error'));
    } finally {
        setIsGeneratingAiResponse(false);
    }
  };
  
  const handleOpenFeatureDiscovery = (title: string, query: string) => {
    if (userLocation) {
        setFeatureDiscoveryState({ isOpen: true, title, query });
    } else {
        addToast({ message: t('sosModal.locationNotAvailable'), type: 'warning' });
    }
  };

  const handleLandmarkIdentified = (landmark: {name: string, description: string, confidence: number}) => {
    addToast({ 
      message: `Identified: ${landmark.name} (${Math.round(landmark.confidence * 100)}% confidence)`, 
      type: 'success' 
    });
    // Could also search for this landmark in places
    setSearchInput(landmark.name);
    setActiveTab('placeExplorer');
  };

  const handlePersonalizedRecommendations = async () => {
    if (!currentUser || !userLocation) return;
    
    try {
      const history = favoritePlaces.map(p => ({ name: p.name, type: p.type }));
      const recommendations = await generatePersonalizedRecommendations(history, {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      });
      
      addToast({ message: `Found ${recommendations.length} personalized recommendations!`, type: 'success' });
      // Could update places with recommendations
    } catch (error) {
      addToast({ message: 'Failed to get personalized recommendations', type: 'error' });
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'profile' && !currentUser) {
      handleShowAuthModal('login');
      return;
    }
    setActiveTab(tab);
  };

  const handleSelectPlaceDetail = (place: Place) => {
    setSelectedPlaceDetail(place);
    analyticsService.trackPlaceView(place.id, place.name, currentUser?.mongoId);
  };

  const handleToggleSelectForItinerary = (placeId: string) => {
    setSelectedPlaceIdsForItinerary(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleToggleFavoritePlace = async (placeId: string) => {
    const isFavorite = favoritePlaceIds.includes(placeId);
    
    // Optimistic update
    setFavoritePlaceIds(prev => 
      isFavorite
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
    
    // Sync with backend if user is logged in
    if (currentUser) {
      try {
        // Create user in backend if doesn't exist
        let userId = currentUser.mongoId;
        if (!userId) {
          const userResponse = await fetch(withApiBase(`/api/users`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData._id;
            setCurrentUser(prev => prev ? { ...prev, mongoId: userId } : null);
          }
        }
        
        if (userId) {
          const { favoritesService } = await import('./services/favoritesService.ts');
          if (isFavorite) {
            await favoritesService.removeFavorite(userId, placeId);
          } else {
            await favoritesService.addFavorite(userId, placeId);
          }
        }
      } catch (error) {
        // Revert on error
        setFavoritePlaceIds(prev => 
          isFavorite
            ? [...prev, placeId]
            : prev.filter(id => id !== placeId)
        );
        addToast({ message: 'Failed to update favorites', type: 'error' });
      }
    }
  };

  const handleToggleShowFavorites = () => {
    setShowFavoritesOnly(prev => !prev);
  };

  const handleToggleShowOpenOnly = () => {
    setShowOpenOnly(prev => !prev);
  };

  const handleSurpriseMeClick = async () => {
    setIsLoadingSurprise(true);
    setSurpriseError(null);
    try {
      const suggestion = await generateSurpriseSuggestion();
      setSurpriseSuggestion(suggestion);
      setShowSurpriseModal(true);
    } catch (err) {
      setSurpriseError(err instanceof Error ? err.message : 'Failed to generate surprise');
    } finally {
      setIsLoadingSurprise(false);
    }
  };

  const handleSelectPlaceByNameOrId = (identifier: string, isId?: boolean) => {
    // Search across allPlaces and dealsFallbackPlaces to enable details for Nearby Deals
    const candidateSets: Place[][] = [allPlaces, dealsFallbackPlaces];
    let found: Place | undefined;

    for (const set of candidateSets) {
      if (isId) {
        found = set.find(p => p.id === identifier || p.place_id === identifier);
      } else {
        found = set.find(p => p.name === identifier || p.id === identifier || p.place_id === identifier);
      }
      if (found) break;
    }

    if (found) {
      setSelectedPlaceDetail(found);
    }
  };

  const emergencyContacts: EmergencyContact[] = [];

  const handleGenerateItinerary = async () => {
    if (selectedPlaceIdsForItinerary.length === 0) {
      addToast({ message: 'Please select at least one place', type: 'warning' });
      return;
    }
    
    setIsGeneratingItinerary(true);
    setItineraryError(null);
    
    try {
      const selectedPlaces = allPlaces.filter(p => selectedPlaceIdsForItinerary.includes(p.id));
  const itinerary = await generateItineraryService(selectedPlaces);
  setGeneratedItinerary(itinerary);
    } catch (err) {
      setItineraryError(err instanceof Error ? err.message : 'Failed to generate itinerary');
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleClearItinerarySelection = () => {
    setSelectedPlaceIdsForItinerary([]);
  };

  const handleViewSavedOneDayItinerary = (itinerary: ItinerarySuggestion) => {
  setGeneratedItinerary(itinerary);
  };

  const handleDeleteSavedOneDayItinerary = (itineraryId: string) => {
    setSavedOneDayItineraries(prev => prev.filter(i => i.id !== itineraryId));
    addToast({ message: 'Itinerary deleted', type: 'success' });
  };

  const handleOptimizeRoute = async () => {
    if (!currentUser || selectedPlaceIdsForItinerary.length < 2) return;
    
    try {
      const selectedPlaces = allPlaces.filter(p => selectedPlaceIdsForItinerary.includes(p.id));
      const optimized = await optimizeBudget(selectedPlaces, 1000, currentUser.homeCurrency || 'USD');
      addToast({ message: 'Route optimized!', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to optimize route', type: 'error' });
    }
  };

  const handleGenerateTripPlan = async () => {
    if (!tripDestination || !tripDuration) {
      addToast({ message: 'Please fill in destination and duration', type: 'warning' });
      return;
    }
    
    setIsGeneratingTripPlan(true);
    setTripPlanError(null);
    
    try {
      const { TripPlanningService } = await import('./services/tripPlanningService.ts');
      const enhancedPlan = await TripPlanningService.createTripPlan({
        destination: tripDestination,
        duration: tripDuration,
        interests: tripInterests,
        pace: tripPace,
        travelStyles: tripTravelStyles,
        budget: tripBudget
      });
      setGeneratedTripPlan(enhancedPlan);
      addToast({ message: 'Trip plan generated successfully!', type: 'success' });
    } catch (err) {
      setTripPlanError(err instanceof Error ? err.message : 'Failed to generate trip plan');
      addToast({ message: 'Failed to generate trip plan', type: 'error' });
    } finally {
      setIsGeneratingTripPlan(false);
    }
  };

  const getTravelerProfile = () => {
    if (tripTravelStyles.includes(TravelStyle.FamilyFriendly)) return 'family';
    if (tripTravelStyles.includes(TravelStyle.BudgetExplorer)) return 'backpacker';
    if (tripTravelStyles.includes(TravelStyle.Luxury)) return 'luxury';
    if (tripTravelStyles.includes(TravelStyle.Adventure)) return 'adventure';
    return 'general';
  };

  const handleViewSavedTripPlan = (plan: TripPlanSuggestion) => {
    setGeneratedTripPlan(plan);
    // Navigate to planner tab and multiDay view to show the plan
    setActiveTab('planner');
    setPlannerView('multiDay');
  };

  const handleDeleteSavedTripPlan = async (planId: string) => {
    try {
      const { TripPlanningService } = await import('./services/tripPlanningService.ts');
      await TripPlanningService.deleteTripPlan(planId, currentUser?.mongoId);
      
      // Update local state
      setSavedTripPlans(TripPlanningService.getSavedPlans());
      addToast({ message: 'Trip plan deleted successfully!', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to delete trip plan', type: 'error' });
    }
  };

  const handleEditTripPlan = (plan: TripPlanSuggestion) => {
    setTripDestination(plan.destination);
    setTripDuration(plan.duration);
  setGeneratedTripPlan(plan);
  };

  const handleSaveTripPlan = async (plan: TripPlanSuggestion) => {
    try {
      const { TripPlanningService } = await import('./services/tripPlanningService.ts');
      await TripPlanningService.saveTripPlan(plan, currentUser?.mongoId);
      
      // Update local state
      setSavedTripPlans(TripPlanningService.getSavedPlans());
      addToast({ message: 'Trip plan saved successfully!', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to save trip plan', type: 'error' });
    }
  };

  const handleGenerateLocalAgencyPlan = async (location: string, planType: string, interests: string) => {
    setIsGeneratingLocalAgencyPlan(true);
    setLocalAgencyPlanError(null);
    
    try {
      const plan = await generateLocalAgencyPlan(location, planType, interests);
      setLocalAgencyPlan(plan);
    } catch (err) {
      setLocalAgencyPlanError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGeneratingLocalAgencyPlan(false);
    }
  };

  const handleFetchNearbyHospitals = async () => {
    if (!userLocation) return;
    
    setIsLoadingHospitals(true);
    setHospitalsError(null);
    
    try {
      const hospitals = await fetchNearbyHospitals(userLocation.latitude, userLocation.longitude);
      setNearbyHospitals(hospitals);
    } catch (err) {
      setHospitalsError(err instanceof Error ? err.message : 'Failed to fetch hospitals');
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  const handleNavigateToAdminPortal = () => {
    setPortalView('adminPortal');
  };

  const handleExitAdminPortal = () => {
    setPortalView('userApp');
  };

  const startTrial = (tier: SubscriptionTier) => {
    if (!currentUser) return;
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setCurrentUser(prev => prev ? {
      ...prev,
      tier,
      subscriptionStatus: 'trial',
      trialEndDate
    } : null);
    addToast({ message: `Started ${tier} trial!`, type: 'success' });
  };

  const subscribe = (tier: SubscriptionTier) => {
    if (!currentUser) return;
    const subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    setCurrentUser(prev => prev ? {
      ...prev,
      tier,
      subscriptionStatus: 'active',
      subscriptionEndDate
    } : null);
    addToast({ message: `Subscribed to ${tier}!`, type: 'success' });
  };

  const upgradeDowngradeTier = (newTier: SubscriptionTier) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, tier: newTier } : null);
    addToast({ message: `Changed to ${newTier} tier!`, type: 'success' });
  };

  const handleVoiceSearch = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({ message: "Voice recognition is not supported by your browser.", type: 'warning' });
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = language === 'es' ? 'es-ES' : 'en-US';
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        addToast({ message: "Listening...", type: 'info', duration: 2000 });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setSearchInput(finalTranscript + interimTranscript);
        if(finalTranscript){
            setActiveTab('placeExplorer');
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = "Voice recognition error";
        if (event.error === 'no-speech') {
            errorMessage = "No speech was detected. Please try again.";
        } else if (event.error === 'audio-capture') {
            errorMessage = "Microphone problem. Please check your microphone.";
        } else if (event.error === 'not-allowed') {
            errorMessage = "Permission to use microphone was denied.";
        }
        addToast({ message: errorMessage, type: 'error' });
        console.error('Speech recognition error:', event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';
    }


    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  }, [addToast, isListening, language]);


  const filteredPlaces = useMemo(() => {
    let placesToShow = allPlaces;

    if (showFavoritesOnly) {
      placesToShow = placesToShow.filter(place => favoritePlaceIds.includes(place.id));
    }

    if (showOpenOnly) {
      placesToShow = placesToShow.filter(place => place.opening_hours?.open_now);
    }

    if (selectedType !== 'All') {
      placesToShow = placesToShow.filter(place => place.type === selectedType);
    }

    return placesToShow;
  }, [allPlaces, showFavoritesOnly, favoritePlaceIds, showOpenOnly, selectedType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(allPlaces.map(place => place.type));
    return ['All', ...Array.from(types)];
  }, [allPlaces]);
  
  const placesWithDealsAll = useMemo(() => allPlaces.filter(p => p.deal), [allPlaces]);
  const placesWithDealsCommercial = useMemo(() => {
    const commercialTokens = ['food', 'restaurant', 'restaurants', 'lodging', 'hotel', 'hotels', 'shopping', 'shop', 'shops', 'cafe', 'cafes', 'entertainment'];
    return allPlaces.filter(place => {
      if (!place.deal) return false;
      const t = (place.type || '').toLowerCase();
      return commercialTokens.some(ct => t.includes(ct));
    });
  }, [allPlaces]);

  // Deal notifications - placed after placesWithDealsCommercial is defined
  useEffect(() => {
    if (placesWithDealsCommercial.length > 0 && favoritePlaceIds.length > 0) {
      try {
        notificationService.checkDealAlerts(favoritePlaceIds, placesWithDealsCommercial);
      } catch (e) {
        console.warn('Deal notification error:', e);
      }
    }
  }, [placesWithDealsCommercial, favoritePlaceIds]);

  const fallbackCommercialPlaces = useMemo(() => {
    const commercialTokens = ['food', 'restaurant', 'restaurants', 'lodging', 'hotel', 'hotels', 'shopping', 'shop', 'shops', 'cafe', 'cafes', 'entertainment'];
    return allPlaces.filter(place => {
      const t = (place.type || '').toLowerCase();
      return commercialTokens.some(ct => t.includes(ct));
    });
  }, [allPlaces]);

  // Load commercial categories for Deals tab if needed
  const [dealsFallbackPlaces, setDealsFallbackPlaces] = useState<Place[]>([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (activeTab !== 'deals') return;
      if (!userLocation) return;
      setIsLoadingDeals(true);
      try {
        const { fetchPlacesPipeline } = await import('./services/placesService.ts');
        const lat = userLocation.latitude;
        const lng = userLocation.longitude;
        const categories = ['hotels', 'restaurants', 'cafes', 'shopping'];
        const results = await Promise.all(
          categories.map(cat => fetchPlacesPipeline(lat, lng, [cat], selectedRadiusM, { topN: 6 }))
        );
        const merged = ([] as Place[]).concat(...results as any[]);
        const dedup = [] as Place[];
        const seen = new Set<string>();
        for (const p of merged) {
          const key = p.id || p.place_id || p.name;
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          dedup.push(p);
        }
        if (!cancelled) setDealsFallbackPlaces(dedup);
      } catch (e) {
        if (!cancelled) setDealsFallbackPlaces([]);
      } finally {
        if (!cancelled) setIsLoadingDeals(false);
      }
    };
    run();
    return () => { cancelled = true };
  }, [activeTab, userLocation, selectedRadiusM]);
  
  const favoritePlaces = useMemo(() => {
    return allPlaces.filter(p => favoritePlaceIds.includes(p.id))
  }, [allPlaces, favoritePlaceIds]);

  // List of available categories for the dropdown
  const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'landmarks', label: 'Landmarks' },
    { value: 'culture', label: 'Culture & History' },
    { value: 'nature', label: 'Nature & Outdoors' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'lodging', label: 'Accommodation' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'events', label: 'Events & Festivals' },
  ];

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    // Trigger a new search with the current search term
    loadPlaces(actualSearchTerm);
  };

  const renderMainContent = () => {
  if (portalView === 'adminPortal') {
    return (
      <React.Suspense fallback={<div className="p-6">Loading admin…</div>}>
        <AdminPortal 
          currentUser={currentUser}
          onExitAdminPortal={handleExitAdminPortal}
        />
      </React.Suspense>
    );
  }
  
  if (showMerchantPortal) {
    return (
      <div className="min-h-screen">
        <button
          onClick={() => setShowMerchantPortal(false)}
          className="fixed top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded z-50 hover:bg-gray-700"
          title="Back to App"
        >
          ← Back
        </button>
        <MerchantDealManager currentUser={currentUser!} />
      </div>
    );
  }
    let content;
    switch (activeTab) {
    case 'forYou':
    content = (
      <div className="space-y-6">
        {currentUser ? (
          <AdaptiveDashboard 
            user={currentUser} 
            onNavigateToTab={handleTabChange}
          />
        ) : (
          <SmartHomeDashboard />
        )}
        {userLocation && (
          <NearbyPlacesWidget
            userLocation={userLocation}
            onSelectPlace={handleSelectPlaceDetail}
          />
        )}
      </div>
    );
    break;
      case 'placeExplorer':
        content = (
          <>
            {/* Category Dropdown UI */}
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="category-select" className="font-semibold text-sm">Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border rounded px-2 py-1 text-sm"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="ml-4 flex items-center gap-2">
                <label htmlFor="radius-select" className="font-semibold text-sm">Radius:</label>
                <select
                  id="radius-select"
                  value={selectedRadiusM}
                  onChange={(e) => setSelectedRadiusM(Number(e.target.value))}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={15000}>15 km</option>
                  <option value={20000}>20 km</option>
                  <option value={30000}>30 km</option>
                </select>
              </div>
            </div>
            <PlaceExplorerView
                uniqueTypes={uniqueTypes}
                selectedType={selectedType}
                onSelectType={setSelectedType}
                filteredPlaces={filteredPlaces}
                isLoading={isLoading}
                isTransitioning={isTransitioning}
                error={error}
                onRetryLoadPlaces={() => loadPlaces(actualSearchTerm)}
                onSelectPlaceDetail={handleSelectPlaceDetail}
                selectedPlaceIdsForItinerary={selectedPlaceIdsForItinerary}
                onToggleSelectForItinerary={handleToggleSelectForItinerary}
                favoritePlaceIds={favoritePlaceIds}
                onToggleFavoritePlace={handleToggleFavoritePlace}
                showFavoritesOnly={showFavoritesOnly}
                onToggleShowFavorites={handleToggleShowFavorites}
                showOpenOnly={showOpenOnly}
                onToggleShowOpenOnly={handleToggleShowOpenOnly}
                onSurpriseMeClick={handleSurpriseMeClick}
                isLoadingSurprise={isLoadingSurprise}
                userLocation={userLocation}
                placeExplorerView={placeExplorerView}
                onTogglePlaceExplorerView={() => setPlaceExplorerView(prev => prev === 'grid' ? 'map' : 'grid')}
                placesWithDeals={placesWithDealsCommercial}
                onSelectPlaceByNameOrId={handleSelectPlaceByNameOrId}
                currentUserHomeCurrency={currentUser?.homeCurrency}
                exchangeRates={exchangeRates}
                hasAccessToBasic={hasAccess('basic')}
                hasAccessToPremium={hasAccess('premium')}
                hasMorePlaces={hasMorePlaces}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMorePlaces}
                // Smart search props
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                onAISearch={(query) => loadPlaces(query)}
                weather={localInfo?.weather || 'sunny'}
                timeOfDay={(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'morning';
                  if (hour < 18) return 'afternoon';
                  return 'evening';
                })()}
            />
          </>
        );
        break;
      case 'deals':
        content = <SimpleDealsView currentUser={currentUser} />;
        break;
      case 'planner':
        let plannerContent;
        if (!hasAccess('basic')) {
            plannerContent = <SubscriptionRequiredOverlay currentUser={currentUser} onStartTrial={startTrial} onSubscribe={subscribe} onUpgradeDowngradeTier={upgradeDowngradeTier} featureName="Planner" requiredTier="basic" onNavigateToProfile={() => handleTabChange('profile')} />;
        } else {
            switch (plannerView) {
                case 'oneDay':
                    plannerContent = <OneDayItineraryView selectedPlaceIdsForItinerary={selectedPlaceIdsForItinerary} onGenerateItinerary={handleGenerateItinerary} onClearSelection={handleClearItinerarySelection} savedItineraries={savedOneDayItineraries} onViewSavedItinerary={handleViewSavedOneDayItinerary} onDeleteSavedItinerary={handleDeleteSavedOneDayItinerary} isPlanSavable={hasAccess('basic')} selectedPlaces={allPlaces.filter(p => selectedPlaceIdsForItinerary.includes(p.id))} userLocation={userLocation} onOptimizeRoute={handleOptimizeRoute} generatedItinerary={generatedItinerary} isGenerating={isGeneratingItinerary} error={itineraryError} onSaveItinerary={async (it) => { 
                      if (!it.id) return; 
                      if (savedOneDayItineraries.some(i => i.id === it.id)) { 
                        addToast({ message: t('oneDayItineraryTab.planAlreadySavedInfo'), type: 'info' }); 
                        return; 
                      }
                      setSavedOneDayItineraries(prev => [...prev, it]); 
                      addToast({ message: t('oneDayItineraryTab.itinerarySavedToast'), type: 'success' });
                      if (currentUser) {
                        try {
                          let userId = currentUser.mongoId;
                          if (!userId) {
                            const userResponse = await fetch(withApiBase(`/api/users`), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
                            });
                            if (userResponse.ok) {
                              const userData = await userResponse.json();
                              userId = userData._id;
                              setCurrentUser(prev => prev ? { ...prev, mongoId: userId } : null);
                            }
                          }
                          await fetch(withApiBase(`/api/itineraries`), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId,
                              title: it.title,
                              introduction: it.introduction,
                              dailyPlan: it.dailyPlan,
                              conclusion: it.conclusion,
                              travelTips: it.travelTips || []
                            })
                          });
                        } catch (e) {
                          console.error('Error saving itinerary to database:', e);
                        }
                      }
                    }} savedOneDayItineraryIds={savedOneDayItineraries.map(i => i.id || '')} />;
                    break;
                case 'multiDay':
                      if (!hasAccess('premium')) {
                        plannerContent = <SubscriptionRequiredOverlay currentUser={currentUser} onStartTrial={startTrial} onSubscribe={subscribe} onUpgradeDowngradeTier={upgradeDowngradeTier} featureName={t('features.aiTripPlanner')} requiredTier="premium" onNavigateToProfile={() => handleTabChange('profile')} />;
                    } else {
                        plannerContent = <AITripPlannerView tripDestination={tripDestination} setTripDestination={setTripDestination} tripDuration={tripDuration} setTripDuration={setTripDuration} tripInterests={tripInterests} setTripInterests={setTripInterests} tripPace={tripPace} setTripPace={setTripPace} tripTravelStyles={tripTravelStyles} setTripTravelStyles={setTripTravelStyles} tripBudget={tripBudget} setTripBudget={setTripBudget} isGeneratingTripPlan={isGeneratingTripPlan} handleGenerateTripPlan={handleGenerateTripPlan} generatedTripPlan={generatedTripPlan} tripPlanError={tripPlanError} onSaveTripPlan={handleSaveTripPlan} isPlanSavable={hasAccess('premium')} savedTripPlans={savedTripPlans} onViewSavedTripPlan={handleViewSavedTripPlan} onDeleteSavedTripPlan={handleDeleteSavedTripPlan} onEditTripPlan={handleEditTripPlan} />;
                    }
                    break;

                case 'smart':
                    if (!hasAccess('premium')) {
                        plannerContent = <SubscriptionRequiredOverlay currentUser={currentUser} onStartTrial={startTrial} onSubscribe={subscribe} onUpgradeDowngradeTier={upgradeDowngradeTier} featureName="Smart AI Planner" requiredTier="premium" onNavigateToProfile={() => handleTabChange('profile')} />;
                    } else if (generatedTripPlan) {
                        plannerContent = <SmartTripPlannerView 
                            generatedTripPlan={generatedTripPlan} 
                            onUpdatePlan={setGeneratedTripPlan}
                            userLocation={userLocation || undefined}
                            weather={localInfo?.weather || 'sunny'}
                            budget={1000}
                        />;
                    } else {
                        plannerContent = (
                            <div className="text-center p-8">
                                <h3 className="text-xl font-bold mb-4">Smart AI Planner</h3>
                                <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>Generate a trip plan first to use the Smart Planner features.</p>
                                <button onClick={() => setPlannerView('multiDay')} className="btn btn-primary">Create Trip Plan</button>
                            </div>
                        );
                    }
                    break;
                case 'enhanced':
                    if (!hasAccess('premium')) {
                        plannerContent = <SubscriptionRequiredOverlay currentUser={currentUser} onStartTrial={startTrial} onSubscribe={subscribe} onUpgradeDowngradeTier={upgradeDowngradeTier} featureName="Enhanced Planner" requiredTier="premium" onNavigateToProfile={() => handleTabChange('profile')} />;
                    } else {
                        plannerContent = <EnhancedTripPlannerView 
                            activities={[]} 
                            onActivitiesChange={() => {}}
                            destination={tripDestination || userCity || 'Your Location'}
                            budget={1000}
                        />;
                    }
                    break;
                case 'localAgency':
                    if (!hasAccess('premium')) {
                        plannerContent = <SubscriptionRequiredOverlay currentUser={currentUser} onStartTrial={startTrial} onSubscribe={subscribe} onUpgradeDowngradeTier={upgradeDowngradeTier} featureName={t('features.localAgencyPlan')} requiredTier="premium" onNavigateToProfile={() => handleTabChange('profile')} />;
                    } else {
                        plannerContent = <LocalAgencyPlannerView onGeneratePlan={handleGenerateLocalAgencyPlan} isGenerating={isGeneratingLocalAgencyPlan} generatedPlan={localAgencyPlan} error={localAgencyPlanError} onBack={() => setPlannerView('hub')} onReset={() => setLocalAgencyPlan(null)} userCity={userCity} />;
                    }
                    break;
                case 'hub':
                default:
                    plannerContent = <PlannerHomeView 
                        setPlannerView={setPlannerView}
                        savedTripPlans={savedTripPlans}
                        onViewSavedTripPlan={handleViewSavedTripPlan}
                        onEditTripPlan={handleEditTripPlan}
                        onDeleteSavedTripPlan={handleDeleteSavedTripPlan}
                    />;
            }
        }
        content = plannerContent;
        break;
    case 'community':
      content = (
        <React.Suspense fallback={<div className="p-6">Loading community…</div>}>
        <EnhancedCommunityView
          currentUser={currentUser}
          posts={posts}
          onCreatePost={handleCreatePost}
          onLikePost={handleLikePost}
          onCommentPost={handleCommentPost}
          onSharePost={handleSharePost}
          onReportPost={handleReportPost}
          onBlockUser={handleBlockUser}
          onHidePost={handleHidePost}
          onDeletePost={handleDeletePost}
          isLoading={posts.length === 0 && isLoading}
        />
  </React.Suspense>
      );
    break;
      case 'aiAssistant':
          if (!hasAccess('premium')) {
              content = (
                <SubscriptionRequiredOverlay
                    currentUser={currentUser}
                    onStartTrial={startTrial}
                    onSubscribe={subscribe}
                    onUpgradeDowngradeTier={upgradeDowngradeTier}
                    featureName={t('features.aiAssistant')}
                    requiredTier="premium"
                    onNavigateToProfile={() => handleTabChange('profile')}
                />
              );
          } else {
              content = (
                  <AIAssistantView 
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isGeneratingResponse={isGeneratingAiResponse}
                      error={chatError}
                  />
              );
          }
          break;
      case 'profile':
        if (!currentUser) {
            // This case should ideally not be reached due to the check in handleTabChange,
            // but as a fallback, show login.
            content = <div className="p-8 text-center">Please log in to view your profile.</div>;
        } else {
            content = (
                <ProfileView 
                    user={currentUser}
                    setCurrentUser={setCurrentUser}
                    favoritePlaces={favoritePlaces}
                    savedTripPlans={savedTripPlans}
                    onViewSavedTripPlan={handleViewSavedTripPlan}
                    onDeleteSavedTripPlan={handleDeleteSavedTripPlan}
                    onShareTripPlanToCommunity={handleShareTripPlanToCommunity}
                    onSelectPlaceDetail={handleSelectPlaceDetail}
                    onRemoveFavorite={handleToggleFavoritePlace}
                    onStartOnboarding={() => setShowEnhancedOnboarding(true)}
                    onCompleteProfileSetup={() => setShowProfileTypeOnboarding(true)}
                />
            );
        }
        break;
      case 'subscription':
        if (!currentUser) {
            content = <div className="p-8 text-center">Please log in to manage your subscription.</div>;
        } else {
            content = (
                <SubscriptionManagement 
                    user={currentUser}
                    onSubscriptionChange={(subscriptionData) => {
                        setCurrentUser(prev => prev ? { 
                            ...prev, 
                            tier: subscriptionData.tier,
                            subscriptionStatus: subscriptionData.status,
                            subscriptionEndDate: subscriptionData.subscriptionEndDate,
                            trialEndDate: subscriptionData.trialEndDate
                        } : null);
                    }}
                    isAdmin={currentUser.isAdmin}
                />
            );
        }
        break;
      case 'subscriptionAnalytics':
        if (!currentUser?.isAdmin) {
            content = <div className="p-8 text-center">Admin access required to view subscription analytics.</div>;
        } else {
            content = (
                <SubscriptionAnalytics 
                    onClose={() => handleTabChange('profile')}
                />
            );
        }
        break;
      default:
        content = <div className="text-center p-8">Select a tab to get started.</div>;
    }
    return (
      <>
        <Header
          currentUser={currentUser}
          onShowAuthModal={handleShowAuthModal}
          onLogout={handleLogout}
          onNavigateToProfile={() => handleTabChange('profile')}
          onShowSOSModal={() => setShowSOSModal(true)}
          onNavigateToAdminPortal={currentUser?.isAdmin ? handleNavigateToAdminPortal : undefined}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isListening={isListening}
          onVoiceSearchClick={handleVoiceSearch}
          instantResults={instantResults}
          showInstantResults={showInstantResults}
          onSelectPlace={handleSelectPlaceDetail}
          onCloseInstantResults={() => setShowInstantResults(false)}
        />
          <main ref={mainContentRef} className="pt-24 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 flex-grow overflow-y-auto">
          {content}
          <div ref={footerSentinelRef} style={{ height: '1px' }}></div>
        </main>
        <Footer />
        <BottomNavigationBar activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  // Move useMemo hooks here, before any conditional returns
  const userReviewsForSelectedPlace = useMemo(() => {
    if (!selectedPlaceDetail) return [];
    return userReviews.filter(review => review.placeId === selectedPlaceDetail.id);
  }, [userReviews, selectedPlaceDetail]);

  // Only after all hooks:
  if (locationStatus === 'loading') {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner /> <span className="ml-2">Detecting your location...</span></div>;
  }
  if (locationStatus === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <LoadingSpinner />
        <span className="mt-2 text-red-600">Could not get your location. Showing default places for {DEFAULT_LOCATION.label}.</span>
        {userLocationError && <span className="text-xs text-gray-500 mt-1">{userLocationError}</span>}
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => loadUserLocation(true)}
          disabled={isFetchingUserLocation}
        >
          {isFetchingUserLocation ? 'Retrying...' : 'Retry Location'}
        </button>
        {renderMainContent()}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ToastContainer />
  {showAuthModal && <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} view={authModalView} onSwitchView={() => setAuthModalView(v => v === 'login' ? 'register' : 'login')} onLogin={handleLogin} onRegister={handleRegister} onForgotPassword={handleForgotPassword} isLoading={authLoading} error={authError} />}
  {selectedPlaceDetail && <PlaceDetailModal place={selectedPlaceDetail} onClose={() => setSelectedPlaceDetail(null)} homeCurrency={currentUser?.homeCurrency} exchangeRates={exchangeRates} userReviews={userReviewsForSelectedPlace} onAddUserReview={handleAddUserReview} currentUser={currentUser} hasAccessToBasic={hasAccess('basic')} hasAccessToPremium={hasAccess('premium')} />}
  {/* Modals removed in favor of inline planner views */}
      {showSurpriseModal && <SurpriseModal isOpen={showSurpriseModal} onClose={() => setShowSurpriseModal(false)} suggestion={surpriseSuggestion} isLoading={isLoadingSurprise} error={surpriseError} />}
      {showSOSModal && <SOSModal isOpen={showSOSModal} onClose={() => setShowSOSModal(false)} userLocation={userLocation} isFetchingUserLocation={isFetchingUserLocation} userLocationError={userLocationError} emergencyContacts={emergencyContacts} onFetchNearbyHospitals={handleFetchNearbyHospitals} nearbyHospitals={nearbyHospitals} isLoadingHospitals={isLoadingHospitals} hospitalsError={hospitalsError} onCheckInSafe={handleCheckInSafe} />}
      {showPhotoUploadModal && <PhotoUploadModal isOpen={showPhotoUploadModal} onClose={() => setShowPhotoUploadModal(false)} onUpload={handleUploadPhoto} isLoading={isUploadingPhoto} error={uploadPhotoError} />}
      {showCreatePostModal && (
        <React.Suspense fallback={<div className="p-6">Loading…</div>}>
          <CreatePostModal 
            isOpen={showCreatePostModal} 
            onClose={() => setShowCreatePostModal(false)} 
            onSubmit={handleCreatePost} 
            isLoading={isCreatingPost} 
            allPlaces={allPlaces} 
          />
        </React.Suspense>
      )}
      {postToShare && <ShareModal post={postToShare} onClose={() => setPostToShare(null)} />}
      {editPostTarget && (
        <React.Suspense fallback={<div className="p-6">Loading…</div>}>
          <EditPostModal
            isOpen={!!editPostTarget}
            post={editPostTarget}
            onClose={() => setEditPostTarget(null)}
            onSubmit={async (postId, updates) => {
              setIsSavingPostEdit(true);
              try {
                const resp = await fetch(withApiBase(`/api/posts/${postId}`), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ content: { text: updates.text }, tags: updates.tags, category: updates.category })
                });
                if (!resp.ok) {
                  addToast({ message: 'Failed to update post.', type: 'error' });
                } else {
                  const updated = await resp.json();
                  setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: { ...p.content, text: updated.content?.text ?? updates.text }, tags: Array.isArray(updated.tags) ? updated.tags : updates.tags, category: updated.category || updates.category } : p));
                  addToast({ message: 'Post updated.', type: 'success' });
                  setEditPostTarget(null);
                }
              } catch (e) {
                console.error('Failed to update post:', e);
                addToast({ message: 'Failed to update post.', type: 'error' });
              } finally {
                setIsSavingPostEdit(false);
              }
            }}
            isSaving={isSavingPostEdit}
          />
        </React.Suspense>
      )}
      {showWelcomeWizard && currentUser && <WelcomeWizardModal user={currentUser} onComplete={handleWelcomeWizardComplete} onClose={() => setShowWelcomeWizard(false)} />}
      {showEnhancedOnboarding && currentUser && (
        <EnhancedOnboardingFlow 
          user={currentUser} 
          onComplete={handleEnhancedOnboardingComplete} 
          onClose={() => setShowEnhancedOnboarding(false)} 
        />
      )}
      {showProfileTypeOnboarding && (
        <ProfileTypeOnboarding 
          onComplete={handleProfileTypeComplete}
          onSkip={() => setShowProfileTypeOnboarding(false)}
        />
      )}
      {showCurrencyConverter && <CurrencyConverterModal isOpen={showCurrencyConverter} onClose={() => setShowCurrencyConverter(false)} baseCurrency={currentUser?.homeCurrency || 'USD'} exchangeRates={exchangeRates} />}
      {featureDiscoveryState.isOpen && userLocation && (
          <FeatureDiscoveryModal 
              isOpen={featureDiscoveryState.isOpen}
              onClose={() => setFeatureDiscoveryState({isOpen: false, title: '', query: ''})}
              title={featureDiscoveryState.title}
              query={featureDiscoveryState.query}
              userLocation={userLocation}
              onSelectPlaceDetail={handleSelectPlaceDetail}
          />
      )}
      {showLostAndFoundModal && (
          <LostAndFoundModal
              isOpen={showLostAndFoundModal}
              onClose={() => setShowLostAndFoundModal(false)}
              userCity={userCity || "your current city"}
          />
      )}
      {showFlightHelpModal && (
          <FlightHelpModal
              isOpen={showFlightHelpModal}
              onClose={() => setShowFlightHelpModal(false)}
          />
      )}
      {showLandmarkRecognition && (
          <LandmarkRecognitionModal
              isOpen={showLandmarkRecognition}
              onClose={() => setShowLandmarkRecognition(false)}
              onLandmarkIdentified={handleLandmarkIdentified}
          />
      )}
      {showLocationSharing && (
          <LocationSharingModal
              isOpen={showLocationSharing}
              onClose={() => setShowLocationSharing(false)}
              currentUser={currentUser}
              userLocation={userLocation}
          />
      )}
      {showRealTimeChat && (
          <div className="fixed bottom-4 right-4 z-50">
              <RealTimeChatView
                  currentUser={currentUser}
                  roomId={chatRoomId}
                  onClose={() => setShowRealTimeChat(false)}
              />
          </div>
      )}
      {showAPIStatusChecker && (
          <APIStatusChecker
              onClose={() => setShowAPIStatusChecker(false)}
          />
      )}
      {showPaymentModal && selectedPlan && (
          <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              planId={selectedPlan.id}
              planName={selectedPlan.name}
              amount={selectedPlan.price}
              onSuccess={() => {
                subscribe(selectedPlan.id as any);
                setShowPaymentModal(false);
              }}
          />
      )}
      {renderMainContent()}
      
      {/* Onboarding Completion Toast */}
      {showCompletionToast && currentUser && (
        <OnboardingCompletionToast
          user={currentUser}
          isVisible={showCompletionToast}
          onClose={() => setShowCompletionToast(false)}
        />
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <>
          <APIUsageMonitor />
          <DatabaseConnectivityTest />
          <PlacesPerformanceMonitor />
          <AnalyticsDashboard />
        </>
      )}
    </div>
  );
};

export default App;