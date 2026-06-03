/* 
 * script.js - UI Interaction Only
 * Data handling is now managed by PHP/MySQL via dashboard.php
 */

// Sidebar navigation logic
function showSection(id, el) {
    // Hide all sections
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    // Show selected section
    document.getElementById(id).classList.add("active");

    // Update active state in sidebar
    document.querySelectorAll(".sidebar-menu li").forEach(item => {
        item.classList.remove("active");
    });
    if (el) {
        el.classList.add("active");
    }

    // Update Header Title
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
    alert(action + " clicked. This is a front-end prototype feature.");
}

// Print Report functionality
function printReport() {
    // 1. Gather live statistical data from the report dashboard interface
    const reportType = document.getElementById("previewReportType")?.innerText || "Monthly Attendance Report";
    const reportMonth = document.getElementById("previewMonth")?.innerText || "May";
    const reportYear = document.getElementById("previewYear")?.innerText || "2026";
    const scopeName = document.getElementById("previewRole")?.innerText || "Admin";
    const generatedDate = document.getElementById("generatedDate")?.innerText || new Date().toLocaleDateString('en-GB');

    // 2. Fetch active metrics from the dashboard summary cards
    const summaryBoxes = document.getElementById("report-summary-box").getElementsByTagName("h2");
    const totalStudents = summaryBoxes[0]?.innerText || "0";
    const totalCourses = summaryBoxes[1]?.innerText || "0";
    const avgAttendanceStr = summaryBoxes[2]?.innerText || "0%";
    const totalAbsences = summaryBoxes[3]?.innerText || "0";

    // Parse values cleanly for the mathematical conic gradient background
    const avgAttendance = parseFloat(avgAttendanceStr) || 0;
    const absentRate = (100 - avgAttendance).toFixed(1);

    // 3. Capture the data table rows from the active screen view
    const tableBodyRows = document.getElementById("report-table-body").innerHTML;

    // 4. Open a clean print interface frame window
    const printWindow = window.open("", "", "width=1024,height=768");

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>My Tuition A+ - ${reportType}</title>
            <style>
                /* FORCE BROWSER TO SHOW BACKGROUND GRAPHICS & COLORS ON PRINT/PDF */
                @media print {
                    body, div, span, table, td, th, .chart-wrapper, .legend-color {
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
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                /* Layout Header */
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
                    letter-spacing: -0.5px;
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

                /* Info Metadata Block Container */
                .meta-table {
                    display: table;
                    width: 100%;
                    margin-bottom: 25px;
                    border-collapse: separate;
                }
                
                .meta-cell {
                    display: table-cell;
                    width: 25%;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 10px 14px;
                    border-radius: 6px;
                }
                
                .meta-cell:not(:last-child) {
                    border-right: none;
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

                /* Summary Split Layout: Data Columns vs Pie Chart Wrapper */
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
                    text-align: left;
                }
                
                .metric-value {
                    display: table-cell;
                    text-align: right;
                    font-weight: 700;
                    font-size: 16px;
                    color: #1e40af;
                }

                /* THE TRUSTED PIE CHART GRADIENT ENGINE */
                .chart-wrapper {
                    display: inline-block;
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    /* Explicitly sets green first up to its percentage, then handles the remaining red slice cleanly clockwise */
                    background: conic-gradient(#10b981 0% ${avgAttendance}%, #ef4444 ${avgAttendance}% 100%) !important;
                    vertical-align: middle;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
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
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                .color-present { background-color: #10b981 !important; }
                .color-absent { background-color: #ef4444 !important; }

                /* Main Reporting Rows Data Table Grid */
                h2.section-title {
                    font-size: 15px;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                    color: #0f172a;
                    border-left: 4px solid #1e40af;
                    padding-left: 8px;
                    text-align: left;
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
                    border: 1px solid #0f172a;
                }
                
                table.data-table td {
                    padding: 10px;
                    border: 1px solid #e2e8f0;
                    color: #334155;
                    text-align: left;
                }
                
                table.data-table tr:nth-child(even) td {
                    background: #f8fafc;
                }

                /* Printable Status Contrast Management Pills */
                .status-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                }
                
                .status-badge.good { background: #dcfce7 !important; color: #14532d !important; }
                .status-badge.warning { background: #fee2e2 !important; color: #7f1d1d !important; }

                /* Sign-off Comments Box */
                .remarks-box {
                    background: #f8fafc;
                    border-left: 4px solid #64748b;
                    padding: 14px;
                    border-radius: 0 6px 6px 0;
                    margin-bottom: 40px;
                    text-align: left;
                    page-break-inside: avoid;
                }
                
                .remarks-box h4 { margin: 0 0 4px 0; font-size: 13px; color: #0f172a; }
                .remarks-box p { margin: 0; color: #475569; font-size: 12px; }

                .footer-banner {
                    display: table;
                    width: 100%;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 11px;
                    color: #94a3b8;
                }
                
                .footer-left { display: table-cell; text-align: left; }
                .footer-right { display: table-cell; text-align: right; }
            </style>
        </head>
        <body>

            <div class="print-header">
                <div class="brand-side">
                    <h1>My Tuition A+</h1>
                    <p>Smart Attendance Management & Analytics System</p>
                </div>
                <div class="badge-side">
                    <span class="scope-badge">${scopeName} View Structure</span>
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
                    <h2 class="section-title" style="border: none; padding: 0; text-align: center; margin-bottom: 15px;">Attendance Distribution</h2>
                    
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

            <h2 class="section-title">Comprehensive Attendance Logs Breakdown</h2>
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
                <p>This document constitutes an official performance report compiled from active attendance registers tracking student participation scopes. Low performance items should be reviewed immediately by administrative coordinators for corrective actions.</p>
            </div>

            <div class="footer-banner">
                <div class="footer-left">Generated via My Tuition A+ Attendance Management Framework.</div>
                <div class="footer-right">Page 1 of 1</div>
            </div>

            <script>
                // Instantly triggers native system printing routines once layout is rendered completely
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 300);
                };
            </script>
        </body>
        </html>
    `);

    printWindow.document.close();
}

// Basic placeholder for download functionality
function downloadReport() {
    alert("Download triggered. Ensure your PHP generates the necessary file export.");
}

// Logout handled by link, but function preserved if needed for UI triggers
function logout() {
    window.location.href = "dashboard.php?action=logout";
}

function renderAttendance() {
    const searchInput = document.getElementById("attendanceSearch");
    const courseFilter = document.getElementById("attendanceCourseFilter");
    const statusFilter = document.getElementById("attendanceStatusFilter");

    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCourse = courseFilter ? courseFilter.value : "all";
    const selectedStatus = statusFilter ? statusFilter.value : "all";

    const rows = visibleAttendanceRecords().filter(record => {
        const student = getStudent(record.studentId);
        const teacher = teachers[student.teacherId];
        const searchable = `${student.name} ${student.className} ${student.course} ${teacher.name}`.toLowerCase();
        const matchSearch = searchable.includes(search);
        const matchCourse = selectedCourse === "all" || student.course === selectedCourse;
        const matchStatus = selectedStatus === "all" || record.status === selectedStatus;

        return matchSearch && matchCourse && matchStatus;
    }).map(record => {
        const student = getStudent(record.studentId);
        const teacher = teachers[student.teacherId];

        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.className}</td>
                <td>${student.course}</td>
                <td>${teacher.name}</td>
                <td>${record.date}</td>
                <td><span class="status ${record.status === "Present" ? "present" : "absent"}">${record.status}</span></td>
            </tr>
        `;
    }).join("");

    document.getElementById("attendance-table-body").innerHTML = rows || emptyRow(6, "No attendance records found for this search.");
}