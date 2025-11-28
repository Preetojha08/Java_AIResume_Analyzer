package com.preet.airesumeanalyzer.service;

import com.preet.airesumeanalyzer.config.StorageProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private final StorageProperties storageProperties;

    @Override
    public String upload(String key, InputStream inputStream, long contentLength, String contentType) {
        Path targetFile = resolvePath(key);
        try {
            Files.createDirectories(targetFile.getParent());
            Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored resume locally at {}", targetFile);
            return key;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store resume locally", e);
        }
    }

    @Override
    public void delete(String key) {
        Path targetFile = resolvePath(key);
        try {
            Files.deleteIfExists(targetFile);
            log.info("Deleted resume file {}", targetFile);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete resume file", e);
        }
    }

    @Override
    public InputStream load(String key) {
        Path targetFile = resolvePath(key);
        try {
            return Files.newInputStream(targetFile);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load resume file", e);
        }
    }

    private Path resolvePath(String key) {
        Path basePath = Path.of(storageProperties.getLocal().getBasePath()).toAbsolutePath().normalize();
        Path target = basePath.resolve(key).normalize();
        if (!target.startsWith(basePath)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return target;
    }
}
