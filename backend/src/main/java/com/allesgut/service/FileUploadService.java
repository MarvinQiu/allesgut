package com.allesgut.service;

import com.aliyun.oss.OSS;
import com.aliyun.oss.model.PutObjectRequest;
import com.allesgut.config.AliyunOssProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {

    private final OSS ossClient;
    private final AliyunOssProperties ossProperties;

    public FileUploadService(@Autowired(required = false) OSS ossClient, AliyunOssProperties ossProperties) {
        this.ossClient = ossClient;
        this.ossProperties = ossProperties;
    }

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    public String uploadImage(MultipartFile file, UUID userId) throws IOException {
        if (ossClient == null) {
            throw new IllegalStateException("OSS client is not configured. Please set ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET environment variables.");
        }

        validateImageFile(file);

        String fileName = generateFileName(file.getOriginalFilename(), userId);
        String objectKey = "images/" + fileName;

        uploadToOss(file.getInputStream(), objectKey, file.getContentType());

        return generatePublicUrl(objectKey);
    }

    public String uploadVideo(MultipartFile file, UUID userId) throws IOException {
        if (ossClient == null) {
            throw new IllegalStateException("OSS client is not configured. Please set ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET environment variables.");
        }

        validateVideoFile(file);

        String fileName = generateFileName(file.getOriginalFilename(), userId);
        String objectKey = "videos/" + fileName;

        uploadToOss(file.getInputStream(), objectKey, file.getContentType());

        return generatePublicUrl(objectKey);
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("Image file size exceeds 10MB");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.equals("image/jpeg") &&
                        !contentType.equals("image/png") &&
                        !contentType.equals("image/jpg"))) {
            throw new IllegalArgumentException("Only JPG and PNG images are allowed");
        }
    }

    private void validateVideoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new IllegalArgumentException("Video file size exceeds 100MB");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                (!contentType.equals("video/mp4") &&
                        !contentType.equals("video/quicktime"))) {
            throw new IllegalArgumentException("Only MP4 and MOV videos are allowed");
        }
    }

    private String generateFileName(String originalFilename, UUID userId) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return userId + "/" + System.currentTimeMillis() + "_" + UUID.randomUUID() + extension;
    }

    private void uploadToOss(InputStream inputStream, String objectKey, String contentType) {
        try {
            PutObjectRequest request = new PutObjectRequest(
                    ossProperties.getBucketName(),
                    objectKey,
                    inputStream
            );
            ossClient.putObject(request);
            log.info("Uploaded file to OSS: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to upload file to OSS", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    private String generatePublicUrl(String objectKey) {
        return "https://" + ossProperties.getBucketName() + "." +
                ossProperties.getEndpoint().replace("https://", "") + "/" + objectKey;
    }
}
