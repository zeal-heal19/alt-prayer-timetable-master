// Run on page load
window.onload = () => {

    // Restrict start date to today or future
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // month is 0-based
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;
  // ristricting to select back date as start date
  //document.getElementById('taraweeh-start').setAttribute('min', minDate);
  // Handle cancel button
  document.getElementById("cancletaraweehBtn").addEventListener("click", () => {
    window.location.href = "/home";  // redirect to Flask-rendered home
  });
};




  // Save button: send data and redirect
  savetaraweehBtn.addEventListener('click', async function () {
    const taraweeh_start_date = document.getElementById('taraweeh-start').value;
    const taraweeh_end_date = document.getElementById('taraweeh-end').value;
    const taraweeh_time = document.getElementById('taraweeh-time').value;

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("Unauthorized. Please log in.");
      return;
    }

    try {
      const response = await fetch("/update-taraweeh-timings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ taraweeh_start_date, taraweeh_end_date, taraweeh_time })
      });

      const result = await response.json();

      if (response.ok) {
        // ✅ Save successful → redirect to home
        alert("Updated Succcessful: " + result.msg);
        window.location.href = "/home";
        
      } else {
        alert("Error: " + result.msg);
      }
    } catch (err) {
      alert("Network error: " + err.message);
    }
  });

