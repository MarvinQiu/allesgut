package com.allesgut.service;

import com.allesgut.dto.response.LoginResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.entity.UserSession;
import com.allesgut.repository.UserRepository;
import com.allesgut.repository.UserSessionRepository;
import com.allesgut.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
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

        // Find or create user with race condition handling
        User user;
        try {
            user = userRepository.findByPhone(phone)
                    .orElseGet(() -> createNewUser(phone));
        } catch (DataIntegrityViolationException e) {
            // Race condition: another thread created the user, fetch it
            user = userRepository.findByPhone(phone)
                    .orElseThrow(() -> new IllegalStateException("Failed to create or find user"));
        }

        // Generate JWT token
        String token = jwtService.generateToken(user);

        // Invalidate old sessions for security
        sessionRepository.deleteByUserId(user.getId());

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

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    private UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                maskPhone(user.getPhone()),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getPostsCount(),
                user.getFollowersCount(),
                user.getFollowingCount()
        );
    }
}
