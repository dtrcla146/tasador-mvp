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

    function save(attachment, ownerId) {
        const record = {
            ...attachment,
            ownerId: ownerId || attachment.ownerId,
        };
        if (!record.ownerId) {
            return Promise.reject(new Error("Se requiere la cuenta propietaria."));
        }

        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            transaction.objectStore(STORE_NAME).put(record);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudo guardar el archivo."));
            transaction.onabort = () =>
                reject(transaction.error || new Error("Se canceló el guardado."));
            })
        );
    }
    // los adjuntos se consultan en IndexedDB por assessmentId
    function listByAssessment(assessmentId, ownerId) {
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

            transaction.oncomplete = () =>
                resolve(results.filter((item) => item.ownerId === ownerId));
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudieron leer los archivos."));
            })
        );
    }

    function listAll(ownerId) {
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

                request.onsuccess = () => {
                    const records = request.result;
                    resolve(
                        ownerId
                            ? records.filter((item) => item.ownerId === ownerId)
                            : records
                    );
                };
                request.onerror = () =>
                    reject(
                        request.error ||
                        new Error("No se pudieron leer los archivos.")
                    );
            })
    );
    }


    function remove(attachmentId, ownerId) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );

            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(attachmentId);

            request.onsuccess = () => {
                if (request.result?.ownerId === ownerId) {
                    store.delete(attachmentId);
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudo eliminar el archivo."));
            })
        );
    }

    function removeForAssessment(assessmentId, ownerId) {
        return openDatabase().then(
        (database) =>
            new Promise((resolve, reject) => {
            const transaction = database.transaction(
                STORE_NAME,
                "readwrite"
            );
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index("assessmentId");
            const request = index.openCursor(
                IDBKeyRange.only(assessmentId)
            );

            request.onsuccess = () => {
                const cursor = request.result;

                if (cursor) {
                if (cursor.value.ownerId === ownerId) {
                    store.delete(cursor.primaryKey);
                }
                cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () =>
                reject(transaction.error || new Error("No se pudieron eliminar los archivos."));
            })
        );
    }

    function claimUnassigned(ownerId) {
        return listAll().then((records) =>
            Promise.all(
                records
                    .filter((record) => !record.ownerId)
                    .map((record) => save(record, ownerId))
            )
        );
    }

    window.TasadorFileStore = {
    save,
    listByAssessment,
    listAll,
    remove,
    removeForAssessment,
    claimUnassigned,
};
})();
