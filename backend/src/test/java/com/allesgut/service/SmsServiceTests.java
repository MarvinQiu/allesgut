package com.allesgut.service;

import com.allesgut.entity.SmsVerificationCode;
import com.allesgut.repository.SmsVerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsServiceTests {

    @Mock
    private SmsVerificationCodeRepository smsRepository;

    @InjectMocks
    private SmsService smsService;

    @Test
    void shouldSendSmsCodeSuccessfully() {
        // Given
        String phone = "13800138000";
        when(smsRepository.save(any(SmsVerificationCode.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // When
        String code = smsService.sendVerificationCode(phone);

        // Then
        assertThat(code).hasSize(6);
        assertThat(code).matches("\\d{6}");
        verify(smsRepository).save(any(SmsVerificationCode.class));
    }

    @Test
    void shouldThrowExceptionForInvalidPhone() {
        // Given
        String invalidPhone = "123";

        // When/Then
        assertThatThrownBy(() -> smsService.sendVerificationCode(invalidPhone))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid phone number");
    }

    @Test
    void shouldVerifyCodeSuccessfully() {
        // Given
        String phone = "13800138000";
        String code = "123456";
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        when(smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code))
                .thenReturn(java.util.Optional.of(smsCode));

        // When
        boolean result = smsService.verifyCode(phone, code);

        // Then
        assertThat(result).isTrue();
        assertThat(smsCode.isUsed()).isTrue();
        verify(smsRepository).save(smsCode);
    }

    @Test
    void shouldFailVerificationForExpiredCode() {
        // Given
        String phone = "13800138000";
        String code = "123456";
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();

        when(smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code))
                .thenReturn(java.util.Optional.of(smsCode));

        // When
        boolean result = smsService.verifyCode(phone, code);

        // Then
        assertThat(result).isFalse();
    }
}
