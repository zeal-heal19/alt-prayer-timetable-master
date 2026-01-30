let hadithList = [];
let isEidTimingAvailable = false;
let isMubarakShown = false;

// Change detection for Eid timing
let previousEidHash = null;

// Load hadiths once
function loadHadiths() {
  fetch('config/hadith.json')
    .then(response => response.json())
    .then(data => {
      hadithList = data.hadiths;
      showDailyHadith(); // Show sequential hadith
    });
}

// Get today's date string (YYYY-MM-DD) for daily tracking
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Show sequential hadith based on current day
function showDailyHadith() {
  if (hadithList.length === 0) return;

  const today = getTodayDateString();
  const lastShownDate = localStorage.getItem('hadithLastDate');
  let currentIndex = parseInt(localStorage.getItem('hadithCurrentIndex')) || 0;

  // If it's a new day, move to next hadith
  if (lastShownDate !== today) {
    currentIndex = (currentIndex + 1) % hadithList.length; // Cycle back to 0 after last hadith
    localStorage.setItem('hadithCurrentIndex', currentIndex.toString());
    localStorage.setItem('hadithLastDate', today);
    console.log(`📿 New day - showing hadith ${currentIndex + 1}/${hadithList.length}`);
  }

  // Display the hadith
  const hadith = hadithList[currentIndex];
  const h_arabicEl = document.getElementById("hadith-arabic");
  const h_urduEl = document.getElementById("hadith-urdu");

  h_arabicEl.textContent = hadith.arabic;
  h_urduEl.textContent = hadith.urdu;

  adjustFontSizeVW(h_arabicEl, 3.5, 0.2);
  adjustFontSizeVW(h_urduEl, 1.5, 0.5);
}

// Font size adjuster
function adjustFontSizeVW(element, initialFontSizeVW, minFontSizeVW) {
  let parent = element.parentElement;
  let fontSize = initialFontSizeVW;
  element.style.fontSize = `${fontSize}vw`;

  while (
    (element.scrollWidth > parent.clientWidth || element.scrollHeight > parent.clientHeight) &&
    fontSize > minFontSizeVW
  ) {
    fontSize -= 1;
    element.style.fontSize = `${fontSize}vw`;
  }
}

let eidIntervalId = null; // store setInterval ID
let cachedEidData = null; // cached Eid data

function checkEidTiming() {
  // Add cache buster to force fresh data
  const cacheBuster = `?t=${Date.now()}`;
  fetch(`config/eid-timing.json${cacheBuster}`)
    .then(response => {
      if (response.ok) {
        return response.json().then(data => {
          // Change detection - only update DOM if data changed
          const newHash = JSON.stringify(data);
          const dataChanged = newHash !== previousEidHash;

          if (dataChanged) {
            previousEidHash = newHash;
            cachedEidData = data;
            console.log('🌙 Eid timing config updated');
          }

          // Process Eid timing (using cached or new data)
          processEidDisplay(data);
        });
      } else {
        isEidTimingAvailable = false;
      }
    })
    .catch(() => {
      isEidTimingAvailable = false;
    });
}

// Separate function to process Eid display (can use cached data)
function processEidDisplay(data) {
  if (!data) data = cachedEidData;
  if (!data) return;

  const container = document.getElementById("hadith-box");
  const eidTime = new Date(data.datetime);
  const now = new Date();

  const eidMillis = eidTime.getTime();
  const eidEndMillis = eidMillis + 3 * 60 * 1000; // Eid ends after 3 mins

  // Phase 3: After Eid end time → stop checking, resume hadiths immediately
  if (now.getTime() > eidEndMillis) {
    isEidTimingAvailable = false;
    isMubarakShown = false;
    return;
  }

  // Phase 1: Before Eid time → show timing
  if (now < eidTime) {
    isEidTimingAvailable = true;
    container.innerHTML = `
      <div class="eid-timing_container">
        <div class="eid-name">
          <p class="eid-namaz-label">${data.namaz.toUpperCase()}</p>
          <p class="eid-time-label">${data.datetime.split("T")[1]}</p>
        </div>
        <div class="eid-date">
          <span class="eid-date-label">${data.datetime.split("T")[0]}</span>
        </div>
      </div>
    `;
    return;
  }

  // Phase 2: Eid time reached but still within 3 min → show Mubarak
  if (now >= eidTime && now <= eidEndMillis) {
    isEidTimingAvailable = true;
    if (!isMubarakShown) {
      container.innerHTML = `
        <div class="eid-mubarak-message">
          <h1>EID Mubarak 🌙✨</h1>
        </div>
      `;
      isMubarakShown = true;
      // ⏳ Schedule a page reload at Eid end time
      const reloadDelay = eidEndMillis - now.getTime();
      setTimeout(() => {
        location.reload();
      }, reloadDelay);
    }
  }
}

// Initial setup
window.addEventListener('load', () => {
  loadHadiths();
  checkEidTiming();
});

// Check for Eid config changes every 5 seconds for faster updates
setInterval(checkEidTiming, 5 * 1000);

// Check for new day every minute and update hadith if day changed
setInterval(() => {
  if (!isEidTimingAvailable && !isMubarakShown) {
    showDailyHadith();
  }
}, 60 * 1000); // Check every minute instead of every 24 hours
