import React from 'react'
import { MapPin, Heart, MessageCircle } from 'lucide-react'

interface Story {
  _id: string;
  title: string;
  content: string;
  place?: {
    placeId: string;
    name: string;
    coordinates: { lat: number; lng: number };
    address: string;
  };
  likes: number;
  comments: number;
  author: {
    username: string;
  };
}

interface StoryMapProps {
  stories: Story[];
  onStoryClick: (story: Story) => void;
}

export const StoryMap: React.FC<StoryMapProps> = ({ stories, onStoryClick }) => {
  const storiesWithPlaces = stories.filter(story => story.place)
  
  // Simple grid-based map visualization
  const getGridPosition = (lat: number, lng: number) => {
    // Normalize coordinates to grid positions (0-100%)
    const normalizedLat = ((lat + 90) / 180) * 100
    const normalizedLng = ((lng + 180) / 360) * 100
    return { x: normalizedLng, y: 100 - normalizedLat }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 min-h-96 relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Simple world map outline */}
          <path
            d="M10,30 Q20,25 30,30 L40,35 Q50,30 60,35 L70,30 Q80,35 90,30"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M15,50 Q25,45 35,50 L45,55 Q55,50 65,55 L75,50 Q85,55 95,50"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      {/* Story Markers */}
      {storiesWithPlaces.map((story) => {
        const position = getGridPosition(
          story.place!.coordinates.lat,
          story.place!.coordinates.lng
        )
        
        return (
          <div
            key={story._id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${Math.max(5, Math.min(95, position.x))}%`,
              top: `${Math.max(5, Math.min(95, position.y))}%`
            }}
            onClick={() => onStoryClick(story)}
          >
            {/* Marker */}
            <div className="relative">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              
              {/* Hover Card */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-white rounded-lg shadow-xl p-3 min-w-48 border">
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">
                    {story.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {story.place!.name}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-3 h-3" />
                      <span>{story.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{story.comments}</span>
                    </div>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <h4 className="font-semibold text-sm text-gray-900 mb-2">Story Locations</h4>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
            <MapPin className="w-2 h-2 text-white" />
          </div>
          <span>{storiesWithPlaces.length} stories</span>
        </div>
      </div>

      {/* No Places Message */}
      {storiesWithPlaces.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No stories with locations yet</p>
            <p className="text-sm text-gray-500">Stories with tagged places will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}