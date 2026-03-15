const API = {
    auth: "/api/auth",
    assignments: "/api/assignments",
    submissions: "/api/submissions",
    courses: "/api/courses",
    notifications: "/api/notifications"
};

function saveSession(payload) {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("role", payload.role);
    localStorage.setItem("name", payload.name);
    localStorage.setItem("email", payload.email);
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
}

function getToken() {
    return localStorage.getItem("token");
}

function getRole() {
    return localStorage.getItem("role");
}

function getUserName() {
    return localStorage.getItem("name") || "User";
}

function authHeaders(extra = {}) {
    const headers = { ...extra };
    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function request(url, options = {}) {
    const config = { method: "GET", ...options };
    config.headers = authHeaders(config.headers || {});

    if (config.body && !(config.body instanceof FormData) && !config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (!response.ok) {
        const message = payload?.message || payload || "Request failed";
        throw new Error(message);
    }

    return payload;
}

async function downloadSubmissionFile(submissionId, fileName) {
    const response = await fetch(`${API.submissions}/download/${submissionId}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        let message = "Download failed";
        try {
            const payload = await response.json();
            message = payload.message || message;
        } catch (error) {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

async function viewSubmissionFile(submissionId) {
    const response = await fetch(`${API.submissions}/view/${submissionId}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        let message = "View failed";
        try {
            const payload = await response.json();
            message = payload.message || message;
        } catch (error) {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

async function deleteMySubmission(submissionId) {
    await request(`${API.submissions}/${submissionId}`, {
        method: "DELETE"
    });
}

async function downloadAssignmentAttachment(assignmentId, fileName) {
    const response = await fetch(`${API.assignments}/download/${assignmentId}`, {
        headers: authHeaders()
    });

    if (!response.ok) {
        let message = "Download failed";
        try {
            const payload = await response.json();
            message = payload.message || message;
        } catch (error) {
            message = response.statusText || message;
        }
        throw new Error(message);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "assignment-attachment";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function setStatus(targetId, message, type = "success") {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }
    target.className = `status-message status-${type}`;
    target.textContent = message;
}

function logout() {
    clearSession();
    window.location.href = "/login.html";
}

function ensureAuthenticated() {
    if (!getToken()) {
        window.location.href = "/login.html";
        return false;
    }
    return true;
}

function ensureRole(requiredRole) {
    if (!ensureAuthenticated()) {
        return false;
    }
    if (requiredRole && getRole() !== requiredRole) {
        window.location.href = getRole() === "ROLE_ADMIN" ? "/teacher-dashboard.html" : "/student-dashboard.html";
        return false;
    }
    return true;
}

function injectUserSummary() {
    const name = getUserName();
    document.querySelectorAll("[data-user-name]").forEach((node) => {
        node.textContent = name;
    });
    const avatarEl = document.getElementById("gc-user-avatar");
    if (avatarEl) {
        avatarEl.textContent = getInitials(name);
    }
}

const _GC_ICONS = {
    home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    courses: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.38c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    list: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
    grade: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
};
const _GC_BRAND_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="courseflow-brand" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#b45f44"/><stop offset="100%" stop-color="#2c6b5b"/></linearGradient></defs><rect width="24" height="24" rx="7" fill="url(#courseflow-brand)"/><path d="M6 8.5c0-1.1.9-2 2-2h8.6c.53 0 1.04.21 1.41.59l1.4 1.41V17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8.5Z" fill="rgba(255,255,255,.92)"/><path d="M17 9h-2.25a1.75 1.75 0 0 1-1.75-1.75V5.5" fill="none" stroke="#b45f44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12h6M9 15h4" fill="none" stroke="#2d3a3a" stroke-width="1.4" stroke-linecap="round"/></svg>`;
const _GC_HAMBURGER = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`;

async function injectSidebar() {
    const page = document.body.id;
    const isTeacher = getRole() === "ROLE_ADMIN";
    const home = isTeacher ? "/teacher-dashboard.html" : "/student-dashboard.html";

    const teacherLinks = [
        { href: "/teacher-dashboard.html", icon: "home", label: "Home", active: "teacher-dashboard-page" },
    ];
    const studentLinks = [
        { href: "/student-dashboard.html", icon: "home", label: "Home", active: "student-dashboard-page" },
    ];

    const links = isTeacher ? teacherLinks : studentLinks;
    const navHtml = links.map((item) => {
        const isActive = Array.isArray(item.active)
            ? item.active.includes(page)
            : page === item.active;
        return `
        <a class="gc-nav-item${isActive ? " active" : ""}" href="${item.href}">
            <span class="gc-nav-icon">${_GC_ICONS[item.icon]}</span>
            <span class="gc-nav-label">${item.label}</span>
        </a>`;
    }).join("");

    const sidebar = document.createElement("nav");
    sidebar.className = "gc-sidebar";
    sidebar.id = "gc-sidebar";
    sidebar.innerHTML = `
        <div class="gc-sidebar-header">
            <button class="gc-hamburger" id="gc-toggle" aria-label="Toggle navigation">${_GC_HAMBURGER}</button>
            <a class="gc-brand-link" href="${home}">${_GC_BRAND_SVG} CourseFlow</a>
        </div>
        <div class="gc-sidebar-body">
            <div class="gc-nav">${navHtml}</div>
            <div class="gc-sidebar-courses">
                <p class="gc-sidebar-section-title">Your Courses</p>
                <div class="gc-sidebar-course-list" id="gc-sidebar-course-list">
                    <span class="gc-sidebar-loading">Loading courses...</span>
                </div>
            </div>
        </div>
        <div class="gc-nav-divider"></div>
        <button class="gc-nav-item" id="gc-sidebar-logout">
            <span class="gc-nav-icon">${_GC_ICONS.logout}</span>
            <span class="gc-nav-label">Log out</span>
        </button>`;

    const gcApp = document.querySelector(".gc-app");
    if (!gcApp) return;
    gcApp.insertBefore(sidebar, gcApp.firstChild);

    document.getElementById("gc-sidebar-logout").addEventListener("click", logout);

    const overlay = document.getElementById("gc-overlay");
    const isMobileLayout = window.matchMedia("(max-width: 900px)");
    const openNav = () => { sidebar.classList.add("open"); overlay?.classList.add("visible"); };
    const closeNav = () => { sidebar.classList.remove("open"); overlay?.classList.remove("visible"); };
    const syncSidebarMode = () => {
        if (isMobileLayout.matches) {
            document.body.classList.remove("sidebar-collapsed");
            closeNav();
        }
    };

    document.getElementById("gc-toggle").addEventListener("click", () => {
        if (isMobileLayout.matches) {
            sidebar.classList.contains("open") ? closeNav() : openNav();
            return;
        }
        document.body.classList.toggle("sidebar-collapsed");
    });
    document.getElementById("gc-toggle-mobile")?.addEventListener("click", openNav);
    overlay?.addEventListener("click", closeNav);
    syncSidebarMode();
    isMobileLayout.addEventListener?.("change", syncSidebarMode);

    await populateSidebarCourses(isTeacher);
}

function sidebarCourseLink(course, isTeacher) {
    const safeName = course.courseName || "Course";
    const initials = getInitials(safeName);
    const href = courseStreamHref(course);
    const currentCourseId = new URLSearchParams(window.location.search).get("courseId");
    const activeClass = currentCourseId && String(currentCourseId) === String(course.id) ? " is-active" : "";
    const subtitle = isTeacher
        ? `${course.studentCount ?? 0} students`
        : (course.facultyName || "Faculty");
    return `
        <a class="gc-sidebar-course-item${activeClass}" href="${href}" title="${safeName}" style="--course-color:${getCourseColor(course.id)}">
            <span class="gc-sidebar-course-avatar">${initials}</span>
            <span class="gc-sidebar-course-body">
                <span class="gc-sidebar-course-name">${safeName}</span>
                <span class="gc-sidebar-course-sub">${subtitle}</span>
            </span>
        </a>
    `;
}

function courseStreamHref(course) {
    const safeName = course?.courseName || "Course";
    return `/course-stream.html?courseId=${encodeURIComponent(course.id)}&courseName=${encodeURIComponent(safeName)}`;
}

async function populateSidebarCourses(isTeacher) {
    const list = document.getElementById("gc-sidebar-course-list");
    if (!list) {
        return;
    }

    try {
        const endpoint = isTeacher ? `${API.courses}/my` : API.courses;
        const response = await request(endpoint);
        const courses = response.data || [];

        if (!courses.length) {
            list.innerHTML = `<span class="gc-sidebar-empty">No courses yet.</span>`;
            return;
        }

        list.innerHTML = courses.map((course) => sidebarCourseLink(course, isTeacher)).join("");
    } catch (error) {
        list.innerHTML = `<span class="gc-sidebar-empty">Unable to load courses.</span>`;
    }
}

function formatDate(value) {
    if (!value) {
        return "-";
    }
    return new Date(value).toLocaleString();
}

function formatRelativeDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} hr ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString();
}

function getInitials(value) {
    return (value || "Class")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}
const COURSE_COLORS = [
    '#1565c0', '#d32f2f', '#e65100', '#2e7d32',
    '#006064', '#4a148c', '#37474f', '#ad1457',
    '#4527a0', '#00695c', '#558b2f', '#ef6c00',
];

function getCourseColor(id) {
    let hash = 0;
    for (let i = 0; i < (id || '').length; i++) {
        hash = ((hash * 31) + id.charCodeAt(i)) | 0;
    }
    return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}

function statusBadge(status) {
    const safe = status || "SUBMITTED";
    const className = safe === "GRADED" ? "status-graded" : "status-submitted";
    return `<span class="status-pill ${className}">${safe}</span>`;
}

function assignmentCard(assignment) {
    const attachmentActions = assignment.attachmentDownloadUrl
        ? `<button class="btn btn-secondary assignment-download-btn" type="button" data-assignment-id="${assignment.id}" data-file-name="${assignment.attachmentFileName || "assignment-attachment"}">Open Material</button>`
        : "";
    const submitAction = getRole() === "ROLE_USER"
        ? `<a class="btn btn-primary" href="/submit-assignment.html?assignmentId=${encodeURIComponent(assignment.id)}">Submit this assignment</a>`
        : "";

    return `
        <article class="stream-card">
            <div class="stream-card-head">
                <div class="course-avatar">${getInitials(assignment.courseName || assignment.title)}</div>
                <div>
                    <h3>${assignment.title}</h3>
                    <p class="stream-meta">${assignment.courseName || assignment.courseId} · ${assignment.facultyName || "Faculty not listed"}</p>
                </div>
                <span class="chip">Due ${formatRelativeDate(assignment.dueDate)}</span>
            </div>
            <p class="stream-copy">${assignment.description}</p>
            <div class="stream-footer">
                ${assignment.attachmentFileName ? `<span class="stream-file">${assignment.attachmentFileName}</span>` : `<span class="stream-file muted">No attachment</span>`}
                <div class="button-row">
                    ${attachmentActions}
                    ${submitAction}
                </div>
            </div>
        </article>
    `;
}

function teacherCourseCard(course) {
    const color = getCourseColor(course.id);
    const initials = getInitials(course.courseName);
    return `
        <article class="gc-course-card">
            <div class="gc-course-banner" style="background:${color}">
                <p class="gc-course-section">Teaching Studio</p>
                <h3 class="gc-course-name">${course.courseName}</h3>
                <p class="gc-course-faculty">${course.facultyName}</p>
                <div class="gc-course-avatar-wrap">
                    <div class="gc-course-avatar">${initials}</div>
                </div>
            </div>
            <div class="gc-course-footer">
                <div class="gc-course-meta">
                    <span class="gc-course-code">Access Code: ${course.joinCode || '\u2014'}</span>
                    <span class="gc-course-count">${course.studentCount ?? 0} students</span>
                </div>
                <div class="gc-course-actions">
                    <a class="btn btn-secondary course-more-btn" href="${courseStreamHref(course)}" title="Open course details">
                        More info
                    </a>
                </div>
            </div>
        </article>
    `;
}

function notificationCard(notification) {
    return `
        <article class="notification-card${notification.read ? ' read' : ''}">
            <div class="notification-header">
                <p class="notification-title">${notification.title || notification.type || 'Notification'}</p>
                <div class="notification-time">${formatRelativeDate(notification.createdAt)}</div>
            </div>
            <p>${notification.message}</p>
            ${notification.read ? "" : `<div class="button-row mt-16"><button class="btn btn-secondary mark-read-btn" type="button" data-notification-id="${notification.id}">Mark as Read</button></div>`}
        </article>
    `;
}

async function loadAssignments(targetId) {
    const container = document.getElementById(targetId);
    if (!container) {
        return [];
    }
    const response = await request(`${API.assignments}/all`);
    const assignments = response.data || [];
    container.innerHTML = assignments.length
        ? assignments.map(assignmentCard).join("")
        : `<div class="empty-state">No assignments available yet.</div>`;
    bindAssignmentDownloadButtons();
    return assignments;
}

async function loadCourses(selectId) {
    const select = document.getElementById(selectId);
    if (!select) {
        return;
    }
    const response = await request(API.courses);
    const courses = response.data || [];
    select.innerHTML = courses.map((course) => `<option value="${course.id}">${course.courseName} - ${course.facultyName}</option>`).join("");
}

async function loadTeacherCourses(targetId = "teacher-course-list") {
    const container = document.getElementById(targetId);
    if (!container) {
        return [];
    }

    const response = await request(`${API.courses}/my`);
    const courses = response.data || [];
    container.innerHTML = courses.length
        ? courses.map(teacherCourseCard).join("")
        : `<div class="empty-state">No courses created yet.</div>`;
    return courses;
}

async function loadStudentCourses(targetId = "student-course-list") {
    const container = document.getElementById(targetId);
    if (!container) {
        return [];
    }

    const response = await request(API.courses);
    const courses = response.data || [];
    container.innerHTML = courses.length
        ? courses.map(studentCourseCard).join("")
        : `<div class="empty-state">You have not joined any course yet.</div>`;
    return courses;
}

async function markNotificationRead(notificationId) {
    await request(`${API.notifications}/${notificationId}/read`, {
        method: "PUT"
    });
}

async function loadNotifications(targetId, countTargetId) {
    const container = document.getElementById(targetId);
    const countTarget = countTargetId ? document.getElementById(countTargetId) : null;
    if (!container) {
        return [];
    }

    const response = await request(`${API.notifications}/my`);
    const notifications = response.data || [];
    const unreadCount = notifications.filter((item) => !item.read).length;

    if (countTarget) {
        countTarget.textContent = unreadCount;
    }

    container.innerHTML = notifications.length
        ? notifications.slice(0, 6).map(notificationCard).join("")
        : `<div class="empty-state">No notifications yet.</div>`;

    bindNotificationButtons(targetId, countTargetId);
    return notifications;
}

async function loadSubmissionsTable(targetId, endpoint, allowDownload = false, allowGradeAction = false, allowView = false) {
    const tbody = document.getElementById(targetId);
    if (!tbody) {
        return [];
    }

    const response = await request(endpoint);
    const submissions = response.data || [];

    tbody.innerHTML = submissions.length
        ? submissions.map((submission) => {
            const actions = [];
            if (allowView) {
                actions.push(`<button class="btn btn-accent view-btn" type="button" data-submission-id="${submission.id}">View</button>`);
            }
            if (allowDownload) {
                actions.push(`<button class="btn btn-secondary download-btn" type="button" data-submission-id="${submission.id}" data-file-name="${submission.fileName}">Download</button>`);
            }
            if (allowGradeAction) {
                actions.push(`<a class="btn btn-primary" href="/grade-assignment.html?submissionId=${encodeURIComponent(submission.id)}">Grade</a>`);
            }
            return `
                <tr>
                    <td>${submission.assignmentTitle || submission.assignmentId}</td>
                    <td>${submission.studentName || "-"}</td>
                    <td>${submission.studentEmail || "-"}</td>
                    <td>${submission.fileName || "-"}</td>
                    <td>${formatDate(submission.submissionDate)}</td>
                    <td>${submission.marks ?? "Pending"}</td>
                    <td>${submission.feedback || "Pending"}</td>
                    <td>${statusBadge(submission.status)}</td>
                    <td>${actions.join(" ") || "-"}</td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="9"><div class="empty-state">No submissions found.</div></td></tr>`;

    bindDownloadButtons();
    bindViewButtons();

    return submissions;
}

function renderSubmissionsTable(targetId, submissions, allowDownload = false, allowGradeAction = false, allowView = false) {
    const tbody = document.getElementById(targetId);
    if (!tbody) {
        return;
    }

    tbody.innerHTML = submissions.length
        ? submissions.map((submission) => {
            const actions = [];
            if (allowView) {
                actions.push(`<button class="btn btn-accent view-btn" type="button" data-submission-id="${submission.id}">View</button>`);
            }
            if (allowDownload) {
                actions.push(`<button class="btn btn-secondary download-btn" type="button" data-submission-id="${submission.id}" data-file-name="${submission.fileName}">Download</button>`);
            }
            if (allowGradeAction) {
                actions.push(`<a class="btn btn-primary" href="/grade-assignment.html?submissionId=${encodeURIComponent(submission.id)}">Grade</a>`);
            }
            return `
                <tr>
                    <td>${submission.assignmentTitle || submission.assignmentId}</td>
                    <td>${submission.studentName || "-"}</td>
                    <td>${submission.studentEmail || "-"}</td>
                    <td>${submission.fileName || "-"}</td>
                    <td>${formatDate(submission.submissionDate)}</td>
                    <td>${submission.marks ?? "Pending"}</td>
                    <td>${submission.feedback || "Pending"}</td>
                    <td>${statusBadge(submission.status)}</td>
                    <td>${actions.join(" ") || "-"}</td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="9"><div class="empty-state">No submissions found.</div></td></tr>`;

    bindDownloadButtons();
    bindViewButtons();
}

function setViewSubmissionsHeader(courseName) {
    const title = document.getElementById("submission-page-title");
    const description = document.getElementById("submission-page-description");
    if (!title || !description) {
        return;
    }

    if (courseName) {
        title.textContent = `${courseName} Submissions`;
        description.textContent = "Submitted work for this course only.";
        return;
    }

    title.textContent = "Submissions";
    description.textContent = "Filter by assignment, open files, and move into grading.";
}

function studentCourseCard(course) {
    const color = getCourseColor(course.id);
    const initials = getInitials(course.courseName);
    return `
        <article class="gc-course-card">
            <div class="gc-course-banner" style="background:${color}">
                <p class="gc-course-section">Learning Studio</p>
                <h3 class="gc-course-name">${course.courseName}</h3>
                <p class="gc-course-faculty">${course.facultyName}</p>
                <div class="gc-course-avatar-wrap">
                    <div class="gc-course-avatar">${initials}</div>
                </div>
            </div>
            <div class="gc-course-footer">
                <div class="gc-course-meta">
                    <span class="gc-course-count">Enrolled</span>
                </div>
                <div class="gc-course-actions">
                    <a class="btn btn-secondary course-more-btn" href="${courseStreamHref(course)}" title="Open course details">
                        More info
                    </a>
                </div>
            </div>
        </article>
    `;
}

function renderCourseHero(course, isTeacher) {
    const target = document.getElementById("course-hero");
    if (!target || !course) return;

    const color = getCourseColor(course.id);
    target.innerHTML = `
        <div class="gc-course-hero" style="background:${color}">
            <div class="gc-course-hero-body">
                <p class="gc-course-hero-section">${course.facultyName || "Course"}</p>
                <h1 class="gc-course-hero-title">${course.courseName}</h1>
            </div>
            <div class="gc-course-hero-avatar">${getInitials(course.courseName)}</div>
        </div>
    `;
}

function renderCourseSidePanel(course, assignments, submissions, isTeacher) {
    const target = document.getElementById("course-side-panel");
    if (!target || !course) return;

    const gradedCount = submissions.filter((s) => s.status === "GRADED").length;

    if (isTeacher) {
        target.innerHTML = `
            <article class="gc-side-card">
                <div class="gc-side-card-head">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v8l2.5-1.5L13 12V4h5v16z"/></svg>
                    <h3>Access code</h3>
                </div>
                <div class="gc-class-code-box">
                    <span class="gc-class-code-value">${course.joinCode || "—"}</span>
                    <button class="gc-icon-btn" title="Copy code" onclick="navigator.clipboard.writeText('${course.joinCode || ""}');this.title='Copied!'">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </button>
                </div>
            </article>
            <article class="gc-side-card mt-12">
                <div class="gc-side-stats">
                    <div class="gc-side-stat"><span>${assignments.length}</span><label>Assignments</label></div>
                    <div class="gc-side-stat"><span>${submissions.length}</span><label>Submissions</label></div>
                    <div class="gc-side-stat"><span>${gradedCount}</span><label>Graded</label></div>
                </div>
                <div class="gc-side-actions">
                    <a class="btn btn-primary btn-block" href="/create-assignment.html?courseId=${encodeURIComponent(course.id)}&courseName=${encodeURIComponent(course.courseName)}">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="margin-right:6px"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        Post Assignment
                    </a>
                    <a class="btn btn-secondary btn-block" href="/view-submissions.html?courseId=${encodeURIComponent(course.id)}&courseName=${encodeURIComponent(course.courseName)}">View Submissions</a>
                </div>
            </article>
        `;
        return;
    }

    // Student side panel
    const outstanding = assignments.length - submissions.length;
    target.innerHTML = `
        <article class="gc-side-card">
            <div class="gc-side-card-head">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <h3>Your work</h3>
            </div>
            <div class="gc-work-stats">
                <div class="gc-work-stat ${outstanding > 0 ? "gc-work-stat--warn" : ""}">
                    <span class="gc-work-stat-num">${outstanding > 0 ? outstanding : 0}</span>
                    <span class="gc-work-stat-lbl">Missing</span>
                </div>
                <div class="gc-work-stat">
                    <span class="gc-work-stat-num">${submissions.length}</span>
                    <span class="gc-work-stat-lbl">Turned in</span>
                </div>
                <div class="gc-work-stat gc-work-stat--ok">
                    <span class="gc-work-stat-num">${gradedCount}</span>
                    <span class="gc-work-stat-lbl">Graded</span>
                </div>
            </div>
            ${assignments.length
                ? `<p class="muted" style="font-size:.85rem;margin-top:12px">To submit, open a specific assignment and click <strong>Turn in</strong>.</p>`
                : `<p class="muted" style="font-size:.85rem;margin-top:12px">No assignments available yet.</p>`}
        </article>
    `;
}

function bindCourseSubmissionForm(course, assignments) {
    const form = document.getElementById("course-submission-form");
    const assignmentSelect = document.getElementById("course-assignment-id");
    const fileInput = document.getElementById("course-file");
    if (!form || !assignmentSelect || !fileInput) {
        return;
    }

    populateAssignmentSelect("course-assignment-id", assignments);
    assignmentSelect.value = assignments[0]?.id || "";
    renderSelectedAssignmentDetails(assignments, assignmentSelect.value, "course-selected-assignment-detail");

    assignmentSelect.addEventListener("change", (event) => {
        renderSelectedAssignmentDetails(assignments, event.target.value, "course-selected-assignment-detail");
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!fileInput.files[0]) {
            setStatus("course-submission-status", "Choose a file before submitting.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("assignmentId", assignmentSelect.value);
        formData.append("file", fileInput.files[0]);

        try {
            await request(`${API.submissions}/upload`, {
                method: "POST",
                body: formData
            });

            const submissionsResponse = await request(`${API.submissions}/my`);
            const allSubmissions = submissionsResponse.data || [];
            const assignmentIds = new Set(assignments.map((item) => String(item.id)));
            const courseSubmissions = allSubmissions.filter((item) => assignmentIds.has(String(item.assignmentId)));

            renderCourseSidePanel(course, assignments, courseSubmissions, false);
            bindCourseSubmissionForm(course, assignments);
            setStatus("course-submission-status", "Assignment submitted successfully.");
        } catch (error) {
            setStatus("course-submission-status", error.message, "error");
        }
    });
}

function courseStreamAssignmentCard(assignment, isTeacher) {
    const attachmentAction = assignment.attachmentFileName
        ? `<button class="btn btn-secondary assignment-download-btn" type="button" data-assignment-id="${assignment.id}" data-file-name="${assignment.attachmentFileName}">Open Material</button>`
        : "";
    const primaryAction = isTeacher
        ? `<a class="btn btn-primary" href="/view-submissions.html?courseId=${encodeURIComponent(assignment.courseId)}&courseName=${encodeURIComponent(assignment.courseName || "Course")}">View submissions</a>`
        : `<a class="btn btn-primary" href="/submit-assignment.html?assignmentId=${encodeURIComponent(assignment.id)}&courseId=${encodeURIComponent(assignment.courseId)}&courseName=${encodeURIComponent(assignment.courseName || "Course")}">Turn in</a>`;

    return `
        <article class="gc-stream-post">
            <div class="gc-stream-post-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            </div>
            <div class="gc-stream-post-body">
                <div class="gc-stream-post-header">
                    <div>
                        <p class="gc-stream-post-author">${assignment.facultyName || "Instructor"} posted a new assignment</p>
                        <p class="gc-stream-post-time">${formatRelativeDate(assignment.createdAt || assignment.dueDate)}</p>
                    </div>
                    <span class="gc-due-chip">Due ${formatRelativeDate(assignment.dueDate)}</span>
                </div>
                <h3 class="gc-stream-post-title">${assignment.title}</h3>
                ${assignment.description ? `<p class="gc-stream-post-desc">${assignment.description}</p>` : ""}
                <div class="gc-stream-post-actions">
                    ${attachmentAction}
                    ${primaryAction}
                </div>
            </div>
        </article>
    `;
}

function renderCourseStream(assignments, isTeacher) {
    const target = document.getElementById("course-stream-list");
    if (!target) return;
    target.innerHTML = assignments.length
        ? assignments.map((a) => courseStreamAssignmentCard(a, isTeacher)).join("")
        : `<div class="empty-state">No assignments have been posted yet.<br>Check back later or use the Classwork tab.</div>`;
    bindAssignmentDownloadButtons();
}

function renderClassworkTab(assignments, isTeacher, course) {
    const container = document.getElementById("course-classwork-list");
    if (!container) return;

    const sorted = [...assignments].sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0));

    container.innerHTML = `
        ${isTeacher ? `
        <div class="gc-classwork-toolbar">
            <a class="btn btn-primary" href="/create-assignment.html?courseId=${encodeURIComponent(course.id)}&courseName=${encodeURIComponent(course.courseName)}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="margin-right:6px"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                Create
            </a>
        </div>` : ""}
        <div class="gc-classwork-topic">
            <span class="gc-classwork-topic-label">All assignments</span>
            <hr class="gc-classwork-topic-line">
        </div>
        <div class="gc-classwork-list">
            ${sorted.length ? sorted.map((a) => classworkItem(a, isTeacher)).join("") : `<div class="empty-state">No classwork posted yet.</div>`}
        </div>
    `;
    bindAssignmentDownloadButtons();
}

function classworkItem(assignment, isTeacher) {
    const dueLabel = assignment.dueDate ? `Due ${formatDate(assignment.dueDate)}` : "No due date";
    const attachBtn = assignment.attachmentFileName
        ? `<button class="gc-icon-btn assignment-download-btn" title="Download attachment" data-assignment-id="${assignment.id}" data-file-name="${assignment.attachmentFileName}">
               <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M5 20h14v-2H5v2zm7-4l5-5h-3V4h-4v7H7l5 5z"/></svg>
           </button>`
        : "";
    const turnInBtn = !isTeacher
        ? `<a class="btn btn-secondary" href="/submit-assignment.html?assignmentId=${encodeURIComponent(assignment.id)}&courseId=${encodeURIComponent(assignment.courseId)}">Turn in</a>`
        : `<a class="gc-icon-btn" href="/view-submissions.html?courseId=${encodeURIComponent(assignment.courseId)}&courseName=${encodeURIComponent(assignment.courseName || "")}" title="View submissions">
               <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.34C18 2.54 15.96.5 13.4.5c-1.2 0-2.3.46-3.12 1.22L9 3 7.72 1.72C6.9.96 5.8.5 4.6.5 2.04.5 0 2.54 0 5.1c0 .44.11.88.18 1.32L2 4v2H0v2h2v1H0v2h2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8h2v-2h-2V6zm-2 13H6V7h12v12z"/></svg>
           </a>`;

    return `
        <div class="gc-classwork-item">
            <div class="gc-classwork-item-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
            </div>
            <div class="gc-classwork-item-body">
                <p class="gc-classwork-item-title">${assignment.title}</p>
                <p class="gc-classwork-item-meta">${dueLabel}</p>
            </div>
            <div class="gc-classwork-item-actions">
                ${attachBtn}
                ${turnInBtn}
            </div>
        </div>
    `;
}

function renderPeopleTab(members, course) {
    const container = document.getElementById("course-people-list");
    if (!container) return;

    if (!members) {
        container.innerHTML = `<div class="empty-state">Unable to load class members.</div>`;
        return;
    }

    const studentRows = (members.students || []).map((s) => `
        <div class="gc-people-row">
            <div class="gc-people-avatar" style="background:${getCourseColor(s.email)}">${getInitials(s.name || s.email)}</div>
            <div class="gc-people-info">
                <p class="gc-people-name">${s.name || "Student"}</p>
                <p class="gc-people-email">${s.email}</p>
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <div class="gc-people-section">
            <h3 class="gc-people-section-title">Teachers</h3>
            <div class="gc-people-list">
                <div class="gc-people-row">
                    <div class="gc-people-avatar" style="background:#e65100">${getInitials(members.teacherName || members.teacherEmail)}</div>
                    <div class="gc-people-info">
                        <p class="gc-people-name">${members.teacherName || "Teacher"}</p>
                        <p class="gc-people-email">${members.teacherEmail || ""}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="gc-people-section">
            <h3 class="gc-people-section-title">Participants <span class="gc-people-count">${(members.students || []).length}</span></h3>
            <div class="gc-people-list">
                ${(members.students || []).length ? studentRows : `<div class="empty-state">No students have joined this course yet.</div>`}
            </div>
        </div>
    `;
}

function populateAssignmentSelect(selectId, assignments) {
    const select = document.getElementById(selectId);
    if (!select) {
        return;
    }
    if (!assignments.length) {
        select.innerHTML = `<option value="">No assignments available</option>`;
        return;
    }
    select.innerHTML = assignments.map((assignment) => `<option value="${assignment.id}">${assignment.title} (${assignment.courseName || assignment.courseId})</option>`).join("");
}

function renderSelectedAssignmentDetails(assignments, selectedAssignmentId, targetId = "selected-assignment-detail") {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    const selected = assignments.find((item) => item.id === selectedAssignmentId);
    if (!selected) {
        target.innerHTML = `<div class="empty-state">Select an assignment to view details before uploading.</div>`;
        return;
    }

    const dueLabel = selected.dueDate ? formatDate(selected.dueDate) : "No due date";
    target.innerHTML = `
        <article class="info-card assignment-focus-card">
            <p class="chip">Selected Assignment</p>
            <h3>${selected.title}</h3>
            <p class="muted">${selected.courseName || selected.courseId} · ${selected.facultyName || "Faculty not listed"}</p>
            <p class="muted"><strong>Due:</strong> ${dueLabel}</p>
            <p>${selected.description || "No description provided."}</p>
            ${selected.attachmentFileName ? `<p class="stream-file">Attachment: ${selected.attachmentFileName}</p>` : `<p class="stream-file muted">No attachment provided.</p>`}
        </article>
    `;
}

function renderMySubmissionLog(targetId, submissions) {
    const tbody = document.getElementById(targetId);
    if (!tbody) {
        return;
    }

    tbody.innerHTML = submissions.length
        ? submissions.map((submission) => {
            const isGraded = submission.status === "GRADED" || submission.marks !== null;
            const deleteAction = isGraded
                ? ""
                : `<button class="btn btn-secondary delete-submission-btn" type="button" data-submission-id="${submission.id}">Delete</button>`;

            return `
            <tr>
                <td>${submission.assignmentTitle || submission.assignmentId}</td>
                <td>${submission.fileName || "-"}</td>
                <td>${formatDate(submission.submissionDate)}</td>
                <td>${submission.marks ?? "Pending"}</td>
                <td>${submission.feedback || "Pending"}</td>
                <td>${statusBadge(submission.status)}</td>
                <td>
                    <button class="btn btn-accent view-btn" type="button" data-submission-id="${submission.id}">View</button>
                    <button class="btn btn-secondary download-btn" type="button" data-submission-id="${submission.id}" data-file-name="${submission.fileName}">Download</button>
                    ${deleteAction}
                </td>
            </tr>
        `;
        }).join("")
        : `<tr><td colspan="7"><div class="empty-state">No submissions found for this assignment.</div></td></tr>`;

    bindViewButtons();
    bindDownloadButtons();
}

function populateSubmissionSelect(selectId, submissions, selectedId) {
    const select = document.getElementById(selectId);
    if (!select) {
        return;
    }
    select.innerHTML = submissions.map((submission) => `
        <option value="${submission.id}" ${submission.id === selectedId ? "selected" : ""}>
            ${submission.assignmentTitle || submission.assignmentId} - ${submission.studentName || submission.studentEmail || submission.studentId}
        </option>
    `).join("");
}

function bindDownloadButtons() {
    document.querySelectorAll(".download-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await downloadSubmissionFile(button.dataset.submissionId, button.dataset.fileName);
            } catch (error) {
                const target = document.getElementById("submission-status") || document.getElementById("dashboard-status") || document.getElementById("grade-status");
                if (target) {
                    target.className = "status-message status-error";
                    target.textContent = error.message;
                }
            }
        });
    });
}

function bindViewButtons() {
    document.querySelectorAll(".view-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await viewSubmissionFile(button.dataset.submissionId);
            } catch (error) {
                const target = document.getElementById("submission-status") || document.getElementById("dashboard-status") || document.getElementById("grade-status");
                if (target) {
                    target.className = "status-message status-error";
                    target.textContent = error.message;
                }
            }
        });
    });
}

function bindSubmissionDeleteButtons(onDeleted) {
    document.querySelectorAll(".delete-submission-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            if (!window.confirm("Delete this submission?")) {
                return;
            }

            try {
                await deleteMySubmission(button.dataset.submissionId);
                setStatus("submission-status", "Submission deleted. You can now upload a corrected file.");
                if (typeof onDeleted === "function") {
                    await onDeleted();
                }
            } catch (error) {
                setStatus("submission-status", error.message, "error");
            }
        });
    });
}

function bindAssignmentDownloadButtons() {
    document.querySelectorAll(".assignment-download-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await downloadAssignmentAttachment(button.dataset.assignmentId, button.dataset.fileName);
            } catch (error) {
                const target = document.getElementById("assignment-status") || document.getElementById("dashboard-status") || document.getElementById("submission-status");
                if (target) {
                    target.className = "status-message status-error";
                    target.textContent = error.message;
                }
            }
        });
    });
}

function bindNotificationButtons(targetId, countTargetId) {
    document.querySelectorAll(".mark-read-btn").forEach((button) => {
        button.addEventListener("click", async () => {
            try {
                await markNotificationRead(button.dataset.notificationId);
                await loadNotifications(targetId, countTargetId);
            } catch (error) {
                const target = document.getElementById("dashboard-status") || document.getElementById("course-status") || document.getElementById("submission-status");
                if (target) {
                    target.className = "status-message status-error";
                    target.textContent = error.message;
                }
            }
        });
    });
}

async function handleLogin(event) {
    event.preventDefault();
    const payload = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await request(`${API.auth}/login`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        saveSession(response.data);
        window.location.href = response.data.role === "ROLE_ADMIN" ? "/teacher-dashboard.html" : "/student-dashboard.html";
    } catch (error) {
        setStatus("auth-status", error.message, "error");
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const payload = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        role: document.getElementById("role").value
    };

    try {
        const response = await request(`${API.auth}/register`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        saveSession(response.data);
        window.location.href = response.data.role === "ROLE_ADMIN" ? "/teacher-dashboard.html" : "/student-dashboard.html";
    } catch (error) {
        setStatus("auth-status", error.message, "error");
    }
}

async function initStudentDashboard() {
    if (!ensureRole("ROLE_USER")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    try {
        const [assignmentsResponse, submissionsResponse] = await Promise.all([
            request(`${API.assignments}/all`),
            request(`${API.submissions}/my`)
        ]);

        const assignments = assignmentsResponse.data || [];
        const submissions = submissionsResponse.data || [];
        const assignmentsList = document.getElementById("assignments-list");
        const table = document.getElementById("my-submissions-body");

        document.getElementById("assignment-count").textContent = assignments.length;
        document.getElementById("submission-count").textContent = submissions.length;
        document.getElementById("graded-count").textContent = submissions.filter((item) => item.status === "GRADED").length;
        if (assignmentsList) {
            assignmentsList.innerHTML = assignments.length
                ? assignments.slice(0, 5).map(assignmentCard).join("")
                : `<div class="empty-state">No assignments assigned yet.</div>`;
            bindAssignmentDownloadButtons();
        }

        if (table) {
            table.innerHTML = submissions.length
                ? submissions.map((submission) => `
                    <tr>
                        <td>${submission.assignmentTitle || submission.assignmentId}</td>
                        <td>${submission.fileName}</td>
                        <td>${formatDate(submission.submissionDate)}</td>
                        <td>${submission.marks ?? "Pending"}</td>
                        <td>${submission.feedback || "Pending"}</td>
                        <td>${statusBadge(submission.status)}</td>
                        <td>
                            <button class="btn btn-accent view-btn" type="button" data-submission-id="${submission.id}">View</button>
                            <button class="btn btn-secondary download-btn" type="button" data-submission-id="${submission.id}" data-file-name="${submission.fileName}">Download</button>
                        </td>
                    </tr>
                `).join("")
                : `<tr><td colspan="7"><div class="empty-state">No submissions yet.</div></td></tr>`;
            bindViewButtons();
            bindDownloadButtons();
        }

        await loadStudentCourses("student-course-list");
        await loadNotifications("student-notifications", "notification-count");
    } catch (error) {
        setStatus("dashboard-status", error.message, "error");
    }

    const joinForm = document.getElementById("course-join-form");
    if (joinForm) {
        // Dialog open/close
        const dialog = document.getElementById("gc-join-dialog");
        const openBtn = document.getElementById("gc-join-class-toggle");
        const closeDialog = () => dialog?.classList.add("hidden");
        openBtn?.addEventListener("click", () => dialog?.classList.remove("hidden"));
        document.getElementById("gc-join-close")?.addEventListener("click", closeDialog);
        document.getElementById("gc-join-cancel")?.addEventListener("click", closeDialog);

        joinForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await request(`${API.courses}/join`, {
                    method: "POST",
                    body: JSON.stringify({
                        joinCode: document.getElementById("joinCode").value.trim().toUpperCase()
                    })
                });
                setStatus("course-status", "Joined successfully!");
                event.target.reset();
                await loadStudentCourses("student-course-list");
                const refreshed = await request(`${API.assignments}/all`);
                const assignments = refreshed.data || [];
                document.getElementById("assignment-count").textContent = assignments.length;
                await loadNotifications("student-notifications", "notification-count");
                setTimeout(closeDialog, 1200);
            } catch (error) {
                setStatus("course-status", error.message, "error");
            }
        });
    }
}

async function initTeacherDashboard() {
    if (!ensureRole("ROLE_ADMIN")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    try {
        const [assignmentsResponse, submissionsResponse, coursesResponse] = await Promise.all([
            request(`${API.assignments}/my`),
            request(`${API.submissions}/all`),
            request(`${API.courses}/my`)
        ]);
        const assignments = assignmentsResponse.data || [];
        const submissions = submissionsResponse.data || [];
        const courses = coursesResponse.data || [];

        const courseCount = document.getElementById("course-count");
        if (courseCount) {
            courseCount.textContent = courses.length;
        }
        document.getElementById("assignment-count").textContent = assignments.length;
        document.getElementById("submission-count").textContent = submissions.length;
        document.getElementById("graded-count").textContent = submissions.filter((item) => item.status === "GRADED").length;

        const recentAssignments = document.getElementById("assignment-stream");
        if (recentAssignments) {
            recentAssignments.innerHTML = assignments.length
                ? assignments.slice(0, 5).map(assignmentCard).join("")
                : `<div class="empty-state">No assignments created yet.</div>`;
            bindAssignmentDownloadButtons();
        }

        await loadTeacherCourses("teacher-course-list");

        await loadSubmissionsTable("recent-submissions-body", `${API.submissions}/all`, true, true, true);
        await loadNotifications("teacher-notifications", "teacher-notification-count");
    } catch (error) {
        setStatus("dashboard-status", error.message, "error");
    }
}

async function initCourseManagementPage() {
    if (!ensureRole("ROLE_ADMIN")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    try {
        await loadTeacherCourses("teacher-course-list");
    } catch (error) {
        setStatus("course-status", error.message, "error");
    }

    document.getElementById("course-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await request(`${API.courses}/create`, {
                method: "POST",
                body: JSON.stringify({
                    courseName: document.getElementById("courseName").value,
                    facultyName: document.getElementById("facultyName").value
                })
            });
            setStatus("course-status", "Course created successfully.");
            event.target.reset();
            await loadTeacherCourses("teacher-course-list");
        } catch (error) {
            setStatus("course-status", error.message, "error");
        }
    });
}

async function loadCourseAssignments(targetId, courseId) {
    const container = document.getElementById(targetId);
    if (!container) {
        return;
    }
    const response = await request(`${API.assignments}/my`);
    const all = response.data || [];
    const filtered = courseId ? all.filter((a) => String(a.courseId) === String(courseId)) : all;
    container.innerHTML = filtered.length
        ? filtered.map(assignmentCard).join("")
        : `<div class="empty-state">No assignments for this course yet.</div>`;
    bindAssignmentDownloadButtons();
}

async function initCreateAssignmentPage() {
    if (!ensureRole("ROLE_ADMIN")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    const params = new URLSearchParams(window.location.search);
    const preselectedCourseId = params.get("courseId");
    const preselectedCourseName = params.get("courseName");

    if (preselectedCourseName) {
        const title = document.getElementById("create-assignment-title");
        const subtitle = document.getElementById("create-assignment-subtitle");
        if (title) {
            title.textContent = `Post Assignment for ${preselectedCourseName}`;
        }
        if (subtitle) {
            subtitle.textContent = "Publish instructions, due dates, and materials directly into this course.";
        }
        const backLink = document.getElementById("back-to-course-link");
        if (backLink) {
            backLink.style.display = "";
            backLink.href = `/course-stream.html?courseId=${encodeURIComponent(preselectedCourseId || "")}&courseName=${encodeURIComponent(preselectedCourseName)}`;
        }
    }

    try {
        await loadCourses("courseId");
        if (preselectedCourseId) {
            const select = document.getElementById("courseId");
            if (select) {
                select.value = preselectedCourseId;
                select.disabled = true;
            }
        }
        await loadCourseAssignments("assignment-feed", preselectedCourseId);
    } catch (error) {
        setStatus("assignment-status", error.message, "error");
    }

    document.getElementById("assignment-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append("title", document.getElementById("title").value);
        formData.append("description", document.getElementById("description").value);
        const courseSelect = document.getElementById("courseId");
        formData.append("courseId", courseSelect.value);
        formData.append("dueDate", document.getElementById("dueDate").value);
        const attachment = document.getElementById("attachment").files[0];
        if (attachment) {
            formData.append("attachment", attachment);
        }

        try {
            await request(`${API.assignments}/create`, {
                method: "POST",
                body: formData
            });
            setStatus("assignment-status", "Assignment created successfully.");
            event.target.reset();
            if (preselectedCourseId) {
                const select = document.getElementById("courseId");
                if (select) {
                    select.value = preselectedCourseId;
                    select.disabled = true;
                }
            } else {
                await loadCourses("courseId");
            }
            await loadCourseAssignments("assignment-feed", preselectedCourseId);
        } catch (error) {
            setStatus("assignment-status", error.message, "error");
        }
    });
}

async function initSubmitAssignmentPage() {
    if (!ensureRole("ROLE_USER")) {
        return;
    }
    injectUserSummary();
    injectSidebar();
    const params = new URLSearchParams(window.location.search);
    const preselectedAssignmentId = params.get("assignmentId");
    const preselectedCourseId = params.get("courseId");
    let assignments = [];
    let visibleAssignments = [];
    let visibleAssignmentIds = new Set();

    const refreshSubmissionLog = async () => {
        const response = await request(`${API.submissions}/my`);
        const allSubmissions = response.data || [];

        const filteredSubmissions = preselectedAssignmentId
            ? allSubmissions.filter((submission) => String(submission.assignmentId) === String(preselectedAssignmentId))
            : preselectedCourseId
                ? allSubmissions.filter((submission) => visibleAssignmentIds.has(String(submission.assignmentId)))
                : allSubmissions;

        renderMySubmissionLog("my-submissions-body", filteredSubmissions);
        bindSubmissionDeleteButtons(refreshSubmissionLog);
    };

    try {
        assignments = await loadAssignments("assignment-feed");
        visibleAssignments = assignments;

        if (preselectedAssignmentId) {
            visibleAssignments = assignments.filter((item) => String(item.id) === String(preselectedAssignmentId));
        } else if (preselectedCourseId) {
            visibleAssignments = assignments.filter((item) => String(item.courseId) === String(preselectedCourseId));
        }

        const feed = document.getElementById("assignment-feed");
        if (feed) {
            feed.innerHTML = visibleAssignments.length
                ? visibleAssignments.map(assignmentCard).join("")
                : `<div class="empty-state">No assignments available for this selection.</div>`;
            bindAssignmentDownloadButtons();
        }

        visibleAssignmentIds = new Set(visibleAssignments.map((item) => String(item.id)));

        populateAssignmentSelect("assignmentId", visibleAssignments);
        const assignmentSelect = document.getElementById("assignmentId");
        if (assignmentSelect) {
            const hasPreselected = preselectedAssignmentId && visibleAssignments.some((item) => item.id === preselectedAssignmentId);

            if (!hasPreselected) {
                assignmentSelect.value = "";
                assignmentSelect.disabled = true;
                const submitBtn = document.querySelector("#submission-form button[type='submit']");
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add("btn-secondary");
                    submitBtn.classList.remove("btn-primary");
                }
                setStatus("submission-status", "Select a specific assignment from Stream/Classwork and click Turn in.", "error");
                const detail = document.getElementById("selected-assignment-detail");
                if (detail) {
                    detail.innerHTML = `<div class="empty-state">Submission is enabled only from a specific assignment. Go back to your class and click <strong>Turn in</strong> on that assignment.</div>`;
                }
            } else {
                assignmentSelect.value = preselectedAssignmentId;
                assignmentSelect.disabled = true;
                renderSelectedAssignmentDetails(visibleAssignments, assignmentSelect.value);
            }
        }
        await refreshSubmissionLog();
    } catch (error) {
        setStatus("submission-status", error.message, "error");
    }

    document.getElementById("submission-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!preselectedAssignmentId) {
            setStatus("submission-status", "Submission is allowed only from a specific assignment card.", "error");
            return;
        }

        const assignmentSelect = document.getElementById("assignmentId");
        if (!assignmentSelect || assignmentSelect.value !== preselectedAssignmentId) {
            setStatus("submission-status", "Invalid submission context. Please open Turn in from the assignment card again.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("assignmentId", preselectedAssignmentId);
        formData.append("file", document.getElementById("file").files[0]);

        try {
            await request(`${API.submissions}/upload`, {
                method: "POST",
                body: formData
            });
            setStatus("submission-status", "Assignment submitted successfully.");
            const assignmentId = preselectedAssignmentId;
            event.target.reset();
            document.getElementById("assignmentId").value = assignmentId;
            renderSelectedAssignmentDetails(assignments, assignmentId);
            await refreshSubmissionLog();
        } catch (error) {
            setStatus("submission-status", error.message, "error");
        }
    });
}

async function initCourseStreamPage() {
    if (!ensureAuthenticated()) return;
    injectUserSummary();
    injectSidebar();

    const isTeacher = getRole() === "ROLE_ADMIN";
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("courseId") || "";
    const courseName = params.get("courseName") || "";

    try {
        const [coursesResponse, assignmentsResponse, submissionsResponse] = await Promise.all([
            request(isTeacher ? `${API.courses}/my` : API.courses),
            request(isTeacher ? `${API.assignments}/my` : `${API.assignments}/all`),
            request(isTeacher ? `${API.submissions}/all` : `${API.submissions}/my`)
        ]);

        const courses = coursesResponse.data || [];
        const assignments = assignmentsResponse.data || [];
        const submissions = submissionsResponse.data || [];
        const course = courses.find((c) => String(c.id) === String(courseId))
            || courses.find((c) => c.courseName === courseName)
            || null;

        if (!course) {
            setStatus("course-stream-status", "Course not found or you don't have access.", "error");
            return;
        }

        const courseAssignments = assignments.filter((a) => String(a.courseId) === String(course.id));
        const assignmentIds = new Set(courseAssignments.map((a) => String(a.id)));
        const courseSubmissions = submissions.filter((s) => assignmentIds.has(String(s.assignmentId)));

        // Render hero + side panel + stream
        renderCourseHero(course, isTeacher);
        renderCourseSidePanel(course, courseAssignments, courseSubmissions, isTeacher);
        renderCourseStream(courseAssignments, isTeacher);
        renderClassworkTab(courseAssignments, isTeacher, course);
        if (!isTeacher) bindCourseSubmissionForm(course, courseAssignments);

        // Render tab bar
        const tabs = ["stream", "classwork", "people"];
        const tabLabels = { stream: "Stream", classwork: "Classwork", people: "People" };
        const tabsBar = document.getElementById("course-tabs-bar");
        if (tabsBar) {
            tabsBar.innerHTML = tabs.map((t) =>
                `<button class="gc-course-tab ${t === "stream" ? "active" : ""}" data-tab="${t}">${tabLabels[t]}</button>`
            ).join("");
        }

        // Lazy-load people tab
        let peopleLoaded = false;

        // Tab switching
        document.querySelectorAll(".gc-course-tab[data-tab]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                document.querySelectorAll(".gc-course-tab").forEach((t) => t.classList.remove("active"));
                document.querySelectorAll(".course-tab-pane").forEach((p) => p.classList.add("hidden"));
                btn.classList.add("active");
                const pane = document.getElementById(`tab-${btn.dataset.tab}`);
                if (pane) pane.classList.remove("hidden");

                // Toggle side panel visibility (hide on classwork/people for more space)
                const sidePanel = document.getElementById("course-side-panel");
                if (sidePanel) {
                    sidePanel.style.display = (btn.dataset.tab === "stream") ? "" : "none";
                }

                if (btn.dataset.tab === "people" && !peopleLoaded) {
                    peopleLoaded = true;
                    const peopleContainer = document.getElementById("course-people-list");
                    if (peopleContainer) peopleContainer.innerHTML = `<div class="muted" style="padding:24px">Loading members…</div>`;
                    try {
                        const membersResp = await request(`${API.courses}/${course.id}/members`);
                        renderPeopleTab(membersResp.data, course);
                    } catch (e) {
                        if (peopleContainer) peopleContainer.innerHTML = `<div class="empty-state">Unable to load members.</div>`;
                    }
                }
            });
        });
    } catch (error) {
        setStatus("course-stream-status", error.message, "error");
    }
}

async function initViewSubmissionsPage() {
    if (!ensureRole("ROLE_ADMIN")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    const params = new URLSearchParams(window.location.search);
    const preselectedCourseId = params.get("courseId") || "";
    const preselectedCourseName = params.get("courseName") || "";
    setViewSubmissionsHeader(preselectedCourseName);

    try {
        const assignmentsResponse = await request(`${API.assignments}/all`);
        const allAssignments = assignmentsResponse.data || [];
        const courseAssignments = preselectedCourseId
            ? allAssignments.filter((assignment) => String(assignment.courseId) === String(preselectedCourseId))
            : allAssignments;

        const submissionsResponse = await request(`${API.submissions}/all`);
        const allSubmissions = submissionsResponse.data || [];
        const courseAssignmentIds = new Set(courseAssignments.map((assignment) => String(assignment.id)));
        const courseSubmissions = preselectedCourseId
            ? allSubmissions.filter((submission) => courseAssignmentIds.has(String(submission.assignmentId)))
            : allSubmissions;

        populateAssignmentSelect("assignmentFilter", [{ id: "", title: "All Assignments", courseName: preselectedCourseName }, ...courseAssignments]);
        renderSubmissionsTable("submission-table-body", courseSubmissions, true, true, true);

        const assignmentFilter = document.getElementById("assignmentFilter");
        assignmentFilter.addEventListener("change", async (event) => {
            const assignmentId = event.target.value;
            const filteredSubmissions = assignmentId
                ? courseSubmissions.filter((submission) => String(submission.assignmentId) === String(assignmentId))
                : courseSubmissions;
            renderSubmissionsTable("submission-table-body", filteredSubmissions, true, true, true);
        });
    } catch (error) {
        setStatus("submission-status", error.message, "error");
    }
}

async function initGradeAssignmentPage() {
    if (!ensureRole("ROLE_ADMIN")) {
        return;
    }
    injectUserSummary();
    injectSidebar();

    try {
        const response = await request(`${API.submissions}/all`);
        const submissions = response.data || [];
        const query = new URLSearchParams(window.location.search);
        const selectedId = query.get("submissionId");
        populateSubmissionSelect("submissionId", submissions, selectedId);
        const renderSubmissionSummary = (submissionId) => {
            const selected = submissions.find((item) => item.id === submissionId) || submissions[0];
            if (!selected) {
                document.getElementById("submission-summary").innerHTML = `<div class="empty-state">No submissions available for grading.</div>`;
                return;
            }
            document.getElementById("submission-summary").innerHTML = `
                <div class="info-card">
                    <p><strong>Assignment:</strong> ${selected.assignmentTitle || selected.assignmentId}</p>
                    <p><strong>Student:</strong> ${selected.studentName || selected.studentEmail || selected.studentId}</p>
                    <p><strong>File:</strong> ${selected.fileName}</p>
                    <p><strong>Status:</strong> ${selected.status}</p>
                    <div class="button-row mt-16">
                        <button class="btn btn-accent view-btn" type="button" data-submission-id="${selected.id}">Open File</button>
                        <button class="btn btn-secondary download-btn" type="button" data-submission-id="${selected.id}" data-file-name="${selected.fileName}">Download</button>
                    </div>
                </div>
            `;
            bindViewButtons();
            bindDownloadButtons();
        };

        renderSubmissionSummary(selectedId || submissions[0]?.id);
        document.getElementById("submissionId").addEventListener("change", (event) => {
            renderSubmissionSummary(event.target.value);
        });
    } catch (error) {
        setStatus("grade-status", error.message, "error");
    }

    document.getElementById("grade-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = {
            submissionId: document.getElementById("submissionId").value,
            marks: Number(document.getElementById("marks").value),
            feedback: document.getElementById("feedback").value
        };

        try {
            await request(`${API.submissions}/grade`, {
                method: "PUT",
                body: JSON.stringify(payload)
            });
            setStatus("grade-status", "Submission graded successfully.");
        } catch (error) {
            setStatus("grade-status", error.message, "error");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    injectUserSummary();

    const bodyId = document.body.id;
    if (bodyId === "login-page") {
        document.getElementById("login-form").addEventListener("submit", handleLogin);
    }
    if (bodyId === "register-page") {
        document.getElementById("register-form").addEventListener("submit", handleRegister);
    }
    if (bodyId === "student-dashboard-page") {
        initStudentDashboard();
    }
    if (bodyId === "teacher-dashboard-page") {
        initTeacherDashboard();
    }
    if (bodyId === "create-assignment-page") {
        initCreateAssignmentPage();
    }
    if (bodyId === "submit-assignment-page") {
        initSubmitAssignmentPage();
    }
    if (bodyId === "view-submissions-page") {
        initViewSubmissionsPage();
    }
    if (bodyId === "course-stream-page") {
        initCourseStreamPage();
    }
    if (bodyId === "grade-assignment-page") {
        initGradeAssignmentPage();
    }
    if (bodyId === "course-management-page") {
        initCourseManagementPage();
    }

    document.querySelectorAll("[data-logout]").forEach((button) => {
        button.addEventListener("click", logout);
    });

    // GC sidebar toggle (for pages where sidebar is in static HTML fallback)
    document.getElementById("gc-toggle")?.addEventListener("click", () => {
        const s = document.getElementById("gc-sidebar");
        const o = document.getElementById("gc-overlay");
        if (s?.classList.contains("open")) { s.classList.remove("open"); o?.classList.remove("visible"); }
        else { s?.classList.add("open"); o?.classList.add("visible"); }
    });
});