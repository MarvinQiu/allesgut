package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.dto.request.VerifySmsRequest;
import com.allesgut.dto.response.LoginResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.service.AuthService;
import com.allesgut.service.SmsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SmsService smsService;

    @MockBean
    private AuthService authService;

    @Test
    void shouldSendSmsSuccessfully() throws Exception {
        // Given
        SendSmsRequest request = new SendSmsRequest("13800138000");
        when(smsService.sendVerificationCode(anyString())).thenReturn("123456");

        // When/Then
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("验证码已发送"));
    }

    @Test
    void shouldRejectInvalidPhone() throws Exception {
        // Given
        SendSmsRequest request = new SendSmsRequest("123");
        when(smsService.sendVerificationCode(anyString()))
                .thenThrow(new IllegalArgumentException("Invalid phone number format"));

        // When/Then
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldRejectInvalidPhoneFormat() throws Exception {
        // Given - invalid phone that won't pass @Pattern validation
        SendSmsRequest request = new SendSmsRequest("123");

        // When/Then - validation should reject before service is called
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void shouldVerifySmsAndLoginSuccessfully() throws Exception {
        // Given
        VerifySmsRequest request = new VerifySmsRequest("13800138000", "123456");
        UserDto userDto = new UserDto(UUID.randomUUID(), "13800138000", "Test User", null, null, 0, 0, 0);
        LoginResponse response = new LoginResponse("jwt-token-here", userDto);

        when(authService.verifyAndLogin(anyString(), anyString())).thenReturn(response);

        // When/Then
        mockMvc.perform(post("/api/auth/sms/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt-token-here"))
                .andExpect(jsonPath("$.data.user.phone").value("13800138000"));
    }

    @Test
    void shouldRejectInvalidVerificationCode() throws Exception {
        // Given
        VerifySmsRequest request = new VerifySmsRequest("13800138000", "999999");

        when(authService.verifyAndLogin(anyString(), anyString()))
                .thenThrow(new IllegalArgumentException("Invalid verification code"));

        // When/Then
        mockMvc.perform(post("/api/auth/sms/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldLogoutSuccessfully() throws Exception {
        // Given
        doNothing().when(authService).logout(anyString());

        // When/Then
        mockMvc.perform(post("/api/auth/logout")
                        .with(user("test-user-id"))
                        .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
