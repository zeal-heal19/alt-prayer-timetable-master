// =====================
// ✅ Globals & Token
// =====================
const token = localStorage.getItem('access_token');
if (!token) window.location.href = '/'; // Redirect if not logged in

// Cloud API URL
const CLOUD_API_URL = "https://fuzzy-chainsaw-jjgqxp9rg7r5c5vgg-9000.app.github.dev/cloud-update-timings";

// =====================
// ⏰ Helpers
// =====================

// Convert HH:MM string for input[type="time"]
function toInputTimeFormat(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':').map(Number);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

// Get value from input
function getTimeValue(id) {
  const val = document.getElementById(id).value;
  return val ? val : "00:00";
}

// =====================
// 🌐 Load timings from local API
// =====================
function loadTimings() {
  fetch('/get-timings', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(res => {
      if (!res.ok) throw new Error("Failed to load timings.");
      return res.json();
    })
    .then(data => {
      document.getElementById('fajr_azan').value = toInputTimeFormat(data.FAJR_AZAAN);
      document.getElementById('fajr_prayer').value = toInputTimeFormat(data.FAJR_JAMAT);
      document.getElementById('dhuhr_azan').value = toInputTimeFormat(data.ZUHAR_AZAAN);
      document.getElementById('dhuhr_prayer').value = toInputTimeFormat(data.ZUHAR_JAMAT);
      document.getElementById('asr_azan').value = toInputTimeFormat(data.ASR_AZAAN);
      document.getElementById('asr_prayer').value = toInputTimeFormat(data.ASR_JAMAT);
      document.getElementById('maghrib_azan').value = toInputTimeFormat(data.MAGHRIB_AZAAN);
      document.getElementById('maghrib_prayer').value = toInputTimeFormat(data.MAGHRIB_JAMAT);
      document.getElementById('isha_azan').value = toInputTimeFormat(data.ISHA_AZAAN);
      document.getElementById('isha_prayer').value = toInputTimeFormat(data.ISHA_JAMAT);
      document.getElementById('jummah_azan').value = toInputTimeFormat(data.JUMAH_AZAAN);
      document.getElementById('jummah_prayer').value = toInputTimeFormat(data.JUMAH_JAMAT);
    })
    .catch(err => {
      console.error("Error loading timings:", err);
      alert("Failed to load prayer timings.");
    });
}

// =====================
// 🌍 Load mosque details
// =====================
async function fetchMosqueDetails() {
  try {
    const res = await fetch('get-mosque-details', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error("Failed to fetch mosque details");
    return await res.json();
  } catch (err) {
    console.warn("⚠️ Could not load mosque details, using defaults.", err);
    return {
      mosque_name: "Unknown Mosque",
      latitude: 0,
      longitude: 0,
      "play-azan": true
    };
  }
}

// =====================
// 🕌 Eid Timings
// =====================
async function fetchEidTimings() {
  try {
    const res = await fetch('get-eid-timings', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error("Failed to fetch Eid timings");
    return await res.json();
  } catch (err) {
    console.warn("⚠️ Could not load Eid timings, using defaults.", err);
    return { namaz: "EID", datetime: new Date().toISOString() };
  }
}

// =====================
// 🌙 Taraweeh Timings
// =====================
async function fetchTaraweehTimings() {
  try {
    const res = await fetch('get-taraweeh-timings', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!res.ok) throw new Error("Failed to fetch Taraweeh timings");
    return await res.json();
  } catch (err) {
    console.warn("⚠️ Could not load Taraweeh timings, using defaults.", err);
    return {
      taraweeh_start_date: new Date().toISOString().slice(0, 10),
      taraweeh_end_date: new Date().toISOString().slice(0, 10),
      taraweeh_time: "21:00"
    };
  }
}

// =====================
// 💾 Save latest update only
// =====================
function saveCloudOffline(data) {
  localStorage.setItem("latest_cloud_update", JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  console.log("☁️ Saved latest for cloud sync:", data);
}

// =====================
// 🔄 Sync latest update to cloud
// =====================
async function syncCloudPending() {
  const pending = JSON.parse(localStorage.getItem("latest_cloud_update") || "null");
  if (!pending) return;

  console.log("🌍 Syncing latest pending update...");

  try {
    const res = await fetch(CLOUD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending.data)
    });

    if (!res.ok) throw new Error("Cloud rejected update");

    const result = await res.json();
    console.log("✅ Cloud synced:", result);

    localStorage.removeItem("latest_cloud_update"); // Clear after success
  } catch (err) {
    console.warn("❌ Cloud sync failed, will retry later:", err.message);
  }
}

// =====================
// 📝 Save timings (local + cloud latest)
// =====================
async function saveTimings(event) {
  event.preventDefault();

  const mosqueDetails = await fetchMosqueDetails();
  const eidTimings = await fetchEidTimings();
  const taraweehTimings = await fetchTaraweehTimings();

  const updatedTimings = {
    ...mosqueDetails,
    FAJR_AZAAN: getTimeValue("fajr_azan"),
    FAJR_JAMAT: getTimeValue("fajr_prayer"),
    ZUHAR_AZAAN: getTimeValue("dhuhr_azan"),
    ZUHAR_JAMAT: getTimeValue("dhuhr_prayer"),
    ASR_AZAAN: getTimeValue("asr_azan"),
    ASR_JAMAT: getTimeValue("asr_prayer"),
    MAGHRIB_AZAAN: getTimeValue("maghrib_azan"),
    MAGHRIB_JAMAT: getTimeValue("maghrib_prayer"),
    ISHA_AZAAN: getTimeValue("isha_azan"),
    ISHA_JAMAT: getTimeValue("isha_prayer"),
    JUMAH_AZAAN: getTimeValue("jummah_azan"),
    JUMAH_JAMAT: getTimeValue("jummah_prayer"),
    // 🌙 Taraweeh
    taraweeh_start_date: taraweehTimings.taraweeh_start_date,
    taraweeh_end_date: taraweehTimings.taraweeh_end_date,
    taraweeh_time: taraweehTimings.taraweeh_time,
    // 🕌 Eid
    eid_namaz: eidTimings.namaz,
    eid_datetime: eidTimings.datetime
  };

  // 1️⃣ Update LOCAL API
  fetch("/update-timings", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify(updatedTimings)
  })
    .then(res => res.json())
    .then(data => {
      console.log("📡 Local update:", data.msg);

      // 2️⃣ Save latest for cloud sync
      saveCloudOffline(updatedTimings);

      alert("Timings updated locally! Cloud will sync latest when online.");
      window.location.href = "/home";
    })
    .catch(err => {
      console.error("Error updating local timings:", err);
      alert("Failed to update timings locally.");
    });
}

// =====================
// 🔌 Event Listeners
// =====================
window.onload = () => {
  loadTimings();
  document.querySelector("form").addEventListener("submit", saveTimings);
  document.getElementById("cancelBtn").addEventListener("click", () => window.location.href = "/home");

  if (navigator.onLine) syncCloudPending();
};

window.addEventListener("online", () => {
  console.log("🔌 Back online → syncing cloud updates...");
  syncCloudPending();
});
