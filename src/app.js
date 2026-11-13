const STORAGE_KEY = "tasadorMvp.assessments.v1";
const OLD_DRAFT_KEY = "tasadorMvp.inspectionDraft.v1";

const form = document.querySelector("#inspection-form");
const message = document.querySelector("#form-message");
const portfolioMessage = document.querySelector("#portfolio-message");
const assessmentList = document.querySelector("#assessment-list");
const newAssessmentButton = document.querySelector("#new-assessment");
const pageTitle = document.querySelector("#page-title");

const comparableEditor = document.querySelector("#comparable-editor");
const comparableList = document.querySelector("#comparable-list");
const comparableMessage = document.querySelector("#comparable-message");
const addComparableButton = document.querySelector("#add-comparable");

const sourceInput = document.querySelector("#comparable-source");
const priceInput = document.querySelector("#comparable-price");
const dateInput = document.querySelector("#comparable-date");
const areaInput = document.querySelector("#comparable-area");
const areaTypeInput = document.querySelector("#comparable-area-type");
const locationInput = document.querySelector("#comparable-location");
const urlInput = document.querySelector("#comparable-url");
const notesInput = document.querySelector("#comparable-notes");
const verifiedInput = document.querySelector("#comparable-verified");
const attachmentInput = document.querySelector("#attachment-input");
const attachmentList = document.querySelector("#attachment-list");
const attachmentMessage = document.querySelector("#attachment-message");
const saveAttachmentsButton = document.querySelector("#save-attachments");
const API_BASE_URL = "http://127.0.0.1:8000";

let assessments = [];
let activeId = null;
let comparableRecords = [];
let editingComparableId = null;
let isDirty = false;
let saveTimer;



const statusLabels = {
    pendiente: "Pendiente",
    inspeccion: "Inspección",
    revision: "En revisión",
    entregada: "Entregada",
    };

    const sourceLabels = {
    anuncio: "Anuncio",
    venta: "Venta cerrada",
    tasacion: "Tasación previa",
    fiscal: "Valor fiscal",
    otro: "Otra fuente",
};

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readAssessments() {
    try {
        const savedText = localStorage.getItem(STORAGE_KEY);

        if (savedText) {
        const savedData = JSON.parse(savedText);

        if (
            savedData.version === 1 &&
            Array.isArray(savedData.assessments)
        ) {
            return savedData.assessments.map((assessment) => ({
            ...assessment,
            comparables: Array.isArray(assessment.comparables)
                ? assessment.comparables
                : [],
            }));
        }
        }

        // Conserva el borrador creado en la etapa anterior.
        const oldDraftText = localStorage.getItem(OLD_DRAFT_KEY);

        if (oldDraftText) {
        const oldDraft = JSON.parse(oldDraftText);

        if (oldDraft.version === 1 && oldDraft.data) {
            const now = new Date().toISOString();

            const migratedAssessment = {
            id: createId(),
            createdAt: oldDraft.savedAt || now,
            updatedAt: oldDraft.savedAt || now,
            data: oldDraft.data,
            comparables: [],
            };

            const migratedList = [migratedAssessment];

            localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                assessments: migratedList,
            })
            );

            return migratedList;
        }
        }
    } catch (error) {
        portfolioMessage.textContent =
        "No se pudieron cargar las tasaciones guardadas.";
    }

    return [];
}

function persistAssessments(nextAssessments) {
    try {
        localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            version: 1,
            assessments: nextAssessments,
        })
        );

        return true;
    } catch (error) {
        portfolioMessage.textContent =
        "No se pudieron guardar los cambios en este navegador.";
        return false;
    }
}

const PENDING_ASSESSMENT_DELETIONS_KEY =
    "tasador.pendingAssessmentDeletions";

let syncingPendingAssessmentDeletions = false;

function getPendingAssessmentDeletionIds() {
    try {
        const ids = JSON.parse(
            localStorage.getItem(PENDING_ASSESSMENT_DELETIONS_KEY) || "[]"
        );
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch {
        return [];
    }
}

function savePendingAssessmentDeletionIds(ids) {
    localStorage.setItem(
        PENDING_ASSESSMENT_DELETIONS_KEY,
        JSON.stringify([...new Set(ids.map(String))])
    );
}

function addPendingAssessmentDeletion(id) {
    savePendingAssessmentDeletionIds([
        ...getPendingAssessmentDeletionIds(),
        String(id),
    ]);
}

function removePendingAssessmentDeletion(id) {
    savePendingAssessmentDeletionIds(
        getPendingAssessmentDeletionIds().filter(
            (pendingId) => pendingId !== String(id)
        )
    );
}

async function syncPendingAssessmentDeletions() {
    if (!navigator.onLine || syncingPendingAssessmentDeletions) return;

    syncingPendingAssessmentDeletions = true;

    try {
        for (const id of getPendingAssessmentDeletionIds()) {
            if (!navigator.onLine) break;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/assessments/${encodeURIComponent(id)}`,
                    { method: "DELETE" }
                );

                if (!response.ok && response.status !== 404) {
                    throw new Error(`HTTP ${response.status}`);
                }

                removePendingAssessmentDeletion(id);
            } catch (error) {
                console.error(
                    `No se pudo sincronizar el borrado de la tasación ${id}:`,
                    error
                );
                break;
            }
        }
    } finally {
        syncingPendingAssessmentDeletions = false;
    }
}

async function loadAssessmentsFromServer() {
    try {
        const response = await fetch("http://127.0.0.1:8000/assessments");

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const remoteAssessments = await response.json();

        if (!Array.isArray(remoteAssessments)) {
            throw new Error("Respuesta inesperada del servidor");
        }

        const pendingDeletionIds = new Set(
            getPendingAssessmentDeletionIds()
        );

        const mergedById = new Map(
            assessments
                .filter((item) => !pendingDeletionIds.has(String(item.id)))
                .map((item) => [String(item.id), item])
        );

        const pendingSyncIds = new Set(
            getPendingSyncIds().map(String)
        );

        for (const remote of remoteAssessments) {
            const remoteId = String(remote.id);

            // No permitir que una tasación pendiente de borrar reaparezca.
            if (pendingDeletionIds.has(remoteId)) continue;

            const local = mergedById.get(remoteId);

            if (
                !local ||
                (
                    !pendingSyncIds.has(remoteId) &&
                    Date.parse(remote.updatedAt) > Date.parse(local.updatedAt)
                )
            ) {
                mergedById.set(remoteId, remote);
            }
        }


        const pendingIds = new Set(getPendingSyncIds());

        for (const remote of remoteAssessments) {
            const local = mergedById.get(remote.id);

            if (!local || (!pendingIds.has(remote.id) &&
                Date.parse(remote.updatedAt) > Date.parse(local.updatedAt))
            ) {
                mergedById.set(remote.id, remote);
            }
        }

        const mergedAssessments = Array.from(mergedById.values())
            .sort(
                (a, b) =>
                    Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
            );

        if (!persistAssessments(mergedAssessments)) {
            return;
        }

        assessments = mergedAssessments;
        renderAssessments();
        portfolioMessage.textContent = "Tasaciones cargadas desde el servidor.";
    } catch (error) {
        portfolioMessage.textContent =
            "No se pudieron cargar las tasaciones del servidor; se conservan las locales.";
    }
}


function getFormData() {
    return Object.fromEntries(new FormData(form).entries());
    }

    function formatDate(dateText) {
    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
        return "fecha desconocida";
    }

    return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(amount);
}

function renderAssessments() {
    assessmentList.replaceChildren();

    if (assessments.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "Todavía no hay tasaciones guardadas.";
        assessmentList.append(emptyItem);
        return;
    }

    for (const assessment of assessments) {
        const item = document.createElement("li");
        item.className = "assessment-card";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        const location = document.createElement("p");
        const status = document.createElement("p");

        title.textContent =
        assessment.data.address?.trim() || "Tasación sin dirección";

        location.textContent =
        [assessment.data.commune, assessment.data.region]
            .filter(Boolean)
            .join(", ") || "Ubicación pendiente";

        const statusText =
        statusLabels[assessment.data.status] || "Estado sin definir";

        status.textContent =
        `${statusText} · Actualizada ${formatDate(assessment.updatedAt)}`;

        details.append(title, location, status);

        const actions = document.createElement("div");
        actions.className = "assessment-actions";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "secondary";
        openButton.textContent = "Abrir";
        openButton.addEventListener("click", () => {
        openAssessment(assessment.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger";
        deleteButton.textContent = "Eliminar";
        deleteButton.addEventListener("click", () => {
        deleteAssessment(assessment.id);
        });

        actions.append(openButton, deleteButton);
        item.append(details, actions);
        assessmentList.append(item);
    }
}

function renderComparables() {
    comparableList.replaceChildren();

    if (comparableRecords.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = "Esta tasación todavía no tiene comparables.";
        comparableList.append(emptyItem);
        return;
    }

    for (const comparable of comparableRecords) {
        const item = document.createElement("li");
        item.className = "assessment-card";

        const details = document.createElement("div");
        const title = document.createElement("h4");
        const location = document.createElement("p");
        const areaDescription =
        comparable.areaType === "terreno"
            ? "superficie de terreno"
            : "superficie construida";

        const pricePerSquareMeter =
        comparable.price / comparable.area;

        title.textContent =
        `${sourceLabels[comparable.source] || "Otra fuente"} · ` +
        formatCurrency(comparable.price);

        location.textContent = comparable.location;

        const measurement = document.createElement("p");
        measurement.textContent =
        `${comparable.area} m² de ${areaDescription} · ` +
        `${formatCurrency(pricePerSquareMeter)} / m²`;

        const referenceDate = document.createElement("p");
        referenceDate.textContent =
        `Fecha: ${comparable.date} · ` +
        (comparable.verified
            ? "Verificado por el tasador"
            : "Pendiente de verificar");

        details.append(title, location, measurement, referenceDate);

        if (comparable.notes) {
        const notes = document.createElement("p");
        notes.textContent = comparable.notes;
        details.append(notes);
        }

        if (comparable.url) {
        const link = document.createElement("a");
        link.href = comparable.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Abrir fuente";
        details.append(link);
        }

        const actions = document.createElement("div");
        actions.className = "assessment-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "secondary";
        editButton.textContent = "Editar";
        editButton.addEventListener("click", () => {
        editComparable(comparable.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger";
        deleteButton.textContent = "Eliminar";
        deleteButton.addEventListener("click", () => {
        deleteComparable(comparable.id);
        });

        actions.append(editButton, deleteButton);
        item.append(details, actions);
        comparableList.append(item);
        renderReferenceRange();
    }
}

function saveActiveAssessment(forceSave = false) {
    if (!isDirty && !forceSave) {
        return true;
    }

    const existing = assessments.find(
        (assessment) => assessment.id === activeId
    );

    const now = new Date().toISOString();

    const assessment = {
        id: activeId || createId(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        data: getFormData(),
        comparables: comparableRecords,
        version: existing?.version ?? 0,
    };

    const nextAssessments = existing
        ? assessments.map((item) =>
            item.id === assessment.id ? assessment : item
        )
        : [assessment, ...assessments];

    if (!persistAssessments(nextAssessments)) {
        return false;
    }

    assessments = nextAssessments;
    activeId = assessment.id;
    isDirty = false;

    // Evita redibujar la lista en cada autoguardado.
    if (forceSave || !existing) {
        renderAssessments();
    }

    message.textContent = "Tasación guardada localmente.";
    syncAssessmentToServer(assessment);

    return true;
}


function escapeReportHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
}

function formatReportCLP(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "—";
    }

    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(amount);
}

document
    .getElementById("generate-report")
    .addEventListener("click", () => {
        if (!form.reportValidity()) {
            return;
        }

        if (!saveActiveAssessment(true)) {
            return;
        }

        const assessment = assessments.find((item) => item.id === activeId);

        if (!assessment) {
            message.textContent = "No se encontró la tasación para generar el informe.";
            return;
        }

        const data = assessment.data;
        const comparables = assessment.comparables || [];

        const comparableRows = comparables.map((item) => {
            const pricePerM2 = Number(item.price) / Number(item.area);

            return `
                <tr>
                    <td>${escapeReportHtml(item.source)}</td>
                    <td>${escapeReportHtml(item.location)}</td>
                    <td>${escapeReportHtml(item.date)}</td>
                    <td>${escapeReportHtml(item.area)} m² (${escapeReportHtml(item.areaType)})</td>
                    <td>${formatReportCLP(item.price)}</td>
                    <td>${formatReportCLP(pricePerM2)} / m²</td>
                </tr>
            `;
        }).join("");

        const areaType =
            document.getElementById("value-range-area-type")?.value || "construida";
        const subjectArea = Number(
            areaType === "construida" ? data.builtArea : data.landArea
        );
        const range = calculateReferenceRange(
            comparables,
            subjectArea,
            areaType
        );

        const rangeHtml = range
            ? `<p>Desde: ${formatReportCLP(range.low)} · Referencia: ${formatReportCLP(range.reference)} · Hasta: ${formatReportCLP(range.high)}</p>`
            : "<p>No hay suficientes comparables compatibles para calcular un rango.</p>";

        const reportWindow = window.open("", "_blank");

        if (!reportWindow) {
            message.textContent =
                "El navegador bloqueó la ventana del informe. Permite las ventanas emergentes e inténtalo de nuevo.";
            return;
        }

        reportWindow.document.write(`
            <!doctype html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Informe de tasación</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 32px; color: #222; }
                    h1, h2 { margin-bottom: 8px; }
                    p { white-space: pre-wrap; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    @media print { body { margin: 18mm; } }
                </style>
            </head>
            <body>
                <h1>Informe de tasación</h1>
                <p>Fecha de generación: ${escapeReportHtml(new Date().toLocaleDateString("es-CL"))}</p>

                <h2>Identificación de la propiedad</h2>
                <p><strong>Tipo:</strong> ${escapeReportHtml(data.propertyType)}</p>
                <p><strong>Ubicación:</strong> ${escapeReportHtml(data.address)}, ${escapeReportHtml(data.commune)}, ${escapeReportHtml(data.region)}</p>
                <p><strong>Superficie construida:</strong> ${escapeReportHtml(data.builtArea)} m²</p>
                <p><strong>Superficie de terreno:</strong> ${escapeReportHtml(data.landArea)} m²</p>
                <p><strong>Dormitorios:</strong> ${escapeReportHtml(data.bedrooms)} · <strong>Baños:</strong> ${escapeReportHtml(data.bathrooms)}</p>

                <h2>Inspección</h2>
                <p><strong>Estado de conservación:</strong> ${escapeReportHtml(data.condition)}</p>
                <p><strong>Materiales:</strong> ${escapeReportHtml(data.materials)}</p>
                <p><strong>Distribución:</strong> ${escapeReportHtml(data.distribution)}</p>
                <p><strong>Observaciones:</strong> ${escapeReportHtml(data.observations)}</p>

                <h2>Estudio de comparables</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Fuente</th><th>Ubicación</th><th>Fecha</th>
                            <th>Superficie</th><th>Precio</th><th>Precio por m²</th>
                        </tr>
                    </thead>
                    <tbody>${comparableRows || "<tr><td colspan='6'>No hay comparables registrados.</td></tr>"}</tbody>
                </table>

                <h2>Rango de valor de referencia</h2>
                ${rangeHtml}

                <p><em>Este rango es referencial y debe ser revisado por el tasador junto con los antecedentes y características de la propiedad.</em></p>
            </body>
            </html>
        `);

        reportWindow.document.close();
        reportWindow.focus();
        setTimeout(() => reportWindow.print(), 300);
    });


function scheduleSave() {
    isDirty = true;
    window.clearTimeout(saveTimer);

    saveTimer = window.setTimeout(() => {
        saveTimer = null;

        saveActiveAssessment(); 
    }, 500000);
}


function flushPendingSave() {
    window.clearTimeout(saveTimer);
    saveTimer = null;

    if (isDirty) {
        saveActiveAssessment();
    }
}

function clearComparableEditor() {
    editingComparableId = null;
    sourceInput.value = "anuncio";
    priceInput.value = "";
    dateInput.value = "";
    areaInput.value = "";
    areaTypeInput.value = "construida";
    locationInput.value = "";
    urlInput.value = "";
    notesInput.value = "";
    verifiedInput.checked = false;
    addComparableButton.textContent = "Agregar comparable";
}
 // ...código que prepara una ficha nueva
function startNewAssessment() {
    flushPendingSave();

    activeId = null;
    comparableRecords = [];
    isDirty = false;
    form.reset();
    clearComparableEditor();
    renderComparables();
    renderAttachments();

    pageTitle.textContent = "Nueva tasación";
    message.textContent = "Los cambios se guardarán automáticamente.";
    comparableMessage.textContent = "";
}
// ...código que carga la tasación y sus datos...
function openAssessment(id) {
    console.trace("openAssessment", id)//DEGBUG
    flushPendingSave();

    const assessment = assessments.find((item) => item.id === id);

    if (!assessment) {
        return;
    }

    form.reset();
    activeId = assessment.id;
    comparableRecords = assessment.comparables || [];
    isDirty = false;

    for (const [name, value] of Object.entries(assessment.data)) {
        const field = form.elements.namedItem(name);

        if (field && typeof value === "string") {
        field.value = value;
        }
    }

    clearComparableEditor();
    renderComparables();
    renderAttachments();

    pageTitle.textContent = "Editar tasación";
    message.textContent =
        "Editando una tasación. Los cambios se guardan automáticamente.";
    comparableMessage.textContent = "";
}

// ...código que quita la tasación de la lista...
//Guarda primero la eliminación pendiente; si no hay conexión, se sincronizará después:
async function deleteAssessment(id) {
    const assessment = assessments.find(
        (item) => String(item.id) === String(id)
    );

    if (!assessment) return;

    const confirmed = window.confirm(
        "¿Eliminar esta tasación y sus comparables? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    addPendingAssessmentDeletion(id);

    const nextAssessments = assessments.filter(
        (item) => String(item.id) !== String(id)
    );

    if (!persistAssessments(nextAssessments)) {
        removePendingAssessmentDeletion(id);
        return;
    }

    assessments = nextAssessments;
    removePendingSyncId(id);
    renderAssessments();

    try {
        await window.TasadorFileStore.removeForAssessment(id);
    } catch (error) {
        console.error("No se pudieron borrar los archivos locales:", error);
        attachmentMessage.textContent =
            "La tasación se eliminó, pero no se pudieron borrar algunos archivos locales.";
    }

    await syncPendingAssessmentDeletions();

    const stillPending = getPendingAssessmentDeletionIds().includes(
        String(id)
    );

    portfolioMessage.textContent = stillPending
        ? "Tasación eliminada localmente; el borrado del servidor queda pendiente."
        : "Tasación eliminada de este dispositivo y del servidor.";
}


function parsePrice(value) {
    const digitsOnly = value.replace(/[^\d]/g, "");
    return digitsOnly ? Number(digitsOnly) : NaN;
}

function parseArea(value) {
     return Number(value.trim().replace(",", "."));
}

function addOrUpdateComparable() {
    const price = parsePrice(priceInput.value);
    const area = parseArea(areaInput.value);
    const date = dateInput.value;
    const location = locationInput.value.trim();
    const urlText = urlInput.value.trim();

    if (!Number.isFinite(price) || price <= 0) {
        comparableMessage.textContent =
        "Ingresa un precio válido en pesos chilenos.";
        return;
    }

    if (!date) {
        comparableMessage.textContent =
        "Ingresa la fecha de referencia.";
        return;
    }

    if (!Number.isFinite(area) || area <= 0) {
        comparableMessage.textContent =
        "Ingresa una superficie válida mayor que cero.";
        return;
    }

    if (!location) {
        comparableMessage.textContent =
        "Ingresa la ubicación del comparable.";
        return;
    }

    let safeUrl = "";

    if (urlText) {
        try {
        const parsedUrl = new URL(urlText);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Protocolo no permitido");
        }

        safeUrl = parsedUrl.href;
        } catch (error) {
        comparableMessage.textContent =
            "El enlace debe ser una dirección web válida que empiece con https:// o http://.";
        return;
        }
    }

    const comparable = {
        id: editingComparableId || createId(),
        source: sourceInput.value,
        price,
        date,
        area,
        areaType: areaTypeInput.value,
        location,
        notes: notesInput.value.trim(),
        url: safeUrl,
        verified: verifiedInput.checked,
    };

    comparableRecords = editingComparableId
        ? comparableRecords.map((item) =>
            item.id === editingComparableId ? comparable : item
        )
        : [...comparableRecords, comparable];

    clearComparableEditor();
    renderComparables();
    comparableMessage.textContent = "Comparable agregado a la tasación.";
    scheduleSave();
}

function editComparable(id) {
    const comparable = comparableRecords.find((item) => item.id === id);

    if (!comparable) {
        return;
    }

    editingComparableId = id;
    sourceInput.value = comparable.source;
    priceInput.value = String(comparable.price);
    dateInput.value = comparable.date;
    areaInput.value = String(comparable.area).replace(".", ",");
    areaTypeInput.value = comparable.areaType;
    locationInput.value = comparable.location;
    urlInput.value = comparable.url;
    notesInput.value = comparable.notes;
    verifiedInput.checked = comparable.verified;
    addComparableButton.textContent = "Actualizar comparable";
    comparableMessage.textContent =
        "Edita los datos y pulsa «Actualizar comparable».";
}

function deleteComparable(id) {
    const confirmed = window.confirm("¿Eliminar este comparable?");

    if (!confirmed) {
        return;
    }

    comparableRecords = comparableRecords.filter((item) => item.id !== id);

    if (editingComparableId === id) {
        clearComparableEditor();
    }

    renderComparables();
    comparableMessage.textContent = "Comparable eliminado.";
    scheduleSave();
}

function calculateReferenceRange(comparables, subjectAreaM2, areaType) {
    const pricesPerM2 = comparables
        .filter((item) => item.areaType === areaType && item.source !== "fiscal")
        .map((item) => Number(item.price) / Number(item.area))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((a, b) => a - b);

    if (
        pricesPerM2.length < 2 ||
        !Number.isFinite(subjectAreaM2) ||
        subjectAreaM2 <= 0
    ) {
        return null;
    }

    function percentile(values, p) {
        const position = (values.length - 1) * p;
        const lower = Math.floor(position);
        const fraction = position - lower;
        const upper = Math.ceil(position);

        return values[lower] + (values[upper] - values[lower]) * fraction;
    }

    return {
        low: Math.round(percentile(pricesPerM2, 0.25) * subjectAreaM2),
        reference: Math.round(percentile(pricesPerM2, 0.50) * subjectAreaM2),
        high: Math.round(percentile(pricesPerM2, 0.75) * subjectAreaM2),
    };
}

function renderReferenceRange() {
    const areaType = document.getElementById("value-range-area-type").value;
    const areaField = form.elements.namedItem(
        areaType === "construida" ? "builtArea" : "landArea"
    );
    const subjectAreaM2 = Number(areaField.value);

    const result = calculateReferenceRange(
        comparableRecords,
        subjectAreaM2,
        areaType
    );

    const message = document.getElementById("value-range-message");
    const low = document.getElementById("value-range-low");
    const reference = document.getElementById("value-range-reference");
    const high = document.getElementById("value-range-high");

    if (!result) {
        low.textContent = "—";
        reference.textContent = "—";
        high.textContent = "—";
        message.textContent =
            "Ingresa la superficie de la tasación y agrega al menos dos comparables del mismo tipo de superficie.";
        return;
    }

    const formatCLP = (amount) =>
        new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(amount);

    low.textContent = formatCLP(result.low);
    reference.textContent = formatCLP(result.reference);
    high.textContent = formatCLP(result.high);
    message.textContent =
        "Estimación referencial; revisa la ubicación, fecha y características de cada comparable.";
}



function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PENDING_SYNC_KEY = "tasador.pendingSyncIds";
let syncingPendingAssessments = false;

function getPendingSyncIds() {
    try {
        return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY) || "[]");
    } catch {
        return [];
    }
}

function addPendingSyncId(id) {
    const ids = getPendingSyncIds();

    if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(ids));
    }
}

function removePendingSyncId(id) {
    const ids = getPendingSyncIds().filter((pendingId) => pendingId !== id);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(ids));
}

async function syncAssessmentToServer(assessment) {
    addPendingSyncId(assessment.id);

    if (!navigator.onLine) {
        message.textContent = "Sin conexión; la tasación se sincronizará después.";
        return false;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/assessments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(assessment),
        });

        if (response.status === 409) {
            removePendingSyncId(assessment.id);
            message.textContent =
                "Conflicto: se conservó la copia local, pero no se sincronizó.";
            return false;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const saved = await response.json();

        const updatedAssessments = assessments.map((item) =>
            item.id === saved.id
                ? { ...item, version: saved.version }
                : item
        );

        if (!persistAssessments(updatedAssessments)) {
            throw new Error("No se pudo guardar la versión localmente");
        }

        assessments = updatedAssessments;
        removePendingSyncId(assessment.id);
        message.textContent = "Tasación guardada localmente y enviada al servidor.";
        return true;
    } catch (error) {
        message.textContent =
            "Tasación guardada localmente; se reintentará al recuperar la conexión.";
        return false;
    }
}

async function renderAttachments() {
    attachmentList.replaceChildren();

    if (!activeId) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent =
            "Añade un archivo para crear la ficha y asociarlo a ella.";
        attachmentList.append(emptyItem);
        return;
    }

    const requestedAssessmentId = activeId;
    let localAttachments = [];
    let serverAttachments = [];
    let serverListLoaded = false;

    try {
        localAttachments =
            await window.TasadorFileStore.listByAssessment(
                requestedAssessmentId
            );
    } catch (error) {
        console.error("No se pudieron leer los archivos locales:", error);
    }

    if (navigator.onLine) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/assessments/${encodeURIComponent(
                    requestedAssessmentId
                )}/attachments`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            serverAttachments = await response.json();
            serverListLoaded = true;
        } catch (error) {
            console.warn("No se pudo consultar el servidor:", error);
        }
    }

    if (activeId !== requestedAssessmentId) return;

    const serverById = new Map(
        serverAttachments.map((item) => [String(item.id), item])
    );
    const localIds = new Set(
        localAttachments.map((item) => String(item.id))
    );

    const attachments = [
        ...localAttachments.map((item) => ({
            ...item,
            serverSynced:
                item.serverSynced === true ||
                serverById.has(String(item.id)),
            remoteOnly: false,
        })),
        ...serverAttachments
            .filter((item) => !localIds.has(String(item.id)))
            .map((item) => ({
                ...item,
                serverSynced: true,
                remoteOnly: true,
            })),
    ];

    if (attachments.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = serverListLoaded || !navigator.onLine
            ? "Esta tasación aún no tiene archivos."
            : "No hay archivos locales y no se pudo consultar el servidor.";
        attachmentList.append(emptyItem);
        return;
    }

    for (const attachment of attachments) {
        const item = document.createElement("li");
        item.className = "assessment-card";

        const details = document.createElement("div");
        const fileName = document.createElement("strong");
        const fileInfo = document.createElement("p");
        const syncStatus = document.createElement("p");

        fileName.textContent = attachment.name;
        fileInfo.textContent =
            `${attachment.type || "Tipo desconocido"} · ` +
            formatFileSize(attachment.size);

        syncStatus.textContent = attachment.remoteOnly
            ? "Disponible en el servidor; no está guardado en este dispositivo"
            : attachment.serverSynced
                ? "Sincronizado con el servidor"
                : "Pendiente de sincronización";

        details.append(fileName, fileInfo, syncStatus);

        const actions = document.createElement("div");
        actions.className = "assessment-actions";

        if (attachment.remoteOnly) {
            const downloadButton = document.createElement("a");
            downloadButton.className = "button";
            downloadButton.textContent = "Descargar";
            downloadButton.href =
                `${API_BASE_URL}/assessments/${encodeURIComponent(
                    requestedAssessmentId
                )}/attachments/${encodeURIComponent(attachment.id)}/file`;
            downloadButton.target = "_blank";
            downloadButton.rel = "noopener";
            actions.append(downloadButton);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "danger";
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", async () => {
                if (!navigator.onLine) {
                    attachmentMessage.textContent =
                        "Conéctate a internet para eliminar este archivo del servidor.";
                    return;
                }

                try {
                    const response = await fetch(
                        `${API_BASE_URL}/assessments/${encodeURIComponent(
                            requestedAssessmentId
                        )}/attachments/${encodeURIComponent(attachment.id)}`,
                        { method: "DELETE" }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    await renderAttachments();
                } catch (error) {
                    console.error("No se pudo eliminar el archivo:", error);
                    attachmentMessage.textContent =
                        "No se pudo eliminar el archivo del servidor.";
                }
            });
            actions.append(deleteButton);
        } else {
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "danger";
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", () => {
                removeAttachment(attachment.id);
            });
            actions.append(deleteButton);
        }

        item.append(details, actions);
        attachmentList.append(item);
    }
}
//el archivo se guarda en el campo blob, y save() permite guardarlo en 
// IndexedDB usando el mismo id. Descarga el archivo, lo cachea localmente y actualiza la lista:
async function downloadRemoteAttachment(attachment) {
    try {
        const url =
            `${API_BASE_URL}/assessments/` +
            `${encodeURIComponent(attachment.assessmentId)}/attachments/` +
            `${encodeURIComponent(attachment.id)}/file`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();

        await window.TasadorFileStore.save({
            id: attachment.id,
            assessmentId: attachment.assessmentId,
            name: attachment.name || "archivo",
            type: attachment.type || blob.type,
            size: blob.size,
            createdAt: attachment.createdAt || new Date().toISOString(),
            blob,
            serverSynced: true,
            serverCreatedAt: attachment.createdAt || null,
        });

        // También descarga una copia en el dispositivo.
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = attachment.name || "archivo";
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        if (activeId === attachment.assessmentId) {
            await renderAttachments();
        }

        attachmentMessage.textContent =
            "Archivo descargado y guardado en este dispositivo.";
    } catch (error) {
        console.error("No se pudo descargar el adjunto:", error);
        attachmentMessage.textContent =
            "No se pudo descargar el archivo del servidor.";
    }
}
window.addEventListener("online", () => {
    syncPendingAttachments().catch(console.error);
});

window.addEventListener("online", syncPendingAttachmentDeletions);

function openLocalAttachment(attachment) {
    if (!attachment.blob) {
        attachmentMessage.textContent =
            "Este archivo no está guardado en el dispositivo.";
        return;
    }

    const objectUrl = URL.createObjectURL(attachment.blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();

    // Mantiene la URL disponible mientras el navegador abre el archivo.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

async function renderAttachments() {
    attachmentList.replaceChildren();

    if (!activeId) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent =
            "Añade un archivo para crear la ficha y asociarlo a ella.";
        attachmentList.append(emptyItem);
        return;
    }

    const requestedAssessmentId = activeId;

    try {
        const localAttachments =
            await window.TasadorFileStore.listByAssessment(activeId);

        if (activeId !== requestedAssessmentId) return;

        const attachmentsById = new Map(
            localAttachments.map((attachment) => [
                String(attachment.id),
                { ...attachment, isRemoteOnly: false },
            ])
        );

        if (navigator.onLine) {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/assessments/` +
                    `${encodeURIComponent(requestedAssessmentId)}/attachments`
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const remoteAttachments = await response.json();

                for (const remote of remoteAttachments) {
                    const id = String(remote.id);
                    const local = attachmentsById.get(id);

                    attachmentsById.set(id, local
                        ? { ...local, serverSynced: true }
                        : { ...remote, isRemoteOnly: true, serverSynced: true }
                    );
                }
            } catch (error) {
                console.error(
                    "No se pudieron cargar los adjuntos del servidor:",
                    error
                );
            }
        }

        if (activeId !== requestedAssessmentId) return;

        const attachments = [...attachmentsById.values()];

        if (attachments.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.className = "empty-state";
            emptyItem.textContent = "Esta tasación aún no tiene archivos.";
            attachmentList.append(emptyItem);
            return;
        }

        for (const attachment of attachments) {
            const item = document.createElement("li");
            item.className = "assessment-card";

            const details = document.createElement("div");
            const fileName = document.createElement("strong");
            const fileInfo = document.createElement("p");
            const syncStatus = document.createElement("p");

            fileName.textContent = attachment.name;
            fileInfo.textContent =
                `${attachment.type || "Tipo desconocido"} · ` +
                formatFileSize(attachment.size);

            syncStatus.textContent = attachment.isRemoteOnly
                ? "Disponible en el servidor"
                : attachment.serverSynced
                    ? "Sincronizado con el servidor"
                    : "Pendiente de sincronización";

            details.append(fileName, fileInfo, syncStatus);

            const actions = document.createElement("div");
            actions.className = "assessment-actions";

            if (attachment.isRemoteOnly) {
                const downloadButton = document.createElement("button");
                downloadButton.type = "button";
                downloadButton.textContent = "Descargar";
                downloadButton.addEventListener("click", () => {
                    downloadRemoteAttachment(attachment);
                });
                actions.append(downloadButton);
            } else {
                const openButton = document.createElement("button");
                openButton.type = "button";
                openButton.textContent = "Abrir";
                openButton.addEventListener("click", () => {
                    openLocalAttachment(attachment);
                });
                actions.append(openButton);

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "danger";
                deleteButton.textContent = "Eliminar";
                deleteButton.addEventListener("click", () => {
                    removeAttachment(attachment.id);
                });
                actions.append(deleteButton);
            }

            item.append(details, actions);
            attachmentList.append(item);
        }
    } catch (error) {
        console.error("No se pudieron leer los archivos:", error);
        attachmentMessage.textContent =
            "No se pudieron leer los archivos de esta tasación.";
    }
}


async function syncPendingAttachments() {
    if (!navigator.onLine) return 0;

    const attachments = await window.TasadorFileStore.listAll();
    let failures = 0;

    for (const attachment of attachments) {
        if (attachment.serverSynced || !attachment.blob) continue;

        try {
            const formData = new FormData();
            formData.append("attachment_id", attachment.id);
            formData.append(
                "file",
                attachment.blob,
                attachment.name || "archivo"
            );

            const response = await fetch(
                `${API_BASE_URL}/assessments/${encodeURIComponent(
                    attachment.assessmentId
                )}/attachments`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.detail || `HTTP ${response.status}`);
            }

            await window.TasadorFileStore.save({
                ...attachment,
                serverSynced: true,
                serverCreatedAt: result.createdAt,
            });
        } catch (error) {
            failures++;
            console.error(
                `No se pudo sincronizar el adjunto ${attachment.id}:`,
                error
            );
        }
    }

    return failures;
}

window.addEventListener("online", () => {
    syncPendingAttachments().catch(console.error);
window.addEventListener("online", syncPendingAttachmentDeletions);
});


async function saveSelectedAttachments() {
    const files = Array.from(attachmentInput.files || []);

    if (files.length === 0) {
        attachmentMessage.textContent =
            "Primero selecciona uno o más archivos.";
        return;
    }

    flushPendingSave();

    // Si es una tasación nueva, crea su ficha para poder asociarle los archivos.
    if (!activeId) {
        isDirty = true;

        if (!saveActiveAssessment(true)) {
            attachmentMessage.textContent =
                "No se pudo crear la ficha para asociar los archivos.";
            return;
        }
    }

    try {
        for (const file of files) {
            await window.TasadorFileStore.save({
                id: createId(),
                assessmentId: activeId,
                name: file.name,
                type: file.type,
                size: file.size,
                createdAt: new Date().toISOString(),
                blob: file,
                serverSynced: false,
            });
        }

        const hasPendingSync =
            !navigator.onLine ||
            (await syncPendingAttachments()) > 0;

        attachmentInput.value = "";
        saveActiveAssessment(true);
        await renderAttachments();

        attachmentMessage.textContent = hasPendingSync
            ? "Archivos guardados en este dispositivo; algunos quedan pendientes de sincronización."
            : "Archivos guardados y sincronizados con el servidor.";
    } catch (error) {
        console.error("Error al guardar o sincronizar los archivos:", error);
        attachmentMessage.textContent =
            "Hubo un error al procesar los archivos. Revisa la consola.";
        await renderAttachments();
    }
}


async function syncPendingAssessments() {
    if (!navigator.onLine || syncingPendingAssessments) {
        return;
    }

    syncingPendingAssessments = true;

    try {
        for (const id of getPendingSyncIds()) {
            if (!navigator.onLine) {
                break;
            }

            const assessment = assessments.find((item) => item.id === id);

            if (!assessment) {
                removePendingSyncId(id);
                continue;
            }

            await syncAssessmentToServer(assessment);
        }
    } finally {
        syncingPendingAssessments = false;
    }
}

window.addEventListener("online", async () => {
    await syncPendingAssessmentDeletions();

    if (getPendingAssessmentDeletionIds().length === 0) {
        await loadAssessmentsFromServer();
        await syncPendingAssessments();
    }
});

const PENDING_ATTACHMENT_DELETIONS_KEY =
    "tasador.pendingAttachmentDeletions";

let syncingPendingAttachmentDeletions = false;

function getPendingAttachmentDeletions() {
    try {
        const items = JSON.parse(
            localStorage.getItem(PENDING_ATTACHMENT_DELETIONS_KEY) || "[]"
        );
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function savePendingAttachmentDeletions(items) {
    localStorage.setItem(
        PENDING_ATTACHMENT_DELETIONS_KEY,
        JSON.stringify(items)
    );
}

function addPendingAttachmentDeletion(assessmentId, attachmentId) {
    const items = getPendingAttachmentDeletions();

    const alreadyQueued = items.some(
        (item) =>
            String(item.assessmentId) === String(assessmentId) &&
            String(item.attachmentId) === String(attachmentId)
    );

    if (!alreadyQueued) {
        items.push({ assessmentId, attachmentId });
        savePendingAttachmentDeletions(items);
    }
}

function removePendingAttachmentDeletion(assessmentId, attachmentId) {
    const items = getPendingAttachmentDeletions().filter(
        (item) =>
            String(item.assessmentId) !== String(assessmentId) ||
            String(item.attachmentId) !== String(attachmentId)
    );

    savePendingAttachmentDeletions(items);
}

async function deleteAttachmentFromServer(assessmentId, attachmentId) {
    const response = await fetch(
        `${API_BASE_URL}/assessments/${encodeURIComponent(
            assessmentId
        )}/attachments/${encodeURIComponent(attachmentId)}`,
        { method: "DELETE" }
    );

    // Si ya no está en el servidor, la eliminación está cumplida.
    if (response.ok || response.status === 404) {
        return;
    }

    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || `HTTP ${response.status}`);
}

async function syncPendingAttachmentDeletions() {
    if (!navigator.onLine || syncingPendingAttachmentDeletions) {
        return;
    }

    syncingPendingAttachmentDeletions = true;

    try {
        for (const item of getPendingAttachmentDeletions()) {
            if (!navigator.onLine) {
                break;
            }

            try {
                await deleteAttachmentFromServer(
                    item.assessmentId,
                    item.attachmentId
                );

                removePendingAttachmentDeletion(
                    item.assessmentId,
                    item.attachmentId
                );
            } catch (error) {
                console.error(
                    "No se pudo sincronizar la eliminación del adjunto:",
                    error
                );
                // Deja este elemento y los siguientes en cola para reintentar.
                break;
            }
        }
    } finally {
        syncingPendingAttachmentDeletions = false;
    }
}


async function removeAttachment(attachmentId) {
    try {
        const attachments =
            await window.TasadorFileStore.listByAssessment(activeId);

        const attachment = attachments.find(
            (item) => String(item.id) === String(attachmentId)
        );

        if (!attachment) return;

        const assessmentId = attachment.assessmentId || activeId;

        // Considera los adjuntos antiguos sin esta propiedad como posiblemente
        // sincronizados, para evitar dejar una copia huérfana en el servidor.
        const mayExistOnServer = attachment.serverSynced !== false;

        if (mayExistOnServer) {
            // Registrar primero la intención hace que la eliminación sobreviva
            // al cierre de la pestaña o a una pérdida de conexión.
            addPendingAttachmentDeletion(assessmentId, attachmentId);
        }

        await window.TasadorFileStore.remove(attachmentId);
        await renderAttachments();

        if (mayExistOnServer && navigator.onLine) {
            await syncPendingAttachmentDeletions();

            const stillPending = getPendingAttachmentDeletions().some(
                (item) =>
                    String(item.assessmentId) === String(assessmentId) &&
                    String(item.attachmentId) === String(attachmentId)
            );

            attachmentMessage.textContent = stillPending
                ? "Archivo eliminado del dispositivo; se reintentará borrar del servidor."
                : "Archivo eliminado del dispositivo y del servidor.";
        } else if (mayExistOnServer) {
            attachmentMessage.textContent =
                "Archivo eliminado del dispositivo; su eliminación del servidor queda pendiente.";
        } else {
            // Nunca se había subido: basta con eliminarlo localmente.
            attachmentMessage.textContent =
                "Archivo pendiente eliminado del dispositivo.";
        }
    } catch (error) {
        console.error("No se pudo eliminar el archivo:", error);
        attachmentMessage.textContent = "No se pudo eliminar el archivo.";
    }
}



form.addEventListener("input", (event) => {
    if (!comparableEditor.contains(event.target)) {
        scheduleSave();
    }
});

form.addEventListener("change", (event) => {
    if (!comparableEditor.contains(event.target)) {
        scheduleSave();
    }
});

form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    window.clearTimeout(saveTimer);
    saveActiveAssessment(true);
    });

addComparableButton.addEventListener("click", addOrUpdateComparable);
newAssessmentButton.addEventListener("click", startNewAssessment);


saveAttachmentsButton.addEventListener("click", saveSelectedAttachments);
document
    .getElementById("value-range-area-type")
    .addEventListener("change", renderReferenceRange);

form.elements.namedItem("builtArea").addEventListener("input", renderReferenceRange);

form.elements.namedItem("landArea").addEventListener("input", renderReferenceRange);

assessments = readAssessments();
renderAssessments();
renderComparables();
startNewAssessment();
(async () => {
    await syncPendingAssessmentDeletions();

    if (getPendingAssessmentDeletionIds().length === 0) {
        await loadAssessmentsFromServer();
    }

    await syncPendingAssessments();
})();