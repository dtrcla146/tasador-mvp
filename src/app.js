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
const authPanel = document.querySelector("#auth-panel");
const authForm = document.querySelector("#auth-form");
const authEmailInput = document.querySelector("#auth-email");
const authPasswordInput = document.querySelector("#auth-password");
const registrationFields = document.querySelector("#registration-fields");
const firstNameInput = document.querySelector("#auth-first-name");
const middleNameInput = document.querySelector("#auth-middle-name");
const lastNameInput = document.querySelector("#auth-last-name");
const secondLastNameInput = document.querySelector("#auth-second-last-name");
const loginButton = document.querySelector("#login-button");
const registerButton = document.querySelector("#register-button");
const showLoginButton = document.querySelector("#show-login-button");
const authMessage = document.querySelector("#auth-message");
const appContent = document.querySelector("#app-content");
const currentUserEmail = document.querySelector("#current-user-email");
const currentUserName = document.querySelector("#current-user-name");
const logoutButton = document.querySelector("#logout-button");
const dashboardView = document.querySelector("#dashboard-view");
const statusCards = document.querySelector("#status-cards");
const dashboardKpis = document.querySelector("#dashboard-kpis");
const deletedReasonsList = document.querySelector("#deleted-reasons");
const dashboardMessage = document.querySelector("#dashboard-message");
const comparableSection = document.querySelector("#comparable-section");
const comparablesPageContent = document.querySelector("#comparables-page-content");
const settingsMessage = document.querySelector("#settings-message");
const manualUfInput = document.querySelector("#manual-uf-value");
const defaultFeeInput = document.querySelector("#default-fee-uf");
const defaultDeadlineModeInput = document.querySelector("#default-deadline-mode");
const defaultDeadlineDaysInput = document.querySelector("#default-deadline-days");
const imageQualityInput = document.querySelector("#image-quality");
const imageQualityOutput = document.querySelector("#image-quality-output");
const ufValueLabel = document.querySelector("#uf-value-label");

const TOKEN_KEY = "tasadorMvp.accessToken";
const USER_KEY = "tasadorMvp.currentUser";
let currentUser = null;
let registrationMode = false;
let dashboardStats = null;
let assessmentFilter = null;
let userSettings = {
    manualUfValue: null,
    defaultFeeUf: 0,
    deadlineMode: "days",
    defaultDeadlineDays: 10,
    imageQuality: 0.65,
};
let ufValueInfo = null;

function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUserStorageKey(key) {
    if (!currentUser) {
        throw new Error("Se requiere una sesión para acceder a los datos locales.");
    }

    return `${key}.${currentUser.id}`;
}

function getUserItem(key) {
    return localStorage.getItem(getUserStorageKey(key));
}

function setUserItem(key, value) {
    localStorage.setItem(getUserStorageKey(key), value);
}

function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getAccessToken();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers }).then((response) => {
        if (response.status === 401) {
            endSession("Tu sesión venció o ya no es válida. Inicia sesión nuevamente.");
        }

        return response;
    });
}


let assessments = [];
let activeId = null;
let comparableRecords = [];
let editingComparableId = null;
let isDirty = false;
let saveTimer;

function endSession(messageText = "") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    appContent.hidden = true;
    authPanel.hidden = false;
    authMessage.textContent = messageText;
    assessments = [];
    activeId = null;
}

function migrateLegacyQueue(key) {
    if (getUserItem(key) !== null) return;

    const legacyValue = localStorage.getItem(key);
    if (legacyValue !== null) {
        setUserItem(key, legacyValue);
        localStorage.removeItem(key);
    }
}

async function requestLogin(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.detail || `Error HTTP ${response.status}`);
    }
    if (!result.access_token || !result.user?.id) {
        throw new Error("El servidor devolvió una respuesta de inicio de sesión incompleta.");
    }

    localStorage.setItem(TOKEN_KEY, result.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    currentUser = result.user;
    authPasswordInput.value = "";
    authMessage.textContent = "";
    await startAuthenticatedApp();
}

async function submitAuthentication(register = false) {
    authMessage.textContent = "";

    try {
        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value;

        if (register) {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    firstName: firstNameInput.value.trim(),
                    middleName: middleNameInput.value.trim(),
                    lastName: lastNameInput.value.trim(),
                    secondLastName: secondLastNameInput.value.trim(),
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.detail || `Error HTTP ${response.status}`);
            }
        }

        await requestLogin(email, password);
    } catch (error) {
        authMessage.textContent = error.message || "No se pudo iniciar sesión.";
    }
}

async function startAuthenticatedApp() {
    authPanel.hidden = true;
    appContent.hidden = false;
    currentUserEmail.textContent = currentUser.email;
    currentUserName.textContent =
        [currentUser.firstName, currentUser.middleName, currentUser.lastName, currentUser.secondLastName]
            .filter(Boolean)
            .join(" ");
    migrateLegacyQueue(PENDING_ASSESSMENT_DELETIONS_KEY);
    migrateLegacyQueue(PENDING_SYNC_KEY);
    migrateLegacyQueue(PENDING_ATTACHMENT_DELETIONS_KEY);
    migrateLegacyQueue(PENDING_ASSESSMENT_DELETION_REASONS_KEY);

    try {
        if (!localStorage.getItem("tasadorMvp.legacyFilesClaimed")) {
            await window.TasadorFileStore.claimUnassigned(currentUser.id);
            localStorage.setItem("tasadorMvp.legacyFilesClaimed", "true");
        }
    } catch (error) {
        console.error("No se pudieron asociar los archivos locales a la cuenta:", error);
        attachmentMessage.textContent =
            "No se pudieron preparar los archivos locales de esta cuenta.";
    }

    assessments = readAssessments();
    renderAssessments();
    renderComparables();
    startNewAssessment();
    await loadUserSettings();
    await syncPendingAssessmentDeletions();

    if (getPendingAssessmentDeletionIds().length === 0) {
        await loadAssessmentsFromServer();
    }
    await syncPendingAssessments();
    await refreshDashboard();
    pageTitle.textContent = "Resumen";
}

function setActiveView(viewId) {
    document.querySelectorAll(".app-view").forEach((view) => {
        view.hidden = view.id !== viewId;
    });
    document.querySelectorAll("#main-navigation [data-view]").forEach((button) => {
        if (button.dataset.view === viewId) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });
    const viewTitles = {
        "dashboard-view": "Resumen",
        "assessments-view": "Tasaciones",
        "comparables-view": "Comparables",
        "settings-view": "Configuración",
    };
    if (viewId !== "editor-view") {
        pageTitle.textContent = viewTitles[viewId] || "Tasador";
    }

    if (viewId === "dashboard-view") {
        refreshDashboard();
    }
}

function renderDashboard() {
    if (!dashboardStats) return;

    const metrics = [
        ["Tasaciones creadas", dashboardStats.createdCount],
        ["Activas", Object.values(dashboardStats.statusCounts).reduce((sum, count) => sum + count, 0)],
        ["Entregas", dashboardStats.deliveredCount],
        ["Devueltas a revisión", dashboardStats.returnedCount],
        ["Entregadas dentro del plazo", dashboardStats.deliveredOnTimeCount],
        ["Entregadas fuera del plazo", dashboardStats.deliveredLateCount],
        ["Sin plazo definido", dashboardStats.deliveredWithoutDeadlineCount],
        ["Eliminadas", dashboardStats.deletedCount],
        ["Por cobrar", `${dashboardStats.pendingFeeUf.toFixed(2)} UF`],
        ["Cobrado", `${dashboardStats.paidFeeUf.toFixed(2)} UF`],
    ];
    dashboardKpis.replaceChildren();
    for (const [label, value] of metrics) {
        const card = document.createElement("article");
        card.className = "kpi-card";
        const caption = document.createElement("span");
        caption.textContent = label;
        const amount = document.createElement("strong");
        amount.textContent = String(value);
        card.append(caption, amount);
        dashboardKpis.append(card);
    }

    statusCards.replaceChildren();
    for (const [status, label] of Object.entries(statusLabels)) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "status-card";
        const count = document.createElement("strong");
        count.textContent = String(dashboardStats.statusCounts[status] || 0);
        const caption = document.createElement("span");
        caption.textContent = label;
        card.append(count, caption);
        card.addEventListener("click", () => {
            assessmentFilter = status;
            renderAssessments();
            setActiveView("assessments-view");
        });
        statusCards.append(card);
    }

    deletedReasonsList.replaceChildren();
    const reasons = Object.entries(dashboardStats.deletedReasons || {});
    if (!reasons.length) {
        const item = document.createElement("li");
        item.textContent = "Todavía no hay tasaciones eliminadas.";
        deletedReasonsList.append(item);
    } else {
        for (const [reason, count] of reasons) {
            const item = document.createElement("li");
            item.textContent = `${reason}: ${count}`;
            deletedReasonsList.append(item);
        }
    }
}

async function refreshDashboard() {
    if (!getAccessToken()) return;

    try {
        const response = await apiFetch(`${API_BASE_URL}/dashboard/stats`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        dashboardStats = result;
        renderDashboard();
        dashboardMessage.textContent = "";
    } catch (error) {
        dashboardMessage.textContent =
            `No se pudieron cargar las estadísticas: ${error.message}`;
    }
}

function applySettingsToForm() {
    const deadlineMode = form.elements.namedItem("deadlineMode");
    const deadlineDays = form.elements.namedItem("deadlineDays");
    const fee = form.elements.namedItem("feeUf");
    if (deadlineMode) deadlineMode.value = userSettings.deadlineMode;
    if (deadlineDays) deadlineDays.value = String(userSettings.defaultDeadlineDays);
    if (fee) fee.value = String(userSettings.defaultFeeUf);
    updateDeadlineFields();
}

function updateDeadlineFields() {
    const isManual = form.elements.namedItem("deadlineMode").value === "manual";
    document.querySelector("#deadline-days-field").hidden = isManual;
    document.querySelector("#due-date-field").hidden = !isManual;
    form.elements.namedItem("dueDate").required = isManual;
}

function populateSettingsForm() {
    manualUfInput.value = userSettings.manualUfValue ?? "";
    defaultFeeInput.value = String(userSettings.defaultFeeUf);
    defaultDeadlineModeInput.value = userSettings.deadlineMode;
    defaultDeadlineDaysInput.value = String(userSettings.defaultDeadlineDays);
    imageQualityInput.value = String(userSettings.imageQuality);
    imageQualityOutput.value = `${Math.round(userSettings.imageQuality * 100)}%`;
    defaultDeadlineDaysInput.disabled = userSettings.deadlineMode === "manual";
}

async function loadUserSettings() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/settings`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        userSettings = result;
        populateSettingsForm();
        applySettingsToForm();
        if (userSettings.manualUfValue) {
            ufValueInfo = {
                average: userSettings.manualUfValue,
                month: "valor manual",
                source: "ingresado manualmente",
            };
            updateUfLabel();
        } else {
            refreshUfAverage();
        }
    } catch (error) {
        settingsMessage.textContent =
            `No se pudo cargar la configuración: ${error.message}`;
    }
}

function updateUfLabel() {
    if (!ufValueInfo) {
        ufValueLabel.textContent =
            "No hay un valor UF disponible; puedes ingresarlo manualmente.";
        return;
    }
    const formatted = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 2,
    }).format(ufValueInfo.average);
    ufValueLabel.textContent =
        ufValueInfo.source === "mindicador.cl"
            ? `Promedio UF de ${ufValueInfo.month}: ${formatted} (${ufValueInfo.daysIncluded} valores diarios; fuente: mindicador.cl). Puedes modificarlo manualmente.`
            : `UF ${ufValueInfo.month}: ${formatted}. Fuente: ${ufValueInfo.source}.`;
}

async function refreshUfAverage() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/settings/uf-average`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        ufValueInfo = result;
        userSettings.manualUfValue = null;
        manualUfInput.value = "";
        updateUfLabel();
        settingsMessage.textContent =
            "Promedio mensual consultado. Guarda la configuración si también quieres conservar la tarifa predeterminada.";
    } catch (error) {
        settingsMessage.textContent =
            `${error.message} Puedes escribir el valor UF manualmente.`;
        ufValueLabel.textContent =
            "No se pudo consultar el promedio del mes anterior. Indica un valor manual para calcular montos en pesos.";
    }
}

async function saveUserSettings() {
    const manualValue = manualUfInput.value.trim();
    const settings = {
        manualUfValue: manualValue ? Number(manualValue) : null,
        defaultFeeUf: Number(defaultFeeInput.value || 0),
        deadlineMode: defaultDeadlineModeInput.value,
        defaultDeadlineDays: Number(defaultDeadlineDaysInput.value || 10),
        imageQuality: Number(imageQualityInput.value),
    };

    try {
        const response = await apiFetch(`${API_BASE_URL}/settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        userSettings = result;
        populateSettingsForm();
        applySettingsToForm();
        if (userSettings.manualUfValue) {
            ufValueInfo = {
                average: userSettings.manualUfValue,
                month: "valor manual",
                source: "ingresado manualmente",
            };
            updateUfLabel();
        } else if (ufValueInfo?.source !== "mindicador.cl") {
            await refreshUfAverage();
        }
        settingsMessage.textContent = "Configuración guardada.";
        await refreshDashboard();
    } catch (error) {
        settingsMessage.textContent =
            `No se pudo guardar la configuración: ${error.message}`;
    }
}

async function compressImageForUpload(file) {
    if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        !("createImageBitmap" in window)
    ) {
        return { blob: file, name: file.name };
    }

    let image;
    try {
        image = await createImageBitmap(file);
    } catch (error) {
        console.warn("El navegador no pudo decodificar la imagen; se conservará original:", error);
        return { blob: file, name: file.name };
    }
    const scale = Math.min(1, 2048 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) {
        image.close();
        throw new Error("No se pudo preparar el compresor de imágenes.");
    }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    const compressed = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob
                ? resolve(blob)
                : reject(new Error("El navegador no pudo comprimir esta imagen.")),
            "image/webp",
            userSettings.imageQuality
        );
    });

    if (compressed.size >= file.size) {
        return { blob: file, name: file.name };
    }
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return { blob: compressed, name: `${baseName}.webp` };
}


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
        let savedText = getUserItem(STORAGE_KEY);

        if (!savedText) {
            savedText = localStorage.getItem(STORAGE_KEY);
            if (savedText) {
                setUserItem(STORAGE_KEY, savedText);
                localStorage.removeItem(STORAGE_KEY);
            }
        }

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
        const oldDraftText =
            getUserItem(OLD_DRAFT_KEY) ||
            localStorage.getItem(OLD_DRAFT_KEY);

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

            setUserItem(
            STORAGE_KEY,
            JSON.stringify({
                version: 1,
                assessments: migratedList,
            })
            );
            localStorage.removeItem(OLD_DRAFT_KEY);

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
        setUserItem(
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
            getUserItem(PENDING_ASSESSMENT_DELETIONS_KEY) || "[]"
        );
        return Array.isArray(ids) ? ids.map(String) : [];
    } catch (error) {
        console.error("No se pudieron leer las tasaciones pendientes de eliminar:", error);
        return [];
    }
}

function savePendingAssessmentDeletionIds(ids) {
    setUserItem(
        PENDING_ASSESSMENT_DELETIONS_KEY,
        JSON.stringify([...new Set(ids.map(String))])
    );
}

function addPendingAssessmentDeletion(id, reason) {
    savePendingAssessmentDeletionIds([
        ...getPendingAssessmentDeletionIds(),
        String(id),
    ]);
    let reasons = {};
    try {
        reasons = JSON.parse(
            getUserItem(PENDING_ASSESSMENT_DELETION_REASONS_KEY) || "{}"
        );
    } catch (error) {
        console.error("No se pudieron leer los motivos de borrado pendientes:", error);
    }
    reasons[String(id)] = reason;
    setUserItem(PENDING_ASSESSMENT_DELETION_REASONS_KEY, JSON.stringify(reasons));
}

function removePendingAssessmentDeletion(id) {
    savePendingAssessmentDeletionIds(
        getPendingAssessmentDeletionIds().filter(
            (pendingId) => pendingId !== String(id)
        )
    );
    const reasons = getUserItem(PENDING_ASSESSMENT_DELETION_REASONS_KEY);
    if (reasons) {
        try {
            const parsed = JSON.parse(reasons);
            delete parsed[String(id)];
            setUserItem(
                PENDING_ASSESSMENT_DELETION_REASONS_KEY,
                JSON.stringify(parsed)
            );
        } catch (error) {
            console.error("No se pudo actualizar el motivo de borrado pendiente:", error);
        }
    }
}

const PENDING_ASSESSMENT_DELETION_REASONS_KEY =
    "tasador.pendingAssessmentDeletionReasons";

function getPendingAssessmentDeletionReason(id) {
    try {
        const reasons = JSON.parse(
            getUserItem(PENDING_ASSESSMENT_DELETION_REASONS_KEY) || "{}"
        );
        return reasons[String(id)] || "Sin motivo especificado";
    } catch (error) {
        console.error("No se pudo leer el motivo de borrado pendiente:", error);
        return "Sin motivo especificado";
    }
}

async function syncPendingAssessmentDeletions() {
    if (!getAccessToken() || !navigator.onLine || syncingPendingAssessmentDeletions) return;

    syncingPendingAssessmentDeletions = true;

    try {
        for (const id of getPendingAssessmentDeletionIds()) {
            if (!navigator.onLine) break;

            try {
                const response = await apiFetch(
                    `${API_BASE_URL}/assessments/${encodeURIComponent(id)}` +
                    `?reason=${encodeURIComponent(getPendingAssessmentDeletionReason(id))}`,
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
//Mantiene las tasaciones con sincronización o eliminación pendientes en local
async function loadAssessmentsFromServer() {
    if (!getAccessToken()) return;

    try {
        const response = await apiFetch(`${API_BASE_URL}/assessments`);

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const remoteAssessments = await response.json();

        if (!Array.isArray(remoteAssessments)) {
            throw new Error("Respuesta inesperada del servidor");
        }

        const pendingDeletionIds = new Set(
            getPendingAssessmentDeletionIds().map(String)
        );

        const pendingSyncIds = new Set(
            getPendingSyncIds().map(String)
        );

        const mergedById = new Map(
            assessments
                .filter((item) => !pendingDeletionIds.has(String(item.id)))
                .map((item) => [String(item.id), item])
        );

        for (const remote of remoteAssessments) {
            const remoteId = String(remote.id);

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

        const mergedAssessments = Array.from(mergedById.values()).sort(
            (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
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

    const visibleAssessments = assessmentFilter
        ? assessments.filter(
            (assessment) => assessment.data.status === assessmentFilter
        )
        : assessments;

    if (assessmentFilter) {
        const clearFilter = document.createElement("button");
        clearFilter.type = "button";
        clearFilter.className = "secondary";
        clearFilter.textContent = "Ver todos los estados";
        clearFilter.addEventListener("click", () => {
            assessmentFilter = null;
            renderAssessments();
        });
        assessmentList.append(clearFilter);
    }

    if (visibleAssessments.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "empty-state";
        emptyItem.textContent = assessmentFilter
            ? `No hay tasaciones en estado "${statusLabels[assessmentFilter]}".`
            : "Todavía no hay tasaciones guardadas.";
        assessmentList.append(emptyItem);
        return;
    }

    const statuses = assessmentFilter
        ? [assessmentFilter]
        : Object.keys(statusLabels);
    for (const statusKey of statuses) {
        const groupAssessments = visibleAssessments
            .filter((assessment) => (assessment.data.status || "pendiente") === statusKey)
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
        if (!groupAssessments.length) continue;

        const group = document.createElement("section");
        group.className = "status-group";
        const heading = document.createElement("h3");
        heading.textContent = `${statusLabels[statusKey]} · ${groupAssessments.length}`;
        const list = document.createElement("ul");
        list.className = "assessment-list";

        for (const assessment of groupAssessments) {
            const item = document.createElement("li");
            item.className = "assessment-card";
            const details = document.createElement("div");
            const title = document.createElement("h4");
            const location = document.createElement("p");
            const updateTime = document.createElement("p");
            title.textContent =
                assessment.data.address?.trim() || "Tasación sin dirección";
            location.textContent =
                [assessment.data.commune, assessment.data.region]
                    .filter(Boolean)
                    .join(", ") || "Ubicación pendiente";
            updateTime.textContent = `Actualizada ${formatDate(assessment.updatedAt)}`;
            details.append(title, location, updateTime);

            const actions = document.createElement("div");
            actions.className = "assessment-actions";
            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "secondary";
            openButton.textContent = "Abrir";
            openButton.addEventListener("click", () => openAssessment(assessment.id));
            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "danger";
            deleteButton.textContent = "Eliminar";
            deleteButton.addEventListener("click", () => deleteAssessment(assessment.id));
            actions.append(openButton, deleteButton);
            item.append(details, actions);
            list.append(item);
        }

        group.append(heading, list);
        assessmentList.append(group);
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
    const data = getFormData();
    const rate = userSettings.manualUfValue || ufValueInfo?.average || null;
    data.feeUf = String(Number(data.feeUf || userSettings.defaultFeeUf || 0));
    if (rate) {
        data.ufRateClp = String(rate);
        data.ufRatePeriod = ufValueInfo?.month || "valor manual";
    }

    const assessment = {
        id: activeId || createId(),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        data,
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
    }, 500);
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
    applySettingsToForm();
    renderComparables();
    renderAttachments();

    pageTitle.textContent = "Nueva tasación";
    message.textContent = "Los cambios se guardarán automáticamente.";
    comparableMessage.textContent = "";
}
// ...código que carga la tasación y sus datos...
function openAssessment(id) {
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
    setActiveView("editor-view");

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

    const reason = window.prompt(
        "Indica el motivo de eliminación (obligatorio):"
    )?.trim();
    if (!reason) {
        portfolioMessage.textContent =
            "No se eliminó la tasación: debes indicar un motivo.";
        return;
    }

    addPendingAssessmentDeletion(id, reason);

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
        await window.TasadorFileStore.removeForAssessment(id, currentUser.id);
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

    if (String(activeId) === String(id)) {
        startNewAssessment();
        setActiveView("assessments-view");
    }
    await refreshDashboard();
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
        return JSON.parse(getUserItem(PENDING_SYNC_KEY) || "[]");
    } catch {
        return [];
    }
}

function addPendingSyncId(id) {
    const ids = getPendingSyncIds();

    if (!ids.includes(id)) {
        ids.push(id);
        setUserItem(PENDING_SYNC_KEY, JSON.stringify(ids));
    }
}

function removePendingSyncId(id) {
    const ids = getPendingSyncIds().filter((pendingId) => pendingId !== id);
    setUserItem(PENDING_SYNC_KEY, JSON.stringify(ids));
}


async function syncAssessmentToServer(assessment) {
    addPendingSyncId(assessment.id);

    if (!navigator.onLine) {
        message.textContent = "Sin conexión; la tasación se sincronizará después.";
        return false;
    }

    try {
        const response = await apiFetch(`${API_BASE_URL}/assessments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(assessment),
        });

        if (response.status === 409) {
            // Se conserva en la cola para proteger la copia local.
            message.textContent =
                "Conflicto: se conservó la copia local, pero no se sincronizó.";
            return false;
        }

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const saved = await response.json();
        assessment.version = saved.version;


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
        message.textContent =
            "Tasación guardada localmente y enviada al servidor.";
        await refreshDashboard();
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
                requestedAssessmentId,
                currentUser.id
            );
    } catch (error) {
        console.error("No se pudieron leer los archivos locales:", error);
    }

    if (navigator.onLine) {
        try {
            const response = await apiFetch(
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
            const downloadButton = document.createElement("button");
            downloadButton.type = "button";
            downloadButton.className = "button";
            downloadButton.textContent = "Descargar";
            downloadButton.addEventListener("click", async () => {
                await downloadRemoteAttachment(attachment);
            });
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
                    const response = await apiFetch(
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

        const response = await apiFetch(url);

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
        }, currentUser.id);

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
            await window.TasadorFileStore.listByAssessment(activeId, currentUser.id);

        if (activeId !== requestedAssessmentId) return;

        const attachmentsById = new Map(
            localAttachments.map((attachment) => [
                String(attachment.id),
                { ...attachment, isRemoteOnly: false },
            ])
        );

        if (navigator.onLine) {
            try {
                const response = await apiFetch(
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
    if (!getAccessToken() || !navigator.onLine) return 0;

    const attachments = await window.TasadorFileStore.listAll(currentUser.id);
    let failures = 0;

    for (const attachment of attachments) {
        if (attachment.serverSynced || !attachment.blob) continue;

        try {
            const formData = new FormData();
            formData.append("attachment_id", attachment.id);
            const uploadFile = await compressImageForUpload(attachment.blob);
            formData.append(
                "file",
                uploadFile.blob,
                uploadFile.name || "archivo"
            );

            const response = await apiFetch(
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
            }, currentUser.id);
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
});
window.addEventListener("online", syncPendingAttachmentDeletions);


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
            }, currentUser.id);
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
    if (!getAccessToken() || !navigator.onLine || syncingPendingAssessments) {
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
            getUserItem(PENDING_ATTACHMENT_DELETIONS_KEY) || "[]"
        );
        return Array.isArray(items) ? items : [];
    } catch {
        return [];
    }
}

function savePendingAttachmentDeletions(items) {
    setUserItem(
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
    const response = await apiFetch(
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
    if (!getAccessToken() || !navigator.onLine || syncingPendingAttachmentDeletions) {
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
            await window.TasadorFileStore.listByAssessment(activeId, currentUser.id);

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

        await window.TasadorFileStore.remove(attachmentId, currentUser.id);
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

        await renderAttachments();
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
newAssessmentButton.addEventListener("click", () => {
    assessmentFilter = null;
    startNewAssessment();
    setActiveView("editor-view");
});


saveAttachmentsButton.addEventListener("click", saveSelectedAttachments);
document
    .getElementById("value-range-area-type")
    .addEventListener("change", renderReferenceRange);

form.elements.namedItem("builtArea").addEventListener("input", renderReferenceRange);

form.elements.namedItem("landArea").addEventListener("input", renderReferenceRange);

form.elements.namedItem("deadlineMode").addEventListener("change", updateDeadlineFields);
document.querySelector("#default-deadline-mode").addEventListener("change", () => {
    document.querySelector("#default-deadline-days").disabled =
        document.querySelector("#default-deadline-mode").value === "manual";
});
imageQualityInput.addEventListener("input", () => {
    imageQualityOutput.value = `${Math.round(Number(imageQualityInput.value) * 100)}%`;
});
document.querySelector("#refresh-uf-button").addEventListener("click", refreshUfAverage);
document.querySelector("#save-settings-button").addEventListener("click", saveUserSettings);
document.querySelectorAll("#main-navigation [data-view]").forEach((button) => {
    button.addEventListener("click", () => {
        assessmentFilter = null;
        if (button.dataset.view === "editor-view" && !activeId) {
            startNewAssessment();
        }
        setActiveView(button.dataset.view);
    });
});

comparablesPageContent.append(comparableSection);

authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuthentication(registrationMode);
});

registerButton.addEventListener("click", () => {
    if (!registrationMode) {
        registrationMode = true;
        registrationFields.hidden = false;
        firstNameInput.required = true;
        lastNameInput.required = true;
        loginButton.hidden = true;
        showLoginButton.hidden = false;
        registerButton.textContent = "Registrar cuenta";
        authPasswordInput.autocomplete = "new-password";
        firstNameInput.focus();
        return;
    }

    if (authForm.reportValidity()) {
        submitAuthentication(true);
    }
});

showLoginButton.addEventListener("click", () => {
    registrationMode = false;
    registrationFields.hidden = true;
    firstNameInput.required = false;
    lastNameInput.required = false;
    loginButton.hidden = false;
    showLoginButton.hidden = true;
    registerButton.textContent = "Crear cuenta";
    authPasswordInput.autocomplete = "current-password";
    authMessage.textContent = "";
});

logoutButton.addEventListener("click", () => {
    flushPendingSave();
    endSession("Has cerrado sesión.");
});

try {
    const savedUser = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    if (getAccessToken() && savedUser?.id && savedUser?.email) {
        currentUser = savedUser;
        startAuthenticatedApp().catch((error) => {
            console.error("No se pudo iniciar la aplicación:", error);
            portfolioMessage.textContent = "No se pudo cargar la cartera.";
        });
    } else {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
} catch (error) {
    console.error("No se pudo recuperar la sesión:", error);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}