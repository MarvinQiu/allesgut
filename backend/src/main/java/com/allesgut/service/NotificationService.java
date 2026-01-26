package com.allesgut.service;

import com.allesgut.dto.response.NotificationDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.Notification;
import com.allesgut.entity.User;
import com.allesgut.repository.NotificationRepository;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(UUID userId, String type, UUID actorId, UUID relatedId, String content) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .actorId(actorId)
                .relatedId(relatedId)
                .content(content)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationDto> getNotifications(UUID userId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<Notification> notificationsPage = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationDto> notifications = notificationsPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.of(notifications, page, limit, notificationsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to mark this notification as read");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        Pageable pageable = PageRequest.of(0, 100);
        Page<Notification> unreadNotifications;

        do {
            unreadNotifications = notificationRepository
                    .findByUserIdOrderByCreatedAtDesc(userId, pageable);

            unreadNotifications.getContent().stream()
                    .filter(n -> !n.isRead())
                    .forEach(n -> n.setRead(true));

            notificationRepository.saveAll(unreadNotifications.getContent());

        } while (unreadNotifications.hasNext());
    }

    private NotificationDto mapToDto(Notification notification) {
        UserDto actor = null;
        if (notification.getActorId() != null) {
            User actorUser = userRepository.findById(notification.getActorId()).orElse(null);
            if (actorUser != null) {
                actor = new UserDto(
                        actorUser.getId(),
                        actorUser.getPhone(),
                        actorUser.getNickname(),
                        actorUser.getAvatarUrl(),
                        actorUser.getBio(),
                        actorUser.getPostsCount(),
                        actorUser.getFollowersCount(),
                        actorUser.getFollowingCount()
                );
            }
        }

        return new NotificationDto(
                notification.getId(),
                notification.getType(),
                actor,
                notification.getRelatedId(),
                notification.getContent(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
