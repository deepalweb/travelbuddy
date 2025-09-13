import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, Send, Smile, Image, MoreHorizontal, ThumbsUp, Laugh, Angry, Sad, Wow } from './Icons.tsx';
import { Comment } from '../types.ts';

interface SocialInteractionsProps {
  postId: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  shares: number;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, text: string, parentId?: string) => void;
  onLikeComment: (commentId: string) => void;
  onShare: (postId: string, platform?: string) => void;
  currentUserName?: string;
  currentUserAvatar?: string;
}

// Facebook-style reaction emojis
const REACTIONS = [
  { type: 'like', emoji: '👍', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { type: 'love', emoji: '❤️', color: 'text-red-500', bgColor: 'bg-red-50' },
  { type: 'haha', emoji: '😂', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { type: 'wow', emoji: '😮', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { type: 'sad', emoji: '😢', color: 'text-blue-400', bgColor: 'bg-blue-50' },
  { type: 'angry', emoji: '😠', color: 'text-red-600', bgColor: 'bg-red-50' },
];

const SHARE_PLATFORMS = [
  { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  { name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
  { name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
  { name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
  { name: 'Copy Link', icon: '🔗', color: 'bg-gray-500' },
];

export const SocialInteractions: React.FC<SocialInteractionsProps> = ({
  postId,
  likes,
  isLiked,
  comments,
  shares,
  onLike,
  onAddComment,
  onLikeComment,
  onShare,
  currentUserName = 'You',
  currentUserAvatar
}) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReaction = (reactionType: string) => {
    console.log('Reaction:', reactionType); // TODO: Implement reaction types
    onLike(postId);
    setShowReactions(false);
  };

  const handleComment = () => {
    if (commentText.trim()) {
      onAddComment(postId, commentText.trim());
      setCommentText('');
    }
  };

  const handleReply = (parentId: string) => {
    if (replyText.trim()) {
      onAddComment(postId, replyText.trim(), parentId);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const handleShare = (platform?: string) => {
    onShare(postId, platform);
    setShowShareMenu(false);
  };

  const handleMouseEnterLike = () => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactions(true);
    }, 500);
  };

  const handleMouseLeaveLike = () => {
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current);
    }
    setTimeout(() => setShowReactions(false), 100);
  };

  useEffect(() => {
    if (showComments && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showComments]);

  return (
    <div className="border-t border-gray-100 pt-3">
      {/* Engagement Stats */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <div className="flex items-center gap-4">
          {likes > 0 && (
            <span className="flex items-center gap-1 cursor-pointer hover:underline">
              <span className="flex">
                {REACTIONS.slice(0, 3).map((reaction, index) => (
                  <span key={reaction.type} className={`text-sm ${index > 0 ? '-ml-1' : ''}`}>
                    {reaction.emoji}
                  </span>
                ))}
              </span>
              <span>{likes.toLocaleString()}</span>
            </span>
          )}
          {comments.length > 0 && (
            <button 
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
        {shares > 0 && (
          <span className="hover:underline cursor-pointer">
            {shares} {shares === 1 ? 'share' : 'shares'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1 flex-1">
          {/* Like Button with Reactions */}
          <div className="relative">
            <button
              onClick={() => onLike(postId)}
              onMouseEnter={handleMouseEnterLike}
              onMouseLeave={handleMouseLeaveLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center hover:bg-gray-50 ${
                isLiked ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Heart size={18} className={`${isLiked ? 'fill-current text-red-500' : ''}`} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>

            {/* Reaction Picker */}
            {showReactions && (
              <div 
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border border-gray-200 p-2 flex gap-1 z-10"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={handleMouseLeaveLike}
              >
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className={`text-2xl p-2 rounded-full hover:scale-125 transition-transform ${reaction.bgColor}`}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200 flex-1 justify-center"
          >
            <MessageCircle size={18} />
            <span>Comment</span>
          </button>

          {/* Share Button with Menu */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200 flex-1 justify-center"
            >
              <Share size={18} />
              <span>Share</span>
            </button>

            {/* Share Menu */}
            {showShareMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-48 z-10">
                <div className="space-y-1">
                  {SHARE_PLATFORMS.map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform.name)}
                      className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${platform.color}`}>
                        {platform.icon}
                      </span>
                      <span className="text-sm font-medium">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="space-y-3">
          {/* Add Comment */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="You" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                currentUserName[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-transparent resize-none outline-none text-sm"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                />
              </div>
              {commentText.trim() && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleComment}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Send size={14} />
                    Post
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onLike={onLikeComment}
                onReply={() => handleReply(comment.id)}
                isReplying={replyingTo === comment.id}
                onStartReply={() => setReplyingTo(comment.id)}
                onCancelReply={() => setReplyingTo(null)}
                replyText={replyText}
                setReplyText={setReplyText}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReply: (text: string) => void;
  isReplying: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  replyText: string;
  setReplyText: (text: string) => void;
  isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  isReplying,
  onStartReply,
  onCancelReply,
  replyText,
  setReplyText,
  isReply = false
}) => {
  return (
    <div className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          comment.authorName[0]?.toUpperCase()
        )}
      </div>
      <div className="flex-1">
        <div className="bg-gray-100 rounded-2xl px-4 py-2">
          <div className="font-semibold text-sm">{comment.authorName}</div>
          <div className="text-sm mt-1">{comment.text}</div>
        </div>
        
        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
          <button
            onClick={() => onLike(comment.id)}
            className={`font-semibold hover:underline ${comment.isLiked ? 'text-blue-600' : ''}`}
          >
            Like {comment.likes > 0 && `(${comment.likes})`}
          </button>
          {!isReply && (
            <button
              onClick={onStartReply}
              className="font-semibold hover:underline"
            >
              Reply
            </button>
          )}
          <span>{formatTime(comment.timestamp)}</span>
        </div>

        {/* Reply Input */}
        {isReplying && (
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 bg-gray-100 rounded-full text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onReply(replyText);
                  } else if (e.key === 'Escape') {
                    onCancelReply();
                  }
                }}
                autoFocus
              />
            </div>
            <button
              onClick={() => onReply(replyText)}
              disabled={!replyText.trim()}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reply
            </button>
            <button
              onClick={onCancelReply}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-full hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={() => {}}
                isReplying={false}
                onStartReply={() => {}}
                onCancelReply={() => {}}
                replyText=""
                setReplyText={() => {}}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

export default SocialInteractions;
