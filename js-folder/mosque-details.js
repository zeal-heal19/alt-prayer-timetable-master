  // Load JSON data and update the H2 element
  fetch('config/mosque-detail.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load mosque details');
      }
      return response.json();
    })
    .then(data => {
      const mosqueName = data.mosque_name;
      const h2Element = document.querySelector('.footer-top h1');
      if (h2Element) {
        h2Element.textContent = `${mosqueName}`;
      }
    })
    .catch(error => {
      console.error('Error loading mosque name:', error);
    });