const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const toast = document.getElementById('toast');
let toastTimer;
document.querySelectorAll('.project-card .play-button').forEach((button) => {
  button.addEventListener('click', () => {
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  });
});

// Add your real email and portfolio/social links in index.html before publishing.
