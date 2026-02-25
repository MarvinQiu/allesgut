package com.allesgut.service;

import com.allesgut.entity.User;
import com.allesgut.repository.UserRepository;
import com.allesgut.repository.UserSessionRepository;
import com.allesgut.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceAvatarDefaultsTests {

    @Mock
    private SmsService smsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSessionRepository sessionRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void shouldSetDefaultAvatarUrlWhenCreatingNewUser() {
        when(smsService.verifyCode(anyString(), anyString())).thenReturn(true);
        when(userRepository.findByPhone(anyString())).thenReturn(Optional.empty());
        when(jwtService.generateToken(any(User.class))).thenReturn("token");

        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.verifyAndLogin("13800138000", "123456");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        assertThat(userCaptor.getValue().getAvatarUrl())
                .isEqualTo("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face");
    }
}
