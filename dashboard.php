<?php
// dashboard.php
session_start();
require_once 'db.php';

// Debugging check
$check_query = $conn->query("SELECT * FROM student");
if ($check_query->num_rows === 0) {
    echo "<div style='color:red; padding: 20px;'>DEBUG: The 'student' table is currently empty in the database.</div>";
}

// Fetch all students into an array
$student_data = [];
$result = $conn->query("SELECT * FROM student");
while ($row = $result->fetch_assoc()) {
    $student_data[] = $row;
}

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_destroy();
    header("Location: index.php");
    exit();
}

$role = $_SESSION['role'];
$teacher_id = $_SESSION['teacher_id'] ?? '';
$display_name = $_SESSION['display_name'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Tuition A+ | Dashboard</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" href="style.css">
    <script>
        // Tie frontend configuration cleanly into real SQL parameters
        window.AppConfig = {
            role: "<?php echo $role; ?>",
            teacherId: "<?php echo $teacher_id; ?>",
            displayName: "<?php echo $display_name; ?>"
        };
    </script>
</head>
<body class="dashboard-page">

    <div class="background-shape shape-one"></div>
    <div class="background-shape shape-two"></div>

    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="logo-icon"><i class="fa-solid fa-graduation-cap"></i></div>
            <div>
                <h2>My Tuition A+</h2>
                <p>Management System</p>
            </div>
        </div>

        <ul class="sidebar-menu">
            <li onclick="showSection('dashboard', this)" class="active">
                <i class="fa-solid fa-chart-line"></i><span>Dashboard Overview</span>
            </li>
            <li id="menu-students" onclick="showSection('students', this)">
                <i class="fa-solid fa-user-graduate"></i><span>Student Management</span>
            </li>
            <li id="menu-courses" onclick="showSection('courses', this)">
                <i class="fa-solid fa-book-open"></i><span>Course Management</span>
            </li>
            <li id="menu-attendance" onclick="showSection('attendance', this)">
                <i class="fa-solid fa-clipboard-check"></i><span>Attendance Management</span>
            </li>
            <li id="menu-schedule" onclick="showSection('schedule', this)">
                <i class="fa-solid fa-calendar-days"></i><span>Teacher Schedule</span>
            </li>
            <li onclick="showSection('reports', this)">
                <i class="fa-solid fa-chart-pie"></i><span>Report & Analysis</span>
            </li>
        </ul>

        <button class="logout-btn" onclick="logout()">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
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

        <section id="dashboard" class="section active">
            <div class="teacher-scope-card">
                <div>
                    <span class="scope-badge"><?php echo htmlspecialchars(ucfirst($role)); ?> View</span>
                    <h2>Full System Overview</h2>
                    <p>Welcome, <?php echo htmlspecialchars($display_name); ?>. Manage your teaching operations here.</p>
                </div>
                <i class="fa-solid fa-shield-halved"></i>
            </div>
            <div class="stats-grid" id="stats-grid"></div>
        </section>

        <section id="students" class="section">
            <div class="section-header">
                <div>
                    <h2>Student Management</h2>
                    <p>Manage student records, classes, and contact information.</p>
                </div>
                <button class="action-btn" onclick="demoAlert('Add Student')">
                    <i class="fa-solid fa-plus"></i> Add Student
                </button>
            </div>

            <div class="content-card">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Course</th>
                            <th>Phone</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="student-table-body">
                        </tbody>
                </table>
            </div>
        </section>

        <section id="courses" class="section">
            <div class="section-header">
                <div>
                    <h2>Course Management</h2>
                    <p id="course-section-desc">View and manage tuition courses.</p>
                </div>

                <button class="action-btn admin-only" onclick="demoAlert('Add Course')">
                    <i class="fa-solid fa-plus"></i>
                    Add Course
                </button>
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
                    <tbody id="course-table-body"></tbody>
                </table>

                <p class="teacher-note" id="course-note"></p>
            </div>
        </section>

        <section id="attendance" class="section">
            <div class="section-header">
                <div>
                    <h2>Attendance Management</h2>
                    <p id="attendance-section-desc">Search and mark attendance for students in the selected teacher scope.</p>
                </div>

                <button class="action-btn" onclick="demoAlert('Mark Attendance')">
                    <i class="fa-solid fa-clipboard-check"></i>
                    Mark Attendance
                </button>
            </div>

            <div class="content-card filter-card">
                <div class="filter-row three-columns">
                    <div class="search-box-dashboard">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input id="attendanceSearch" oninput="renderAttendance()" type="text" placeholder="Search only students under this teacher...">
                    </div>

                    <select id="attendanceCourseFilter" onchange="renderAttendance()" class="dashboard-select"></select>

                    <select id="attendanceStatusFilter" onchange="renderAttendance()" class="dashboard-select">
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
                            <th>Class</th>
                            <th>Course</th>
                            <th>Teacher</th>
                            <th>Date</th>
                            <th>Attendance</th>
                        </tr>
                    </thead>
                    <tbody id="attendance-table-body"></tbody>
                </table>

                <p class="teacher-note" id="attendance-note"></p>
            </div>
        </section>

        <section id="schedule" class="section">
            <div class="section-header">
                <div>
                    <h2>Teacher Schedule</h2>
                    <p id="schedule-description">Graphic schedule view based on the logged-in account.</p>
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
                            <th>Class Level</th>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Room</th>
                        </tr>
                    </thead>
                    <tbody id="schedule-table-body"></tbody>
                </table>

                <p class="teacher-note" id="schedule-note"></p>
            </div>
        </section>

        <section id="reports" class="section">
            <div class="section-header">
                <div>
                    <h2>Report & Analysis</h2>
                    <p id="report-section-desc">Generate, download, and print attendance reports for the current account scope.</p>
                </div>
            </div>

            <div class="content-card report-control-card">
                <div class="report-controls four-controls">
                    <div class="input-group-dashboard">
                        <label>Report Type</label>
                        <select id="reportType">
                            <option value="daily">Daily Attendance Report</option>
                            <option value="weekly">Weekly Attendance Report</option>
                            <option value="monthly" selected>Monthly Attendance Report</option>
                            <option value="yearly">Yearly Attendance Report</option>
                        </select>
                    </div>

                    <div class="input-group-dashboard">
                        <label>Month</label>
                        <select id="reportMonth">
                            <option>January</option>
                            <option>February</option>
                            <option>March</option>
                            <option>April</option>
                            <option selected>May</option>
                            <option>June</option>
                            <option>July</option>
                            <option>August</option>
                            <option>September</option>
                            <option>October</option>
                            <option>November</option>
                            <option>December</option>
                        </select>
                    </div>

                    <div class="input-group-dashboard">
                        <label>Year</label>
                        <select id="reportYear">
                            <option>2024</option>
                            <option>2025</option>
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
                            Admin Report
                        </div>
                    </div>

                    <hr>

                    <div class="report-info-grid">
                        <div>
                            <p>Report Type</p>
                            <h3 id="previewReportType">Monthly Attendance Report</h3>
                        </div>

                        <div>
                            <p>Month</p>
                            <h3 id="previewMonth">May</h3>
                        </div>

                        <div>
                            <p>Year</p>
                            <h3 id="previewYear">2026</h3>
                        </div>

                        <div>
                            <p>Generated By</p>
                            <h3 id="previewRole">Admin</h3>
                        </div>
                    </div>

                    <div class="report-summary-box" id="report-summary-box"></div>

                    <h2 class="report-section-title">Attendance Details</h2>

                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Student Name</th>
                                <th>Course</th>
                                <th>Teacher</th>
                                <th>Total Classes</th>
                                <th>Present</th>
                                <th>Absent</th>
                                <th>Attendance Rate</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="report-table-body"></tbody>
                    </table>

                    <div class="report-note">
                        <h3>Teacher/Admin Remarks</h3>
                        <p id="report-remarks">
                            Overall attendance performance is good. Students with low attendance should be monitored and contacted for follow-up.
                        </p>
                    </div>

                    <div class="report-footer">
                        <p>Generated from My Tuition A+ Attendance Management System</p>
                        <p id="generatedDate">Generated Date: 14 May 2026</p>
                    </div>
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
    <script>
        // Inject PHP data into JS
        const students = <?php echo json_encode($student_data); ?>;
        
        // Example: Simple rendering logic
        function renderStudents() {
            const body = document.getElementById('student-table-body');
            body.innerHTML = students.map(s => `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.class}</td>
                    <td>${s.course}</td>
                    <td>${s.phone}</td>
                    <td>Active</td>
                </tr>
            `).join('');
        }
        
        // Initialize on load
        document.addEventListener("DOMContentLoaded", renderStudents);
    </script>
</body>
</html>