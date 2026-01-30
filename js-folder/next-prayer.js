
function getPrayerTimeIn24Hrs(name, time12hr) {
    const [hours, minutes] = time12hr.split(':').map(Number);
    
    // FAJR is AM, all others are PM
    if (name === 'FAJR') {
      if (hours === 12) return { hours24: 0, hours12: 12, minutes }; // 12 AM becomes 00:00
      return { hours24: hours, hours12: hours, minutes };
    } else {
      if (hours === 12) return { hours24: 12, hours12: 12, minutes }; // 12 PM stays 12:00
      return { hours24: hours + 12, hours12: hours, minutes }; // Other PM times add 12
    }
  }
  
  function nextPrayerUpdate() {
    const now = new Date();
    const prayerRows = document.querySelectorAll('.prayer-row');
    let nextPrayer = null;
    let foundCurrent = false;
  
    // First pass: Check prayers today
    for (const row of prayerRows) {
      const name = row.querySelector('.prayer-name').textContent.trim();
      const timeStr = row.querySelector('.time').textContent.trim();
      const { hours24, hours12, minutes } = getPrayerTimeIn24Hrs(name, timeStr);
      
      const prayerTime = new Date();
      prayerTime.setHours(hours24, minutes, 0, 0);
  
      if (prayerTime > now) {
        nextPrayer = { 
          name, 
          time: prayerTime,
          displayHours: hours12,
          displayMinutes: minutes
        };
        foundCurrent = true;
        break;
      }
    }
  
    // Second pass: If no prayer found today, use first prayer tomorrow
    if (!foundCurrent && prayerRows.length > 0) {
      const firstRow = prayerRows[0];
      const name = firstRow.querySelector('.prayer-name').textContent.trim();
      const timeStr = firstRow.querySelector('.time').textContent.trim();
      const { hours24, hours12, minutes } = getPrayerTimeIn24Hrs(name, timeStr);
  
      const prayerTime = new Date();
      prayerTime.setDate(prayerTime.getDate() + 1);
      prayerTime.setHours(hours24, minutes, 0, 0);
  
      nextPrayer = { 
        name, 
        time: prayerTime,
        displayHours: hours12,
        displayMinutes: minutes
      };
    }
  
    // Update the display (12-hour format without AM/PM)
    if (nextPrayer) {
      const formatTime = (hours, minutes) => {
        return `${hours}:${String(minutes).padStart(2, '0')}`;
      };
  
      // Azaan time (original prayer time)
      const azaanTime = formatTime(nextPrayer.displayHours, nextPrayer.displayMinutes);
      
      // Namaz time (30 minutes after azaan)
      const namazTimeObj = new Date(nextPrayer.time.getTime());
      const namazHours12 = namazTimeObj.getHours() % 12 || 12;
      const namazTime = formatTime(namazHours12, namazTimeObj.getMinutes());
  
      document.getElementById('next-prayer-name').textContent = nextPrayer.name;
      document.getElementById('azaan-time').textContent = azaanTime;
      document.getElementById('namaz-time').textContent = namazTime;
    }
  }
  
  // Initialize and update every minute
  document.addEventListener("DOMContentLoaded", () => {
    nextPrayerUpdate();
    setInterval(nextPrayerUpdate, 60000);
  });