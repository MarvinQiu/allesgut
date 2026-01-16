package com.allesgut.service;

import com.allesgut.entity.SmsVerificationCode;
import com.allesgut.repository.SmsVerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    private static final int CODE_LENGTH = 6;
    private static final int CODE_EXPIRATION_MINUTES = 5;

    private final SmsVerificationCodeRepository smsRepository;
    private final Random random = new Random();

    @Transactional
    public String sendVerificationCode(String phone) {
        // Validate phone format
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException("Invalid phone number format");
        }

        // Generate 6-digit code
        String code = String.format("%06d", random.nextInt(1000000));

        // Save to database
        SmsVerificationCode smsCode = SmsVerificationCode.builder()
                .phone(phone)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES))
                .used(false)
                .build();

        smsRepository.save(smsCode);

        // Mock SMS send - just log the code
        log.info("SMS verification code for {}: {}", phone, code);

        return code;
    }

    @Transactional
    public boolean verifyCode(String phone, String code) {
        return smsRepository.findTopByPhoneAndCodeOrderByCreatedAtDesc(phone, code)
                .map(smsCode -> {
                    if (smsCode.isUsed()) {
                        return false;
                    }
                    if (smsCode.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return false;
                    }

                    // Mark as used
                    smsCode.setUsed(true);
                    smsRepository.save(smsCode);
                    return true;
                })
                .orElse(false);
    }
}
