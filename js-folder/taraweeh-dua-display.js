let taraweehTimeStr = null;
let taraweehActive = false; // global flag

// Change detection
let previousTaraweehDuaHash = null;
let cachedTaraweehDuaData = null;

function checkTaraweehTiming() {
  // Add cache buster to force fresh data
  const cacheBuster = `?t=${Date.now()}`;
  fetch(`config/taraweeh-timing.json${cacheBuster}`)
    .then(res => res.json())
    .then(data => {
      // Change detection
      const newHash = JSON.stringify(data);
      if (newHash !== previousTaraweehDuaHash) {
        previousTaraweehDuaHash = newHash;
        cachedTaraweehDuaData = data;
        console.log('🌙 Taraweeh dua config updated');
      }

      // Process display
      processTaraweehDuaDisplay(data);
    })
    .catch(err => {
      console.error("⚠️ Failed to load Taraweeh timing:", err);
    });
}

// Separate function for display processing
function processTaraweehDuaDisplay(data) {
  if (!data) data = cachedTaraweehDuaData;
  if (!data) return;

  const now = new Date();
  const yyyy_mm_dd = now.toISOString().split('T')[0];

  const startDate = data.taraweeh_start_date;
  const endDate = data.taraweeh_end_date;
  taraweehTimeStr = data.taraweeh_time;

  // Get fullscreen Taraweeh image element
  const taraweehFullscreenEl = document.querySelector('.Taraweeh-fullscreen');
  const rightEl = document.querySelector('.detail-right-section');
  const leftEl = document.querySelector('.detail-left-section');
  const headerEl = document.querySelector('.header-container');

  if (!taraweehFullscreenEl) {
    console.error('Taraweeh fullscreen element not found');
    return;
  }

  if (yyyy_mm_dd >= startDate && yyyy_mm_dd <= endDate) {
    const [h, m] = taraweehTimeStr.split(':').map(Number);
    const taraweehTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);

    if (now >= taraweehTime) {
      const startWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 2, 0); // +2 mins
      const endWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 5, 0); // +5 mins

      if (now >= startWindow && now <= endWindow) {
        // Show Taraweeh fullscreen with fade-in
        console.log('🌙 Showing Taraweeh Tasbeeh fullscreen');
        taraweehFullscreenEl.style.display = 'flex';
        taraweehFullscreenEl.offsetHeight; // Trigger reflow
        taraweehFullscreenEl.classList.add('show');

        // Hide other sections
        if (rightEl) rightEl.style.display = 'none';
        if (leftEl) leftEl.style.display = 'none';
        if (headerEl) headerEl.style.display = 'none';

        taraweehActive = true; // lock
      } else {
        // Hide Taraweeh fullscreen with fade-out
        if (taraweehFullscreenEl.classList.contains('show')) {
          console.log('🌙 Hiding Taraweeh Tasbeeh');
          taraweehFullscreenEl.classList.remove('show');
          setTimeout(() => {
            taraweehFullscreenEl.style.display = 'none';
          }, 1500);
        }

        // Show other sections
        if (rightEl) rightEl.style.display = 'inline-block';
        if (leftEl) leftEl.style.display = 'inline-block';
        if (headerEl) headerEl.style.display = 'flex';

        taraweehActive = false; // unlock
      }
    }
  } else {
    // Outside Ramadan - ensure Taraweeh is hidden
    if (taraweehFullscreenEl.classList.contains('show')) {
      taraweehFullscreenEl.classList.remove('show');
      setTimeout(() => {
        taraweehFullscreenEl.style.display = 'none';
      }, 1500);
    }
    taraweehActive = false;
  }
}

// 🚀 Load once on page load
window.addEventListener('load', checkTaraweehTiming);

// 🔁 Check for config changes every 5 seconds for faster updates
setInterval(checkTaraweehTiming, 5 * 1000);

// 🔁 Check display every minute using cached data (no fetch)
setInterval(() => {
  if (cachedTaraweehDuaData) {
    processTaraweehDuaDisplay(cachedTaraweehDuaData);
  }
}, 60 * 1000);

