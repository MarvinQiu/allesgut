package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendSmsRequest(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid phone number format")
        String phone
) {}
