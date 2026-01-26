-- Set default values for null counts in existing users
UPDATE users
SET posts_count = 0
WHERE posts_count IS NULL;

UPDATE users
SET followers_count = 0
WHERE followers_count IS NULL;

UPDATE users
SET following_count = 0
WHERE following_count IS NULL;

-- Set default values for null counts in existing posts
UPDATE posts
SET likes_count = 0
WHERE likes_count IS NULL;

UPDATE posts
SET comments_count = 0
WHERE comments_count IS NULL;

UPDATE posts
SET favorites_count = 0
WHERE favorites_count IS NULL;

-- Set default values for null counts in existing comments
UPDATE comments
SET likes_count = 0
WHERE likes_count IS NULL;

-- Add NOT NULL constraints to ensure future records don't have nulls
ALTER TABLE users ALTER COLUMN posts_count SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN posts_count SET NOT NULL;

ALTER TABLE users ALTER COLUMN followers_count SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN followers_count SET NOT NULL;

ALTER TABLE users ALTER COLUMN following_count SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN following_count SET NOT NULL;

ALTER TABLE posts ALTER COLUMN likes_count SET DEFAULT 0;
ALTER TABLE posts ALTER COLUMN likes_count SET NOT NULL;

ALTER TABLE posts ALTER COLUMN comments_count SET DEFAULT 0;
ALTER TABLE posts ALTER COLUMN comments_count SET NOT NULL;

ALTER TABLE posts ALTER COLUMN favorites_count SET DEFAULT 0;
ALTER TABLE posts ALTER COLUMN favorites_count SET NOT NULL;

ALTER TABLE comments ALTER COLUMN likes_count SET DEFAULT 0;
ALTER TABLE comments ALTER COLUMN likes_count SET NOT NULL;
