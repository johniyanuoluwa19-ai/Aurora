import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Heart, MessageCircle, Share, Search } from 'lucide-react'
import './Feed.css'

interface Post {
  id: string
  content: string
  author: {
    id: string
    username: string
    avatar_url: string | null
    is_verified: boolean
  }
  likes_count: number
  comments_count: number
  created_at: string
  liked_by_user?: boolean
  media_urls?: string[]
}

export default function Feed() {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPostContent.trim() || !user) return

    setIsPosting(true)
    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('aurora-auth-store') ? JSON.parse(localStorage.getItem('aurora-auth-store')!).state.tokens?.accessToken : ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newPostContent,
          visibility: 'PUBLIC',
        }),
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts([newPost, ...posts])
        setNewPostContent('')
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsPosting(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const method = post.liked_by_user ? 'DELETE' : 'POST'
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('aurora-auth-store') ? JSON.parse(localStorage.getItem('aurora-auth-store')!).state.tokens?.accessToken : ''}`,
        },
        credentials: 'include',
      })

      if (response.ok) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              liked_by_user: !p.liked_by_user,
              likes_count: p.liked_by_user ? p.likes_count - 1 : p.likes_count + 1,
            }
          }
          return p
        }))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  return (
    <div className="aurora-feed-container">
      {/* Header */}
      <div className="feed-header">
        <h1 className="feed-title">Aurora Feed</h1>
        <div className="feed-search">
          <Search size={20} />
          <input type="text" placeholder="Search posts..." />
        </div>
      </div>

      {/* Create Post Section */}
      {isAuthenticated && user && (
        <div className="create-post-card">
          <div className="create-post-header">
            <img
              src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
              alt={user.username}
              className="avatar-small"
            />
            <div className="user-info">
              <p className="username">{user.username}</p>
              {user.is_verified && <span className="verified-badge">✓</span>}
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="create-post-form">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind? Share with Aurora..."
              className="post-input"
              maxLength={5000}
              rows={4}
            />

            <div className="create-post-footer">
              <div className="post-actions">
                <button type="button" className="action-btn">
                  📷 Photo/Video
                </button>
                <button type="button" className="action-btn">
                  😊 Mood
                </button>
                <button type="button" className="action-btn">
                  📍 Location
                </button>
              </div>
              <button
                type="submit"
                disabled={!newPostContent.trim() || isPosting}
                className="post-button"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">🌌</div>
            <h2>No posts yet</h2>
            <p>Follow users or create a post to get started!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="post-author-info">
                  <img
                    src={post.author.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + post.author.id}
                    alt={post.author.username}
                    className="avatar-medium"
                  />
                  <div className="author-meta">
                    <div className="author-name">
                      <span className="username">{post.author.username}</span>
                      {post.author.is_verified && <span className="verified-badge">✓</span>}
                    </div>
                    <span className="post-time">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button className="menu-btn">⋮</button>
              </div>

              {/* Post Content */}
              <div className="post-content">
                <p>{post.content}</p>
              </div>

              {/* Post Media */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="post-media">
                  {post.media_urls.map((url, idx) => (
                    <img key={idx} src={url} alt="Post media" />
                  ))}
                </div>
              )}

              {/* Post Stats */}
              <div className="post-stats">
                <span>{post.likes_count} likes</span>
                <span>{post.comments_count} comments</span>
              </div>

              {/* Post Actions */}
              <div className="post-actions-bar">
                <button
                  className={`action-icon-btn ${post.liked_by_user ? 'liked' : ''}`}
                  onClick={() => handleLikePost(post.id)}
                >
                  <Heart size={20} fill={post.liked_by_user ? 'currentColor' : 'none'} />
                  Like
                </button>
                <button className="action-icon-btn">
                  <MessageCircle size={20} />
                  Comment
                </button>
                <button className="action-icon-btn">
                  <Share size={20} />
                  Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}