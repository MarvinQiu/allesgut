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
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Transactional
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class NotificationRepositoryTests {

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
    void shouldFindNotificationsByUser() {
        // Given
        Notification notification1 = Notification.builder()
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Notification 1")
                .isRead(false)
                .build();

        Notification notification2 = Notification.builder()
                .userId(testUser.getId())
                .type("comment")
                .actorId(actor.getId())
                .content("Notification 2")
                .isRead(false)
                .build();

        notificationRepository.save(notification1);
        notificationRepository.save(notification2);

        // When
        Page<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(testUser.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(notifications.getContent()).hasSize(2);
    }

    @Test
    void shouldCountUnreadNotifications() {
        // Given
        Notification read = Notification.builder()
                .userId(testUser.getId())
                .type("like")
                .actorId(actor.getId())
                .content("Read notification")
                .isRead(true)
                .build();

        Notification unread = Notification.builder()
                .userId(testUser.getId())
                .type("comment")
                .actorId(actor.getId())
                .content("Unread notification")
                .isRead(false)
                .build();

        notificationRepository.save(read);
        notificationRepository.save(unread);

        // When
        long unreadCount = notificationRepository.countByUserIdAndIsRead(testUser.getId(), false);

        // Then
        assertThat(unreadCount).isEqualTo(1);
    }
}
