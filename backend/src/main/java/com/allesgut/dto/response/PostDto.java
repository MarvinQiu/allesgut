package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PostDto(
        UUID id,
        UserDto author,
        String title,
        String content,
        String mediaType,
        List<String> mediaUrls,
        List<String> tags,
        Integer likesCount,
        Integer commentsCount,
        Integer favoritesCount,
        Boolean isLiked,
        Boolean isFavorited,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
