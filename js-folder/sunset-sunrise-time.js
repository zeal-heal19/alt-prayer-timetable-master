 let latitude, longitude; // Global variables to be set from file

function formatTime(date) {
  if (!(date instanceof Date)) return "";

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM'; // decide before converting

  hours = hours % 12 || 12; // convert 0 → 12 (12-hour format)
  hours = hours.toString().padStart(2, '0'); // always 2 digits

  return `${hours}:${minutes} ${ampm}`;
}



function updateSunTimes() {
  if (latitude === undefined || longitude === undefined) {
    console.error("Coordinates not set yet.");
    return;
  }


  const times = SunCalc.getTimes(new Date(), latitude, longitude);
  const sunrise = times.sunrise;
  const sunset = times.sunset;
  const solarNoon = times.solarNoon;
   const fajr = times.fajr; // Fajr (dawn) time

  // Zawaal period calculation
  const zawalStart = new Date(solarNoon.getTime() - 15 * 60000); // 15 min before solar noon
  const zawalEnd = new Date(solarNoon.getTime() + 5 * 60000);    // 5 min after solar noon

  // Ghuroob-e Aftaab calculation
  const ghuroobStart = sunset; // Sunset time
  const ghuroobEnd = new Date(sunset.getTime() + 15 * 60000); // 15 min after sunset

      // Chasht prayer calculation
  const chashtStart = new Date(sunrise.getTime() + 20 * 60000); // 20 min after sunrise
  const chashtEnd = new Date(zawalStart.getTime() - 10 * 60000); // 10 min before zawal (midday)

  // Awwabin prayer calculation (Maghrib Jamat to Isha Azan)
  let awwabinStart = null;
  let awwabinEnd = null;
  const now = new Date();

  // Get Maghrib Jamat and Isha Azan from global variables (should be set as "HH:MM" strings)
  if (window.maghribJamatTime && /^\d{2}:\d{2}$/.test(window.maghribJamatTime)) {
    const [mjH, mjM] = window.maghribJamatTime.split(':').map(Number);
    awwabinStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mjH, mjM, 0, 0);
  }
  if (window.ishaAzanTime && /^\d{2}:\d{2}$/.test(window.ishaAzanTime)) {
    const [iaH, iaM] = window.ishaAzanTime.split(':').map(Number);
    awwabinEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), iaH, iaM, 0, 0);
  }


  // Tahajjud calculation
  // Night length = Fajr - Maghrib
  // Tahajjud best time: last third of the night (after Isha and sleep)
  let tahajjudStart = null;
  let tahajjudEnd = null;

  // Get Maghrib and Fajr as Date objects
  let maghribTime = sunset;
  let fajrTime = fajr;

  // If global variables exist, use them for more accuracy
  if (window.maghribJamatTime && /^\d{2}:\d{2}$/.test(window.maghribJamatTime)) {
    const [mh, mm] = window.maghribJamatTime.split(':').map(Number);
    maghribTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), mh, mm, 0, 0);
  }
  if (window.fajrAzanTime && /^\d{2}:\d{2}$/.test(window.fajrAzanTime)) {
    const [fh, fm] = window.fajrAzanTime.split(':').map(Number);
    fajrTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), fh, fm, 0, 0);
    // If Fajr is after midnight, adjust date
    if (fajrTime < maghribTime) {
      fajrTime.setDate(fajrTime.getDate() + 1);
    }
  } else if (fajr < maghribTime) {
    fajrTime.setDate(fajrTime.getDate() + 1);
  }

  // Night length in ms
  const nightLengthMs = fajrTime.getTime() - maghribTime.getTime();
  const thirdMs = nightLengthMs / 3;

  // Tahajjud start: start of last third
  tahajjudStart = new Date(fajrTime.getTime() - thirdMs);
  // Tahajjud end: just before Fajr
  tahajjudEnd = new Date(fajrTime.getTime());

  // Calculation of sehari time and display
  const sehariend = new Date(fajrTime.getTime() - 3 * 60000); // 3 min before Fajr
  const sehariEl = document.getElementById("sehari-time");
  if (sehariEl) sehariEl.textContent = formatTime(sehariend);


  // Calculation of iftari time and display
  const iftaristart = new Date(maghribTime.getTime());
  const iftariEl = document.getElementById("iftari-time");
  if (iftariEl) iftariEl.textContent = formatTime(iftaristart);


  // Display Zawaal times
  const zawalAaghazEl = document.getElementById("zawal-aaghaz-time");
  const zawalIkhtitaamEl = document.getElementById("zawal-ikhtitaam-time");
  if (zawalAaghazEl) zawalAaghazEl.textContent = formatTime(zawalStart);
  if (zawalIkhtitaamEl) zawalIkhtitaamEl.textContent = formatTime(zawalEnd);

  // Display Ghuroob-e Aftaab times
  const ghuroobAaghazEl = document.getElementById("ghuroob-aaghaz-time");
  const ghuroobIkhtitaamEl = document.getElementById("ghuroob-ikhtitaam-time");
  if (ghuroobAaghazEl) ghuroobAaghazEl.textContent = formatTime(ghuroobStart);
  if (ghuroobIkhtitaamEl) ghuroobIkhtitaamEl.textContent = formatTime(ghuroobEnd);

  // Display Chasht times
  const chashtAaghazEl = document.getElementById("chasht-aaghaz-time");
  const chashtIkhtitaamEl = document.getElementById("chasht-ikhtitaam-time");
  if (chashtAaghazEl) chashtAaghazEl.textContent = formatTime(chashtStart);
  if (chashtIkhtitaamEl) chashtIkhtitaamEl.textContent = formatTime(chashtEnd);

  // Display Awwabin times
  if (awwabinStart && awwabinEnd) {
    const awwabinAaghazEl = document.getElementById("awwabin-aaghaz-time");
    const awwabinIkhtitaamEl = document.getElementById("awwabin-ikhtitaam-time");
    if (awwabinAaghazEl) awwabinAaghazEl.textContent = formatTime(awwabinStart);
    if (awwabinIkhtitaamEl) awwabinIkhtitaamEl.textContent = formatTime(awwabinEnd);
  }

  // Display Tahajjud times
  if (tahajjudStart && tahajjudEnd) {
    const tahajjudAaghazEl = document.getElementById("tahajjud-aaghaz-time");
    const tahajjudIkhtitaamEl = document.getElementById("tahajjud-ikhtitaam-time");
    if (tahajjudAaghazEl) tahajjudAaghazEl.textContent = formatTime(tahajjudStart);
    if (tahajjudIkhtitaamEl) tahajjudIkhtitaamEl.textContent = formatTime(tahajjudEnd);
  }

  // Aaghaz: sunrise
  const aaghazEl = document.getElementById("aaghaz-time");
  if (aaghazEl) aaghazEl.textContent = formatTime(sunrise);

  // Ikhtitaam: 20 min after sunrise
  const ikhtitaam = new Date(sunrise.getTime() + 20 * 60000);
  const ikhtitaamEl = document.getElementById("ikhtitaam-time");
  if (ikhtitaamEl) ikhtitaamEl.textContent = formatTime(ikhtitaam);

  // Tulu-e Aftaab: sunrise
  const sunriseEl = document.getElementById("sunrise-time");
  if (sunriseEl) sunriseEl.textContent = formatTime(sunrise);

  const sehar = new Date(sunrise.getTime() - 45 * 60000); // 45 min before sunrise
  const iftar = new Date(sunset.getTime() + 5 * 60000);   // 5 min after sunset

  const sunsetEl = document.getElementById("sunset-time");
  const seharEl = document.getElementById("sehar-time");
  const iftarEl = document.getElementById("iftar-time");
  if (sunsetEl) sunsetEl.textContent = formatTime(sunset);
  if (seharEl) seharEl.textContent = formatTime(sehar);
  if (iftarEl) iftarEl.textContent = formatTime(iftar);



}

// Load coordinates from mosque-detail.json
fetch('config/mosque-detail.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load config file");
    return response.json();
  })
  .then(data => {
    latitude = data.latitude;
    longitude = data.longitude;
    updateSunTimes(); // Now call it after coordinates are set
  })
  .catch(error => {
    console.error("Error loading mosque location:", error);
  });

// Refresh prayer times every 24 hours
setInterval(updateSunTimes, 24 * 60 * 60 * 1000);
