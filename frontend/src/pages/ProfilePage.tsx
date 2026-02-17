import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useUserSecurity } from '../hooks/useUserSecurity'
import {
  User, Mail, Globe, Camera, Heart, FileText, TrendingUp, Users,
  CheckCircle, AlertCircle, Sparkles, Trophy, Medal, Flag, Clock,
  Plane, Mountain, Layout as LayoutIcon, Phone, MapPin, Edit3, X,
  Crown, Zap, Shield, Target, Eye, Star, Award, Car, Compass,
  Coffee, Wallet, Bell, Link as LinkIcon, Instagram, Twitter,
  Linkedin, Settings, MessageCircle, LogOut, Lock
} from 'lucide-react'
import ProfilePictureUpload from '../components/ProfilePictureUpload'
import { configService } from '../services/configService'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string, url: string }>>([])
  const [newPlatform, setNewPlatform] = useState('')
  const [preferences, setPreferences] = useState({
    budgetRange: 'moderate',
    travelPace: 'moderate',
    interests: [] as string[],
    accessibility: false,
    dietaryNeeds: [] as string[]
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
  const [activeTab, setActiveTab] = useState('overview')

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
      if ((user as any).socialLinks) {
        const links = (user as any).socialLinks
        if (Array.isArray(links)) {
          setSocialLinks(links)
        } else {
          // Convert old format to new
          const converted = Object.entries(links).filter(([_, v]) => v).map(([platform, url]) => ({ platform, url: url as string }))
          setSocialLinks(converted)
        }
      }
      if ((user as any).travelPreferences) {
        setPreferences(prev => ({ ...prev, ...(user as any).travelPreferences }))
      }
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
          aiGenerations: 0,
          profileViews: 0,
          dealsCreated: 0,
          clientSatisfaction: 0,
          ridesCompleted: 0
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

        if (data.socialLinks) {
          if (Array.isArray(data.socialLinks)) {
            setSocialLinks(data.socialLinks)
          } else {
            const converted = Object.entries(data.socialLinks).filter(([_, v]) => v).map(([platform, url]) => ({ platform, url: url as string }))
            setSocialLinks(converted)
          }
        }
        if (data.travelPreferences) {
          setPreferences(prev => ({ ...prev, ...data.travelPreferences }))
        }
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
        await response.json()
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

    // Update user context with new profile picture
    if (user) {
      await updateProfile({ profilePicture: url })
    }

    fetchUserStats()
  }

  const handleProfilePictureError = (error: string) => {
    console.error('Profile picture upload failed:', error)
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
    if (stats.tripsPlanned > 0) milestones.push({ icon: Flag, label: 'First Trip', color: 'text-blue-600' })
    if (stats.tripsPlanned >= 5) milestones.push({ icon: Trophy, label: '5 Trips', color: 'text-purple-600' })
    if (stats.placesVisited >= 10) milestones.push({ icon: Medal, label: '10 Places', color: 'text-green-600' })
    if (stats.reviewsWritten >= 5) milestones.push({ icon: Star, label: '5 Reviews', color: 'text-yellow-600' })
    return milestones
  }

  const getRecentActivity = () => []

  const interestOptions = [
    { id: 'culture', label: 'Culture & History', icon: Globe },
    { id: 'adventure', label: 'Adventure', icon: Mountain },
    { id: 'food', label: 'Food & Dining', icon: Coffee },
    { id: 'beach', label: 'Beach & Relaxation', icon: Plane },
    { id: 'nature', label: 'Nature & Wildlife', icon: Mountain },
    { id: 'shopping', label: 'Shopping', icon: Wallet },
    { id: 'nightlife', label: 'Nightlife', icon: Star },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'wellness', label: 'Wellness & Spa', icon: Heart },
    { id: 'sports', label: 'Sports & Fitness', icon: Trophy },
    { id: 'art', label: 'Art & Museums', icon: Sparkles },
    { id: 'music', label: 'Music & Festivals', icon: Bell }
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
              <ProfilePictureUpload
                currentPicture={user.profilePicture}
                onUploadSuccess={handleProfilePictureSuccess}
                onUploadError={handleProfilePictureError}
              />
            </div>

            {/* User Info */}
            <div className="text-center lg:text-left flex-1">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-2">
                <h1 className="text-5xl font-bold">{(user as any).fullName || user.email?.split('@')[0]}</h1>
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

                <div className="px-4 py-2 rounded-full font-medium shadow-lg bg-white text-blue-600">
                  {user.activeRole === 'merchant' ? '🏪 Business' :
                    user.activeRole === 'transport_provider' ? '🚗 Transport' :
                      user.activeRole === 'travel_agent' ? '🧳 Agent' : '✈️ Traveler'}
                </div>
              </div>

              {user.bio && (
                <p className="text-lg text-white/90 max-w-2xl">{user.bio}</p>
              )}
            </div>

            {/* Upgrade Plan Button */}
            <div className="flex flex-col space-y-3">
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
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutIcon },
            { id: 'profile', label: 'Personal Info', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Target },
            { id: 'security', label: 'Security & Actions', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  // Reset editing state when switching tabs
                  setIsEditing(false)
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <>
                {/* Profile Completion Progress */}
                <Card className="bg-white shadow-lg mb-8 border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                        <p className="text-sm text-gray-600">Complete your profile to unlock all features & perks</p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{calculateProfileCompletion()}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${calculateProfileCompletion()}%` }}
                      />
                    </div>

                    {/* Step-by-step checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'Add your full name', key: 'fullName', field: 'fullName' },
                        { label: 'Verify your email', key: 'emailVerified', isSecurity: true },
                        { label: 'Add phone number', key: 'phone', field: 'phone' },
                        { label: 'Write a bio', key: 'bio', field: 'bio' },
                        { label: 'Add home city', key: 'homeCity', field: 'homeCity' }
                      ].map((item, idx) => {
                        const isComplete = item.isSecurity ? security[item.key as keyof typeof security] : (user[item.key as keyof typeof user] || formData[item.field as keyof typeof formData])
                        return (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isComplete ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isComplete ? 'bg-green-500 text-white' : 'border-2 border-gray-300'}`}>
                                {isComplete ? <CheckCircle className="w-4 h-4" /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                              </div>
                              <span className={`text-sm font-medium ${isComplete ? 'text-green-700' : 'text-gray-600'}`}>{item.label}</span>
                            </div>
                            {!isComplete && (
                              <Button size="sm" variant="ghost" onClick={() => setActiveTab('profile')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 text-xs font-bold">
                                Add
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Dynamic Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {getRoleStats().map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden group">
                        <div className={`h-1 w-full ${stat.bgColor.replace('100', '500')}`} />
                        <CardContent className="p-8">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-8 h-8 ${stat.iconColor}`} />
                            </div>
                          </div>
                          <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
                          <div className="text-gray-500 font-medium">{stat.label}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Travel Personality & Achievements */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card className="bg-white shadow-lg border border-gray-100 overflow-hidden">
                    <CardContent className="p-8 flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center shadow-inner">
                        {(() => {
                          const PersonalityIcon = getTravelPersonality().icon
                          return <PersonalityIcon className="w-10 h-10 text-blue-600" />
                        })()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Travel Personality</div>
                        <h3 className="text-2xl font-bold text-gray-900">{getTravelPersonality().type}</h3>
                        <p className="text-gray-600">{getTravelPersonality().desc}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-lg border border-gray-100">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/30">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center"><Trophy className="w-5 h-5 mr-2 text-yellow-600" />Achievements</CardTitle>
                        <span className="text-xs font-bold text-gray-400 uppercase">{getMilestones().length} Unlocked</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 gap-3">
                        {getMilestones().map((m, idx) => {
                          const Icon = m.icon
                          return (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100`}>
                                <Icon className={`w-5 h-5 ${m.color}`} />
                              </div>
                              <span className="text-sm font-bold text-gray-700">{m.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="bg-white shadow-lg border border-gray-100 mb-8 overflow-hidden">
                  <CardHeader className="border-b border-gray-50">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-12 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-gray-900 font-bold mb-1">No activity yet</h4>
                      <p className="text-gray-500 text-sm">Start planning your next adventure to see updates here!</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                <Card className="bg-white shadow-lg border border-gray-100">
                  <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl flex items-center"><User className="w-5 h-5 mr-2 text-blue-600" />Personal Info</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => isEditing ? handleCancel() : setIsEditing(true)}>
                      {isEditing ? <X className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.fullName || ''}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Enter your full name"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                              />
                            </div>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-gray-700">Home City</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={formData.homeCity || ''}
                                onChange={e => setFormData({ ...formData, homeCity: e.target.value })}
                                placeholder="Where's home?"
                              />
                            </div>
                          </div>
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-bold text-gray-700">Bio</label>
                            <div className="relative">
                              <Edit3 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <textarea
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[120px]"
                                value={formData.bio || ''}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3 pt-4 border-t border-gray-100">
                          <Button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold shadow-lg shadow-blue-200"
                            disabled={loading}
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Full Name</div>
                          <div className="font-bold text-gray-900">{user.fullName || formData.fullName || 'Not set'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Email Address</div>
                          <div className="font-bold text-gray-900">{user.email}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</div>
                          <div className="font-bold text-gray-900">{user.phone || formData.phone || 'Not set'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Home City</div>
                          <div className="font-bold text-gray-900">{user.homeCity || formData.homeCity || 'Not set'}</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
                          <div className="text-xs font-bold text-gray-400 uppercase mb-1">About Me</div>
                          <div className="font-medium text-gray-700 leading-relaxed">{user.bio || formData.bio || 'No bio written yet.'}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-lg border border-gray-100">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-xl flex items-center"><LinkIcon className="w-5 h-5 mr-2 text-purple-600" />Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500">Add your social media presence here.</p>
                    <div className="flex gap-4 mt-4">
                      <Instagram className="w-6 h-6 text-pink-500 cursor-pointer" />
                      <Twitter className="w-6 h-6 text-blue-400 cursor-pointer" />
                      <Linkedin className="w-6 h-6 text-blue-700 cursor-pointer" />
                      <Globe className="w-6 h-6 text-gray-600 cursor-pointer" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-8 mb-12">
                <Card className="bg-white shadow-lg border border-gray-100 overflow-hidden">
                  <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between bg-blue-50/30">
                    <CardTitle className="text-xl flex items-center"><Target className="w-5 h-5 mr-3 text-blue-600" />Travel Preferences</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => isEditing ? handleCancel() : setIsEditing(true)} className="bg-white">
                      {isEditing ? <X className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </CardHeader>
                  <CardContent className="p-8">
                    {isEditing ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 block">Typical Budget</label>
                            <div className="grid grid-cols-3 gap-3">
                              {['economy', 'moderate', 'luxury'].map(tier => (
                                <button
                                  key={tier}
                                  onClick={() => setPreferences({ ...preferences, budgetRange: tier })}
                                  className={`p-3 rounded-xl border-2 transition-all text-sm font-bold capitalize ${preferences.budgetRange === tier ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}
                                >
                                  {tier}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <label className="text-sm font-bold text-gray-700 block">Travel Pace</label>
                            <div className="grid grid-cols-3 gap-3">
                              {['relaxed', 'moderate', 'fast'].map(pace => (
                                <button
                                  key={pace}
                                  onClick={() => setPreferences({ ...preferences, travelPace: pace })}
                                  className={`p-3 rounded-xl border-2 transition-all text-sm font-bold capitalize ${preferences.travelPace === pace ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400 opacity-60'}`}
                                >
                                  {pace}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-sm font-bold text-gray-700 block text-center md:text-left">Interests (Choose your favorites)</label>
                          <div className="flex flex-wrap gap-2">
                            {interestOptions.map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  const newInterests = preferences.interests.includes(opt.id)
                                    ? preferences.interests.filter(i => i !== opt.id)
                                    : [...preferences.interests, opt.id]
                                  setPreferences({ ...preferences, interests: newInterests })
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-semibold ${preferences.interests.includes(opt.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500'}`}
                              >
                                <opt.icon className="w-4 h-4" />
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-sm font-bold text-gray-700 block">Dietary Needs</label>
                          <div className="flex flex-wrap gap-2">
                            {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'No Preferences'].map(diet => (
                              <button
                                key={diet}
                                onClick={() => {
                                  const newDiet = preferences.dietaryNeeds.includes(diet)
                                    ? preferences.dietaryNeeds.filter(d => d !== diet)
                                    : [...preferences.dietaryNeeds, diet]
                                  setPreferences({ ...preferences, dietaryNeeds: newDiet })
                                }}
                                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-bold ${preferences.dietaryNeeds.includes(diet) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                              >
                                {diet}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-6 border-t border-gray-100">
                          <Button
                            onClick={() => {
                              handleSave()
                              setIsEditing(false)
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl font-bold"
                            disabled={loading}
                          >
                            Save Preferences
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Core Preferences</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-green-600" />
                                  </div>
                                  <span className="font-bold text-gray-700">Budget Range</span>
                                </div>
                                <span className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter italic">{preferences.budgetRange}</span>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <span className="font-bold text-gray-700">Travel Pace</span>
                                </div>
                                <span className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter italic">{preferences.travelPace}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dietary Needs</h4>
                            <div className="flex flex-wrap gap-2">
                              {preferences.dietaryNeeds.length > 0 ? preferences.dietaryNeeds.map(diet => (
                                <div key={diet} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-bold border border-green-100 flex items-center">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                                  {diet}
                                </div>
                              )) : <div className="text-gray-400 italic font-medium p-4 bg-gray-50 rounded-2xl border border-gray-100 border-dashed w-full text-center">No dietary preferences set</div>}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Interests & Moods</h4>
                          <div className="flex flex-wrap gap-3">
                            {preferences.interests.length > 0 ? preferences.interests.map(id => {
                              const opt = interestOptions.find(o => o.id === id)
                              const Icon = opt?.icon || Target
                              return (
                                <div key={id} className="flex items-center space-x-2 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default">
                                  <Icon className="w-5 h-5 text-blue-500" />
                                  <span className="font-bold text-gray-700">{opt?.label || id}</span>
                                </div>
                              )
                            }) : <div className="text-gray-400 italic font-medium p-8 bg-gray-50 rounded-2xl border border-gray-100 border-dashed w-full text-center">Tap 'Edit' to add your interests!</div>}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-16">
                <Card className="bg-white shadow-lg border border-gray-100 overflow-hidden">
                  <CardHeader className="bg-blue-50/30 border-b border-gray-100">
                    <CardTitle className="text-xl flex items-center"><Shield className="w-5 h-5 mr-3 text-blue-600" />Account Security</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100 group hover:shadow-md transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Email Verification</div>
                          <div className="text-xs text-green-600 font-bold uppercase tracking-widest">Verified</div>
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${security.twoFactorEnabled
                      ? 'bg-green-50 border-green-100'
                      : 'bg-amber-50 border-amber-100'
                      }`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${security.twoFactorEnabled ? 'bg-green-100' : 'bg-amber-100'}`}>
                          <Lock className={`w-5 h-5 ${security.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">Two-Factor Auth</div>
                          <div className={`text-xs font-bold uppercase tracking-widest ${security.twoFactorEnabled ? 'text-green-600' : 'text-amber-600'}`}>
                            {security.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`font-bold rounded-xl border-2 ${security.twoFactorEnabled ? 'border-green-200 text-green-700 hover:bg-green-100' : 'border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                        onClick={() => updateSecurity({ twoFactorEnabled: !security.twoFactorEnabled })}
                      >
                        {security.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>

                    <div className="pt-4 space-y-3">
                      <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-2 font-bold text-gray-700 hover:bg-gray-50">
                        <Settings className="w-5 h-5 mr-3 text-gray-400" />
                        Advanced Security Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-2 font-bold text-gray-700 hover:bg-gray-50" onClick={() => setShowPrivacyModal(true)}>
                        <Eye className="w-5 h-5 mr-3 text-gray-400" />
                        Privacy Controls
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="bg-white shadow-lg border border-gray-100 overflow-hidden">
                    <CardHeader className="bg-purple-50/30 border-b border-gray-100">
                      <CardTitle className="text-xl flex items-center"><Zap className="w-5 h-5 mr-3 text-purple-600" />Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex-col rounded-2xl border-2 hover:bg-blue-50 border-gray-100 hover:border-blue-100 flex items-center justify-center space-y-2 group transition-all">
                          <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                          <span className="font-bold text-gray-600 group-hover:text-blue-700">Export Data</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col rounded-2xl border-2 hover:bg-purple-50 border-gray-100 hover:border-purple-100 flex items-center justify-center space-y-2 group transition-all" onClick={() => setShowNotificationsModal(true)}>
                          <Bell className="w-6 h-6 text-gray-400 group-hover:text-purple-500" />
                          <span className="font-bold text-gray-600 group-hover:text-purple-700">Alerts</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col rounded-2xl border-2 hover:bg-amber-50 border-gray-100 hover:border-amber-100 flex items-center justify-center space-y-2 group transition-all" onClick={() => navigate('/support')}>
                          <MessageCircle className="w-6 h-6 text-gray-400 group-hover:text-amber-500" />
                          <span className="font-bold text-gray-600 group-hover:text-amber-700">Support</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex-col rounded-2xl border-2 hover:bg-red-50 border-gray-100 hover:border-red-100 flex items-center justify-center space-y-2 group transition-all" onClick={logout}>
                          <LogOut className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                          <span className="font-bold text-gray-600 group-hover:text-red-700">Logout</span>
                        </Button>
                      </div>

                      <div className="mt-8 pt-8 border-t border-gray-100">
                        <Button
                          variant="ghost"
                          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold h-12 rounded-xl"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <AlertCircle className="w-5 h-5 mr-3" />
                          Permanently Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {user.tier === 'admin' && (
                    <Card className="bg-red-50 border-2 border-red-200 shadow-xl overflow-hidden">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-red-600" />
                          </div>
                          <div>
                            <div className="font-black text-red-900 uppercase tracking-tighter italic">Admin Portal</div>
                            <div className="text-sm text-red-700 font-medium">System-wide configurations</div>
                          </div>
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 rounded-xl shadow-lg shadow-red-200">
                          Enter
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />

      {/* Delete Account Modal */}
      {
        showDeleteModal && (
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
        )
      }

      {/* Privacy Settings Modal */}
      {
        showPrivacyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Profile Visibility</label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
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
                    onChange={(e) => setPrivacySettings({ ...privacySettings, hideTravel: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span>Hide Travel History</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={privacySettings.hideActivity}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, hideActivity: e.target.checked })}
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
        )
      }

      {/* Notifications Modal */}
      {
        showNotificationsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Push Notifications</span>
                  <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })} className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Trip Updates</span>
                  <input type="checkbox" checked={notifications.trips} onChange={(e) => setNotifications({ ...notifications, trips: e.target.checked })} className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Deals & Offers</span>
                  <input type="checkbox" checked={notifications.deals} onChange={(e) => setNotifications({ ...notifications, deals: e.target.checked })} className="w-5 h-5" />
                </label>
                <label className="flex items-center justify-between">
                  <span>Community Alerts</span>
                  <input type="checkbox" checked={notifications.community} onChange={(e) => setNotifications({ ...notifications, community: e.target.checked })} className="w-5 h-5" />
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
        )
      }
    </div >
  )
}
