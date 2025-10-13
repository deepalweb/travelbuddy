import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useKV } from '@github/spark/hooks'
import { 
  Flag, 
  Check, 
  X, 
  Eye, 
  ChatCircle, 
  Heart, 
  ShareNetwork,
  Warning,
  Hash,
  TrendUp,
  UserMinus,
  Clock,
  MagnifyingGlass,
  Funnel,
  Plus,
  Trash,
  Shield,
  Robot,
  DotsThree,
  MapPin
} from '@phosphor-icons/react'

interface Post {
  id: string
  author: string
  authorAvatar: string
  content: string
  images?: string[]
  timestamp: string
  likes: number
  comments: number
  shares: number
  status: 'pending' | 'approved' | 'rejected'
  reportCount: number
  hashtags: string[]
  location?: string
}

interface Comment {
  id: string
  postId: string
  author: string
  authorAvatar: string
  content: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected'
  reportCount: number
}

interface ReportedContent {
  id: string
  type: 'post' | 'comment'
  contentId: string
  reportedBy: string
  reason: string
  description: string
  timestamp: string
  status: 'pending' | 'reviewed' | 'resolved'
}

interface ModerationRule {
  id: string
  name: string
  type: 'keyword' | 'user' | 'hashtag' | 'content_length'
  action: 'flag' | 'auto_reject' | 'require_review'
  criteria: string
  isActive: boolean
}

export default function ContentModeration() {
  const [activeTab, setActiveTab] = useState('posts')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock data - in real app this would come from API
  const [posts, setPosts] = useKV<Post[]>('moderation-posts', [
    {
      id: '1',
      author: 'Sarah Chen',
      authorAvatar: '/api/placeholder/40/40',
      content: 'Just had the most amazing experience at the Tokyo Fish Market! The sushi was incredibly fresh and the atmosphere was electric. Highly recommend visiting early morning for the best selection. #TokyoTravel #Sushi #JapanTrip',
      images: ['/api/placeholder/300/200'],
      timestamp: '2 hours ago',
      likes: 47,
      comments: 12,
      shares: 8,
      status: 'pending',
      reportCount: 0,
      hashtags: ['#TokyoTravel', '#Sushi', '#JapanTrip'],
      location: 'Tokyo, Japan'
    },
    {
      id: '2',
      author: 'Mike Rodriguez',
      authorAvatar: '/api/placeholder/40/40',
      content: 'This hotel service is absolute garbage! Worst experience ever. Staff was rude and room was dirty. Avoid at all costs!!! #NeverAgain #BadService',
      timestamp: '4 hours ago',
      likes: 3,
      comments: 15,
      shares: 2,
      status: 'pending',
      reportCount: 3,
      hashtags: ['#NeverAgain', '#BadService']
    },
    {
      id: '3',
      author: 'Emma Watson',
      authorAvatar: '/api/placeholder/40/40',
      content: 'Beautiful sunset from our Santorini hotel balcony. Greece never fails to amaze me! The local food and wine have been exceptional. Can\'t wait to explore more islands tomorrow.',
      images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
      timestamp: '6 hours ago',
      likes: 128,
      comments: 24,
      shares: 31,
      status: 'approved',
      reportCount: 0,
      hashtags: ['#Santorini', '#Greece', '#Sunset'],
      location: 'Santorini, Greece'
    }
  ])

  const [comments, setComments] = useKV<Comment[]>('moderation-comments', [
    {
      id: 'c1',
      postId: '1',
      author: 'John Doe',
      authorAvatar: '/api/placeholder/32/32',
      content: 'Thanks for the recommendation! Planning to visit next month.',
      timestamp: '1 hour ago',
      status: 'approved',
      reportCount: 0
    },
    {
      id: 'c2',
      postId: '2',
      author: 'Anonymous User',
      authorAvatar: '/api/placeholder/32/32',
      content: 'This is spam content with inappropriate links. Click here for fake offers!',
      timestamp: '3 hours ago',
      status: 'pending',
      reportCount: 2
    }
  ])

  const [reportedContent, setReportedContent] = useKV<ReportedContent[]>('reported-content', [
    {
      id: 'r1',
      type: 'post',
      contentId: '2',
      reportedBy: 'User123',
      reason: 'Inappropriate Language',
      description: 'Contains excessive profanity and aggressive language',
      timestamp: '2 hours ago',
      status: 'pending'
    },
    {
      id: 'r2',
      type: 'comment',
      contentId: 'c2',
      reportedBy: 'TravelMod',
      reason: 'Spam',
      description: 'Contains suspicious links and promotional content',
      timestamp: '1 hour ago',
      status: 'pending'
    }
  ])

  const [moderationRules, setModerationRules] = useKV<ModerationRule[]>('moderation-rules', [
    {
      id: 'rule1',
      name: 'Profanity Filter',
      type: 'keyword',
      action: 'flag',
      criteria: 'garbage, worst, terrible, awful',
      isActive: true
    },
    {
      id: 'rule2',
      name: 'Spam Detection',
      type: 'keyword',
      action: 'auto_reject',
      criteria: 'click here, free offer, limited time',
      isActive: true
    }
  ])

  const [hashtags, setHashtags] = useKV<Array<{tag: string, count: number, trending: boolean}>>('trending-hashtags', [
    { tag: '#TokyoTravel', count: 1247, trending: true },
    { tag: '#Sushi', count: 892, trending: true },
    { tag: '#Greece', count: 756, trending: false },
    { tag: '#BadService', count: 234, trending: false },
    { tag: '#Santorini', count: 567, trending: true }
  ])

  const handleApprovePost = (postId: string) => {
    setPosts(currentPosts => 
      (currentPosts || []).map(post => 
        post.id === postId ? { ...post, status: 'approved' as const } : post
      )
    )
  }

  const handleRejectPost = (postId: string) => {
    setPosts(currentPosts => 
      (currentPosts || []).map(post => 
        post.id === postId ? { ...post, status: 'rejected' as const } : post
      )
    )
  }

  const handleApproveComment = (commentId: string) => {
    setComments(currentComments => 
      (currentComments || []).map(comment => 
        comment.id === commentId ? { ...comment, status: 'approved' as const } : comment
      )
    )
  }

  const handleRejectComment = (commentId: string) => {
    setComments(currentComments => 
      (currentComments || []).map(comment => 
        comment.id === commentId ? { ...comment, status: 'rejected' as const } : comment
      )
    )
  }

  const handleResolveReport = (reportId: string) => {
    setReportedContent(currentReports => 
      (currentReports || []).map(report => 
        report.id === reportId ? { ...report, status: 'resolved' as const } : report
      )
    )
  }

  const addModerationRule = (rule: Omit<ModerationRule, 'id'>) => {
    const newRule = {
      ...rule,
      id: `rule_${Date.now()}`
    }
    setModerationRules(currentRules => [...(currentRules || []), newRule])
  }

  const toggleRule = (ruleId: string) => {
    setModerationRules(currentRules => 
      (currentRules || []).map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  const deleteRule = (ruleId: string) => {
    setModerationRules(currentRules => 
      (currentRules || []).filter(rule => rule.id !== ruleId)
    )
  }

  const filteredPosts = (posts || []).filter(post => {
    if (selectedFilter === 'pending') return post.status === 'pending'
    if (selectedFilter === 'approved') return post.status === 'approved'
    if (selectedFilter === 'rejected') return post.status === 'rejected'
    if (selectedFilter === 'reported') return post.reportCount > 0
    return true
  }).filter(post => 
    searchQuery === '' || 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredComments = (comments || []).filter(comment => {
    if (selectedFilter === 'pending') return comment.status === 'pending'
    if (selectedFilter === 'approved') return comment.status === 'approved'
    if (selectedFilter === 'rejected') return comment.status === 'rejected'
    if (selectedFilter === 'reported') return comment.reportCount > 0
    return true
  })

  const pendingReports = (reportedContent || []).filter(report => report.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
          <p className="text-muted-foreground">
            Review and manage user-generated content across the platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="destructive" className="gap-1">
            <Flag size={14} />
            {pendingReports.length} Reports
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock size={14} />
            {(posts || []).filter(p => p.status === 'pending').length + (comments || []).filter(c => c.status === 'pending').length} Pending
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="posts" className="gap-2">
            <Eye size={16} />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <ChatCircle size={16} />
            Comments
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Flag size={16} />
            Reports
            {pendingReports.length > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                {pendingReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2">
            <Hash size={16} />
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Robot size={16} />
            Auto Rules
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 p-4 bg-card rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search content, users, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter content" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="posts" className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.authorAvatar} />
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{post.author}</p>
                      <p className="text-sm text-muted-foreground">{post.timestamp}</p>
                      {post.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} />
                          {post.location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        post.status === 'approved' ? 'default' : 
                        post.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {post.status}
                    </Badge>
                    {post.reportCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <Flag size={12} />
                        {post.reportCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{post.content}</p>
                
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <div key={index} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <Eye size={24} className="text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart size={16} />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatCircle size={16} />
                    {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShareNetwork size={16} />
                    {post.shares}
                  </span>
                </div>
                
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {post.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprovePost(post.id)}
                      className="gap-1"
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectPost(post.id)}
                      className="gap-1"
                    >
                      <X size={14} />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye size={14} />
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback>{comment.author[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        comment.status === 'approved' ? 'default' : 
                        comment.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {comment.status}
                    </Badge>
                    {comment.reportCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <Flag size={12} />
                        {comment.reportCount}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-sm mb-4">{comment.content}</p>
                
                {comment.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveComment(comment.id)}
                      className="gap-1"
                    >
                      <Check size={14} />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleRejectComment(comment.id)}
                      className="gap-1"
                    >
                      <X size={14} />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {(reportedContent || []).map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Flag size={12} />
                        {report.type}
                      </Badge>
                      <span className="text-sm font-medium">{report.reason}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reported by {report.reportedBy} • {report.timestamp}
                    </p>
                  </div>
                  
                  <Badge 
                    variant={
                      report.status === 'resolved' ? 'default' : 
                      report.status === 'reviewed' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
                
                <p className="text-sm mb-4">{report.description}</p>
                
                {report.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      onClick={() => handleResolveReport(report.id)}
                      className="gap-1"
                    >
                      <Check size={14} />
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye size={14} />
                      View Content
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <UserMinus size={14} />
                      Take Action
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash size={20} />
                Hashtag Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {(hashtags || []).map((hashtag, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{hashtag.tag}</span>
                        {hashtag.trending && (
                          <Badge variant="default" className="gap-1">
                            <TrendUp size={12} />
                            Trending
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {hashtag.count} uses
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        View Posts
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1">
                        <Trash size={14} />
                        Block
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Automated Moderation Rules</h3>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Moderation Rule</DialogTitle>
                  <DialogDescription>
                    Set up automated rules to help moderate content
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input id="rule-name" placeholder="Enter rule name" />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-type">Rule Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keyword">Keyword Filter</SelectItem>
                        <SelectItem value="user">User Filter</SelectItem>
                        <SelectItem value="hashtag">Hashtag Filter</SelectItem>
                        <SelectItem value="content_length">Content Length</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-action">Action</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flag">Flag for Review</SelectItem>
                        <SelectItem value="auto_reject">Auto Reject</SelectItem>
                        <SelectItem value="require_review">Require Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-criteria">Criteria</Label>
                    <Textarea 
                      id="rule-criteria"
                      placeholder="Enter keywords, patterns, or criteria (comma separated)"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="space-y-3">
            {(moderationRules || []).map((rule) => (
              <Card key={rule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant="outline">{rule.type.replace('_', ' ')}</Badge>
                        <Badge 
                          variant={rule.action === 'auto_reject' ? 'destructive' : 'secondary'}
                        >
                          {rule.action.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Criteria: {rule.criteria}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <Label className="text-sm">Active</Label>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deleteRule(rule.id)}
                        className="gap-1"
                      >
                        <Trash size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}