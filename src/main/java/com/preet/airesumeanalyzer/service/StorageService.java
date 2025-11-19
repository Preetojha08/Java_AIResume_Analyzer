package com.preet.airesumeanalyzer.service;

import java.io.InputStream;

public interface StorageService {
    String upload(String key, InputStream inputStream, long contentLength, String contentType);

    void delete(String key);
}
