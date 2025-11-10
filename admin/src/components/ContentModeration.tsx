import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Warning,
  ChatCircle,
  Heart,
  Trash
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'

interface Post {
  _id: string
  content: {
    text: string
    images?: string[]
  }
  author: {
    name: string
    avatar?: string
  }
  engagement: {
    likes: number
    comments: number
  }
  moderationStatus: string
  requiresReview: boolean
  createdAt: string
}

interface Report {
  _id: string
  postId: string
  reason: string
  description: string
  reporterUsername: string
  status: string
  createdAt: string
}

export default function ContentModeration() {
  const [posts, setPosts] = useState<Post[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPosts: 0,
    flaggedPosts: 0,
    pendingReports: 0,
    rejectedPosts: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [postsData, reportsData, statsData] = await Promise.all([
        apiService.getPosts(),
        apiService.getPendingReports(),
        apiService.getModerationStats()
      ])
      
      setPosts(postsData)
      setReports(reportsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModeratePost = async (postId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      await apiService.moderatePost(postId, action)
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              moderationStatus: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending',
              requiresReview: action === 'flag'
            }
          : post
      ))
    } catch (error) {
      console.error('Failed to moderate post:', error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await apiService.deletePost(postId)
      setPosts(posts.filter(p => p._id !== postId))
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-muted-foreground">Loading moderation data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
        <p className="text-muted-foreground">
          Review and moderate community content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <ChatCircle size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts || posts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Posts</CardTitle>
            <Flag size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedPosts || posts.filter(p => p.requiresReview).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Warning size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports || reports.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Posts</CardTitle>
            <XCircle size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedPosts || posts.filter(p => p.moderationStatus === 'rejected').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>{report.reporterUsername}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.reason}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{report.description}</TableCell>
                    <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleModeratePost(report.postId, 'approve')}
                        >
                          <CheckCircle size={14} className="text-green-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleModeratePost(report.postId, 'reject')}
                        >
                          <XCircle size={14} className="text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Posts for Review */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.slice(0, 20).map((post) => (
                <TableRow key={post._id}>
                  <TableCell>
                    <div className="font-medium">{post.author?.name || 'Anonymous'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="truncate">{post.content?.text}</p>
                      {post.content?.images && post.content.images.length > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          {post.content.images.length} image(s)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart size={14} />
                        {post.engagement?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChatCircle size={14} />
                        {post.engagement?.comments || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeColor(post.moderationStatus)} text-white`}>
                      {post.moderationStatus || 'approved'}
                    </Badge>
                    {post.requiresReview && (
                      <Badge variant="destructive" className="ml-2">
                        Needs Review
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleModeratePost(post._id, 'approve')}
                      >
                        <CheckCircle size={14} className="text-green-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleModeratePost(post._id, 'reject')}
                      >
                        <XCircle size={14} className="text-red-600" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeletePost(post._id)}
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