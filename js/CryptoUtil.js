// CryptoUtil version 0.0.5
console.log("CryptoUtil version 0.0.5");

export async function restoreSymmetricKey(chatId, socket) {
    return new Promise((resolve, reject) => {
        socket.emit('private:join:get_public_keys', { chat_id: chatId });
        socket.once('private:joined:get_public_keys', async (data) => {
            try {
                const peerPublicKey = await importPublicKey(data.peer_p_k);
                const userPublicKey = await importPublicKey(data.user_p_k);
                const existingSymmetricKeyBase64 = localStorage.getItem(chatId);
				  if (!existingSymmetricKeyBase64) {console.log('No key wait');return; }
            	console.log(existingSymmetricKeyBase64);
            	const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
            	console.log(base64ToArrayBuffer(existingSymmetricKeyBase64));
            	const sink_p = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, peerPublicKey, base64ToArrayBuffer(existingSymmetricKeyBase64));
            	const sink_u = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, userPublicKey, base64ToArrayBuffer(existingSymmetricKeyBase64));
                const sink_p_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_p)));
                const sink_u_base64 = btoa(String.fromCharCode(...new Uint8Array(sink_u)));
                socket.emit('private:join:save_sink_key', {
                    chat_id: chatId,
                    sink_p: sink_p_base64,
                    sink_u: sink_u_base64,
                });

                socket.once('private:joined:save_sink_key', (response) => {
                    console.log('Key save', response);
                    localStorage.setItem(chatId, existingSymmetricKeyBase64);
                    resolve(response);
                });

            } catch (error) {
                console.error('Error restore', error);
                reject(error);
            }
        });

        socket.once('error', (err) => {
            console.error('Key error', err);
            reject(err);
        });
    });
}
export async function generateAndSendKeys(chatId, socket) {
    return new Promise((resolve, reject) => {
        socket.emit('private:join:get_public_keys', { chat_id: chatId });
        socket.once('private:joined:get_public_keys', async (data) => {
            try {
                const peerPublicKey = await importPublicKey(data.peer_p_k);
                const userPublicKey = await importPublicKey(data.user_p_k);
                const symmetricKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 },true,["encrypt", "decrypt"]);
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
                  resolve(data);
                  location.reload(true);

                });
              } catch (error) {
                console.error('Error gen key', error);
                reject(error);
              }
            });
        socket.once('error', (err) => {reject(err);});
    });
}
export async function encryptWithSymmetricKey(symmetricKeyString, data) {
    const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
    const enc_arr = base64ToArrayBuffer(symmetricKeyString);
    const enc = new TextEncoder(); 
    const dataBuffer = enc.encode(data);
    const keyMaterial = await crypto.subtle.importKey("raw",enc_arr,{ name: "AES-GCM" },false,["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({name: "AES-GCM",iv: iv},keyMaterial,dataBuffer);
    const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.byteLength);
    return btoa(String.fromCharCode(...combined));
}
export async function decryptWithSymmetricKey(symmetricKeyString, encryptedBase64) {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const base64ToArrayBuffer = base64 => new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0))).buffer;
    const symmetricKeyString_log = base64ToArrayBuffer(symmetricKeyString)
    const encryptedCombined =  Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = encryptedCombined.slice(0, 12);
    const encryptedData = encryptedCombined.slice(12);
    const keyMaterial = await crypto.subtle.importKey("raw",symmetricKeyString_log, { name: "AES-GCM" },false,["decrypt"]);
    const decrypted = await crypto.subtle.decrypt({name: "AES-GCM",iv: iv},keyMaterial,encryptedData);
    return dec.decode(decrypted);
}
export async function DecryptSymmetricKey(chatId) {
    try {
        const element = document.querySelector('[status]');
        if (!element) {
            throw new Error("Could not find an element with a 'status' attribute.");
        }

        const encryptedBase64 = element.getAttribute('status');
        if (!encryptedBase64 || encryptedBase64 === "None") {
            console.log("No encrypted key found. Possibly already restored.");
            return;
        }
        let encryptedArrayBuffer;
        try {
            encryptedArrayBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        } catch (convErr) {
            throw new Error("Failed to convert encrypted key from base64 to binary.");
        }
        const privKeyJwkRaw = await getFromIndexedDB("privJwk");
        if (!privKeyJwkRaw) {
            throw new Error("Private key not found in storage.");
        }
        let privKeyJwk;
        try {
            privKeyJwk = typeof privKeyJwkRaw === 'string' ? JSON.parse(privKeyJwkRaw) : privKeyJwkRaw;
        } catch (parseErr) {
            throw new Error("Failed to parse the private key (JWK).");
        }
        let privateKey;
        try {
            privateKey = await importPrivateKey(privKeyJwk);
        } catch (importErr) {
            throw new Error("Failed to import the private key.");
        }
        let decryptedBuffer;
        try {
            decryptedBuffer = await crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedArrayBuffer
            );
        } catch (decryptErr) {
            throw new Error("Decryption failed. Possibly wrong key or corrupt data.");
        }

        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);

        const base64FromArrayBuffer = buffer => 
            btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const decryptedBase64 = base64FromArrayBuffer(decryptedBuffer);

        if (!chatId) {
            throw new Error("Missing chatId parameter. Cannot store the decrypted key.");
        }

        localStorage.setItem(chatId, decryptedBase64);
        console.log(`Symmetric key decrypted and saved for chatId: ${chatId}`);

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("DecryptSymmetricKey error:", message);
        showNotification?.(`Decryption error: ${message}`, 'error');
    }
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

        request.onerror = function(event) {reject("Ошибка при открытии базы данных");};
    });
}
async function importPublicKey(publicKeyBase64) {
    const publicKeyJson = JSON.parse(atob(publicKeyBase64));
    return crypto.subtle.importKey("jwk",publicKeyJson,{name: "RSA-OAEP",hash: "SHA-256",},false,["encrypt"]);
}
async function importPrivateKey(jwk) {
    return await crypto.subtle.importKey( "jwk",jwk,{name: "RSA-OAEP",hash: "SHA-256"},true,["decrypt"]);
}
