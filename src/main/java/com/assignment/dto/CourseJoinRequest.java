package com.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request payload for student joining a course by code.
 */
@Data
public class CourseJoinRequest {

    @NotBlank(message = "Join code is required")
    private String joinCode;
}