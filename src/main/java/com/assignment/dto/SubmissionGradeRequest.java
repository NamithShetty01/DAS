package com.assignment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request payload for teacher grading.
 */
@Data
public class SubmissionGradeRequest {

    @NotBlank(message = "Submission id is required")
    private String submissionId;

    @NotNull(message = "Marks are required")
    @Min(value = 0, message = "Marks must be at least 0")
    @Max(value = 100, message = "Marks must be at most 100")
    private Integer marks;

    @NotBlank(message = "Feedback is required")
    private String feedback;
}