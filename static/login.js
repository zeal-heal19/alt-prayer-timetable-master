document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const res = await fetch('/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if (res.ok && data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      window.location.href = "/home";
    } else {
      let msg = document.getElementById('login-error');
      if (!msg) {
        msg = document.createElement('div');
        msg.id = 'login-error';
        msg.style.color = 'red';
        form.appendChild(msg);
      }
      msg.textContent = data.msg || "Login failed";
    }
  });
});