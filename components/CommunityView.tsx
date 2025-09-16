import React, { useState } from 'react';
import { Post, CurrentUser } from '../types.ts';
import { Plus, Heart, MessageCircle, Share, Bookmark, MapPin, Clock } from './Icons.tsx';

interface CommunityViewProps {
  currentUser: CurrentUser | null;
  posts: Post[];
  onCreatePost: (content: string, images?: string[], attachedPlaceIds?: string[], attachedDealIds?: string[], category?: string, tags?: string[]) => void;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, comment: string) => void;
  onSharePost: (post: Post) => void;
  isLoading?: boolean;
}

const CommunityView: React.FC<CommunityViewProps> = ({
  currentUser, posts, onCreatePost, onLikePost, onCommentPost, onSharePost, isLoading = false
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    onCreatePost(
      newPostContent.trim(),
      newPostImages,
      undefined,
      undefined,
      'Experience',
      []
    );
    
    setNewPostContent('');
    setNewPostImages([]);
    setShowCreateModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 500000) return; // 500KB limit
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setNewPostImages(prev => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Community</h1>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              New Post
            </button>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Create Post</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your travel experience..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={4}
            />
            
            <div className="mt-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-block px-3 py-2 bg-gray-100 text-gray-700 rounded cursor-pointer hover:bg-gray-200"
              >
                Add Photos
              </label>
            </div>

            {newPostImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {newPostImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt="Upload" className="w-full h-20 object-cover rounded" />
                    <button
                      onClick={() => setNewPostImages(newPostImages.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow-sm border">
            {/* Post Header */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {post.author?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="font-semibold">{post.author?.name || 'Anonymous'}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={12} />
                    {formatTime(post.timestamp)}
                    {post.author?.location && (
                      <>
                        <span>•</span>
                        <MapPin size={12} />
                        {post.author.location}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{post.content?.text}</p>
              
              {post.content?.images && post.content.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {post.content.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt="Post content"
                      className="w-full h-48 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onLikePost(post.id)}
                  className={`flex items-center gap-1 ${
                    post.engagement?.isLiked ? 'text-red-500' : 'text-gray-600'
                  } hover:text-red-500`}
                >
                  <Heart size={16} fill={post.engagement?.isLiked ? 'currentColor' : 'none'} />
                  <span className="text-sm">{post.engagement?.likes || 0}</span>
                </button>
                
                <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500">
                  <MessageCircle size={16} />
                  <span className="text-sm">{post.engagement?.comments || 0}</span>
                </button>
                
                <button
                  onClick={() => onSharePost(post)}
                  className="flex items-center gap-1 text-gray-600 hover:text-green-500"
                >
                  <Share size={16} />
                  <span className="text-sm">Share</span>
                </button>
              </div>
              
              <button className={`${
                post.engagement?.isBookmarked ? 'text-yellow-500' : 'text-gray-600'
              } hover:text-yellow-500`}>
                <Bookmark size={16} fill={post.engagement?.isBookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {posts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-4">Be the first to share your travel experience!</p>
          {currentUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading posts...</p>
        </div>
      )}
    </div>
  );
};

export default CommunityView;