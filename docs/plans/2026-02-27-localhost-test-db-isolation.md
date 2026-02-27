# Localhost Test DB Isolation (Schema-per-run) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make backend integration tests run against an isolated Postgres schema on localhost so tests don’t pollute or depend on the developer’s real `allesgut` database state.

**Architecture:** Use Spring’s `@DynamicPropertySource` to point the test datasource to `jdbc:postgresql://localhost:5432/allesgut?currentSchema=<unique_schema>` and create/drop that schema around the test suite. Flyway will run migrations into the schema automatically.

**Tech Stack:** Spring Boot 3.2, JUnit 5, PostgreSQL, Flyway, Spring Test (`DynamicPropertySource`).

---

### Task 1: Add schema-isolated test base

**Files:**
- Create: `backend/src/test/java/com/allesgut/LocalhostSchemaTestBase.java`
- Modify: `backend/src/test/java/com/allesgut/controller/PostsControllerTests.java`

**Step 1: Write failing test (safety assertion)**

Add a tiny assertion in `PostsControllerTests` that fails if the JDBC URL does not include `currentSchema=`.

```java
@Test
void shouldUseIsolatedSchema() {
  assertThat(env.getProperty("spring.datasource.url")).contains("currentSchema=");
}
```

**Step 2: Run test to verify it fails**

Run: `cd backend && mvn test -Dtest=PostsControllerTests#shouldUseIsolatedSchema`
Expected: FAIL (no currentSchema present)

**Step 3: Write minimal implementation**

Create `LocalhostSchemaTestBase`:
- Generates schema name: `test_<8hex>`
- Creates schema using JDBC before Spring context loads (via `@BeforeAll` static) OR by using `DriverManager` inside `@DynamicPropertySource` (create schema once), then sets:
  - `spring.datasource.url=jdbc:postgresql://localhost:5432/allesgut?currentSchema=<schema>`
  - `spring.datasource.username` and `spring.datasource.password` from env defaults (or blank if local trust)
  - `spring.flyway.enabled=true`
- Drops schema in `@AfterAll`.

Then make `PostsControllerTests` extend this base.

**Step 4: Run test to verify it passes**

Run: `cd backend && mvn test -Dtest=PostsControllerTests#shouldUseIsolatedSchema`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/test/java/com/allesgut/LocalhostSchemaTestBase.java backend/src/test/java/com/allesgut/controller/PostsControllerTests.java
git commit -m "test: isolate integration DB via schema" -m "" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Remove Docker-based Testcontainers wiring

**Files:**
- Delete: `backend/src/test/java/com/allesgut/PostgresTestBase.java`
- Delete: `backend/src/test/java/com/allesgut/TestcontainersConfig.java`
- Modify: `backend/pom.xml`

**Step 1: Write failing test (compile-level)**

Remove Testcontainers usage in tests (e.g. `extends PostgresTestBase`). Ensure build fails if any reference remains.

**Step 2: Run build to verify it fails (if references exist)**

Run: `cd backend && mvn test -Dtest=PostsControllerTests#shouldUseIsolatedSchema`
Expected: FAIL if lingering references

**Step 3: Minimal implementation**

- Remove Testcontainers dependencies from `backend/pom.xml`
- Delete the two Testcontainers helper classes

**Step 4: Run test to verify it passes**

Run: `cd backend && mvn test -Dtest=PostsControllerTests#shouldUseIsolatedSchema`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/pom.xml
git rm backend/src/test/java/com/allesgut/PostgresTestBase.java backend/src/test/java/com/allesgut/TestcontainersConfig.java
git commit -m "chore: remove testcontainers in tests" -m "" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Re-run Task 6 test suite against isolated schema

**Files:**
- Modify (if needed): `backend/src/test/java/com/allesgut/controller/PostsControllerTests.java`
- Modify (if needed): `backend/src/main/java/com/allesgut/service/PostService.java`
- Modify (if needed): `backend/src/main/java/com/allesgut/repository/PostRepository.java`

**Step 1: Run PostsControllerTests**

Run: `cd backend && mvn test -Dtest=PostsControllerTests`
Expected: PASS (no collisions, no “User not found” due to persistent state)

**Step 2: If failures, fix with TDD**

- Add/adjust the smallest test case
- Implement minimal code

**Step 3: Commit (only if code changes beyond test infra)**

```bash
git add backend/src/main/java/com/allesgut/service/PostService.java backend/src/main/java/com/allesgut/repository/PostRepository.java backend/src/test/java/com/allesgut/controller/PostsControllerTests.java
git commit -m "fix: stabilize posts controller integration tests" -m "" -m "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
