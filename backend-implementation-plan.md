# Backend Implementation Plan for AllesGut (特需儿童家长社区)

## Tech Stack
- **Backend**: Java + Spring Boot
- **Database**: PostgreSQL
- **File Storage**: Aliyun OSS
- **SMS**: Mock SMS verification

---

## 1. LOGIN PAGE - Authentication System

### Step 1.1: Database Schema
Create `users` table:
```sql
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
```

Create `sms_verification_codes` table:
```sql
CREATE TABLE sms_verification_codes (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sms_phone ON sms_verification_codes(phone);
```

Create `user_sessions` table:
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
```

### Step 1.2: SMS Service (Mock Implementation)
**Controller**: `AuthController.java`
- `POST /api/auth/sms/send`
  - Input: `{ phone: string }`
  - Validate phone format (Chinese mobile: ^1[3-9]\d{9}$)
  - Generate random 6-digit code
  - Store code in `sms_verification_codes` table with 5-minute expiration
  - Mock SMS send (just log the code, don't actually send)
  - Return: `{ success: true, message: "验证码已发送" }`

### Step 1.3: SMS Verification & Login
**Controller**: `AuthController.java`
- `POST /api/auth/sms/verify`
  - Input: `{ phone: string, code: string }`
  - Verify code against database (check not expired and not used)
  - Mark code as used
  - Check if user exists by phone:
    - If exists: retrieve user
    - If not: create new user with default nickname (e.g., "用户" + random number)
  - Generate JWT token (or UUID session token)
  - Store session in `user_sessions` table with 30-day expiration
  - Return: `{ success: true, data: { token: string, user: UserDTO } }`

### Step 1.4: Session Management
**Controller**: `AuthController.java`
- `GET /api/auth/me`
  - Requires authentication (JWT token in Authorization header)
  - Return current user info: `{ success: true, data: UserDTO }`

- `POST /api/auth/logout`
  - Requires authentication
  - Delete session from `user_sessions` table
  - Return: `{ success: true }`

### Step 1.5: Authentication Middleware
Create `JwtAuthenticationFilter` to:
- Extract token from Authorization header
- Validate token
- Load user from database
- Set SecurityContext for subsequent requests

---

## 2. HOME PAGE - Posts Feed System

### Step 2.1: Database Schema
Create `posts` table:
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    media_type VARCHAR(20),
    media_urls JSONB,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
```

Create `tags` table:
```sql
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);
```

Create `post_tags` table (many-to-many):
```sql
CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);
```

Create `post_likes` table:
```sql
CREATE TABLE post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
```

Create `post_favorites` table:
```sql
CREATE TABLE post_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_post_favorites_user ON post_favorites(user_id);
CREATE INDEX idx_post_favorites_post ON post_favorites(post_id);
```

Create `user_follows` table:
```sql
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
```

### Step 2.2: Posts Feed API
**Controller**: `PostsController.java`
- `GET /api/posts`
  - Query params:
    - `feed_type` (required): 'recommended' | 'following'
    - `page` (default: 1)
    - `limit` (default: 20, max: 100)
    - `tag` (optional): filter by tag name
    - `search` (optional): search in title/content
  - Logic:
    - If `feed_type=recommended`: fetch all posts ordered by created_at DESC
    - If `feed_type=following`: fetch posts from users the current user follows
    - Apply tag filter if provided (join with post_tags)
    - Apply search filter if provided (ILIKE on title/content)
    - Include author info, tags, like/favorite status for current user
    - Paginate results
  - Return: `{ success: true, data: { posts: PostDTO[], total: number, page: number } }`

### Step 2.3: Tags API
**Controller**: `TagsController.java`
- `GET /api/tags`
  - Return all tags ordered by usage_count DESC
  - Return: `{ success: true, data: [{ id, name, usage_count }] }`

### Step 2.4: Post Details API
**Controller**: `PostsController.java`
- `GET /api/posts/:id`
  - Fetch single post with all details
  - Include author info, tags, like/favorite status
  - Return: `{ success: true, data: PostDTO }`

### Step 2.5: Like/Unlike Post
**Controller**: `PostsController.java`
- `POST /api/posts/:id/like`
  - Requires authentication
  - Insert into `post_likes` table
  - Increment `posts.likes_count`
  - Create notification for post author
  - Return: `{ success: true }`

- `DELETE /api/posts/:id/like`
  - Requires authentication
  - Delete from `post_likes` table
  - Decrement `posts.likes_count`
  - Return: `{ success: true }`

### Step 2.6: Favorite/Unfavorite Post
**Controller**: `PostsController.java`
- `POST /api/posts/:id/favorite`
  - Requires authentication
  - Insert into `post_favorites` table
  - Increment `posts.favorites_count`
  - Return: `{ success: true }`

- `DELETE /api/posts/:id/favorite`
  - Requires authentication
  - Delete from `post_favorites` table
  - Decrement `posts.favorites_count`
  - Return: `{ success: true }`

---

## 3. PUBLISH PAGE - Content Creation

### Step 3.1: File Upload API (Aliyun OSS)
**Controller**: `UploadController.java`
- `POST /api/upload/image`
  - Requires authentication
  - Input: multipart/form-data with `image` field
  - Validate file type (JPG, PNG only)
  - Validate file size (max 10MB)
  - Generate unique filename: `{userId}/{timestamp}_{uuid}.{ext}`
  - Upload to Aliyun OSS
  - Return: `{ success: true, data: { url: string } }`

- `POST /api/upload/video`
  - Requires authentication
  - Input: multipart/form-data with `video` field
  - Validate file type (MP4, MOV, etc.)
  - Validate file size (max 100MB)
  - Generate unique filename
  - Upload to Aliyun OSS
  - Return: `{ success: true, data: { upload_id, url, status: 'processing' } }`

- `GET /api/upload/video/:uploadId/status`
  - Check video processing status (for OSS async processing)
  - Return: `{ success: true, data: { status: 'processing' | 'completed' | 'failed', url } }`

### Step 3.2: Aliyun OSS Configuration
**Service**: `AliyunOssService.java`
- Configure OSS client with credentials (accessKeyId, accessKeySecret, endpoint, bucketName)
- Implement upload methods:
  - `uploadFile(InputStream inputStream, String fileName, String contentType)`
  - Generate unique object keys
  - Set object ACL to public-read
- Generate signed URLs for file access (if using private buckets)
- Handle bucket operations
- Implement error handling and retry logic

**Configuration**: `application.yml`
```yaml
aliyun:
  oss:
    endpoint: https://oss-cn-hangzhou.aliyuncs.com
    access-key-id: ${ALIYUN_ACCESS_KEY_ID}
    access-key-secret: ${ALIYUN_ACCESS_KEY_SECRET}
    bucket-name: allesgut-media
```

### Step 3.3: Create Post API
**Controller**: `PostsController.java`
- `POST /api/posts`
  - Requires authentication
  - Input:
    ```json
    {
      title: string (max 50 chars),
      content: string (max 1000 chars),
      media_type: 'image' | 'video' | null,
      media_urls: string[] (max 9 for images),
      tags: string[] (max 5)
    }
    ```
  - Validate input:
    - Title and content are required and within limits
    - Media URLs are valid if provided
    - Tags array has max 5 items
  - Create post in database
  - Handle tags:
    - For each tag, find existing or create new tag
    - Insert into `post_tags` table
    - Increment tag usage_count
  - Increment `users.posts_count` for author
  - Return: `{ success: true, data: PostDTO }`

---

## 4. PROFILE PAGE - User Management

### Step 4.1: User Profile API
**Controller**: `UsersController.java`
- `GET /api/users/:id`
  - Fetch user info with stats
  - Include whether current user follows this user
  - Return: `{ success: true, data: UserDTO }`

- `PUT /api/users/me`
  - Requires authentication
  - Input: `{ nickname?, avatar_url?, bio? }`
  - Validate input (nickname 1-50 chars, bio max 200 chars)
  - Update user profile
  - Return: `{ success: true, data: UserDTO }`

### Step 4.2: User Posts API
**Controller**: `UsersController.java`
- `GET /api/users/:id/posts`
  - Query params: `page`, `limit`
  - Fetch posts by user ordered by created_at DESC
  - Include like/favorite status for current user
  - Include author info and tags
  - Return: `{ success: true, data: { posts: PostDTO[], total } }`

### Step 4.3: User Favorites API
**Controller**: `UsersController.java`
- `GET /api/users/me/favorites`
  - Requires authentication
  - Query params: `page`, `limit`
  - Fetch posts favorited by current user
  - Join with `post_favorites` table
  - Order by favorite created_at DESC
  - Return: `{ success: true, data: { posts: PostDTO[], total } }`

### Step 4.4: Follow/Unfollow User
**Controller**: `UsersController.java`
- `POST /api/users/:id/follow`
  - Requires authentication
  - Validate: cannot follow self
  - Insert into `user_follows` table
  - Increment `following_count` for current user
  - Increment `followers_count` for target user
  - Create notification for target user
  - Return: `{ success: true }`

- `DELETE /api/users/:id/follow`
  - Requires authentication
  - Delete from `user_follows` table
  - Decrement `following_count` for current user
  - Decrement `followers_count` for target user
  - Return: `{ success: true }`

### Step 4.5: Followers/Following Lists
**Controller**: `UsersController.java`
- `GET /api/users/:id/followers`
  - Query params: `page`, `limit`
  - Return list of users following this user
  - Include whether current user follows each user
  - Return: `{ success: true, data: { users: UserDTO[], total } }`

- `GET /api/users/:id/following`
  - Query params: `page`, `limit`
  - Return list of users this user is following
  - Include whether current user follows each user
  - Return: `{ success: true, data: { users: UserDTO[], total } }`

---

## 5. NOTIFICATIONS PAGE - Notification System

### Step 5.1: Database Schema
Create `notifications` table:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
```

**Notification Types**:
- `like`: User liked your post
- `comment`: User commented on your post
- `follow`: User followed you
- `mention`: User mentioned you in a comment
- `new_post`: User you follow created a new post

### Step 5.2: Notifications API
**Controller**: `NotificationsController.java`
- `GET /api/notifications`
  - Requires authentication
  - Query params: `page`, `limit`
  - Fetch notifications for current user ordered by created_at DESC
  - Include actor info (user who triggered notification)
  - Include post info if applicable
  - Return: `{ success: true, data: { notifications: NotificationDTO[], total } }`

- `GET /api/notifications/unread-count`
  - Requires authentication
  - Count unread notifications for current user
  - Return: `{ success: true, data: { count: number } }`

- `PUT /api/notifications/:id/read`
  - Requires authentication
  - Verify notification belongs to current user
  - Mark notification as read
  - Return: `{ success: true }`

- `PUT /api/notifications/read-all`
  - Requires authentication
  - Mark all notifications as read for current user
  - Return: `{ success: true }`

### Step 5.3: Notification Creation Service
**Service**: `NotificationService.java`

Create notifications when:
- **User likes a post** → notify post author
  - Type: `like`
  - Content: "{actor_nickname} 赞了你的帖子"
  - Don't notify if author likes own post

- **User comments on a post** → notify post author
  - Type: `comment`
  - Content: "{actor_nickname} 评论了你的帖子: {comment_preview}"
  - Don't notify if author comments on own post

- **User follows another user** → notify target user
  - Type: `follow`
  - Content: "{actor_nickname} 关注了你"

- **User mentions someone in a comment** → notify mentioned users
  - Type: `mention`
  - Content: "{actor_nickname} 在评论中提到了你"

- **User's followed users create new posts** → notify followers (optional, can be batched)
  - Type: `new_post`
  - Content: "{actor_nickname} 发布了新内容"

**Implementation considerations**:
- Use async processing for notification creation (e.g., Spring @Async)
- Batch notifications when appropriate
- Implement notification preferences in future (let users control what notifications they receive)

---

## 6. COMMENTS SYSTEM (for PostDetail component)

### Step 6.1: Database Schema
Create `comments` table:
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_post ON comments(post_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
```

Create `comment_likes` table:
```sql
CREATE TABLE comment_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id)
);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
```

Create `comment_mentions` table:
```sql
CREATE TABLE comment_mentions (
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
);
CREATE INDEX idx_comment_mentions_user ON comment_mentions(user_id);
```

### Step 6.2: Comments API
**Controller**: `CommentsController.java`
- `GET /api/posts/:postId/comments`
  - Query params: `page`, `limit`
  - Fetch comments for post with author info
  - Support nested comments (replies):
    - Option 1: Return flat list with parent_id, let frontend build tree
    - Option 2: Return nested structure with replies embedded
  - Include like status for current user
  - Order by created_at ASC (show oldest first)
  - Return: `{ success: true, data: { comments: CommentDTO[], total } }`

- `POST /api/posts/:postId/comments`
  - Requires authentication
  - Input: `{ content: string (max 500 chars), parent_id?: UUID, mentions?: UUID[] }`
  - Validate input:
    - Content is required and within limits
    - parent_id exists and belongs to same post (if provided)
    - mentioned users exist
  - Create comment
  - If parent_id provided, this is a reply
  - Insert mentions into `comment_mentions` table
  - Increment `posts.comments_count`
  - Create notifications:
    - Notify post author (if not commenter)
    - Notify mentioned users
    - Notify parent comment author (if reply)
  - Return: `{ success: true, data: CommentDTO }`

- `DELETE /api/comments/:id`
  - Requires authentication
  - Check user is comment author or post author
  - Delete comment:
    - Option 1: Soft delete (set deleted flag)
    - Option 2: Hard delete (cascade to replies)
  - Decrement `posts.comments_count`
  - Return: `{ success: true }`

- `POST /api/comments/:id/like`
  - Requires authentication
  - Insert into `comment_likes`
  - Increment `comments.likes_count`
  - Return: `{ success: true }`

- `DELETE /api/comments/:id/like`
  - Requires authentication
  - Delete from `comment_likes`
  - Decrement `comments.likes_count`
  - Return: `{ success: true }`

---

## 7. MALL PAGE - E-commerce (Future Feature)

### Step 7.1: Database Schema
Create `products` table:
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    image_url TEXT,
    images JSONB,
    category_id BIGINT REFERENCES product_categories(id),
    rating DECIMAL(3,2) DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created ON products(created_at DESC);
```

Create `product_categories` table:
```sql
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES product_categories(id),
    display_order INTEGER DEFAULT 0
);
CREATE INDEX idx_categories_parent ON product_categories(parent_id);
```

Create `product_tags` table:
```sql
CREATE TABLE product_tags (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (product_id, tag_name)
);
```

### Step 7.2: Products API
**Controller**: `ProductsController.java`
- `GET /api/products`
  - Query params: `page`, `limit`, `category`, `search`, `sort` (price_asc, price_desc, sales, rating)
  - Return paginated products with category info
  - Apply filters and sorting
  - Return: `{ success: true, data: { products: ProductDTO[], total } }`

- `GET /api/products/:id`
  - Return product details with full info
  - Return: `{ success: true, data: ProductDTO }`

- `GET /api/product-categories`
  - Return category tree structure
  - Return: `{ success: true, data: CategoryDTO[] }`

### Step 7.3: Orders System (Basic)
Create `orders` table:
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Create `order_items` table:
```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Controller**: `OrdersController.java`
- `POST /api/orders` - Create order
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status (for admin)

---

## 8. SUPPORTING FEATURES

### Step 8.1: User Blocking
**Controller**: `UsersController.java`
- `POST /api/users/:id/block`
  - Requires authentication
  - Insert into `user_blocks` table
  - Return: `{ success: true }`

- `DELETE /api/users/:id/block`
  - Requires authentication
  - Delete from `user_blocks` table
  - Return: `{ success: true }`

Create `user_blocks` table:
```sql
CREATE TABLE user_blocks (
    blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id)
);
CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
```

**Implementation**: Filter out blocked users from all feeds and interactions

### Step 8.2: User Search
**Controller**: `UsersController.java`
- `GET /api/users/search`
  - Query params: `q` (search query), `page`, `limit`
  - Search users by nickname (ILIKE %query%)
  - Exclude blocked users
  - Return: `{ success: true, data: { users: UserDTO[], total } }`

### Step 8.3: Post Management
**Controller**: `PostsController.java`
- `PUT /api/posts/:id`
  - Requires authentication
  - Check user is post author
  - Input: `{ title?, content?, tags? }`
  - Update post
  - Return: `{ success: true, data: PostDTO }`

- `DELETE /api/posts/:id`
  - Requires authentication
  - Check user is post author
  - Delete post (cascade deletes comments, likes, favorites)
  - Decrement user.posts_count
  - Return: `{ success: true }`

### Step 8.4: Global Error Handling
**Class**: `GlobalExceptionHandler.java`

Create `@ControllerAdvice` for global exception handling:
- `EntityNotFoundException` → 404 Not Found
- `UnauthorizedException` → 401 Unauthorized
- `ForbiddenException` → 403 Forbidden
- `ValidationException` → 400 Bad Request
- `MethodArgumentNotValidException` → 400 Bad Request
- Generic exceptions → 500 Internal Server Error

Return consistent error format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Step 8.5: CORS Configuration
**Class**: `WebConfig.java`

Configure CORS:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "https://allesgut.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### Step 8.6: Database Indexes
Add indexes for performance (already included in schema definitions above):
- `users.phone`
- `posts.user_id, posts.created_at`
- `post_likes.post_id, post_likes.user_id`
- `post_favorites.user_id`
- `comments.post_id, comments.created_at`
- `notifications.user_id, notifications.created_at`
- `user_follows.follower_id, user_follows.following_id`

### Step 8.7: Pagination Utility
Create reusable pagination utility:
```java
public class PageResponse<T> {
    private List<T> data;
    private int page;
    private int limit;
    private long total;
    private int totalPages;
}
```

### Step 8.8: DTO Mapping
Use ModelMapper or MapStruct for entity-to-DTO conversion:
- `UserDTO`: Safe user info (exclude sensitive data)
- `PostDTO`: Post with author info, tags, like/favorite status
- `CommentDTO`: Comment with author info, like status
- `NotificationDTO`: Notification with actor and post info

---

## 9. ADDITIONAL CONSIDERATIONS

### Step 9.1: Security
- Implement rate limiting (e.g., 100 requests per minute per user)
- Add input validation and sanitization
- Prevent SQL injection (use parameterized queries)
- Prevent XSS (sanitize user content)
- Implement CSRF protection for state-changing operations
- Hash sensitive data (though phone numbers might need to be searchable)

### Step 9.2: Performance Optimization
- Implement Redis caching for:
  - User sessions
  - Frequently accessed posts
  - Tag list
  - User profiles
- Add database query optimization:
  - Use proper indexes
  - Avoid N+1 queries (use JOIN FETCH or batch loading)
  - Implement pagination for all list endpoints
- Consider implementing CDN for static assets (OSS images)

### Step 9.3: Logging and Monitoring
- Use SLF4J + Logback for logging
- Log all API requests and responses
- Log errors with stack traces
- Implement health check endpoint: `GET /api/health`
- Consider APM tools (e.g., Spring Boot Actuator, Prometheus)

### Step 9.4: API Documentation
- Use Swagger/OpenAPI for API documentation
- Add `@ApiOperation`, `@ApiParam` annotations
- Expose Swagger UI at `/swagger-ui.html`
- Generate API documentation automatically

### Step 9.5: Testing
- Unit tests for services (JUnit + Mockito)
- Integration tests for APIs (Spring Boot Test + TestContainers for PostgreSQL)
- Test coverage for:
  - Authentication flow
  - Post creation and retrieval
  - Social interactions (like, follow, comment)
  - Edge cases and error handling

---

## IMPLEMENTATION ORDER RECOMMENDATION

### Phase 1 - Core Auth & Users (Week 1)
1. Set up Spring Boot project with dependencies
2. Configure PostgreSQL connection
3. Create database schema and migrations (use Flyway or Liquibase)
4. Implement User entity and repository
5. Implement SMS mock service
6. Implement authentication (JWT)
7. Implement user profile APIs
8. Configure Aliyun OSS SDK

### Phase 2 - Posts & Feed (Week 2)
1. Create Posts, Tags, PostLikes, PostFavorites entities
2. Implement posts CRUD APIs
3. Implement tags system
4. Implement feed APIs (recommended and following)
5. Implement like/favorite functionality
6. Implement image upload with OSS integration
7. Add search and filtering

### Phase 3 - Social Features (Week 3)
1. Create Comments entities and tables
2. Implement comments CRUD APIs
3. Implement nested replies
4. Implement follow/unfollow functionality
5. Create notifications system
6. Implement notification creation and retrieval
7. Implement user search

### Phase 4 - Polish & Optimization (Week 4)
1. Add comprehensive error handling
2. Implement rate limiting
3. Add Redis caching for hot data
4. Optimize database queries
5. Add API documentation (Swagger)
6. Write unit and integration tests
7. Performance testing and optimization

### Phase 5 - Mall (Optional/Future)
1. Create products and categories schema
2. Implement products APIs
3. Implement orders system
4. Add payment integration (Alipay/WeChat Pay)
5. Implement order management

---

## API RESPONSE FORMAT

All API responses follow consistent format:

**Success Response**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## ENVIRONMENT CONFIGURATION

**application.yml**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/allesgut
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false

jwt:
  secret: ${JWT_SECRET}
  expiration: 2592000000  # 30 days in ms

aliyun:
  oss:
    endpoint: ${ALIYUN_OSS_ENDPOINT}
    access-key-id: ${ALIYUN_ACCESS_KEY_ID}
    access-key-secret: ${ALIYUN_ACCESS_KEY_SECRET}
    bucket-name: ${ALIYUN_OSS_BUCKET}

redis:
  host: ${REDIS_HOST:localhost}
  port: ${REDIS_PORT:6379}
  password: ${REDIS_PASSWORD:}

logging:
  level:
    root: INFO
    com.allesgut: DEBUG
```

---

This comprehensive plan provides a complete roadmap for implementing the backend for the AllesGut application with all features required by the frontend.
