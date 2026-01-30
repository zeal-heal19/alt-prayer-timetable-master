let showGregorian = true; // Toggle flag for calendar switch
let lastDateSwitchTime = Date.now();

function updateTime() {
  const now = new Date();

  // --- Time Formatting ---
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById("hours").textContent = String(hours).padStart(2, '0');
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
  document.getElementById("ampm").textContent = ampm;

  // --- Alternate Gregorian / Hijri every 60 seconds ---
  if (Date.now() - lastDateSwitchTime >= 60000) {
    showGregorian = !showGregorian;
    lastDateSwitchTime = Date.now();
  }

  if (showGregorian) {
    // Gregorian Date
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-GB', dateOptions).replace(/ /g, '-').toUpperCase();
    document.getElementById('current-date').textContent = formattedDate;

    // Show weekday
    const dayOptions = { weekday: 'long' };
    const formattedDay = now.toLocaleDateString('en-GB', dayOptions).toUpperCase();
    document.getElementById('current-day').textContent = formattedDay;

  } else {
    // Hijri Date
    try {
      const islamicOptions = { day: '2-digit', month: 'long', year: 'numeric'};
      const hijriDate = new Intl.DateTimeFormat('en-TN-u-ca-islamic-umalqura', islamicOptions)
        .format(now).toUpperCase();

 
      document.getElementById('current-date').textContent = hijriDate;
    } catch (error) {
      document.getElementById('current-date').textContent = "HIJRI DATE ERR";
    }

    // Hide weekday during Hijri
    document.getElementById('current-day').textContent = "";
  }
  // fade in the date change
   // fade out after 1 second
}

// --- Initialize ---
document.addEventListener("DOMContentLoaded", () => {
  updateTime();
  setInterval(updateTime, 1000); // run every second
});
