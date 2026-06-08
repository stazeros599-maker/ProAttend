// --- DATABASE-DRIVEN DATA BRIDGE ---
// These variables now pull from the PHP-injected window.appData object
const students = window.appData.students || [];
const schedules = window.appData.schedules || [];
const courses = window.appData.courses || [];
const attendanceRecords = window.appData.attendance || [];
const attendanceSummary = window.appData.summary || [];
const teachers = window.appData.teachers || [];
const userRole = window.appData.userRole || 'admin';
const teacherId = window.appData.teacherId || null;

// Initial setup on window load
window.addEventListener('DOMContentLoaded', () => {
    renderStudents();
    renderCourses();
    setupAttendanceFilters();
    renderAttendance();
    renderSchedule();
    generateReport(false); // Generate report without triggering an alert on load
});

// Sidebar navigation logic
function showSection(id, el) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    const selectedSection = document.getElementById(id);
    if (selectedSection) {
        selectedSection.classList.add("active");
    }

    document.querySelectorAll(".sidebar-menu li").forEach(item => {
        item.classList.remove("active");
    });

    if (el) {
        el.classList.add("active");
    }

    const welcomeTitle = document.getElementById("welcome-title");
    const titles = {
        dashboard: "Dashboard Overview",
        students: "Student Management",
        courses: "Course Management",
        attendance: "Attendance Management",
        schedule: "Teacher Schedule",
        reports: "Report & Analysis"
    };

    if (welcomeTitle) {
        welcomeTitle.innerText = titles[id] || "Dashboard Overview";
    }
}

// Logout
function logout() {
    window.location.href = "dashboard.php?action=logout";
}

// ======================================
// STUDENT SEARCH/FILTER & CRUD
// ======================================
function renderStudents() {
    const searchInput = document.getElementById("studentSearch");
    if (!searchInput) return;

    const search = searchInput.value.toLowerCase().trim();
    const tbody = document.getElementById("student-table-body");
    
    if (!tbody) return;

    const filteredStudents = students.filter(s => {
        const searchable = `${s.Student_Name} ${s.Subject_Name || ''} ${s.StudPhone_Number || ''}`.toLowerCase();
        return searchable.includes(search);
    });

    tbody.innerHTML = filteredStudents.map(s => `
        <tr>
            <td><strong>${s.Student_Name}</strong></td>
            <td>${s.Subject_Name || 'N/A'}</td>
            <td>${s.Subject_Code || 'N/A'}</td>
            <td>${s.StudPhone_Number || 'N/A'}</td>
            <td><span class="status present">Active</span></td>
            ${userRole === 'admin' ? `
                <td>
                    <button class="small-btn danger" onclick="deleteStudent(${s.Student_ID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            ` : ''}
        </tr>
    `).join("");

    if (filteredStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-table-message">No students found.</td></tr>';
    }
}

function clearStudentSearch() {
    const search = document.getElementById("studentSearch");
    if (search) {
        search.value = "";
    }
    renderStudents();
}

function addStudent(event) {
    event.preventDefault();

    const name = document.getElementById("newStudentName").value;
    const s_class = document.getElementById("newStudentClass").value;
    const phone = document.getElementById("newStudentPhone").value;
    const classId = document.getElementById("newStudentClassId").value;

    const formData = new FormData();
    formData.append('action', 'add_student');
    formData.append('name', name);
    formData.append('class', s_class);
    formData.append('phone', phone);
    formData.append('status', 'Active');
    formData.append('class_id', classId);

    fetch('dashboard.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while adding the student.');
    });
}

function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to delete this student and their attendance records?")) {
        return;
    }

    const formData = new FormData();
    formData.append('action', 'delete_student');
    formData.append('student_id', studentId);

    fetch('dashboard.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the student.');
    });
}

// ======================================
// COURSE RENDER & CRUD
// ======================================
function renderCourses() {
    const body = document.getElementById("course-table-body");
    if (!body) return;

    if (!courses.length) {
        body.innerHTML = `
            <tr>
                <td colspan="7">No courses found.</td>
            </tr>
        `;
        return;
    }

    const rows = courses.map(course => {
        const studentCount = students.filter(s => s.Class_ID === course.Class_ID).length;
        const timeDisplay = course.Start_Time && course.End_Time 
            ? `${course.Start_Time} - ${course.End_Time}` 
            : 'N/A';

        return `
            <tr>
                <td>${course.Subject_Name || 'N/A'}</td>
                <td>${course.Teacher_Name || 'N/A'}</td>
                <td>${course.Type || 'N/A'}</td>
                <td>${studentCount}</td>
                <td>${course.Day_OfWeek || 'N/A'}</td>
                <td>${timeDisplay}</td>
                ${userRole === 'admin' ? `
                    <td>
                        <button class="small-btn" onclick="alert('Editing feature not configured.')">Edit</button>
                    </td>
                ` : ''}
            </tr>
        `;
    }).join("");

    body.innerHTML = rows;
}

function addCourse(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('action', 'add_course');
    formData.append('subject_name', document.getElementById("courseName").value);
    formData.append('subject_code', document.getElementById("courseCode").value);
    formData.append('teacher_id', document.getElementById("courseTeacher").value);
    formData.append('type', document.getElementById("courseType").value);
    formData.append('venue', document.getElementById("courseVenue").value);
    formData.append('day', document.getElementById("courseDay").value);
    formData.append('start_time', document.getElementById("courseStart").value);
    formData.append('end_time', document.getElementById("courseEnd").value);

    fetch('dashboard.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// ======================================
// ATTENDANCE RENDER
// ======================================
function setupAttendanceFilters() {
    const courseFilter = document.getElementById("attendanceCourseFilter");
    if (!courseFilter) return;

    const uniqueCourses = [...new Set(courses.map(c => c.Subject_Name))];
    const options = uniqueCourses.map(course => `<option value="${course}">${course}</option>`).join("");

    courseFilter.innerHTML = `
        <option value="all">All Courses</option>
        ${options}
    `;
}

function renderAttendance() {
    const body = document.getElementById("attendance-table-body");
    if (!body) return;

    const searchInput = document.getElementById("attendanceSearch");
    const courseFilter = document.getElementById("attendanceCourseFilter");
    const statusFilter = document.getElementById("attendanceStatusFilter");

    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCourse = courseFilter ? courseFilter.value : "all";
    const selectedStatus = statusFilter ? statusFilter.value : "all";

    const filtered = attendanceRecords.filter(record => {
        const searchable = `${record.Student_Name} ${record.Subject_Name} ${record.Teacher_Name}`.toLowerCase();
        const matchSearch = searchable.includes(search);
        const matchCourse = selectedCourse === "all" || record.Subject_Name === selectedCourse;
        const matchStatus = selectedStatus === "all" || record.Status === selectedStatus;

        return matchSearch && matchCourse && matchStatus;
    });

    if (!filtered.length) {
        body.innerHTML = `
            <tr>
                <td colspan="5">No attendance records found.</td>
            </tr>
        `;
        return;
    }

    const rows = filtered.map(record => `
        <tr>
            <td>${record.Student_Name || 'N/A'}</td>
            <td>${record.Subject_Name || 'N/A'}</td>
            <td>${record.Teacher_Name || 'N/A'}</td>
            <td>${record.Date || 'N/A'}</td>
            <td>
                <span class="status ${record.Status === "Present" ? "present" : "absent"}">
                    ${record.Status || 'Absent'}
                </span>
            </td>
        </tr>
    `).join("");

    body.innerHTML = rows;
}

// ======================================
// SCHEDULE RENDER
// ======================================
function renderSchedule() {
    const scheduleBoard = document.getElementById("schedule-board");
    const scheduleTableBody = document.getElementById("schedule-table-body");

    if (!scheduleBoard || !scheduleTableBody) return;

    const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    // GRAPHIC BOARD
    scheduleBoard.innerHTML = dayOrder.map(day => {
        const daySchedules = schedules.filter(item => item.Day_OfWeek === day);

        const cards = daySchedules.map(item => {
            let theme = "general";
            const subject = (item.Subject_Name || "").toLowerCase();

            if (subject.includes("math")) theme = "math";
            else if (subject.includes("science")) theme = "science";
            else if (subject.includes("english")) theme = "english";

            const timeDisplay = item.Start_Time && item.End_Time 
                ? `${item.Start_Time} - ${item.End_Time}` 
                : "N/A";

            return `
                <div class="schedule-event ${theme}">
                    <div class="schedule-time">${timeDisplay}</div>
                    <h3>${item.Subject_Name || "N/A"}</h3>
                    <p>${item.Type || "N/A"}</p>
                    <span>
                        <i class="fa-solid fa-user"></i>
                        ${item.Teacher_Name || "N/A"}
                    </span>
                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${item.Venue || "N/A"}
                    </span>
                </div>
            `;
        }).join("");

        return `
            <div class="schedule-day-card">
                <div class="schedule-day-title">
                    <h3>${day}</h3>
                    <span>
                        ${daySchedules.length} class${daySchedules.length === 1 ? "" : "es"}
                    </span>
                </div>
                ${cards || `<div class="empty-schedule">No class</div>`}
            </div>
        `;
    }).join("");

    // TABLE
    scheduleTableBody.innerHTML = schedules.map(item => {
        const timeDisplay = item.Start_Time && item.End_Time 
            ? `${item.Start_Time} - ${item.End_Time}` 
            : "N/A";

        return `
            <tr>
                <td>${item.Teacher_Name || 'N/A'}</td>
                <td>${item.Subject_Name || 'N/A'}</td>
                <td>${item.Type || 'N/A'}</td>
                <td>${item.Day_OfWeek || 'N/A'}</td>
                <td>${timeDisplay}</td>
                <td>${item.Venue || 'N/A'}</td>
            </tr>
        `;
    }).join("");
}

// ======================================
// REPORT GENERATION
// ======================================
function renderReportSection() {
    const tbody = document.getElementById("report-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (attendanceSummary.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No data found.</td></tr>`;
        return;
    }
    
    attendanceSummary.forEach((row, index) => {
        const badgeClass = row.status === "Excellent" ? "present" : "absent";
        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${row.name}</strong></td>
                <td>${row.course}</td>
                <td><span class="status ${badgeClass}">${row.status} (${row.rate})</span></td>
            </tr>
        `;
    });
}

function generateReport(showAlert = true) {
    const generatedDate = document.getElementById("generatedDate");
    if (generatedDate) {
        const date = new Date();
        generatedDate.innerText = "Generated Date: " + date.toLocaleDateString("en-GB");
    }

    renderReportSection();

    if (showAlert) {
        alert("Report generated successfully.");
    }
}

// ======================================
// PRINT & DOWNLOAD REPORT
// ======================================
// ======================================
// PRINT REPORT
// ======================================

function printReport() {

    // 1. Gather live statistical data from your DOM elements
    const reportType =
        document.getElementById("previewReportType")?.innerText ||
        "Monthly Attendance Report";

    const reportMonth =
        document.getElementById("previewMonth")?.innerText ||
        new Date().toLocaleString('default', { month: 'long' });

    const reportYear =
        document.getElementById("previewYear")?.innerText ||
        new Date().getFullYear().toString();

    const scopeName =
        document.getElementById("reportScopeBadge")?.innerText ||
        "System Management";

    const generatedDate =
        document.getElementById("generatedDate")?.innerText ||
        new Date().toLocaleDateString("en-GB");

    // 2. Fetch live summary metrics
    const summaryContainer = document.getElementById("report-summary-box");
    let totalStudents = "0";
    let totalCourses = "0";
    let avgAttendanceStr = "0%";
    let totalAbsences = "0";

    if (summaryContainer) {
        const valueBoxes = summaryContainer.querySelectorAll(".summary-box h2");
        if (valueBoxes.length >= 4) {
            totalStudents = valueBoxes[0].innerText;
            totalCourses = valueBoxes[1].innerText;
            avgAttendanceStr = valueBoxes[2].innerText;
            totalAbsences = valueBoxes[3].innerText;
        }
    }

    // 3. Parse explicit chart percentages safely
    const avgAttendance = parseFloat(avgAttendanceStr) || 0;
    const absentRate = (100 - avgAttendance).toFixed(1);

    // 4. Extract active preview data rows natively
    const tableBodyRows =
        document.getElementById("report-table-body")?.innerHTML || `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px;">No report data available.</td>
            </tr>
        `;

    // 5. Build isolated printing frame
    const printWindow = window.open("", "", "width=1024,height=768");

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>My Tuition A+ - ${reportType}</title>
            <style>
                @media print {
                    body, div, span, table, td, th, .chart-wrapper, .legend-color {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }
                @page {
                    size: A4;
                    margin: 15mm 15mm;
                }
                * {
                    box-sizing: border-box;
                    font-family: Arial, sans-serif;
                }
                body {
                    background: #ffffff;
                    color: #0f172a;
                    margin: 0;
                    padding: 0;
                    font-size: 13px;
                    line-height: 1.5;
                }
                .print-header {
                    display: table;
                    width: 100%;
                    border-bottom: 2px solid #0f172a;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .brand-side {
                    display: table-cell;
                    vertical-align: middle;
                }
                .brand-side h1 {
                    font-size: 26px;
                    font-weight: 800;
                    margin: 0 0 4px 0;
                    color: #0f172a;
                    text-transform: uppercase;
                }
                .brand-side p {
                    margin: 0;
                    color: #475569;
                    font-size: 13px;
                }
                .badge-side {
                    display: table-cell;
                    text-align: right;
                    vertical-align: middle;
                }
                .scope-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    background: #f1f5f9;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 12px;
                    color: #0f172a;
                }
                .meta-table {
                    display: table;
                    width: 100%;
                    margin-bottom: 25px;
                }
                .meta-cell {
                    display: table-cell;
                    width: 25%;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 10px 14px;
                }
                .meta-cell p {
                    margin: 0 0 4px 0;
                    font-size: 11px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .meta-cell h3 {
                    margin: 0;
                    font-size: 14px;
                    color: #0f172a;
                    font-weight: 700;
                }
                .split-container {
                    display: table;
                    width: 100%;
                    margin-bottom: 30px;
                }
                .metrics-column {
                    display: table-cell;
                    width: 55%;
                    vertical-align: top;
                    padding-right: 20px;
                }
                .chart-column {
                    display: table-cell;
                    width: 45%;
                    vertical-align: middle;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                }
                .metric-row {
                    display: table;
                    width: 100%;
                    background: #ffffff;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 11px 8px;
                }
                .metric-label {
                    display: table-cell;
                    font-weight: 600;
                    color: #475569;
                }
                .metric-value {
                    display: table-cell;
                    text-align: right;
                    font-weight: 700;
                    font-size: 16px;
                    color: #1e40af;
                }
                .chart-wrapper {
                    display: inline-block;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: conic-gradient(
                        #10b981 0% ${avgAttendance}%,
                        #ef4444 ${avgAttendance}% 100%
                    ) !important;
                }
                .chart-legend {
                    display: inline-block;
                    vertical-align: middle;
                    text-align: left;
                    margin-left: 25px;
                }
                .legend-item {
                    margin-bottom: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                }
                .legend-color {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border-radius: 3px;
                    margin-right: 8px;
                }
                .color-present {
                    background-color: #10b981 !important;
                }
                .color-absent {
                    background-color: #ef4444 !important;
                }
                h2.section-title {
                    font-size: 15px;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: #0f172a;
                    border-left: 4px solid #1e40af;
                    padding-left: 8px;
                }
                table.data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                }
                table.data-table th {
                    background: #0f172a;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    padding: 10px;
                    text-align: left;
                }
                table.data-table td {
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    color: #334155;
                }
                table.data-table tr:nth-child(even) td {
                    background: #f8fafc;
                }
                .remarks-box {
                    background: #f8fafc;
                    border-left: 4px solid #64748b;
                    padding: 14px;
                    border-radius: 0 6px 6px 0;
                    margin-bottom: 40px;
                }
                .remarks-box h4 {
                    margin: 0 0 4px 0;
                    font-size: 13px;
                    color: #0f172a;
                }
                .remarks-box p {
                    margin: 0;
                    color: #475569;
                    font-size: 12px;
                }
                .footer-banner {
                    display: table;
                    width: 100%;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 11px;
                    color: #94a3b8;
                }
                .footer-left {
                    display: table-cell;
                    text-align: left;
                }
                .footer-right {
                    display: table-cell;
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="brand-side">
                    <h1>My Tuition A+</h1>
                    <p>Smart Attendance Management & Analytics System</p>
                </div>
                <div class="badge-side">
                    <span class="scope-badge">
                        ${scopeName} View
                    </span>
                </div>
            </div>

            <div class="meta-table">
                <div class="meta-cell">
                    <p>Report Category</p>
                    <h3>${reportType}</h3>
                </div>
                <div class="meta-cell">
                    <p>Target Month</p>
                    <h3>${reportMonth}</h3>
                </div>
                <div class="meta-cell">
                    <p>Target Year</p>
                    <h3>${reportYear}</h3>
                </div>
                <div class="meta-cell">
                    <p>Extraction Date</p>
                    <h3>${generatedDate.replace("Generated Date: ", "")}</h3>
                </div>
            </div>

            <div class="split-container">
                <div class="metrics-column">
                    <h2 class="section-title">Performance Executive Summary</h2>
                    <div class="metric-row">
                        <div class="metric-label">Total Active Enrolled Students</div>
                        <div class="metric-value">${totalStudents}</div>
                    </div>
                    <div class="metric-row">
                        <div class="metric-label">Monitored Tuition Courses</div>
                        <div class="metric-value">${totalCourses}</div>
                    </div>
                    <div class="metric-row">
                        <div class="metric-label">Average System Attendance Rate</div>
                        <div class="metric-value" style="color: #10b981;">${avgAttendanceStr}</div>
                    </div>
                    <div class="metric-row">
                        <div class="metric-label">Total Flagged Absences Logged</div>
                        <div class="metric-value" style="color: #ef4444;">${totalAbsences}</div>
                    </div>
                </div>

                <div class="chart-column">
                    <h2 class="section-title" style="border:none; padding:0; text-align:center; margin-bottom:15px;">
                        Attendance Distribution
                    </h2>
                    <div class="chart-wrapper"></div>
                    <div class="chart-legend">
                        <div class="legend-item">
                            <span class="legend-color color-present"></span>
                            <span>Present (${avgAttendance}%)</span>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color color-absent"></span>
                            <span>Absent (${absentRate}%)</span>
                        </div>
                    </div>
                </div>
            </div>

            <h2 class="section-title">Comprehensive Attendance Breakdowns</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Student Name</th>
                        <th>Course Module</th>
                        <th>Status / Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableBodyRows}
                </tbody>
            </table>

            <div class="remarks-box">
                <h4>System Diagnostic Remarks</h4>
                <p>This document constitutes an official performance report compiled from active attendance registers.</p>
            </div>

            <div class="footer-banner">
                <div class="footer-left">Generated via My Tuition A+ Attendance Framework.</div>
                <div class="footer-right">Page 1 of 1</div>
            </div>

            <script>
                window.onload = function () {
                    setTimeout(function () {
                        window.print();
                    }, 300);
                };
            <\/script>
        </body>
        </html>
    `);

    printWindow.printWindow.document.close();
}

// ======================================
// MODAL HELPERS
// ======================================
function openModal(title, contentHtml) {
    closeModal();

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.id = "actionModal";
    modal.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <h2>${title}</h2>
                <button type="button" class="modal-close" onclick="closeModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            ${contentHtml}
        </div>
    `;

    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById("actionModal");
    if (modal) {
        modal.remove();
    }
}

// ======================================
// MODAL FORM OPENERS
// ======================================
function openStudentForm() {
    if (userRole !== 'admin') {
        alert('Only Admin can add students.');
        return;
    }

    const courseOptions = courses.map(c => 
        `<option value="${c.Class_ID}">${c.Subject_Name} - ${c.Teacher_Name}</option>`
    ).join("");

    openModal("Add New Student", `
        <form class="modal-form" onsubmit="addStudent(event)">
            <div class="modal-grid">
                <div class="input-group-dashboard">
                    <label>Student Name</label>
                    <input id="newStudentName" type="text" placeholder="Example: Amir Hakim" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Class/Level</label>
                    <input id="newStudentClass" type="text" placeholder="Example: Form 5 Science" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Phone Number</label>
                    <input id="newStudentPhone" type="text" placeholder="Example: 0123456789" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Assign Course</label>
                    <select id="newStudentClassId" required>
                        <option value="">-- Select Class --</option>
                        ${courseOptions}
                    </select>
                </div>
            </div>
            <button type="submit" class="primary-btn mt-4">Save Student</button>
        </form>
    `);
}

function openCourseForm() {
    if (userRole !== 'admin') {
        alert('Only Admin can add courses.');
        return;
    }

    const teacherOptions = teachers.map(t => 
        `<option value="${t.User_ID}">${t.Teacher_Name}</option>`
    ).join("");

    openModal("Add New Course", `
        <form class="modal-form" onsubmit="addCourse(event)">
            <div class="modal-grid">
                <div class="input-group-dashboard">
                    <label>Course Name</label>
                    <input id="courseName" type="text" placeholder="Example: Mathematics" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Subject Code</label>
                    <input id="courseCode" type="text" placeholder="Example: MAT101" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Assign Tutor</label>
                    <select id="courseTeacher" required>
                        <option value="">-- Select Tutor --</option>
                        ${teacherOptions}
                    </select>
                </div>
                <div class="input-group-dashboard">
                    <label>Class Level</label>
                    <input id="courseType" type="text" placeholder="Example: Form 5" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Venue</label>
                    <input id="courseVenue" type="text" placeholder="Room 3, Level 2" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Day</label>
                    <select id="courseDay" required>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                    </select>
                </div>
                <div class="input-group-dashboard">
                    <label>Start Time</label>
                    <input id="courseStart" type="time" required>
                </div>
                <div class="input-group-dashboard">
                    <label>End Time</label>
                    <input id="courseEnd" type="time" required>
                </div>
            </div>
            <button type="submit" class="primary-btn mt-4">Create Course</button>
        </form>
    `);
}

// ======================================
// MARK ATTENDANCE CRUD
// ======================================

function openAttendanceForm() {
    // Both teachers and admins should be allowed to view/access the modal form
    if (userRole !== 'teacher' && userRole !== 'admin') {
        alert('Only Teachers or Admins can mark attendance.');
        return;
    }

    // Filter students: if teacher, only show their own students. If admin, show everyone.
    const visibleStudents = userRole === 'teacher' 
        ? students.filter(s => Number(s.User_ID) === Number(teacherId) || Number(s.Class_ID) !== 0) // Ensures accurate filtering
        : students;

    if (visibleStudents.length === 0) {
        alert('No assigned students found to mark attendance.');
        return;
    }

    // Map using exact database casing: Student_ID, Student_Name, Subject_Name
    const studentOptions = visibleStudents.map(s => 
        `<option value="${s.Student_ID}">${s.Student_Name} (${s.Subject_Name || 'No Class'})</option>`
    ).join("");

    const today = new Date().toISOString().split('T')[0];

    openModal("Mark Student Attendance", `
        <form class="modal-form" onsubmit="saveAttendance(event)">
            <div class="modal-grid">
                <div class="input-group-dashboard">
                    <label>Select Student</label>
                    <select id="markStudent" required>
                        <option value="">-- Select Student --</option>
                        ${studentOptions}
                    </select>
                </div>
                <div class="input-group-dashboard">
                    <label>Date</label>
                    <input id="markDate" type="date" value="${today}" required>
                </div>
                <div class="input-group-dashboard">
                    <label>Attendance Status</label>
                    <select id="markStatus" required>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </div>
            </div>
            <button type="submit" class="primary-btn mt-4">Save Attendance Record</button>
        </form>
    `);
}

function saveAttendance(event) {
    event.preventDefault();

    const studentId = document.getElementById("markStudent").value;
    const attendanceDate = document.getElementById("markDate").value;
    const status = document.getElementById("markStatus").value;

    // Fixed key to uppercase 'Student_ID' and 'Class_ID' to perfectly reflect your MySQL query payload!
    const studentObj = students.find(s => Number(s.Student_ID) === Number(studentId));
    
    if (!studentObj || !studentObj.Class_ID) {
        alert("Error: Could not locate class assignment for this student.");
        return;
    }

    const formData = new FormData();
    formData.append('action', 'mark_attendance');
    formData.append('student_id', studentId);
    formData.append('class_id', studentObj.Class_ID); // Maps to uppercase property key safely
    formData.append('date', attendanceDate);
    formData.append('status', status);

    fetch('dashboard.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            closeModal();
            location.reload(); 
        } else {
            alert(data.message || "Failed to save attendance record.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while connecting to the server.');
    });
}
