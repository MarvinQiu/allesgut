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
