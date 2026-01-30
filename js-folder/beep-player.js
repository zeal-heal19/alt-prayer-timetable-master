// Beep sound player for Azaan and Jamat times
// Optimized: Uses scheduled timeouts instead of checking every second
// Better performance for Raspberry Pi

// Store scheduled timeout IDs for cleanup
let scheduledTimeouts = [];

// Store previous times to detect changes
let previousTimesHash = null;

// Prayer time mapping for beep sounds
let prayerTimesForBeep = {
  FAJR_AZAAN: null,
  FAJR_JAMAT: null,
  ZUHAR_AZAAN: null,
  ZUHAR_JAMAT: null,
  ASR_AZAAN: null,
  ASR_JAMAT: null,
  MAGHRIB_AZAAN: null,
  MAGHRIB_JAMAT: null,
  ISHA_AZAAN: null,
  ISHA_JAMAT: null,
  JUMAH_AZAAN: null,
  JUMAH_JAMAT: null
};

// Function to play beep sound
function playBeep(prayerName, prayerTime) {
  const beepAudio = document.getElementById('beep-audio');
  if (beepAudio) {
    beepAudio.currentTime = 0; // Reset to start
    beepAudio.play().catch(err => {
      console.error('Error playing beep:', err);
    });
    console.log('========================================');
    console.log(`🔔 BEEP TRIGGERED!`);
    console.log(`⏰ Prayer: ${prayerName}`);
    console.log(`⏰ Time: ${prayerTime}`);
    console.log(`⏰ Actual: ${new Date().toLocaleTimeString()}`);
    console.log('========================================');
  }
}

// Clear all scheduled timeouts
function clearScheduledBeeps() {
  scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  scheduledTimeouts = [];
  console.log('🔔 Cleared all scheduled beeps');
}

// Schedule beeps for all prayer times
function schedulePrayerBeeps() {
  clearScheduledBeeps();

  const now = new Date();
  let scheduledCount = 0;

  console.log('========================================');
  console.log('🔔 SCHEDULING PRAYER BEEPS');
  console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
  console.log('========================================');

  for (const [prayerName, prayerTime] of Object.entries(prayerTimesForBeep)) {
    if (!prayerTime) continue;

    const [hours, minutes] = prayerTime.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0, 0);

    // Skip if time already passed today
    if (prayerDate <= now) {
      console.log(`⏭️ Skipped ${prayerName} (${prayerTime}) - already passed`);
      continue;
    }

    const delay = prayerDate - now;
    const delayMinutes = Math.round(delay / 60000);

    const timeoutId = setTimeout(() => {
      playBeep(prayerName, prayerTime);
    }, delay);

    scheduledTimeouts.push(timeoutId);
    scheduledCount++;
    console.log(`✅ Scheduled ${prayerName} at ${prayerTime} (in ${delayMinutes} min)`);
  }

  console.log('========================================');
  console.log(`🔔 Total scheduled: ${scheduledCount} beeps`);
  console.log('========================================');

  // Schedule midnight reset to reschedule for next day
  scheduleMidnightReset();
}

// Schedule a reset at midnight to reschedule beeps for the new day
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 5, 0); // 12:00:05 AM next day (5 sec buffer)

  const delayUntilMidnight = midnight - now;

  const resetTimeoutId = setTimeout(() => {
    console.log('🌙 Midnight reset - rescheduling beeps for new day');
    schedulePrayerBeeps();
  }, delayUntilMidnight);

  scheduledTimeouts.push(resetTimeoutId);
  console.log(`🌙 Midnight reset scheduled in ${Math.round(delayUntilMidnight / 3600000)} hours`);
}

// Function to update prayer times from config
function updatePrayerTimesForBeep(data) {
  const newTimes = {
    FAJR_AZAAN: data.FAJR_AZAAN,
    FAJR_JAMAT: data.FAJR_JAMAT,
    ZUHAR_AZAAN: data.ZUHAR_AZAAN,
    ZUHAR_JAMAT: data.ZUHAR_JAMAT,
    ASR_AZAAN: data.ASR_AZAAN,
    ASR_JAMAT: data.ASR_JAMAT,
    MAGHRIB_AZAAN: data.MAGHRIB_AZAAN,
    MAGHRIB_JAMAT: data.MAGHRIB_JAMAT,
    ISHA_AZAAN: data.ISHA_AZAAN,
    ISHA_JAMAT: data.ISHA_JAMAT,
    JUMAH_AZAAN: data.JUMAH_AZAAN,
    JUMAH_JAMAT: data.JUMAH_JAMAT
  };

  // Create hash of times to detect changes
  const newHash = JSON.stringify(newTimes);

  // Only reschedule if times have changed or first load
  if (newHash === previousTimesHash) {
    return; // No changes, skip rescheduling
  }

  // Update stored times
  prayerTimesForBeep = newTimes;
  previousTimesHash = newHash;

  console.log('========================================');
  console.log('🔔 BEEP PLAYER: Prayer times updated');
  console.log('========================================');
  console.table(prayerTimesForBeep);

  // Reschedule beeps with new times
  schedulePrayerBeeps();
}

console.log('🔔 Beep player initialized (optimized version)');
