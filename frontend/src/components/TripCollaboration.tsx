import React, { useState, useEffect } from 'react'
import { Users, Share2, UserPlus, Crown, Eye } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'offline'
  lastSeen?: string
}

interface TripCollaborationProps {
  tripId: string
  collaborators: Collaborator[]
  currentUserId: string
  onInviteUser: (email: string, role: 'editor' | 'viewer') => void
  onUpdateRole: (userId: string, role: 'editor' | 'viewer') => void
  onRemoveUser: (userId: string) => void
}

export const TripCollaboration: React.FC<TripCollaborationProps> = ({
  tripId,
  collaborators,
  currentUserId,
  onInviteUser,
  onUpdateRole,
  onRemoveUser
}) => {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer')
  const [shareLink, setShareLink] = useState('')

  useEffect(() => {
    // Generate shareable link
    setShareLink(`${window.location.origin}/trips/${tripId}?shared=true`)
  }, [tripId])

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      onInviteUser(inviteEmail, inviteRole)
      setInviteEmail('')
      setShowInvite(false)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    // Could add toast notification here
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'editor': return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />
      default: return null
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const currentUser = collaborators.find(c => c.id === currentUserId)
  const isOwner = currentUser?.role === 'owner'
  const canEdit = currentUser?.role === 'owner' || currentUser?.role === 'editor'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {collaborators.length}
          </span>
        </div>
        
        {isOwner && (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="flex items-center"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button
              size="sm"
              onClick={() => setShowInvite(true)}
              className="flex items-center"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite
            </Button>
          </div>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium mb-4">Invite Collaborator</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Viewer - Can view trip details</option>
                  <option value="editor">Editor - Can edit trip plans</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleInvite} size="sm">
                  Send Invite
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInvite(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collaborators List */}
      <div className="space-y-3">
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {collaborator.avatar ? (
                    <img
                      src={collaborator.avatar}
                      alt={collaborator.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium">
                      {collaborator.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    collaborator.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{collaborator.name}</span>
                  {collaborator.id === currentUserId && (
                    <span className="text-xs text-blue-600">(You)</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{collaborator.email}</span>
                  {collaborator.status === 'offline' && collaborator.lastSeen && (
                    <span className="text-xs text-gray-400">
                      Last seen {collaborator.lastSeen}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(collaborator.role)}`}>
                {getRoleIcon(collaborator.role)}
                <span className="capitalize">{collaborator.role}</span>
              </div>
              
              {isOwner && collaborator.id !== currentUserId && (
                <div className="flex space-x-1">
                  <select
                    value={collaborator.role}
                    onChange={(e) => onUpdateRole(collaborator.id, e.target.value as 'editor' | 'viewer')}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveUser(collaborator.id)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Permission Levels</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div className="flex items-center space-x-2">
            <Crown className="w-3 h-3" />
            <span>Owner - Full control over trip and collaborators</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserPlus className="w-3 h-3" />
            <span>Editor - Can modify trip plans and activities</span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-3 h-3" />
            <span>Viewer - Can view trip details only</span>
          </div>
        </div>
      </div>
    </div>
  )
}
