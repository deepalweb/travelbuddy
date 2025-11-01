import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Globe, MapPin, Hotel, Calendar, Plane, Train, Car,
  Star, Clock, DollarSign, Wifi, Coffee, Car as CarIcon,
  MessageCircle, ChevronLeft, ChevronRight, Play, ArrowRight,
  Sun, Cloud, Umbrella, Phone, AlertTriangle, Users, Bot, Compass,
  Smartphone, PlayCircle
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { ImageWithFallback } from './ImageWithFallback'
import { DestinationCardSkeleton } from './SkeletonLoader'
import { CulturalInsights } from './CulturalInsights'
import { unsplashService } from '../services/unsplashService'
import type { UnsplashImage } from '../services/unsplashService'
import { useUserLocation } from '../hooks/useUserLocation'
import { destinationsByCountry, culturalInfoByCountry } from '../data/locationBasedContent'
import { AdminAccess } from './AdminAccess'

const accommodations = [
  // Luxury
  {
    id: 1,
    name: 'Grand Palace Hotel',
    location: 'Paris, France',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=10',
    rating: 4.8,
    price: '$280-450',
    category: 'Luxury',
    amenities: ['wifi', 'pool', 'spa']
  },
  {
    id: 2,
    name: 'Marina Bay Resort',
    location: 'Singapore',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=13',
    rating: 4.9,
    price: '$350-520',
    category: 'Luxury',
    amenities: ['wifi', 'pool', 'concierge']
  },
  {
    id: 3,
    name: 'Alpine Luxury Lodge',
    location: 'Swiss Alps',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=14',
    rating: 4.7,
    price: '$400-600',
    category: 'Luxury',
    amenities: ['wifi', 'spa', 'restaurant']
  },
  // Boutique
  {
    id: 4,
    name: 'Zen Garden Inn',
    location: 'Kyoto, Japan',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=11',
    rating: 4.6,
    price: '$120-180',
    category: 'Boutique',
    amenities: ['wifi', 'breakfast', 'garden']
  },
  {
    id: 5,
    name: 'Casa Artista',
    location: 'Barcelona, Spain',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=15',
    rating: 4.5,
    price: '$90-140',
    category: 'Boutique',
    amenities: ['wifi', 'art', 'rooftop']
  },
  {
    id: 6,
    name: 'Desert Oasis Hotel',
    location: 'Marrakech, Morocco',
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=16',
    rating: 4.4,
    price: '$80-120',
    category: 'Boutique',
    amenities: ['wifi', 'pool', 'traditional']
  },
  // Budget
  {
    id: 7,
    name: 'Backpacker Hostel',
    location: 'Bangkok, Thailand',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=12',
    rating: 4.2,
    price: '$25-45',
    category: 'Budget',
    amenities: ['wifi', 'kitchen', 'lounge']
  },
  {
    id: 8,
    name: 'City Center Inn',
    location: 'Prague, Czech Republic',
    image: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=17',
    rating: 4.0,
    price: '$35-55',
    category: 'Budget',
    amenities: ['wifi', 'breakfast', 'location']
  },
  {
    id: 9,
    name: 'Surf Lodge',
    location: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=18',
    rating: 4.3,
    price: '$20-40',
    category: 'Budget',
    amenities: ['wifi', 'beach', 'surfboard']
  }
]

const events = [
  {
    id: 1,
    name: 'Cherry Blossom Festival',
    date: '2024-04-15',
    location: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=20',
    daysLeft: 45,
    category: 'Cultural',
    price: 'Free',
    flag: '🇯🇵'
  },
  {
    id: 2,
    name: 'Oktoberfest',
    date: '2024-09-21',
    location: 'Munich, Germany',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=21',
    daysLeft: 120,
    category: 'Festival',
    price: '€25-45',
    flag: '🇩🇪'
  },
  {
    id: 3,
    name: 'Day of the Dead',
    date: '2024-11-02',
    location: 'Mexico City, Mexico',
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34d19?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=26',
    daysLeft: 165,
    category: 'Cultural',
    price: 'Free',
    flag: '🇲🇽'
  },
  {
    id: 4,
    name: 'Chinese New Year',
    date: '2025-01-29',
    location: 'Beijing, China',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=27',
    daysLeft: 253,
    category: 'Cultural',
    price: 'Free',
    flag: '🇨🇳'
  },
  {
    id: 5,
    name: 'Coachella',
    date: '2024-04-12',
    location: 'California, USA',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=28',
    daysLeft: 42,
    category: 'Festival',
    price: '$400-600',
    flag: '🇺🇸'
  },
  {
    id: 6,
    name: 'Glastonbury Festival',
    date: '2024-06-26',
    location: 'Somerset, England',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=29',
    daysLeft: 117,
    category: 'Festival',
    price: '£335',
    flag: '🇬🇧'
  },
  {
    id: 7,
    name: 'Venice Biennale',
    date: '2024-04-20',
    location: 'Venice, Italy',
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=30',
    daysLeft: 50,
    category: 'Arts',
    price: '€25',
    flag: '🇮🇹'
  },
  {
    id: 8,
    name: 'Art Basel',
    date: '2024-06-13',
    location: 'Basel, Switzerland',
    image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=31',
    daysLeft: 104,
    category: 'Arts',
    price: 'CHF 45',
    flag: '🇨🇭'
  },
  {
    id: 9,
    name: 'Holi Festival',
    date: '2024-03-25',
    location: 'New Delhi, India',
    image: 'https://images.unsplash.com/photo-1583339793403-3d9b001b6008?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=32',
    daysLeft: 24,
    category: 'Traditional',
    price: 'Free',
    flag: '🇮🇳'
  },
  {
    id: 10,
    name: 'Midsummer Festival',
    date: '2024-06-21',
    location: 'Stockholm, Sweden',
    image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=33',
    daysLeft: 112,
    category: 'Traditional',
    price: 'Free',
    flag: '🇸🇪'
  },
  {
    id: 5,
    name: 'Edinburgh Fringe Festival',
    date: '2024-08-02',
    location: 'Edinburgh, Scotland',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=24',
    daysLeft: 95,
    category: 'Arts',
    price: '£15-60',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿'
  },
  {
    id: 6,
    name: 'Songkran Water Festival',
    date: '2024-04-13',
    location: 'Bangkok, Thailand',
    image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=25',
    daysLeft: 43,
    category: 'Traditional',
    price: 'Free',
    flag: '🇹🇭'
  }
]

const guides = [
  {
    id: 1,
    name: 'Marie Dubois',
    specialty: 'Food Tours',
    language: 'French, English',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Hiroshi Tanaka',
    specialty: 'Cultural Heritage',
    language: 'Japanese, English',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  }
]

export const NewHomePage: React.FC = () => {
  const { location, loading: locationLoading } = useUserLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDestination, setCurrentDestination] = useState(0)
  const [currentHeroBackground, setCurrentHeroBackground] = useState(0)
  const [activeDestinationFilter, setActiveDestinationFilter] = useState('Most Visited')
  const [currentAccommodation, setCurrentAccommodation] = useState(0)
  const [showChatbot, setShowChatbot] = useState(false)
  const [activeAccommodationFilter, setActiveAccommodationFilter] = useState('Luxury')

  const [activeEventFilter, setActiveEventFilter] = useState('All')
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi! I\'m your AI Travel Assistant. How can I help you plan your next adventure?', sender: 'bot' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [destinationImages, setDestinationImages] = useState<UnsplashImage[]>([])
  const [loadingImages, setLoadingImages] = useState(true)

  // Hero background landscapes for rotation
  const heroBackgrounds = [
    {
      id: 1,
      name: 'Bali',
      image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&h=1080&fit=crop&auto=format&q=80',
      fallbackImage: 'https://picsum.photos/1920/1080?random=1'
    },
    {
      id: 2,
      name: 'Alps',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80',
      fallbackImage: 'https://picsum.photos/1920/1080?random=2'
    },
    {
      id: 3,
      name: 'New York',
      image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805b6d?w=1920&h=1080&fit=crop&auto=format&q=80',
      fallbackImage: 'https://picsum.photos/1920/1080?random=3'
    },
    {
      id: 4,
      name: 'Santorini',
      image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1920&h=1080&fit=crop&auto=format&q=80',
      fallbackImage: 'https://picsum.photos/1920/1080?random=4'
    }
  ]

  // Destination filters
  const destinationFilters = ['Most Visited', 'Trending 2025', 'Hidden Gems']

  // Destinations organized by filter categories
  const destinationsByFilter = {
    'Most Visited': [
      {
        id: 1,
        name: 'Paris',
        tagline: 'City of Light',
        image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.9,
        season: 'Apr-Oct',
        budget: '€80-150/day',
        fallbackImage: 'https://picsum.photos/600/400?random=1'
      },
      {
        id: 2,
        name: 'Tokyo',
        tagline: 'Modern Metropolis',
        image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.8,
        season: 'Mar-May',
        budget: '¥8000-15000/day',
        fallbackImage: 'https://picsum.photos/600/400?random=2'
      },
      {
        id: 3,
        name: 'New York',
        tagline: 'The Big Apple',
        image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805b6d?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.7,
        season: 'Apr-Jun',
        budget: '$100-200/day',
        fallbackImage: 'https://picsum.photos/600/400?random=3'
      },
      {
        id: 4,
        name: 'Rome',
        tagline: 'Eternal City',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.7,
        season: 'Apr-Jun',
        budget: '€60-120/day',
        fallbackImage: 'https://picsum.photos/600/400?random=6'
      },
      {
        id: 5,
        name: 'London',
        tagline: 'Royal Capital',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.6,
        season: 'May-Sep',
        budget: '£70-140/day',
        fallbackImage: 'https://picsum.photos/600/400?random=7'
      },
      {
        id: 6,
        name: 'Dubai',
        tagline: 'City of Gold',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.6,
        season: 'Nov-Mar',
        budget: '$80-200/day',
        fallbackImage: 'https://picsum.photos/600/400?random=5'
      }
    ],
    'Trending 2025': [
      {
        id: 7,
        name: 'Bali',
        tagline: 'Island Paradise',
        image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.8,
        season: 'Apr-Oct',
        budget: '$30-80/day',
        fallbackImage: 'https://picsum.photos/600/400?random=4'
      },
      {
        id: 8,
        name: 'Seoul',
        tagline: 'K-Culture Hub',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.7,
        season: 'Mar-May',
        budget: '$50-120/day',
        fallbackImage: 'https://picsum.photos/600/400?random=8'
      },
      {
        id: 9,
        name: 'Lisbon',
        tagline: 'European Gem',
        image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.5,
        season: 'Apr-Oct',
        budget: '€40-90/day',
        fallbackImage: 'https://picsum.photos/600/400?random=9'
      },
      {
        id: 10,
        name: 'Mexico City',
        tagline: 'Cultural Capital',
        image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.4,
        season: 'Oct-Apr',
        budget: '$25-70/day',
        fallbackImage: 'https://picsum.photos/600/400?random=10'
      },
      {
        id: 11,
        name: 'Cape Town',
        tagline: 'Mother City',
        image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.6,
        season: 'Nov-Mar',
        budget: '$35-85/day',
        fallbackImage: 'https://picsum.photos/600/400?random=11'
      },
      {
        id: 12,
        name: 'Tulum',
        tagline: 'Bohemian Paradise',
        image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.5,
        season: 'Nov-Apr',
        budget: '$40-100/day',
        fallbackImage: 'https://picsum.photos/600/400?random=12'
      }
    ],
    'Hidden Gems': [
      {
        id: 13,
        name: 'Faroe Islands',
        tagline: 'Nordic Secret',
        image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.9,
        season: 'Jun-Aug',
        budget: '$80-150/day',
        fallbackImage: 'https://picsum.photos/600/400?random=13'
      },
      {
        id: 14,
        name: 'Socotra Island',
        tagline: 'Alien Paradise',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.8,
        season: 'Oct-Apr',
        budget: '$60-120/day',
        fallbackImage: 'https://picsum.photos/600/400?random=14'
      },
      {
        id: 15,
        name: 'Raja Ampat',
        tagline: 'Diving Heaven',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.7,
        season: 'Oct-Apr',
        budget: '$50-100/day',
        fallbackImage: 'https://picsum.photos/600/400?random=15'
      },
      {
        id: 16,
        name: 'Salar de Uyuni',
        tagline: 'Mirror of Sky',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.6,
        season: 'May-Oct',
        budget: '$30-70/day',
        fallbackImage: 'https://picsum.photos/600/400?random=16'
      },
      {
        id: 17,
        name: 'Lofoten Islands',
        tagline: 'Arctic Wonder',
        image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.8,
        season: 'Jun-Aug',
        budget: '$70-140/day',
        fallbackImage: 'https://picsum.photos/600/400?random=17'
      },
      {
        id: 18,
        name: 'Bhutan',
        tagline: 'Last Shangri-La',
        image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&h=400&fit=crop&auto=format&q=80',
        rating: 4.9,
        season: 'Mar-May',
        budget: '$200-250/day',
        fallbackImage: 'https://picsum.photos/600/400?random=18'
      }
    ]
  }

  // Get current destinations based on active filter
  const getCurrentDestinations = () => {
    return destinationsByFilter[activeDestinationFilter as keyof typeof destinationsByFilter] || destinationsByFilter['Most Visited']
  }

  // Get trip planning steps based on active filter
  const getTripPlanningSteps = () => {
    const stepsByFilter = {
      'Most Visited': [
        { step: 1, title: 'Choose Popular Destination', desc: 'Select from world-famous cities' },
        { step: 2, title: 'Book Must-See Attractions', desc: 'Skip the lines at iconic landmarks' },
        { step: 3, title: 'Find Top-Rated Hotels', desc: 'Stay where millions have loved' }
      ],
      'Trending 2025': [
        { step: 1, title: 'Discover Emerging Hotspots', desc: 'Be among the first to explore' },
        { step: 2, title: 'Experience New Culture', desc: 'Authentic local experiences' },
        { step: 3, title: 'Share Your Discovery', desc: 'Inspire others with your journey' }
      ],
      'Hidden Gems': [
        { step: 1, title: 'Find Secret Locations', desc: 'Off-the-beaten-path destinations' },
        { step: 2, title: 'Plan Adventure Activities', desc: 'Unique experiences few have tried' },
        { step: 3, title: 'Prepare for the Unknown', desc: 'Essential tips for remote travel' }
      ]
    }
    return stepsByFilter[activeDestinationFilter as keyof typeof stepsByFilter] || stepsByFilter['Most Visited']
  }

  // Get trip planning preview based on active filter
  const getTripPlanningPreview = () => {
    const previewByFilter = {
      'Most Visited': [
        'Day 1: Arrival & City Tour',
        'Day 2: Famous Landmarks',
        'Day 3: Museums & Culture'
      ],
      'Trending 2025': [
        'Day 1: Local Neighborhood Exploration',
        'Day 2: Emerging Art Scene',
        'Day 3: Hidden Food Markets'
      ],
      'Hidden Gems': [
        'Day 1: Remote Location Setup',
        'Day 2: Adventure Activities',
        'Day 3: Cultural Immersion'
      ]
    }
    return previewByFilter[activeDestinationFilter as keyof typeof previewByFilter] || previewByFilter['Most Visited']
  }

  // Get cultural info based on user location
  const getCulturalInfo = () => {
    if (locationLoading) return culturalInfoByCountry.LK
    return culturalInfoByCountry[location.countryCode as keyof typeof culturalInfoByCountry] || culturalInfoByCountry.LK
  }
  
  const culturalInfo = getCulturalInfo()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDestination((prev) => (prev + 1) % getCurrentDestinations().length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeDestinationFilter])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroBackground((prev) => (prev + 1) % heroBackgrounds.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDestinationImages = async () => {
      try {
        const images = await unsplashService.getDestinationImages()
        setDestinationImages(images)
      } catch (error) {
        console.error('Failed to fetch destination images:', error)
      } finally {
        setLoadingImages(false)
      }
    }

    fetchDestinationImages()
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    const userMessage = { id: Date.now(), text: inputMessage, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    try {
      // TODO: Connect to OpenAI API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      })
      
      const data = await response.json()
      const botMessage = { id: Date.now() + 1, text: data.response || 'Sorry, I\'m having trouble right now. Please try again.', sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = { id: Date.now() + 1, text: 'I\'m currently offline. Please try again later.', sender: 'bot' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={heroBackgrounds[currentHeroBackground].image}
            fallbackSrc={heroBackgrounds[currentHeroBackground].fallbackImage}
            alt={`${heroBackgrounds[currentHeroBackground].name} landscape`}
            className="h-full w-full object-cover transition-opacity duration-1000"
          />
        </div>
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4">
          <main className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-8 text-center text-white">
              <div className="flex flex-col items-center gap-4">
                <h1 
                  className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter drop-shadow-xl"
                  style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                >
                  Discover the World with Ease
                </h1>
                <p className="max-w-2xl text-xl text-white/90 drop-shadow-lg">
                  Your intelligent travel companion — plan, book, and explore anywhere.
                </p>
              </div>
              
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <Link to="/trips">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Start Planning
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/discovery">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Explore Destinations
                    <Compass className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

              </div>
              
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <a 
                  className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-black/50 px-6 py-3 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/20 hover:ring-white/40 hover:shadow-xl"
                  href="#"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.1685 13.9936C19.2215 12.046 21.1345 11.0094 21.2145 10.962C21.1555 10.8263 20.1585 10.2336 19.3495 10.2036C18.4115 10.1664 17.6545 10.7447 17.2025 11.1967C16.5915 11.8349 16.1465 12.7224 16.2025 13.8216C16.2025 13.8359 16.2065 13.8503 16.2065 13.8647C16.2065 13.879 16.2025 13.8862 16.2025 13.9005C16.1885 15.1055 16.8915 16.1315 17.5815 16.7424C18.0635 17.2087 18.6675 17.6339 19.4125 17.6511C19.4695 17.6511 19.5195 17.6511 19.5735 17.6511C20.2525 17.6511 20.8495 17.2944 21.2685 16.8824C21.2825 16.8644 21.2965 16.8501 21.3105 16.8357C20.1985 16.2647 19.1315 14.8687 19.1685 13.9936Z"></path>
                    <path d="M17.848 9.77448C18.253 9.29848 18.571 8.65648 18.533 7.92548C17.772 7.98948 17.012 8.44548 16.593 8.92548C16.223 9.35448 15.864 10.0535 15.932 10.7445C16.735 10.6975 17.436 10.2505 17.848 9.77448Z"></path>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs">Download on the</p>
                    <p className="text-base font-semibold">App Store</p>
                  </div>
                </a>
                
                <a 
                  className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-black/50 px-6 py-3 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/20 hover:ring-white/40 hover:shadow-xl"
                  href="#"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.75781 1.00195L18.8228 12.002L2.75781 23.002L2.78081 1.02495L2.75781 1.00195Z" fill="#FBC02D"></path>
                    <path d="M2.78081 1.02495L12.5648 12.002L2.78081 22.979L2.78081 1.02495Z" fill="#F57C00"></path>
                    <path d="M21.1119 14.157L18.8229 12L12.5649 18.324L14.0779 19.837L21.1119 14.157Z" fill="#2196F3"></path>
                    <path d="M21.1119 9.84495L14.0779 4.16495L12.5649 5.67795L18.8229 12L21.1119 9.84495Z" fill="#4CAF50"></path>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs">GET IT ON</p>
                    <p className="text-base font-semibold">Google Play</p>
                  </div>
                </a>
              </div>
              
              <div className="mt-8 max-w-4xl space-y-4 rounded-xl bg-black/30 p-6 backdrop-blur-md ring-1 ring-white/10">
                <p className="text-lg font-semibold text-white">Discover Sri Lanka with our mobile app:</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-left md:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Find authentic Sri Lankan experiences, from ancient temples to pristine beaches.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Get offline maps, so you're never lost, even without a connection.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Real-time local recommendations and exclusive deals on the go.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* 2. Discover Destinations */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Popular Destinations
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Amazing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                Destinations
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              From bustling cities to serene landscapes, explore handpicked destinations that offer unforgettable experiences
            </p>
            
            {/* Destination Filters */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white rounded-xl shadow-lg border border-gray-200 p-1">
                {destinationFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveDestinationFilter(filter)}
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeDestinationFilter === filter
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getCurrentDestinations().map((destination, index) => {
              return (
                <Card key={destination.id} className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-2xl">
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <ImageWithFallback
                      src={destination.image}
                      fallbackSrc={destination.fallbackImage}
                      alt={destination.name}
                      className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">{destination.rating}</span>
                    </div>
                    
                    {/* Season Badge */}
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Best: {destination.season}
                    </div>
                    
                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{destination.name}</h3>
                      <p className="text-white/90 text-sm mb-4 drop-shadow">{destination.tagline}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">{destination.budget}</span>
                        </div>
                        
                        <Button 
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 rounded-full px-6 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                        >
                          Explore Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Number */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                </Card>
              )
            })}
          </div>
          
          {/* View All Button */}
          <div className="text-center mt-16">
            <Link to="/discovery">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                View All Destinations
                <Compass className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Plan Your Trip */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Plan your trip from anywhere — to anywhere.</h2>
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              Our AI-powered trip planner creates personalized itineraries in seconds. 
              Just tell us where you want to go, and we'll handle the rest.
            </p>
            <p className="text-lg text-gray-500 mb-8 italic max-w-2xl mx-auto">
              "From flights to hotels to experiences — all in one planner."
            </p>
            

          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              
              <div className="space-y-4 mb-8">
                {[
                  { step: 1, title: 'Choose Destination', desc: 'Pick where you want to go' },
                  { step: 2, title: 'Add Places & Activities', desc: 'Customize your itinerary' },
                  { step: 3, title: 'Save & Share Trip', desc: 'Keep it organized and accessible' }
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/trips">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Start Your Free Trip Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">✨ Your Perfect 3-Day Itinerary</h3>
                  <p className="text-blue-100">Automatically generated just for you</p>
                </div>
                <div className="space-y-4">
                  {[
                    { day: 'Day 1: Arrival & City Tour', icon: '🏙️', time: '9:00 AM - 6:00 PM' },
                    { day: 'Day 2: Cultural Sites', icon: '🏛️', time: '10:00 AM - 5:00 PM' }, 
                    { day: 'Day 3: Beach & Relaxation', icon: '🏖️', time: '11:00 AM - Sunset' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
                            {item.icon}
                          </div>
                          <div>
                            <span className="font-semibold text-white">{item.day}</span>
                            <p className="text-blue-100 text-sm">{item.time}</p>
                          </div>
                        </div>
                        <div className="text-white/60 text-sm">Day {index + 1}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-100">Total estimated cost:</span>
                    <span className="font-bold text-white text-lg">$450-680</span>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm animate-bounce">
                ⭐
              </div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-xs animate-pulse">
                ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stay Anywhere */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Stay Anywhere</h2>
            <p className="text-xl text-gray-600 mb-8">Find and compare accommodations worldwide — from luxury to local stays.</p>
            
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white rounded-xl shadow-lg border border-gray-200 p-1">
                {['Luxury', 'Boutique', 'Budget'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveAccommodationFilter(filter)}
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeAccommodationFilter === filter
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {accommodations.filter(stay => stay.category === activeAccommodationFilter).map((stay) => (
              <Card key={stay.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <ImageWithFallback
                  src={stay.image}
                  fallbackSrc={stay.fallbackImage}
                  alt={stay.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{stay.name}</h3>
                      <p className="text-sm text-gray-500 mb-1">{stay.location}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{stay.rating}</span>
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full ml-2">{stay.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stay.price}</p>
                      <p className="text-sm text-gray-500">per night</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    {stay.amenities.includes('wifi') && <Wifi className="w-4 h-4 text-gray-400" />}
                    {stay.amenities.includes('breakfast') && <Coffee className="w-4 h-4 text-gray-400" />}
                    {stay.amenities.includes('pool') && <span className="text-xs text-gray-400">🏊</span>}
                  </div>
                  
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Get Around */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-green-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-green-100 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Car className="w-4 h-4" />
              Transportation Hub
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Get Around
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
                With Ease
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From international flights to local buses, find the perfect way to reach your destination
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Flights Card */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Plane className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Flights & Long Distance</h3>
                    <p className="text-blue-100">International and domestic flights</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">✈️</div>
                        <div>
                          <span className="font-medium">New York → London</span>
                          <p className="text-xs text-blue-100">Direct • British Airways</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">7h 30m</div>
                        <div className="font-bold text-lg">$420</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🌏</div>
                        <div>
                          <span className="font-medium">Dubai → Singapore</span>
                          <p className="text-xs text-blue-100">Direct • Emirates</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">7h 15m</div>
                        <div className="font-bold text-lg">$380</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🚀</div>
                        <div>
                          <span className="font-medium">Tokyo → Los Angeles</span>
                          <p className="text-xs text-blue-100">Direct • JAL</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-blue-100">11h 45m</div>
                        <div className="font-bold text-lg">$650</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full mt-6 bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105">
                  Book Flights
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
            
            {/* Local Transport Card */}
            <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Train className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Local Transport</h3>
                    <p className="text-green-100">Trains, buses, and local options</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🚄</div>
                        <div>
                          <span className="font-medium">Paris → Amsterdam</span>
                          <p className="text-xs text-green-100">High-speed • Thalys</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-100">3h 20m</div>
                        <div className="font-bold text-lg">$85</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🚇</div>
                        <div>
                          <span className="font-medium">Tokyo Metro Pass</span>
                          <p className="text-xs text-green-100">Unlimited • JR Lines</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-100">7 days</div>
                        <div className="font-bold text-lg">$45</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg">🚌</div>
                        <div>
                          <span className="font-medium">London Bus Pass</span>
                          <p className="text-xs text-green-100">Oyster Card • TfL</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-100">Weekly</div>
                        <div className="font-bold text-lg">$35</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link to="/transportation">
                  <Button className="w-full mt-6 bg-white text-green-600 hover:bg-green-50 font-semibold py-3 rounded-xl transition-all duration-300 hover:scale-105">
                    Explore Local
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
          
          {/* Quick Transport Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🚗', name: 'Car Rental', desc: 'Global brands • From $25/day', popular: 'Hertz, Avis' },
              { icon: '🚲', name: 'Bike Share', desc: 'City bikes • From $2/hour', popular: 'Citi Bike, Vélib' },
              { icon: '🛵', name: 'E-Scooter', desc: 'Electric rides • From $0.15/min', popular: 'Lime, Bird' },
              { icon: '🚕', name: 'Ride Hailing', desc: 'On-demand rides', popular: 'Uber, Grab, Didi' }
            ].map((transport, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm border border-white/20">
                <div className="text-4xl mb-3">{transport.icon}</div>
                <h4 className="font-bold text-gray-900 mb-1">{transport.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{transport.desc}</p>
                <p className="text-xs text-gray-500">{transport.popular}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Travel Deals & Offers */}
      <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <DollarSign className="w-4 h-4" />
              Limited Time Offers
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Exclusive
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Travel Deals
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Save big on your next adventure with our handpicked deals and special offers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Flash Sale',
                discount: 'UP TO 50% OFF',
                description: 'Limited time flights & hotels',
                validUntil: 'Ends in 2 days',
                color: 'from-red-500 to-orange-500',
                icon: '⚡',
                urgent: true
              },
              {
                title: 'Last Minute Deals',
                discount: '35% OFF',
                description: 'Book within 7 days of travel',
                validUntil: 'While supplies last',
                color: 'from-blue-500 to-blue-600',
                icon: '🎯',
                urgent: false
              },
              {
                title: 'Student & Youth',
                discount: '25% OFF',
                description: 'Valid student ID required',
                validUntil: 'Year-round offer',
                color: 'from-green-500 to-green-600',
                icon: '🎓',
                urgent: false
              },
              {
                title: 'Group Adventures',
                discount: '40% OFF',
                description: 'Groups of 8+ travelers',
                validUntil: 'Book 30 days ahead',
                color: 'from-purple-500 to-purple-600',
                icon: '👥',
                urgent: false
              },
              {
                title: 'Loyalty Rewards',
                discount: 'EARN 3X POINTS',
                description: 'Triple points on all bookings',
                validUntil: 'Members only',
                color: 'from-yellow-500 to-orange-500',
                icon: '⭐',
                urgent: false
              },
              {
                title: 'Weekend Escape',
                discount: '30% OFF',
                description: 'Fri-Sun packages worldwide',
                validUntil: 'Valid for 60 days',
                color: 'from-pink-500 to-rose-500',
                icon: '🌅',
                urgent: false
              }
            ].map((deal, index) => {
              const dealImages = [
                'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop&auto=format&q=80',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=80',
                'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop&auto=format&q=80'
              ]
              return (
                <Card key={index} className={`group relative overflow-hidden bg-gradient-to-br ${deal.color} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${deal.urgent ? 'animate-pulse' : ''}`}>
                  {/* Background Image */}
                  <div className="absolute inset-0 opacity-20">
                    <ImageWithFallback
                      src={dealImages[index]}
                      fallbackSrc={`https://picsum.photos/400/300?random=${index + 30}`}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-4xl">{deal.icon}</div>
                      {deal.urgent && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-bounce">
                          HOT DEAL
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{deal.title}</h3>
                    <div className="text-4xl font-black mb-4">{deal.discount}</div>
                    <p className="text-white/90 mb-4">{deal.description}</p>
                    <p className="text-sm text-white/70 mb-6">{deal.validUntil}</p>
                    <Button className={`w-full backdrop-blur-sm border text-white transition-all duration-300 ${
                      deal.urgent 
                        ? 'bg-white/30 border-white/50 hover:bg-white hover:text-red-600 font-bold'
                        : 'bg-white/20 border-white/30 hover:bg-white hover:text-gray-900'
                    }`}>
                      {deal.urgent ? 'Grab Now!' : 'Claim Deal'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 7. Travel Community */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Users className="w-4 h-4" />
              Join Our Community
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Global Traveler
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                Network
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Join 50,000+ travelers worldwide. Share your journeys, get inspired.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>2,847 online now</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🌐</span>
                <span>195 countries</span>
              </div>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: '💬',
                  title: 'Travel Forums',
                  description: 'Ask questions, share tips, and connect with experienced travelers from around the world.'
                },
                {
                  icon: '📸',
                  title: 'Photo Sharing',
                  description: 'Share your amazing travel photos and get inspired by others\' adventures.'
                },
                {
                  icon: '🤝',
                  title: 'Find Travel Buddies',
                  description: 'Connect with like-minded travelers and plan your next adventure together.'
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
              
              <div className="space-y-4">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Join 50,000+ Travelers
                  <Users className="w-5 h-5 ml-2" />
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">🌍 Live community activity</p>
                  <div className="flex justify-center gap-4 text-xs text-gray-400">
                    <span>🇺🇸 New York: 847 active</span>
                    <span>🇬🇧 London: 623 active</span>
                    <span>🇯🇵 Tokyo: 1,205 active</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              {/* Background collage of travel photos */}
              <div className="absolute inset-0 grid grid-cols-2 gap-2 opacity-10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=300&h=200&fit=crop&auto=format&q=60"
                  fallbackSrc="https://picsum.photos/300/200?random=40"
                  alt="Travel community"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300&h=200&fit=crop&auto=format&q=60"
                  fallbackSrc="https://picsum.photos/300/200?random=41"
                  alt="Travel community"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&auto=format&q=60"
                  fallbackSrc="https://picsum.photos/300/200?random=42"
                  alt="Travel community"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=200&fit=crop&auto=format&q=60"
                  fallbackSrc="https://picsum.photos/300/200?random=43"
                  alt="Travel community"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
              
              <div className="relative bg-gradient-to-br from-orange-50/90 to-red-50/90 backdrop-blur-sm rounded-2xl p-8">
                <div className="space-y-6">
                  {[
                    { 
                      user: 'Sarah M.', 
                      location: '🇮🇩 Bali',
                      message: 'Just returned from Bali! The temples are breathtaking 🏛️', 
                      time: '2h ago',
                      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face&auto=format&q=80'
                    },
                    { 
                      user: 'Hiroshi T.', 
                      location: '🇯🇵 Tokyo',
                      message: 'Cherry blossoms are in full bloom! Perfect timing for hanami 🌸', 
                      time: '4h ago',
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face&auto=format&q=80'
                    },
                    { 
                      user: 'Carlos R.', 
                      location: '🇵🇪 Machu Picchu',
                      message: 'Sunrise at Machu Picchu was absolutely magical! Worth the early wake up ⛰️', 
                      time: '8h ago',
                      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format&q=80'
                    }
                  ].map((post, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 hover:bg-white/90 transition-colors duration-300">
                      <div className="flex items-center space-x-3 mb-2">
                        <ImageWithFallback
                          src={post.avatar}
                          fallbackSrc={`https://picsum.photos/50/50?random=${index + 50}`}
                          alt={post.user}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{post.user}</span>
                            <span className="text-xs text-gray-500">{post.location}</span>
                          </div>
                          <span className="text-sm text-gray-500">{post.time}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{post.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Events & Festivals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-600 px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-sm">
              <Calendar className="w-4 h-4" />
              Global Events
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Events & Festivals Worldwide</h2>
            <p className="text-xl text-gray-600 mb-8">Experience authentic local culture and celebrations around the globe</p>
            
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white rounded-xl shadow-lg border border-gray-200 p-1">
                {['All', 'Cultural', 'Festival', 'Arts', 'Traditional'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveEventFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeEventFilter === filter
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.filter(event => activeEventFilter === 'All' || event.category === activeEventFilter).map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <ImageWithFallback
                    src={event.image}
                    fallbackSrc={event.fallbackImage}
                    alt={event.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {event.daysLeft} days left
                  </div>
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <span>{event.flag}</span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">{event.category}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h3>
                  <div className="space-y-2 text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{event.price}</span>
                      </div>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">{event.category}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                    {event.price === 'Free' ? 'Learn More' : 'Get Tickets'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Local Guides */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Local Experts</h2>
            <p className="text-xl text-gray-600">Connect with experienced local guides</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {guides.map((guide) => (
              <Card key={guide.id} className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <img 
                  src={guide.image} 
                  alt={guide.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{guide.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{guide.specialty}</p>
                <p className="text-gray-600 text-sm mb-4">{guide.language}</p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{guide.rating}</span>
                </div>
                <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                  Contact Guide
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Floating AI Assistant Button */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
        >
          <Bot className="w-8 h-8" />
        </button>
      )}

      {/* Floating Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <span className="font-medium">AI Travel Assistant</span>
            </div>
            <button onClick={() => setShowChatbot(false)} className="text-white hover:text-gray-200">
              ×
            </button>
          </div>
          <div className="flex flex-col h-80">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me about travel plans..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}