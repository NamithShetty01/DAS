# Digital Assignment Submission System

Production-ready Spring Boot 3 application for managing assignment publishing, student submissions, and teacher grading with JWT security and MongoDB persistence.

## Technology Stack

- Spring Boot 3.3.5
- Spring Security with JWT authentication
- MongoDB with Spring Data MongoDB
- Maven
- Swagger OpenAPI
- HTML, CSS, JavaScript, Fetch API

## Project Structure

```text
assignment-system/
├── pom.xml
├── uploads/
├── src/main/java/com/assignment/
│   ├── config
│   ├── controller
│   ├── dto
│   ├── model
│   ├── repository
│   ├── security
│   ├── service
│   └── util
└── src/main/resources/
    ├── application.properties
    ├── static/
    ├── templates/
    └── uploads/
```

## Features

- Student and teacher registration
- Student and teacher login
- JWT-secured APIs with role-based authorization
- Teacher-owned course creation with unique join codes
- Student enrollment into courses using join code (Google Classroom style)
- Assignment create, list, and delete
- Teacher assignment attachment upload support (PDF, DOC, DOCX, XLS, XLSX, CSV, TXT)
- File upload for assignment submissions to the server `uploads` folder
- Teacher review, download, grading, and feedback
- In-app notification center for assignment creation, submission uploads, and grading updates
- Swagger UI at `/swagger-ui.html`
- Branded landing page plus polished student and teacher dashboards

## Configuration

Application properties are already configured with the required values:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/assignmentDB
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
app.upload.dir=uploads
```

## How to Run

1. Start MongoDB locally on `mongodb://localhost:27017`.
2. Open a terminal in the project root.
3. Run `mvn clean spring-boot:run`.
4. Open `http://localhost:8080/`.
5. Open Swagger UI at `http://localhost:8080/swagger-ui.html`.

## Core API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Assignments

- `POST /api/assignments/create` `ROLE_ADMIN`
- `GET /api/assignments/all`
- `GET /api/assignments/download/{id}` `ROLE_ADMIN` or `ROLE_USER`
- `DELETE /api/assignments/{id}` `ROLE_ADMIN`

### Courses

- `POST /api/courses/create` `ROLE_ADMIN`
- `GET /api/courses/my` `ROLE_ADMIN`
- `POST /api/courses/join` `ROLE_USER`
- `GET /api/courses` `ROLE_ADMIN` (own courses) or `ROLE_USER` (enrolled courses)

### Notifications

- `GET /api/notifications/my` `ROLE_ADMIN` or `ROLE_USER`
- `PUT /api/notifications/{notificationId}/read` `ROLE_ADMIN` or `ROLE_USER`

### Submissions

- `POST /api/submissions/upload` `ROLE_USER`
- `GET /api/submissions/my` `ROLE_USER`
- `GET /api/submissions/all` `ROLE_ADMIN`
- `GET /api/submissions/assignment/{assignmentId}` `ROLE_ADMIN`
- `PUT /api/submissions/grade` `ROLE_ADMIN`
- `GET /api/submissions/view/{submissionId}` `ROLE_ADMIN` or `ROLE_USER` (teacher-owned or own submission)
- `GET /api/submissions/download/{submissionId}` `ROLE_ADMIN` or `ROLE_USER` (teacher-owned or own submission)

## Postman Example Requests

### Register Student

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Arun Kumar",
  "email": "arun@student.com",
  "password": "Student@123",
  "role": "ROLE_USER"
}
```

### Register Teacher

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Meera Rao",
  "email": "meera.teacher@assignment.com",
  "password": "Teacher@123",
  "role": "ROLE_ADMIN"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@assignment.com",
  "password": "Teacher@123"
}
```

### Create Assignment

```http
POST /api/assignments/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

title=Mini Project Report
description=Submit the final report with architecture and testing details.
courseId=<COURSE_ID>
dueDate=2026-04-15T23:59
attachment=<Optional file: PDF/DOC/DOCX/XLS/XLSX/CSV/TXT>
```

### Create Course (Teacher)

```http
POST /api/courses/create
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "courseName": "Software Engineering",
  "facultyName": "Prof. Anil Kumar"
}
```

### Join Course By Code (Student)

```http
POST /api/courses/join
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "joinCode": "SWE4567"
}
```

### Upload Submission

```http
POST /api/submissions/upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

assignmentId=<ASSIGNMENT_ID>
file=<Select PDF/DOC/DOCX file>
```

### Grade Submission

```http
PUT /api/submissions/grade
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "submissionId": "<SUBMISSION_ID>",
  "marks": 92,
  "feedback": "Well structured answer with strong justification and clean formatting."
}
```

## Example Success Response

```json
{
  "status": "success",
  "message": "Assignment submitted successfully",
  "data": {
    "id": "65f6b07c2d5bc574b271cb0d",
    "assignmentId": "65f6af7a2d5bc574b271cb0c",
    "assignmentTitle": "Mini Project Report",
    "studentId": "65f6aef72d5bc574b271cb0b",
    "studentName": "Arun Kumar",
    "studentEmail": "arun@student.com",
    "fileName": "report.pdf",
    "filePath": "D:/DAS/assignment-system/uploads/4f8d_report.pdf",
    "submissionDate": "2026-03-13T10:30:00",
    "marks": null,
    "feedback": null,
    "status": "SUBMITTED"
  },
  "timestamp": "2026-03-13T10:30:00"
}
```

## Example MongoDB Documents

### students

```json
{
  "_id": "65f6aef72d5bc574b271cb0b",
  "name": "Arun Kumar",
  "email": "arun@student.com",
  "password": "$2a$10$hashedPasswordValue",
  "role": "ROLE_USER"
}
```

### courses

```json
{
  "_id": "65f6ae252d5bc574b271cb0a",
  "courseName": "Software Engineering",
  "facultyName": "Prof. Anil Kumar"
}
```

### assignments

```json
{
  "_id": "65f6af7a2d5bc574b271cb0c",
  "title": "Mini Project Report",
  "description": "Submit the final report with architecture and testing details.",
  "courseId": "65f6ae252d5bc574b271cb0a",
  "dueDate": "2026-04-15T23:59:00",
  "createdBy": "65f6ae112d5bc574b271cb09",
  "createdAt": "2026-03-13T09:00:00"
}
```

### submissions

```json
{
  "_id": "65f6b07c2d5bc574b271cb0d",
  "assignmentId": "65f6af7a2d5bc574b271cb0c",
  "studentId": "65f6aef72d5bc574b271cb0b",
  "fileName": "report.pdf",
  "filePath": "D:/DAS/assignment-system/uploads/4f8d_report.pdf",
  "submissionDate": "2026-03-13T10:30:00",
  "marks": 92,
  "feedback": "Well structured answer with strong justification and clean formatting.",
  "status": "GRADED"
}
```

## Frontend Pages

- `/login.html`
- `/register.html`
- `/student-dashboard.html`
- `/teacher-dashboard.html`
- `/create-assignment.html`
- `/submit-assignment.html`
- `/view-submissions.html`
- `/grade-assignment.html`

## Notes

- Users can register as either `ROLE_USER` or `ROLE_ADMIN` from the register page or the register API.
- The application no longer seeds a default `teacher@assignment.com` account.
- The seeded admin account remains available for immediate local testing as `admin@gmail.com` / `Admin@123`.
- Teachers can only view/manage their own courses, assignments, and related submissions.
- Students can only view assignments from courses they joined using course codes.
- Notifications are created when a teacher posts an assignment, a student submits an assignment, and a teacher grades a submission.
- Teachers can create assignments by typing details only, or by typing details and uploading an attachment file.
- Re-uploading a submission for the same assignment replaces the previous file.
- The runtime upload directory is the project-level `uploads` folder.
