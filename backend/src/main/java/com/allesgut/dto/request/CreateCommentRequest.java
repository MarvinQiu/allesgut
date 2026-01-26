package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateCommentRequest(
        @NotBlank(message = "Comment content is required")
        @Size(max = 500, message = "Comment must not exceed 500 characters")
        String content,

        UUID parentId,

        @Size(max = 5, message = "Maximum 5 mentions allowed")
        List<UUID> mentions
) {}
