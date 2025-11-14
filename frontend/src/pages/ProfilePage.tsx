import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { SubscriptionModal } from '../components/SubscriptionModal'
import { useUserSecurity } from '../hooks/useUserSecurity'
import { User, Mail, Edit3, Save, X, MapPin, Calendar, Star, Shield, UserCheck, Crown, Zap, Bell, LogOut, Phone, Globe, Camera, Eye, Lock, Settings, MessageCircle, Heart, FileText, TrendingUp, Users, Car, Briefcase, Award, CheckCircle, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    if (user?.id) {
      fetchUserStats()
    }
  }, [user?.id])

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('demo_token')
      const headers: Record<string, string> = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch(`/api/users/${user?.id}/stats`, { headers })
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
        
        // Update form data with extended fields from API
        setFormData({
          username: user?.username || '',
          email: user?.email || '',
          fullName: data.fullName || user?.fullName || '',
          phone: data.phone || user?.phone || '',
          bio: data.bio || user?.bio || '',
          homeCity: data.homeCity || user?.homeCity || '',
          languages: data.languages || user?.languages || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Use direct API call for extended fields
      const token = localStorage.getItem('demo_token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        setIsEditing(false)
        // Refresh stats to get updated data
        fetchUserStats()
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    })
    setIsEditing(false)
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
        { icon: TrendingUp, label: 'Deals Created', value: stats.dealsCreated, color: 'from-purple-500 to-purple-600' },
        { icon: Eye, label: 'Profile Views', value: stats.profileViews, color: 'from-blue-500 to-blue-600' },
        { icon: Star, label: 'Rating', value: '4.8', color: 'from-yellow-500 to-yellow-600' }
      ]
    }
    if (role === 'travel_agent') {
      return [
        { icon: Users, label: 'Clients Served', value: stats.ridesCompleted, color: 'from-green-500 to-green-600' },
        { icon: Award, label: 'Satisfaction', value: `${stats.clientSatisfaction}%`, color: 'from-blue-500 to-blue-600' },
        { icon: Star, label: 'Rating', value: '4.9', color: 'from-yellow-500 to-yellow-600' }
      ]
    }
    if (role === 'transport_provider') {
      return [
        { icon: Car, label: 'Rides Completed', value: stats.ridesCompleted, color: 'from-indigo-500 to-indigo-600' },
        { icon: TrendingUp, label: 'Fleet Usage', value: '85%', color: 'from-green-500 to-green-600' },
        { icon: Star, label: 'Driver Rating', value: '4.7', color: 'from-yellow-500 to-yellow-600' }
      ]
    }
    return [
      { icon: MapPin, label: 'Trips Planned', value: stats.tripsPlanned, color: 'from-blue-500 to-blue-600' },
      { icon: Heart, label: 'Places Saved', value: stats.placesVisited, color: 'from-green-500 to-green-600' },
      { icon: FileText, label: 'Posts Shared', value: stats.reviewsWritten, color: 'from-yellow-500 to-yellow-600' }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 1. Hero Header with Profile */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30 shadow-2xl">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-20 h-20 text-white" />
                )}
              </div>
              <button className="absolute bottom-3 right-3 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 group-hover:bg-blue-50">
                <Camera className="w-6 h-6" />
              </button>
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
        {/* 2. Dynamic Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {getRoleStats().map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 group">
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-semibold">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 pb-16">
          {/* 3. Personal Information (Enhanced) */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Home City</label>
                      <input
                        type="text"
                        value={formData.homeCity}
                        onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York, NY"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <p className="text-lg text-gray-900 font-medium">{user.username}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Member Since</label>
                        <p className="text-lg text-gray-900 font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl">
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
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-2xl text-gray-900 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-green-600" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-gray-900">Email Verified</p>
                        <p className="text-sm text-gray-600">Your email is confirmed</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`flex items-center justify-between p-4 rounded-xl ${
                    security.twoFactorEnabled ? 'bg-green-50' : 'bg-yellow-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      {security.twoFactorEnabled ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">2FA Setup</p>
                        <p className="text-sm text-gray-600">
                          {security.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Enhance your security'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
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
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
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
                    className="justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg h-14"
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
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings & Privacy
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
    </div>
  )
}