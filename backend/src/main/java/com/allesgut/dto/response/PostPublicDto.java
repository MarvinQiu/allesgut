package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PostPublicDto(
        UUID id,
        PublicUserDto author,
        String title,
        String content,
        String mediaType,
        List<String> mediaUrls,
        String coverUrl,
        List<String> tags,
        Integer likesCount,
        Integer commentsCount,
        Integer favoritesCount,
        Boolean isLiked,
        Boolean isFavorited,
        Boolean authorIsFollowed,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
