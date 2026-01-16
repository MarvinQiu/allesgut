-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(11) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    posts_count INTEGER DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);

-- SMS verification codes
CREATE TABLE sms_verification_codes (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_phone ON sms_verification_codes(phone);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
