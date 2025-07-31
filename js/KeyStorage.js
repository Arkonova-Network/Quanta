export async function openDatabase() {
    return new Promise((resolve, reject) => {
    const request = indexedDB.open("KeysDB", 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        db.createObjectStore("keysStore");
    };
    request.onsuccess = function(event) { resolve(event.target.result);};
    request.onerror = function(event) {reject("Error DB");};
    });
}

  
export async function getFromIndexedDB(keyName) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["keysStore"], "readonly");
        const store = transaction.objectStore("keysStore");
        const request = store.get(keyName);
        request.onsuccess = function(event) {resolve(event.target.result);};
        request.onerror = function() {reject("Error reading fromIndexedDB");};
    });
}
