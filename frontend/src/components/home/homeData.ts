export interface Destination {
  id: number
  name: string
  country: string
  image: string
  rating: number
  vibe: 'Adventure' | 'Zen' | 'Luxury' | 'Party'
  reason: string
  popular?: boolean
  trending?: boolean
}

export const getMonthlyDestinations = (): Destination[] => {
  return [
    { id: 1, name: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, vibe: 'Luxury', reason: 'Iconic heights', popular: true },
    { id: 2, name: 'Kyoto', country: 'Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.9, vibe: 'Zen', reason: 'Ancient peace', popular: true },
    { id: 3, name: 'Patagonia', country: 'Chile', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.9, vibe: 'Adventure', reason: 'Wild frontiers' },
    { id: 4, name: 'Goa', country: 'India', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.6, vibe: 'Party', reason: 'Beach bliss' },
    { id: 5, name: 'Ella', country: 'Sri Lanka', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.7, vibe: 'Zen', reason: 'Mountain tea', trending: true },
    { id: 6, name: 'Sydney', country: 'Australia', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, vibe: 'Adventure', reason: 'Harbor energy' },
    { id: 7, name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.7, vibe: 'Luxury', reason: 'Culinary art' },
    { id: 8, name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, vibe: 'Zen', reason: 'Tropical spirit' },
    { id: 9, name: 'Ibiza', country: 'Spain', image: 'https://images.unsplash.com/photo-1541079512776-503a093d50e5?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.5, vibe: 'Party', reason: 'Electric nights' },
  ]
}

export const vibes = ['All', 'Adventure', 'Zen', 'Luxury', 'Party'] as const

export interface CommunityStory {
  id: number
  name: string
  avatar: string
  image: string
  location: string
  text: string
  type: 'Adventure' | 'Luxury' | 'Zen' | 'Action'
  time: string
  isLive?: boolean
  views?: number
  dayOfTrip?: number
  totalDays?: number
}

export const getCommunityStories = (): CommunityStory[] => {
  return [
    { id: 1, name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', location: 'Ella, Sri Lanka', text: 'Watching the sunrise at Nine Arch Bridge was peak magic! ✨', type: 'Adventure', time: 'Just now', isLive: true, views: 47, dayOfTrip: 3, totalDays: 7 },
    { id: 2, name: 'Elena', avatar: 'https://i.pravatar.cc/150?u=elena', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', location: 'Dubai, UAE', text: 'AI recommended this hidden desert camp. Best dinner ever! 🏜️', type: 'Luxury', time: '5m ago', isLive: true, views: 89, dayOfTrip: 2, totalDays: 5 },
    { id: 3, name: 'Kaito', avatar: 'https://i.pravatar.cc/150?u=kaito', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', location: 'Kyoto, Japan', text: 'Finally saw the Fushimi Inari gates. The 7AM tip was a lifesaver! ⛩️', type: 'Zen', time: '12m ago', views: 156, dayOfTrip: 8, totalDays: 14 },
    { id: 4, name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', location: 'Sydney, Australia', text: 'Morning surf session at Bondi. Bondi to Coogee walk is a MUST. 🏄‍♀️', type: 'Adventure', time: '22m ago', views: 234, dayOfTrip: 1, totalDays: 10 },
    { id: 5, name: 'Mark', avatar: 'https://i.pravatar.cc/150?u=mark', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', location: 'Patagonia', text: 'Glacier trekking at its finest. Cold but incredibly worth it! ❄️', type: 'Action', time: '45m ago', views: 312, dayOfTrip: 5, totalDays: 12 },
    { id: 6, name: 'Maya', avatar: 'https://i.pravatar.cc/150?u=maya', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', location: 'Paris, France', text: 'Croissants at sunrise near the Eiffel Tower. Pure magic! 🥐', type: 'Luxury', time: '1h ago', views: 178, dayOfTrip: 4, totalDays: 6 },
    { id: 7, name: 'Liam', avatar: 'https://i.pravatar.cc/150?u=liam', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', location: 'Bali, Indonesia', text: 'Yoga at sunrise overlooking rice terraces. Found my zen! 🧘', type: 'Zen', time: '1h ago', isLive: true, views: 92, dayOfTrip: 6, totalDays: 14 },
    { id: 8, name: 'Zara', avatar: 'https://i.pravatar.cc/150?u=zara', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', location: 'Iceland', text: 'Northern lights dancing above me. No words can describe this! 🌌', type: 'Adventure', time: '2h ago', views: 421, dayOfTrip: 3, totalDays: 8 },
  ]
}
