    document.addEventListener('DOMContentLoaded', async function () {
    	  function showBrowserNotification(from, message) {
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(`Сообщение от ${from}`, {
        body: message,
        icon: '/favicon.ico', // Можно указать путь к иконке
      });
    } else {
      console.log('Уведомление не показано: вкладка активна или нет разрешения.');
    }
  }
      console.log('DOM полностью загружен');
    	function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

      const socket = io();
      const chatId = document.documentElement.getAttribute('uuid');
      const meid = document.documentElement.getAttribute('me');
    
      console.log('Chat ID:', chatId);
      console.log('My ID:', meid);
    
      await decryptStatus();
      console.log('Статус расшифрован');
    
      (async function () {  // Обернули все в асинхронную самовызывающуюся функцию
        const chatBody = document.getElementById('chatBody');
        const messageInput = document.getElementById('messageInput');
        const noMessages = document.getElementById('noMessages');
    
        function toggleNoMessages() {
          if (chatBody.children.length === 0) {
            noMessages.style.display = 'block';
          } else {
            noMessages.style.display = 'none';
          }
        }
    
function createMessageElement(message) {
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
    
        async function appendMessage(message) {
          const message_enc = await decryptWithSymmetricKey(localStorage.getItem(chatId), message.content);
          const newMessage = {
            ...message,
            content: message_enc,
          };
          const messageElement = createMessageElement(newMessage);
          chatBody.appendChild(messageElement);
          chatBody.scrollTop = chatBody.scrollHeight;
          toggleNoMessages();
        }
    
        socket.on('private:messages', async (messages) => {
          chatBody.innerHTML = '';
          if (messages.length === 0) {
            toggleNoMessages();
          } else {
            for (const msg of messages) {
              await appendMessage(msg);
            }
          }
        });
    
        socket.on('private:receive_message', async (message) => {
        
          if (document.hidden) {
            const decryptedText = await decryptWithSymmetricKey(localStorage.getItem(chatId), message.content);
            showBrowserNotification(`Сообщение от ${message.sender_id}`, decryptedText);
          }
        
          await appendMessage(message);
        });
    
        socket.on('error', (data) => {
          console.error('Ошибка сокета:', data.msg);
          showNotification(data.msg, 'error');
        });
    
async function joinPrivateChat(chatId) {
  console.log('Присоединение к чату', chatId);
  return new Promise((resolve, reject) => {
    socket.emit('private:join', { chat_id: chatId });

    socket.once('private:joined', async (data) => {
      console.log('Ответ private:joined', data);

      if (data.sink_p && data.sink_u) {
        // Если ключи есть, сразу возвращаем данные
        resolve(data);
      } else {
        // В случае отсутствия одного или обоих ключей
              if (!data.sink_p || !data.sink_u) {
           console.log('Нет симметричных ключей, генерируем новые');
          try {
            await generateAndSendKeys(chatId);
            socket.emit('private:join', { chat_id: chatId });
            socket.once('private:joined', (dataWithKeys) => {
              resolve(dataWithKeys);
            });
          } catch (error) {
            console.error('Ошибка генерации новых ключей', error);
            reject(error);
          }
        }
        if (!data.sink_p) {
          console.log('Нет симметричного ключа для p, произвожу восстановление');
          try {
            await restoreAndSendKeys(chatId);
            socket.emit('private:join', { chat_id: chatId });
          } catch (error) {
            console.error('Ошибка восстановления ключа для p', error);
            reject(error);
          }
        }

        if (!data.sink_u) {
          console.log('Нет симметричного ключа для u, произвожу восстановление');
          try {
            await restoreAndSendKeys(chatId);
            socket.emit('private:join', { chat_id: chatId });
          } catch (error) {
            console.error('Ошибка восстановления ключа для u', error);
            reject(error);
          }
        }

        if (!data.sink_p || !data.sink_u) {
          // Перепроверяем после восстановления ключей
          socket.once('private:joined', (dataWithKeys) => {
            resolve(dataWithKeys);
          });
        } else {
          console.log('Нет симметричных ключей, генерируем новые');
          try {
            await generateAndSendKeys(chatId);
            socket.emit('private:join', { chat_id: chatId });
            socket.once('private:joined', (dataWithKeys) => {
              resolve(dataWithKeys);
            });
          } catch (error) {
            console.error('Ошибка генерации новых ключей', error);
            reject(error);
          }
        }
      }
    });

    socket.once('error', (err) => {
      console.error('Ошибка присоединения к чату', err);
      reject(err);
    });
  });
}

    
async function restoreAndSendKeys(chatId) {
    console.log('Восстановление и отправка ключей');
    return new Promise((resolve, reject) => {
        socket.emit('private:join:get_public_keys', { chat_id: chatId });
        
        socket.once('private:joined:get_public_keys', async (data) => {
            try {
                console.log('Получены публичные ключи', data);
                
                const peerPublicKey = await importPublicKey(data.peer_p_k);
                const userPublicKey = await importPublicKey(data.user_p_k);
                const existingSymmetricKeyBase64 = localStorage.getItem(chatId);
				  if (!existingSymmetricKeyBase64) {
    console.log('Ключ не найден, ожидайте восстановления...');
    return; // Завершаем выполнение функции
  }
                // Шифруем общий ключ для каждого участника
            	console.log(existingSymmetricKeyBase64);
            	const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
            	console.log(base64ToArrayBuffer(existingSymmetricKeyBase64));
            	const sink_p = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, peerPublicKey, base64ToArrayBuffer(existingSymmetricKeyBase64));
            	console.log("воставноили 1");
            	const sink_u = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, userPublicKey, base64ToArrayBuffer(existingSymmetricKeyBase64));
				console.log("воставноили 2");
                const sink_p_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_p)));
                const sink_u_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_u)));

                // Отправляем зашифрованные ключи на сервер
                socket.emit('private:join:save_sink_key', {
                    chat_id: chatId,
                    sink_p: sink_p_base64,
                    sink_u: sink_u_base64,
                });

                socket.once('private:joined:save_sink_key', (response) => {
                    console.log('Ключи успешно восстановлены и сохранены на сервере', response);
                    localStorage.setItem(chatId, existingSymmetricKeyBase64);
                    resolve(response);
                });

            } catch (error) {
                console.error('Ошибка восстановления ключей', error);
                reject(error);
            }
        });

        socket.once('error', (err) => {
            console.error('Ошибка получения публичных ключей', err);
            reject(err);
        });
    });
}
        
        
        
        
        async function generateAndSendKeys(chatId) {
          console.log('Генерация и отправка ключей');
          return new Promise((resolve, reject) => {
            socket.emit('private:join:get_public_keys', { chat_id: chatId });
            socket.once('private:joined:get_public_keys', async (data) => {
              try {
                console.log('Получены публичные ключи', data);
                const peerPublicKey = await importPublicKey(data.peer_p_k);
                const userPublicKey = await importPublicKey(data.user_p_k);
    
                const symmetricKey = await crypto.subtle.generateKey(
                  { name: "AES-GCM", length: 256 },
                  true,
                  ["encrypt", "decrypt"]
                );
                const symmetricKeyRaw = await crypto.subtle.exportKey("raw", symmetricKey);
    
                const sink_p = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, peerPublicKey, symmetricKeyRaw);
                const sink_u = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, userPublicKey, symmetricKeyRaw);
    
                const sink_p_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_p)));
                const sink_u_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_u)));
    
                socket.emit('private:join:save_sink_key', {
                  chat_id: chatId,
                  sink_p: sink_p_base64,
                  sink_u: sink_u_base64,
                });
    
                socket.once('private:joined:save_sink_key', (data) => {
                  console.log('Ключи успешно сохранены на сервере', data);
                  resolve(data);
                  location.reload(true);

                });
              } catch (error) {
                console.error('Ошибка генерации ключей', error);
                reject(error);
              }
            });
    
            socket.once('error', (err) => {
              console.error('Ошибка получения публичных ключей', err);
              reject(err);
            });
          });
        }
    
        async function sendMessage(chatId) {
          const content = messageInput.value.trim();
          if (content !== '') {
            const encryptedContent = await encryptWithSymmetricKey(localStorage.getItem(chatId), content);
            socket.emit('private:send_message', { chat_id: chatId, content: encryptedContent });
            messageInput.value = '';
          }
        }
    
        document.getElementById('sendBtn').addEventListener('click', () => {
          sendMessage(chatId);
        });
    
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    // Отправить сообщение при нажатии Enter без Shift
  	localStorage.removeItem('messageText'); 
    event.preventDefault();
    sendMessage(chatId);
  } else if (event.key === 'Enter' && event.shiftKey) {
    // Сделать перенос строки при нажатии Shift + Enter
    event.preventDefault();
    const cursorPosition = messageInput.selectionStart;
    messageInput.value = messageInput.value.slice(0, cursorPosition) + "\n" + messageInput.value.slice(cursorPosition);
    messageInput.selectionStart = messageInput.selectionEnd = cursorPosition + 1;
  }
});
    
        window.privateChat = {
          joinPrivate: joinPrivateChat,
          loadMessages: (chatId) => socket.emit('private:load_messages', { chat_id: chatId }),
          sendMessage
        };
    
        await joinPrivateChat(chatId);
        socket.emit('private:load_messages', { chat_id: chatId });
    
      })();

      async function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("KeysDB", 1);

            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                db.createObjectStore("keysStore");
            };

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };

            request.onerror = function(event) {
                reject("Ошибка при открытии базы данных");
            };
        });
      }

  
      async function getFromIndexedDB(keyName) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["keysStore"], "readonly");
            const store = transaction.objectStore("keysStore");
            const request = store.get(keyName);

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };
            request.onerror = function() {
                reject("Ошибка чтения из IndexedDB");
            };
        });
      }

      async function importPrivateKey(jwk) {
        return await crypto.subtle.importKey(
            "jwk",
            jwk,
            {
                name: "RSA-OAEP",
                hash: "SHA-256"
            },
            true,
            ["decrypt"]
        );
      }

async function decryptStatus() {
  try {
    const element = document.querySelector('[status]');
    const encryptedBase64 = element?.getAttribute('status');


    if (!encryptedBase64 || encryptedBase64 === "None") {
      console.log("Статус не опознан");
      return;
    }

    const encryptedArrayBuffer = Uint8Array.from(
      atob(encryptedBase64),
      c => c.charCodeAt(0)
    );

    const privKeyJwkRaw = await getFromIndexedDB("privJwk");
const privKeyJwk = typeof privKeyJwkRaw === 'string' ? JSON.parse(privKeyJwkRaw) : privKeyJwkRaw;
	console.log(privKeyJwk);
   	console.log(typeof privKeyJwk);
    const privateKey = await importPrivateKey(privKeyJwk);
  	console.log("ключик сломан");
	console.log(privateKey);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedArrayBuffer
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    const arrayBufferToBase64 = buffer =>
      btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const decryptedBase64 = arrayBufferToBase64(decryptedBuffer);
    const chatId = element.getAttribute('uuid');
    if (!chatId) {
      throw new Error("chatId не найден в элементе");
    }

    localStorage.setItem(chatId, decryptedBase64);
  	console.log("Статус сохранен");
    
  } catch (err) {
    console.error('Ошибка в decryptStatus:', err.message || err);
    showNotification?.(`Ошибка расшифровки статуса: ${err.message || err}`, 'error');
  }
}
    async function importPublicKey(publicKeyBase64) {
      const publicKeyJson = JSON.parse(atob(publicKeyBase64));
      return crypto.subtle.importKey(
        "jwk",
        publicKeyJson,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"]
      );
    }
      async function encryptWithSymmetricKey(symmetricKeyString, data) {
        const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
        const enc_arr = base64ToArrayBuffer(symmetricKeyString);
        const enc = new TextEncoder(); 
        const dataBuffer = enc.encode(data);
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc_arr,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
    
        const encrypted = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            keyMaterial,
            dataBuffer
        );
        const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.byteLength);
        return btoa(String.fromCharCode(...combined));
    }
      async function decryptWithSymmetricKey(symmetricKeyString, encryptedBase64) {
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
        const symmetricKeyString_log = base64ToArrayBuffer(symmetricKeyString)
        const encryptedCombined =  Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = encryptedCombined.slice(0, 12);
        const encryptedData = encryptedCombined.slice(12);
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            symmetricKeyString_log, 
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );
        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            keyMaterial,
            encryptedData
        );
    
        return dec.decode(decrypted);
    }
    
    });