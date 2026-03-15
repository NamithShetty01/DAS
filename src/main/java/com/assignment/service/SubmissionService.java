package com.assignment.service;

import com.assignment.dto.SubmissionGradeRequest;
import com.assignment.dto.SubmissionResponse;
import com.assignment.model.Assignment;
import com.assignment.model.Role;
import com.assignment.model.Submission;
import com.assignment.model.SubmissionStatus;
import com.assignment.model.User;
import com.assignment.repository.AssignmentRepository;
import com.assignment.repository.SubmissionRepository;
import com.assignment.security.CustomUserDetailsService;
import com.assignment.util.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

/**
 * Handles submission upload, retrieval, grading, and file download.
 */
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final FileStorageService fileStorageService;
    private final CourseService courseService;
    private final NotificationService notificationService;

    public SubmissionResponse uploadSubmission(String assignmentId, MultipartFile file, String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId))
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));
        courseService.assertStudentEnrolledInCourse(assignment.getCourseId(), studentEmail);

        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new AppException("Submission deadline has passed", HttpStatus.BAD_REQUEST);
        }

        String storedPath = fileStorageService.storeFile(file);

        Submission submission = submissionRepository.findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .map(existing -> {
                    fileStorageService.deleteIfExists(existing.getFilePath());
                    existing.setFileName(file.getOriginalFilename());
                    existing.setFilePath(storedPath);
                    existing.setSubmissionDate(LocalDateTime.now());
                    existing.setMarks(null);
                    existing.setFeedback(null);
                    existing.setStatus(SubmissionStatus.SUBMITTED);
                    return existing;
                })
                .orElseGet(() -> Submission.builder()
                        .assignmentId(assignmentId)
                        .studentId(student.getId())
                        .fileName(file.getOriginalFilename())
                        .filePath(storedPath)
                        .submissionDate(LocalDateTime.now())
                        .status(SubmissionStatus.SUBMITTED)
                        .build());

        Submission savedSubmission = submissionRepository.save(Objects.requireNonNull(submission));
        notificationService.notifySubmissionCreated(assignment, student);
        return mapToResponse(savedSubmission, assignment, student);
    }

    public List<SubmissionResponse> getMySubmissions(String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        return submissionRepository.findByStudentIdOrderBySubmissionDateDesc(student.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<SubmissionResponse> getSubmissionsForAssignment(String assignmentId) {
        return submissionRepository.findByAssignmentIdOrderBySubmissionDateDesc(assignmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<SubmissionResponse> getSubmissionsForAssignment(String assignmentId, String teacherEmail) {
        assertTeacherOwnsAssignment(assignmentId, teacherEmail);
        return submissionRepository.findByAssignmentIdOrderBySubmissionDateDesc(assignmentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<SubmissionResponse> getAllSubmissions() {
        return submissionRepository.findAllByOrderBySubmissionDateDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<SubmissionResponse> getAllSubmissions(String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        List<String> assignmentIds = assignmentRepository.findByCreatedByOrderByCreatedAtDesc(teacher.getId())
                .stream()
                .map(Assignment::getId)
                .toList();

        if (assignmentIds.isEmpty()) {
            return List.of();
        }

        return submissionRepository.findByAssignmentIdInOrderBySubmissionDateDesc(assignmentIds)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SubmissionResponse gradeSubmission(SubmissionGradeRequest request) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(request.getSubmissionId()))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(SubmissionStatus.GRADED);

        Submission savedSubmission = submissionRepository.save(submission);
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(submission.getAssignmentId()))
            .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));
        notificationService.notifySubmissionGraded(assignment, savedSubmission);
        return mapToResponse(savedSubmission);
    }

    public SubmissionResponse gradeSubmission(SubmissionGradeRequest request, String teacherEmail) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(request.getSubmissionId()))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));

        assertTeacherOwnsAssignment(submission.getAssignmentId(), teacherEmail);

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(SubmissionStatus.GRADED);

        Submission savedSubmission = submissionRepository.save(submission);
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(submission.getAssignmentId()))
            .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));
        notificationService.notifySubmissionGraded(assignment, savedSubmission);
        return mapToResponse(savedSubmission);
    }

    public Resource downloadSubmission(String submissionId) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        return fileStorageService.loadAsResource(submission.getFilePath());
    }

    public Resource downloadSubmission(String submissionId, String teacherEmail) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        assertTeacherOwnsAssignment(submission.getAssignmentId(), teacherEmail);
        return fileStorageService.loadAsResource(submission.getFilePath());
    }

    public Resource downloadSubmissionForUser(String submissionId, String email) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        assertSubmissionAccessAllowed(submission, email);
        return fileStorageService.loadAsResource(submission.getFilePath());
    }

    public SubmissionResponse getSubmissionById(String submissionId) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        return mapToResponse(submission);
    }

    public SubmissionResponse getSubmissionById(String submissionId, String teacherEmail) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        assertTeacherOwnsAssignment(submission.getAssignmentId(), teacherEmail);
        return mapToResponse(submission);
    }

    public SubmissionResponse getSubmissionByIdForUser(String submissionId, String email) {
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));
        assertSubmissionAccessAllowed(submission, email);
        return mapToResponse(submission);
    }

    public void deleteMySubmission(String submissionId, String studentEmail) {
        User student = customUserDetailsService.loadDomainUser(studentEmail);
        Submission submission = submissionRepository.findById(Objects.requireNonNull(submissionId))
                .orElseThrow(() -> new AppException("Submission not found", HttpStatus.NOT_FOUND));

        if (!Objects.equals(student.getId(), submission.getStudentId())) {
            throw new AppException("You are not allowed to delete another student's submission", HttpStatus.FORBIDDEN);
        }

        if (submission.getStatus() == SubmissionStatus.GRADED || submission.getMarks() != null) {
            throw new AppException("Graded submissions cannot be deleted", HttpStatus.BAD_REQUEST);
        }

        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(submission.getAssignmentId()))
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));

        if (assignment.getDueDate() != null && LocalDateTime.now().isAfter(assignment.getDueDate())) {
            throw new AppException("Cannot delete submission after the deadline", HttpStatus.BAD_REQUEST);
        }

        fileStorageService.deleteIfExists(submission.getFilePath());
        submissionRepository.deleteById(Objects.requireNonNull(submission.getId()));
    }

    private void assertSubmissionAccessAllowed(Submission submission, String email) {
        User user = customUserDetailsService.loadDomainUser(email);
        if (user.getRole() == Role.ROLE_ADMIN) {
            assertTeacherOwnsAssignment(submission.getAssignmentId(), email);
            return;
        }

        if (!Objects.equals(user.getId(), submission.getStudentId())) {
            throw new AppException("You are not allowed to access another student's submission", HttpStatus.FORBIDDEN);
        }
    }

    private void assertTeacherOwnsAssignment(String assignmentId, String teacherEmail) {
        User teacher = customUserDetailsService.loadDomainUser(teacherEmail);
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(assignmentId))
                .orElseThrow(() -> new AppException("Assignment not found", HttpStatus.NOT_FOUND));

        if (!teacher.getId().equals(assignment.getCreatedBy())) {
            throw new AppException("You are not allowed to access another teacher's submissions", HttpStatus.FORBIDDEN);
        }
    }

    private SubmissionResponse mapToResponse(Submission submission) {
        Assignment assignment = assignmentRepository.findById(Objects.requireNonNull(submission.getAssignmentId())).orElse(null);
        User student = customUserDetailsService.loadDomainUserById(submission.getStudentId());
        return mapToResponse(submission, assignment, student);
    }

    private SubmissionResponse mapToResponse(Submission submission, Assignment assignment, User student) {
        return SubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignmentId())
                .assignmentTitle(assignment != null ? assignment.getTitle() : null)
                .studentId(submission.getStudentId())
                .studentName(student != null ? student.getName() : null)
                .studentEmail(student != null ? student.getEmail() : null)
                .fileName(submission.getFileName())
                .filePath(submission.getFilePath())
                .submissionDate(submission.getSubmissionDate())
                .marks(submission.getMarks())
                .feedback(submission.getFeedback())
                .status(submission.getStatus() != null ? submission.getStatus().name() : null)
                .build();
    }
}