import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Users,
  MagnifyingGlass,
  Funnel,
  DotsThreeOutline,
  Warning,
  CheckCircle,
  XCircle,
  Eye,
  PencilSimple,
  Key,
  Prohibit,
  CreditCard,
  ShieldCheck,
  Download,
  MapPin,
  Calendar,
  Crown,
  Star,
  User,
  Clock,
  CurrencyDollar,
  FileText,
  Lock
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface User {
  id: string
  name: string
  email: string
  tier: 'Free' | 'Premium' | 'Business'
  location: string
  status: 'Active' | 'Suspended' | 'Inactive'
  joinDate: string
  lastActive: string
  avatar?: string
  subscription?: {
    plan: string
    status: string
    nextBilling: string
    amount: number
  }
}

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  timestamp: string
  details: string
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    tier: 'Premium',
    location: 'New York, USA',
    status: 'Active',
    joinDate: '2024-01-15',
    lastActive: '2024-03-01',
    subscription: {
      plan: 'Premium Monthly',
      status: 'Active',
      nextBilling: '2024-04-01',
      amount: 29.99
    }
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    tier: 'Business',
    location: 'Tokyo, Japan',
    status: 'Active',
    joinDate: '2023-11-20',
    lastActive: '2024-02-28',
    subscription: {
      plan: 'Business Annual',
      status: 'Active',
      nextBilling: '2024-11-20',
      amount: 299.99
    }
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma.davis@email.com',
    tier: 'Free',
    location: 'London, UK',
    status: 'Active',
    joinDate: '2024-02-10',
    lastActive: '2024-03-02'
  },
  {
    id: '4',
    name: 'Carlos Rodriguez',
    email: 'carlos.rodriguez@email.com',
    tier: 'Premium',
    location: 'Barcelona, Spain',
    status: 'Suspended',
    joinDate: '2023-08-05',
    lastActive: '2024-02-20'
  },
  {
    id: '5',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    tier: 'Free',
    location: 'Mumbai, India',
    status: 'Inactive',
    joinDate: '2023-12-01',
    lastActive: '2024-01-15'
  }
]

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Sarah Johnson',
    action: 'Profile Updated',
    timestamp: '2024-03-01 14:30:00',
    details: 'Updated privacy settings - disabled location sharing'
  },
  {
    id: '2',
    userId: '2', 
    userName: 'Mike Chen',
    action: 'Data Export',
    timestamp: '2024-02-28 09:15:00',
    details: 'Exported personal data in JSON format'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Emma Davis',
    action: 'Consent Updated',
    timestamp: '2024-02-25 16:45:00',
    details: 'Accepted marketing communications consent'
  }
]

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [users, setUsers] = useKV<User[]>('admin-users', mockUsers)
  const [auditLogs, setAuditLogs] = useKV<AuditLog[]>('privacy-audit-logs', mockAuditLogs)

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = tierFilter === 'All' || user.tier === tierFilter
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter
    return matchesSearch && matchesTier && matchesStatus
  })

  const handleUserAction = (userId: string, action: string) => {
    setUsers(currentUsers => (currentUsers || []).map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'suspend':
            return { ...user, status: 'Suspended' as const }
          case 'activate':
            return { ...user, status: 'Active' as const }
          case 'resetPassword':
            // Add audit log for password reset
            const newLog: AuditLog = {
              id: Date.now().toString(),
              userId,
              userName: user.name,
              action: 'Password Reset',
              timestamp: new Date().toLocaleString(),
              details: 'Password reset initiated by admin'
            }
            setAuditLogs(logs => [...(logs || []), newLog])
            return user
          default:
            return user
        }
      }
      return user
    }))
  }

  const exportUserData = (format: 'csv' | 'json') => {
    const dataToExport = filteredUsers.map(user => ({
      name: user.name,
      email: user.email,
      tier: user.tier,
      location: user.location,
      status: user.status,
      joinDate: user.joinDate,
      lastActive: user.lastActive
    }))

    if (format === 'json') {
      const jsonString = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const csvHeaders = 'Name,Email,Tier,Location,Status,Join Date,Last Active\n'
      const csvRows = dataToExport.map(user => 
        `"${user.name}","${user.email}","${user.tier}","${user.location}","${user.status}","${user.joinDate}","${user.lastActive}"`
      ).join('\n')
      const csvString = csvHeaders + csvRows
      const blob = new Blob([csvString], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Business': return <Crown size={16} className="text-yellow-600" />
      case 'Premium': return <Star size={16} className="text-purple-600" />
      default: return <User size={16} className="text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Active</Badge>
      case 'Suspended':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle size={12} className="mr-1" />Suspended</Badge>
      case 'Inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock size={12} className="mr-1" />Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Full control over registered travelers and their accounts
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download size={16} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportUserData('csv')}>
                <FileText size={16} className="mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportUserData('json')}>
                <FileText size={16} className="mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>Add User</Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User List</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="audit">Privacy & Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Users Overview ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users by name or email..." 
                    className="pl-10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Tiers</SelectItem>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <User size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.name}</h4>
                          {getTierIcon(user.tier)}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin size={12} />
                            {user.location}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            Joined {user.joinDate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(user.status)}
                      <Badge variant="outline" className="gap-1">
                        {getTierIcon(user.tier)}
                        {user.tier}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <DotsThreeOutline size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user)
                            setIsProfileDialogOpen(true)
                          }}>
                            <Eye size={16} className="mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PencilSimple size={16} className="mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'resetPassword')}>
                            <Key size={16} className="mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          {user.status === 'Active' ? (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                              <Prohibit size={16} className="mr-2" />
                              Suspend Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                              <CheckCircle size={16} className="mr-2" />
                              Activate Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Subscription Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || []).filter(user => user.subscription).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.subscription?.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.subscription?.status === 'Active' ? 'secondary' : 'destructive'}>
                          {user.subscription?.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.subscription?.nextBilling}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CurrencyDollar size={14} />
                          {user.subscription?.amount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <DotsThreeOutline size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Upgrade Plan</DropdownMenuItem>
                            <DropdownMenuItem>Downgrade Plan</DropdownMenuItem>
                            <DropdownMenuItem>View Billing History</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Cancel Subscription</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={20} />
                Privacy & Consent Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(auditLogs || []).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-sm text-muted-foreground">ID: {log.userId}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedUser.status)}
                    <Badge variant="outline" className="gap-1">
                      {getTierIcon(selectedUser.tier)}
                      {selectedUser.tier}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <p className="text-sm">{selectedUser.location}</p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="text-sm">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <Label>Last Active</Label>
                  <p className="text-sm">{selectedUser.lastActive}</p>
                </div>
                <div>
                  <Label>Account Status</Label>
                  <p className="text-sm">{selectedUser.status}</p>
                </div>
              </div>

              {selectedUser.subscription && (
                <div className="space-y-2">
                  <Label>Subscription Details</Label>
                  <div className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Plan</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.subscription.plan}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.subscription.status}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Next Billing</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.subscription.nextBilling}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-muted-foreground">${selectedUser.subscription.amount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button>Edit Profile</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}