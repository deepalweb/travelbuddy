import React, { useState, useEffect } from 'react';
import { Post } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { Heart, MessageCircle, Share, Bookmark, MapPin as MapPinIcon, MoreHorizontal, Eye, Award, Send, ThumbsUp, Smile } from './Icons.tsx';

interface Comment {
    id: string;
    userId?: string;
    username: string;
    text: string;
    createdAt: Date;
    likes: number;
    likedBy: string[];
}

interface PostCardProps {
    post: Post;
    onLikePost: (id: string) => void;
    onBookmarkPost: (id: string) => void;
    onSharePost: (post: Post) => void;
    onCommentPost?: (id: string, text: string) => void;
    currentUsername?: string | null;
    currentUserId?: string | null;
    onEditPost?: (post: Post) => void;
    onUserClick?: (userId?: string, username?: string) => void;
}

const CommunityPostCard: React.FC<PostCardProps> = ({ post, onLikePost, onBookmarkPost, onSharePost, onCommentPost, currentUsername, currentUserId, onEditPost, onUserClick }) => {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    // Initialize state from post data
    useEffect(() => {
        setIsLiked(post?.engagement?.isLiked ?? false);
        setLikeCount(post?.engagement?.likes ?? 0);
    }, [post]);

    // Close share menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showShareMenu) {
                setShowShareMenu(false);
            }
        };
        
        if (showShareMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showShareMenu]);

    // Safely derive commonly used fields with sensible defaults
    const contentText = post?.content?.text ?? '';
    const images = Array.isArray(post?.content?.images) ? post.content.images : [];
    const tags = Array.isArray(post?.tags) ? post.tags : [];
    const author = post?.author ?? { name: 'User', avatar: '', location: '', verified: false };
    const engagement = {
        likes: likeCount,
        comments: post?.engagement?.comments ?? 0,
        shares: post?.engagement?.shares ?? 0,
        isLiked: isLiked,
        isBookmarked: post?.engagement?.isBookmarked ?? false,
    };
    const canExpand = contentText.length > 200;

    // Load comments when showing comments section
    const loadComments = async () => {
        if (isLoadingComments) return;
        setIsLoadingComments(true);
        try {
            const response = await fetch(`/api/posts/${post.id}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoadingComments(false);
        }
    };

    // Handle like with optimistic updates
    const handleLike = async () => {
        const wasLiked = isLiked;
        const prevCount = likeCount;
        
        // Optimistic update
        setIsLiked(!wasLiked);
        setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);
        
        try {
            const response = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    username: currentUsername 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setIsLiked(data.liked);
                setLikeCount(data.likes);
            } else {
                // Revert on error
                setIsLiked(wasLiked);
                setLikeCount(prevCount);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(wasLiked);
            setLikeCount(prevCount);
            console.error('Failed to like post:', error);
        }
    };

    // Handle comment submission
    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;
        
        const commentText = newComment.trim();
        setNewComment('');
        
        try {
            const response = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: currentUserId,
                    username: currentUsername || 'Anonymous',
                    text: commentText 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            setNewComment(commentText);
        }
    };

    // Handle share with menu
    const handleShare = (type: 'copy' | 'facebook' | 'twitter' | 'whatsapp') => {
        const url = `${window.location.origin}/post/${post.id}`;
        const text = `Check out this post: ${contentText.slice(0, 100)}...`;
        
        switch (type) {
            case 'copy':
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                break;
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                break;
        }
        setShowShareMenu(false);
        onSharePost(post);
    };

    const formatTime = (dateInput: Date | string | number | undefined) => {
        const d = dateInput ? new Date(dateInput) : null;
        const time = d?.getTime();
        if (!d || Number.isNaN(time)) return t('communityPage.post.justNow', { default: 'Just now' });
        const seconds = Math.floor((Date.now() - (time as number)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)}y ${t('communityPage.post.ago')}`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)}mo ${t('communityPage.post.ago')}`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ${t('communityPage.post.ago')}`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ${t('communityPage.post.ago')}`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ${t('communityPage.post.ago')}`;
        return t('communityPage.post.justNow', { default: 'Just now' });
    };

    const getCategoryStyle = (category?: string) => {
        const key = typeof category === 'string' ? category.toLowerCase() : '';
        switch(key){
            case 'experience': return { bg: 'bg-gradient-to-r from-blue-100 to-blue-200', text: 'text-blue-800' };
            case 'tip': return { bg: 'bg-gradient-to-r from-green-100 to-green-200', text: 'text-green-800' };
            case 'photo': return { bg: 'bg-gradient-to-r from-purple-100 to-purple-200', text: 'text-purple-800' };
            case 'itinerary': return { bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200', text: 'text-yellow-800' };
            case 'question': return { bg: 'bg-gradient-to-r from-orange-100 to-orange-200', text: 'text-orange-800' };
            default: return { bg: 'bg-gradient-to-r from-gray-100 to-gray-200', text: 'text-gray-800' };
        }
    };
    const categoryStyle = getCategoryStyle((post as any)?.category);

    return (
        <div className="card-base p-5 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-indigo-100">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div 
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white shadow-md cursor-pointer hover:shadow-lg transition-shadow" 
                            style={{backgroundImage: author.avatar ? `url(${author.avatar})` : undefined, backgroundSize: 'cover'}}
                            onClick={() => onUserClick?.((post as any).userId, author.name)}
                        >
                            {!author.avatar && (author.name ? author.name.charAt(0) : 'U')}
                        </div>
                        {author.verified && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Award size={12} className="text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span 
                                className="font-bold text-base cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => onUserClick?.((post as any).userId, author.name)}
                            >
                                {author.name || 'User'}
                            </span>
                            {author.verified && <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-sm">Verified</span>}
                        </div>
                         <p className="text-xs flex items-center gap-1 mt-1" style={{color: 'var(--color-text-secondary)'}}>
                            <MapPinIcon size={12} className="text-indigo-500" /> {author.location || '—'} · {formatTime(post?.timestamp)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    {(post.author?.name === currentUsername || (post as any).userId === currentUserId) && (
                        <button onClick={() => onEditPost && onEditPost(post)} className="px-3 py-1.5 mr-2 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">Edit</button>
                    )}
                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" style={{color: 'var(--color-text-secondary)'}}>
                        <MoreHorizontal size={18}/>
                    </button>
                </div>
            </div>

            {/* Post Content */}
            <div className="space-y-4">
                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{color: 'var(--color-text-primary)'}}>
                    {isExpanded ? contentText : contentText.slice(0, 200)}
                    {canExpand && !isExpanded && '...'}
                    {canExpand && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className="text-indigo-600 text-sm ml-2 font-medium hover:text-indigo-800 transition-colors"
                        >
                            {isExpanded ? 'Show Less' : 'Read More'}
                        </button>
                    )}
                </p>
                
                {images.length > 0 && (
                     <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                        {images.map((img, idx) => (
                            <div key={idx} className="relative group cursor-pointer overflow-hidden rounded-xl">
                                <img 
                                    src={img} 
                                    loading="lazy" 
                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
                                    alt={`Post content ${idx+1}`}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                    <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex flex-wrap gap-2 items-center">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                        {post?.category || 'General'}
                    </span>
                    {tags.map(tag => (
                        <span 
                            key={tag} 
                            className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Enhanced Facebook-like Post Actions */}
            <div className="mt-5 pt-4 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                {/* Engagement Stats */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        {engagement.likes > 0 && (
                            <button 
                                onClick={() => setShowComments(!showComments)}
                                className="flex items-center gap-1 hover:underline cursor-pointer"
                            >
                                <div className="flex -space-x-1">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                        <ThumbsUp size={8} className="text-white" />
                                    </div>
                                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                        <Heart size={8} className="text-white" />
                                    </div>
                                </div>
                                {engagement.likes} {engagement.likes === 1 ? 'like' : 'likes'}
                            </button>
                        )}
                        {engagement.comments > 0 && (
                            <button 
                                onClick={() => {
                                    setShowComments(!showComments);
                                    if (!showComments) loadComments();
                                }}
                                className="hover:underline cursor-pointer"
                            >
                                {engagement.comments} {engagement.comments === 1 ? 'comment' : 'comments'}
                            </button>
                        )}
                    </div>
                    {engagement.shares > 0 && (
                        <span>{engagement.shares} {engagement.shares === 1 ? 'share' : 'shares'}</span>
                    )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                    <div className="flex gap-1 flex-1">
                        <button 
                            onClick={handleLike}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
                                engagement.isLiked 
                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <ThumbsUp size={18} className={`${engagement.isLiked ? 'fill-current' : ''} transition-all`}/> 
                            Like
                        </button>
                        
                        <button
                            onClick={() => {
                                if (!showComments) {
                                    setShowComments(true);
                                    loadComments();
                                } else {
                                    setShowComments(false);
                                }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 flex-1"
                        >
                            <MessageCircle size={18}/> Comment
                        </button>
                        
                        <div className="relative flex-1">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowShareMenu(!showShareMenu);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200 w-full"
                            >
                                <Share size={18}/> Share
                            </button>
                            
                            {/* Share Menu */}
                            {showShareMenu && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[150px]"
                                >
                                    <button 
                                        onClick={() => handleShare('copy')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        📋 Copy Link
                                    </button>
                                    <button 
                                        onClick={() => handleShare('facebook')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        📘 Share to Facebook
                                    </button>
                                    <button 
                                        onClick={() => handleShare('twitter')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        🐦 Share to Twitter
                                    </button>
                                    <button 
                                        onClick={() => handleShare('whatsapp')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        💬 Share to WhatsApp
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onBookmarkPost(post.id)} 
                        className={`p-2 rounded-full transition-all duration-200 ml-2 ${
                            engagement.isBookmarked 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                    >
                        <Bookmark size={18} className={`${engagement.isBookmarked ? 'fill-current' : ''}`}/>
                    </button>
                </div>
                
                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                        {/* Comment Input */}
                        <div className="flex gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                                {currentUsername ? currentUsername.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                />
                                <button
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim()}
                                    className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                        
                        {/* Comments List */}
                        {isLoadingComments ? (
                            <div className="text-center py-4 text-gray-500">Loading comments...</div>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((comment) => {
                                    const commentLiked = comment.likedBy?.includes(currentUserId || currentUsername || 'anon');
                                    return (
                                        <div key={comment._id || comment.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-bold text-white text-sm">
                                                {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                                                    <div className="font-semibold text-sm text-gray-900">{comment.username}</div>
                                                    <div className="text-sm text-gray-800">{comment.text}</div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch(`/api/posts/${post.id}/comments/${comment._id || comment.id}/like`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ userId: currentUserId, username: currentUsername })
                                                                });
                                                                if (response.ok) {
                                                                    loadComments(); // Refresh comments
                                                                }
                                                            } catch (error) {
                                                                console.error('Failed to like comment:', error);
                                                            }
                                                        }}
                                                        className={`hover:underline font-medium flex items-center gap-1 ${
                                                            commentLiked ? 'text-blue-600' : 'text-gray-500'
                                                        }`}
                                                    >
                                                        <ThumbsUp size={12} className={commentLiked ? 'fill-current' : ''} />
                                                        Like {comment.likes > 0 && `(${comment.likes})`}
                                                    </button>
                                                    <button className="hover:underline font-medium text-gray-500">Reply</button>
                                                    <span>{formatTime(comment.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {comments.length === 0 && !isLoadingComments && (
                                    <div className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPostCard;