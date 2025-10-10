import React, { useState, useEffect } from 'react';
import { CurrentUser, Post } from '../types.ts';
import { X } from './Icons.tsx';
import UserProfile from './UserProfile.tsx';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  username?: string;
  currentUser?: CurrentUser | null;
  posts?: Post[];
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  currentUser,
  posts = []
}) => {
  const [profileUser, setProfileUser] = useState<CurrentUser | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (isOpen && (userId || username)) {
      loadUserProfile();
    }
  }, [isOpen, userId, username]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If we have the username but no userId, try to find the user
      if (username && !userId) {
        // Create a mock user profile from the username
        const mockUser: CurrentUser = {
          username: username,
          email: `${username}@example.com`,
          subscriptionStatus: 'none',
          tier: 'free',
          homeCurrency: 'USD',
          language: 'en',
          selectedInterests: [],
          hasCompletedWizard: true,
        };
        setProfileUser(mockUser);
        
        // Filter posts by this username
        const filteredPosts = posts.filter(post => 
          post.author?.name === username || post.userId === username
        );
        setUserPosts(filteredPosts);
      } else if (userId) {
        // Try to fetch user from backend
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            const user: CurrentUser = {
              mongoId: userData._id,
              username: userData.username || username || 'User',
              email: userData.email || '',
              subscriptionStatus: userData.subscriptionStatus || 'none',
              tier: userData.tier || 'free',
              homeCurrency: userData.homeCurrency || 'USD',
              language: userData.language || 'en',
              selectedInterests: userData.selectedInterests || [],
              hasCompletedWizard: userData.hasCompletedWizard ?? true,
              profilePicture: userData.profilePicture,
              isAdmin: userData.isAdmin || false,
              profileType: userData.profileType || 'traveler',
            };
            setProfileUser(user);
            
            // Filter posts by this user
            const filteredPosts = posts.filter(post => 
              post.userId === userId || post.author?.name === user.username
            );
            setUserPosts(filteredPosts);
            
            // Mock follower data (in a real app, this would come from the API)
            setFollowerCount(Math.floor(Math.random() * 100));
            setFollowingCount(Math.floor(Math.random() * 50));
          } else {
            throw new Error('User not found');
          }
        } catch (apiError) {
          // Fallback to creating a mock user
          const mockUser: CurrentUser = {
            username: username || 'User',
            email: `${username || 'user'}@example.com`,
            subscriptionStatus: 'none',
            tier: 'free',
            homeCurrency: 'USD',
            language: 'en',
            selectedInterests: [],
            hasCompletedWizard: true,
          };
          setProfileUser(mockUser);
          
          const filteredPosts = posts.filter(post => 
            post.userId === userId || post.author?.name === username
          );
          setUserPosts(filteredPosts);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    
    try {
      // Mock follow/unfollow (in a real app, this would call the API)
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
      
      // Here you would make an API call to follow/unfollow the user
      // await fetch(`/api/users/${profileUser.mongoId}/follow`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to follow/unfollow user:', error);
    }
  };

  const handleMessage = () => {
    // Mock message functionality
    alert(`Message feature would open a chat with ${profileUser?.username}`);
  };

  const handleEdit = () => {
    // Close modal and navigate to profile edit
    onClose();
    // In a real app, this would navigate to the profile edit page
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadUserProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : profileUser ? (
            <UserProfile
              user={profileUser}
              posts={userPosts}
              isOwnProfile={currentUser?.mongoId === profileUser.mongoId || currentUser?.username === profileUser.username}
              onFollow={handleFollow}
              onMessage={handleMessage}
              onEdit={handleEdit}
              isFollowing={isFollowing}
              followerCount={followerCount}
              followingCount={followingCount}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">User profile not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;