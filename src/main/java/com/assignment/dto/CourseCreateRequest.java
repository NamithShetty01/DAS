package com.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request payload for teacher course creation.
 */
@Data
public class CourseCreateRequest {

    @NotBlank(message = "Course name is required")
    private String courseName;

    @NotBlank(message = "Faculty name is required")
    private String facultyName;
}