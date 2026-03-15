package com.assignment.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.assignment.dto.CourseCreateRequest;
import com.assignment.dto.CourseMembersResponse;
import com.assignment.dto.CourseResponse;
import com.assignment.model.Course;
import com.assignment.model.User;
import com.assignment.repository.CourseRepository;
import com.assignment.security.CustomUserDetailsService;
import com.assignment.util.AppException;

import lombok.RequiredArgsConstructor;

/**
 * Handles teacher-owned course creation and student enrollment by join code.
 */
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final CustomUserDetailsService customUserDetailsService;

    public CourseResponse createCourse(CourseCreateRequest request, String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);

        Course course = courseRepository.save(Course.builder()
                .courseName(request.getCourseName())
                .facultyName(request.getFacultyName())
                .createdBy(teacher.getId())
                .joinCode(generateUniqueJoinCode())
                .enrolledStudentIds(new ArrayList<>())
                .build());

        return mapToResponse(course, true);
    }

    public List<CourseResponse> getTeacherCourses(String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        return courseRepository.findByCreatedByOrderByCourseNameAsc(teacher.getId())
                .stream()
                .map(course -> mapToResponse(course, true))
                .toList();
    }

    public List<CourseResponse> getStudentCourses(String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        return courseRepository.findByEnrolledStudentIdsContainingOrderByCourseNameAsc(student.getId())
                .stream()
                .map(course -> mapToResponse(course, false))
                .toList();
    }

    public CourseResponse joinCourseByCode(String studentEmail, String joinCode) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        Course course = courseRepository.findByJoinCode(joinCode.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new AppException("Invalid join code", HttpStatus.NOT_FOUND));

        if (!course.getEnrolledStudentIds().contains(student.getId())) {
            course.getEnrolledStudentIds().add(student.getId());
            courseRepository.save(course);
        }

        return mapToResponse(course, false);
    }

    public Course getCourseById(String courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException("Course not found", HttpStatus.NOT_FOUND));
    }

    public void assertTeacherOwnsCourse(String courseId, String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        Course course = getCourseById(courseId);

        if (!teacher.getId().equals(course.getCreatedBy())) {
            throw new AppException("You are not allowed to access another teacher's course", HttpStatus.FORBIDDEN);
        }
    }

    public void assertStudentEnrolledInCourse(String courseId, String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        Course course = getCourseById(courseId);

        if (!course.getEnrolledStudentIds().contains(student.getId())) {
            throw new AppException("You are not enrolled in this course", HttpStatus.FORBIDDEN);
        }
    }

    public CourseMembersResponse getCourseMembersPublic(String courseId) {
        Course course = getCourseById(courseId);
        User teacher = resolveUserReference(course.getCreatedBy());
        String teacherName = teacher != null
                ? teacher.getName()
                : (course.getFacultyName() != null ? course.getFacultyName() : "Teacher");
        String teacherEmail = teacher != null
                ? teacher.getEmail()
                : (course.getCreatedBy() != null && course.getCreatedBy().contains("@") ? course.getCreatedBy() : "");

        List<String> enrolledStudentRefs = course.getEnrolledStudentIds() != null
                ? course.getEnrolledStudentIds()
                : Collections.emptyList();

        List<CourseMembersResponse.MemberDto> students = enrolledStudentRefs.stream()
                .map(this::mapStudentRef)
                .toList();

        return CourseMembersResponse.builder()
                .teacherName(teacherName)
                .teacherEmail(teacherEmail)
                .students(students)
                .build();
    }

    private CourseMembersResponse.MemberDto mapStudentRef(String studentRef) {
        User student = resolveUserReference(studentRef);
        if (student != null) {
            return new CourseMembersResponse.MemberDto(student.getName(), student.getEmail());
        }

        if (studentRef != null && studentRef.contains("@")) {
            String inferredName = studentRef.substring(0, studentRef.indexOf('@'));
            return new CourseMembersResponse.MemberDto(inferredName, studentRef);
        }

        return new CourseMembersResponse.MemberDto("Unknown", "");
    }

    private User resolveUserReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return null;
        }

        try {
            return customUserDetailsService.loadDomainUserById(reference);
        } catch (Exception ignored) {
            // Reference might be an email in legacy data.
        }

        try {
            return customUserDetailsService.loadDomainUser(reference);
        } catch (Exception ignored) {
            return null;
        }
    }

    private CourseResponse mapToResponse(Course course, boolean includeJoinCode) {
        return CourseResponse.builder()
                .id(course.getId())
                .courseName(course.getCourseName())
                .facultyName(course.getFacultyName())
                .joinCode(includeJoinCode ? course.getJoinCode() : null)
                .studentCount(course.getEnrolledStudentIds() != null ? course.getEnrolledStudentIds().size() : 0)
                .build();
    }

    private String generateUniqueJoinCode() {
        String code;
        do {
            code = randomCode();
        } while (courseRepository.findByJoinCode(code).isPresent());
        return code;
    }

    private String randomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random random = new Random();
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 7; i++) {
            builder.append(chars.charAt(random.nextInt(chars.length())));
        }
        return builder.toString();
    }
}