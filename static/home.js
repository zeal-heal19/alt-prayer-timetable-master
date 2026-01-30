// Get JWT token from localStorage (set this after login)
const token = localStorage.getItem('access_token');
if (!token) {
  window.location.href = '/';
}

// Helper: convert 24h to 12h format
function to12Hour(timeStr) {
  if (!timeStr) return '';
  let [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// Fetch and display timings
function loadTimings() {
  fetch('/get-timings', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(res => res.json())
    .then(data => {
      console.log('Parsed JSON data:', data);
      // Example: update DOM elements with timings
document.getElementById('fajr_azan').textContent = to12Hour(data.FAJR_AZAAN);
document.getElementById('fajr_namaz').textContent = to12Hour(data.FAJR_JAMAT);

document.getElementById('zuhar_azan').textContent = to12Hour(data.ZUHAR_AZAAN);
document.getElementById('zuhar_namaz').textContent = to12Hour(data.ZUHAR_JAMAT);

document.getElementById('asr_azan').textContent = to12Hour(data.ASR_AZAAN);
document.getElementById('asr_namaz').textContent = to12Hour(data.ASR_JAMAT);

document.getElementById('maghrib_azan').textContent = to12Hour(data.MAGHRIB_AZAAN);
document.getElementById('maghrib_namaz').textContent = to12Hour(data.MAGHRIB_JAMAT);

document.getElementById('isha_azan').textContent = to12Hour(data.ISHA_AZAAN);
document.getElementById('isha_namaz').textContent = to12Hour(data.ISHA_JAMAT);

document.getElementById('jumah_azan').textContent = to12Hour(data.JUMAH_AZAAN);
document.getElementById('jumah_namaz').textContent = to12Hour(data.JUMAH_JAMAT);
  
    });
}



// Load timings on page load
window.onload = loadTimings;

document.getElementById('changeBtn').addEventListener('click', function () {
  window.location.href = '/updatetimings'; // this will route to a new page
});

window.onload = loadTimings;


document.getElementById('changepassBtn').addEventListener('click', function () {
  window.location.href = '/updatepassword'; // this will route to a new page
});

window.onload = loadTimings;

document.getElementById('addeventBtn').addEventListener('click', function () {
  window.location.href = '/updateidetimings'; // this will route to a new page
});
document.getElementById('addtaraweehBtn').addEventListener('click', function () {
  window.location.href = '/updatetaraweeh'; // this will route to a new page
});
window.onload = loadTimings;

document.getElementById('logoutBtn').addEventListener('click', function () {
  // Remove the JWT token from localStorage
  localStorage.removeItem('access_token');

  // Optionally clear other session-related items if stored
  // localStorage.clear(); // if you want to clear everything

  // Redirect to login page
  window.location.href = '/';
});

// 🟢 Load active theme on page load
fetch("https://potential-pancake-4jrwxp6qrq6wfwp-5000.app.github.dev/themes")
  .then(res => res.json())
  .then(data => {
    if (data.active) {
      themeSelect.value = data.active;
    }
  })
  .catch(err => console.error("Error loading active theme:", err));

