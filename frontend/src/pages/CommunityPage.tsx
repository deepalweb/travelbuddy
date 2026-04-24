import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  Camera,
  Clock3,
  Compass,
  Flame,
  Heart,
  Image as ImageIcon,
  List,
  Map,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { StoryCard } from '../components/StoryCard'
import { CreateStoryModal } from '../components/CreateStoryModal'
import { StoryMap } from '../components/StoryMap'
import { communityService } from '../services/communityService'
import '../styles/community.css'

interface Story {
  _id: string;
  title: string;
  content: string;
  images: string[];
  author: {
    _id?: string;
    username: string;
    profilePicture?: string;
  };
  location: string;
  place?: {
    placeId: string;
    name: string;
    coordinates: { lat: number; lng: number };
    address: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  tags?: string[];
}

interface TopTraveler {
  username: string;
  profilePicture?: string;
  storiesCount: number;
  totalLikes: number;
}

type ViewMode = 'feed' | 'map'
type ContentMode = 'all' | 'places' | 'photos'

const semanticMatches: Record<string, string[]> = {
  food: ['restaurant', 'cuisine', 'dish', 'meal', 'eat', 'taste'],
  adventure: ['hiking', 'climbing', 'extreme', 'thrill', 'exciting'],
  culture: ['museum', 'temple', 'traditional', 'heritage', 'history'],
  nature: ['park', 'wildlife', 'forest', 'mountain', 'beach', 'ocean'],
  city: ['urban', 'downtown', 'street', 'building', 'shopping']
}

const filterOptions = [
  { id: 'recent', label: 'Recent', icon: Clock3 },
  { id: 'popular', label: 'Popular', icon: Heart },
  { id: 'trending', label: 'Trending', icon: Flame }
] as const

const contentModes: Array<{ id: ContentMode; label: string; icon: typeof Compass }> = [
  { id: 'all', label: 'All stories', icon: Compass },
  { id: 'places', label: 'Place reviews', icon: MapPin },
  { id: 'photos', label: 'Photo diaries', icon: ImageIcon }
]

const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))

  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export const CommunityPage: React.FC = () => {
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [topTravelers, setTopTravelers] = useState<TopTraveler[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStory, setEditingStory] = useState<Story | undefined>(undefined)
  const [filter, setFilter] = useState('recent')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [contentMode, setContentMode] = useState<ContentMode>('all')
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)

  useEffect(() => {
    setStories([])
    setCursor(null)
    setHasMore(true)
    setSelectedPlace(null)
    loadCommunityData(true)
  }, [filter])

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode !== 'feed' || !hasMore || loadingMore) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight

      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, cursor, viewMode])

  const loadCommunityData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError(null)
      const [storiesData, travelersData] = await Promise.all([
        communityService.getStories(filter, null),
        communityService.getTopTravelers()
      ])

      setStories(storiesData)
      setTopTravelers(travelersData)
      setHasMore(storiesData.length >= 20)
      setCursor(storiesData.length > 0 ? storiesData[storiesData.length - 1].createdAt : null)
    } catch (loadError: any) {
      console.error('Failed to load community data:', loadError)
      setError(loadError.message || 'Unable to load stories. Please check your connection and try again.')
      setStories([])
      setTopTravelers([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor) return

    try {
      setLoadingMore(true)
      const moreStories = await communityService.getStories(filter, cursor)

      if (moreStories.length === 0) {
        setHasMore(false)
      } else {
        setStories((currentStories) => [...currentStories, ...moreStories])
        setCursor(moreStories[moreStories.length - 1].createdAt)
        setHasMore(moreStories.length >= 20)
      }
    } catch (loadMoreError: any) {
      console.error('Failed to load more stories:', loadMoreError)
      setError('Failed to load more stories. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredStories = stories.filter((story) => {
    const matchesTag = !selectedTag || (story.tags && story.tags.includes(selectedTag))
    const matchesContentMode =
      contentMode === 'all' ||
      (contentMode === 'places' && Boolean(story.place)) ||
      (contentMode === 'photos' && story.images.length > 0)

    if (!searchQuery) return matchesTag && matchesContentMode

    const query = searchQuery.toLowerCase()
    const matchesBasic =
      story.title.toLowerCase().includes(query) ||
      story.content.toLowerCase().includes(query) ||
      story.location.toLowerCase().includes(query) ||
      story.place?.name.toLowerCase().includes(query) ||
      story.tags?.some((tag) => tag.toLowerCase().includes(query))

    const matchesSemantic = Object.entries(semanticMatches).some(([key, synonyms]) => {
      if (query.includes(key)) {
        return synonyms.some((synonym) =>
          story.title.toLowerCase().includes(synonym) ||
          story.content.toLowerCase().includes(synonym)
        )
      }
      return false
    })

    return matchesTag && matchesContentMode && (matchesBasic || matchesSemantic)
  })

  const displayedStories = selectedPlace
    ? [...filteredStories].sort((a, b) => {
        if (a._id === selectedPlace) return -1
        if (b._id === selectedPlace) return 1
        return 0
      })
    : filteredStories

  const allTags = Array.from(new Set(stories.flatMap((story) => story.tags || []))).slice(0, 10)
  const featuredStory = filteredStories[0]
  const placeStories = stories.filter((story) => story.place)
  const photoStories = stories.filter((story) => story.images.length > 0)
  const totalLikes = stories.reduce((sum, story) => sum + story.likes, 0)
  const totalComments = stories.reduce((sum, story) => sum + story.comments, 0)
  const topPlaces = Array.from(
    new Map(
      placeStories.map((story) => [
        story.place!.name,
        {
          name: story.place!.name,
          stories: placeStories.filter((candidate) => candidate.place?.name === story.place!.name).length,
          likes: placeStories
            .filter((candidate) => candidate.place?.name === story.place!.name)
            .reduce((sum, candidate) => sum + candidate.likes, 0)
        }
      ])
    ).values()
  )
    .sort((a, b) => b.stories - a.stories || b.likes - a.likes)
    .slice(0, 5)

  const topTags = Array.from(
    new Map(
      stories.flatMap((story) => (story.tags || []).map((tag) => [tag, (stories.filter((candidate) => candidate.tags?.includes(tag)).length)] as const))
    ).entries()
  )
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const handleLike = async (storyId: string) => {
    try {
      await communityService.likeStory(storyId)
      setStories((currentStories) =>
        currentStories.map((story) =>
          story._id === storyId
            ? { ...story, likes: story.likes + (story.isLiked ? -1 : 1), isLiked: !story.isLiked }
            : story
        )
      )
    } catch (likeError) {
      console.error('Failed to like story:', likeError)
    }
  }

  const handleDelete = async (storyId: string) => {
    if (!confirm('Delete this story?')) return

    try {
      await communityService.deleteStory(storyId)
      setStories((currentStories) => currentStories.filter((story) => story._id !== storyId))
      setTimeout(() => loadCommunityData(true), 500)
    } catch (deleteError) {
      console.error('Failed to delete story:', deleteError)
      alert('Failed to delete story')
    }
  }

  const handleEdit = (storyId: string) => {
    const story = stories.find((currentStory) => currentStory._id === storyId)
    if (!story) return

    setEditingStory(story)
    setShowCreateModal(true)
  }

  const handleStoryCreated = (newStory: Story) => {
    if (editingStory) {
      setStories((currentStories) =>
        currentStories.map((story) => (story._id === newStory._id ? newStory : story))
      )
    } else {
      setStories((currentStories) => [newStory, ...currentStories])
    }

    setShowCreateModal(false)
    setEditingStory(undefined)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fb_0%,#f9fafb_18%,#ffffff_100%)]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.16),_transparent_28%),linear-gradient(135deg,#ffffff_0%,#f8fbff_48%,#fff8f2_100%)]">
        <div className="absolute inset-0 opacity-40">
          <div className="community-orb community-orb-one" />
          <div className="community-orb community-orb-two" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.55fr,0.95fr] lg:items-start">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                <span>Real traveler notes, photos, and place reviews</span>
              </div>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Discover where the community actually loved going.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                Browse destination stories, photo diaries, and practical place tips from travelers in the field.
                Save time by learning what stood out before you plan your own stop.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setEditingStory(undefined)
                    setShowCreateModal(true)
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Share your story
                </button>
                <button
                  onClick={() => loadCommunityData()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh feed
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Stories</span>
                    <Camera className="h-4 w-4 text-sky-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{stories.length}</div>
                  <p className="mt-1 text-sm text-slate-500">Fresh travel moments in this feed</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Reviewed places</span>
                    <MapPin className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{new Set(placeStories.map((story) => story.place!.name)).size}</div>
                  <p className="mt-1 text-sm text-slate-500">Destinations with community context</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Photo diaries</span>
                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{photoStories.length}</div>
                  <p className="mt-1 text-sm text-slate-500">Visual trip notes to scan quickly</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Community love</span>
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{totalLikes}</div>
                  <p className="mt-1 text-sm text-slate-500">{totalComments} conversations across stories</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Community pulse</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">What travelers are talking about</h2>
                </div>
                <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {topPlaces.length > 0 ? topPlaces.slice(0, 3).map((place, index) => (
                  <div key={place.name} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-sky-100 text-sky-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{place.name}</p>
                          <p className="text-sm text-slate-500">{place.stories} stories • {place.likes} likes</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery(place.name)
                          setContentMode('places')
                          setViewMode('feed')
                        }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                      >
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    The first place stories will show up here once travelers start tagging destinations.
                  </div>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Top travelers</p>
                  <p className="mt-2 text-2xl font-bold">{topTravelers.length}</p>
                </div>
                <div className="rounded-2xl bg-sky-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-sky-600">Hot tags</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{topTags.length}</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-orange-600">Selected mode</p>
                  <p className="mt-2 text-lg font-bold capitalize text-slate-900">{contentMode}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search places, tags, themes, or story titles"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-2xl bg-slate-100 p-1">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      const isActive = filter === option.id
                      return (
                        <button
                          key={option.id}
                          onClick={() => setFilter(option.id)}
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {contentModes.map((mode) => {
                      const Icon = mode.icon
                      const isActive = contentMode === mode.id
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setContentMode(mode.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                            isActive
                              ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {mode.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    {(selectedTag || searchQuery || contentMode !== 'all') && (
                      <button
                        onClick={() => {
                          setSelectedTag(null)
                          setSearchQuery('')
                          setContentMode('all')
                        }}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        Clear filters
                      </button>
                    )}

                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                      <button
                        onClick={() => setViewMode('feed')}
                        className={`rounded-xl px-3 py-2 transition ${viewMode === 'feed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        aria-label="Feed view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`rounded-xl px-3 py-2 transition ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        aria-label="Map view"
                      >
                        <Map className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-1">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          selectedTag === tag
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <div className="mt-6 rounded-[28px] border border-rose-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                  <RefreshCw className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Community feed hit a bump</h3>
                <p className="mx-auto mt-3 max-w-md text-slate-600">{error}</p>
                <button
                  onClick={() => loadCommunityData(true)}
                  className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="mt-6 space-y-6">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <div className="h-4 w-40 rounded-full bg-slate-200" />
                        <div className="mt-2 h-3 w-28 rounded-full bg-slate-100" />
                      </div>
                    </div>
                    <div className="h-5 w-2/3 rounded-full bg-slate-200" />
                    <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                    <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
                    <div className="mt-5 h-64 rounded-3xl bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="mt-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f5faff_60%,#fff7ee_100%)] p-10 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-lg shadow-slate-900/10">
                  <MapPin className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-3xl font-bold text-slate-900">Start the first story thread</h3>
                <p className="mx-auto mt-3 max-w-lg text-slate-600">
                  This space is ready for destination notes, hidden finds, food tips, and honest traveler photos.
                  Add the first story so the next traveler has something useful to learn from.
                </p>
                <button
                  onClick={() => {
                    setEditingStory(undefined)
                    setShowCreateModal(true)
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Share the first story
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Map the stories</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Jump from destination to destination, then switch to the feed to read the selected story.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('feed')}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <List className="h-4 w-4" />
                      Open feed
                    </button>
                  </div>

                  <StoryMap
                    stories={filteredStories.filter((story) => story.place)}
                    onStoryClick={(story) => {
                      setSelectedPlace(story._id)
                      setViewMode('feed')
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredStories.filter((story) => story.place).slice(0, 6).map((story) => (
                    <button
                      key={story._id}
                      onClick={() => {
                        setSelectedPlace(story._id)
                        setViewMode('feed')
                      }}
                      className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-bold text-slate-900">{story.place?.name}</p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{story.title}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>by {story.author.username}</span>
                            <span>•</span>
                            <span>{story.likes} likes</span>
                            <span>•</span>
                            <span>{formatRelativeDate(story.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {featuredStory && (
                  <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_38%,#172554_100%)] p-6 text-white shadow-xl shadow-slate-900/10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                          <Sparkles className="h-3.5 w-3.5" />
                          Story spotlight
                        </div>
                        <h3 className="mt-4 text-2xl font-bold">{featuredStory.title}</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                          {featuredStory.content.length > 220
                            ? `${featuredStory.content.slice(0, 220)}...`
                            : featuredStory.content}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                          <span>{featuredStory.author.username}</span>
                          <span>•</span>
                          <span>{featuredStory.location}</span>
                          <span>•</span>
                          <span>{featuredStory.likes} likes</span>
                        </div>
                      </div>

                      <div className="grid min-w-[220px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Place tag</p>
                          <p className="mt-2 text-lg font-semibold text-white">{featuredStory.place?.name || 'General trip note'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Format</p>
                          <p className="mt-2 text-lg font-semibold text-white">{featuredStory.images.length > 0 ? 'Photo story' : 'Written story'}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Posted</p>
                          <p className="mt-2 text-lg font-semibold text-white">{formatRelativeDate(featuredStory.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {displayedStories.length} matching {displayedStories.length === 1 ? 'story' : 'stories'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedPlace
                        ? 'Selected map story moved to the top of the feed.'
                        : 'Use search, tags, or content modes to narrow the feed quickly.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTag && (
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">#{selectedTag}</span>
                    )}
                    {searchQuery && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Search: {searchQuery}
                      </span>
                    )}
                    {contentMode !== 'all' && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        Mode: {contentMode}
                      </span>
                    )}
                  </div>
                </div>

                {displayedStories.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Search className="h-7 w-7" />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-slate-900">No stories match those filters</h3>
                    <p className="mx-auto mt-3 max-w-md text-slate-600">
                      Try a broader search, switch back to all stories, or clear the active tag to bring more results back in.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedTag(null)
                        setSearchQuery('')
                        setContentMode('all')
                      }}
                      className="mt-6 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  displayedStories.map((story, index) => (
                    <div
                      key={story._id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}
                    >
                      <StoryCard
                        story={story}
                        onLike={handleLike}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        currentUserId={user?.uid || user?._id || ''}
                        highlighted={story._id === selectedPlace}
                      />
                    </div>
                  ))
                )}

                {loadingMore && (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900" />
                    <p className="mt-3 text-sm text-slate-500">Loading more stories...</p>
                  </div>
                )}

                {!hasMore && stories.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center text-sm text-slate-500">
                    You’ve reached the end of the current feed.
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Contribute a useful stop</p>
                  <p className="text-xs text-slate-400">Share photos, route notes, or a hidden find.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingStory(undefined)
                  setShowCreateModal(true)
                }}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                Start a story
              </button>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Top travelers</h3>
                  <p className="text-sm text-slate-500">People driving the most engagement right now</p>
                </div>
              </div>
              <div className="space-y-4">
                {topTravelers.length > 0 ? topTravelers.map((traveler, index) => (
                  <div key={traveler.username} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6)] text-sm font-bold text-white">
                        {traveler.profilePicture ? (
                          <img src={traveler.profilePicture} alt={traveler.username} className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          traveler.username[0]
                        )}
                      </div>
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">
                        {index + 1}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{traveler.username}</p>
                      <p className="text-sm text-slate-500">{traveler.storiesCount} stories • {traveler.totalLikes} likes</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500">Traveler rankings will populate once stories are available.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Trending tags</h3>
              <p className="mt-1 text-sm text-slate-500">Quick entry points into the feed</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {topTags.length > 0 ? topTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag)
                      setViewMode('feed')
                    }}
                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    #{tag} • {count}
                  </button>
                )) : (
                  <p className="text-sm text-slate-500">No tags have been added yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Destination pulse</h3>
              <p className="mt-1 text-sm text-slate-500">Places with the most recent community activity</p>
              <div className="mt-5 space-y-4">
                {topPlaces.length > 0 ? topPlaces.map((place, index) => (
                  <button
                    key={place.name}
                    onClick={() => {
                      setSearchQuery(place.name)
                      setContentMode('places')
                      setViewMode('feed')
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-sky-500' : 'bg-orange-400'}`} />
                      <div>
                        <p className="font-semibold text-slate-900">{place.name}</p>
                        <p className="text-xs text-slate-500">{place.stories} stories</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                )) : (
                  <p className="text-sm text-slate-500">Tagged place insights will appear here.</p>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">Community stats</h3>
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Stories</span>
                  <span className="font-bold text-slate-900">{stories.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Likes</span>
                  <span className="font-bold text-slate-900">{totalLikes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Comments</span>
                  <span className="font-bold text-slate-900">{totalComments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Top travelers</span>
                  <span className="font-bold text-slate-900">{topTravelers.length}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showCreateModal && (
        <CreateStoryModal
          onClose={() => {
            setShowCreateModal(false)
            setEditingStory(undefined)
          }}
          onStoryCreated={handleStoryCreated}
          editStory={editingStory}
        />
      )}

      {error && !loading && (
        <div className="animate-slide-up fixed bottom-4 right-4 z-50 max-w-md rounded-2xl bg-rose-500 px-5 py-4 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-white/20 p-1">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 text-sm text-rose-50">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-white/90 transition hover:text-white">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
