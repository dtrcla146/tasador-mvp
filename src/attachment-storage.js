(function () {
    const DATABASE_NAME = "TasadorMvpFiles";
    const DATABASE_VERSION = 1;
    const STORE_NAME = "attachments";

    let databasePromise;

    function openDatabase() {
        if (!("indexedDB" in window)) {
        return Promise.reject(
            new Error("Este navegador no admite IndexedDB.")
        );
        }

        if (databasePromise) {
        return databasePromise;
        }

        databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(
            DATABASE_NAME,
            DATABASE_VERSION
        );

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
            const store = database.createObjectStore(STORE_NAME, {
                keyPath: "id",
            });

            store.createIndex("assessmentId", "assessmentId", {
                unique: false,
            });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
            reject(request.error || new Error("No se pudo abrir la base local."));
        });

        return databasePromise;
    }

    

    function save(attachment) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).put(attachment);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudo guardar el archivo."));
            transaction.onabort = () =>
                reject(transaction.error || new Error("Se canceló el guardado."));
            })
        );
    }
    // los adjuntos se consultan en IndexedDB por assessmentId
    function listByAssessment(assessmentId) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readonly"
            );
            const index = transaction
                .objectStore(STORE_NAME)
                .index("assessmentId");

            let results = [];
            const request = index.getAll(
                IDBKeyRange.only(assessmentId)
            );

            request.onsuccess = () => {
                results = request.result;
            };

            transaction.oncomplete = () => resolve(results);
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudieron leer los archivos."));
            })
        );
    }

    function listAll() {
    return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
                const transaction = database.transaction(
                    STORE_NAME,
                    "readonly"
                );
                const request = transaction
                    .objectStore(STORE_NAME)
                    .getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () =>
                    reject(
                        request.error ||
                        new Error("No se pudieron leer los archivos.")
                    );
            })
    );
    }


    function remove(attachmentId) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).delete(attachmentId);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudo eliminar el archivo."));
            })
        );
    }

    function removeForAssessment(assessmentId) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index("assessmentId");
            const request = index.openKeyCursor(
                IDBKeyRange.only(assessmentId)
            );

            request.onsuccess = () => {
                const cursor = request.result;

                if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudieron eliminar los archivos."));
            })
        );
    }

    window.TasadorFileStore = {
    save,
    listByAssessment,
    listAll,
    remove,
    removeForAssessment,
};
})();
