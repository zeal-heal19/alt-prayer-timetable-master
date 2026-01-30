// Convert 24-hour time to 12-hour format (no AM/PM)
function to12Hour(timeStr) {
  if (!timeStr) return '';
  let [h, m] = timeStr.split(':').map(Number);
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

let originalHadithHTML = null;

// Change detection
let previousTaraweehHash = null;
let cachedTaraweehData = null;
let cachedTimingsData = null;

// Ashra Duas
const ashraDuas = {
  first: {
    title: "Rahmah",
    dua: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغيثُ",
    duaenglish: "Ya Hayyu Ya Qayyum bi rehmatika astaghees"
  },
  second: {
    title: "Maghfirah",
    dua: "اَسْتَغْفِرُ اللہَ رَبِّی مِنْ کُلِّ زَنْبٍ وَّ اَتُوْبُ اِلَیْہِ",
    duaenglish: "Astagfirullaha rab-bi min kulli zambiyon wa-atoobuilaiyh"
  },
  third: {
    title: "Najat",
    dua: "اَللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
    duaenglish: "Allahumma Ajirni minan naar"
  }
};

// Get current Ashra dua
function getAshraDua(startDate) {
  const today = new Date();
  const firstRoza = new Date(startDate);
  firstRoza.setDate(firstRoza.getDate() + 1); // 1st Roza = next day after Taraweeh start

  const diffTime = today - firstRoza;
  const dayNumber = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (dayNumber >= 1 && dayNumber <= 10) {
    return ashraDuas.first;
  } else if (dayNumber >= 11 && dayNumber <= 20) {
    return ashraDuas.second;
  } else if (dayNumber >= 21 && dayNumber <= 30) {
    return ashraDuas.third;
  }
  return null;
}

function showTaraweehInHadithBox() {
  // Add cache buster to force fresh data
  const cacheBuster = `?t=${Date.now()}`;
  Promise.all([
    fetch(`config/taraweeh-timing.json${cacheBuster}`).then(res => res.json()),
    fetch(`config/prayer-times.config.json${cacheBuster}`).then(res => res.json())
  ])
  .then(([taraweehData, timingsData]) => {
    // Change detection - only log if data changed
    const newHash = JSON.stringify({ taraweehData, timingsData });
    if (newHash !== previousTaraweehHash) {
      previousTaraweehHash = newHash;
      cachedTaraweehData = taraweehData;
      cachedTimingsData = timingsData;
      console.log('🌙 Taraweeh/Timings config updated');
    }

    // Process display (using latest data)
    processTaraweehDisplay(taraweehData, timingsData);
  })
  .catch(err => {
    console.error("⚠️ Error loading Taraweeh or prayer timings:", err);
  });
}

// Separate function for display processing
function processTaraweehDisplay(taraweehData, timingsData) {
  if (!taraweehData) taraweehData = cachedTaraweehData;
  if (!timingsData) timingsData = cachedTimingsData;
  if (!taraweehData || !timingsData) return;

  const now = new Date();
  const yyyy_mm_dd = now.toISOString().split('T')[0];
  const currentTimeStr = now.getHours().toString().padStart(2, '0') + ":" +
                         now.getMinutes().toString().padStart(2, '0');

  const startDate = taraweehData.taraweeh_start_date;
  const endDate = taraweehData.taraweeh_end_date;
  const taraweehTime = to12Hour(taraweehData.taraweeh_time);

  const maghribAzan = timingsData.MAGHRIB_AZAAN;
  const ishaAzan = timingsData.ISHA_JAMAT;

  const hadithBox = document.getElementById("hadith-box");

  if (!originalHadithHTML && hadithBox) {
    originalHadithHTML = hadithBox.innerHTML; // store original hadith text
  }

  if (yyyy_mm_dd >= startDate && yyyy_mm_dd <= endDate) {
    // We are inside Ramadan
    if (currentTimeStr >= maghribAzan && currentTimeStr <= ishaAzan) {
      // Between Maghrib & Isha → Taraweeh timing
      hadithBox.innerHTML = `
        <div style="text-align:center;">
          <h2 class="taraweeh-time-style">
            Taraweeh - ${taraweehTime}
          </h2>
        </div>
      `;
    } else {
      // Ramadan but outside Maghrib–Isha → Ashra dua
      const ashraInfo = getAshraDua(startDate);
      hadithBox.innerHTML = `
        <div style="text-align:center;">
          <h3 style="color:#dca819; font-size: 1vw; margin-top:0%; margin-bottom:0%;padding-top:0%;">${ashraInfo ? ashraInfo.title : ""}</h3>
          <p class="ashara-dua">${ashraInfo ? ashraInfo.dua : ""}</p>
          <p class="ashara-dua-eng">${ashraInfo ? ashraInfo.duaenglish : ""}</p>
        </div>
      `;
    }
  } else {
    // Outside Ramadan → show normal hadith
    if (hadithBox && originalHadithHTML) {
      hadithBox.innerHTML = originalHadithHTML;
    }
  }
}

// 🚀 Load once on page load
window.addEventListener('load', showTaraweehInHadithBox);

// 🔁 Check for config changes every 5 seconds for faster updates
setInterval(showTaraweehInHadithBox, 5 * 1000);
