import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { withApiBase } from '../../services/config';

interface Post {
  _id: string;
  username: string;
  content: string;
  imageUrl?: string;
  location: string;
  createdAt: string;
}

interface Review {
  _id: string;
  username: string;
  placeName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const AdminContentModerationView: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reviews'>('posts');

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [postsRes, reviewsRes] = await Promise.all([
        fetch(withApiBase('/api/posts')),
        fetch(withApiBase('/api/reviews'))
      ]);
      
      const [postsData, reviewsData] = await Promise.all([
        postsRes.json(),
        reviewsRes.json()
      ]);
      
      // Transform posts to match expected format
      const transformedPosts = postsData.map((post: any) => ({
        _id: post._id,
        username: post.author?.name || 'Unknown',
        content: post.content?.text || '',
        imageUrl: post.content?.images?.[0] || null,
        location: post.author?.location || 'Unknown',
        createdAt: post.createdAt
      }));
      
      // Transform reviews to match expected format
      const transformedReviews = reviewsData.map((review: any) => ({
        _id: review._id,
        username: review.userId?.username || 'Unknown',
        placeName: review.placeId || 'Unknown Place',
        rating: review.rating,
        comment: review.text,
        createdAt: review.createdAt
      }));
      
      setPosts(transformedPosts);
      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
  await fetch(withApiBase(`/api/posts/${postId}`), {
        method: 'DELETE'
      });
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
  await fetch(withApiBase(`/api/reviews/${reviewId}`), {
        method: 'DELETE'
      });
      setReviews(reviews.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading content...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Content Moderation</h1>
      
      <div style={cardStyle}>
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg font-medium`}
            style={{
              backgroundColor: activeTab === 'posts' ? Colors.primary : Colors.inputBackground,
              color: activeTab === 'posts' ? 'white' : Colors.text_secondary
            }}
          >
            Community Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg font-medium`}
            style={{
              backgroundColor: activeTab === 'reviews' ? Colors.primary : Colors.inputBackground,
              color: activeTab === 'reviews' ? 'white' : Colors.text_secondary
            }}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p style={{ color: Colors.text_secondary }}>No community posts found.</p>
            ) : (
              posts.map(post => (
                <div key={post._id} className="border rounded-lg p-4" style={{ borderColor: Colors.cardBorder }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold" style={{ color: Colors.text }}>{post.username}</h3>
                      <p className="text-sm" style={{ color: Colors.text_secondary }}>
                        {post.location} • {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deletePost(post._id)}
                      className="text-xs px-3 py-1 rounded"
                      style={{ color: Colors.accentError, backgroundColor: `${Colors.accentError}20` }}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="mb-2" style={{ color: Colors.text }}>{post.content}</p>
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="Post" className="w-32 h-32 object-cover rounded" />
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p style={{ color: Colors.text_secondary }}>No reviews found.</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="border rounded-lg p-4" style={{ borderColor: Colors.cardBorder }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold" style={{ color: Colors.text }}>@{review.username}</h3>
                      <p className="text-sm" style={{ color: Colors.text_secondary }}>
                        {review.placeName} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="text-xs px-3 py-1 rounded"
                      style={{ color: Colors.accentError, backgroundColor: `${Colors.accentError}20` }}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                    <span className="ml-2 text-sm" style={{ color: Colors.text_secondary }}>({review.rating}/5)</span>
                  </div>
                  <p style={{ color: Colors.text }}>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentModerationView;