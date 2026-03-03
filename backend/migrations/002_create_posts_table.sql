-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT,
    media_urls TEXT[] NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'carousel')),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
    view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_posts_user ON posts(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_created ON posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_likes ON posts(like_count DESC) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE posts IS 'User posts with media (images/videos)';
COMMENT ON COLUMN posts.media_urls IS 'Array of MinIO URLs';
COMMENT ON COLUMN posts.media_type IS 'Type: image, video, or carousel';