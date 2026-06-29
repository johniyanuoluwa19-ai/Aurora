import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Settings, Home, Bell, Mail, Bookmark, User } from 'lucide-react'
import Feed from './Feed'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="aurora-dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🌌</div>
          <h1>Aurora</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Home size={20} />
            <span>Home Feed</span>
          </button>
          <button className="nav-item">
            <Bell size={20} />
            <span>Notifications</span>
          </button>
          <button className="nav-item">
            <Mail size={20} />
            <span>Messages</span>
          </button>
          <button className="nav-item">
            <Bookmark size={20} />
            <span>Saved</span>
          </button>
          <button className="nav-item">
            <User size={20} />
            <span>Profile</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-card">
            <img
              src={user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id}
              alt={user.username}
              className="user-avatar"
            />
            <div className="user-details">
              <p className="user-name">{user.username}</p>
              {user.is_verified && <span className="verified">✓ Verified</span>}
            </div>
            <button className="settings-btn" title="Settings">
              <Settings size={18} />
            </button>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeTab === 'feed' && <Feed />}
      </main>

      <aside className="trending-sidebar">
        <div className="trending-container">
          <h3>Trending Now</h3>
          <div className="trending-items">
            <div className="trending-item">
              <span className="trend-rank">#1</span>
              <div className="trend-info">
                <p className="trend-tag">#Aurora</p>
                <p className="trend-count">125K posts</p>
              </div>
            </div>
            <div className="trending-item">
              <span className="trend-rank">#2</span>
              <div className="trend-info">
                <p className="trend-tag">#Creators</p>
                <p className="trend-count">89K posts</p>
              </div>
            </div>
            <div className="trending-item">
              <span className="trend-rank">#3</span>
              <div className="trend-info">
                <p className="trend-tag">#Talent</p>
                <p className="trend-count">56K posts</p>
              </div>
            </div>
            <div className="trending-item">
              <span className="trend-rank">#4</span>
              <div className="trend-info">
                <p className="trend-tag">#Music</p>
                <p className="trend-count">42K posts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="suggested-container">
          <h3>Suggested for You</h3>
          <div className="suggested-users">
            <div className="suggested-user">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user1"
                alt="User"
              />
              <div>
                <p className="sugg-username">aurora_creator</p>
                <p className="sugg-bio">Creator • Verified</p>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
            <div className="suggested-user">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user2"
                alt="User"
              />
              <div>
                <p className="sugg-username">music_hub</p>
                <p className="sugg-bio">Music • 50K followers</p>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
            <div className="suggested-user">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user3"
                alt="User"
              />
              <div>
                <p className="sugg-username">talent_scout</p>
                <p className="sugg-bio">Talent • 30K followers</p>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}