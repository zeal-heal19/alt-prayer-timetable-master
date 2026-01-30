// This script toggles visibility of sun-sehar-container, zawaal-container, Ghuroob-container, Chasht-container, Awwābīn-container, and Tahajjud-container every 30 seconds

function toggleContainers() {
    const containers = [
        document.querySelector('.sun-sehar-container'),
        document.querySelector('.zawaal-container'),
        document.querySelector('.Ghuroob-container'),
        document.querySelector('.Chasht-container'),
        document.querySelector('.Awwābīn-container'),
        document.querySelector('.Tahajjud-container'),
        document.querySelector('.sehari-container'),
        document.querySelector('.iftari-container')
    ];
    const now = new Date();
    // Calculate index based on 5-second intervals
    const index = ((now.getMinutes() * 12) + Math.floor(now.getSeconds() / 5)) % containers.length;

    // Hide all by default
    containers.forEach(c => {
        if (c) {
            c.style.display = 'none';
        }
    });

    // Show one based on index
    if (containers[index]) {
        containers[index].style.display = 'flex';
    }
}

// Initial call
toggleContainers();
// Update every 2 seconds to catch 30-second change
setInterval(toggleContainers, 2000);