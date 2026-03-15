package com.assignment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Entry point for the Digital Assignment Submission System.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class AssignmentSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssignmentSystemApplication.class, args);
    }
}