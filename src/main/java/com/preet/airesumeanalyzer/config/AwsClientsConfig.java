package com.preet.airesumeanalyzer.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@EnableConfigurationProperties(AwsProperties.class)
public class AwsClientsConfig {

    @Bean
    public S3Client s3Client(AwsProperties awsProperties) {
        return S3Client.builder()
                .region(Region.of(awsProperties.getRegion()))
                .build();
    }

    @Bean
    public BedrockRuntimeClient bedrockRuntimeClient(AwsProperties awsProperties) {
        return BedrockRuntimeClient.builder()
                .region(Region.of(awsProperties.getRegion()))
                .build();
    }
}

