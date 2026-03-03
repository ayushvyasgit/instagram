-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
    CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id),
    CONSTRAINT like_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_likes_user ON likes(user_id, created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_likes_comment ON likes(comment_id) WHERE comment_id IS NOT NULL;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts 
            SET like_count = like_count + 1
            WHERE id = NEW.post_id;
        ELSIF NEW.comment_id IS NOT NULL THEN
            UPDATE comments 
            SET like_count = like_count + 1
            WHERE id = NEW.comment_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts 
            SET like_count = GREATEST(like_count - 1, 0)
            WHERE id = OLD.post_id;
        ELSIF OLD.comment_id IS NOT NULL THEN
            UPDATE comments 
            SET like_count = GREATEST(like_count - 1, 0)
            WHERE id = OLD.comment_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_like_count_trigger
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_count();

-- Comments
COMMENT ON TABLE likes IS 'Likes on posts and comments';
COMMENT ON CONSTRAINT like_target ON likes IS 'Must like either a post or comment, not both';