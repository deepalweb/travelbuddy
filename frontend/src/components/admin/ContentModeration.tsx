import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { Button } from '../Button'
import { Badge } from '../Badge'
import { Flag, Eye, CheckCircle, XCircle, MessageCircle, Heart, Trash } from 'lucide-react'

interface Post {
  _id: string
  content: {
    text: string
    images?: string[]
  }
  author: {
    name: string
  }
  engagement: {
    likes: number
    comments: number
  }
  moderationStatus: string
  requiresReview: boolean
  createdAt: string
}

export default function ContentModeration() {
  const [posts, setPosts] = useState<Post[]>([])
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
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        const postsData = Array.isArray(data) ? data : data.posts || []
        setPosts(postsData)
        setStats({
          totalPosts: postsData.length,
          flaggedPosts: postsData.filter((p: Post) => p.requiresReview).length,
          pendingReports: 0,
          rejectedPosts: postsData.filter((p: Post) => p.moderationStatus === 'rejected').length
        })
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModeratePost = async (postId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      await fetch(`/api/admin/moderate/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
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
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
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
    return <div className="text-center py-8">Loading moderation data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Content Moderation</h2>
        <p className="text-gray-600">Review and moderate community content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <MessageCircle size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Posts</CardTitle>
            <Flag size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedPosts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <Eye size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReports}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Posts</CardTitle>
            <XCircle size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedPosts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Author</th>
                  <th className="text-left py-3 px-4">Content</th>
                  <th className="text-left py-3 px-4">Engagement</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 20).map((post) => (
                  <tr key={post._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{post.author?.name || 'Anonymous'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <p className="truncate">{post.content?.text}</p>
                        {post.content?.images && post.content.images.length > 0 && (
                          <Badge variant="secondary" className="mt-1">
                            {post.content.images.length} image(s)
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Heart size={14} />
                          {post.engagement?.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          {post.engagement?.comments || 0}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusBadgeColor(post.moderationStatus)} text-white`}>
                        {post.moderationStatus || 'approved'}
                      </Badge>
                      {post.requiresReview && (
                        <Badge variant="destructive" className="ml-2">
                          Needs Review
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
