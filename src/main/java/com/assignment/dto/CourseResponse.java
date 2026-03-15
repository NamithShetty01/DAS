package com.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Course response returned to teacher and student clients.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private String id;
    private String courseName;
    private String facultyName;
    private String joinCode;
    private Integer studentCount;
}