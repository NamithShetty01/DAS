package com.assignment.service;

import com.assignment.dto.AssignmentRequest;
import com.assignment.dto.AssignmentResponse;
import com.assignment.model.Assignment;
import com.assignment.model.Course;
import com.assignment.model.User;
import com.assignment.repository.AssignmentRepository;
import com.assignment.repository.CourseRepository;
import com.assignment.service.CourseService;
import com.assignment.security.CustomUserDetailsService;
import com.assignment.util.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles assignment creation, retrieval, and deletion.
 */
@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final FileStorageService fileStorageService;
    private final CourseService courseService;
    private final NotificationService notificationService;

    private static final List<String> ASSIGNMENT_ATTACHMENT_ALLOWED_EXTENSIONS = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt"
    );

    public AssignmentResponse createAssignment(AssignmentRequest request, String teacherEmail) {
        return createAssignment(request, teacherEmail, null);
    }

    public AssignmentResponse createAssignment(AssignmentRequest request, String teacherEmail, MultipartFile attachment) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException("Course not found", HttpStatus.NOT_FOUND));
        if (!teacher.getId().equals(course.getCreatedBy())) {
            throw new AppException("You can only create assignments for your own courses", HttpStatus.FORBIDDEN);
        }

        String storedPath = null;
        String originalFileName = null;
        if (attachment != null && !attachment.isEmpty()) {
            storedPath = fileStorageService.storeFile(
                    attachment,
                    ASSIGNMENT_ATTACHMENT_ALLOWED_EXTENSIONS,
                    "Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT"
            );
            originalFileName = attachment.getOriginalFilename();
        }

        Assignment assignment = assignmentRepository.save(Assignment.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .courseId(request.getCourseId())
                .dueDate(request.getDueDate())
                .createdBy(teacher.getId())
                .createdAt(LocalDateTime.now())
                .attachmentFileName(originalFileName)
                .attachmentFilePath(storedPath)
                .build());

            notificationService.notifyAssignmentCreated(assignment, teacher.getName(), course.getEnrolledStudentIds());

        return mapToResponse(assignment, course);
    }

    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(assignment -> mapToResponse(assignment, courseRepository.findById(assignment.getCourseId()).orElse(null)))
                .toList();
    }

    public List<AssignmentResponse> getStudentAssignments(String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        List<String> courseIds = courseRepository.findByEnrolledStudentIdsContainingOrderByCourseNameAsc(student.getId())
                .stream()
                .map(Course::getId)
                .toList();

        if (courseIds.isEmpty()) {
            return List.of();
        }

        return assignmentRepository.findByCourseIdInOrderByCreatedAtDesc(courseIds)
                .stream()
                .map(assignment -> mapToResponse(assignment, courseRepository.findById(assignment.getCourseId()).orElse(null)))
                .toList();
    }

    public List<AssignmentResponse> getTeacherAssignments(String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        return assignmentRepository.findByCreatedByOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(assignment -> mapToResponse(assignment, courseRepository.findById(assignment.getCourseId()).orElse(null)))
                .toList();
    }

    public void deleteAssignment(String assignmentId, String teacherEmail) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));

        assertTeacherOwnership(assignment, teacherEmail);
        fileStorageService.deleteIfExists(assignment.getAttachmentFilePath());
        assignmentRepository.deleteById(assignmentId);
    }

    public Assignment getAssignmentById(String assignmentId) {
        return assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));
    }

    public Resource getAttachmentAsResource(String attachmentPath) {
        return fileStorageService.loadAsResource(attachmentPath);
    }

    public void assertTeacherOwnership(Assignment assignment, String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        if (!teacher.getId().equals(assignment.getCreatedBy())) {
            throw new AppException("You are not allowed to access another teacher's assignment", HttpStatus.FORBIDDEN);
        }
    }

    public void assertStudentCanAccessAssignment(Assignment assignment, String studentEmail) {
        courseService.assertStudentEnrolledInCourse(assignment.getCourseId(), studentEmail);
    }

    private AssignmentResponse mapToResponse(Assignment assignment, Course course) {
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .courseId(assignment.getCourseId())
                .courseName(course != null ? course.getCourseName() : null)
                .facultyName(course != null ? course.getFacultyName() : null)
                .dueDate(assignment.getDueDate())
                .createdBy(assignment.getCreatedBy())
                .createdAt(assignment.getCreatedAt())
                .attachmentFileName(assignment.getAttachmentFileName())
                .attachmentDownloadUrl(assignment.getAttachmentFilePath() != null ? "/api/assignments/download/" + assignment.getId() : null)
                .build();
    }
}