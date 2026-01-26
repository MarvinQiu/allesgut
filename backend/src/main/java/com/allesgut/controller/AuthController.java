package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.dto.request.VerifySmsRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.LoginResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.repository.UserRepository;
import com.allesgut.service.AuthService;
import com.allesgut.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SmsService smsService;
    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Void>> sendSms(@Valid @RequestBody SendSmsRequest request) {
        smsService.sendVerificationCode(request.phone());
        return ResponseEntity.ok(ApiResponse.success("验证码已发送"));
    }

    @PostMapping("/sms/verify")
    public ResponseEntity<ApiResponse<LoginResponse>> verifySms(@Valid @RequestBody VerifySmsRequest request) {
        LoginResponse response = authService.verifyAndLogin(request.phone(), request.code());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Not authenticated"));
        }

        UUID userId = UUID.fromString(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserDto userDto = new UserDto(
                user.getId(),
                user.getPhone(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getPostsCount(),
                user.getFollowersCount(),
                user.getFollowingCount()
        );
        return ResponseEntity.ok(ApiResponse.success(userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
