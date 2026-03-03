-- Create comments table with hierarchical structure
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
    path TEXT NOT NULL DEFAULT '',
    depth INTEGER DEFAULT 0 CHECK (depth >= 0),
    like_count INTEGER DEFAULT 0 CHECK (like_count >= 0),
    reply_count INTEGER DEFAULT 0 CHECK (reply_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_user ON comments(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_path ON comments USING btree(path text_pattern_ops) WHERE deleted_at IS NULL;

-- Trigger
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update post comment count
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts 
        SET comment_count = comment_count + 1
        WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_post_comment_count();

-- Comments
COMMENT ON TABLE comments IS 'Hierarchical comments on posts';
COMMENT ON COLUMN comments.path IS 'Materialized path for efficient tree queries';
COMMENT ON COLUMN comments.depth IS 'Comment nesting level (0 = root)';