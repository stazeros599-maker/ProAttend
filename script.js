/* 
 * script.js - UI Interaction Only
 * Data handling is now managed by PHP/MySQL via dashboard.php
 */

// --- DATABASE-DRIVEN DATA BRIDGE ---
// These variables now pull from the PHP-injected window.appData object
const students = window.appData.students || [];
const schedules = window.appData.schedules || [];
const courses = window.appData.courses || [];
const attendanceRecords = window.appData.attendance || [];
const attendanceSummary = [];

// --- TEACHER/USER CONFIG ---
// Keep your existing userAccounts and teachers objects for login logic 
// (or migrate them to the DB as well for full production readiness)
const userAccounts = {};
const teachers = {};

// --- REST OF YOUR FUNCTIONS ---
// (Keep all your existing functions below this point, 
// they will now automatically use the 'students' and 'schedules' constants above)

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

// Global UI Helper for demo actions
function demoAlert(action) {
    alert(action + " clicked.");
}

// Logout
function logout() {
    window.location.href = "dashboard.php?action=logout";
}

// ======================================
// STUDENT SEARCH/FILTER
// ======================================

function renderStudents() {

    const searchInput = document.getElementById("studentSearch");

    if (!searchInput) return;

    const search = searchInput.value.toLowerCase().trim();

    const rows = document.querySelectorAll("#student-table-body tr");

    rows.forEach(row => {

        const rowText = row.innerText.toLowerCase();

        if (rowText.includes(search)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });
}

function clearStudentSearch() {

    const search = document.getElementById("studentSearch");

    if (search) {
        search.value = "";
    }

    renderStudents();
}

// ======================================
// ATTENDANCE RENDER
// ======================================

function renderAttendance() {

    const body = document.getElementById("attendance-table-body");

    if (!body) return;

    if (!attendanceRecords.length) {

        body.innerHTML = `
            <tr>
                <td colspan="6">No attendance records found.</td>
            </tr>
        `;

        return;
    }

    const rows = attendanceRecords.map(record => `

        <tr>
            <td>${record.Student_Name || 'N/A'}</td>
            <td>${record.Class_Name || 'N/A'}</td>
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
// COURSE RENDER
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

    const rows = courses.map(course => `

        <tr>

            <td>${course.Subject_Name || 'N/A'}</td>
            <td>${course.Teacher_Name || 'N/A'}</td>
            <td>${course.Type || 'N/A'}</td>
            <td>${course.Total_Students || '0'}</td>
            <td>${course.Day || 'N/A'}</td>
            <td>${course.Time || 'N/A'}</td>

            <td>
                <button class="small-btn">
                    Edit
                </button>
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

    // =========================
    // GRAPHIC BOARD
    // =========================

    scheduleBoard.innerHTML = dayOrder.map(day => {

        const daySchedules = schedules.filter(
            item => item.Day === day
        );

        const cards = daySchedules.map(item => {

            let theme = "general";

            const subject = (item.Subject_Name || "").toLowerCase();

            if (subject.includes("math")) {
                theme = "math";
            }
            else if (subject.includes("science")) {
                theme = "science";
            }
            else if (subject.includes("english")) {
                theme = "english";
            }

            return `
                <div class="schedule-event ${theme}">

                    <div class="schedule-time">
                        ${item.Formatted_Time || "N/A"}
                    </div>

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

    // =========================
    // TABLE
    // =========================

    scheduleTableBody.innerHTML = schedules.map(item => `

        <tr>

            <td>${item.Teacher_Name || 'N/A'}</td>
            <td>${item.Subject_Name || 'N/A'}</td>
            <td>${item.Type || 'N/A'}</td>
            <td>${item.Day || 'N/A'}</td>
            <td>${item.Formatted_Time || 'N/A'}</td>
            <td>${item.Venue || 'N/A'}</td>

        </tr>

    `).join("");
}

// ======================================
// REPORT GENERATION
// ======================================

function generateReport(showAlert = true) {

    const reportType = document.getElementById("reportType");
    const reportMonth = document.getElementById("reportMonth");
    const reportYear = document.getElementById("reportYear");

    const previewType = document.getElementById("previewReportType");
    const previewMonth = document.getElementById("previewMonth");
    const previewYear = document.getElementById("previewYear");

    if (previewType && reportType) {
        previewType.innerText = reportType.options[reportType.selectedIndex].text;
    }

    if (previewMonth && reportMonth) {
        previewMonth.innerText = reportMonth.value;
    }

    if (previewYear && reportYear) {
        previewYear.innerText = reportYear.value;
    }

    const date = new Date();

    const generatedDate = document.getElementById("generatedDate");

    if (generatedDate) {

        generatedDate.innerText =
            "Generated Date: " +
            date.toLocaleDateString("en-GB");
    }

    if (showAlert) {
        alert("Report generated successfully.");
    }
}

// ======================================
// PRINT REPORT
// ======================================

function printReport() {

    // 1. Gather live statistical data
    const reportType =
        document.getElementById("previewReportType")?.innerText ||
        "Monthly Attendance Report";

    const reportMonth =
        document.getElementById("previewMonth")?.innerText ||
        "May";

    const reportYear =
        document.getElementById("previewYear")?.innerText ||
        "2026";

    const scopeName =
        document.getElementById("previewRole")?.innerText ||
        "Admin";

    const generatedDate =
        document.getElementById("generatedDate")?.innerText ||
        new Date().toLocaleDateString("en-GB");

    // 2. Fetch summary metrics
    const summaryContainer =
        document.getElementById("report-summary-box");

    const summaryBoxes =
        summaryContainer
            ? summaryContainer.getElementsByTagName("h2")
            : [];

    const totalStudents =
        summaryBoxes[0]?.innerText || "0";

    const totalCourses =
        summaryBoxes[1]?.innerText || "0";

    const avgAttendanceStr =
        summaryBoxes[2]?.innerText || "0%";

    const totalAbsences =
        summaryBoxes[3]?.innerText || "0";

    // 3. Parse percentages
    const avgAttendance =
        parseFloat(avgAttendanceStr) || 0;

    const absentRate =
        (100 - avgAttendance).toFixed(1);

    // 4. Get report table rows
    const tableBodyRows =
        document.getElementById("report-table-body")?.innerHTML || `
            <tr>
                <td colspan="9">No report data found.</td>
            </tr>
        `;

    // 5. Open print window
    const printWindow =
        window.open("", "", "width=1024,height=768");

    printWindow.document.write(`

        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <title>
                My Tuition A+ - ${reportType}
            </title>

            <style>

                @media print {
                    body,
                    div,
                    span,
                    table,
                    td,
                    th,
                    .chart-wrapper,
                    .legend-color {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                }

                @page {
                    size: A4;
                    margin: 20mm 15mm;
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
                    background:
                        conic-gradient(
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
                        ${scopeName} View Structure
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
                    <h3>
                        ${generatedDate.replace("Generated Date: ", "")}
                    </h3>
                </div>

            </div>

            <div class="split-container">

                <div class="metrics-column">

                    <h2 class="section-title">
                        Performance Executive Summary
                    </h2>

                    <div class="metric-row">
                        <div class="metric-label">
                            Total Active Enrolled Students
                        </div>

                        <div class="metric-value">
                            ${totalStudents}
                        </div>
                    </div>

                    <div class="metric-row">
                        <div class="metric-label">
                            Monitored Tuition Courses
                        </div>

                        <div class="metric-value">
                            ${totalCourses}
                        </div>
                    </div>

                    <div class="metric-row">
                        <div class="metric-label">
                            Average System Attendance Rate
                        </div>

                        <div
                            class="metric-value"
                            style="color: #10b981;"
                        >
                            ${avgAttendanceStr}
                        </div>
                    </div>

                    <div class="metric-row">
                        <div class="metric-label">
                            Total Flagged Absences Logged
                        </div>

                        <div
                            class="metric-value"
                            style="color: #ef4444;"
                        >
                            ${totalAbsences}
                        </div>
                    </div>

                </div>

                <div class="chart-column">

                    <h2
                        class="section-title"
                        style="
                            border:none;
                            padding:0;
                            text-align:center;
                            margin-bottom:15px;
                        "
                    >
                        Attendance Distribution
                    </h2>

                    <div class="chart-wrapper"></div>

                    <div class="chart-legend">

                        <div class="legend-item">
                            <span class="legend-color color-present"></span>
                            <span>
                                Present (${avgAttendance}%)
                            </span>
                        </div>

                        <div class="legend-item">
                            <span class="legend-color color-absent"></span>
                            <span>
                                Absent (${absentRate}%)
                            </span>
                        </div>

                    </div>

                </div>

            </div>

            <h2 class="section-title">
                Comprehensive Attendance Logs Breakdown
            </h2>

            <table class="data-table">

                <thead>

                    <tr>
                        <th>No.</th>
                        <th>Student Name</th>
                        <th>Class Name</th>
                        <th>Course Module</th>
                        <th>Total Class</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Attendance Rate</th>
                        <th>Status</th>
                    </tr>

                </thead>

                <tbody>
                    ${tableBodyRows}
                </tbody>

            </table>

            <div class="remarks-box">

                <h4>System Diagnostic Remarks</h4>

                <p>
                    This document constitutes an official performance
                    report compiled from active attendance registers.
                </p>

            </div>

            <div class="footer-banner">

                <div class="footer-left">
                    Generated via My Tuition A+ Attendance Framework.
                </div>

                <div class="footer-right">
                    Page 1 of 1
                </div>

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

    printWindow.document.close();
}

// ======================================
// DOWNLOAD REPORT
// ======================================

function downloadReport() {
    alert("Download triggered. Connect this to PHP export later.");
}

// ======================================
// MODAL HELPERS
// ======================================

function openAddModal() {
    alert("Add Student feature can be connected to PHP form later.");
}

function openAttendanceForm() {
    alert("Attendance form feature can be connected to database later.");
}

function closeModal() {

    const modal = document.getElementById("globalModal");

    if (modal) {
        modal.style.display = "none";
    }
}

// ======================================
// INITIALIZATION
// ======================================

function renderAll() {

    renderStudents();
    renderAttendance();
    renderCourses();
    renderSchedule();
}

document.addEventListener("DOMContentLoaded", () => {

    renderAll();

});
