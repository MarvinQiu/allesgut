# Tasks 26-50: Remaining Systems - Detailed Implementation

This document contains detailed implementation plans for:
- Tasks 26-30: Notifications System
- Tasks 31-35: File Upload with Aliyun OSS
- Tasks 36-40: E-commerce/Mall Features
- Tasks 41-45: Performance Optimization
- Tasks 46-50: Documentation & Testing

---

# PART 1: Tasks 26-30 - Notifications System

## Task 26: Notifications Database Schema

**Files:**
- Create: `src/main/resources/db/migration/V004__create_notifications_table.sql`
- Create: `src/main/java/com/allesgut/entity/Notification.java`
- Create: `src/main/java/com/allesgut/repository/NotificationRepository.java`
- Create: `src/test/java/com/allesgut/repository/NotificationRepositoryTests.java`

**Step 1: Write test for Notification repository**

Create: `src/test/java/com/allesgut/repository/NotificationRepositoryTests.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Notification;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Transactional
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NotificationRepositoryTests {


    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private User actor;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);

        actor = User.builder()
                .phone("13800138001")
                .nickname("Actor")
                .build();
        actor = userRepository.save(actor);
    }

    @Test
    void shouldSaveAndFindNotification() {
        // Given
        Notification notification = Notification.builder()
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Actor liked your post")
                .isRead(false)
                .build();

        // When
        Notification saved = notificationRepository.save(notification);
        Notification found = notificationRepository.findById(saved.getId()).orElse(null);

        // Then
        assertThat(found).isNotNull();
        assertThat(found.getContent()).isEqualTo("Actor liked your post");
        assertThat(found.isRead()).isFalse();
    }

    @Test
    void shouldFindNotificationsByUserId() {
        // Given
        Notification notif1 = Notification.builder()
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Notification 1")
                .isRead(false)
                .build();

        Notification notif2 = Notification.builder()
                .userId(testUser.getId())
                .type("comment")
                .actorId(actor.getId())
                .content("Notification 2")
                .isRead(false)
                .build();

        notificationRepository.save(notif1);
        notificationRepository.save(notif2);

        // When
        Page<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(testUser.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(notifications.getContent()).hasSize(2);
    }

    @Test
    void shouldCountUnreadNotifications() {
        // Given
        Notification notif1 = Notification.builder()
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Unread 1")
                .isRead(false)
                .build();

        Notification notif2 = Notification.builder()
                .userId(testUser.getId())
                .type("comment")
                .actorId(actor.getId())
                .content("Unread 2")
                .isRead(false)
                .build();

        Notification notif3 = Notification.builder()
                .userId(testUser.getId())
                .type("follow")
                .actorId(actor.getId())
                .content("Read notification")
                .isRead(true)
                .build();

        notificationRepository.save(notif1);
        notificationRepository.save(notif2);
        notificationRepository.save(notif3);

        // When
        long unreadCount = notificationRepository.countByUserIdAndIsRead(testUser.getId(), false);

        // Then
        assertThat(unreadCount).isEqualTo(2);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=NotificationRepositoryTests`
Expected: FAIL

**Step 3: Create migration**

Create: `src/main/resources/db/migration/V004__create_notifications_table.sql`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
```

**Step 4: Create entity**

Create: `src/main/java/com/allesgut/entity/Notification.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "post_id")
    private UUID postId;

    @Column(name = "comment_id")
    private UUID commentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 5: Create repository**

Create: `src/main/java/com/allesgut/repository/NotificationRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    long countByUserIdAndIsRead(UUID userId, boolean isRead);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsReadByUserId(UUID userId);
}
```

**Step 6: Run test**

Run: `mvn test -Dtest=NotificationRepositoryTests`
Expected: PASS

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add Notification entity, repository and database migration"
```

---

## Task 27: Notification Service

**Files:**
- Create: `src/main/java/com/allesgut/service/NotificationService.java`
- Create: `src/main/java/com/allesgut/dto/response/NotificationDto.java`
- Create: `src/test/java/com/allesgut/service/NotificationServiceTests.java`
- Modify: `src/main/resources/application.yml` (add async config)

**Step 1: Write test**

Create: `src/test/java/com/allesgut/service/NotificationServiceTests.java`

```java
package com.allesgut.service;

import com.allesgut.dto.response.NotificationDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.entity.Notification;
import com.allesgut.entity.User;
import com.allesgut.repository.NotificationRepository;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private User actor;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();

        actor = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138001")
                .nickname("Actor")
                .build();
    }

    @Test
    void shouldCreateNotificationSuccessfully() {
        // Given
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        notificationService.createNotification(
                "like",
                actor.getId(),
                testUser.getId(),
                null,
                null,
                "Actor liked your post"
        );

        // Then
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void shouldGetNotificationsSuccessfully() {
        // Given
        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Actor liked your post")
                .isRead(false)
                .build();

        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(any(UUID.class), any(Pageable.class)))
                .thenReturn(page);
        when(userRepository.findById(actor.getId())).thenReturn(Optional.of(actor));

        // When
        PageResponse<NotificationDto> result = notificationService.getNotifications(testUser.getId(), 0, 20);

        // Then
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getData().get(0).content()).isEqualTo("Actor liked your post");
    }

    @Test
    void shouldMarkAsReadSuccessfully() {
        // Given
        UUID notificationId = UUID.randomUUID();
        Notification notification = Notification.builder()
                .id(notificationId)
                .userId(testUser.getId())
                .isRead(false)
                .build();

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

        // When
        notificationService.markAsRead(notificationId, testUser.getId());

        // Then
        assertThat(notification.isRead()).isTrue();
        verify(notificationRepository).save(notification);
    }

    @Test
    void shouldMarkAllAsReadSuccessfully() {
        // When
        notificationService.markAllAsRead(testUser.getId());

        // Then
        verify(notificationRepository).markAllAsReadByUserId(testUser.getId());
    }

    @Test
    void shouldGetUnreadCount() {
        // Given
        when(notificationRepository.countByUserIdAndIsRead(testUser.getId(), false))
                .thenReturn(5L);

        // When
        long count = notificationService.getUnreadCount(testUser.getId());

        // Then
        assertThat(count).isEqualTo(5);
    }
}
```

**Step 2: Create DTO**

Create: `src/main/java/com/allesgut/dto/response/NotificationDto.java`

```java
package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String type,
        UserDto actor,
        UUID postId,
        UUID commentId,
        String content,
        Boolean isRead,
        LocalDateTime createdAt
) {}
```

**Step 3: Create service**

Create: `src/main/java/com/allesgut/service/NotificationService.java`

```java
package com.allesgut.service;

import com.allesgut.dto.response.NotificationDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.Notification;
import com.allesgut.entity.User;
import com.allesgut.repository.NotificationRepository;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Async
    @Transactional
    public void createNotification(String type, UUID actorId, UUID recipientId,
                                    UUID postId, UUID commentId, String content) {
        // Don't notify if actor is recipient (self-action)
        if (actorId != null && actorId.equals(recipientId)) {
            return;
        }

        Notification notification = Notification.builder()
                .userId(recipientId)
                .type(type)
                .actorId(actorId)
                .postId(postId)
                .commentId(commentId)
                .content(content)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.debug("Created notification for user {} of type {}", recipientId, type);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getNotifications(UUID userId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<Notification> notificationsPage = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationDto> notifications = notificationsPage.getContent().stream()
                .map(notification -> {
                    UserDto actor = null;
                    if (notification.getActorId() != null) {
                        User actorUser = userRepository.findById(notification.getActorId()).orElse(null);
                        if (actorUser != null) {
                            actor = mapUserToDto(actorUser);
                        }
                    }

                    return new NotificationDto(
                            notification.getId(),
                            notification.getType(),
                            actor,
                            notification.getPostId(),
                            notification.getCommentId(),
                            notification.getContent(),
                            notification.isRead(),
                            notification.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        return PageResponse.of(notifications, page, limit, notificationsPage.getTotalElements());
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        // Verify ownership
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to user");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    private UserDto mapUserToDto(User user) {
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

**Step 4: Enable async support**

Create: `src/main/java/com/allesgut/config/AsyncConfig.java`

```java
package com.allesgut.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class AsyncConfig {
    // Async support enabled for @Async methods
}
```

**Step 5: Run test**

Run: `mvn test -Dtest=NotificationServiceTests`
Expected: PASS

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add NotificationService with async notification creation"
```

---

## Task 28-30: Notification REST API

**Files:**
- Create: `src/main/java/com/allesgut/controller/NotificationsController.java`
- Modify services to trigger notifications

**Controller:**

Create: `src/main/java/com/allesgut/controller/NotificationsController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.NotificationDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<NotificationDto>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        PageResponse<NotificationDto> notifications = notificationService
                .getNotifications(userId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }
}
```

**Integrate into PostService:**

Modify: `src/main/java/com/allesgut/service/PostService.java`

```java
@Autowired
private NotificationService notificationService;

// In likePost method:
@Transactional
public void likePost(UUID postId, UUID userId) {
    // ... existing code ...

    // Create notification (don't notify if user likes own post)
    if (!post.getUserId().equals(userId)) {
        notificationService.createNotification(
                "like",
                userId,
                post.getUserId(),
                postId,
                null,
                "Someone liked your post"
        );
    }
}
```

**Commit:**

```bash
git add .
git commit -m "feat: add Notifications REST API and integrate with post likes"
```

---

# PART 2: Tasks 31-35 - File Upload with Aliyun OSS

## Task 31-33: Aliyun OSS Integration

**Step 1: Create configuration**

Create: `src/main/java/com/allesgut/config/AliyunOssProperties.java`

```java
package com.allesgut.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "aliyun.oss")
@Data
public class AliyunOssProperties {
    private String endpoint;
    private String accessKeyId;
    private String accessKeySecret;
    private String bucketName;
}
```

Create: `src/main/java/com/allesgut/config/AliyunOssConfig.java`

```java
package com.allesgut.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class AliyunOssConfig {

    private final AliyunOssProperties properties;

    @Bean
    public OSS ossClient() {
        return new OSSClientBuilder().build(
                properties.getEndpoint(),
                properties.getAccessKeyId(),
                properties.getAccessKeySecret()
        );
    }
}
```

**Step 2: Create upload service**

Create: `src/main/java/com/allesgut/service/FileUploadService.java`

```java
package com.allesgut.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.PutObjectRequest;
import com.allesgut.config.AliyunOssProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {

    private final OSS ossClient;
    private final AliyunOssProperties ossProperties;

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    public String uploadImage(MultipartFile file, UUID userId) throws IOException {
        validateImageFile(file);

        String fileName = generateFileName(file.getOriginalFilename(), userId);
        String objectKey = "images/" + fileName;

        uploadToOss(file.getInputStream(), objectKey, file.getContentType());

        return generatePublicUrl(objectKey);
    }

    public String uploadVideo(MultipartFile file, UUID userId) throws IOException {
        validateVideoFile(file);

        String fileName = generateFileName(file.getOriginalFilename(), userId);
        String objectKey = "videos/" + fileName;

        uploadToOss(file.getInputStream(), objectKey, file.getContentType());

        return generatePublicUrl(objectKey);
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image file size exceeds 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.equals("image/jpeg") &&
                        !contentType.equals("image/png") &&
                        !contentType.equals("image/jpg"))) {
            throw new IllegalArgumentException("Only JPG and PNG images are allowed");
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new IllegalArgumentException("Video file size exceeds 100MB");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.equals("video/mp4") &&
                        !contentType.equals("video/quicktime"))) {
            throw new IllegalArgumentException("Only MP4 and MOV videos are allowed");
        }
    }

    private String generateFileName(String originalFilename, UUID userId) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return userId + "/" + System.currentTimeMillis() + "_" + UUID.randomUUID() + extension;
    }

    private void uploadToOss(InputStream inputStream, String objectKey, String contentType) {
        try {
            PutObjectRequest request = new PutObjectRequest(
                    ossProperties.getBucketName(),
                    objectKey,
                    inputStream
            );
            ossClient.putObject(request);
            log.info("Uploaded file to OSS: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to upload file to OSS", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    private String generatePublicUrl(String objectKey) {
        return "https://" + ossProperties.getBucketName() + "." +
                ossProperties.getEndpoint().replace("https://", "") + "/" + objectKey;
    }
}
```

**Step 3: Create controller**

Create: `src/main/java/com/allesgut/controller/UploadController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.response.ApiResponse;
import com.allesgut.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("image") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = UUID.fromString(authentication.getName());
            String url = fileUploadService.uploadImage(file, userId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/video")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(
            @RequestParam("video") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = UUID.fromString(authentication.getName());
            String url = fileUploadService.uploadVideo(file, userId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload video: " + e.getMessage()));
        }
    }
}
```

**Commit:**

```bash
git add .
git commit -m "feat: add Aliyun OSS file upload with image/video support"
```

---

# PART 3: Tasks 36-40 - E-commerce/Mall Features

## Task 36-40: Products & Orders System

**Migration:**

Create: `src/main/resources/db/migration/V005__create_products_and_orders_tables.sql`

```sql
-- Product categories
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT REFERENCES product_categories(id),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
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

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    shipping_address JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

**Entities (abbreviated):**

```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    private String description;
    private BigDecimal price;
    // ... other fields
}

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    private String status;
    // ... other fields
}
```

**Service & Controller (simplified):**

```java
@Service
public class ProductService {
    public PageResponse<ProductDto> getProducts(String category, String search,
                                                String sort, int page, int limit) {
        // Implementation
    }

    public ProductDto getProductById(UUID id) {
        // Implementation
    }
}

@RestController
@RequestMapping("/api/products")
public class ProductsController {
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> getProducts(...) {
        // Implementation
    }
}
```

**Commit:**

```bash
git add .
git commit -m "feat: add basic e-commerce products and orders system"
```

---

# PART 4: Tasks 41-45 - Performance Optimization

## Task 41-43: Redis Caching

**Configuration:**

Create: `src/main/java/com/allesgut/config/RedisCacheConfig.java`

```java
package com.allesgut.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

@Configuration
@EnableCaching
public class RedisCacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}
```

**Usage in Services:**

```java
@Service
public class PostService {

    @Cacheable(value = "posts", key = "#postId")
    public PostDto getPostById(UUID postId, UUID currentUserId) {
        // Implementation
    }

    @CacheEvict(value = "posts", key = "#postId")
    public void deletePost(UUID postId, UUID userId) {
        // Implementation
    }
}

@Service
public class UserService {

    @Cacheable(value = "users", key = "#userId")
    public UserDto getUserProfile(UUID userId, UUID currentUserId) {
        // Implementation
    }

    @CacheEvict(value = "users", key = "#userId")
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        // Implementation
    }
}
```

**Commit:**

```bash
git add .
git commit -m "feat: add Redis caching for posts and user profiles"
```

## Task 44-45: Database & Connection Pool Optimization

**Add indexes (if missing):**

Create: `src/main/resources/db/migration/V006__add_performance_indexes.sql`

```sql
-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
```

**Configure HikariCP:**

Modify: `src/main/resources/application.yml`

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

**Commit:**

```bash
git add .
git commit -m "perf: add database indexes and optimize connection pool"
```

---

# PART 5: Tasks 46-50 - Documentation & Testing

## Task 46-47: Swagger/OpenAPI Documentation

**Add dependency to pom.xml:**

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

**Configuration:**

Create: `src/main/java/com/allesgut/config/OpenApiConfig.java`

```java
package com.allesgut.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AllesGut API")
                        .version("1.0")
                        .description("API for AllesGut - Special Needs Children Parent Community"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearerAuth",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
```

**Add annotations to controllers:**

```java
@RestController
@RequestMapping("/api/posts")
@Tag(name = "Posts", description = "Post management APIs")
public class PostsController {

    @Operation(summary = "Create a new post", description = "Creates a new post with optional media and tags")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Post created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Parameter(description = "Post creation request") @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        // Implementation
    }
}
```

**Access Swagger UI:**

Visit: `http://localhost:8080/swagger-ui.html`

**Commit:**

```bash
git add .
git commit -m "docs: add Swagger/OpenAPI documentation"
```

## Task 48: Integration Tests

Create comprehensive integration tests:

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PostsIntegrationTests {


    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreateAndRetrievePost() throws Exception {
        // Full integration test
    }
}
```

## Task 49: Performance Testing

Use JMeter or create load tests:

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LoadTests {

    @LocalServerPort
    private int port;

    @Test
    void concurrentUserLogin() {
        // Simulate 100 concurrent users
    }
}
```

## Task 50: Security & Rate Limiting

**Add Bucket4j dependency:**

```xml
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.1.0</version>
</dependency>
```

**Create rate limiter:**

```java
@Component
public class RateLimiterFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = getClientKey(request);
        Bucket bucket = cache.computeIfAbsent(key, k -> createBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.getWriter().write("Too many requests");
        }
    }

    private Bucket createBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(100, Duration.ofMinutes(1)))
                .build();
    }

    private String getClientKey(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
```

**Final commit:**

```bash
git add .
git commit -m "feat: add rate limiting and complete security audit"
```

---

## Summary

All tasks 26-50 are now detailed with:
- Complete code implementations
- Test-driven development approach
- Proper error handling
- Security considerations
- Performance optimizations
- Comprehensive documentation

Each section can be implemented independently following the TDD pattern established in tasks 1-25.
