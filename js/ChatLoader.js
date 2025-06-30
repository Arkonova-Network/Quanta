  document.addEventListener('DOMContentLoaded', function() {
            console.log("connecting to server");
      const socket = io({
  maxHttpBufferSize: 10 * 1024 * 1024
});

      console.log("connect to server");  
      // Функция для отрисовки чатов
      function renderChats(chats) {
          const noChatsMessage = document.getElementById('noChatsMessage');
          noChatsMessage.innerHTML = ''; // Очищаем контейнер
  
          if (chats.length === 0) {
              noChatsMessage.style.display = 'block';
              noChatsMessage.innerText = 'Нет доступных чатов';
              return;
          }
  
          noChatsMessage.style.display = 'block';
  
          chats.forEach(chat => {
            const chatDiv = document.createElement('div');
            chatDiv.className = 'card p-2 d-flex flex-row align-items-center cursor-pointer user-button';
            chatDiv.style.cursor = 'pointer';
            chatDiv.onclick = () => {
              window.location.href = `/m/u/${chat.id}`;
            };
          chatDiv.setAttribute('data-type', chat.type);
          chatDiv.setAttribute('Key', chat.Key);
            let chatName = chat.name || '';

  
const avatar = document.createElement('div');
avatar.className = 'avatar rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center me-2';
avatar.style.width = '40px';
avatar.style.height = '40px';
avatar.style.position = 'relative';
avatar.style.overflow = 'visible';
avatar.style.fontSize = '20px';
avatar.style.fontWeight = 'bold';
avatar.style.userSelect = 'none';
         
          
if (chat.avatar) {
  const avatarIMG = document.createElement('img');
  avatarIMG.src = chat.avatar;
  avatarIMG.style.width = '100%';
  avatarIMG.style.height = '100%';
  avatarIMG.style.objectFit = 'cover';
  avatarIMG.style.display = 'block';
  avatarIMG.style.borderRadius = '50%'; // поправка на правильное имя свойства

  avatar.appendChild(avatarIMG);
} else {
  const firstLetter = document.createElement('span');
  firstLetter.textContent = chat.name ? chat.name[0].toUpperCase() : '?';
  avatar.appendChild(firstLetter);
}

if (chat.flame) {
  const avatarFlame = document.createElement('img');
  avatarFlame.src = chat.flame;
  avatarFlame.style.position = 'absolute';
  avatarFlame.style.pointerEvents = 'none';
  avatarFlame.style.width = '52px';
  avatarFlame.style.height = '52px';

  avatar.appendChild(avatarFlame);
}
            const nameDiv = document.createElement('div');
            nameDiv.textContent = chat.name;
            nameDiv.className = 'fw-semibold';
      
            chatDiv.appendChild(avatar);
            chatDiv.appendChild(nameDiv);
            chatList.appendChild(chatDiv);
          });
      }
  
      // Запрашиваем чаты после подключения
      socket.on('connect', function() {
          socket.emit('get_user_chats');
      });
  
      // При ошибке подключения
      socket.on('connect_error', function(error) {
          console.error('Ошибка подключения к серверу сокетов:', error);
          showNotification('Error connect server', 'error');
      });
  
      // При получении списка чатов
      socket.on('user_chats', function(chats) {
          renderChats(chats);
      });
  
      // Обработка ошибок получения чатов
      socket.on('error', function(data) {
          console.error('Ошибка при загрузке чатов:', data);
          showNotification(data.message || 'Error chat loader', 'error');
      });
  });
  
  // Функция показа уведомлений через Bootstrap Toast
  function showNotification(message, type) {
      const notificationMessage = document.getElementById("notificationMessage");
      const notificationToast = new bootstrap.Toast(document.getElementById("notificationToast"));
      notificationMessage.textContent = message;
      notificationToast.show();
  }
