package com.allesgut.controller;

import com.allesgut.dto.request.SendSmsRequest;
import com.allesgut.service.SmsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
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

    @Test
    void shouldSendSmsSuccessfully() throws Exception {
        // Given
        SendSmsRequest request = new SendSmsRequest("13800138000");
        when(smsService.sendVerificationCode(anyString())).thenReturn("123456");

        // When/Then
        mockMvc.perform(post("/api/auth/sms/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
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
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
