package com.assignment.config;

import java.util.Objects;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.assignment.model.Role;
import com.assignment.model.User;
import com.assignment.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Seeds a default admin account for local testing.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            userRepository.save(Objects.requireNonNull(User.builder()
                    .name("Admin")
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .build()));
        }
    }
}