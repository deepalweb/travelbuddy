import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useUserSecurity } from '../hooks/useUserSecurity'
import { User, Mail, Edit3, Save, X, MapPin, Calendar, Star, Shield, UserCheck, Crown, Zap, Bell, LogOut, Phone, Globe, Camera, Eye, Lock, Settings, MessageCircle, Heart, FileText, TrendingUp, Users, Car, Briefcase, Award, CheckCircle, AlertCircle, Sparkles, Target, DollarSign, Compass, Trophy, Medal, Flag, Clock, Bookmark, ThumbsUp, Instagram, Linkedin, Twitter, Facebook, Link as LinkIcon, Plane, Wallet, Coffee, Mountain } from 'lucide-react'
import ProfilePictureUpload from '../components/ProfilePictureUpload'
import { configService } from '../services/configService'

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const { security, updateSecurity } = useUserSecurity()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    homeCity: user?.homeCity || '',
    languages: user?.languages || []
  })
  const [loading, setLoading] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    placesVisited: 0,
    reviewsWritten: 0,
    aiGenerations: 0,
    profileViews: 0,
    dealsCreated: 0,
    clientSatisfaction: 0,
    ridesCompleted: 0
  })
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    linkedin: '',
    twitter: '',
    facebook: ''
  })
  const [preferences, setPreferences] = useState({
    budgetRange: 'moderate',
    travelPace: 'moderate',
    interests: [] as string[],
    accessibility: false
  })
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    hideTravel: false,
    hideActivity: false
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    trips: true,
    deals: true,
    community: true
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)

  const calculateProfileCompletion = () => {
    let completed = 0
    const total = 5
    if (user?.fullName || formData.fullName) completed++
    if (security.emailVerified) completed++
    if (user?.phone || formData.phone) completed++
    if (user?.bio || formData.bio) completed++
    if (user?.homeCity || formData.homeCity) completed++
    return Math.round((completed / total) * 100)
  }

  useEffect(() => {
    configService.getConfig().then(config => setApiBaseUrl(config.apiBaseUrl))
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchUserStats()
    }
  }, [user?.id])

  useEffect(() => {
    // Load social links and preferences from user object
    if (user) {
      if ((user as any).socialLinks) setSocialLinks((user as any).socialLinks)
      if ((user as any).travelPreferences) setPreferences((user as any).travelPreferences)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.role-menu-container')) {
        setShowRoleMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchUserStats = async () => {
    try {
      const config = await configService.getConfig()
      const token = localStorage.getItem('token') || localStorage.getItem('demo_token')
      const headers: Record<string, string> = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch(`${config.apiBaseUrl}/api/users/${user?.id}/stats`, { headers })
      if (response.ok) {
        const data = await response.json()
        setStats({
          tripsPlanned: data.totalTrips || 0,
          placesVisited: data.totalFavorites || 0,
          reviewsWritten: data.totalPosts || 0,
          aiGenerations: data.aiGenerations || 0,
          profileViews: data.profileViews || 0,
          dealsCreated: data.dealsCreated || 0,
          clientSatisfaction: data.clientSatisfaction || 0,
          ridesCompleted: data.ridesCompleted || 0
        })
        
        setFormData({
          username: user?.username || '',
          email: user?.email || '',
          fullName: data.fullName || user?.fullName || '',
          phone: data.phone || user?.phone || '',
          bio: data.bio || user?.bio || '',
          homeCity: data.homeCity || user?.homeCity || '',
          languages: data.languages || user?.languages || []
        })
        
        if (data.socialLinks) setSocialLinks(data.socialLinks)
        if (data.travelPreferences) setPreferences(data.travelPreferences)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const config = await configService.getConfig()
      const token = localStorage.getItem('token') || localStorage.getItem('demo_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch(`${config.apiBaseUrl}/api/users/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...formData, socialLinks, travelPreferences: preferences })
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        await updateProfile({ 
          username: formData.username,
          fullName: formData.fullName,
          phone: formData.phone,
          bio: formData.bio,
          homeCity: formData.homeCity,
          socialLinks: socialLinks as any,
          travelPreferences: preferences as any
        })
        setIsEditing(false)
        alert('Profile updated successfully!')
        // Don't refetch - formData already has the correct values
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      homeCity: user?.homeCity || '',
      languages: user?.languages || []
    })
    setIsEditing(false)
  }

  const handleProfilePictureSuccess = async (url: string) => {
    console.log('Profile picture uploaded successfully:', url)
    setUploadProgress(null)
    setUploadError(null)
    
    // Update user context with new profile picture
    if (user) {
      await updateProfile({ profilePicture: url })
    }
    
    fetchUserStats()
  }

  const handleProfilePictureError = (error: string) => {
    console.error('Profile picture upload failed:', error)
    setUploadProgress(null)
    setUploadError(error)
    setTimeout(() => setUploadError(null), 5000)
  }

  const handleUploadProgress = (progress: number) => {
    // Progress updates are now handled internally by ProfilePictureUpload
    // This callback is kept for future use if needed
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  const getRoleStats = () => {
    const role = user.activeRole || user.role
    if (role === 'merchant') {
      return [
        { icon: TrendingUp, label: 'Deals Created', value: stats.dealsCreated, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
        { icon: Eye, label: 'Profile Views', value: stats.profileViews, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
        { icon: Star, label: 'Rating', value: '4.8', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' }
      ]
    }
    if (role === 'travel_agent') {
      return [
        { icon: Users, label: 'Clients Served', value: stats.ridesCompleted, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
        { icon: Award, label: 'Satisfaction', value: `${stats.clientSatisfaction}%`, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
        { icon: Star, label: 'Rating', value: '4.9', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' }
      ]
    }
    if (role === 'transport_provider') {
      return [
        { icon: Car, label: 'Rides Completed', value: stats.ridesCompleted, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
        { icon: TrendingUp, label: 'Fleet Usage', value: '85%', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
        { icon: Star, label: 'Driver Rating', value: '4.7', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' }
      ]
    }
    return [
      { icon: MapPin, label: 'Trips Planned', value: stats.tripsPlanned, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
      { icon: Heart, label: 'Places Saved', value: stats.placesVisited, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
      { icon: FileText, label: 'Posts Shared', value: stats.reviewsWritten, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' }
    ]
  }

  const getTravelPersonality = () => {
    const trips = stats.tripsPlanned
    const places = stats.placesVisited
    if (trips >= 10) return { type: 'Adventure Seeker', icon: Compass, desc: 'Always exploring new horizons' }
    if (places >= 20) return { type: 'Culture Explorer', icon: Globe, desc: 'Passionate about diverse experiences' }
    if (trips >= 5) return { type: 'Weekend Wanderer', icon: MapPin, desc: 'Regular traveler building memories' }
    return { type: 'Journey Starter', icon: Sparkles, desc: 'Beginning your travel adventure' }
  }

  const getMilestones = () => {
    const milestones = []
    if (stats.tripsPlanned >= 1) milestones.push({ icon: Flag, label: 'First Trip', color: 'text-blue-600' })
    if (stats.tripsPlanned >= 5) milestones.push({ icon: Trophy, label: '5 Trips', color: 'text-purple-600' })
    if (stats.placesVisited >= 10) milestones.push({ icon: Medal, label: '10 Places', color: 'text-green-600' })
    if (stats.reviewsWritten >= 5) milestones.push({ icon: Star, label: '5 Reviews', color: 'text-yellow-600' })
    return milestones
  }

  const getRecentActivity = () => [
    { icon: MapPin, action: 'Planned a trip to', target: 'Paris, France', time: '2 days ago', color: 'text-blue-600' },
    { icon: Heart, action: 'Saved', target: 'Eiffel Tower', time: '5 days ago', color: 'text-red-600' },
    { icon: Star, action: 'Reviewed', target: 'Hotel Luxe', time: '1 week ago', color: 'text-yellow-600' },
    { icon: ThumbsUp, action: 'Recommended', target: 'Tokyo Guide', time: '2 weeks ago', color: 'text-green-600' }
  ]

  const interestOptions = [
    { id: 'culture', label: 'Culture & History', icon: Globe },
    { id: 'adventure', label: 'Adventure', icon: Mountain },
    { id: 'food', label: 'Food & Dining', icon: Coffee },
    { id: 'beach', label: 'Beach & Relaxation', icon: Plane }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Hero Header with Profile */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Profile Picture */}
            <div className="flex justify-center">
              <div className="relative">
                <ProfilePictureUpload
                  currentPicture={user.profilePicture}
                  onUploadSuccess={handleProfilePictureSuccess}
                  onUploadError={handleProfilePictureError}
                />
                {uploadProgress !== null && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 rounded-b-full text-center">
                    Uploading... {uploadProgress}%
                  </div>
                )}
                {uploadError && (
                  <div className="absolute -bottom-8 left-0 right-0 bg-red-500 text-white text-xs py-2 px-3 rounded-lg text-center shadow-lg">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
            
            {/* User Info */}
            <div className="text-center lg:text-left flex-1">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                <h1 className="text-5xl font-bold">{user.username}</h1>
                <CheckCircle className="w-6 h-6 text-green-400" title="Verified Account" />
              </div>
              
              <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
                <Mail className="w-5 h-5 text-white/80" />
                <p className="text-xl text-white/90">{user.email}</p>
                {security.emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-green-400" title="Email Verified" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" title="Email Not Verified" />
                )}
              </div>
              
              {(user.phone || formData.phone) && (
                <div className="flex items-center justify-center lg:justify-start space-x-2 mb-6">
                  <Phone className="w-5 h-5 text-white/80" />
                  <p className="text-lg text-white/90">{user.phone || formData.phone}</p>
                  {security.phoneVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-400" title="Phone Verified" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-400" title="Phone Not Verified" />
                  )}
                </div>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-lg">
                  {(user.tier === 'travelagent' || user.tier === 'partner') && <Crown className="w-4 h-4 mr-2 inline" />}
                  {user.tier === 'wanderpro' && <Zap className="w-4 h-4 mr-2 inline" />}
                  {(user.tier || 'explorer').charAt(0).toUpperCase() + (user.tier || 'explorer').slice(1)} Plan
                </div>
                
                {(user.roles || [user.role || 'user']).map(role => (
                  <div key={role} className={`px-4 py-2 rounded-full font-medium shadow-lg ${
                    role === user.activeRole 
                      ? 'bg-white text-blue-600' 
                      : 'bg-white/20 backdrop-blur-sm border border-white/30'
                  }`}>
                    {role === 'merchant' ? '🏪 Business' :
                     role === 'transport_provider' ? '🚗 Transport' :
                     role === 'travel_agent' ? '🧳 Agent' : '✈️ Traveler'}
                    {role === user.activeRole && ' (Active)'}
                  </div>
                ))}
              </div>
              
              {user.bio && (
                <p className="text-lg text-white/90 max-w-2xl">{user.bio}</p>
              )}
            </div>
            
            {/* Edit Controls */}
            <div className="flex flex-col space-y-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <Edit3 className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    className="bg-white text-blue-600 hover:bg-white/90"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => setShowSubscriptionModal(true)}
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        {/* Profile Completion Progress */}
        <Card className="bg-white shadow-lg mb-8 border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                <p className="text-sm text-gray-600">Complete your profile to unlock all features</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{calculateProfileCompletion()}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${calculateProfileCompletion()}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Role Switcher Widget */}
        <Card className="bg-white shadow-lg mb-8 border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Active Role</p>
                  <p className="font-semibold text-gray-900">
                    {user.activeRole === 'merchant' ? '🏪 Business Owner' :
                     user.activeRole === 'transport_provider' ? '🚗 Transport Provider' :
                     user.activeRole === 'travel_agent' ? '🧳 Travel Agent' : '✈️ Traveler'}
                  </p>
                </div>
              </div>
              <div className="relative role-menu-container">
                <Button
                  variant="outline"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="border-2"
                >
                  Switch Role ▼
                </Button>
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border-2 border-gray-100 z-50">
                    <div className="p-2">
                      {(user.roles || [user.role || 'user']).map(role => (
                        <button
                          key={role}
                          onClick={() => {
                            // Handle role switch logic here
                            setShowRoleMenu(false)
                            navigate('/role-selection')
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors ${
                            role === user.activeRole ? 'bg-blue-100 font-semibold' : ''
                          }`}
                        >
                          {role === 'merchant' ? '🏪 Business Owner' :
                           role === 'transport_provider' ? '🚗 Transport Provider' :
                           role === 'travel_agent' ? '🧳 Travel Agent' : '✈️ Traveler'}
                          {role === user.activeRole && ' ✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Dynamic Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {getRoleStats().map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <CardContent className="p-8 text-center">
                  <div className={`w-24 h-24 ${stat.bgColor} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm`}>
                    <Icon className={`w-14 h-14 ${stat.iconColor}`} />
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium text-lg">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Travel Personality & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Travel Personality Widget */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                  {(() => {
                    const PersonalityIcon = getTravelPersonality().icon
                    return <PersonalityIcon className="w-9 h-9 text-white" />
                  })()}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Your Travel Personality</p>
                  <h3 className="text-2xl font-bold text-gray-900">{getTravelPersonality().type}</h3>
                  <p className="text-sm text-gray-600 mt-1">{getTravelPersonality().desc}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">${stats.tripsPlanned * 450}</div>
                  <div className="text-xs text-gray-600">Est. Travel Spend</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.placesVisited}</div>
                  <div className="text-xs text-gray-600">Places Explored</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gamification Badges */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
                </div>
                <span className="text-sm font-semibold text-gray-600">{getMilestones().length} Unlocked</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {getMilestones().map((milestone, idx) => {
                  const MilestoneIcon = milestone.icon
                  return (
                    <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <MilestoneIcon className={`w-6 h-6 ${milestone.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{milestone.label}</p>
                        <p className="text-xs text-gray-500">Unlocked</p>
                      </div>
                    </div>
                  )
                })}
                {getMilestones().length === 0 && (
                  <div className="col-span-2 text-center py-6 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Start your journey to unlock badges!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mini Activity Feed & Travel Preferences */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Mini Activity Feed */}
          <Card className="bg-white shadow-lg lg:col-span-2 border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {getRecentActivity().map((activity, idx) => {
                  const ActivityIcon = activity.icon
                  return (
                    <div key={idx} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ActivityIcon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.action}</span>{' '}
                          <span className="font-semibold text-blue-600">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Social Profile Links */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-purple-600" />
                Social Links
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Instagram</label>
                      <div className="flex items-center space-x-2">
                        <Instagram className="w-4 h-4 text-pink-600" />
                        <input
                          type="text"
                          value={socialLinks.instagram}
                          onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="@username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">LinkedIn</label>
                      <div className="flex items-center space-x-2">
                        <Linkedin className="w-4 h-4 text-blue-700" />
                        <input
                          type="text"
                          value={socialLinks.linkedin}
                          onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="/in/username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Twitter</label>
                      <div className="flex items-center space-x-2">
                        <Twitter className="w-4 h-4 text-blue-400" />
                        <input
                          type="text"
                          value={socialLinks.twitter}
                          onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {!socialLinks.instagram && !socialLinks.linkedin && !socialLinks.twitter ? (
                      <div className="text-center py-6">
                        <LinkIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No social links added</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="mt-3"
                        >
                          Add Links
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {socialLinks.instagram && (
                          <a href={`https://instagram.com/${socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                            <Instagram className="w-5 h-5 text-pink-600" />
                            <span className="text-sm text-gray-900">{socialLinks.instagram}</span>
                          </a>
                        )}
                        {socialLinks.linkedin && (
                          <a href={`https://linkedin.com${socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                            <Linkedin className="w-5 h-5 text-blue-700" />
                            <span className="text-sm text-gray-900">{socialLinks.linkedin}</span>
                          </a>
                        )}
                        {socialLinks.twitter && (
                          <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                            <Twitter className="w-5 h-5 text-blue-400" />
                            <span className="text-sm text-gray-900">{socialLinks.twitter}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Travel Preferences Section */}
        <Card className="bg-white shadow-lg mb-12 border border-gray-100">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl text-gray-900 flex items-center justify-between">
              <div className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Travel Preferences
              </div>
              {/* Edit button temporarily disabled */}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Budget Range</label>
                {isEditing ? (
                  <select
                    value={preferences.budgetRange}
                    onChange={(e) => setPreferences({ ...preferences, budgetRange: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="budget">Budget ($)</option>
                    <option value="moderate">Moderate ($$)</option>
                    <option value="luxury">Luxury ($$$)</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Wallet className="w-5 h-5 text-green-600" />
                    <span className="font-medium capitalize">{preferences.budgetRange}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Travel Pace</label>
                {isEditing ? (
                  <select
                    value={preferences.travelPace}
                    onChange={(e) => setPreferences({ ...preferences, travelPace: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="relaxed">Relaxed</option>
                    <option value="moderate">Moderate</option>
                    <option value="fast">Fast-Paced</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-medium capitalize">{preferences.travelPace}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Accessibility</label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={preferences.accessibility}
                      onChange={(e) => setPreferences({ ...preferences, accessibility: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                  ) : (
                    <CheckCircle className={`w-5 h-5 ${preferences.accessibility ? 'text-green-600' : 'text-gray-300'}`} />
                  )}
                  <span className="font-medium">{preferences.accessibility ? 'Required' : 'Not Required'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Travel Interests</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {interestOptions.map((interest) => {
                  const InterestIcon = interest.icon
                  const isSelected = preferences.interests.includes(interest.id)
                  return (
                    <button
                      key={interest.id}
                      onClick={() => {
                        if (isEditing) {
                          setPreferences({
                            ...preferences,
                            interests: isSelected
                              ? preferences.interests.filter(i => i !== interest.id)
                              : [...preferences.interests, interest.id]
                          })
                        }
                      }}
                      disabled={!isEditing}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <InterestIcon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-600'}`}>
                        {interest.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-16">
          {/* 3. Personal Information (Enhanced) */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-white shadow-lg border border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <User className="w-6 h-6 mr-3 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Home City</label>
                      <input
                        type="text"
                        value={formData.homeCity}
                        onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York, NY"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <p className="text-lg text-gray-900 font-medium">{user.username}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Member Since</label>
                        <p className="text-lg text-gray-900 font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Account Status</label>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-lg text-gray-900 font-medium">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 4. Account Status & Security */}
            <Card className="bg-white shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Account Security</h3>
                      <p className="text-green-100 text-sm">✓ Your account is secure</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Email Verified</p>
                        <p className="text-sm text-gray-600">Confirmed and secure</p>
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${
                    security.twoFactorEnabled 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                        security.twoFactorEnabled ? 'bg-green-500' : 'bg-amber-500'
                      }`}>
                        {security.twoFactorEnabled ? (
                          <CheckCircle className="w-7 h-7 text-white" />
                        ) : (
                          <AlertCircle className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Two-Factor Auth</p>
                        <p className="text-sm text-gray-600">
                          {security.twoFactorEnabled ? 'Extra protection active' : 'Recommended for security'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className={security.twoFactorEnabled 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'}
                      onClick={() => updateSecurity({ twoFactorEnabled: !security.twoFactorEnabled })}
                    >
                      {security.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 5. Quick Actions Panel (Enhanced) */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-white shadow-lg border border-gray-100">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <Zap className="w-6 h-6 mr-3 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {/* Primary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    className="justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-14 shadow-md"
                    onClick={() => setShowSubscriptionModal(true)}
                  >
                    <Crown className="w-6 h-6 mr-3" />
                    <div className="text-left">
                      <div className="font-semibold">Subscription</div>
                      <div className="text-xs opacity-90">Manage your plan</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="justify-start border-2 hover:bg-blue-50 h-14"
                    onClick={() => navigate('/trips')}
                  >
                    <MapPin className="w-6 h-6 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-semibold">My Trips</div>
                      <div className="text-xs text-gray-500">View & manage</div>
                    </div>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start border-2 hover:bg-green-50 h-14"
                    onClick={() => navigate('/community')}
                  >
                    <Heart className="w-6 h-6 mr-3 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold">Saved Places</div>
                      <div className="text-xs text-gray-500">{stats.placesVisited} places</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="justify-start border-2 hover:bg-yellow-50 h-14"
                    onClick={() => navigate('/community')}
                  >
                    <MessageCircle className="w-6 h-6 mr-3 text-yellow-600" />
                    <div className="text-left">
                      <div className="font-semibold">Messages</div>
                      <div className="text-xs text-gray-500">3 unread</div>
                    </div>
                  </Button>
                </div>
                
                {/* Role-Specific Actions */}
                {(user.activeRole === 'merchant' || user.role === 'merchant') && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Business Tools</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="justify-start h-12" onClick={() => navigate('/deals/create')}>
                        <TrendingUp className="w-5 h-5 mr-3 text-purple-600" />
                        Create Deal
                      </Button>
                      <Button variant="outline" className="justify-start h-12">
                        <Briefcase className="w-5 h-5 mr-3 text-blue-600" />
                        Business Profile
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* System Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 hover:bg-gray-50"
                    onClick={() => navigate('/role-selection')}
                  >
                    <UserCheck className="w-5 h-5 mr-3" />
                    Switch Role
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 hover:bg-gray-50"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    Privacy Settings
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 hover:bg-gray-50"
                    onClick={() => setShowNotificationsModal(true)}
                  >
                    <Bell className="w-5 h-5 mr-3" />
                    Notifications
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 hover:bg-blue-50"
                    onClick={async () => {
                      const data = { user, stats, preferences, socialLinks }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `travelbuddy-data-${user.username}.json`
                      a.click()
                    }}
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    Export My Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <AlertCircle className="w-5 h-5 mr-3" />
                    Delete Account
                  </Button>
                  
                  {user.isAdmin && (
                    <Button
                      variant="outline"
                      className="w-full justify-start border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => window.location.href = '/admin'}
                    >
                      <Shield className="w-5 h-5 mr-3" />
                      Admin Panel
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    onClick={logout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
              <Button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (confirm('Type DELETE to confirm')) {
                    const token = localStorage.getItem('token') || localStorage.getItem('demo_token')
                    const headers: Record<string, string> = {}
                    if (token) headers['Authorization'] = `Bearer ${token}`
                    await fetch(`${apiBaseUrl}/api/users/profile`, { method: 'DELETE', headers })
                    logout()
                  }
                }}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Profile Visibility</label>
                <select 
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={privacySettings.hideTravel}
                  onChange={(e) => setPrivacySettings({...privacySettings, hideTravel: e.target.checked})}
                  className="w-5 h-5"
                />
                <span>Hide Travel History</span>
              </label>
              <label className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={privacySettings.hideActivity}
                  onChange={(e) => setPrivacySettings({...privacySettings, hideActivity: e.target.checked})}
                  className="w-5 h-5"
                />
                <span>Hide Activity</span>
              </label>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowPrivacyModal(false)} className="flex-1">Cancel</Button>
              <Button 
                className="flex-1"
                onClick={async () => {
                  await fetch(`${apiBaseUrl}/api/users/privacy`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                    body: JSON.stringify(privacySettings)
                  })
                  setShowPrivacyModal(false)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span>Email Notifications</span>
                <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span>Push Notifications</span>
                <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({...notifications, push: e.target.checked})} className="w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span>Trip Updates</span>
                <input type="checkbox" checked={notifications.trips} onChange={(e) => setNotifications({...notifications, trips: e.target.checked})} className="w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span>Deals & Offers</span>
                <input type="checkbox" checked={notifications.deals} onChange={(e) => setNotifications({...notifications, deals: e.target.checked})} className="w-5 h-5" />
              </label>
              <label className="flex items-center justify-between">
                <span>Community Alerts</span>
                <input type="checkbox" checked={notifications.community} onChange={(e) => setNotifications({...notifications, community: e.target.checked})} className="w-5 h-5" />
              </label>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowNotificationsModal(false)} className="flex-1">Cancel</Button>
              <Button 
                className="flex-1"
                onClick={async () => {
                  await fetch(`${apiBaseUrl}/api/users/notifications`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                    body: JSON.stringify(notifications)
                  })
                  setShowNotificationsModal(false)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
