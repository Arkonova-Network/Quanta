import {encryptWithSymmetricKey, generateAndSendKeys, restoreSymmetricKey} from "/js/CryptoUtil.js"
const chatBody = document.getElementById('chatBody');
const messageInput = document.getElementById('messageInput');

export async function sendMessage(chatId, socket,messageInput) {
    const content = messageInput.value.trim();
    if (content !== '') {
        const encryptedContent = await encryptWithSymmetricKey(localStorage.getItem(chatId), content);
        socket.emit('private:send_message', { chat_id: chatId, content: encryptedContent });
        messageInput.value = '';
    }
}

export async function joinPrivateChat(chatId, socket) {
    return new Promise((resolve, reject) => {
    socket.emit('private:join', { chat_id: chatId });

    socket.once('private:joined', async (data) => {
      console.log('Ответ private:joined', data);

      if (data.sink_p && data.sink_u) {
        // Если ключи есть, сразу возвращаем данные
        console.log('good key')
        resolve(data);
      } else {
        // В случае отсутствия одного или обоих ключей
              if (!data.sink_p || !data.sink_u) {
           console.log('Нет симметричных ключей, генерируем новые');
          try {
            await generateAndSendKeys(chatId, socket);
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
            await restoreSymmetricKey(chatId, socket);
            socket.emit('private:join', { chat_id: chatId });
          } catch (error) {
            console.error('Ошибка восстановления ключа для p', error);
            reject(error);
          }
        }

        if (!data.sink_u) {
          console.log('Нет симметричного ключа для u, произвожу восстановление');
          try {
            await restoreSymmetricKey(chatId, socket);
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
            await generateAndSendKeys(chatId, socket);
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