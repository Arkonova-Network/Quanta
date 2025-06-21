import { decryptWithSymmetricKey } from "/gh/Arkonova-Network/Quanta/js/CryptoUtil.js";
const noMessages = document.getElementById('noMessages');
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createMessageElement(message, meid) {
  const div = document.createElement('div');
  div.classList.add('message', message.sender_id == meid ? 'message-right' : 'message-left');

  // Экранируем HTML перед вставкой
  const escapedContent = escapeHTML(message.content);

  div.innerHTML = `
    <div class="message-content">${escapedContent}</div>
    <div class="message-time">${new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
  `;
  return div;
}
export async function appendMessage(message,chatBody, chatId, meid) {
    console.log("adding");
    const message_enc = await decryptWithSymmetricKey(localStorage.getItem(chatId), message.content);
    const newMessage = {...message,content: message_enc,};
    const messageElement = createMessageElement(newMessage, meid);
    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
    toggleNoMessages(noMessages);
}
export function toggleNoMessages(noMessages) {
    if (chatBody.children.length === 0) {
        noMessages.style.display = 'block';
    } else {
        noMessages.style.display = 'none';
        }
    }
function toggleNoMessages(noMessages) {
    if (chatBody.children.length === 0) {
        noMessages.style.display = 'block';
    } else {
        noMessages.style.display = 'none';
        }
    }
