document.addEventListener('DOMContentLoaded', () => {
  const chatId = document.documentElement.getAttribute('uuid');
  if (!chatId) {
    console.warn('Chat ID (uuid) not found in <html> attribute');
    return;
  }

  socket.emit('check_peer_status', { chat_id: chatId });

  socket.on('peer_status_response', data => {
    if (data.chat_id === chatId) {
      const statusEl = document.getElementById('peer-status');
      if (!statusEl) {
        console.warn('Element with id "peer-status" not found');
        return;
      }
      statusEl.textContent = data.status === 'online' ? 'Online' : 'Offline';
      statusEl.style.color = data.status === 'online' ? 'green' : 'gray';
    }
  });
});
