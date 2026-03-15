package com.assignment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents an assignment published by a teacher.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assignments")
public class Assignment {

    @Id
    private String id;

    private String title;

    private String description;

    private String courseId;

    private LocalDateTime dueDate;

    private String createdBy;

    private LocalDateTime createdAt;

    private String attachmentFileName;

    private String attachmentFilePath;
}