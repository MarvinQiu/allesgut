# AllesGut Backend Implementation Guide

Complete implementation plan for building the AllesGut backend with Spring Boot, PostgreSQL, Redis, and Aliyun OSS.

## Overview

This guide provides detailed, step-by-step implementation plans for all 50 tasks required to build the complete backend system. Each task follows a Test-Driven Development (TDD) approach with:

1. Write failing test
2. Verify test fails
3. Implement minimal code to pass
4. Verify test passes
5. Commit with descriptive message

## Document Structure

### Core Implementation (Tasks 1-25)

#### **Tasks 1-6: Authentication & SMS**
**File:** `2026-01-16-allesgut-backend-spring-boot.md`

- Task 1: Project Setup & Configuration
- Task 2: Database Schema - Users & Authentication
- Task 3: SMS Verification Service (Mock)
- Task 4: JWT Authentication Service
- Task 5: Authentication REST API - Send SMS
- Task 6: Authentication REST API - Verify SMS & Login

#### **Tasks 7-10: Spring Security & Posts Schema**
**File:** `tasks-7-10.md` (if exists) or included in complete overview

- Task 7: Spring Security Configuration with JWT Filter
- Task 8: Authentication API - Logout
- Task 9: Database Schema - Posts & Tags
- Task 10: Posts Service - Create Post

#### **Tasks 11-15: Posts REST API & Feed**
**File:** `tasks-11-15-posts-api-feed.md`

- Task 11: Create Post Endpoint
- Task 12: Get Posts Feed (Recommended/Following)
- Task 13: Get Single Post Details
- Task 14: Like/Unlike Post Endpoints
- Task 15: Favorite/Unfavorite Post Endpoints

#### **Tasks 16-20: Comments System**
**File:** `tasks-16-20-comments-system.md`

- Task 16: Comments Database Schema & Entities
- Task 17: Comments Service Layer
- Task 18: Create/Delete Comment Endpoints
- Task 19: Nested Replies Support
- Task 20: Like Comment Endpoints

#### **Tasks 21-25: User Profile & Follow**
**File:** `tasks-21-25-user-profile-follow.md`

- Task 21: Get User Profile Endpoint
- Task 22: Update User Profile Endpoint
- Task 23: Follow/Unfollow Endpoints
- Task 24: Get Followers/Following Lists
- Task 25: User Search Endpoint

### Advanced Features (Tasks 26-50)

#### **Tasks 26-50: Remaining Systems**
**File:** `tasks-26-50-remaining-systems.md`

This comprehensive document covers:

**Tasks 26-30: Notifications System**
- Database schema for notifications
- Notification service with async support
- REST API for notifications
- Integration with post likes and comments

**Tasks 31-35: File Upload with Aliyun OSS**
- Aliyun OSS configuration
- Image upload with validation
- Video upload support
- File upload service and controller

**Tasks 36-40: E-commerce/Mall Features**
- Products database schema
- Products service and API
- Orders system
- Order management

**Tasks 41-45: Performance Optimization**
- Redis caching configuration
- Cache user sessions and hot data
- Database query optimization
- Connection pool tuning

**Tasks 46-50: Documentation & Testing**
- Swagger/OpenAPI setup
- API documentation annotations
- Integration tests
- Performance testing
- Rate limiting and security audit

## Quick Reference

### Implementation Order

Follow tasks in numerical order (1→50) for best results:

1. **Phase 1: Foundation (Tasks 1-10)**
   - Set up project, database, authentication
   - ~16 hours

2. **Phase 2: Core Features (Tasks 11-25)**
   - Posts, comments, user profiles, follows
   - ~30 hours

3. **Phase 3: Advanced Features (Tasks 26-40)**
   - Notifications, file upload, e-commerce
   - ~30 hours

4. **Phase 4: Optimization & Polish (Tasks 41-50)**
   - Performance, caching, documentation
   - ~20 hours

**Total Estimated Time:** ~96 hours (12 days at 8 hours/day)

### Key Technologies

- **Backend Framework:** Spring Boot 3.2.1
- **Database:** PostgreSQL 15
- **Cache:** Redis
- **File Storage:** Aliyun OSS
- **Authentication:** JWT (jjwt 0.12.3)
- **Testing:** JUnit 5, Mockito, TestContainers
- **Documentation:** Springdoc OpenAPI 2.2.0

### Testing Strategy

**Unit Tests:**
- Service layer with mocked repositories
- Target: 90%+ coverage
- Mock external dependencies

**Integration Tests:**
- Controller layer with @SpringBootTest + MockMvc
- Use TestContainers for real PostgreSQL
- Target: 85%+ coverage

**Repository Tests:**
- @DataJpaTest with TestContainers
- Test custom queries and relationships

## Code Quality Standards

### Naming Conventions
- Classes: PascalCase (`UserService`)
- Methods: camelCase (`getUserProfile`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Packages: lowercase (`com.allesgut.service`)

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructure
- `test:` Add/update tests
- `docs:` Documentation
- `perf:` Performance improvement

### Example Commits
```bash
feat: add JWT authentication filter
fix: prevent self-follow in user service
test: add integration tests for comment API
perf: add Redis caching for user profiles
docs: add Swagger annotations to PostsController
```

## Project Structure

```
allesgut-backend/
├── src/
│   ├── main/
│   │   ├── java/com/allesgut/
│   │   │   ├── AllesGutApplication.java
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   │   ├── request/
│   │   │   │   └── response/
│   │   │   ├── entity/          # JPA entities
│   │   │   ├── exception/       # Custom exceptions
│   │   │   ├── repository/      # Spring Data repositories
│   │   │   ├── security/        # Security components
│   │   │   └── service/         # Business logic
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/    # Flyway migrations
│   └── test/
│       └── java/com/allesgut/
│           ├── controller/      # Controller tests
│           ├── integration/     # Integration tests
│           ├── repository/      # Repository tests
│           └── service/         # Service tests
└── pom.xml
```

## Development Workflow

### For Each Task:

1. **Read the task documentation** in the appropriate file
2. **Create the test file** first (TDD approach)
3. **Run the test** - verify it fails with expected message
4. **Implement the minimal code** to make test pass
5. **Run the test again** - verify it passes
6. **Refactor if needed** - keep tests passing
7. **Run all tests** - ensure no regressions
8. **Commit** - with descriptive message

### Example Workflow:

```bash
# Task 11: Create Post Endpoint

# 1. Read task-11-15-posts-api-feed.md

# 2. Create test
vim src/test/java/com/allesgut/controller/PostsControllerTests.java

# 3. Run test (should fail)
mvn test -Dtest=PostsControllerTests#shouldCreatePostSuccessfully

# 4. Implement code
vim src/main/java/com/allesgut/controller/PostsController.java

# 5. Run test (should pass)
mvn test -Dtest=PostsControllerTests#shouldCreatePostSuccessfully

# 6. Run all tests
mvn test

# 7. Commit
git add .
git commit -m "feat: add create post REST API endpoint"
```

## Prerequisites

### Required Software
- Java 17 or higher
- Maven 3.8+
- PostgreSQL 15
- Redis 6+
- Git

### Optional Tools
- IntelliJ IDEA (recommended IDE)
- Postman or Insomnia (API testing)
- Docker (for TestContainers)

### Environment Setup

1. **Clone the repository** (if exists) or create new project
2. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE allesgut;
   ```

3. **Start Redis:**
   ```bash
   redis-server
   ```

4. **Configure environment variables:**
   ```bash
   export DB_USERNAME=postgres
   export DB_PASSWORD=your_password
   export JWT_SECRET=your_secret_key_at_least_32_characters
   export ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
   export ALIYUN_ACCESS_KEY_ID=your_key_id
   export ALIYUN_ACCESS_KEY_SECRET=your_key_secret
   export ALIYUN_OSS_BUCKET=allesgut-media
   ```

5. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

## Testing

### Run All Tests
```bash
mvn test
```

### Run Specific Test Class
```bash
mvn test -Dtest=UserServiceTests
```

### Run Specific Test Method
```bash
mvn test -Dtest=UserServiceTests#shouldGetUserProfileSuccessfully
```

### Generate Test Coverage Report
```bash
mvn jacoco:report
```
View report at: `target/site/jacoco/index.html`

## API Documentation

After implementing Task 46-47, access Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```

## Common Issues & Solutions

### Issue: TestContainers fails to start
**Solution:** Ensure Docker is running:
```bash
docker ps
```

### Issue: Flyway migration fails
**Solution:** Check migration version numbers are sequential and unique:
```bash
ls -la src/main/resources/db/migration/
```

### Issue: JWT validation fails
**Solution:** Ensure JWT secret is at least 256 bits (32 characters):
```bash
echo $JWT_SECRET | wc -c  # Should be >= 32
```

### Issue: Redis connection refused
**Solution:** Start Redis server:
```bash
redis-cli ping  # Should return PONG
```

## Best Practices

### 1. Always Write Tests First
- Defines expected behavior
- Catches bugs early
- Enables confident refactoring

### 2. Keep Methods Small
- Single Responsibility Principle
- Max 20-30 lines per method
- Extract complex logic to helper methods

### 3. Use Transactions Properly
- `@Transactional` on service methods that modify data
- `@Transactional(readOnly = true)` for read operations
- Avoid transactions in controllers

### 4. Handle Errors Gracefully
- Use custom exceptions for domain errors
- Global exception handler for consistent API responses
- Log errors with context

### 5. Validate Input
- Use Bean Validation annotations (`@NotBlank`, `@Size`, etc.)
- Validate business rules in service layer
- Return clear error messages

### 6. Optimize Queries
- Use proper indexes
- Avoid N+1 queries with JOIN FETCH
- Paginate large result sets

### 7. Secure Your API
- Validate and sanitize all input
- Use parameterized queries (JPA does this)
- Implement rate limiting
- Don't expose sensitive data in errors

## Next Steps

1. **Start with Task 1** if beginning from scratch
2. **Continue from your last completed task** if resuming
3. **Review the task documentation** before starting each task
4. **Follow the TDD cycle** religiously
5. **Commit frequently** after each passing test
6. **Run full test suite** before each git push

## Support & Resources

- **Spring Boot Documentation:** https://spring.io/projects/spring-boot
- **Spring Data JPA:** https://spring.io/projects/spring-data-jpa
- **Spring Security:** https://spring.io/projects/spring-security
- **TestContainers:** https://www.testcontainers.org/
- **Aliyun OSS SDK:** https://help.aliyun.com/document_detail/32008.html

## License

[Your License Here]

---

**Ready to start? Begin with Task 1 in `2026-01-16-allesgut-backend-spring-boot.md`!**

Good luck with your implementation! 🚀
