package com.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Submission response enriched with assignment and student metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {

    private String id;
    private String assignmentId;
    private String assignmentTitle;
    private String studentId;
    private String studentName;
    private String studentEmail;
    private String fileName;
    private String filePath;
    private LocalDateTime submissionDate;
    private Integer marks;
    private String feedback;
    private String status;
}