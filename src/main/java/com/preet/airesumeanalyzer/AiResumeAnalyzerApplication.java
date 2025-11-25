package com.preet.airesumeanalyzer;

import com.preet.airesumeanalyzer.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({StorageProperties.class})
public class AiResumeAnalyzerApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiResumeAnalyzerApplication.class, args);
    }
}

