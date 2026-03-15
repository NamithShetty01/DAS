package com.assignment.repository;

import com.assignment.model.Assignment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Persistence operations for assignments.
 */
public interface AssignmentRepository extends MongoRepository<Assignment, String> {

    List<Assignment> findAllByOrderByCreatedAtDesc();

    List<Assignment> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    List<Assignment> findByCourseIdInOrderByCreatedAtDesc(List<String> courseIds);
}