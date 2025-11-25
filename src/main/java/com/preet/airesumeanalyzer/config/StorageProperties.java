package com.preet.airesumeanalyzer.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {

    private final Local local = new Local();

    @Getter
    @Setter
    public static class Local {
        /**
         * Base directory for storing uploaded resumes.
         */
        private String basePath = "./uploads/resumes";
    }
}
