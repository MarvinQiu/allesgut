# CLAUDE.md — AllesGut Monorepo Guide

This repository contains **AllesGut**, a small community/social app with:

- **Frontend**: React 18 + Webpack + TailwindCSS, runs on `http://localhost:3200`
- **Backend**: Spring Boot 3.2 (Java 17) + PostgreSQL + Flyway + JWT auth, runs on `http://localhost:8080`
- **Mobile**: Capacitor (Android scaffold) under `android/`

The goal of this file is to give Claude Code enough context to work efficiently and safely.

---

## Quick start

### Frontend

```bash
npm install
npm run dev
# open http://localhost:3200
```

Frontend tests:

```bash
npm test
```

Frontend API base URL:

- Controlled by `.env`:
  - `REACT_APP_API_BASE_URL=http://localhost:8080/api`
- Axios instance: `src/services/api.js`

### Backend

```bash
cd backend
mvn test
mvn spring-boot:run
# API on http://localhost:8080/api
```

Backend uses PostgreSQL (see `backend/src/main/resources/application.yml`).

---

## Architecture overview

### Frontend structure (high level)

- Entry / routing: `src/index.jsx`
- App shell/layout: `src/App.jsx`, `src/components/Layout/`
- Auth state: `src/contexts/AuthContext.jsx`
- Pages:
  - Home feed: `src/pages/Home/` (infinite scroll)
  - Publish: `src/pages/Publish/`
  - Profile: `src/pages/Profile/`
  - Notifications: `src/pages/Notifications/`
  - Login: `src/pages/Login/`

#### Data/services layer

All network calls use the shared axios instance:

- `src/services/api.js` (adds `Authorization: Bearer <token>` via `setAuthToken`)

Domain services:

- `src/services/auth.js` (SMS login, logout, restore session)
- `src/services/posts.js` (feed + post detail + like/favorite)
- `src/services/comments.js`
- `src/services/users.js` (follow/unfollow/profile)
- `src/services/notifications.js`
- `src/services/upload.js`

**Important:** Some UI components depend on fields normalized in `postsService.normalizePost()`.

#### Key UI components

- Masonry layout (absolute positioning): `src/components/Masonry/`
- Post card: `src/components/PostCard/`
- Post detail modal: `src/components/PostDetail/`
- Tag filter: `src/components/TagFilter/`

---

### Backend structure (high level)

Backend is a conventional Spring Boot app:

- Controllers: `backend/src/main/java/com/allesgut/controller/`
  - `AuthController` (SMS login + token)
  - `PostsController` (`/api/posts` feed + detail)
  - `UsersController` (`/api/users` profile + follow)
  - `CommentsController` (`/api/posts/{postId}/comments`)
  - `NotificationsController`
  - `UploadController` (Aliyun OSS)
- Services: `backend/src/main/java/com/allesgut/service/`
- Repositories (JPA): `backend/src/main/java/com/allesgut/repository/`
- Entities: `backend/src/main/java/com/allesgut/entity/`
- DB migrations (Flyway): `backend/src/main/resources/db/migration/`

#### Auth / security

- JWT filter: `backend/src/main/java/com/allesgut/security/JwtAuthenticationFilter.java`
- Security rules: `backend/src/main/java/com/allesgut/config/SecurityConfig.java`
  - `/api/posts/**` is public
  - `/api/users/{id}/follow` requires authentication

---

## API contract notes (things that have caused bugs)

### Posts feed/detail and author identity

- Feed and post detail endpoints return `PostPublicDto`.
- For follow to work, client must know author UUID.

**Current contract:** `PublicUserDto` includes `id`.

Files:
- `backend/src/main/java/com/allesgut/dto/response/PostPublicDto.java`
- `backend/src/main/java/com/allesgut/dto/response/PublicUserDto.java`
- `backend/src/main/java/com/allesgut/service/PostService.java` (mapping to DTO)

### Follow button behavior

- Follow endpoint: `POST /api/users/{id}/follow` (requires JWT)
- If frontend is not logged in, backend returns **403** (expected).

Frontend should ideally guard follow with auth state.

---

## Known recent fixes (context)

### 1) Home masonry horizontal overflow (cropped right column)

Symptom: on narrow widths (2 columns) right column looked cropped and page had horizontal scroll.

Root cause: Masonry used `root.clientWidth` while the container had horizontal padding (`px-4`), causing last column to overflow.

Fix: subtract `paddingLeft/paddingRight` (via `getComputedStyle`) before computing column count/width.

Relevant:
- `src/components/Masonry/index.jsx`
- `src/__tests__/components/Masonry.test.jsx`

### 2) Post detail follow used `undefined` user id

Symptom: request was `/api/users/undefined/follow` causing server UUID parse errors.

Root cause: post author id wasn’t available in the public post DTO previously.

Fix: backend `PublicUserDto` includes `id`; frontend has fallbacks and tests.

Relevant:
- Frontend: `src/components/PostDetail/index.jsx`, `src/services/posts.js`
- Backend: `backend/src/main/java/com/allesgut/dto/response/PublicUserDto.java`

---

## Testing

### Frontend

- Jest + Testing Library
- Tests live in `src/__tests__/`
- Run:
  - `npm test`
  - `npm test -- path/to/test`

### Backend

- JUnit 5 + Spring Boot Test
- Run:
  - `cd backend && mvn test`
  - Single class: `mvn test -Dtest=PostsControllerTests`

---

## Repo hygiene / conventions

- Prefer minimal, targeted changes.
- For bugfixes, add/adjust a test first when practical.
- Avoid committing generated artifacts and local logs.

---

## Common local dev pitfalls

- **403 on follow** means you’re not logged in (no `auth_token` in localStorage).
- **500 with `Invalid UUID string: undefined`** means frontend sent an undefined path parameter.
- API base URL defaults to production unless `.env` is set.

---

## Useful pointers

- Frontend API base: `.env` + `src/services/api.js`
- Backend CORS + auth: `backend/src/main/java/com/allesgut/config/SecurityConfig.java`
- Posts DTO mapping: `backend/src/main/java/com/allesgut/service/PostService.java`
