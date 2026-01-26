package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UserDto author,
        UUID postId,
        UUID parentId,
        String content,
        Integer likesCount,
        Boolean isLiked,
        List<UserDto> mentions,
        List<CommentDto> replies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
