import { query } from '../config/database';
import logger from '../utils/logger';

async function initializeFeedTables() {
  try {
    logger.info('Initializing feed database tables...');

    // Create posts table
    await query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_urls TEXT[],
        media_types TEXT[],
        visibility VARCHAR(20) DEFAULT 'PUBLIC',
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create likes table
    await query(`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      )
    `);

    // Create comments table
    await query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create shares table
    await query(`
      CREATE TABLE IF NOT EXISTS shares (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        shared_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      )
    `);

    // Create bookmarks table
    await query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        bookmarked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      )
    `);

    // Create follows table
    await query(`
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY,
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      )
    `);

    // Create indexes for performance
    await query('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)');
    await query('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id)');

    logger.info('✅ Feed tables initialized successfully');
  } catch (error) {
    logger.error('❌ Feed tables initialization error:', error);
    process.exit(1);
  }
}

initializeFeedTables();