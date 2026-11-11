const STORAGE_KEY = "tasadorMvp.inspectionDraft.v1";

const form = document.querySelector("#inspection-form");
const message = document.querySelector("#form-message");

let saveTimer;

function getFormData() {
    return Object.fromEntries(new FormData(form).entries());
}

function saveDraft() {
    const draft = {
        version: 1,
        savedAt: new Date().toISOString(),
        data: getFormData(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        message.textContent = "Borrador guardado en este navegador.";
        return true;
    } catch (error) {
        message.textContent = "No se pudo guardar el borrador en este navegador.";
        return false;
    }
}

function loadDraft() {
    let savedDraft;

    try {
    const savedText = localStorage.getItem(STORAGE_KEY);

    if (!savedText) {
        return;
        }

        savedDraft = JSON.parse(savedText);
    } catch (error) {
        message.textContent = "No se pudo leer el borrador guardado.";
        return;
    }

    if (
        savedDraft.version !== 1 ||
        !savedDraft.data ||
        typeof savedDraft.data !== "object"
    ) {
        message.textContent = "El formato del borrador guardado no es válido.";
        return;
    }

    for (const [name, value] of Object.entries(savedDraft.data)) {
        const field = form.elements.namedItem(name);

        if (field && typeof value === "string") {
        field.value = value;
        }
    }

    message.textContent = "Se recuperó el borrador de este navegador.";
}

function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 400);
}

loadDraft();

form.addEventListener("input", scheduleSave);
form.addEventListener("change", saveDraft);

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    const wasSaved = saveDraft();

    if (wasSaved) {
        message.textContent =
        "Ficha validada y borrador guardado en este navegador.";
    } else {
        message.textContent =
        "Ficha validada, pero no se pudo guardar el borrador.";
    }
});
