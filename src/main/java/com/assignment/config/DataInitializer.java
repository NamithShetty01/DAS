package com.assignment.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.assignment.model.Course;
import com.assignment.model.Role;
import com.assignment.model.User;
import com.assignment.repository.CourseRepository;
import com.assignment.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seeds a default teacher account and starter courses for local testing.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            userRepository.save(User.builder()
                    .name("Admin")
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .build());
        }

        User teacher;
        if (!userRepository.existsByEmail("teacher@assignment.com")) {
            teacher = userRepository.save(User.builder()
                    .name("Default Teacher")
                    .email("teacher@assignment.com")
                    .password(passwordEncoder.encode("Teacher@123"))
                    .role(Role.ROLE_ADMIN)
                    .build());
        } else {
            teacher = userRepository.findByEmail("teacher@assignment.com").orElse(null);
        }

        if (teacher != null && courseRepository.count() == 0) {
            courseRepository.saveAll(List.of(
                    Course.builder().courseName("Data Structures").facultyName("Dr. Meera Rao").createdBy(teacher.getId()).joinCode("DATA123").enrolledStudentIds(new ArrayList<>()).build(),
                    Course.builder().courseName("Software Engineering").facultyName("Prof. Anil Kumar").createdBy(teacher.getId()).joinCode("SWE4567").enrolledStudentIds(new ArrayList<>()).build(),
                    Course.builder().courseName("Database Systems").facultyName("Dr. Neha Shah").createdBy(teacher.getId()).joinCode("DBMS890").enrolledStudentIds(new ArrayList<>()).build()
            ));
        }
    }
}