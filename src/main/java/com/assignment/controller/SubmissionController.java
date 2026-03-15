package com.assignment.controller;

import com.assignment.dto.ApiResponse;
import com.assignment.dto.SubmissionGradeRequest;
import com.assignment.dto.SubmissionResponse;
import com.assignment.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Exposes submission upload, review, grading, and download APIs.
 */
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> uploadSubmission(@RequestParam String assignmentId,
                                                                            @RequestParam MultipartFile file,
                                                                            Authentication authentication) {
        SubmissionResponse response = submissionService.uploadSubmission(assignmentId, file, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assignment submitted successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getMySubmissions(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Submissions fetched successfully", submissionService.getMySubmissions(authentication.getName())));
    }

    @DeleteMapping("/{submissionId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deleteMySubmission(@PathVariable String submissionId,
                                                                Authentication authentication) {
        submissionService.deleteMySubmission(submissionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Submission deleted successfully"));
    }

    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getByAssignment(@PathVariable String assignmentId,
                                                                                  Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Assignment submissions fetched successfully", submissionService.getSubmissionsForAssignment(assignmentId, authentication.getName())));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getAllSubmissions(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("All submissions fetched successfully", submissionService.getAllSubmissions(authentication.getName())));
    }

    @PutMapping("/grade")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> gradeSubmission(@Valid @RequestBody SubmissionGradeRequest request,
                                                                           Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success("Submission graded successfully", submissionService.gradeSubmission(request, authentication.getName())));
    }

    @GetMapping("/download/{submissionId}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Resource> downloadSubmission(@PathVariable String submissionId,
                                                       Authentication authentication) {
        SubmissionResponse submission = submissionService.getSubmissionByIdForUser(submissionId, authentication.getName());
        Resource resource = submissionService.downloadSubmissionForUser(submissionId, authentication.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(submission.getFileName()).build().toString())
                .body(resource);
    }

    @GetMapping("/view/{submissionId}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public ResponseEntity<Resource> viewSubmission(@PathVariable String submissionId,
                                                   Authentication authentication) {
        SubmissionResponse submission = submissionService.getSubmissionByIdForUser(submissionId, authentication.getName());
        Resource resource = submissionService.downloadSubmissionForUser(submissionId, authentication.getName());
        MediaType mediaType = MediaTypeFactory.getMediaType(submission.getFileName())
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(submission.getFileName()).build().toString())
                .body(resource);
    }
}