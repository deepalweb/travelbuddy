import React, { useMemo, useState } from 'react'
import { X, Camera, Upload, Video, Sparkles, NotebookPen, Tag, MapPinned } from 'lucide-react'
import { communityService } from '../services/communityService'
import { LocationPicker } from './LocationPicker'

interface Story {
  _id: string;
  title: string;
  content: string;
  images: string[];
  author: {
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

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
  editStory?: Story;
}

const resolveApiBase = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '/api'
  }

  const runtimeBase =
    (window as any).ENV?.VITE_API_BASE_URL &&
    !(window as any).ENV?.VITE_API_BASE_URL.includes('#{')
      ? (window as any).ENV.VITE_API_BASE_URL
      : null

  const configuredBase = runtimeBase || import.meta.env.VITE_API_BASE_URL

  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, '')}/api`
  }

  return '/api'
}

const API_BASE = resolveApiBase()

const storyPromptSuggestions = [
  'Best moment',
  'Budget tip',
  'Route note',
  'What to avoid',
] as const

const suggestedTags = ['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City']

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onStoryCreated, editStory }) => {
  const [title, setTitle] = useState(editStory?.title || '')
  const [content, setContent] = useState(editStory?.content || '')
  const [locationData, setLocationData] = useState({
    address: editStory?.place?.address || editStory?.location || '',
    coordinates: editStory?.place?.coordinates || { lat: 0, lng: 0 },
    city: editStory?.place?.name || '',
    country: ''
  })
  const [images, setImages] = useState<string[]>(editStory?.images || [])
  const [videos, setVideos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [tags, setTags] = useState<string[]>(editStory?.tags || [])
  const [loading, setLoading] = useState(false)
  const titleLength = title.trim().length
  const contentLength = content.trim().length
  const canSubmit = Boolean(title.trim() && content.trim() && locationData.address.trim())
  const storyReadiness = useMemo(() => {
    let score = 0
    if (titleLength >= 8) score += 1
    if (locationData.address.trim()) score += 1
    if (contentLength >= 120) score += 1
    if (images.length > 0 || videos.length > 0) score += 1
    if (tags.length > 0) score += 1
    return score
  }, [contentLength, images.length, locationData.address, tags.length, titleLength, videos.length])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).slice(0, 2 - images.length).forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`${API_BASE}/images/upload-multiple`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      setImages(prev => [...prev, ...data.urls].slice(0, 2))
    } catch (error) {
      console.error('Failed to upload images:', error)
      alert('Failed to upload images. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file size must be less than 50MB')
      return
    }

    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch(`${API_BASE}/images/upload-video`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Video upload failed')
      
      const data = await response.json()
      setVideos([data.url])
    } catch (error) {
      console.error('Failed to upload video:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setUploadingVideo(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    setVideos([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !locationData.address.trim()) return

    try {
      setLoading(true)
      
      // Generate AI tags if none selected
      let finalTags = tags
      if (tags.length === 0) {
        try {
          const aiTags = await communityService.generateAITags(title.trim(), content.trim())
          finalTags = aiTags
        } catch (error) {
          console.log('AI tagging failed, using manual tags')
        }
      }
      
      const storyData = {
        title: title.trim(),
        content: content.trim(),
        location: locationData.address,
        place: {
          placeId: `${locationData.coordinates.lat}_${locationData.coordinates.lng}`,
          name: locationData.city || locationData.address,
          coordinates: locationData.coordinates,
          address: locationData.address
        },
        images,
        videos,
        tags: finalTags
      }
      
      const newStory = editStory 
        ? await communityService.updateStory(editStory._id, storyData)
        : await communityService.createStory(storyData)
      
      onStoryCreated(newStory)
    } catch (error) {
      console.error('Failed to save story:', error)
      alert('Failed to save story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const injectPrompt = (prompt: typeof storyPromptSuggestions[number]) => {
    const promptTemplates: Record<typeof storyPromptSuggestions[number], string> = {
      'Best moment': 'Best moment: ',
      'Budget tip': 'Budget tip: ',
      'Route note': 'Route note: ',
      'What to avoid': 'What to avoid: ',
    }

    const template = promptTemplates[prompt]
    if (content.includes(template)) return

    setContent(prev => {
      const separator = prev.trim() ? '\n\n' : ''
      return `${prev}${separator}${template}`
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Community post
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {editStory ? 'Refine your travel story' : 'Share your travel story'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Turn a real travel experience into something the next traveler can actually use:
              highlight the moment, the route, the budget clue, or the local tip that made the trip better.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div className="space-y-7">
            <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <NotebookPen className="h-5 w-5 text-sky-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Make it useful</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Share what helped, surprised, or saved time.</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <MapPinned className="h-5 w-5 text-amber-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Add clear context</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Mention the place, route, or stop that shaped the experience.</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <Tag className="h-5 w-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-900">Help discovery</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Use tags and visuals so travelers can find your story faster.</p>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-800">
                  Story headline
                </label>
                <span className="text-xs font-medium text-slate-400">{titleLength}/80+</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: 3 days in Ella that were worth the early starts"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
              <p className="mt-2 text-sm text-slate-500">
                Lead with the place, timeframe, or hook so people understand the story at a glance.
              </p>
            </div>

            {/* Location */}
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-800">Where did this happen?</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add the destination or stop so readers can place your story on the map and in the feed.
                </p>
              </div>
              <LocationPicker
                value={locationData}
                onChange={setLocationData}
                required
              />
            </div>

            {/* Content */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-800">
                  Story details
                </label>
                <span className="text-xs font-medium text-slate-400">{contentLength} characters</span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell travelers what happened, why it mattered, and what they should know before they go."
                rows={9}
                className="w-full resize-none rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {storyPromptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => injectPrompt(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Strong stories usually include one clear highlight, one practical note, and one honest insight.
              </p>
            </div>

            {/* Tags */}
            <div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Tags and themes
                </label>
                <p className="mt-1 text-sm text-slate-500">
                  Tags help your story appear in the right travel searches and community filters.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-sky-600 hover:text-sky-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                </div>
                <div className="flex flex-wrap gap-2">
                {suggestedTags.map((suggestedTag) => (
                  !tags.includes(suggestedTag) && (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => handleAddTag(suggestedTag)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      + {suggestedTag}
                    </button>
                  )
                ))}
                {title.trim() && content.trim() && tags.length === 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const aiTags = await communityService.generateAITags(title.trim(), content.trim())
                        setTags(aiTags)
                      } catch (error) {
                        console.error('AI tagging failed:', error)
                      }
                    }}
                    className="rounded-full bg-slate-950 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    AI suggest tags
                  </button>
                )}
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Photos
                </label>
                <p className="mt-1 text-sm text-slate-500">Add up to 2 photos that support the story, not just the scenery.</p>
              </div>
              <div className="rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white p-6 text-center transition-colors hover:border-sky-400">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading || images.length >= 2}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className={`block ${images.length >= 2 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
                      <p className="text-slate-600">Uploading photos...</p>
                    </div>
                  ) : (
                    <>
                      <Camera className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                      <p className="mb-2 font-medium text-slate-700">
                        {images.length >= 2 ? 'Maximum 2 photos reached' : 'Upload photos for your story'}
                      </p>
                      <p className="text-sm text-slate-500">PNG or JPG, up to 10MB each</p>
                    </>
                  )}
                </label>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white transition-colors hover:bg-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <div className="mb-2">
                <label className="block text-sm font-semibold text-slate-800">
                  Short video
                </label>
                <p className="mt-1 text-sm text-slate-500">Optional. Add one short clip if it adds context to the story.</p>
              </div>
              <div className="rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white p-6 text-center transition-colors hover:border-sky-400">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploadingVideo || videos.length >= 1}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className={`block ${videos.length >= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  {uploadingVideo ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
                      <p className="text-slate-600">Uploading video...</p>
                    </div>
                  ) : (
                    <>
                      <Video className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                      <p className="mb-2 font-medium text-slate-700">
                        {videos.length >= 1 ? 'Maximum 1 video reached' : 'Upload a short video'}
                      </p>
                      <p className="text-sm text-slate-500">MP4 or MOV, up to 50MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Video Preview */}
              {videos.length > 0 && (
                <div className="mt-4">
                <div className="relative">
                  <video
                    src={videos[0]}
                    controls
                    className="h-48 w-full rounded-xl object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white transition-colors hover:bg-rose-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Story readiness</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#0f172a)] transition-all"
                  style={{ width: `${(storyReadiness / 5) * 100}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-800">{storyReadiness}/5 essentials added</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>{titleLength >= 8 ? 'Done' : 'Add'} a clear headline</li>
                <li>{locationData.address.trim() ? 'Done' : 'Add'} the destination or stop</li>
                <li>{contentLength >= 120 ? 'Done' : 'Add'} enough detail to make the story useful</li>
                <li>{images.length > 0 || videos.length > 0 ? 'Done' : 'Optional'} visual support</li>
                <li>{tags.length > 0 ? 'Done' : 'Optional'} discovery tags</li>
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Before you publish</p>
              <p className="mt-3 text-lg font-semibold">Help the next traveler faster.</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                The best community posts usually answer one of these: what was worth it, what would you change, and what should someone book or avoid?
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>{editStory ? 'Update story' : 'Publish story'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}
