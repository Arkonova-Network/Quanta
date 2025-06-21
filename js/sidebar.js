  const sidebar = document.querySelector('.sidebar');
  const toggleBtn1 = document.getElementById('sidebarToggle');
  const toggleBtn2 = document.getElementById('sidebarToggle2');
  const overlay = document.getElementById('sidebarOverlay');

  function toggleSidebar() {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
  }

  toggleBtn1.addEventListener('click', toggleSidebar);
  toggleBtn2.addEventListener('click', toggleSidebar);

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
  });