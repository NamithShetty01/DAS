package com.assignment.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Type-safe configuration for custom application settings.
 */
@Data
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();

    @NotBlank
    private String uploadDir = "uploads";

    @Data
    public static class Jwt {

        @NotBlank
        private String secret;

        @Min(60000)
        private long expirationMs;
    }
}