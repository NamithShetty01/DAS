package com.assignment.controller;

import com.assignment.dto.ApiResponse;
import com.assignment.dto.AssignmentRequest;
import com.assignment.dto.AssignmentResponse;
import com.assignment.model.Assignment;
import com.assignment.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

/**
 * Exposes assignment management APIs.
 */
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping(value = "/create", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(@Valid @RequestBody AssignmentRequest request,
                                                                            Authentication authentication) {
        AssignmentResponse response = assignmentService.createAssignment(request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assignment created successfully", response));
    }

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignmentWithAttachment(@RequestParam String title,
                                                                                           @RequestParam String description,
                                                                                           @RequestParam String courseId,
                                                                                           @RequestParam String dueDate,
                                                                                           @RequestParam(required = false) MultipartFile attachment,
                                                                                           Authentication authentication) {
        AssignmentRequest request = new AssignmentRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setCourseId(courseId);
        try {
            request.setDueDate(LocalDateTime.parse(dueDate));
        } catch (DateTimeParseException exception) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid dueDate format. Use ISO format like 2026-04-15T23:59"));
        }

        AssignmentResponse response = assignmentService.createAssignment(request, authentication.getName(), attachment);
        return ResponseEntity.ok(ApiResponse.success("Assignment created successfully", response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAllAssignments(Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);

        List<AssignmentResponse> assignments = isAdmin
                ? assignmentService.getTeacherAssignments(authentication.getName())
            : assignmentService.getStudentAssignments(authentication.getName());

        return ResponseEntity.ok(ApiResponse.success("Assignments fetched successfully", assignments));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getMyAssignments(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Assignments fetched successfully", assignmentService.getTeacherAssignments(authentication.getName())));
    }

    @GetMapping("/download/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Resource> downloadAssignmentAttachment(@PathVariable String id, Authentication authentication) {
        Assignment assignment = assignmentService.getAssignmentById(id);

        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        if (isAdmin) {
            assignmentService.assertTeacherOwnership(assignment, authentication.getName());
        } else {
            assignmentService.assertStudentCanAccessAssignment(assignment, authentication.getName());
        }

        if (assignment.getAttachmentFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = assignmentService.getAttachmentAsResource(assignment.getAttachmentFilePath());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(assignment.getAttachmentFileName()).build().toString())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(@PathVariable String id, Authentication authentication) {
        assignmentService.deleteAssignment(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assignment deleted successfully"));
    }
}