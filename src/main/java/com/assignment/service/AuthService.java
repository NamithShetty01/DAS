package com.assignment.service;

import com.assignment.dto.AuthResponse;
import com.assignment.dto.LoginRequest;
import com.assignment.dto.RegisterRequest;
import com.assignment.model.Role;
import com.assignment.model.User;
import com.assignment.repository.UserRepository;
import com.assignment.security.CustomUserDetailsService;
import com.assignment.security.JwtService;
import com.assignment.util.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Handles registration and login workflows.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email is already registered", HttpStatus.CONFLICT);
        }

        Role requestedRole = request.getRole();
        if (requestedRole != Role.ROLE_USER && requestedRole != Role.ROLE_ADMIN) {
            throw new AppException("Invalid role selected", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.save(Objects.requireNonNull(User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(requestedRole)
            .build()));

        String token = jwtService.generateToken(customUserDetailsService.loadUserByUsername(user.getEmail()), user.getRole().name());
        return AuthResponse.builder()
                .status("success")
                .message("User registered successfully")
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = customUserDetailsService.loadDomainUser(request.getEmail());
        String token = jwtService.generateToken(customUserDetailsService.loadUserByUsername(user.getEmail()), user.getRole().name());

        return AuthResponse.builder()
                .status("success")
                .message("Login successful")
                .token(token)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }
}