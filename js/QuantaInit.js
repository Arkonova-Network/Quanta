import {DecryptSymmetricKey} from "/gh/Arkonova-Network/Quanta/js/CryptoUtil.js"
import {sendMessage,joinPrivateChat} from "/gh/Arkonova-Network/Quanta/js/QuantaWebSockets.js"
import {appendMessage,toggleNoMessages} from "/gh/Arkonova-Network/Quanta/js/message.js"
const socket = io();
const chatId = document.documentElement.getAttribute('uuid');
const meid = document.documentElement.getAttribute('me');
const noMessages = document.getElementById('noMessages');
const messageInput = document.getElementById('messageInput');
const chatBody = document.getElementById('chatBody');
 
await DecryptSymmetricKey(chatId, socket);
await joinPrivateChat(chatId, socket);
console.log('Init');
socket.emit('private:load_messages', { chat_id: chatId });

document.getElementById('sendBtn').addEventListener('click', () => {
    sendMessage(chatId, socket,messageInput);
});
console.log("load messages");
socket.on('private:messages', async (messages) => {
    chatBody.innerHTML = '';
    console.log("load messages")
    if (messages.length === 0) {
        toggleNoMessages(noMessages);
    } else {
        for (const message of messages) {await appendMessage(message,chatBody,chatId, meid);}
    }
});
console.log('wait messages')
socket.on('private:receive_message', async (message) => {
        
    if (document.hidden) {
        const decryptedText = await decryptWithSymmetricKey(localStorage.getItem(chatId), message.content);
        showBrowserNotification(`Сообщение от ${message.sender_id}`, decryptedText);
        }
        console.log("add messages")
        await appendMessage(message,chatBody,chatId, meid);
    });
    
socket.on('error', (data) => {
    console.error('Ошибка сокета:', data.msg);
    showNotification(data.msg, 'error');
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // Отправить сообщение при нажатии Enter без Shift
  	localStorage.removeItem('messageText'); 
    event.preventDefault();
    sendMessage(chatId, socket,messageInput);
  } else if (event.key === 'Enter' && event.shiftKey) {
    // Сделать перенос строки при нажатии Shift + Enter
    event.preventDefault();
    const cursorPosition = messageInput.selectionStart;
    messageInput.value = messageInput.value.slice(0, cursorPosition) + "\n" + messageInput.value.slice(cursorPosition);
    messageInput.selectionStart = messageInput.selectionEnd = cursorPosition + 1;
  }
});
