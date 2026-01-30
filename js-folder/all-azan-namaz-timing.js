// Convert 24-hour time to 12-hour format (no AM/PM)
function to12Hour(timeStr) {
  if (!timeStr) return '';
  let [h, m] = timeStr.split(':').map(Number);
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Apply smooth transition styles
function applyTransitionStyles(el) {
  el.style.transition = 'opacity 1s ease-in-out';
  el.style.opacity = '1';
}

// Change detection - only update when data changes
let previousPrayerTimesHash = null;
let cachedPrayerData = null;
let currentActivePrayer = null; // Track which prayer is highlighted


// Schedule poster swap 5 minutes after Jamat time
function checkAllJamatTimes(times) {
  const now = new Date();
  const ayatul_khusri_duaEl = document.querySelector('.Ayatal-khursi');
  const right_section_time = document.querySelector('.detail-right-section');
  const left_section = document.querySelector('.detail-left-section');
  const header = document.querySelector('.header');

  let shouldShowPoster = false;

  times.forEach(jamatTimeStr => {
    const [h, m] = jamatTimeStr.split(':').map(Number);
    const startWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 1, 0, 0);
    const endWindow = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m + 5, 0, 0);

    if (now >= startWindow && now <= endWindow) {
      shouldShowPoster = true;
    }
  });

  if (shouldShowPoster) {
    // Show Ayatul Kursi fullscreen with smooth fade-in
    ayatul_khusri_duaEl.style.display = 'flex';
    // Trigger reflow to enable transition
    ayatul_khusri_duaEl.offsetHeight;
    // Add show class for fade-in animation
    ayatul_khusri_duaEl.classList.add('show');

    // Hide all other sections
    right_section_time.style.display = 'none';
    if (left_section) left_section.style.display = 'none';
    if (header) header.style.display = 'none';
  } else {
    // Check if currently showing
    if (ayatul_khusri_duaEl.classList.contains('show')) {
      // Fade out smoothly before hiding
      ayatul_khusri_duaEl.classList.remove('show');

      // Wait for fade-out animation to complete before hiding
      setTimeout(() => {
        ayatul_khusri_duaEl.style.display = 'none';
      }, 1500); // Match CSS transition duration
    }

    // Show all sections
    right_section_time.style.display = 'inline-block';
    if (left_section) left_section.style.display = 'inline-block';
    if (header) header.style.display = 'flex';
  }
}



function loadPrayerTimes() {
  // Add cache buster to force fresh data on every fetch
  const cacheBuster = `?t=${Date.now()}`;
  Promise.all([
    fetch(`config/prayer-times.config.json${cacheBuster}`).then(res => res.json()),
    fetch(`config/mosque-detail.json${cacheBuster}`).then(res => res.json())
  ])
    .then(([data, config]) => {
      // Change detection - only update DOM if data changed
      const newHash = JSON.stringify(data);
      const dataChanged = newHash !== previousPrayerTimesHash;

      if (dataChanged) {
        previousPrayerTimesHash = newHash;
        cachedPrayerData = data;

        // Display prayer times (only when changed)
        document.getElementById('fajr-azaan-time').textContent = to12Hour(data.FAJR_AZAAN);
        document.getElementById('fajr-time').textContent = to12Hour(data.FAJR_JAMAT);

        document.getElementById('zuhar-azaan-time').textContent = to12Hour(data.ZUHAR_AZAAN);
        document.getElementById('zuhar-time').textContent = to12Hour(data.ZUHAR_JAMAT);

        document.getElementById('asr-azaan-time').textContent = to12Hour(data.ASR_AZAAN);
        document.getElementById('asr-time').textContent = to12Hour(data.ASR_JAMAT);

        document.getElementById('maghrib-azaan-time').textContent = to12Hour(data.MAGHRIB_AZAAN);
        document.getElementById('maghrib-time').textContent = to12Hour(data.MAGHRIB_JAMAT);

        document.getElementById('isha-azaan-time').textContent = to12Hour(data.ISHA_AZAAN);
        document.getElementById('isha-time').textContent = to12Hour(data.ISHA_JAMAT);

        document.getElementById('jumah-azaan-time').textContent = to12Hour(data.JUMAH_AZAAN);
        document.getElementById('jumah-jamat-time').textContent = to12Hour(data.JUMAH_JAMAT);

        // Update beep player with prayer times (if beep player is loaded)
        if (typeof updatePrayerTimesForBeep === 'function') {
          updatePrayerTimesForBeep(data);
        }

        // Set global variables for Maghrib Jamat and Isha Azan using actual timings
        window.maghribJamatTime = data.MAGHRIB_JAMAT;
        window.ishaAzanTime = data.ISHA_AZAAN;
        window.fajrAzanTime = data.FAJR_AZAAN;

        // Now update sun times (only when data changes)
        if (typeof updateSunTimes === "function") updateSunTimes();

        console.log('📿 Prayer times updated from config');
      }

      // These need to run every time (time-based calculations)
      updateTimeBasedDisplay(data);
    })
    .catch(err => {
      console.error('Failed to load config files:', err);
    });
}

// Separate function for time-based updates (runs every interval)
function updateTimeBasedDisplay(data) {
  if (!data) data = cachedPrayerData;
  if (!data) return;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isFriday = now.getDay() === 5;

  // Calculate next prayer
  const prayers = [
    { name: 'FAJR', azaan: data.FAJR_AZAAN, jamat: data.FAJR_JAMAT },
    { name: isFriday ? 'JUMAH' : 'ZUHAR', azaan: isFriday ? data.JUMAH_AZAAN : data.ZUHAR_AZAAN, jamat: isFriday ? data.JUMAH_JAMAT : data.ZUHAR_JAMAT },
    { name: 'ASR', azaan: data.ASR_AZAAN, jamat: data.ASR_JAMAT },
    { name: 'MAGHRIB', azaan: data.MAGHRIB_AZAAN, jamat: data.MAGHRIB_JAMAT },
    { name: 'ISHA', azaan: data.ISHA_AZAAN, jamat: data.ISHA_JAMAT }
  ];

  // Find next prayer (wrap to FAJR after ISHA)
  let nextPrayer = null;
  for (let i = 0; i < prayers.length; i++) {
    const [h, m] = prayers[i].azaan.split(':').map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > nowMinutes) {
      nextPrayer = prayers[i];
      break;
    }
  }
  // If no prayer found (after ISHA), next is FAJR
  if (!nextPrayer) {
    nextPrayer = prayers[0];
  }

  document.getElementById('next-prayer-name').textContent = nextPrayer.name;
  document.getElementById('azaan-time').textContent = to12Hour(nextPrayer.azaan);
  document.getElementById('namaz-time').textContent = to12Hour(nextPrayer.jamat);

  // Schedule Ayatul Kursi display after each Jamat (skip only during active Taraweeh dua)
  if (taraweehActive !== true) {
    checkAllJamatTimes([
      data.FAJR_JAMAT,
      data.ZUHAR_JAMAT,
      data.ASR_JAMAT,
      data.MAGHRIB_JAMAT,
      data.ISHA_JAMAT
    ]);
  }

  // Highlight current prayer window
  highlightCurrentPrayerWindow(data);
}

// Load once on page load
window.addEventListener('load', loadPrayerTimes);

// Update time-based display every second (using cached data - no fetch)
setInterval(() => updateTimeBasedDisplay(cachedPrayerData), 1000);

// Check for config changes every 5 seconds for faster updates (only updates DOM if data changed)
setInterval(loadPrayerTimes, 5 * 1000);

// Highlight current prayer window (OPTIMIZED - only updates when prayer changes)
function highlightCurrentPrayerWindow(data) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isFriday = now.getDay() === 5;

  function toMinutes(str) {
    if (!str) return null;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  }

  // Prayer windows
  const fajrAzan = toMinutes(data.FAJR_AZAAN);
  const zuharAzan = isFriday ? toMinutes(data.JUMAH_AZAAN) : toMinutes(data.ZUHAR_AZAAN);
  const asrAzan = toMinutes(data.ASR_AZAAN);
  const maghribAzan = toMinutes(data.MAGHRIB_AZAAN);
  const ishaAzan = toMinutes(data.ISHA_AZAAN);
  // SUNRISE fallback: use zuharAzan - 10 if SUNRISE not provided
  const sunrise = data.SUNRISE ? toMinutes(data.SUNRISE) : (zuharAzan - 10);
  const nextDayFajrAzan = fajrAzan + 24 * 60;

  // Determine which prayer is currently active
  let newActivePrayer = null;
  if (nowMinutes >= fajrAzan && nowMinutes < sunrise) {
    newActivePrayer = 'fajr';
  } else if (nowMinutes >= zuharAzan && nowMinutes < asrAzan - 10) {
    newActivePrayer = isFriday ? 'jumah' : 'zuhar';
  } else if (nowMinutes >= asrAzan && nowMinutes < maghribAzan - 10) {
    newActivePrayer = 'asr';
  } else if (nowMinutes >= maghribAzan && nowMinutes < ishaAzan - 10) {
    newActivePrayer = 'maghrib';
  } else if ((nowMinutes >= ishaAzan && nowMinutes < nextDayFajrAzan - 10) || (nowMinutes < fajrAzan && nowMinutes >= 0)) {
    newActivePrayer = 'isha';
  }

  // OPTIMIZATION: Only update DOM if active prayer changed
  if (newActivePrayer === currentActivePrayer) {
    return; // No change, skip all DOM operations
  }

  // Prayer element mappings
  const prayerElements = {
    'fajr': { azaan: 'fajr-azaan-time', jamat: 'fajr-time', index: 0 },
    'zuhar': { azaan: 'zuhar-azaan-time', jamat: 'zuhar-time', index: 1 },
    'asr': { azaan: 'asr-azaan-time', jamat: 'asr-time', index: 2 },
    'maghrib': { azaan: 'maghrib-azaan-time', jamat: 'maghrib-time', index: 3 },
    'isha': { azaan: 'isha-azaan-time', jamat: 'isha-time', index: 4 },
    'jumah': { azaan: 'jumah-azaan-time', jamat: 'jumah-jamat-time', index: 5 }
  };

  // Remove highlight from previous prayer only
  if (currentActivePrayer && prayerElements[currentActivePrayer]) {
    const prev = prayerElements[currentActivePrayer];
    document.getElementById(prev.azaan)?.classList.remove('active-prayer');
    document.getElementById(prev.jamat)?.classList.remove('active-prayer');
    document.querySelectorAll(`[data-index="${prev.index}"]`).forEach(el => el.classList.remove('active-prayer'));
  }

  // Add highlight to new prayer only
  if (newActivePrayer && prayerElements[newActivePrayer]) {
    const curr = prayerElements[newActivePrayer];
    document.getElementById(curr.azaan)?.classList.add('active-prayer');
    document.getElementById(curr.jamat)?.classList.add('active-prayer');
    document.querySelectorAll(`[data-index="${curr.index}"]`).forEach(el => el.classList.add('active-prayer'));
  }

  currentActivePrayer = newActivePrayer;
  console.log(`🕌 Prayer highlight: ${currentActivePrayer || 'none'}`);
}
