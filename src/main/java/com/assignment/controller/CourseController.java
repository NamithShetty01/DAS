package com.assignment.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.assignment.dto.ApiResponse;
import com.assignment.dto.CourseCreateRequest;
import com.assignment.dto.CourseJoinRequest;
import com.assignment.dto.CourseMembersResponse;
import com.assignment.dto.CourseResponse;
import com.assignment.service.CourseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Exposes read-only course APIs for the UI.
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(@Valid @RequestBody CourseCreateRequest request,
                                                                    Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Course created successfully", courseService.createCourse(request, authentication.getName())));
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CourseResponse>> joinCourse(@Valid @RequestBody CourseJoinRequest request,
                                                                  Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Joined course successfully", courseService.joinCourseByCode(authentication.getName(), request.getJoinCode())));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCourses(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        List<CourseResponse> courses = isAdmin
                ? courseService.getTeacherCourses(authentication.getName())
                : courseService.getStudentCourses(authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Courses fetched successfully", courses));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getMyCourses(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Courses fetched successfully", courseService.getTeacherCourses(authentication.getName())));
    }

    @GetMapping("/{courseId}/members")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<ApiResponse<CourseMembersResponse>> getCourseMembers(@PathVariable String courseId) {
        return ResponseEntity.ok(ApiResponse.success("Members fetched", courseService.getCourseMembersPublic(courseId)));
    }
}