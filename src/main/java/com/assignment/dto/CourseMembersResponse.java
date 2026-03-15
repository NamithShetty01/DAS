package com.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Returns the teacher and enrolled students for a course.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseMembersResponse {

    private String teacherName;
    private String teacherEmail;
    private List<MemberDto> students;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MemberDto {
        private String name;
        private String email;
    }
}
