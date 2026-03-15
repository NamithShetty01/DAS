package com.assignment.repository;

import com.assignment.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

/**
 * Persistence operations for courses.
 */
public interface CourseRepository extends MongoRepository<Course, String> {

	List<Course> findByCreatedByOrderByCourseNameAsc(String createdBy);

	List<Course> findByEnrolledStudentIdsContainingOrderByCourseNameAsc(String studentId);

	Optional<Course> findByJoinCode(String joinCode);
}