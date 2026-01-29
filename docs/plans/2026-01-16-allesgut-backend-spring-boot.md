# AllesGut Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Spring Boot backend for AllesGut, a special needs children parent community platform, with authentication, posts/feed, comments, notifications, user profiles, and e-commerce.

**Architecture:** Monolithic Spring Boot REST API with PostgreSQL database, JWT authentication, Aliyun OSS for file storage, and Redis for caching hot data.

**Tech Stack:** Java 17+, Spring Boot 3.x, Spring Security, PostgreSQL, Redis, Aliyun OSS SDK, Flyway for migrations, JUnit 5 + Mockito for testing

---

## Task 1: Project Setup & Configuration

**Files:**
- Create: `pom.xml`
- Create: `src/main/resources/application.yml`
- Create: `src/main/resources/application-dev.yml`
- Create: `.env.example`

**Step 1: Write test for application context loading**

Create: `src/test/java/com/allesgut/AllesGutApplicationTests.java`

```java
package com.allesgut;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AllesGutApplicationTests {
    @Test
    void contextLoads() {
        // Test passes if context loads successfully
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test`
Expected: FAIL with "No Spring application found"

**Step 3: Create Spring Boot application class**

Create: `src/main/java/com/allesgut/AllesGutApplication.java`

```java
package com.allesgut;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AllesGutApplication {
    public static void main(String[] args) {
        SpringApplication.run(AllesGutApplication.class, args);
    }
}
```

**Step 4: Create pom.xml with dependencies**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.1</version>
        <relativePath/>
    </parent>

    <groupId>com.allesgut</groupId>
    <artifactId>allesgut-backend</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>allesgut-backend</name>
    <description>Backend for AllesGut community platform</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>

        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Aliyun OSS -->
        <dependency>
            <groupId>com.aliyun.oss</groupId>
            <artifactId>aliyun-sdk-oss</artifactId>
            <version>3.17.2</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <version>1.19.3</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**Step 5: Create application.yml**

```yaml
spring:
  application:
    name: allesgut-backend

  datasource:
    url: jdbc:postgresql://localhost:5432/allesgut
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: none
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}

jwt:
  secret: ${JWT_SECRET:defaultSecretKeyForDevelopmentOnly}
  expiration: 2592000000  # 30 days in ms

aliyun:
  oss:
    endpoint: ${ALIYUN_OSS_ENDPOINT:https://oss-cn-hangzhou.aliyuncs.com}
    access-key-id: ${ALIYUN_ACCESS_KEY_ID}
    access-key-secret: ${ALIYUN_ACCESS_KEY_SECRET}
    bucket-name: ${ALIYUN_OSS_BUCKET:allesgut-media}

logging:
  level:
    root: INFO
    com.allesgut: DEBUG
```

**Step 6: Create .env.example**

```env
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=yourSecretKeyHere
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_BUCKET=allesgut-media
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Step 7: Run test to verify it passes**

Run: `mvn test`
Expected: PASS - context loads successfully

**Step 8: Commit**

```bash
git add pom.xml src/main/java/com/allesgut/AllesGutApplication.java src/main/resources/application.yml .env.example src/test/java/com/allesgut/AllesGutApplicationTests.java
git commit -m "feat: initial Spring Boot project setup with dependencies"
```

---

## Task 2: Database Schema - Users & Authentication

**Files:**
- Create: `src/main/resources/db/migration/V001__create_users_and_auth_tables.sql`
- Create: `src/main/java/com/allesgut/entity/User.java`
- Create: `src/main/java/com/allesgut/repository/UserRepository.java`

**Step 1: Write test for User entity and repository**

Create: `src/test/java/com/allesgut/repository/UserRepositoryTests.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTests {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldSaveAndFindUserByPhone() {
        // Given
        User user = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();

        // When
        User savedUser = userRepository.save(user);
        Optional<User> foundUser = userRepository.findByPhone("13800138000");

        // Then
        assertThat(foundUser).isPresent();
        assertThat(foundUser.get().getId()).isEqualTo(savedUser.getId());
        assertThat(foundUser.get().getNickname()).isEqualTo("Test User");
    }

    @Test
    void shouldReturnEmptyWhenPhoneNotFound() {
        // When
        Optional<User> foundUser = userRepository.findByPhone("99999999999");

        // Then
        assertThat(foundUser).isEmpty();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=UserRepositoryTests`
Expected: FAIL with "User class not found"

**Step 3: Create Flyway migration script**

Create: `src/main/resources/db/migration/V001__create_users_and_auth_tables.sql`

```sql
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
```

**Step 4: Create User entity**

Create: `src/main/java/com/allesgut/entity/User.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 11)
    private String phone;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String bio;

    @Column(name = "posts_count")
    private Integer postsCount = 0;

    @Column(name = "followers_count")
    private Integer followersCount = 0;

    @Column(name = "following_count")
    private Integer followingCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**Step 5: Create UserRepository**

Create: `src/main/java/com/allesgut/repository/UserRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=UserRepositoryTests`
Expected: PASS - user is saved and retrieved by phone

**Step 7: Commit**

```bash
git add src/main/resources/db/migration/V001__create_users_and_auth_tables.sql src/main/java/com/allesgut/entity/User.java src/main/java/com/allesgut/repository/UserRepository.java src/test/java/com/allesgut/repository/UserRepositoryTests.java
git commit -m "feat: add User entity, repository, and database migration"
```

---

## Task 3: SMS Verification Service (Mock)

**Files:**
- Create: `src/main/java/com/allesgut/entity/SmsVerificationCode.java`
- Create: `src/main/java/com/allesgut/repository/SmsVerificationCodeRepository.java`
- Create: `src/main/java/com/allesgut/service/SmsService.java`
- Create: `src/main/java/com/allesgut/dto/request/SendSmsRequest.java`
- Create: `src/test/java/com/allesgut/service/SmsServiceTests.java`

**Step 1: Write test for SMS service**

Create: `src/test/java/com/allesgut/service/SmsServiceTests.java`

```java
package com.allesgut.service;

import com.allesgut.entity.SmsVerificationCode;
import com.allesgut.repository.SmsVerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsServiceTests {

    @Mock
    private SmsVerificationCodeRepository smsRepository;

    @InjectMocks
    private SmsService smsService;

    @Test
    void shouldSendSmsCodeSuccessfully() {
        // Given
        String phone = "13800138000";
        when(smsRepository.save(any(SmsVerificationCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        String code = smsService.sendVerificationCode(phone);

        // Then
        assertThat(code).hasSize(6);
        assertThat(code).matches("\\d{6}");
        verify(smsRepository).save(any(SmsVerificationCode.class));
    }

    @Test
    void shouldThrowExceptionForInvalidPhone() {
        // Given
        String invalidPhone = "123";

        // When/Then
        assertThatThrownBy(() -> smsService.sendVerificationCode(invalidPhone))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid phone number");
    }

    @Test
    void shouldVerifyCodeSuccessfully() {
        // Given
        String phone = "13800138000";
        String code = "123456";
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        when(smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code))
                .thenReturn(java.util.Optional.of(smsCode));

        // When
        boolean result = smsService.verifyCode(phone, code);

        // Then
        assertThat(result).isTrue();
        assertThat(smsCode.isUsed()).isTrue();
        verify(smsRepository).save(smsCode);
    }

    @Test
    void shouldFailVerificationForExpiredCode() {
        // Given
        String phone = "13800138000";
        String code = "123456";
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();

        when(smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code))
                .thenReturn(java.util.Optional.of(smsCode));

        // When
        boolean result = smsService.verifyCode(phone, code);

        // Then
        assertThat(result).isFalse();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=SmsServiceTests`
Expected: FAIL with "SmsService class not found"

**Step 3: Create SmsVerificationCode entity**

Create: `src/main/java/com/allesgut/entity/SmsVerificationCode.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "sms_verification_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsVerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 11)
    private String phone;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 4: Create SmsVerificationCodeRepository**

Create: `src/main/java/com/allesgut/repository/SmsVerificationCodeRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.SmsVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SmsVerificationCodeRepository extends JpaRepository<SmsVerificationCode, Long> {
    Optional<SmsVerificationCode> findTopByPhoneAndCodeOrderByCreatedAtDesc(String phone, String code);
}
```

**Step 5: Create SmsService**

Create: `src/main/java/com/allesgut/service/SmsService.java`

```java
package com.allesgut.service;

import com.allesgut.entity.SmsVerificationCode;
import com.allesgut.repository.SmsVerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRATION_MINUTES = 5;

    private final SmsVerificationCodeRepository smsRepository;
    private final Random random = new Random();

    @Transactional
    public String sendVerificationCode(String phone) {
        // Validate phone format
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("Invalid phone number format");
        }

        // Generate 6-digit code
        String code = String.format("%06d", random.nextInt(1000000));

        // Save to database
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES))
                .used(false)
                .build();

        smsRepository.save(smsCode);

        // Mock SMS send - just log the code
        log.info("SMS verification code for {}: {}", phone, code);

        return code;
    }

    @Transactional
    public boolean verifyCode(String phone, String code) {
        return smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code)
                .map(smsCode -> {
                    if (smsCode.isUsed()) {
                        return false;
                    }
                    if (smsCode.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return false;
                    }

                    // Mark as used
                    smsCode.setUsed(true);
                    smsRepository.save(smsCode);
                    return true;
                })
                .orElse(false);
    }
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=SmsServiceTests`
Expected: PASS - SMS code generation and verification work correctly

**Step 7: Commit**

```bash
git add src/main/java/com/allesgut/entity/SmsVerificationCode.java src/main/java/com/allesgut/repository/SmsVerificationCodeRepository.java src/main/java/com/allesgut/service/SmsService.java src/test/java/com/allesgut/service/SmsServiceTests.java
git commit -m "feat: implement SMS verification service with mock sending"
```

---

## Task 4: JWT Authentication Service

**Files:**
- Create: `src/main/java/com/allesgut/config/JwtProperties.java`
- Create: `src/main/java/com/allesgut/security/JwtService.java`
- Create: `src/main/java/com/allesgut/entity/UserSession.java`
- Create: `src/main/java/com/allesgut/repository/UserSessionRepository.java`
- Create: `src/test/java/com/allesgut/security/JwtServiceTests.java`

**Step 1: Write test for JWT service**

Create: `src/test/java/com/allesgut/security/JwtServiceTests.java`

```java
package com.allesgut.security;

import com.allesgut.config.JwtProperties;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("testSecretKeyThatIsLongEnoughForHS256AlgorithmRequirement");
        jwtProperties.setExpiration(3600000L); // 1 hour

        jwtService = new JwtService(jwtProperties);
    }

    @Test
    void shouldGenerateValidToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();

        // When
        String token = jwtService.generateToken(user);

        // Then
        assertThat(token).isNotEmpty();
    }

    @Test
    void shouldExtractUserIdFromToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();
        String token = jwtService.generateToken(user);

        // When
        UUID userId = jwtService.extractUserId(token);

        // Then
        assertThat(userId).isEqualTo(user.getId());
    }

    @Test
    void shouldValidateToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();
        String token = jwtService.generateToken(user);

        // When
        boolean isValid = jwtService.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        // When
        boolean isValid = jwtService.validateToken("invalid.token.here");

        // Then
        assertThat(isValid).isFalse();
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=JwtServiceTests`
Expected: FAIL with "JwtService class not found"

**Step 3: Create JWT configuration properties**

Create: `src/main/java/com/allesgut/config/JwtProperties.java`

```java
package com.allesgut.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {
    private String secret;
    private Long expiration;
}
```

**Step 4: Create JWT service**

Create: `src/main/java/com/allesgut/security/JwtService.java`

```java
package com.allesgut.security;

import com.allesgut.config.JwtProperties;
import com.allesgut.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final JwtProperties jwtProperties;

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getExpiration());

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("phone", user.getPhone())
                .claim("nickname", user.getNickname())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public UUID extractUserId(String token) {
        Claims claims = extractClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

**Step 5: Create UserSession entity**

Create: `src/main/java/com/allesgut/entity/UserSession.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 500)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 6: Create UserSessionRepository**

Create: `src/main/java/com/allesgut/repository/UserSessionRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    Optional<UserSession> findByToken(String token);
    void deleteByToken(String token);
    void deleteByUserId(UUID userId);
}
```

**Step 7: Run test to verify it passes**

Run: `mvn test -Dtest=JwtServiceTests`
Expected: PASS - JWT token generation and validation work correctly

**Step 8: Commit**

```bash
git add src/main/java/com/allesgut/config/JwtProperties.java src/main/java/com/allesgut/security/JwtService.java src/main/java/com/allesgut/entity/UserSession.java src/main/java/com/allesgut/repository/UserSessionRepository.java src/test/java/com/allesgut/security/JwtServiceTests.java
git commit -m "feat: implement JWT service for token generation and validation"
```

---

## Task 5: Authentication REST API - Send SMS

**Files:**
- Create: `src/main/java/com/allesgut/controller/AuthController.java`
- Create: `src/main/java/com/allesgut/dto/request/SendSmsRequest.java`
- Create: `src/main/java/com/allesgut/dto/response/ApiResponse.java`
- Create: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

**Step 1: Write test for send SMS endpoint**

Create: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.service.SmsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SmsService smsService;

    @Test
    void shouldSendSmsSuccessfully() throws Exception {
        // Given
        SendSmsRequest request = new SendSmsRequest("13800138000");
        when(smsService.sendVerificationCode(anyString())).thenReturn("123456");

        // When/Then
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("验证码已发送"));
    }

    @Test
    void shouldRejectInvalidPhone() throws Exception {
        // Given
        SendSmsRequest request = new SendSmsRequest("123");
        when(smsService.sendVerificationCode(anyString()))
                .thenThrow(new IllegalArgumentException("Invalid phone number format"));

        // When/Then
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=AuthControllerTests`
Expected: FAIL with "No mapping for POST /api/auth/sms/send"

**Step 3: Create DTO classes**

Create: `src/main/java/com/allesgut/dto/request/SendSmsRequest.java`

```java
package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendSmsRequest(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid phone number format")
        String phone
) {}
```

Create: `src/main/java/com/allesgut/dto/response/ApiResponse.java`

```java
package com.allesgut.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
```

**Step 4: Create AuthController**

Create: `src/main/java/com/allesgut/controller/AuthController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SmsService smsService;

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Void>> sendSms(@Valid @RequestBody SendSmsRequest request) {
        try {
            smsService.sendVerificationCode(request.phone());
            return ResponseEntity.ok(ApiResponse.success("验证码已发送"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
```

**Step 5: Create global exception handler**

Create: `src/main/java/com/allesgut/exception/GlobalExceptionHandler.java`

```java
package com.allesgut.exception;

import com.allesgut.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=AuthControllerTests`
Expected: PASS - SMS endpoint works correctly

**Step 7: Commit**

```bash
git add src/main/java/com/allesgut/controller/AuthController.java src/main/java/com/allesgut/dto/ src/main/java/com/allesgut/exception/GlobalExceptionHandler.java src/test/java/com/allesgut/controller/AuthControllerTests.java
git commit -m "feat: add SMS send endpoint with validation"
```

---

## Task 6: Authentication REST API - Verify SMS & Login

**Files:**
- Modify: `src/main/java/com/allesgut/controller/AuthController.java`
- Create: `src/main/java/com/allesgut/dto/request/VerifySmsRequest.java`
- Create: `src/main/java/com/allesgut/dto/response/LoginResponse.java`
- Create: `src/main/java/com/allesgut/dto/response/UserDto.java`
- Create: `src/main/java/com/allesgut/service/AuthService.java`
- Modify: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

**Step 1: Write test for verify SMS and login**

Add to: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

```java
@MockBean
private AuthService authService;

@Test
void shouldVerifySmsAndLoginSuccessfully() throws Exception {
    // Given
    VerifySmsRequest request = new VerifySmsRequest("13800138000", "123456");
    UserDto userDto = new UserDto(UUID.randomUUID(), "13800138000", "Test User", null, null, 0, 0, 0);
    LoginResponse response = new LoginResponse("jwt-token-here", userDto);

    when(authService.verifyAndLogin(anyString(), anyString())).thenReturn(response);

    // When/Then
    mockMvc.perform(post("/api/auth/sms/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.token").value("jwt-token-here"))
            .andExpect(jsonPath("$.data.user.phone").value("13800138000"));
}

@Test
void shouldRejectInvalidVerificationCode() throws Exception {
    // Given
    VerifySmsRequest request = new VerifySmsRequest("13800138000", "999999");

    when(authService.verifyAndLogin(anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Invalid verification code"));

    // When/Then
    mockMvc.perform(post("/api/auth/sms/verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=AuthControllerTests#shouldVerifySmsAndLoginSuccessfully`
Expected: FAIL with "No mapping for POST /api/auth/sms/verify"

**Step 3: Create request/response DTOs**

Create: `src/main/java/com/allesgut/dto/request/VerifySmsRequest.java`

```java
package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifySmsRequest(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid phone number format")
        String phone,

        @NotBlank(message = "Verification code is required")
        @Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
        String code
) {}
```

Create: `src/main/java/com/allesgut/dto/response/UserDto.java`

```java
package com.allesgut.dto.response;

import java.util.UUID;

public record UserDto(
        UUID id,
        String phone,
        String nickname,
        String avatarUrl,
        String bio,
        Integer postsCount,
        Integer followersCount,
        Integer followingCount
) {}
```

Create: `src/main/java/com/allesgut/dto/response/LoginResponse.java`

```java
package com.allesgut.dto.response;

public record LoginResponse(
        String token,
        UserDto user
) {}
```

**Step 4: Create AuthService**

Create: `src/main/java/com/allesgut/service/AuthService.java`

```java
package com.allesgut.service;

import com.allesgut.dto.response.LoginResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.entity.UserSession;
import com.allesgut.repository.UserRepository;
import com.allesgut.repository.UserSessionRepository;
import com.allesgut.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SmsService smsService;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final JwtService jwtService;
    private final Random random = new Random();

    @Transactional
    public LoginResponse verifyAndLogin(String phone, String code) {
        // Verify SMS code
        boolean isValid = smsService.verifyCode(phone, code);
        if (!isValid) {
            throw new IllegalArgumentException("Invalid or expired verification code");
        }

        // Find or create user
        User user = userRepository.findByPhone(phone)
                .orElseGet(() -> createNewUser(phone));

        // Generate JWT token
        String token = jwtService.generateToken(user);

        // Save session
        UserSession session = UserSession.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        sessionRepository.save(session);

        // Return response
        UserDto userDto = mapToDto(user);
        return new LoginResponse(token, userDto);
    }

    private User createNewUser(String phone) {
        String defaultNickname = "用户" + random.nextInt(100000);
        User newUser = User.builder()
                .phone(phone)
                .nickname(defaultNickname)
                .build();
        return userRepository.save(newUser);
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

**Step 5: Add verify endpoint to AuthController**

Modify: `src/main/java/com/allesgut/controller/AuthController.java`

```java
private final AuthService authService;

@PostMapping("/sms/verify")
public ResponseEntity<ApiResponse<LoginResponse>> verifySms(@Valid @RequestBody VerifySmsRequest request) {
    try {
        LoginResponse response = authService.verifyAndLogin(request.phone(), request.code());
        return ResponseEntity.ok(ApiResponse.success(response));
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
    }
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=AuthControllerTests`
Expected: PASS - SMS verification and login work correctly

**Step 7: Commit**

```bash
git add src/main/java/com/allesgut/controller/AuthController.java src/main/java/com/allesgut/dto/ src/main/java/com/allesgut/service/AuthService.java src/test/java/com/allesgut/controller/AuthControllerTests.java
git commit -m "feat: add SMS verification and login endpoint"
```

---

## Next Tasks Preview

The plan continues with:

- **Task 7-9**: Spring Security configuration with JWT filter
- **Task 10-15**: Posts system (entity, repository, service, controller)
- **Task 16-20**: Comments system
- **Task 21-25**: User follow/profile features
- **Task 26-30**: Notifications system
- **Task 31-35**: Aliyun OSS file upload
- **Task 36-40**: E-commerce/Mall features
- **Task 41-45**: Performance optimization (Redis caching, indexes)
- **Task 46-50**: API documentation (Swagger), additional tests

Each task follows the same TDD pattern with:
1. Write failing test
2. Verify test fails
3. Implement minimal code
4. Verify test passes
5. Commit with descriptive message

---

## Execution Notes

- Use TestContainers for integration tests with real PostgreSQL
- Follow DRY principle - extract common code to utilities
- Follow YAGNI - only implement what's in the requirements
- Commit frequently after each passing test
- Run full test suite before each commit: `mvn test`
- Use Flyway for all database schema changes
- Keep services thin - move complex logic to domain entities when appropriate

---

## Testing Strategy

**Unit Tests**: Service layer with mocked repositories
**Integration Tests**: Controller layer with @SpringBootTest + MockMvc
**Repository Tests**: @DataJpaTest with TestContainers

**Test Coverage Goals**:
- Service layer: 90%+
- Controller layer: 85%+
- Repository layer: Basic CRUD operations

---
