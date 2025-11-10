import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users,
  MagnifyingGlass,
  Funnel,
  DotsThreeOutline,
  UserCheck,
  Warning,
  Eye,
  Trash,
  Crown
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'

interface User {
  _id: string
  username: string
  email: string
  tier: string
  subscriptionStatus: string
  role: string
  roles?: string[]
  isAdmin: boolean
  createdAt: string
  profileType?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await apiService.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await apiService.deleteUser(userId)
      setUsers(users.filter(u => u._id !== userId))
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handleUpdateUserTier = async (userId: string, tier: string) => {
    try {
      await apiService.updateUser(userId, { tier })
      setUsers(users.map(u => u._id === userId ? { ...u, tier } : u))
    } catch (error) {
      console.error('Failed to update user tier:', error)
    }
  }

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await apiService.updateUserRole(userId, role, 'Admin role assignment')
      setUsers(users.map(u => u._id === userId ? { ...u, role } : u))
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const handleUpdateUserRoles = async (userId: string, roles: string[]) => {
    try {
      await apiService.updateUser(userId, { roles })
      setUsers(users.map(u => u._id === userId ? { ...u, roles } : u))
    } catch (error) {
      console.error('Failed to update user roles:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = filterTier === 'all' || user.tier === filterTier
    return matchesSearch && matchesTier
  })

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-amber-500'
      case 'premium': return 'bg-purple-500'
      case 'basic': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trial': return 'bg-yellow-500'
      case 'expired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500'
      case 'agent': return 'bg-blue-500'
      case 'merchant': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'regular': return 'Normal User'
      case 'merchant': return 'Merchant'
      case 'agent': return 'Travel Agent'
      case 'admin': return 'Admin'
      default: return 'Normal User'
    }
  }

  const getUserRoles = (user: User) => {
    return user.roles && user.roles.length > 0 ? user.roles : [user.role || 'regular']
  }

  const toggleUserRole = (userId: string, role: string, currentRoles: string[]) => {
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]
    
    if (newRoles.length === 0) {
      newRoles.push('regular') // Always have at least one role
    }
    
    handleUpdateUserRoles(userId, newRoles)
    if (selectedUser && selectedUser._id === userId) {
      setSelectedUser({...selectedUser, roles: newRoles})
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground">
          Manage user accounts, subscriptions, and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Crown size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscriptionStatus === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
            <UserCheck size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.subscriptionStatus === 'trial').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Merchants</CardTitle>
            <Warning size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'merchant').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-48">
                <Funnel size={16} className="mr-2" />
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {user.username}
                        {user.isAdmin && <Crown size={14} className="text-amber-500" />}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getTierBadgeColor(user.tier)} text-white`}>
                      {user.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeColor(user.subscriptionStatus)} text-white`}>
                      {user.subscriptionStatus || 'none'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getUserRoles(user).map((role) => (
                        <Badge key={role} className={`${getRoleBadgeColor(role)} text-white text-xs`}>
                          {getRoleDisplayName(role)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye size={14} />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Username</label>
                                <p>{selectedUser.username}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Email</label>
                                <p>{selectedUser.email}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Subscription Tier</label>
                                <Select 
                                  value={selectedUser.tier} 
                                  onValueChange={(tier) => {
                                    handleUpdateUserTier(selectedUser._id, tier)
                                    setSelectedUser({...selectedUser, tier})
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-3 block">User Roles (Multiple Selection)</label>
                                <div className="space-y-3">
                                  {[
                                    { value: 'regular', label: 'Normal User' },
                                    { value: 'merchant', label: 'Merchant' },
                                    { value: 'agent', label: 'Travel Agent' },
                                    { value: 'admin', label: 'Admin' }
                                  ].map((roleOption) => {
                                    const currentRoles = getUserRoles(selectedUser)
                                    const isChecked = currentRoles.includes(roleOption.value)
                                    
                                    return (
                                      <div key={roleOption.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={roleOption.value}
                                          checked={isChecked}
                                          onCheckedChange={() => 
                                            toggleUserRole(selectedUser._id, roleOption.value, currentRoles)
                                          }
                                        />
                                        <label 
                                          htmlFor={roleOption.value} 
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          {roleOption.label}
                                        </label>
                                        <Badge 
                                          className={`${getRoleBadgeColor(roleOption.value)} text-white text-xs ml-2`}
                                        >
                                          {roleOption.label}
                                        </Badge>
                                      </div>
                                    )
                                  })}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Users can have multiple roles. At least one role must be selected.
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}