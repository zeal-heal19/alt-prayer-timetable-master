let names = [];
let currentIndex = 0;

const nameEl = document.querySelector(".allah-name");
const englishEl = document.querySelector(".allah-name-english");
const container = document.querySelector(".names-container");

// Load config file
fetch("config/99-names.json")
  .then(response => response.json())
  .then(data => {
    names = data;
    updateName(); // Show first name immediately
    setInterval(updateName, 3000); // Cycle every 3 sec
  });

function updateName() {
  // Fade out text only using requestAnimationFrame for smoother performance
  requestAnimationFrame(() => {
    nameEl.style.opacity = 0;
    englishEl.style.opacity = 0;
  });

  setTimeout(() => {
    requestAnimationFrame(() => {
      const name = names[currentIndex];
      nameEl.textContent = name.arabic;
      englishEl.textContent = name.english;


      // Check for long names and adjust font size
      const isLongName = (
        name.arabic === "مَالِكُ الْمُلْكِ" ||
        name.arabic === "ذُوالْجَلاَلِ وَالإكْرَامِ"
      );

      if (isLongName) {
        nameEl.style.fontSize = "4.0vw";
        englishEl.style.fontSize = "2.0vw";
      } else {
        nameEl.style.fontSize = ""; // revert to default
        englishEl.style.fontSize = "";
      }

      // Fade in text only
      nameEl.style.opacity = 1;
      englishEl.style.opacity = 1;

      // Move to next
      currentIndex = (currentIndex + 1) % names.length;
    });
  }, 1000); // wait for fade-out transition to complete
}