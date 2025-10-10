import React, { useState, useEffect } from 'react';
import { Post, CurrentUser } from '../types.ts';
import { 
  Plus, TrendingUp, Users, Search, Globe, Map, Camera, Heart, MessageCircle, 
  Settings, X, Shield, MapPin, Clock, Star, Award, Bookmark, Share
} from './Icons.tsx';
import CommunityPostCard from './CommunityPostCard.tsx';
import SmartCreatePostModal from './SmartCreatePostModal.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import UserProfileModal from './UserProfileModal.tsx';

interface EnhancedCommunityViewProps {
  currentUser: CurrentUser | null;
  posts: Post[];
  userLocation?: { latitude: number; longitude: number };
  userCity?: string;
  onCreatePost: (post: any) => void;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, comment: string) => void;
  onSharePost: (post: Post) => void;
  onReportPost: (postId: string, reason: string, description?: string) => void;
  onBlockUser?: (userId: string) => void;
  onHidePost?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onBookmarkPost?: (postId: string) => void;
  isLoading?: boolean;
}

const EnhancedCommunityView: React.FC<EnhancedCommunityViewProps> = ({
  currentUser, posts, userLocation, userCity, onCreatePost, onLikePost, 
  onCommentPost, onSharePost, onReportPost, onBlockUser, onHidePost, 
  onDeletePost, isLoading = false
}) => {

  const [activeTab, setActiveTab] = useState<'nearby' | 'feed' | 'photos' | 'itineraries' | 'qa' | 'deals'>('feed');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [locationFilter, setLocationFilter] = useState<'all' | 'nearby' | 'destination'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [selectedUsername, setSelectedUsername] = useState<string | undefined>();

  // Enhanced tabs with local context
  const tabs = [
    { id: 'nearby', label: 'Near You', icon: MapPin, badge: userCity },
    { id: 'feed', label: 'Feed', icon: MessageCircle },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'itineraries', label: 'Trips', icon: Map },
    { id: 'qa', label: 'Q&A', icon: MessageCircle },
    { id: 'deals', label: 'Deals', icon: Star }
  ];

  // Enhanced post types
  const postTypes = [
    { id: 'experience', label: 'Share Experience', icon: '✨' },
    { id: 'itinerary', label: 'Trip Plan', icon: '🗺️' },
    { id: 'buddy', label: 'Find Buddy', icon: '👥' },
    { id: 'checkin', label: 'Check-in', icon: '📍' },
    { id: 'poll', label: 'Poll', icon: '📊' },
    { id: 'deal', label: 'Deal Alert', icon: '💰' },
    { id: 'guide', label: 'Mini-Guide', icon: '📖' }
  ];

  // Show all posts without filtering
  const filteredPosts = posts.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleUserClick = (userId?: string, username?: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
    setShowUserProfile(true);
  };



  // Community insights with local context
  const insights = [
    { label: 'Active Near You', value: '24', trend: '+5', icon: Users },
    { label: 'Posts Today', value: filteredPosts.length.toString(), trend: '+12', icon: MessageCircle },
    { label: 'Top Destination', value: userCity || 'Unknown', trend: '🔥', icon: MapPin },
    { label: 'Helpful Users', value: '8', trend: '+2', icon: Award }
  ];

  const renderHeader = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Community
          </h1>
          <p className="text-gray-600 mt-1">
            {userCity ? `Connect with travelers in ${userCity}` : 'Connect with fellow travelers'}
          </p>
        </div>
        
        {currentUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Post
          </button>
        )}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <IconComponent className="mx-auto mb-2 text-blue-600" size={20} />
              <div className="text-lg font-bold text-gray-900">{insight.value}</div>
              <div className="text-xs text-gray-600">{insight.label}</div>
              <div className="text-xs text-green-600 mt-1">{insight.trend}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
      <div className="flex overflow-x-auto gap-1">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <IconComponent size={16} />
              {tab.label}
              {tab.badge && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search posts, places, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Location Filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Locations</option>
          <option value="nearby">Near Me ({userCity})</option>
          <option value="destination">Current Destination</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="trending">Trending</option>
        </select>
      </div>
    </div>
  );

  const renderTrendingTopics = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="text-green-500" size={16} />
        Trending in {userCity || 'Your Area'}
      </h3>
      <div className="flex flex-wrap gap-2">
        {['#GalleFort', '#JungleBeach', '#BestCurry', '#TukTukTips', '#SunsetSpots'].map(tag => (
          <button
            key={tag}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPostsFeed = () => (
    <div className="space-y-6">
      {filteredPosts.map(post => (
        <CommunityPostCard
          key={post.id}
          post={post}
          onLikePost={onLikePost}
          onBookmarkPost={onBookmarkPost || (() => {})}
          onSharePost={onSharePost}
          onCommentPost={onCommentPost}
          currentUsername={currentUser?.username}
          currentUserId={currentUser?.mongoId}
          onUserClick={handleUserClick}
        />
      ))}
    </div>
  );

  const renderCreatePostModal = () => (
    showCreateModal && (
      <SmartCreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(postData) => {
          console.log('Creating post with data:', postData);
          // Call onCreatePost with the parameters that App.tsx expects
          onCreatePost(
            postData.content || '', // content: string
            postData.images || [], // imageUrls?: string[]
            undefined, // attachedPlaceIds?: string[]
            undefined, // attachedDealIds?: string[]
            postData.category || 'Experience', // category: PostCategory
            postData.tags || [] // tags: string[]
          );
          setShowCreateModal(false);
        }}
        currentUser={currentUser}
        userLocation={userLocation}
        userCity={userCity}
        isLoading={false}
      />
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderHeader()}
      {renderPostsFeed()}
      {renderCreatePostModal()}

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-600 mb-4">
            Be the first to share something with travelers in {userCity}!
          </p>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId}
        username={selectedUsername}
        currentUser={currentUser}
        posts={posts}
      />
    </div>
  );
};

export default EnhancedCommunityView;