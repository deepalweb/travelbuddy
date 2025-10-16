import React from 'react';
import { SocialInteractions } from './SocialInteractions.tsx';
import { Comment } from '../types.ts';

// Demo component to showcase Facebook-like social features
const SocialInteractionsDemo: React.FC = () => {
  const [postLikes, setPostLikes] = React.useState(42);
  const [isPostLiked, setIsPostLiked] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>([
    {
      id: '1',
      authorName: 'Sarah Johnson',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b0a3?w=32&h=32&fit=crop&crop=face',
      text: 'This looks amazing! I\'ve been wanting to visit this place for so long. Thanks for sharing!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      likes: 8,
      isLiked: false,
      replies: [
        {
          id: '1-1',
          authorName: 'Mike Chen',
          text: 'Same here! We should plan a trip together.',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          likes: 2,
          isLiked: true,
          replies: []
        }
      ]
    },
    {
      id: '2',
      authorName: 'Travel Expert',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
      text: 'Pro tip: Visit during sunset for the most incredible views! The golden hour lighting is spectacular.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      likes: 15,
      isLiked: true,
      replies: []
    },
    {
      id: '3',
      authorName: 'Local Guide',
      text: 'I can recommend the best spots nearby if anyone needs suggestions! 🗺️',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      likes: 5,
      isLiked: false,
      replies: []
    }
  ]);

  const handleLike = (postId: string) => {
    setIsPostLiked(!isPostLiked);
    setPostLikes(prev => isPostLiked ? prev - 1 : prev + 1);
    console.log('Post liked:', postId, !isPostLiked);
  };

  const handleAddComment = (postId: string, text: string, parentId?: string) => {
    const newComment: Comment = {
      id: `demo-${Date.now()}`,
      authorName: 'You',
      text,
      timestamp: new Date(),
      likes: 0,
      isLiked: false,
      replies: []
    };

    if (parentId) {
      // Add as reply
      setComments(prev => prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newComment]
          };
        }
        return comment;
      }));
    } else {
      // Add as top-level comment
      setComments(prev => [newComment, ...prev]);
    }
    
    console.log('Comment added:', { postId, text, parentId });
  };

  const handleLikeComment = (commentId: string) => {
    const updateCommentLikes = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked
          };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: updateCommentLikes(comment.replies)
          };
        }
        return comment;
      });
    };

    setComments(prev => updateCommentLikes(prev));
    console.log('Comment liked:', commentId);
  };

  const handleShare = (postId: string, platform?: string) => {
    if (platform) {
      alert(`Shared to ${platform}! (This is a demo)`);
    } else {
      alert('Share modal would open here! (This is a demo)');
    }
    console.log('Post shared:', { postId, platform });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎉 Facebook-Like Social Interactions Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Experience the enhanced community features with Facebook-style social mechanics:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">👍</div>
              <h3 className="font-semibold text-blue-900">Reactions</h3>
              <p className="text-sm text-blue-700">Hover over Like to see reaction options</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">💬</div>
              <h3 className="font-semibold text-green-900">Comments</h3>
              <p className="text-sm text-green-700">Inline commenting with threading</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">📤</div>
              <h3 className="font-semibold text-purple-900">Share</h3>
              <p className="text-sm text-purple-700">Multi-platform sharing options</p>
            </div>
          </div>

          {/* Demo Post Content */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                TG
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Travel Guide</h3>
                <p className="text-sm text-gray-500">2 hours ago • 📍 Santorini, Greece</p>
              </div>
            </div>
            
            <p className="text-gray-800 mb-4">
              Just discovered this incredible hidden gem in Santorini! The sunset views from here are absolutely breathtaking. 
              Who else has been to this magical place? 🌅✨
            </p>
            
            <div className="aspect-video bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg mb-4 flex items-center justify-center text-white text-lg font-medium">
              📸 Beautiful Sunset Photo
            </div>
          </div>
        </div>

        {/* Social Interactions Component */}
        <SocialInteractions
          postId="demo-post"
          likes={postLikes}
          isLiked={isPostLiked}
          comments={comments}
          shares={12}
          onLike={handleLike}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onShare={handleShare}
          currentUserName="You"
        />
      </div>

      {/* Feature Highlights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Enhanced Features</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-blue-500">•</span>
            <span><strong>Facebook-style reactions:</strong> Hover over the Like button to see 6 different reaction options</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-green-500">•</span>
            <span><strong>Inline commenting:</strong> Click Comment to add responses directly in the feed</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-purple-500">•</span>
            <span><strong>Comment threading:</strong> Reply to specific comments to create conversation threads</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-500">•</span>
            <span><strong>Multi-platform sharing:</strong> Share to Facebook, Twitter, WhatsApp, Instagram, or copy link</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red-500">•</span>
            <span><strong>Real-time engagement:</strong> All interactions update immediately with optimistic UI</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-500">•</span>
            <span><strong>Smart timestamps:</strong> Dynamic time formatting (now, 5m, 2h, 3d)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialInteractionsDemo;
