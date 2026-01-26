package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        String type,
        UserDto actor,
        UUID relatedId,
        String content,
        boolean isRead,
        LocalDateTime createdAt
) {}
