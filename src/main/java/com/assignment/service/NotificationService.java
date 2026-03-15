package com.assignment.service;

import com.assignment.dto.NotificationResponse;
import com.assignment.model.Assignment;
import com.assignment.model.Notification;
import com.assignment.model.NotificationType;
import com.assignment.model.Submission;
import com.assignment.model.User;
import com.assignment.repository.NotificationRepository;
import com.assignment.security.CustomUserDetailsService;
import com.assignment.util.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Handles notification creation and retrieval.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CustomUserDetailsService customUserDetailsService;

    public void notifyAssignmentCreated(Assignment assignment, String teacherName, List<String> studentIds) {
        if (studentIds == null || studentIds.isEmpty()) {
            return;
        }

        String title = "New assignment posted";
        String message = teacherName + " posted: " + assignment.getTitle();

        List<Notification> notifications = studentIds.stream()
                .distinct()
                .map(studentId -> buildNotification(studentId, NotificationType.ASSIGNMENT_CREATED, title, message, assignment.getId()))
                .toList();

        notificationRepository.saveAll(notifications);
    }

    public void notifySubmissionCreated(Assignment assignment, User student) {
        String title = "New submission received";
        String message = student.getName() + " submitted assignment: " + assignment.getTitle();
        Notification notification = buildNotification(
                assignment.getCreatedBy(),
                NotificationType.SUBMISSION_CREATED,
                title,
                message,
                assignment.getId()
        );
        notificationRepository.save(notification);
    }

    public void notifySubmissionGraded(Assignment assignment, Submission submission) {
        String title = "Submission graded";
        String message = "Your submission for '" + assignment.getTitle() + "' has been graded.";
        Notification notification = buildNotification(
                submission.getStudentId(),
                NotificationType.SUBMISSION_GRADED,
                title,
                message,
                submission.getId()
        );
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = customUserDetailsService.loadDomainUser(userEmail);
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public NotificationResponse markAsRead(String notificationId, String userEmail) {
        User user = customUserDetailsService.loadDomainUser(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException("Notification not found", HttpStatus.NOT_FOUND));

        if (!user.getId().equals(notification.getRecipientUserId())) {
            throw new AppException("You are not allowed to update this notification", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        return mapToResponse(notificationRepository.save(notification));
    }

    private Notification buildNotification(String recipientUserId,
                                           NotificationType type,
                                           String title,
                                           String message,
                                           String referenceId) {
        return Notification.builder()
                .recipientUserId(recipientUserId)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build();
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType() != null ? notification.getType().name() : null)
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .createdAt(notification.getCreatedAt())
                .read(notification.isRead())
                .build();
    }
}