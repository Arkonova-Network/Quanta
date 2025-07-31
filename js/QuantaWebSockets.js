import {encryptWithSymmetricKey, generateAndSendKeys, restoreSymmetricKey} from "/gh/Arkonova-Network/Quanta/js/CryptoUtil.js"
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
        console.log('good key')
        resolve(data);
      } else {
              if (!data.sink_p || !data.sink_u) {
           console.log('There are no symmetric keys, so we are generating new ones.');
          try {
            await generateAndSendKeys(chatId, socket);
            socket.emit('private:join', { chat_id: chatId });
            socket.once('private:joined', (dataWithKeys) => {
              resolve(dataWithKeys);
            });
          } catch (error) {
            console.error('Error generating new keys', error);
            reject(error);
          }
        }
        if (!data.sink_p) {
          console.log('There is no symmetric key for p, restoring it.');
          try {
            await restoreSymmetricKey(chatId, socket);
            socket.emit('private:join', { chat_id: chatId });
          } catch (error) {
            console.error('Key recovery error for p', error);
            reject(error);
          }
        }

        if (!data.sink_u) {
          console.log('There is no symmetric key for u, restoring it.');
          try {
            await restoreSymmetricKey(chatId, socket);
            socket.emit('private:join', { chat_id: chatId });
          } catch (error) {
            console.error('Key recovery error for u', error);
            reject(error);
          }
        }

        if (!data.sink_p || !data.sink_u) {
          socket.once('private:joined', (dataWithKeys) => {
            resolve(dataWithKeys);
          });
        } else {
          console.log('There are no symmetric keys, we are generating new ones.');
          try {
            await generateAndSendKeys(chatId, socket);
            socket.emit('private:join', { chat_id: chatId });
            socket.once('private:joined', (dataWithKeys) => {
              resolve(dataWithKeys);
            });
          } catch (error) {
            console.error('Error generating new keys', error);
            reject(error);
          }
        }
      }
    });

    socket.once('error', (err) => {
      console.error('Error joining the chat', err);
      reject(err);
    });
  });
}
