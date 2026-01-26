package com.allesgut.config;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class AliyunOssConfig {

    private final AliyunOssProperties properties;

    @Bean
    @ConditionalOnProperty(name = "aliyun.oss.access-key-id", matchIfMissing = false)
    public OSS ossClient() {
        // Only create if access key is not empty
        if (properties.getAccessKeyId() == null || properties.getAccessKeyId().trim().isEmpty()) {
            return null;
        }

        return new OSSClientBuilder().build(
                properties.getEndpoint(),
                properties.getAccessKeyId(),
                properties.getAccessKeySecret()
        );
    }
}
