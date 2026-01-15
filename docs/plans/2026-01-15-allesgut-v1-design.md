# AllesGut v1 (MVP) Product Design

## Product Overview

**AllesGut** — A community platform for parents of children with special needs (autism, visual impairment, hearing impairment, developmental delays).

**Mission**: Connect parents through shared experiences and expert knowledge.

**Target Platform**: Android only (React + Capacitor)

### Phased Launch Strategy

| Phase | Focus | Features |
|-------|-------|----------|
| **v1 (MVP)** | Community | Expert content, user posts, engagement, follows |
| **v2** | Commerce | Affiliate mall, orders, cashback, public welfare fund |
| **v3** | Connection | Private messaging |

### Revenue Model (v2+)

- 10% affiliate commission from Taobao Union, JD Union, etc.
- Split: 3% cashback to buyer, 2% to public welfare fund, 5% profit

### User Model

- **Single user type**: Parents/Caregivers
- **Platform account**: Operator posts expert content as a regular-looking user account
- **Authentication**: Phone number + SMS verification code

---

## v1 MVP Features

### User-Facing Features

#### Authentication
- Phone number + SMS verification code
- Login persists until explicit logout
- Profile setup: nickname, avatar, bio (optional)

#### Home Feed
- Waterfall layout showing posts
- Two tabs: "Recommended" (algorithm-based) / "Following" (posts from followed users)
- Pull-to-refresh, infinite scroll
- Search bar: search posts by title/content
- Tag filter: tap tags to filter (感统训练, 自闭症, 视障, etc.)

#### Post Detail
- Full content view with image carousel or video player
- Author info with follow button
- Like button, favorite/collect button
- Comments section with:
  - Threaded replies
  - @ mentions (triggers notification)
  - Like on individual comments
  - Newest/hottest sort

#### Publishing
- Create post: title, content, images (multiple), OR video (1 file, max 3 min)
- Tag selection (multiple tags)
- AI moderation check before publishing — flagged content held for review
- Edit/delete own posts

#### Profile
- User info: avatar, nickname, bio, follower/following counts
- Tabs: "My Posts" / "My Favorites"
- Edit profile
- Settings: notification preferences, logout

#### Notifications
- New comment on your post
- Reply to your comment
- New follower
- @ mention
- New post from someone you follow

#### Content Moderation
- AI-assisted filtering before publishing (text + image + video)
- Flagged content held for manual review
- Users can report posts/comments

### Admin Panel Features (Web)

#### Dashboard
- Key metrics: total users, DAU, new registrations
- Content stats: total posts, posts today, pending moderation
- Engagement stats: likes, comments, follows today
- Simple charts: user growth, post activity over time

#### User Management
- List all users with search/filter
- View user profile details and activity
- Ban/unban users
- View user's posts and comments

#### Content Moderation
- Queue of AI-flagged posts awaiting review
- Approve or reject flagged content
- Report queue: user-reported posts/comments
- Actions: approve, remove, warn user, ban user

#### Platform Content Publishing
- Create/edit posts as the "platform account"
- Schedule posts for future publishing
- Mark posts as "featured" (appear at top of feed)
- Manage tags/categories (add, rename, reorder, hide)

#### Post Management
- Browse all posts with filters
- Remove any post that violates guidelines
- Feature/unfeature posts

---

## Backend Specification

### Architecture

RESTful API backend serving the Android app. Separate admin panel (web-based).

### Aliyun Infrastructure

| Component | Aliyun Service | Purpose |
|-----------|----------------|---------|
| Application Server | ECS | Host backend application |
| Relational Database | RDS (MySQL 8.0) | Core data storage |
| Cache | Redis (Tair) | Sessions, feed caching, rate limiting |
| Object Storage | OSS | Images, videos, static assets |
| Video Processing | MPS | Video transcoding, thumbnails |
| SMS | Aliyun SMS | Phone verification codes |
| Content Moderation | Green (内容安全) | AI text/image/video moderation |
| CDN | Aliyun CDN | Accelerate OSS content delivery |
| Push Notification | JPush or Umeng | Push to Android devices |

### Database Schema (MySQL)

#### Core Tables
```sql
-- Users
users (id, phone, nickname, avatar_url, bio, status, created_at, updated_at)
user_follows (follower_id, following_id, created_at)
user_blocks (blocker_id, blocked_id, created_at)

-- Content
posts (id, user_id, title, content, media_type, status, featured, created_at, updated_at)
post_media (id, post_id, media_url, media_type, sort_order)
post_tags (post_id, tag_id)
tags (id, name, sort_order, is_active)

-- Engagement
likes (user_id, post_id, created_at)
favorites (user_id, post_id, created_at)
comments (id, post_id, user_id, parent_id, content, status, created_at)
comment_likes (user_id, comment_id, created_at)
mentions (comment_id, mentioned_user_id)

-- Notifications
notifications (id, user_id, type, payload, is_read, created_at)

-- Moderation
moderation_queue (id, content_type, content_id, reason, status, reviewed_by, reviewed_at)
reports (id, reporter_id, content_type, content_id, reason, status, created_at)
```

### API Design

**Base URL**: `https://api.allesgut.com/v1`

**Authentication**: Bearer token in header (`Authorization: Bearer <token>`)

#### Auth APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/sms/send` | Send SMS verification code |
| POST | `/auth/sms/verify` | Verify code, return token + user |
| POST | `/auth/logout` | Invalidate token |
| GET | `/auth/me` | Get current user info |

#### User APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id` | Get user profile |
| PUT | `/users/me` | Update my profile |
| POST | `/users/:id/follow` | Follow a user |
| DELETE | `/users/:id/follow` | Unfollow a user |
| GET | `/users/:id/followers` | List user's followers |
| GET | `/users/:id/following` | List who user follows |
| POST | `/users/:id/block` | Block a user |
| DELETE | `/users/:id/block` | Unblock a user |
| GET | `/users/search` | Search users by nickname |

#### Post APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List posts (query: feed_type, tag, search, page) |
| GET | `/posts/:id` | Get post detail |
| POST | `/posts` | Create post |
| PUT | `/posts/:id` | Update my post |
| DELETE | `/posts/:id` | Delete my post |
| GET | `/users/:id/posts` | Get user's posts |
| GET | `/users/me/favorites` | Get my favorited posts |
| GET | `/tags` | List all active tags |

#### Engagement APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:id/like` | Like a post |
| DELETE | `/posts/:id/like` | Unlike a post |
| POST | `/posts/:id/favorite` | Favorite a post |
| DELETE | `/posts/:id/favorite` | Unfavorite a post |
| GET | `/posts/:id/comments` | List comments (threaded) |
| POST | `/posts/:id/comments` | Add comment |
| DELETE | `/comments/:id` | Delete my comment |
| POST | `/comments/:id/like` | Like a comment |
| DELETE | `/comments/:id/like` | Unlike a comment |

#### Notification APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List my notifications |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| GET | `/notifications/unread-count` | Get unread count |

#### Media Upload APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload image, return URL |
| POST | `/upload/video` | Upload video, return URL |
| GET | `/upload/video/:id/status` | Check video processing status |

---

## Frontend Changes Required

The current frontend needs these updates to integrate with real APIs:

| Feature | Current State | Required Work |
|---------|---------------|---------------|
| Auth | None | Add login/register flow, token storage |
| Fetch posts | Has API call with fallback | Update URL, add auth header, add feed_type |
| Post detail | Prop-based | Add direct URL access with API call |
| Like/Favorite | Local state | Add API calls |
| Follow | Local state | Add API calls |
| Comments | Mock data | Add API integration |
| Publish | Simulated | Add real upload + create post |
| Profile | Mock data | Add API integration |
| Search | Client-side | Use server-side search |
| Tags | Hardcoded | Fetch from API |
| Notifications | None | Add notification system |

### API Configuration
- Change from `https://api.specialcare.com` to `https://api.allesgut.com/v1`
- Add authentication token management
- Add proper error handling

---

## Technical Decisions

- **Offline support**: Online-only (no offline caching)
- **Video**: Max 3 minutes, transcoded on server
- **Moderation**: AI-assisted (Aliyun Green) before publishing
- **Notifications**: Social level (comments, replies, follows, mentions, new posts from followed)

---

## Out of Scope for v1

- Private messaging (v3)
- Mall / Products (v2)
- Orders / Cashback (v2)
- Public welfare fund page (v2)
- iOS / Web platforms
- Offline support
