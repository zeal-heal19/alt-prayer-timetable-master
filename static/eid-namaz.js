fetch('/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "✅ eid namaz JS file loaded!" })
});

function serverLog(message) {
  fetch('/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
}
// Run on page load
window.onload = () => {

  // Handle cancel button
  document.getElementById("cancleeidBtn").addEventListener("click", () => {
    window.location.href = "/home";  // redirect to Flask-rendered home
  });
};


  // Save button: send data and redirect
  saveeidBtn.addEventListener('click', async function () {
    const namaz = document.getElementById('namaz').value;
    const datetime = document.getElementById('namaz-time').value;

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Unauthorized. Please log in.");
      return;
    }

    try {
      const response = await fetch("/update-eid-timings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ namaz, datetime })
      });

      const result = await response.json();

      if (response.ok) {
        // ✅ Save successful → redirect to home
        alert("Updated Succcessful: " + result.msg);
        serverLog("✅ Eid timings updated successfully!");
        window.location.href = "/home";
        
      } else {
        alert("Error: " + result.msg);
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  });

const now = new Date();
const isoNow = now.toISOString().slice(0,16); // Format: YYYY-MM-DDTHH:mm

const input = document.getElementById("namaz-time");
input.min = isoNow;