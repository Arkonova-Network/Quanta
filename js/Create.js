
const newChatButton = document.getElementById('newChatButton');
const actionButtons = document.getElementById('actionButtons');
const createGroupBtn = document.getElementById('createGroupBtn');
const createPrivateBtn = document.getElementById('createPrivateBtn');
const createChannelBtn = document.getElementById('createChannelBtn');
const createModal = new bootstrap.Modal(document.getElementById('createModal'));
let createType = "";

// Открытие/закрытие кнопок
newChatButton.addEventListener('click', () => {
  actionButtons.classList.toggle('show');
  actionButtons.classList.toggle('disabled_show');
});

// Выбор создания
createGroupBtn.addEventListener('click', () => {
  openCreateModal('group');
});
createPrivateBtn.addEventListener('click', () => {
  openCreateModal('private');
});
createChannelBtn.addEventListener('click', () => {
  openCreateModal('channel');
});

// Настройка модального окна
function openCreateModal(type) {
  createType = type;
  actionButtons.classList.remove('show');

  if (type === 'group' || type === 'channel') {
    document.getElementById('nameField').style.display = 'block';
    document.getElementById('descriptionField').style.display = 'block';
    document.getElementById('userIdField').style.display = 'none';
  } else if (type === 'private') {
    document.getElementById('nameField').style.display = 'none';
    document.getElementById('descriptionField').style.display = 'none';
    document.getElementById('userIdField').style.display = 'block';
  }

  createModal.show();
}

// Инициализация сокета (если нужен)
const socket = io();

// Кнопка "Создать"
document.getElementById('confirmCreateBtn').addEventListener('click', () => {
  const name = document.getElementById('nameInput').value.trim();
  const description = document.getElementById('descriptionInput').value.trim();
  const userId = document.getElementById('userIdInput').value.trim();
  const messageBox = document.getElementById('createMessage');

  let success = false;

  if (createType === 'group') {
    if (name) {
      socket.emit('group:create', { name, description });
      showMessage("Группа создана успешно", "success");
      success = true;
    } else {
      showMessage("Введите название группы", "error");
    }
  } else if (createType === 'private') {
    if (userId) {
      socket.emit('private:create', { peer_id: userId });
      showNotification("Приватный чат создан", "success");
      success = true;
    } else {
      showNotification("Введите ID пользователя", "error");
    }
  } else if (createType === 'channel') {
    if (name) {
      socket.emit('channel:create', { name, description });
      showNotification("Канал создан успешно", "success");
      success = true;
    } else {
      showNotification("Введите название канала", "error");
    }
  }

  if (success) {
    document.getElementById('createForm').reset();
    createModal.hide();
  }

});
