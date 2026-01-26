package com.allesgut.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 50, message = "Nickname must be between 1 and 50 characters")
        String nickname,

        String avatarUrl,

        @Size(max = 200, message = "Bio must not exceed 200 characters")
        String bio
) {}
