package com.assignment.repository;

import com.assignment.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * Persistence operations for submissions.
 */
public interface SubmissionRepository extends MongoRepository<Submission, String> {

    List<Submission> findByStudentIdOrderBySubmissionDateDesc(String studentId);

    List<Submission> findByAssignmentIdOrderBySubmissionDateDesc(String assignmentId);

    List<Submission> findByAssignmentIdInOrderBySubmissionDateDesc(List<String> assignmentIds);

    List<Submission> findAllByOrderBySubmissionDateDesc();

    Optional<Submission> findByAssignmentIdAndStudentId(String assignmentId, String studentId);
}