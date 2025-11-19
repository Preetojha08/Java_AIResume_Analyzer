package com.preet.airesumeanalyzer.service;

import com.preet.airesumeanalyzer.config.AwsProperties;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    private final S3Client s3Client;
    private final AwsProperties awsProperties;

    @Override
    public String upload(String key, InputStream inputStream, long contentLength, String contentType) {
        String bucket = awsProperties.getS3().getBucketName();
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();
        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, contentLength));
        log.info("Uploaded resume to S3 bucket={}, key={}", bucket, key);
        return key;
    }

    @Override
    public void delete(String key) {
        String bucket = awsProperties.getS3().getBucketName();
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
        log.info("Deleted resume from S3 bucket={}, key={}", bucket, key);
    }
}
