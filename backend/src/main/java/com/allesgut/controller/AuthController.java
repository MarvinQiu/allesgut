package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SmsService smsService;

    @PostMapping("/sms/send")
    public ResponseEntity<ApiResponse<Void>> sendSms(@Valid @RequestBody SendSmsRequest request) {
        try {
            smsService.sendVerificationCode(request.phone());
            return ResponseEntity.ok(ApiResponse.success("验证码已发送"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
