package com.assignment.service;

import com.assignment.config.AppProperties;
import com.assignment.util.AppException;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * Manages secure storage and retrieval of uploaded assignment files.
 */
@Service
public class FileStorageService {

    private static final List<String> SUBMISSION_ALLOWED_EXTENSIONS = List.of("pdf", "doc", "docx");

    private final Path uploadPath;

    public FileStorageService(AppProperties appProperties) {
        this.uploadPath = Paths.get(appProperties.getUploadDir()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException exception) {
            throw new AppException("Could not initialize upload directory", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String storeFile(MultipartFile file) {
        return storeFile(file, SUBMISSION_ALLOWED_EXTENSIONS, "Only PDF, DOC, and DOCX files are allowed");
    }

    public String storeFile(MultipartFile file, List<String> allowedExtensions, String validationMessage) {
        if (file == null || file.isEmpty()) {
            throw new AppException("File is required", HttpStatus.BAD_REQUEST);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFileName);
        if (!allowedExtensions.contains(extension)) {
            throw new AppException(validationMessage, HttpStatus.BAD_REQUEST);
        }

        String safeFileName = UUID.randomUUID() + "_" + originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path target = uploadPath.resolve(safeFileName).normalize();

        if (!target.startsWith(uploadPath)) {
            throw new AppException("Invalid file path", HttpStatus.BAD_REQUEST);
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return target.toString();
        } catch (IOException exception) {
            throw new AppException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Resource loadAsResource(String filePath) {
        try {
            Path path = Paths.get(filePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists()) {
                throw new AppException("File not found", HttpStatus.NOT_FOUND);
            }
            return resource;
        } catch (MalformedURLException exception) {
            throw new AppException("File not found", HttpStatus.NOT_FOUND);
        }
    }

    public void deleteIfExists(String filePath) {
        if (!StringUtils.hasText(filePath)) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(filePath));
        } catch (IOException exception) {
            throw new AppException("Could not remove existing file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndex = fileName.lastIndexOf('.');
        if (lastIndex < 0 || lastIndex == fileName.length() - 1) {
            throw new AppException("File must have a valid extension", HttpStatus.BAD_REQUEST);
        }
        return fileName.substring(lastIndex + 1).toLowerCase();
    }
}