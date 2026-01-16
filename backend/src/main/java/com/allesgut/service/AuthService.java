package com.allesgut.service;

import com.allesgut.dto.response.LoginResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.entity.UserSession;
import com.allesgut.repository.UserRepository;
import com.allesgut.repository.UserSessionRepository;
import com.allesgut.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SmsService smsService;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final JwtService jwtService;

    @Transactional
    public LoginResponse verifyAndLogin(String phone, String code) {
        // Verify SMS code
        boolean isValid = smsService.verifyCode(phone, code);
        if (!isValid) {
            throw new IllegalArgumentException("Invalid or expired verification code");
        }

        // Find or create user
        User user = userRepository.findByPhone(phone)
                .orElseGet(() -> createNewUser(phone));

        // Generate JWT token
        String token = jwtService.generateToken(user);

        // Save session
        UserSession session = UserSession.builder()
                .userId(user.getId())
                .token(token)
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();
        sessionRepository.save(session);

        // Return response
        UserDto userDto = mapToDto(user);
        return new LoginResponse(token, userDto);
    }

    private User createNewUser(String phone) {
        String defaultNickname = "用户" + ThreadLocalRandom.current().nextInt(100000);
        User newUser = User.builder()
                .phone(phone)
                .nickname(defaultNickname)
                .build();
        return userRepository.save(newUser);
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getPhone(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getPostsCount(),
                user.getFollowersCount(),
                user.getFollowingCount()
        );
    }
}
