import React from 'react';
import { CurrentUser, Post } from '../types.ts';
import { MapPin, Calendar, Camera, Heart, MessageCircle, Star, Award, Users, Globe } from './Icons.tsx';

interface UserProfileProps {
  user: CurrentUser;
  posts?: Post[];
  isOwnProfile?: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  posts = [],
  isOwnProfile = false,
  onFollow,
  onMessage,
  onEdit,
  isFollowing = false,
  followerCount = 0,
  followingCount = 0,
}) => {
  const totalLikes = posts.reduce((sum, post) => sum + (post.engagement?.likes || 0), 0);
  const totalComments = posts.reduce((sum, post) => sum + (post.engagement?.comments || 0), 0);
  const photoPosts = posts.filter(post => post.content?.images?.length > 0);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <div 
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center text-xl font-bold text-blue-600"
              style={{
                backgroundImage: user.profilePicture ? `url(${user.profilePicture})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!user.profilePicture && (user.username?.charAt(0) || 'U')}
            </div>

            {/* User Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{user.username}</h1>
                {user.tier === 'premium' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                    <Star className="text-yellow-300" size={12} />
                    <span className="text-xs text-yellow-200">Premium</span>
                  </div>
                )}
                {user.tier === 'pro' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full">
                    <Award className="text-purple-300" size={12} />
                    <span className="text-xs text-purple-200">Pro</span>
                  </div>
                )}
                {user.isAdmin && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                    <Award className="text-red-300" size={12} />
                    <span className="text-xs text-red-200">Admin</span>
                  </div>
                )}
              </div>
              <p className="text-white/90 text-sm mb-2">{user.email}</p>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {user.profileType === 'merchant' ? 'Business Account' : 'Location not set'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Joined {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={onFollow}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isFollowing
                      ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                      : 'bg-white text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={onMessage}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm flex items-center gap-1"
                >
                  <MessageCircle size={12} />
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-lg font-bold">{posts.length}</div>
            <div className="text-xs text-white/80">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{followerCount}</div>
            <div className="text-xs text-white/80">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{followingCount}</div>
            <div className="text-xs text-white/80">Following</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{totalLikes}</div>
            <div className="text-xs text-white/80">Likes</div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="text-blue-600" size={18} />
              Profile Info
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-600">Language:</span>
                <span className="ml-2">{user.language || 'English'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Currency:</span>
                <span className="ml-2">{user.homeCurrency || 'USD'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Subscription:</span>
                <span className="ml-2 capitalize">{user.tier} {user.subscriptionStatus && `(${user.subscriptionStatus})`}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Profile Type:</span>
                <span className="ml-2 capitalize">{user.profileType || 'Traveler'}</span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Globe className="text-green-600" size={18} />
              Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Posts:</span>
                <span className="font-semibold">{posts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Likes:</span>
                <span className="font-semibold">{totalLikes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Comments:</span>
                <span className="font-semibold">{totalComments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Photos Shared:</span>
                <span className="font-semibold">{photoPosts.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts Preview */}
        {posts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Camera className="text-purple-600" size={18} />
              Recent Posts
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 line-clamp-2">{post.content?.text}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {post.engagement?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {post.engagement?.comments || 0}
                    </span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {user.selectedInterests && user.selectedInterests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.selectedInterests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;