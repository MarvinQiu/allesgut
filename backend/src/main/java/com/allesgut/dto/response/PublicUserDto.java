package com.allesgut.dto.response;

import java.util.UUID;

public record PublicUserDto(
        UUID id,
        String nickname,
        String avatarUrl
) {}
