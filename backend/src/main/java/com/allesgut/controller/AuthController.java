package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.dto.request.VerifySmsRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.LoginResponse;
import com.allesgut.service.AuthService;
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
    private final AuthService authService;

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
}
