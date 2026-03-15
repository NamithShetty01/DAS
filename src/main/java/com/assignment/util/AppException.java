package com.assignment.util;

import org.springframework.http.HttpStatus;

/**
 * Runtime exception carrying an HTTP status for API failures.
 */
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}