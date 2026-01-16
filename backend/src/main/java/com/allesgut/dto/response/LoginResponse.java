package com.allesgut.dto.response;

public record LoginResponse(
        String token,
        UserDto user
) {}
