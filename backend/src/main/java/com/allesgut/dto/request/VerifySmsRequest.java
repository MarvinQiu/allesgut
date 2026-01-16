package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifySmsRequest(
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^1[3-9]\\d{9}$", message = "Invalid phone number format")
        String phone,

        @NotBlank(message = "Verification code is required")
        @Pattern(regexp = "^\\d{6}$", message = "Verification code must be 6 digits")
        String code
) {}
