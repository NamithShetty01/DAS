package com.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Assignment response enriched with course metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private String id;
    private String title;
    private String description;
    private String courseId;
    private String courseName;
    private String facultyName;
    private LocalDateTime dueDate;
    private String createdBy;
    private LocalDateTime createdAt;
    private String attachmentFileName;
    private String attachmentDownloadUrl;
}