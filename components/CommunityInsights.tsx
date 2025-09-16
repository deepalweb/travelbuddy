import React from 'react';
import { Post, CurrentUser } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { 
  TrendingUp, Users, Heart, MessageCircle, Share, Calendar, 
  Award, Globe, Camera, MapPin, Clock, Star 
} from './Icons.tsx';

interface CommunityInsightsProps {
  posts: Post[];
  currentUser: CurrentUser | null;
}

const CommunityInsights: React.FC<CommunityInsightsProps> = ({ posts, currentUser }) => {
  const { t } = useLanguage();

  // Calculate insights
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum, post) => sum + post.engagement.likes, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.engagement.comments, 0);
  const totalShares = posts.reduce((sum, post) => sum + post.engagement.shares, 0);
  
  const userPosts = posts.filter(p => p.author.name === currentUser?.username);
  const userLikes = userPosts.reduce((sum, post) => sum + post.engagement.likes, 0);
  
  const topCategories = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(topCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  const recentActivity = posts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const topContributors = posts
    .reduce((acc, post) => {
      const author = post.author.name;
      if (!acc[author]) {
        acc[author] = { 
          name: author, 
          posts: 0, 
          likes: 0, 
          avatar: post.author.avatar,
          verified: post.author.verified 
        };
      }
      acc[author].posts += 1;
      acc[author].likes += post.engagement.likes;
      return acc;
    }, {} as Record<string, any>);

  const sortedContributors = Object.values(topContributors)
    .sort((a: any, b: any) => (b.likes + b.posts * 2) - (a.likes + a.posts * 2))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <div className="card-base p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-600" size={24} />
          Community Overview
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <Users size={20} />
              <span className="text-2xl font-bold">{totalPosts}</span>
            </div>
            <p className="text-sm text-gray-600">Total Posts</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
              <Heart size={20} />
              <span className="text-2xl font-bold">{totalLikes}</span>
            </div>
            <p className="text-sm text-gray-600">Total Likes</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <MessageCircle size={20} />
              <span className="text-2xl font-bold">{totalComments}</span>
            </div>
            <p className="text-sm text-gray-600">Comments</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
              <Share size={20} />
              <span className="text-2xl font-bold">{totalShares}</span>
            </div>
            <p className="text-sm text-gray-600">Shares</p>
          </div>
        </div>
      </div>

      {/* Your Impact (if user is logged in) */}
      {currentUser && userPosts.length > 0 && (
        <div className="card-base p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-yellow-500" size={24} />
            Your Community Impact
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                <Camera size={20} />
                <span className="text-2xl font-bold">{userPosts.length}</span>
              </div>
              <p className="text-sm text-gray-600">Your Posts</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-red-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                <Heart size={20} />
                <span className="text-2xl font-bold">{userLikes}</span>
              </div>
              <p className="text-sm text-gray-600">Likes Received</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <Star size={20} />
                <span className="text-2xl font-bold">{Math.round(userLikes / Math.max(userPosts.length, 1))}</span>
              </div>
              <p className="text-sm text-gray-600">Avg Likes/Post</p>
            </div>
          </div>
        </div>
      )}

      {/* Popular Categories */}
      <div className="card-base p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="text-green-600" size={24} />
          Popular Categories
        </h3>
        
        <div className="space-y-3">
          {sortedCategories.map(([category, count], index) => {
            const percentage = Math.round((count / totalPosts) * 100);
            const colors = [
              'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'
            ];
            
            return (
              <div key={category} className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span className="text-sm font-medium truncate">{category}</span>
                  <span className="text-xs text-gray-500">({count} posts)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[index]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 min-w-0">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Contributors */}
      <div className="card-base p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="text-purple-600" size={24} />
          Top Contributors
        </h3>
        
        <div className="space-y-4">
          {sortedContributors.map((contributor: any, index) => (
            <div key={contributor.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white" 
                     style={{backgroundImage: `url(${contributor.avatar})`, backgroundSize: 'cover'}}>
                  {!contributor.avatar && contributor.name.charAt(0)}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{contributor.name}</span>
                  {contributor.verified && (
                    <Award size={14} className="text-blue-500" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Camera size={12} /> {contributor.posts} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {contributor.likes} likes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-base p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="text-blue-600" size={24} />
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {recentActivity.map(post => (
            <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white text-xs" 
                   style={{backgroundImage: `url(${post.author.avatar})`, backgroundSize: 'cover'}}>
                {!post.author.avatar && post.author.name.charAt(0)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{post.author.name}</span> posted in{' '}
                  <span className="font-medium text-indigo-600">{post.category}</span>
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {post.content.text.slice(0, 100)}...
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart size={10} /> {post.engagement.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={10} /> {post.engagement.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {new Date(post.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityInsights;