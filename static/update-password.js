document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const old_password = document.getElementById("current_password").value;
  const new_password = document.getElementById("new_password").value;
  const confirm_password = document.getElementById("confirm_password").value;

  if (new_password !== confirm_password) {
    alert("New passwords do not match");
    return;
  }

  const token = localStorage.getItem("access_token");

  const response = await fetch("/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
    },
    body: JSON.stringify({
      old_password,
      new_password,
    }),
  });

  const result = await response.json();

  if (response.ok) {
    alert("Password updated successfully");
     // or wherever you'd like to redirect  
    window.location.href = "/"; // redirect to home page
  } else {
    alert(result.msg || "Failed to update password");
  }
});

  // Handle cancel button
  document.getElementById("caclbtn").addEventListener("click", () => {
    window.location.href = "/home";  // redirect to Flask-rendered home
  });
