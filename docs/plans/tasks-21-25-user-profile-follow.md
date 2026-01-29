# Tasks 21-25: User Profile & Follow System - Detailed Implementation

## Task 21: Get User Profile Endpoint

**Files:**
- Create: `src/main/java/com/allesgut/service/UserService.java`
- Modify: `src/main/java/com/allesgut/controller/UsersController.java` (create if not exists)
- Create: `src/test/java/com/allesgut/service/UserServiceTests.java`
- Create: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

**Step 1: Write test for UserService**

Create: `src/test/java/com/allesgut/service/UserServiceTests.java`

```java
package com.allesgut.service;

import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.repository.UserFollowRepository;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .avatarUrl("https://example.com/avatar.jpg")
                .bio("Test bio")
                .postsCount(10)
                .followersCount(5)
                .followingCount(3)
                .build();
    }

    @Test
    void shouldGetUserProfileSuccessfully() {
        // Given
        UUID userId = testUser.getId();
        UUID currentUserId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, userId))
                .thenReturn(true);

        // When
        UserDto result = userService.getUserProfile(userId, currentUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(userId);
        assertThat(result.nickname()).isEqualTo("Test User");
        assertThat(result.postsCount()).isEqualTo(10);
        assertThat(result.followersCount()).isEqualTo(5);
        assertThat(result.followingCount()).isEqualTo(3);
    }

    @Test
    void shouldReturnNotFollowingWhenNotFollowed() {
        // Given
        UUID userId = testUser.getId();
        UUID currentUserId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, userId))
                .thenReturn(false);

        // When
        UserDto result = userService.getUserProfile(userId, currentUserId);

        // Then
        assertThat(result).isNotNull();
    }

    @Test
    void shouldGetProfileWithoutCurrentUser() {
        // Given
        UUID userId = testUser.getId();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        UserDto result = userService.getUserProfile(userId, null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.nickname()).isEqualTo("Test User");
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Given
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getUserProfile(userId, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserServiceTests`
Expected: FAIL with "UserService class not found"

**Step 3: Create UserService**

Create: `src/main/java/com/allesgut/service/UserService.java`

```java
package com.allesgut.service;

import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.repository.UserFollowRepository;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;

    @Transactional(readOnly = true)
    public UserDto getUserProfile(UUID userId, UUID currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return mapToDto(user);
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getPhone(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getPostsCount(),
                user.getFollowersCount(),
                user.getFollowingCount()
        );
    }
}
```

**Step 4: Write test for UsersController**

Create: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.response.UserDto;
import com.allesgut.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UsersControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @WithMockUser
    void shouldGetUserProfileSuccessfully() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        UserDto userDto = new UserDto(
                userId,
                "13800138000",
                "Test User",
                "https://example.com/avatar.jpg",
                "Test bio",
                10,
                5,
                3
        );

        when(userService.getUserProfile(any(UUID.class), any()))
                .thenReturn(userDto);

        // When/Then
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(userId.toString()))
                .andExpect(jsonPath("$.data.nickname").value("Test User"))
                .andExpect(jsonPath("$.data.postsCount").value(10))
                .andExpect(jsonPath("$.data.followersCount").value(5))
                .andExpect(jsonPath("$.data.followingCount").value(3));
    }

    @Test
    void shouldAllowUnauthenticatedUserToViewProfile() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        UserDto userDto = new UserDto(
                userId,
                "13800138000",
                "Test User",
                null,
                null,
                10,
                5,
                3
        );

        when(userService.getUserProfile(any(UUID.class), any()))
                .thenReturn(userDto);

        // When/Then - This should fail initially if endpoint requires auth
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void shouldReturn404WhenUserNotFound() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        when(userService.getUserProfile(any(UUID.class), any()))
                .thenThrow(new IllegalArgumentException("User not found"));

        // When/Then
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
```

**Step 5: Run test to verify it fails**

Run: `mvn test -Dtest=UsersControllerTests`
Expected: FAIL with "No mapping found"

**Step 6: Create UsersController**

Create: `src/main/java/com/allesgut/controller/UsersController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        UserDto user = userService.getUserProfile(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
```

**Step 7: Update SecurityConfig to allow public access to user profiles**

Modify: `src/main/java/com/allesgut/config/SecurityConfig.java`

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/api/health").permitAll()
        .requestMatchers("/api/users/*/").permitAll()  // Add this line
        .anyRequest().authenticated()
)
```

**Step 8: Run test to verify it passes**

Run: `mvn test -Dtest=UsersControllerTests`
Expected: PASS - user profile endpoint works

**Step 9: Commit**

```bash
git add src/main/java/com/allesgut/service/UserService.java src/main/java/com/allesgut/controller/UsersController.java src/test/java/com/allesgut/service/UserServiceTests.java src/test/java/com/allesgut/controller/UsersControllerTests.java src/main/java/com/allesgut/config/SecurityConfig.java
git commit -m "feat: add get user profile endpoint"
```

---

## Task 22: Update User Profile Endpoint

**Files:**
- Modify: `src/main/java/com/allesgut/service/UserService.java`
- Modify: `src/main/java/com/allesgut/controller/UsersController.java`
- Create: `src/main/java/com/allesgut/dto/request/UpdateProfileRequest.java`
- Modify: `src/test/java/com/allesgut/service/UserServiceTests.java`

**Step 1: Write test for update profile**

Add to: `src/test/java/com/allesgut/service/UserServiceTests.java`

```java
@Test
void shouldUpdateProfileSuccessfully() {
    // Given
    UpdateProfileRequest request = new UpdateProfileRequest(
            "Updated Nickname",
            "https://example.com/new-avatar.jpg",
            "Updated bio"
    );

    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    // When
    UserDto result = userService.updateProfile(testUser.getId(), request);

    // Then
    assertThat(result).isNotNull();
    assertThat(result.nickname()).isEqualTo("Updated Nickname");
    assertThat(result.avatarUrl()).isEqualTo("https://example.com/new-avatar.jpg");
    assertThat(result.bio()).isEqualTo("Updated bio");
    verify(userRepository).save(testUser);
}

@Test
void shouldValidateNicknameLengthWhenUpdating() {
    // Given
    String longNickname = "a".repeat(51); // 51 characters
    UpdateProfileRequest request = new UpdateProfileRequest(longNickname, null, null);

    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

    // When/Then
    assertThatThrownBy(() -> userService.updateProfile(testUser.getId(), request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Nickname must be between 1 and 50 characters");
}

@Test
void shouldValidateBioLengthWhenUpdating() {
    // Given
    String longBio = "a".repeat(201); // 201 characters
    UpdateProfileRequest request = new UpdateProfileRequest(null, null, longBio);

    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

    // When/Then
    assertThatThrownBy(() -> userService.updateProfile(testUser.getId(), request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Bio must not exceed 200 characters");
}

@Test
void shouldUpdateOnlyProvidedFields() {
    // Given
    UpdateProfileRequest request = new UpdateProfileRequest("New Nickname", null, null);

    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    String originalAvatarUrl = testUser.getAvatarUrl();
    String originalBio = testUser.getBio();

    // When
    UserDto result = userService.updateProfile(testUser.getId(), request);

    // Then
    assertThat(result.nickname()).isEqualTo("New Nickname");
    assertThat(result.avatarUrl()).isEqualTo(originalAvatarUrl); // Unchanged
    assertThat(result.bio()).isEqualTo(originalBio); // Unchanged
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserServiceTests#shouldUpdateProfileSuccessfully`
Expected: FAIL with "Method not found"

**Step 3: Create UpdateProfileRequest DTO**

Create: `src/main/java/com/allesgut/dto/request/UpdateProfileRequest.java`

```java
package com.allesgut.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 50, message = "Nickname must be between 1 and 50 characters")
        String nickname,

        String avatarUrl,

        @Size(max = 200, message = "Bio must not exceed 200 characters")
        String bio
) {}
```

**Step 4: Add update profile method to UserService**

Modify: `src/main/java/com/allesgut/service/UserService.java`

```java
@Transactional
public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Validate nickname
    if (request.nickname() != null) {
        String nickname = request.nickname().trim();
        if (nickname.isEmpty() || nickname.length() > 50) {
            throw new IllegalArgumentException("Nickname must be between 1 and 50 characters");
        }
        user.setNickname(nickname);
    }

    // Validate and update avatar URL
    if (request.avatarUrl() != null) {
        user.setAvatarUrl(request.avatarUrl());
    }

    // Validate and update bio
    if (request.bio() != null) {
        if (request.bio().length() > 200) {
            throw new IllegalArgumentException("Bio must not exceed 200 characters");
        }
        user.setBio(request.bio());
    }

    user = userRepository.save(user);
    return mapToDto(user);
}
```

**Step 5: Add controller test**

Add to: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

```java
@Test
@WithMockUser
void shouldUpdateProfileSuccessfully() throws Exception {
    // Given
    UpdateProfileRequest request = new UpdateProfileRequest(
            "Updated Nickname",
            "https://example.com/new-avatar.jpg",
            "Updated bio"
    );

    UUID userId = UUID.randomUUID();
    UserDto userDto = new UserDto(
            userId,
            "13800138000",
            "Updated Nickname",
            "https://example.com/new-avatar.jpg",
            "Updated bio",
            10,
            5,
            3
    );

    when(userService.updateProfile(any(UUID.class), any(UpdateProfileRequest.class)))
            .thenReturn(userDto);

    // When/Then
    mockMvc.perform(put("/api/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.nickname").value("Updated Nickname"))
            .andExpect(jsonPath("$.data.bio").value("Updated bio"));
}

@Test
@WithMockUser
void shouldRejectInvalidNickname() throws Exception {
    // Given
    String longNickname = "a".repeat(51);
    UpdateProfileRequest request = new UpdateProfileRequest(longNickname, null, null);

    // When/Then
    mockMvc.perform(put("/api/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
}

@Test
void shouldRequireAuthenticationForProfileUpdate() throws Exception {
    // Given
    UpdateProfileRequest request = new UpdateProfileRequest("New Name", null, null);

    // When/Then
    mockMvc.perform(put("/api/users/me")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
}
```

**Step 6: Add endpoint to UsersController**

Modify: `src/main/java/com/allesgut/controller/UsersController.java`

```java
@PutMapping("/me")
public ResponseEntity<ApiResponse<UserDto>> updateProfile(
        @Valid @RequestBody UpdateProfileRequest request,
        Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    UserDto user = userService.updateProfile(userId, request);
    return ResponseEntity.ok(ApiResponse.success(user));
}
```

**Step 7: Run test to verify it passes**

Run: `mvn test -Dtest=UserServiceTests,UsersControllerTests`
Expected: PASS - profile update works correctly

**Step 8: Commit**

```bash
git add src/main/java/com/allesgut/service/UserService.java src/main/java/com/allesgut/controller/UsersController.java src/main/java/com/allesgut/dto/request/UpdateProfileRequest.java src/test/java/com/allesgut/service/UserServiceTests.java src/test/java/com/allesgut/controller/UsersControllerTests.java
git commit -m "feat: add update user profile endpoint with validation"
```

---

## Task 23: Follow/Unfollow Endpoints

**Files:**
- Modify: `src/main/java/com/allesgut/service/UserService.java`
- Modify: `src/main/java/com/allesgut/controller/UsersController.java`
- Modify: `src/test/java/com/allesgut/service/UserServiceTests.java`

**Step 1: Write test for follow/unfollow**

Add to: `src/test/java/com/allesgut/service/UserServiceTests.java`

```java
@Test
void shouldFollowUserSuccessfully() {
    // Given
    UUID followerId = UUID.randomUUID();
    User follower = User.builder()
            .id(followerId)
            .phone("13800138001")
            .nickname("Follower")
            .followingCount(0)
            .build();

    testUser.setFollowersCount(0);

    when(userRepository.findById(followerId)).thenReturn(Optional.of(follower));
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    when(userFollowRepository.existsByFollowerIdAndFollowingId(followerId, testUser.getId()))
            .thenReturn(false);

    // When
    userService.followUser(followerId, testUser.getId());

    // Then
    verify(userFollowRepository).save(any());
    verify(userRepository).save(follower);
    verify(userRepository).save(testUser);
    assertThat(follower.getFollowingCount()).isEqualTo(1);
    assertThat(testUser.getFollowersCount()).isEqualTo(1);
}

@Test
void shouldThrowExceptionWhenFollowingSelf() {
    // When/Then
    assertThatThrownBy(() -> userService.followUser(testUser.getId(), testUser.getId()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Cannot follow yourself");
}

@Test
void shouldThrowExceptionWhenAlreadyFollowing() {
    // Given
    UUID followerId = UUID.randomUUID();
    when(userFollowRepository.existsByFollowerIdAndFollowingId(followerId, testUser.getId()))
            .thenReturn(true);

    // When/Then
    assertThatThrownBy(() -> userService.followUser(followerId, testUser.getId()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Already following this user");
}

@Test
void shouldUnfollowUserSuccessfully() {
    // Given
    UUID followerId = UUID.randomUUID();
    User follower = User.builder()
            .id(followerId)
            .phone("13800138001")
            .nickname("Follower")
            .followingCount(1)
            .build();

    testUser.setFollowersCount(1);

    when(userRepository.findById(followerId)).thenReturn(Optional.of(follower));
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
    when(userFollowRepository.existsByFollowerIdAndFollowingId(followerId, testUser.getId()))
            .thenReturn(true);

    // When
    userService.unfollowUser(followerId, testUser.getId());

    // Then
    verify(userFollowRepository).deleteByFollowerIdAndFollowingId(followerId, testUser.getId());
    verify(userRepository).save(follower);
    verify(userRepository).save(testUser);
    assertThat(follower.getFollowingCount()).isEqualTo(0);
    assertThat(testUser.getFollowersCount()).isEqualTo(0);
}

@Test
void shouldThrowExceptionWhenNotFollowing() {
    // Given
    UUID followerId = UUID.randomUUID();
    when(userFollowRepository.existsByFollowerIdAndFollowingId(followerId, testUser.getId()))
            .thenReturn(false);

    // When/Then
    assertThatThrownBy(() -> userService.unfollowUser(followerId, testUser.getId()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Not following this user");
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserServiceTests#shouldFollowUserSuccessfully`
Expected: FAIL with "Method not found"

**Step 3: Add follow/unfollow methods to UserService**

Modify: `src/main/java/com/allesgut/service/UserService.java`

```java
@Transactional
public void followUser(UUID followerId, UUID followingId) {
    // Validate not following self
    if (followerId.equals(followingId)) {
        throw new IllegalArgumentException("Cannot follow yourself");
    }

    // Check if already following
    if (userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
        throw new IllegalArgumentException("Already following this user");
    }

    // Get both users
    User follower = userRepository.findById(followerId)
            .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
    User following = userRepository.findById(followingId)
            .orElseThrow(() -> new IllegalArgumentException("Following user not found"));

    // Create follow relationship
    UserFollow userFollow = UserFollow.builder()
            .followerId(followerId)
            .followingId(followingId)
            .build();
    userFollowRepository.save(userFollow);

    // Update counts
    follower.setFollowingCount(follower.getFollowingCount() + 1);
    following.setFollowersCount(following.getFollowersCount() + 1);

    userRepository.save(follower);
    userRepository.save(following);

    // TODO: Create notification for followed user
}

@Transactional
public void unfollowUser(UUID followerId, UUID followingId) {
    // Check if following
    if (!userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
        throw new IllegalArgumentException("Not following this user");
    }

    // Get both users
    User follower = userRepository.findById(followerId)
            .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
    User following = userRepository.findById(followingId)
            .orElseThrow(() -> new IllegalArgumentException("Following user not found"));

    // Delete follow relationship
    userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);

    // Update counts
    follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
    following.setFollowersCount(Math.max(0, following.getFollowersCount() - 1));

    userRepository.save(follower);
    userRepository.save(following);
}
```

**Step 4: Add controller tests**

Add to: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

```java
@Test
@WithMockUser
void shouldFollowUserSuccessfully() throws Exception {
    // Given
    UUID followingId = UUID.randomUUID();
    doNothing().when(userService).followUser(any(UUID.class), any(UUID.class));

    // When/Then
    mockMvc.perform(post("/api/users/{id}/follow", followingId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("User followed successfully"));

    verify(userService).followUser(any(UUID.class), eq(followingId));
}

@Test
@WithMockUser
void shouldUnfollowUserSuccessfully() throws Exception {
    // Given
    UUID followingId = UUID.randomUUID();
    doNothing().when(userService).unfollowUser(any(UUID.class), any(UUID.class));

    // When/Then
    mockMvc.perform(delete("/api/users/{id}/follow", followingId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.message").value("User unfollowed successfully"));

    verify(userService).unfollowUser(any(UUID.class), eq(followingId));
}

@Test
@WithMockUser
void shouldRejectFollowingSelf() throws Exception {
    // Given
    UUID userId = UUID.randomUUID();
    doThrow(new IllegalArgumentException("Cannot follow yourself"))
            .when(userService).followUser(any(UUID.class), any(UUID.class));

    // When/Then
    mockMvc.perform(post("/api/users/{id}/follow", userId))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.message").value("Cannot follow yourself"));
}

@Test
void shouldRequireAuthenticationForFollow() throws Exception {
    // Given
    UUID userId = UUID.randomUUID();

    // When/Then
    mockMvc.perform(post("/api/users/{id}/follow", userId))
            .andExpect(status().isUnauthorized());
}
```

**Step 5: Add endpoints to UsersController**

Modify: `src/main/java/com/allesgut/controller/UsersController.java`

```java
@PostMapping("/{id}/follow")
public ResponseEntity<ApiResponse<Void>> followUser(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID followerId = UUID.fromString(authentication.getName());
    userService.followUser(followerId, id);
    return ResponseEntity.ok(ApiResponse.success("User followed successfully"));
}

@DeleteMapping("/{id}/follow")
public ResponseEntity<ApiResponse<Void>> unfollowUser(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID followerId = UUID.fromString(authentication.getName());
    userService.unfollowUser(followerId, id);
    return ResponseEntity.ok(ApiResponse.success("User unfollowed successfully"));
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=UserServiceTests,UsersControllerTests`
Expected: PASS - follow/unfollow works correctly

**Step 7: Commit**

```bash
git add src/main/java/com/allesgut/service/UserService.java src/main/java/com/allesgut/controller/UsersController.java src/test/java/com/allesgut/service/UserServiceTests.java src/test/java/com/allesgut/controller/UsersControllerTests.java
git commit -m "feat: add follow/unfollow user endpoints with validation"
```

---

## Task 24: Get Followers/Following Lists

**Files:**
- Modify: `src/main/java/com/allesgut/service/UserService.java`
- Modify: `src/main/java/com/allesgut/controller/UsersController.java`
- Modify: `src/test/java/com/allesgut/service/UserServiceTests.java`

**Step 1: Write test for followers/following lists**

Add to: `src/test/java/com/allesgut/service/UserServiceTests.java`

```java
@Test
void shouldGetFollowersList() {
    // Given
    UUID userId = testUser.getId();
    UUID currentUserId = UUID.randomUUID();

    User follower1 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138001")
            .nickname("Follower 1")
            .build();

    User follower2 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138002")
            .nickname("Follower 2")
            .build();

    UserFollow follow1 = UserFollow.builder()
            .followerId(follower1.getId())
            .followingId(userId)
            .build();

    UserFollow follow2 = UserFollow.builder()
            .followerId(follower2.getId())
            .followingId(userId)
            .build();

    Page<UserFollow> followsPage = new PageImpl<>(List.of(follow1, follow2));

    when(userFollowRepository.findByFollowingId(any(UUID.class), any(Pageable.class)))
            .thenReturn(followsPage);
    when(userRepository.findById(follower1.getId())).thenReturn(Optional.of(follower1));
    when(userRepository.findById(follower2.getId())).thenReturn(Optional.of(follower2));
    when(userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, follower1.getId()))
            .thenReturn(true);
    when(userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, follower2.getId()))
            .thenReturn(false);

    // When
    PageResponse<UserDto> result = userService.getFollowers(userId, currentUserId, 0, 20);

    // Then
    assertThat(result.getData()).hasSize(2);
    assertThat(result.getTotal()).isEqualTo(2);
}

@Test
void shouldGetFollowingList() {
    // Given
    UUID userId = testUser.getId();
    UUID currentUserId = UUID.randomUUID();

    User following1 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138001")
            .nickname("Following 1")
            .build();

    User following2 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138002")
            .nickname("Following 2")
            .build();

    UserFollow follow1 = UserFollow.builder()
            .followerId(userId)
            .followingId(following1.getId())
            .build();

    UserFollow follow2 = UserFollow.builder()
            .followerId(userId)
            .followingId(following2.getId())
            .build();

    Page<UserFollow> followsPage = new PageImpl<>(List.of(follow1, follow2));

    when(userFollowRepository.findByFollowerId(any(UUID.class), any(Pageable.class)))
            .thenReturn(followsPage);
    when(userRepository.findById(following1.getId())).thenReturn(Optional.of(following1));
    when(userRepository.findById(following2.getId())).thenReturn(Optional.of(following2));

    // When
    PageResponse<UserDto> result = userService.getFollowing(userId, currentUserId, 0, 20);

    // Then
    assertThat(result.getData()).hasSize(2);
    assertThat(result.getTotal()).isEqualTo(2);
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserServiceTests#shouldGetFollowersList`
Expected: FAIL with "Method not found"

**Step 3: Update UserFollowRepository with pagination methods**

Modify: `src/main/java/com/allesgut/repository/UserFollowRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.UserFollow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    List<UserFollow> findByFollowerId(UUID followerId);
    Page<UserFollow> findByFollowerId(UUID followerId, Pageable pageable);
    Page<UserFollow> findByFollowingId(UUID followingId, Pageable pageable);
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}
```

**Step 4: Add methods to UserService**

Modify: `src/main/java/com/allesgut/service/UserService.java`

```java
@Transactional(readOnly = true)
public PageResponse<UserDto> getFollowers(UUID userId, UUID currentUserId, int page, int limit) {
    Pageable pageable = PageRequest.of(page, limit);
    Page<UserFollow> followsPage = userFollowRepository.findByFollowingId(userId, pageable);

    List<UserDto> followers = followsPage.getContent().stream()
            .map(follow -> {
                User follower = userRepository.findById(follow.getFollowerId()).orElse(null);
                if (follower == null) return null;
                return mapToDto(follower);
            })
            .filter(dto -> dto != null)
            .collect(Collectors.toList());

    return PageResponse.of(followers, page, limit, followsPage.getTotalElements());
}

@Transactional(readOnly = true)
public PageResponse<UserDto> getFollowing(UUID userId, UUID currentUserId, int page, int limit) {
    Pageable pageable = PageRequest.of(page, limit);
    Page<UserFollow> followsPage = userFollowRepository.findByFollowerId(userId, pageable);

    List<UserDto> following = followsPage.getContent().stream()
            .map(follow -> {
                User followingUser = userRepository.findById(follow.getFollowingId()).orElse(null);
                if (followingUser == null) return null;
                return mapToDto(followingUser);
            })
            .filter(dto -> dto != null)
            .collect(Collectors.toList());

    return PageResponse.of(following, page, limit, followsPage.getTotalElements());
}
```

Add the import:
```java
import org.springframework.data.domain.PageRequest;
import java.util.stream.Collectors;
```

**Step 5: Add controller tests**

Add to: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

```java
@Test
@WithMockUser
void shouldGetFollowersList() throws Exception {
    // Given
    UUID userId = UUID.randomUUID();
    UserDto follower = new UserDto(
            UUID.randomUUID(),
            "13800138001",
            "Follower",
            null,
            null,
            0,
            0,
            0
    );

    PageResponse<UserDto> pageResponse = PageResponse.of(
            List.of(follower), 0, 20, 1);

    when(userService.getFollowers(any(UUID.class), any(), anyInt(), anyInt()))
            .thenReturn(pageResponse);

    // When/Then
    mockMvc.perform(get("/api/users/{id}/followers", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.data[0].nickname").value("Follower"))
            .andExpect(jsonPath("$.data.total").value(1));
}

@Test
@WithMockUser
void shouldGetFollowingList() throws Exception {
    // Given
    UUID userId = UUID.randomUUID();
    UserDto following = new UserDto(
            UUID.randomUUID(),
            "13800138001",
            "Following",
            null,
            null,
            0,
            0,
            0
    );

    PageResponse<UserDto> pageResponse = PageResponse.of(
            List.of(following), 0, 20, 1);

    when(userService.getFollowing(any(UUID.class), any(), anyInt(), anyInt()))
            .thenReturn(pageResponse);

    // When/Then
    mockMvc.perform(get("/api/users/{id}/following", userId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.data[0].nickname").value("Following"))
            .andExpect(jsonPath("$.data.total").value(1));
}
```

**Step 6: Add endpoints to UsersController**

Modify: `src/main/java/com/allesgut/controller/UsersController.java`

```java
@GetMapping("/{id}/followers")
public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getFollowers(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit,
        Authentication authentication) {
    UUID currentUserId = authentication != null
            ? UUID.fromString(authentication.getName())
            : null;

    PageResponse<UserDto> followers = userService.getFollowers(id, currentUserId, page, limit);
    return ResponseEntity.ok(ApiResponse.success(followers));
}

@GetMapping("/{id}/following")
public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getFollowing(
        @PathVariable UUID id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit,
        Authentication authentication) {
    UUID currentUserId = authentication != null
            ? UUID.fromString(authentication.getName())
            : null;

    PageResponse<UserDto> following = userService.getFollowing(id, currentUserId, page, limit);
    return ResponseEntity.ok(ApiResponse.success(following));
}
```

**Step 7: Run test to verify it passes**

Run: `mvn test -Dtest=UserServiceTests,UsersControllerTests`
Expected: PASS - followers/following lists work correctly

**Step 8: Commit**

```bash
git add src/main/java/com/allesgut/service/UserService.java src/main/java/com/allesgut/controller/UsersController.java src/main/java/com/allesgut/repository/UserFollowRepository.java src/test/java/com/allesgut/service/UserServiceTests.java src/test/java/com/allesgut/controller/UsersControllerTests.java
git commit -m "feat: add endpoints to get followers and following lists"
```

---

## Task 25: User Search Endpoint

**Files:**
- Modify: `src/main/java/com/allesgut/service/UserService.java`
- Modify: `src/main/java/com/allesgut/controller/UsersController.java`
- Modify: `src/main/java/com/allesgut/repository/UserRepository.java`
- Modify: `src/test/java/com/allesgut/service/UserServiceTests.java`

**Step 1: Write test for user search**

Add to: `src/test/java/com/allesgut/service/UserServiceTests.java`

```java
@Test
void shouldSearchUsersSuccessfully() {
    // Given
    String query = "Test";
    User user1 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138001")
            .nickname("Test User 1")
            .build();

    User user2 = User.builder()
            .id(UUID.randomUUID())
            .phone("13800138002")
            .nickname("Another Test")
            .build();

    Page<User> usersPage = new PageImpl<>(List.of(user1, user2));

    when(userRepository.findByNicknameContainingIgnoreCase(eq(query), any(Pageable.class)))
            .thenReturn(usersPage);

    // When
    PageResponse<UserDto> result = userService.searchUsers(query, 0, 20);

    // Then
    assertThat(result.getData()).hasSize(2);
    assertThat(result.getTotal()).isEqualTo(2);
    assertThat(result.getData().get(0).nickname()).contains("Test");
}

@Test
void shouldReturnEmptyForNoMatches() {
    // Given
    String query = "NonExistent";
    Page<User> emptyPage = new PageImpl<>(List.of());

    when(userRepository.findByNicknameContainingIgnoreCase(eq(query), any(Pageable.class)))
            .thenReturn(emptyPage);

    // When
    PageResponse<UserDto> result = userService.searchUsers(query, 0, 20);

    // Then
    assertThat(result.getData()).isEmpty();
    assertThat(result.getTotal()).isEqualTo(0);
}

@Test
void shouldThrowExceptionForEmptyQuery() {
    // When/Then
    assertThatThrownBy(() -> userService.searchUsers("", 0, 20))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Search query cannot be empty");
}

@Test
void shouldThrowExceptionForShortQuery() {
    // When/Then
    assertThatThrownBy(() -> userService.searchUsers("a", 0, 20))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Search query must be at least 2 characters");
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserServiceTests#shouldSearchUsersSuccessfully`
Expected: FAIL with "Method not found"

**Step 3: Update UserRepository with search method**

Modify: `src/main/java/com/allesgut/repository/UserRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    Page<User> findByNicknameContainingIgnoreCase(String nickname, Pageable pageable);
}
```

**Step 4: Add search method to UserService**

Modify: `src/main/java/com/allesgut/service/UserService.java`

```java
@Transactional(readOnly = true)
public PageResponse<UserDto> searchUsers(String query, int page, int limit) {
    // Validate query
    if (query == null || query.trim().isEmpty()) {
        throw new IllegalArgumentException("Search query cannot be empty");
    }

    String trimmedQuery = query.trim();
    if (trimmedQuery.length() < 2) {
        throw new IllegalArgumentException("Search query must be at least 2 characters");
    }

    Pageable pageable = PageRequest.of(page, limit);
    Page<User> usersPage = userRepository.findByNicknameContainingIgnoreCase(trimmedQuery, pageable);

    List<UserDto> users = usersPage.getContent().stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());

    return PageResponse.of(users, page, limit, usersPage.getTotalElements());
}
```

**Step 5: Add controller test**

Add to: `src/test/java/com/allesgut/controller/UsersControllerTests.java`

```java
@Test
void shouldSearchUsersSuccessfully() throws Exception {
    // Given
    String query = "Test";
    UserDto user = new UserDto(
            UUID.randomUUID(),
            "13800138001",
            "Test User",
            null,
            null,
            0,
            0,
            0
    );

    PageResponse<UserDto> pageResponse = PageResponse.of(
            List.of(user), 0, 20, 1);

    when(userService.searchUsers(eq(query), anyInt(), anyInt()))
            .thenReturn(pageResponse);

    // When/Then
    mockMvc.perform(get("/api/users/search")
                    .param("q", query))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.data[0].nickname").value("Test User"))
            .andExpect(jsonPath("$.data.total").value(1));
}

@Test
void shouldRejectEmptySearchQuery() throws Exception {
    // When/Then
    mockMvc.perform(get("/api/users/search")
                    .param("q", ""))
            .andExpect(status().isBadRequest());
}

@Test
void shouldRequireQueryParameter() throws Exception {
    // When/Then
    mockMvc.perform(get("/api/users/search"))
            .andExpect(status().isBadRequest());
}
```

**Step 6: Add endpoint to UsersController**

Modify: `src/main/java/com/allesgut/controller/UsersController.java`

```java
@GetMapping("/search")
public ResponseEntity<ApiResponse<PageResponse<UserDto>>> searchUsers(
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit) {

    if (q == null || q.trim().isEmpty()) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("Search query is required"));
    }

    PageResponse<UserDto> users = userService.searchUsers(q, page, limit);
    return ResponseEntity.ok(ApiResponse.success(users));
}
```

**Step 7: Update SecurityConfig to allow public search**

Modify: `src/main/java/com/allesgut/config/SecurityConfig.java`

```java
.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/api/health").permitAll()
        .requestMatchers("/api/users/*/", "/api/users/search").permitAll()
        .anyRequest().authenticated()
)
```

**Step 8: Run test to verify it passes**

Run: `mvn test -Dtest=UserServiceTests,UsersControllerTests`
Expected: PASS - user search works correctly

**Step 9: Commit**

```bash
git add src/main/java/com/allesgut/service/UserService.java src/main/java/com/allesgut/controller/UsersController.java src/main/java/com/allesgut/repository/UserRepository.java src/main/java/com/allesgut/config/SecurityConfig.java src/test/java/com/allesgut/service/UserServiceTests.java src/test/java/com/allesgut/controller/UsersControllerTests.java
git commit -m "feat: add user search endpoint with validation"
```

---

## Summary

Tasks 21-25 complete the User Profile & Follow System with:
- ✅ Get user profile endpoint (public)
- ✅ Update user profile with validation
- ✅ Follow/unfollow users with counts
- ✅ Get followers and following lists
- ✅ User search by nickname
- ✅ Comprehensive unit and integration tests

**Next:** Tasks 26-30 will implement the Notifications System.
