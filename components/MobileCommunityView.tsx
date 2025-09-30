import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Plus, Camera, MapPin, Users } from 'lucide-react';

interface CommunityPost {
  _id: string;
  content: {
    text: string;
    images: string[];
  };
  author: {
    name: string;
    avatar: string;
    location: string;
    verified: boolean;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  likedBy: string[];
  tags: string[];
  createdAt: string;
}

const MobileCommunityView: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ text: '', images: [] as string[] });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=20');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.text.trim()) return;

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          content: {
            text: newPost.text,
            images: newPost.images,
          },
          author: {
            name: 'Travel Explorer',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
            location: 'Global Traveler',
            verified: true,
          },
          tags: extractHashtags(newPost.text),
          category: 'travel',
        }),
      });

      if (response.ok) {
        setNewPost({ text: '', images: [] });
        setShowCreatePost(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const likePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          username: 'TravelExplorer',
        }),
      });

      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtags = text.match(/#\w+/g);
    return hashtags ? hashtags.map(tag => tag.slice(1)) : [];
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        </div>
        <button
          onClick={() => setShowCreatePost(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Share Your Experience</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <textarea
              value={newPost.text}
              onChange={(e) => setNewPost({ ...newPost, text: e.target.value })}
              placeholder="What's your travel story? Use #hashtags to categorize..."
              className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500">
                <Camera className="w-4 h-4" />
                Add Photo
              </button>
              <button
                onClick={createPost}
                disabled={!newPost.text.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Post Header */}
            <div className="p-4 flex items-center gap-3">
              <img
                src={post.author?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                alt={post.author?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{post.author?.name || 'Anonymous'}</h3>
                  {post.author?.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {post.author?.location || 'Unknown'}
                  <span className="mx-1">•</span>
                  {formatTimeAgo(post.createdAt)}
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-4">
              <p className="text-gray-800 mb-3">{post.content?.text}</p>
              
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Post Images */}
              {post.content?.images && post.content.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {post.content.images.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Post content"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => likePost(post._id)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Heart className={`w-5 h-5 ${post.likedBy?.includes('demo-user') ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm">{post.engagement?.likes || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.engagement?.comments || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">{post.engagement?.shares || 0}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share your travel experience!</p>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create First Post
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileCommunityView;