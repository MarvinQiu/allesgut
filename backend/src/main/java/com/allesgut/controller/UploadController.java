package com.allesgut.controller;

import com.allesgut.dto.response.ApiResponse;
import com.allesgut.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileUploadService fileUploadService;

    @PostMapping("/image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("image") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = UUID.fromString(authentication.getName());
            String url = fileUploadService.uploadImage(file, userId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/video")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadVideo(
            @RequestParam("video") MultipartFile file,
            Authentication authentication) {
        try {
            UUID userId = UUID.fromString(authentication.getName());
            String url = fileUploadService.uploadVideo(file, userId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
        } catch (IOException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to upload video: " + e.getMessage()));
        }
    }
}
