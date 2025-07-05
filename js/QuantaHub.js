// QuantaHub version 0.0.5
console.log("QuantaInit version 0.0.5");

import { DecryptSymmetricKey, decryptWithSymmetricKey } from "/gh/Arkonova-Network/Quanta/js/CryptoUtil.js";
import { sendMessage, joinPrivateChat } from "/gh/Arkonova-Network/Quanta/js/QuantaWebSockets.js";
import { appendMessage, toggleNoMessages } from "/gh/Arkonova-Network/Quanta/js/message.js";
import {loadOrna, loadUserBadges} from "/gh/Arkonova-Network/Quanta/js/OrnLoad.js";
const socket = io();

const meid = document.documentElement.getAttribute('me');
const noMessages = document.getElementById('noMessages');
const messageInput = document.getElementById('messageInput');
const chatBody = document.getElementById('chatBody');
let chatId = window.location.pathname.split('/')[3];
loadUserBadges();
loadOrna(document.documentElement.getAttribute('peerid'));
window.goToChat = goToChat;

document.addEventListener('DOMContentLoaded', function () {
    console.log("Initializing chat...");
    switchChat(chatId);
});

export function goToChat(newChatId, newStatus, avatar, flame, nick, userid) {
    if (newChatId === chatId) return;

	loadOrna(userid);


    window.history.replaceState(null, '', `/m/u/${newChatId}`);
    window.history.pushState({}, '', `/m/u/${newChatId}`);
    chatBody.innerHTML = '';
    updateUserProfileModal(avatar, nick, userid, flame);

    const statusElement = document.querySelector('[status]');
    if (statusElement) {
        statusElement.removeAttribute('status');
        statusElement.setAttribute('status', newStatus);
    }

    switchChat(newChatId);
}

window.addEventListener('popstate', () => {
    const newChatId = window.location.pathname.split('/')[3];
    switchChat(newChatId);
});

async function switchChat(newChatId) {
    socket.emit('private:leave', { chat_id: chatId });

    chatId = newChatId;

    await DecryptSymmetricKey(chatId);
    await joinPrivateChat(chatId, socket);

    console.log('Chat initialized');
    socket.emit('private:load_messages', { chat_id: chatId });
}

document.getElementById('sendBtn').addEventListener('click', () => {
    sendMessage(chatId, socket, messageInput);
});

console.log("Waiting for messages...");

socket.on('private:messages', async (messages) => {
    chatBody.innerHTML = '';
    console.log("Messages loaded");

    try {
        if (messages.length === 0) {
            if (noMessages) {
                toggleNoMessages(noMessages);
            } else {
                console.warn("noMessages element is missing");
            }
        } else {
            for (const message of messages) {
                try {
                    await appendMessage(message, chatBody, chatId, meid);
                } catch (err) {
                    console.error("Error in appendMessage:", err, message);
                }
            }
        }
    } catch (e) {
        console.error("Unhandled error in message processing:", e);
    }
});


socket.on('private:receive_message', async (message) => {
    if (document.hidden) {
        const decryptedText = await decryptWithSymmetricKey(localStorage.getItem(chatId), message.content);
        showBrowserNotification(`Message from ${message.sender_id}`, decryptedText);
    }
    console.log("Appending message");
    await appendMessage(message, chatBody, chatId, meid);
});

socket.on('error', (data) => {
    console.error('Socket error:', data.msg);
    showNotification(data.msg, 'error');
});

messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        // Send message on Enter without Shift
        localStorage.removeItem('messageText');
        event.preventDefault();
        sendMessage(chatId, socket, messageInput);
    } else if (event.key === 'Enter' && event.shiftKey) {
        // Add newline on Shift + Enter
        event.preventDefault();
        const cursorPosition = messageInput.selectionStart;
        messageInput.value = messageInput.value.slice(0, cursorPosition) + "\n" + messageInput.value.slice(cursorPosition);
        messageInput.selectionStart = messageInput.selectionEnd = cursorPosition + 1;
    }
});

function updateUserProfileModal(avatar, nick, id, frame) {
document.querySelectorAll('.inject-avatar').forEach(avatarElement => {
    if (avatar) {
        avatarElement.style.backgroundImage = `url("${avatar}")`;
        avatarElement.textContent = '';
    } else {
        avatarElement.style.backgroundImage = '';
        avatarElement.textContent = nick?.charAt(0).toUpperCase() || '?';
    }
});

    document.querySelectorAll('.inject-frame').forEach(frameElement => {
        if (frame) {
            frameElement.src = frame;
            frameElement.alt = 'Profile frame';
            frameElement.style.display = 'block';
        } else {
            frameElement.src = '';
            frameElement.style.display = 'none';
        }
    });
    document.querySelectorAll('.inject-nick').forEach(nickElement => {
        nickElement.textContent = nick;
    });
    document.querySelectorAll('.inject-id').forEach(idElement => {
        idElement.textContent = `User ID: ${id}`;
    });
}
