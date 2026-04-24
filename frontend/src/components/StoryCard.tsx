import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
  Edit
} from 'lucide-react'

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

interface StoryCardProps {
  story: Story;
  onLike: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
  onEdit?: (storyId: string) => void;
  currentUserId?: string;
  highlighted?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onLike,
  onDelete,
  onEdit,
  currentUserId,
  highlighted = false
}) => {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const canManageStory = Boolean(currentUserId) && (
    story.author._id === currentUserId ||
    story.author.username === 'You'
  )

  const validImages = story.images.filter((image) => image && image.trim())

  const handleShare = async () => {
    const storyUrl = `${window.location.origin}/community/story/${story._id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: `${story.title} • ${story.location}`,
          url: storyUrl
        })
        return
      }

      await navigator.clipboard.writeText(storyUrl)
      alert('Story link copied to clipboard')
    } catch (error) {
      console.error('Failed to share story:', error)
    }
  }

  const handleOpenDirections = () => {
    if (!story.place) return

    const { lat, lng } = story.place.coordinates
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className={`story-card overflow-hidden rounded-[28px] border bg-white shadow-sm transition-all duration-300 ${
      highlighted
        ? 'border-sky-300 shadow-xl shadow-sky-100/70 ring-4 ring-sky-100'
        : 'border-slate-200 hover:-translate-y-1 hover:shadow-lg'
    }`}>
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative">
              {story.author.profilePicture ? (
                <img
                  src={story.author.profilePicture}
                  alt={story.author.username}
                  className="h-12 w-12 rounded-2xl object-cover ring-2 ring-sky-100"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#8b5cf6)] text-lg font-semibold text-white ring-2 ring-sky-100">
                  {story.author.username && story.author.username !== 'Anonymous' ? story.author.username[0].toUpperCase() : '?'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{story.author.username}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {story.location}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(story.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {highlighted && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                Selected from map
              </span>
            )}

            {canManageStory && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Story actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 z-10 mt-2 w-44 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                    <button
                      onClick={() => {
                        onEdit?.(story._id)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-sky-700 transition hover:bg-sky-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit post
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(story._id)
                        setShowMenu(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {story.place && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="rounded-2xl bg-white p-2 text-sky-700 shadow-sm">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{story.place.name}</p>
              <p className="truncate text-sm text-slate-500">{story.place.address}</p>
            </div>
            <button
              onClick={handleOpenDirections}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Directions
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={() => navigate(`/community/story/${story._id}`)}
            className="text-left text-2xl font-bold leading-tight text-slate-900 transition hover:text-sky-700"
          >
            {story.title}
          </button>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">
            {story.content}
          </p>

          {story.tags && story.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {story.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {validImages.length > 0 && (
        <div className="w-full border-y border-slate-100 bg-slate-50">
          {validImages.length === 1 ? (
            <img
              src={validImages[0]}
              alt={story.title}
              className="max-h-[620px] w-full cursor-pointer object-cover"
              onClick={() => window.open(validImages[0], '_blank', 'noopener,noreferrer')}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : validImages.length === 2 ? (
            <div className="grid grid-cols-2 gap-1">
              {validImages.slice(0, 2).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${story.title} ${index + 1}`}
                  className="h-[320px] w-full cursor-pointer object-cover"
                  onClick={() => window.open(image, '_blank', 'noopener,noreferrer')}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {validImages.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`${story.title} ${index + 1}`}
                    className="h-[260px] w-full cursor-pointer object-cover"
                    onClick={() => window.open(image, '_blank', 'noopener,noreferrer')}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                  {index === 3 && validImages.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-2xl font-bold text-white">
                      +{validImages.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onLike(story._id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                story.isLiked
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Heart className={`h-4 w-4 ${story.isLiked ? 'fill-current' : ''}`} />
              {story.likes}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
            >
              <MessageCircle className="h-4 w-4" />
              {story.comments}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          <button
            onClick={() => navigate(`/community/story/${story._id}`)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Read story
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showComments && (
        <div className="animate-fade-in-up border-t border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-5 md:px-6">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-9 w-9 flex-shrink-0 rounded-full bg-slate-200" />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </div>
            </div>
            <p className="text-center text-sm text-slate-500">Comments are coming soon.</p>
          </div>
        </div>
      )}
    </article>
  )
}
