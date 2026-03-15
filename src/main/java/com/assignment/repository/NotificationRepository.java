package com.assignment.repository;

import com.assignment.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

/**
 * Persistence operations for user notifications.
 */
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);
}