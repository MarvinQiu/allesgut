package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must not exceed 100 characters")
        String title,

        @NotBlank(message = "Content is required")
        @Size(max = 1000, message = "Content must not exceed 1000 characters")
        String content,

        String mediaType,

        @Size(max = 9, message = "Maximum 9 media files allowed")
        List<String> mediaUrls,

        @Size(max = 5, message = "Maximum 5 tags allowed")
        List<String> tags
) {}
