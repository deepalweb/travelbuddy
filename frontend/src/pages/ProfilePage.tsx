import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { User, Mail, Edit3, Save, X, MapPin, Calendar, Star, Shield, UserCheck } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    placesVisited: 0,
    reviewsWritten: 0
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
          reviewsWritten: data.totalPosts || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateProfile(formData)
      setIsEditing(false)
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={user.profilePicture}
                  alt={user.username}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="primary">
                      {user.tier || 'Free'} Member
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles || [user.role || 'user']).map(role => (
                        <Badge 
                          key={role}
                          variant={role === user.activeRole ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {role === 'merchant' ? 'Business' :
                           role === 'transport_provider' ? 'Transport' :
                           role === 'travel_agent' ? 'Agent' : 'Traveler'}
                          {role === user.activeRole && ' (Active)'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{user.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <Badge variant="primary">
                  {user.tier || 'Free'}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account ID
                </label>
                <p className="text-gray-600 text-sm font-mono">
                  {user.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debug Info
                </label>
                <p className="text-gray-600 text-sm">
                  isAdmin: {String(user.isAdmin)} | role: {user.role} | email: {user.email}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Demo token: {localStorage.getItem('demo_token') ? 'Present' : 'Missing'}
                </p>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/role-selection')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Change Role
                </Button>
                
                {user.isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = '/admin'}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <MapPin className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.tripsPlanned}</div>
              <div className="text-sm text-gray-600">Trips Planned</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.placesVisited}</div>
              <div className="text-sm text-gray-600">Places Saved</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-3">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.reviewsWritten}</div>
              <div className="text-sm text-gray-600">Posts Shared</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}