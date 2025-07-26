import { goToChat } from '/gh/Arkonova-Network/Quanta/js/QuantaHub.js';

document.addEventListener('DOMContentLoaded', function () {
    console.log("connecting to server");

    const socket = io({
        maxHttpBufferSize: 10 * 1024 * 1024
    });

    console.log("connect to server");

    const chatList = document.getElementById('chatList'); // Убедись, что элемент существует
    const renderedChats = new Set(); // Храним ID уже отрисованных чатов

    function renderChats(chats) {
        const noChatsMessage = document.getElementById('noChatsMessage');
        noChatsMessage.innerHTML = ''; // Очистка

        if (chats.length === 0) {
            noChatsMessage.style.display = 'block';
            noChatsMessage.innerText = 'Нет доступных чатов';
            return;
        }

        noChatsMessage.style.display = 'none'; // Прячем, если чаты есть

        chats.forEach(chat => {
            if (renderedChats.has(chat.id)) {
                return; // Пропустить, если уже отрисован
            }

            const chatDiv = document.createElement('div');
            chatDiv.className = 'card p-2 d-flex flex-row align-items-center cursor-pointer user-button';
            chatDiv.style.cursor = 'pointer';
            chatDiv.onclick = () => {
                goToChat(chat.id, chat.Key, chat.avatar, chat.flame, chat.name, chat.userid);
            };
            chatDiv.setAttribute('data-type', chat.type);
            chatDiv.setAttribute('Key', chat.Key);

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
                avatarIMG.style.borderRadius = '50%';
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

            renderedChats.add(chat.id); // Запоминаем, что этот чат уже отрисован
        });
    }

    socket.on('connect', function () {
        socket.emit('get_user_chats');
    });

    socket.on('connect_error', function (error) {
        console.error('Ошибка подключения к серверу сокетов:', error);
        showNotification('Error connect server', 'error');
    });

    socket.on('user_chats', function (chats) {
        renderChats(chats);
    });

    socket.on('error', function (data) {
        console.error('Ошибка при загрузке чатов:', data);
        showNotification(data.message || 'Error chat loader', 'error');
    });
});

function showNotification(message, type) {
    const notificationMessage = document.getElementById("notificationMessage");
    const notificationToast = new bootstrap.Toast(document.getElementById("notificationToast"));
    notificationMessage.textContent = message;
    notificationToast.show();
}
