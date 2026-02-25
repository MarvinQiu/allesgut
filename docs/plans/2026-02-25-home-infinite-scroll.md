# Home Infinite Scroll Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Implement infinite scroll on Home feed so scrolling near page bottom auto-loads more posts.

**Architecture:** Use an IntersectionObserver sentinel at the bottom of the feed. Maintain paging state in `Home` (0-based) and append pages as they load. Disable infinite scroll in offline fallback mode.

**Tech Stack:** React, IntersectionObserver, Jest, @testing-library/react

---

### Task 1: Align paging semantics to 0-based end-to-end

**Why:** Backend paging is 0-based. We will make the frontend state and service call 0-based to avoid off-by-one bugs.

**Files:**
- Modify: `src/services/posts.js:20-24`
- Test: `src/__tests__/services/posts.test.js`

**Step 1: Write/update failing test**

Update `src/__tests__/services/posts.test.js` so it expects `postsService.getPosts()` to call:

```js
api.get('/posts', {
  params: { page: 0, limit: 20, feedType: 'recommended' }
});
```

and `postsService.getPosts({ page: 1, feed_type: 'following', tag: '自闭症' })` to call:

```js
api.get('/posts', {
  params: { page: 1, limit: 20, feedType: 'following', tag: '自闭症' }
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test --silent -- src/__tests__/services/posts.test.js
```
Expected: FAIL due to current `page - 1` conversion (or mismatched param names).

**Step 3: Write minimal implementation**

In `src/services/posts.js`, change signature and params mapping:

- Change to `async getPosts({ page = 0, limit = 20, feed_type = 'recommended', tag, search } = {})`
- Build params as:

```js
const params = { page, limit, feedType: feed_type };
```

(remove `page: page - 1`).

**Step 4: Run test to verify it passes**

Run:
```bash
npm test --silent -- src/__tests__/services/posts.test.js
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/services/posts.js src/__tests__/services/posts.test.js
git commit -m "fix: use 0-based paging for posts API"
```

---

### Task 2: Add Home paging state and initial page load (page 0)

**Files:**
- Modify: `src/pages/Home/index.jsx:95-123`
- Test: `src/__tests__/pages/HomeInfiniteScroll.test.jsx` (new)

**Step 1: Write failing test**

Create `src/__tests__/pages/HomeInfiniteScroll.test.jsx`:
- Mock `postsService.getPosts`.
- Render `<Home />`.
- Assert it requests `page: 0` on mount with current filters.

Pseudo-test skeleton:

```jsx
jest.mock('../../services/posts', () => ({
  postsService: { getPosts: jest.fn(), getTags: jest.fn() }
}));

test('loads first page with page=0', async () => {
  postsService.getTags.mockResolvedValue([]);
  postsService.getPosts.mockResolvedValue({ data: [], page: 0, totalPages: 0, total: 0 });

  render(<Home />);

  await waitFor(() => expect(postsService.getPosts).toHaveBeenCalled());
  expect(postsService.getPosts).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: FAIL because Home currently passes `page: 1`.

**Step 3: Implement minimal change**

In `src/pages/Home/index.jsx`:
- Add state:
  - `const [page, setPage] = useState(0);`
  - `const [hasMore, setHasMore] = useState(true);`
  - `const [loadingMore, setLoadingMore] = useState(false);`
  - `const [offlineMode, setOfflineMode] = useState(false);`
- In `loadPosts` (initial load), request `page: 0`.
- On success:
  - `setPosts(result.data || [])`
  - `setPage(result.page ?? 0)`
  - `setHasMore((result.totalPages ?? 0) > ((result.page ?? 0) + 1))`
  - `setOfflineMode(false)`
- On fallback:
  - `setPosts(fallbackPosts)`
  - `setOfflineMode(true)`
  - `setHasMore(false)`

Also, when filters change (effect deps), reset paging state before loading.

**Step 4: Run test to verify it passes**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/Home/index.jsx src/__tests__/pages/HomeInfiniteScroll.test.jsx
git commit -m "feat: track Home paging state"
```

---

### Task 3: Implement IntersectionObserver sentinel to auto-load next page

**Files:**
- Modify: `src/pages/Home/index.jsx`
- Test: `src/__tests__/pages/HomeInfiniteScroll.test.jsx`

**Step 1: Write failing test for loading next page**

Extend `HomeInfiniteScroll.test.jsx`:
- Mock `IntersectionObserver`.
- Make first call return `{ data: [postA], page: 0, totalPages: 2 }`.
- Simulate intersection.
- Expect second call with `page: 1`.
- Ensure UI renders both pages (or at minimum that posts array grows).

**Step 2: Run test to verify it fails**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: FAIL because no sentinel/observer.

**Step 3: Implement minimal feature**

In `src/pages/Home/index.jsx`:
- Add `const sentinelRef = useRef(null);`
- Add effect that creates `IntersectionObserver` when not `offlineMode`:
  - Callback: if intersecting and `hasMore && !loadingMore && !loading`, call `loadMore()`.
  - Observe `sentinelRef.current`.
  - Cleanup on unmount.
- Implement `loadMore`:
  - `setLoadingMore(true)`
  - call `postsService.getPosts({ feed_type: feedType, search, tag, page: page + 1, limit: 20 })`
  - append: `setPosts(prev => [...prev, ...(result.data || [])])`
  - `setPage(result.page ?? page + 1)`
  - update `hasMore` from `totalPages`.
  - `setLoadingMore(false)`

- Render sentinel near the bottom of `<main>`:

```jsx
<div ref={sentinelRef} aria-hidden="true" />
```

Optionally render a small spinner when `loadingMore`.

**Step 4: Run tests**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/Home/index.jsx src/__tests__/pages/HomeInfiniteScroll.test.jsx
git commit -m "feat: add infinite scroll to Home"
```

---

### Task 4: Reset infinite scroll correctly on filter changes

**Files:**
- Modify: `src/pages/Home/index.jsx`
- Test: `src/__tests__/pages/HomeInfiniteScroll.test.jsx`

**Step 1: Write failing test**

Add test:
- Initial load page 0.
- Trigger a filter change (e.g., click "关注" tab).
- Expect paging reset and request page 0 for new feedType.

**Step 2: Run test to verify it fails**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: FAIL if old state leaks.

**Step 3: Implement minimal fix**

Ensure on deps change you:
- reset `page=0`, `hasMore=true`, `posts=[]`, `offlineMode=false` (and maybe `loadingMore=false`)
- then call initial load.

**Step 4: Run tests to verify**

Run:
```bash
npm test --silent -- src/__tests__/pages/HomeInfiniteScroll.test.jsx
```
Expected: PASS.

**Step 5: Commit**

```bash
git add src/pages/Home/index.jsx src/__tests__/pages/HomeInfiniteScroll.test.jsx
git commit -m "fix: reset Home paging on filter change"
```

---

### Task 5: Full frontend verification

**Files:**
- Test: all frontend

**Step 1: Run full test suite**

Run:
```bash
npm test --silent
```
Expected: PASS.

**Step 2: Manual test checklist**

- Open Home → scroll to bottom → network shows `/api/posts?page=1` then `/api/posts?page=2`...
- Switch 推荐/关注 → feed resets and loads from `page=0` again
- Trigger an offline/fallback scenario (stop backend) → shows fallback posts and no repeated load-more requests

**Step 3: Commit (if needed)**

If any small fixes were made during verification:
```bash
git add -p
# (or add specific files)
git commit -m "test: ensure infinite scroll works end-to-end"
```
