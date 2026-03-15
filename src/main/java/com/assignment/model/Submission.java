package com.assignment.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents a student submission for an assignment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
public class Submission {

    @Id
    private String id;

    private String assignmentId;

    private String studentId;

    private String fileName;

    private String filePath;

    private LocalDateTime submissionDate;

    private Integer marks;

    private String feedback;

    private SubmissionStatus status;
}