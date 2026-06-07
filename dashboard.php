<?php
// dashboard.php
session_start();
require_once 'db.php';

// ===================================
// SESSION VALIDATION
// ===================================
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

// ===================================
// LOGOUT
// ===================================
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: index.php");
    exit();
}

// ===================================
// SESSION DATA
// ===================================
$role = $_SESSION['role'] ?? '';
$teacher_id = $_SESSION['teacher_id'] ?? '';
$display_name = $_SESSION['display_name'] ?? 'User';

// ===================================
// FETCH STUDENTS
// ===================================
$student_data = [];

$student_fetch_query = "
    SELECT 
        s.Student_ID,
        s.Student_Name,
        s.StudPhone_Number,
        c.Subject_Name,
        c.Subject_Code
    FROM student s

    LEFT JOIN attendance a
        ON s.Student_ID = a.Student_ID

    LEFT JOIN class c
        ON a.Class_ID = c.Class_ID
";

$student_result = $conn->query($student_fetch_query);

if ($student_result) {
    while ($row = $student_result->fetch_assoc()) {
        $student_data[] = $row;
    }
}

// ===================================
// DASHBOARD STATISTICS
// ===================================

// Total Students
$student_count_query = $conn->query("SELECT COUNT(*) as total FROM student");
$student_count = $student_count_query->fetch_assoc()['total'] ?? 0;

// Total Teachers
$teacher_count_query = $conn->query("SELECT COUNT(*) as total FROM teacher");
$teacher_count = $teacher_count_query->fetch_assoc()['total'] ?? 0;

// Total Classes
$class_count_query = $conn->query("SELECT COUNT(*) as total FROM class");
$class_count = $class_count_query->fetch_assoc()['total'] ?? 0;

// Attendance Percentage
$attendance_query = $conn->query("
    SELECT 
        CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
                (SUM(CASE WHEN Status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100
            )
        END AS percentage
    FROM attendance
    WHERE Date = CURDATE()
");

$attendance_percent = 0;

if ($attendance_query) {
    $attendance_percent = $attendance_query->fetch_assoc()['percentage'] ?? 0;
}

// ===================================
// RECENT ATTENDANCE
// ===================================

$attendance_table_query = "
    SELECT 
        s.Student_Name,
        c.Subject_Name,
        t.Teacher_Name,
        a.Status,
        a.Date
    FROM attendance a
    JOIN student s 
        ON a.Student_ID = s.Student_ID
    JOIN class c 
        ON a.Class_ID = c.Class_ID
    JOIN teacher t 
        ON c.User_ID = t.User_ID
";

if ($role === 'teacher' && !empty($teacher_id)) {
    $attendance_table_query .= " WHERE t.User_ID = " . (int)$teacher_id;
}

$attendance_table_query .= "
    ORDER BY a.Date DESC
    LIMIT 10
";

$attendance_result = $conn->query($attendance_table_query);

// ===================================
// STUDENT MANAGEMENT
// ===================================
$student_management_query = "
    SELECT 
        s.Student_ID,
        s.Student_Name,
        s.StudPhone_Number,
        c.Subject_Name,
        c.Subject_Code
    FROM student s

    LEFT JOIN attendance a
        ON s.Student_ID = a.Student_ID

    LEFT JOIN class c
        ON a.Class_ID = c.Class_ID

    ORDER BY s.Student_Name ASC
";

$students = $conn->query($student_management_query);

// ===================================
// TEACHER SCHEDULE
// ===================================

$schedule_query = "
    SELECT 
        t.Teacher_Name,
        c.Subject_Name,
        c.Type,
        s.Day,
        CONCAT(s.Start_Time, ' - ', s.End_Time) AS Formatted_Time,
        c.Venue
    FROM schedule s
    JOIN class c 
        ON s.Class_ID = c.Class_ID
    JOIN teacher t 
        ON c.User_ID = t.User_ID
";

if ($role === 'teacher') {
    $schedule_query .= "
        WHERE c.User_ID = " . (int)$teacher_id;
}

$schedule_result = $conn->query($schedule_query);

$schedule_data = [];

if ($schedule_result) {
    while ($row = $schedule_result->fetch_assoc()) {
        $schedule_data[] = $row;
    }
}

// ===================================
// COURSE DATA
// ===================================

$course_data = [];

$course_query = "
    SELECT
        c.Subject_Name,
        t.Teacher_Name,
        c.Type,
        s.Day,
        CONCAT(s.Start_Time, ' - ', s.End_Time) AS Time,
        COUNT(a.Student_ID) AS Total_Students
    FROM class c

    LEFT JOIN teacher t
        ON c.User_ID = t.User_ID

    LEFT JOIN schedule s
        ON c.Class_ID = s.Class_ID

    LEFT JOIN attendance a
        ON c.Class_ID = a.Class_ID

    GROUP BY c.Class_ID
";

$course_result = $conn->query($course_query);

if ($course_result) {

    while ($row = $course_result->fetch_assoc()) {
        $course_data[] = $row;
    }
}

// ===================================
// ATTENDANCE DATA
// ===================================

$attendance_data = [];

$attendance_data_query = "
    SELECT
        s.Student_Name,
        c.Type AS Class_Name,
        c.Subject_Name,
        t.Teacher_Name,
        a.Date,
        a.Status
    FROM attendance a

    JOIN student s
        ON a.Student_ID = s.Student_ID

    JOIN class c
        ON a.Class_ID = c.Class_ID

    JOIN teacher t
        ON c.User_ID = t.User_ID
";

$attendance_data_result = $conn->query($attendance_data_query);

if ($attendance_data_result) {

    while ($row = $attendance_data_result->fetch_assoc()) {
        $attendance_data[] = $row;
    }
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>My Tuition A+ | Dashboard</title>

    <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

    <link rel="stylesheet" href="style.css">

    <script>
        window.AppConfig = {
            role: <?php echo json_encode($role); ?>,
            teacherId: <?php echo json_encode($teacher_id); ?>,
            displayName: <?php echo json_encode($display_name); ?>
        };

        window.appData = {

            students: <?php echo json_encode($student_data); ?>,

            schedules: <?php echo json_encode($schedule_data); ?>,

            courses: <?php echo json_encode($course_data ?? []); ?>,

            attendance: <?php echo json_encode($attendance_data ?? []); ?>

        };
    </script>
</head>

<body class="dashboard-page">

    <div class="background-shape shape-one"></div>
    <div class="background-shape shape-two"></div>

    <aside class="sidebar">

        <div class="sidebar-logo">
            <div class="logo-icon">
                <i class="fa-solid fa-graduation-cap"></i>
            </div>

            <div>
                <h2>My Tuition A+</h2>
                <p>Management System</p>
            </div>
        </div>

        <ul class="sidebar-menu">
            <li onclick="showSection('dashboard', this)" class="active">
                <i class="fa-solid fa-chart-line"></i>
                <span>Dashboard Overview</span>
            </li>

            <li id="menu-students" onclick="showSection('students', this)">
                <i class="fa-solid fa-user-graduate"></i>
                <span>Student Management</span>
            </li>

            <li id="menu-courses" onclick="showSection('courses', this)">
                <i class="fa-solid fa-book-open"></i>
                <span>Course Management</span>
            </li>

            <li id="menu-attendance" onclick="showSection('attendance', this)">
                <i class="fa-solid fa-clipboard-check"></i>
                <span>Attendance Management</span>
            </li>

            <li id="menu-schedule" onclick="showSection('schedule', this)">
                <i class="fa-solid fa-calendar-days"></i>
                <span>Teacher Schedule</span>
            </li>

            <li onclick="showSection('reports', this)">
                <i class="fa-solid fa-chart-pie"></i>
                <span>Report & Analysis</span>
            </li>
        </ul>

        <button class="logout-btn" onclick="logout()">
            <i class="fa-solid fa-right-from-bracket"></i>
            Logout
        </button>

    </aside>

    <main class="main-content">
        <header class="topbar">
            <div>
                <p class="page-label" id="scope-label">Welcome back</p>
                <h1 id="welcome-title">Dashboard Overview</h1>
            </div>

            <div class="profile-card">
                <div>
                    <small>Logged in as</small>
                    <strong id="current-role"><?php echo htmlspecialchars(ucfirst($role)); ?></strong>
                </div>
                <div class="profile-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>
            </div>
        </header>

        <!-- DASHBOARD -->
        <section id="dashboard" class="section active">
            <div class="teacher-scope-card" id="scope-card">
                <div>
                    <span id="scope-badge" class="scope-badge">
                        <?php echo ucfirst($role); ?> View
                    </span>

                    <h2 id="scope-title">
                        <?php echo ($role === 'admin') 
                            ? 'Full System Overview' 
                            : 'Teacher Dashboard'; ?>
                    </h2>

                    <p id="scope-description">
                        <?php echo ($role === 'admin')
                            ? 'Admin can manage all students, teachers, attendance and reports.'
                            : 'Teacher can manage attendance and view assigned classes.'; ?>
                    </p>
                </div>

                <i class="fa-solid fa-shield-halved"></i>
            </div>

            <div class="stats-grid">

                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fa-solid fa-user-graduate"></i>
                    </div>

                    <div>
                        <p>Total Students</p>
                        <h2><?php echo $student_count; ?></h2>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon purple">
                        <i class="fa-solid fa-chalkboard-user"></i>
                    </div>

                    <div>
                        <p>Total Tutors</p>
                        <h2><?php echo $teacher_count; ?></h2>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fa-solid fa-book"></i>
                    </div>

                    <div>
                        <p>Active Courses</p>
                        <h2><?php echo $class_count; ?></h2>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="fa-solid fa-check"></i>
                    </div>

                    <div>
                        <p>Attendance Today</p>
                        <h2><?php echo $attendance_percent; ?>%</h2>
                    </div>
                </div>

            </div>

            <!-- RECENT ATTENDANCE -->
            <div class="content-card">

                <div class="card-header">
                    <h3>Recent Attendance</h3>
                </div>

                <table>

                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>

                        <?php if ($attendance_result && $attendance_result->num_rows > 0): ?>

                            <?php while ($row = $attendance_result->fetch_assoc()): ?>

                                <?php
                                $statusClass =
                                    strtolower($row['Status']) === 'present'
                                    ? 'present'
                                    : 'absent';
                                ?>

                                <tr>

                                    <td>
                                        <?php echo htmlspecialchars($row['Student_Name']); ?>
                                    </td>

                                    <td>
                                        <?php echo htmlspecialchars($row['Subject_Name']); ?>
                                    </td>

                                    <td>
                                        <?php echo htmlspecialchars($row['Teacher_Name']); ?>
                                    </td>

                                    <td>
                                        <span class="status <?php echo $statusClass; ?>">
                                            <?php echo htmlspecialchars($row['Status']); ?>
                                        </span>
                                    </td>

                                </tr>

                            <?php endwhile; ?>

                        <?php else: ?>

                            <tr>
                                <td colspan="4">
                                    No attendance records found.
                                </td>
                            </tr>

                        <?php endif; ?>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- STUDENTS -->
        <section id="students" class="section">

            <div class="section-header">

                <div>
                    <h2>Student Management</h2>
                    <p id="student-section-desc">
                        Manage student records and contact information.
                    </p>
                </div>

                <?php if ($role === 'admin'): ?>

                    <button class="action-btn admin-only">
                        <i class="fa-solid fa-plus"></i>
                        Add Student
                    </button>

                <?php endif; ?>

            </div>

            <div class="content-card filter-card">
                <div class="filter-row">

                    <div class="search-box-dashboard">
                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            id="studentSearch"
                            oninput="renderStudents()"
                            type="text"
                            placeholder="Search student name or course...">
                    </div>

                    <button class="action-btn ghost-btn" onclick="clearStudentSearch()">
                        <i class="fa-solid fa-rotate-right"></i>
                        Reset
                    </button>

                </div>
            </div>

            <div class="content-card">

                <table>

                    <thead>

                        <tr>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Subject Code</th>
                            <th>Phone</th>
                            <th>Status</th>

                            <?php if ($role === 'admin'): ?>
                                <th>Action</th>
                            <?php endif; ?>
                        </tr>

                    </thead>

                    <tbody id="student-table-body">

                        <?php while ($row = $students->fetch_assoc()): ?>

                            <tr>

                                <td>
                                    <?php echo htmlspecialchars($row['Student_Name']); ?>
                                </td>

                                <td>
                                    <?php echo htmlspecialchars($row['Subject_Name'] ?? 'N/A'); ?>
                                </td>

                                <td>
                                    <?php echo htmlspecialchars($row['Subject_Code'] ?? 'N/A'); ?>
                                </td>

                                <td>
                                    <?php echo htmlspecialchars($row['StudPhone_Number']); ?>
                                </td>

                                <td>Active</td>

                                <?php if ($role === 'admin'): ?>

                                    <td>
                                        <a href="delete_student.php?id=<?php echo $row['Student_ID']; ?>"
                                            class="action-btn delete-btn">

                                            <i class="fa-solid fa-trash"></i>
                                        </a>
                                    </td>

                                <?php endif; ?>

                            </tr>

                        <?php endwhile; ?>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- COURSES -->
        <section id="courses" class="section">

            <div class="section-header">

                <div>
                    <h2>Course Management</h2>
                    <p id="course-section-desc">
                        View and manage tuition courses.
                    </p>
                </div>

                <?php if ($role === 'admin'): ?>

                    <button class="action-btn admin-only">
                        <i class="fa-solid fa-plus"></i>
                        Add Course
                    </button>

                <?php endif; ?>

            </div>

            <div class="content-card">

                <table>

                    <thead>

                        <tr>
                            <th>Course Name</th>
                            <th>Teacher</th>
                            <th>Level</th>
                            <th>Students</th>
                            <th>Day</th>
                            <th>Time</th>
                            <th class="admin-only">Action</th>
                        </tr>

                    </thead>

                    <tbody id="course-table-body">

                        <?php
                        $course_query = "
                            SELECT
                                c.Class_ID,
                                c.Subject_Name,
                                c.Type,
                                c.Venue,
                                t.Teacher_Name
                            FROM class c
                            JOIN teacher t
                                ON c.User_ID = t.User_ID
                        ";

                        if ($role === 'teacher') {
                            $course_query .= "
                                WHERE c.User_ID = " . (int)$teacher_id;
                        }

                        $course_result = $conn->query($course_query);

                        if ($course_result && $course_result->num_rows > 0):

                            while ($course = $course_result->fetch_assoc()):
                        ?>

                            <tr>

                                <td><?php echo htmlspecialchars($course['Subject_Name']); ?></td>

                                <td><?php echo htmlspecialchars($course['Teacher_Name']); ?></td>

                                <td><?php echo htmlspecialchars($course['Type']); ?></td>

                                <td><?php echo htmlspecialchars($course['Venue']); ?></td>

                                <td class="admin-only">

                                    <?php if ($role === 'admin'): ?>

                                        <button class="action-btn delete-btn">
                                            <i class="fa-solid fa-trash"></i>
                                        </button>

                                    <?php endif; ?>

                                </td>

                            </tr>

                        <?php
                            endwhile;
                        else:
                        ?>

                            <tr>
                                <td colspan="5">No courses found.</td>
                            </tr>

                        <?php endif; ?>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- ATTENDANCE -->
        <section id="attendance" class="section">

            <div class="section-header">

                <div>
                    <h2>Attendance Management</h2>

                    <p id="attendance-section-desc">
                        Search and monitor attendance records.
                    </p>
                </div>

            </div>

            <div class="content-card filter-card">

                <div class="filter-row three-columns">

                    <div class="search-box-dashboard">

                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            id="attendanceSearch"
                            oninput="renderAttendance()"
                            type="text"
                            placeholder="Search attendance...">

                    </div>

                    <select id="attendanceCourseFilter"
                        onchange="renderAttendance()"
                        class="dashboard-select">

                        <option value="all">All Courses</option>

                    </select>

                    <select
                        id="attendanceStatusFilter"
                        onchange="renderAttendance()"
                        class="dashboard-select">

                        <option value="all">All Attendance Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>

                    </select>

                </div>

            </div>

            <div class="content-card">

                <table>

                    <thead>

                        <tr>
                            <th>Student Name</th>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>

                    </thead>

                    <tbody id="attendance-table-body">

                        <?php
                        $attendance_page_query = "
                            SELECT
                                s.Student_Name,
                                c.Subject_Name,
                                t.Teacher_Name,
                                a.Date,
                                a.Status
                            FROM attendance a
                            JOIN student s
                                ON a.Student_ID = s.Student_ID
                            JOIN class c
                                ON a.Class_ID = c.Class_ID
                            JOIN teacher t
                                ON c.User_ID = t.User_ID
                        ";

                        if ($role === 'teacher') {
                            $attendance_page_query .= "
                                WHERE t.User_ID = " . (int)$teacher_id;
                        }

                        $attendance_page_query .= "
                            ORDER BY a.Date DESC
                        ";

                        $attendance_page_result = $conn->query($attendance_page_query);

                        if ($attendance_page_result && $attendance_page_result->num_rows > 0):

                            while ($attendance = $attendance_page_result->fetch_assoc()):
                        ?>

                            <tr>

                                <td><?php echo htmlspecialchars($attendance['Student_Name']); ?></td>

                                <td><?php echo htmlspecialchars($attendance['Subject_Name']); ?></td>

                                <td><?php echo htmlspecialchars($attendance['Teacher_Name']); ?></td>

                                <td><?php echo htmlspecialchars($attendance['Date']); ?></td>

                                <td>

                                    <span class="status <?php echo strtolower($attendance['Status']); ?>">

                                        <?php echo htmlspecialchars($attendance['Status']); ?>

                                    </span>

                                </td>

                            </tr>

                        <?php
                            endwhile;
                        else:
                        ?>

                            <tr>
                                <td colspan="5">No attendance records found.</td>
                            </tr>

                        <?php endif; ?>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- SCHEDULE -->
        <section id="schedule" class="section">

            <div class="section-header">

                <div>
                    <h2>Teacher Schedule</h2>

                    <p id="schedule-description">
                        Graphic schedule view based on the logged-in account.
                    </p>
                </div>

            </div>

            <div class="schedule-legend content-card">

                <div>
                    <span class="legend-dot blue-dot"></span>
                    Mathematics
                </div>

                <div>
                    <span class="legend-dot green-dot"></span>
                    Science
                </div>

                <div>
                    <span class="legend-dot purple-dot"></span>
                    English
                </div>

            </div>

            <!-- IMPORTANT FOR JS -->
            <div class="schedule-board" id="schedule-board"></div>

            <div class="content-card schedule-table-card">

                <div class="card-header">
                    <h3>Schedule Details</h3>
                    <span id="schedule-table-label">Current Scope</span>
                </div>

                <table>

                    <thead>

                        <tr>
                            <th>Teacher</th>
                            <th>Course</th>
                            <th>Class Type</th>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Venue</th>
                        </tr>

                    </thead>

                    <tbody id="schedule-table-body">

                        <?php if (!empty($schedule_data)): ?>

                            <?php foreach ($schedule_data as $row): ?>

                                <tr>

                                    <td><?php echo htmlspecialchars($row['Teacher_Name']); ?></td>

                                    <td><?php echo htmlspecialchars($row['Subject_Name']); ?></td>

                                    <td><?php echo htmlspecialchars($row['Type']); ?></td>

                                    <td><?php echo htmlspecialchars($row['Day']); ?></td>

                                    <td><?php echo htmlspecialchars($row['Formatted_Time']); ?></td>

                                    <td><?php echo htmlspecialchars($row['Venue']); ?></td>

                                </tr>

                            <?php endforeach; ?>

                        <?php else: ?>

                            <tr>
                                <td colspan="6">
                                    No scheduled classes found.
                                </td>
                            </tr>

                        <?php endif; ?>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- REPORTS -->
        <section id="reports" class="section">

            <div class="section-header">

                <div>
                    <h2>Report & Analysis</h2>

                    <p id="report-section-desc">
                        Generate and print attendance reports.
                    </p>
                </div>

            </div>

            <div class="content-card report-control-card">

                <div class="report-controls four-controls">

                    <div class="input-group-dashboard">

                        <label>Report Type</label>

                        <select id="reportType">

                            <option value="daily">Daily Attendance Report</option>

                            <option value="monthly" selected>
                                Monthly Attendance Report
                            </option>

                        </select>

                    </div>

                    <div class="input-group-dashboard">

                        <label>Month</label>

                        <select id="reportMonth">
                            <option>January</option>
                            <option selected>May</option>
                            <option>December</option>
                        </select>

                    </div>

                    <div class="input-group-dashboard">

                        <label>Year</label>

                        <select id="reportYear">
                            <option selected>2026</option>
                        </select>

                    </div>

                    <button class="action-btn" onclick="generateReport()">

                        <i class="fa-solid fa-file-lines"></i>

                        Generate Report

                    </button>

                </div>

            </div>

            <div class="content-card report-preview-card" id="reportArea">

                <div class="report-paper">

                    <div class="report-title-area">

                        <div>
                            <h1>My Tuition A+</h1>
                            <p>Attendance Management System</p>
                        </div>
                        <div class="report-badge" id="reportScopeBadge">
                            <?php echo ucfirst($role); ?> Report
                        </div>
                    </div>
                    <hr>
                    <div class="report-summary-box" id="report-summary-box"></div>
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body"></tbody>
                    </table>
                </div>
            </div>
            <div class="report-button-area">
                <button class="action-btn" onclick="downloadReport()">
                    <i class="fa-solid fa-download"></i>
                    Download Report
                </button>
                <button class="action-btn print-btn" onclick="printReport()">
                    <i class="fa-solid fa-print"></i>
                    Print Report
                </button>
            </div>
        </section>
    </main>
    <script src="script.js"></script>
</body>

</html>
