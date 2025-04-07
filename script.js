let clockInTime;
let clockOutTime;
let manualTimeEntries = [];
let totalHoursWorkedMinutes = 0; // Store total time in minutes

const clockInBtn = document.getElementById('clockInBtn');
const clockOutBtn = document.getElementById('clockOutBtn');
const status = document.getElementById('status');
const hoursWorked = document.getElementById('hoursWorked');
const manualSubmitBtn = document.getElementById('manualSubmitBtn');
const manualDate = document.getElementById('manualDate');
const manualClockIn = document.getElementById('manualClockIn');
const manualClockOut = document.getElementById('manualClockOut');
const downloadReport = document.getElementById('downloadReport');
const darkModeToggle = document.getElementById('darkModeToggle');

clockInBtn.addEventListener('click', () => {
    clockInTime = new Date();
    status.textContent = `Clocked in at: ${clockInTime.toLocaleTimeString()}`;
    clockInBtn.disabled = true;
    clockOutBtn.disabled = false;
});

clockOutBtn.addEventListener('click', () => {
    if (!clockInTime) {
        alert('Please clock in first before clocking out.');
        return;
    }
    clockOutTime = new Date();
    const minutesWorked = calculateMinutes(clockInTime, clockOutTime);

    manualTimeEntries.push({
        date: formatDate(clockInTime), // Format date before storing
        inTime: clockInTime.toLocaleTimeString(),
        outTime: clockOutTime.toLocaleTimeString(),
        hours: Math.floor(minutesWorked / 60), // Separate hours
        minutes: minutesWorked % 60 // Separate minutes
    });

    totalHoursWorkedMinutes += minutesWorked;
    updateTotalHoursWorked();
    updateReportTable(); // Update the report table with real-time entry
    status.textContent = `Clocked out at: ${clockOutTime.toLocaleTimeString()}`;
    clockOutBtn.disabled = true;
    clockInBtn.disabled = false;
    clockInTime = null; // Reset clock in time
});

manualSubmitBtn.addEventListener('click', () => {
    const date = manualDate.value;
    const inTime = manualClockIn.value;
    const outTime = manualClockOut.value;

    if (!date || !inTime || !outTime) {
        alert('Please fill in the manual date, clock-in, and clock-out times.');
        return;
    }

    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const [outHours, outMinutes] = outTime.split(':').map(Number);

    const clockInDate = new Date(date);
    const clockOutDate = new Date(date);

    clockInDate.setHours(inHours, inMinutes, 0);
    clockOutDate.setHours(outHours, outMinutes, 0);

    if (clockInDate >= clockOutDate) {
        alert('Clock out time must be later than clock in time.');
        return;
    }

    const minutesWorked = calculateMinutes(clockInDate, clockOutDate);

    manualTimeEntries.push({
        date: formatDate(clockInDate), // Format date before storing
        inTime: inTime,
        outTime: outTime,
        hours: Math.floor(minutesWorked / 60), // Separate hours
        minutes: minutesWorked % 60 // Separate minutes
    });

    totalHoursWorkedMinutes += minutesWorked;
    updateTotalHoursWorked();

    // Clear input fields
    manualDate.value = '';
    manualClockIn.value = '';
    manualClockOut.value = '';
    
    updateReportTable(); // Update the report table with manual entry
    alert(`Manual entry added: ${Math.floor(minutesWorked / 60)} hours ${minutesWorked % 60} minutes`);
});

downloadReport.addEventListener('click', () => {
    let reportContent = `Date,Clock In,Clock Out,Hours,Minutes\n`;

    manualTimeEntries.forEach(entry => {
        reportContent += `${entry.date},${entry.inTime},${entry.outTime},${entry.hours},${entry.minutes}\n`;
    });

    const totalHours = Math.floor(totalHoursWorkedMinutes / 60);
    const totalMinutes = totalHoursWorkedMinutes % 60;
    reportContent += `Total Hours Worked:,${totalHours},${totalMinutes},\n`;

    const blob = new Blob([reportContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Monthly_Report.csv';
    link.click();
});

darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
});

// Initialize Flatpickr for date and time inputs
flatpickr("#manualDate", {
    dateFormat: "Y-m-d",
});

flatpickr("#manualClockIn", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
});

flatpickr("#manualClockOut", {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    time_24hr: true,
});

// Function to format date as DD/MM/YYYY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Function to calculate total minutes worked
function calculateMinutes(startTime, endTime) {
    const diffMs = Math.abs(endTime - startTime); // Difference in milliseconds
    return Math.floor(diffMs / (1000 * 60)); // Total minutes worked
}

// Function to update total hours worked display
function updateTotalHoursWorked() {
    const totalHours = Math.floor(totalHoursWorkedMinutes / 60);
    const totalMinutes = totalHoursWorkedMinutes % 60;
    hoursWorked.textContent = `Total hours worked: ${totalHours} hours ${totalMinutes} minutes`;
}

// Function to update the report table
function updateReportTable() {
    const reportTableBody = document.querySelector('#reportTable tbody');
    reportTableBody.innerHTML = ''; // Clear existing rows

    const dailyHours = {};

    manualTimeEntries.forEach((entry) => {
        const date = entry.date;
        if (!dailyHours[date]) {
            dailyHours[date] = { totalMinutes: 0, entries: [] };
        }
        dailyHours[date].totalMinutes += entry.hours * 60 + entry.minutes;
        dailyHours[date].entries.push(entry);
    });

    for (const date in dailyHours) {
        const totalMinutes = dailyHours[date].totalMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${date}</td>
            <td>${dailyHours[date].entries.map(e => `${e.inTime} - ${e.outTime}`).join(', ')}</td>
            <td>${hours}</td>
            <td>${minutes}</td>
            <td>
                <button onclick="editEntry(${manualTimeEntries.findIndex(e => e.date === date)})">Edit</button>
                <button onclick="deleteEntry(${manualTimeEntries.findIndex(e => e.date === date)})">Delete</button>
            </td>
        `;
        reportTableBody.appendChild(newRow);
    }
}

// Function to delete an entry
function deleteEntry(index) {
    manualTimeEntries.splice(index, 1);
    updateReportTable();
}

// Function to edit an entry
function editEntry(index) {
    const entry = manualTimeEntries[index];
    manualDate.value = entry.date;
    manualClockIn.value = entry.inTime;
    manualClockOut.value = entry.outTime;
    deleteEntry(index); // Remove the entry so it can be added again after editing
}