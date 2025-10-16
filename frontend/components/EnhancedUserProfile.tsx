import React, { useState, useEffect } from 'react';
import { CurrentUser, Post } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { 
  MapPin, Calendar, Camera, Heart, MessageCircle, Share, 
  Award, Users, Globe, Star, TrendingUp, Settings, 
  Link as LinkIcon, ShieldCheck, Crown
} from './Icons.tsx';
import { Colors } from '../constants.ts';

interface EnhancedUserProfileProps {
  user: CurrentUser;
  posts: Post[];
  isOwnProfile: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
}

interface UserStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  countriesVisited: number;
  joinDate: string;
  verified: boolean;
  badges: string[];
}

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
}

const TRAVEL_BADGES = [
  { id: 'globe_trotter', name: 'Globe Trotter', icon: Globe, description: 'Visited 10+ countries' },
  { id: 'photographer', name: 'Travel Photographer', icon: Camera, description: 'Shared 50+ photos' },
  { id: 'influencer', name: 'Community Star', icon: Star, description: '1000+ post likes' },
  { id: 'helper', name: 'Travel Helper', icon: Heart, description: 'Helped 25+ travelers' },
  { id: 'explorer', name: 'Hidden Gem Hunter', icon: TrendingUp, description: 'Found 15+ hidden gems' },
  { id: 'storyteller', name: 'Master Storyteller', icon: MessageCircle, description: 'Shared 20+ experiences' },
  { id: 'premium', name: 'Premium Member', icon: Crown, description: 'Premium subscriber' },
  { id: 'verified', name: 'Verified Traveler', icon: ShieldCheck, description: 'Verified account' },
];

const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({
  user,
  posts,
  isOwnProfile,
  onFollow,
  onMessage,
  onEdit,
  isFollowing = false,
  followerCount = 0,
  followingCount = 0,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'photos' | 'stats'>('posts');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [socialLinks] = useState<SocialLinks>({
    instagram: undefined, // user.socialLinks?.instagram,
    twitter: undefined, // user.socialLinks?.twitter,
    facebook: undefined, // user.socialLinks?.facebook,
    website: undefined, // user.socialLinks?.website,
  });

  // Calculate user statistics
  useEffect(() => {
    if (!user) return;
    
    const stats: UserStats = {
      totalPosts: posts.length,
      totalLikes: posts.reduce((sum, post) => sum + (post.engagement?.likes || 0), 0),
      totalComments: posts.reduce((sum, post) => sum + (post.engagement?.comments || 0), 0),
      countriesVisited: 12, // Mock data - could be calculated from post locations
      joinDate: '2023-01-15', // Mock data - should come from user.createdAt
      verified: user.isAdmin || false, // Use isAdmin as verified status
      badges: ['globe_trotter', 'photographer'], // Mock data - should be calculated
    };
    setUserStats(stats);
  }, [posts, user]);

  const getBadgeComponent = (badgeId: string) => {
    const badge = TRAVEL_BADGES.find(b => b.id === badgeId);
    if (!badge) return null;

    const IconComponent = badge.icon;
    return (
      <div
        key={badgeId}
        className="group relative p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
        title={badge.description}
      >
        <div className="flex items-center gap-2">
          <IconComponent className="text-indigo-600" size={20} />
          <span className="text-sm font-medium text-gray-900">{badge.name}</span>
        </div>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {badge.description}
        </div>
      </div>
    );
  };

  const renderProfileHeader = () => (
    <div className="relative bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Profile Picture */}
          <div className="relative">
            <div 
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center text-2xl font-bold text-indigo-600"
              style={{
                backgroundImage: user.profilePicture ? `url(${user.profilePicture})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!user.profilePicture && (user.username?.charAt(0) || 'U')}
            </div>
            {userStats?.verified && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <Star size={16} className="text-white" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              {user.tier === 'premium' && <Crown className="text-yellow-300" size={20} />}
              {user.tier === 'pro' && <Crown className="text-gold-300" size={20} />}
            </div>
            <p className="text-white/90 mb-2">{'Passionate traveler exploring the world'}</p>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {'Location not set'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {`Joined ${userStats ? new Date(userStats.joinDate).toLocaleDateString() : '2023'}`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={onFollow}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                    : 'bg-white text-indigo-600 hover:bg-gray-100'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={onMessage}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <MessageCircle size={16} />
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-white/20">
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats?.totalPosts || 0}</div>
          <div className="text-sm text-white/80">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{followerCount}</div>
          <div className="text-sm text-white/80">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{followingCount}</div>
          <div className="text-sm text-white/80">Following</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{userStats?.countriesVisited || 0}</div>
          <div className="text-sm text-white/80">Countries</div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6">
      {[
        { key: 'posts', label: 'Posts', count: userStats?.totalPosts },
        { key: 'about', label: 'About', count: null },
        { key: 'photos', label: 'Photos', count: posts.filter(p => p.content?.images?.length > 0).length },
        { key: 'stats', label: 'Stats', count: null },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as any)}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === tab.key
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count !== null && tab.count !== undefined && (
            <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  const renderAboutTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="text-indigo-600" size={20} />
          Basic Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Language</label>
            <p className="text-gray-900">{user.language || 'English'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Currency</label>
            <p className="text-gray-900">{user.homeCurrency || 'USD'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Subscription</label>
            <p className="text-gray-900 capitalize">{user.tier} {user.subscriptionStatus && `(${user.subscriptionStatus})`}</p>
          </div>
        </div>
      </div>

      {/* Travel Badges */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="text-indigo-600" size={20} />
          Travel Badges
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {userStats?.badges.map(badgeId => getBadgeComponent(badgeId))}
        </div>
      </div>

      {/* Social Links */}
      {Object.values(socialLinks).some(link => link) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LinkIcon className="text-indigo-600" size={20} />
            Social Links
          </h3>
          <div className="space-y-3">
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-pink-600 transition-colors">
                <Camera size={20} />
                <span>Instagram</span>
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-500 transition-colors">
                <MessageCircle size={20} />
                <span>Twitter</span>
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <Users size={20} />
                <span>Facebook</span>
              </a>
            )}
            {socialLinks.website && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 transition-colors">
                <LinkIcon size={20} />
                <span>Website</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="text-red-500" size={24} />
          <h3 className="text-lg font-semibold">Engagement</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Likes</span>
            <span className="font-semibold">{userStats?.totalLikes || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Comments</span>
            <span className="font-semibold">{userStats?.totalComments || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Likes/Post</span>
            <span className="font-semibold">
              {userStats && userStats.totalPosts > 0 
                ? Math.round(userStats.totalLikes / userStats.totalPosts) 
                : 0}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="text-green-500" size={24} />
          <h3 className="text-lg font-semibold">Travel Stats</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Countries</span>
            <span className="font-semibold">{userStats?.countriesVisited || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Posts</span>
            <span className="font-semibold">{userStats?.totalPosts || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Photos</span>
            <span className="font-semibold">
              {posts.filter(p => p.content?.images?.length > 0).length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <Award className="text-purple-500" size={24} />
          <h3 className="text-lg font-semibold">Achievements</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Badges</span>
            <span className="font-semibold">{userStats?.badges.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Verified</span>
            <span className="font-semibold">{userStats?.verified ? '✓' : '✗'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member Since</span>
            <span className="font-semibold">
              {userStats ? new Date(userStats.joinDate).getFullYear() : 2023}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhotosTab = () => {
    const photoPosts = posts.filter(post => post.content?.images?.length > 0);
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photoPosts.map((post) =>
          post.content.images.map((image, index) => (
            <div
              key={`${post.id}-${index}`}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={image}
                alt={`Photo by ${user.username}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        )}
        {photoPosts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Camera className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">{t('profile.noPhotos', 'No photos shared yet')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {renderProfileHeader()}
      {renderTabs()}
      
      <div>
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Simplified post display - you can integrate CommunityPostCard here */}
                  <p className="text-gray-900">{post.content?.text}</p>
                  {post.content?.images && post.content.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {post.content.images.slice(0, 4).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt=""
                          className="rounded-lg object-cover aspect-square"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500">{t('profile.noPosts', 'No posts yet')}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'photos' && renderPhotosTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </div>
    </div>
  );
};

export default EnhancedUserProfile;
