import "./attachment-storage.js";
import {
    isNativeCameraAvailable,
    restoreNativePhotoListener,
    takeNativePhoto,
} from "./native-camera.js";

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
const comparableWeightInput = document.querySelector("#comparable-weight");
const comparableAdjustmentInput = document.querySelector("#comparable-adjustment");
const attachmentInput = document.querySelector("#attachment-input");
const attachmentList = document.querySelector("#attachment-list");
const attachmentMessage = document.querySelector("#attachment-message");
const saveAttachmentsButton = document.querySelector("#save-attachments");
const cameraButton = document.querySelector("#take-photo");
const cameraCaptureMessage = document.querySelector("#camera-capture-message");
const pendingCameraFiles = [];
const localDevelopment =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port !== "8000";
const configuredApiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || window.TASADOR_API_BASE_URL;
const isInstalledApp =
    isNativeCameraAvailable() || "__TAURI_INTERNALS__" in window;
const API_BASE_URL = (
    configuredApiBaseUrl ||
    (localDevelopment ? "http://127.0.0.1:8000" : window.location.origin)
).replace(/\/+$/, "");
const installedAppApiConfigurationMessage =
    "Configura VITE_API_BASE_URL con la URL HTTPS del backend y vuelve a compilar la aplicación.";
const authPanel = document.querySelector("#auth-panel");
const authForm = document.querySelector("#auth-form");
const authEmailInput = document.querySelector("#auth-email");
const authPasswordInput = document.querySelector("#auth-password");
const authInviteCodeInput = document.querySelector("#auth-invite-code");
const registrationFields = document.querySelector("#registration-fields");
const firstNameInput = document.querySelector("#auth-first-name");
const middleNameInput = document.querySelector("#auth-middle-name");
const lastNameInput = document.querySelector("#auth-last-name");
const secondLastNameInput = document.querySelector("#auth-second-last-name");
const loginButton = document.querySelector("#login-button");
const registerButton = document.querySelector("#register-button");
const showLoginButton = document.querySelector("#show-login-button");
const authMessage = document.querySelector("#auth-message");
if (isInstalledApp && !configuredApiBaseUrl) {
    authMessage.textContent = installedAppApiConfigurationMessage;
}
const appContent = document.querySelector("#app-content");
const currentUserEmail = document.querySelector("#current-user-email");
const currentUserName = document.querySelector("#current-user-name");
const logoutButton = document.querySelector("#logout-button");
const dashboardView = document.querySelector("#dashboard-view");
const statusCards = document.querySelector("#status-cards");
const dashboardKpis = document.querySelector("#dashboard-kpis");
const deletedReasonsList = document.querySelector("#deleted-reasons");
const dashboardMessage = document.querySelector("#dashboard-message");
const emailImportText = document.querySelector("#email-import-text");
const analyzeEmailButton = document.querySelector("#analyze-email-button");
const clearEmailButton = document.querySelector("#clear-email-button");
const emailImportMessage = document.querySelector("#email-import-message");
const emailImportReview = document.querySelector("#email-import-review");
const comparableSection = document.querySelector("#comparable-section");
const comparablesPageContent = document.querySelector("#comparables-page-content");
const comparableSearchLinks = document.querySelector("#comparable-search-links");
const assessmentLatitudeInput = document.querySelector("#assessment-latitude");
const assessmentLongitudeInput = document.querySelector("#assessment-longitude");
const comparableRadiusInput = document.querySelector("#comparable-radius-km");
const suggestionSourceInput = document.querySelector("#suggestion-source");
const suggestionDateInput = document.querySelector("#suggestion-date");
const suggestionTitleInput = document.querySelector("#suggestion-title");
const suggestionLocationInput = document.querySelector("#suggestion-location");
const suggestionUrlInput = document.querySelector("#suggestion-url");
const suggestionPriceInput = document.querySelector("#suggestion-price");
const suggestionAreaInput = document.querySelector("#suggestion-area");
const suggestionAreaTypeInput = document.querySelector("#suggestion-area-type");
const suggestionLatitudeInput = document.querySelector("#suggestion-latitude");
const suggestionLongitudeInput = document.querySelector("#suggestion-longitude");
const suggestionDescriptionInput = document.querySelector("#suggestion-description");
const saveSuggestionButton = document.querySelector("#save-suggestion");
const cancelSuggestionEditButton = document.querySelector("#cancel-suggestion-edit");
const suggestionMessage = document.querySelector("#suggestion-message");
const comparableSuggestionsList = document.querySelector("#comparable-suggestions-list");
const commercialMethodInput = document.querySelector("#commercial-method");
const includeCommercialInput = document.querySelector("#report-include-commercial");
const includeFiscalHistoricInput = document.querySelector("#report-include-fiscal-historic");
const fiscalHistoricReviewedInput = document.querySelector("#fiscal-historic-reviewed");
const fiscalHistoricReferenceInput = document.querySelector("#fiscal-historic-reference");
const includeFiscalCurrentInput = document.querySelector("#report-include-fiscal-current");
const currentFiscalValueInput = document.querySelector("#current-fiscal-value");
const currentFiscalDateInput = document.querySelector("#current-fiscal-date");
const currentFiscalSourceInput = document.querySelector("#current-fiscal-source");
const fiscalHistoricPreview = document.querySelector("#fiscal-historic-preview");
const valuationMessage = document.querySelector("#valuation-message");
const settingsMessage = document.querySelector("#settings-message");
const manualUfInput = document.querySelector("#manual-uf-value");
const defaultFeeInput = document.querySelector("#default-fee-uf");
const defaultDeadlineModeInput = document.querySelector("#default-deadline-mode");
const defaultDeadlineDaysInput = document.querySelector("#default-deadline-days");
const imageQualityInput = document.querySelector("#image-quality");
const imageQualityOutput = document.querySelector("#image-quality-output");
const imageMaxDimensionInput = document.querySelector("#image-max-dimension");
const imageTargetKbInput = document.querySelector("#image-target-kb");
const cameraInput = document.querySelector("#camera-input");
const imageProcessingMessage = document.querySelector("#image-processing-message");
const ufValueLabel = document.querySelector("#uf-value-label");
const planAssessmentSelect = document.querySelector("#plan-assessment-select");
const planRoomsInput = document.querySelector("#plan-rooms-input");
const planOpeningsInput = document.querySelector("#plan-openings-input");
const planPreview = document.querySelector("#plan-preview");
const planMessage = document.querySelector("#plan-message");
const planFileList = document.querySelector("#plan-file-list");
const reportsList = document.querySelector("#reports-list");
const reportsMessage = document.querySelector("#reports-message");

const TOKEN_KEY = "tasadorMvp.accessToken";
const USER_KEY = "tasadorMvp.currentUser";
const REPORTS_KEY = "tasadorMvp.reports.v1";
const trialExpiredPanel = document.querySelector("#trial-expired-panel");
const trialExportMessage = document.querySelector("#trial-export-message");
const exportServerDataButton = document.querySelector("#export-server-data");
const exportLocalDataButton = document.querySelector("#export-local-data");
const expiredLogoutButton = document.querySelector("#expired-logout-button");
const trialStatusMessage = document.querySelector("#trial-status");
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
    imageMaxDimension: 1280,
    imageTargetKb: 500,
};
let ufValueInfo = null;
let emailImportProposal = null;

const propertyTypeOptions = [
    ["casa", "Casa"],
    ["departamento", "Departamento"],
    ["edificio_residencial", "Edificio residencial"],
    ["terreno_urbano", "Terreno urbano"],
    ["sitio_eriazo", "Sitio eriazo"],
    ["parcela", "Parcela"],
    ["predio_agricola", "Predio agrícola"],
    ["predio_forestal", "Predio forestal"],
    ["oficina", "Oficina"],
    ["local_comercial", "Local comercial"],
    ["centro_comercial", "Centro comercial"],
    ["bodega", "Bodega"],
    ["estacionamiento", "Estacionamiento"],
    ["industrial", "Inmueble industrial"],
    ["minero", "Inmueble minero"],
    ["hotelero", "Inmueble hotelero o turístico"],
    ["salud", "Inmueble de salud"],
    ["educacional", "Inmueble educacional"],
    ["institucional", "Inmueble institucional"],
    ["religioso", "Inmueble religioso"],
    ["patrimonial", "Inmueble patrimonial"],
    ["mixto", "Inmueble de uso mixto"],
    ["otro", "Otro tipo de inmueble"],
];

const propertyTypeAliases = [
    ["departamento", ["departamento", "depto", "apartamento"]],
    ["edificio_residencial", ["edificio residencial", "edificio habitacional"]],
    ["terreno_urbano", ["terreno urbano", "terreno"]],
    ["sitio_eriazo", ["sitio eriazo", "sitio no edificado", "sitio"]],
    ["predio_agricola", ["predio agricola", "predio agrícola", "fundo", "campo agricola"]],
    ["predio_forestal", ["predio forestal", "forestal"]],
    ["parcela", ["parcela"]],
    ["centro_comercial", ["centro comercial", "mall"]],
    ["local_comercial", ["local comercial", "local"]],
    ["oficina", ["oficina"]],
    ["bodega", ["bodega"]],
    ["estacionamiento", ["estacionamiento", "parking"]],
    ["industrial", ["industrial", "galpon", "galpón"]],
    ["minero", ["minero", "minera"]],
    ["hotelero", ["hotel", "turistico", "turístico", "hospedaje"]],
    ["salud", ["salud", "clinica", "clínica", "hospital"]],
    ["educacional", ["educacional", "colegio", "escuela", "universidad"]],
    ["institucional", ["institucional", "publico", "público", "municipal"]],
    ["religioso", ["religioso", "iglesia", "templo"]],
    ["patrimonial", ["patrimonial", "monumento"]],
    ["mixto", ["mixto", "uso mixto"]],
    ["casa", ["casa", "vivienda", "residencial"]],
    ["otro", ["otro"]],
];

function normalizePropertyType(value) {
    const normalized = normalizeImportedLabel(value);
    for (const [type, aliases] of propertyTypeAliases) {
        if (aliases.some((alias) => normalized === alias || normalized.includes(alias))) {
            return type;
        }
    }
    return null;
}

function getPropertyTypeLabel(value) {
    return propertyTypeOptions.find(([type]) => type === value)?.[1] || value || "—";
}

const emailImportFields = [
    {
        name: "propertyType",
        label: "Tipo de propiedad",
        aliases: ["tipo de propiedad", "tipo de inmueble", "propiedad"],
        type: "select",
    },
    {
        name: "region",
        label: "Región",
        aliases: ["region"],
        type: "text",
    },
    {
        name: "commune",
        label: "Comuna",
        aliases: ["comuna"],
        type: "text",
    },
    {
        name: "address",
        label: "Dirección o referencia",
        aliases: ["direccion", "direccion o referencia", "domicilio"],
        type: "text",
    },
    {
        name: "builtArea",
        label: "Superficie construida (m²)",
        aliases: [
            "superficie construida",
            "superficie construida m",
            "superficie construida m2",
            "area construida",
            "metros construidos",
        ],
        type: "number",
    },
    {
        name: "landArea",
        label: "Superficie de terreno (m²)",
        aliases: [
            "superficie de terreno",
            "superficie de terreno m",
            "superficie de terreno m2",
            "superficie terreno",
            "area de terreno",
        ],
        type: "number",
    },
    {
        name: "bedrooms",
        label: "Dormitorios",
        aliases: ["dormitorios", "habitaciones"],
        type: "number",
    },
    {
        name: "bathrooms",
        label: "Baños",
        aliases: ["banos"],
        type: "number",
    },
    {
        name: "materials",
        label: "Materiales principales",
        aliases: ["materiales", "materialidad", "materiales principales"],
        type: "text",
    },
    {
        name: "distribution",
        label: "Distribución",
        aliases: ["distribucion"],
        type: "textarea",
    },
    {
        name: "observations",
        label: "Observaciones",
        aliases: ["observaciones", "descripcion de la propiedad"],
        type: "textarea",
    },
    {
        name: "condition",
        label: "Estado de conservación",
        aliases: ["estado de conservacion"],
        type: "condition",
    },
    {
        name: "deadlineDays",
        label: "Plazo de entrega (días)",
        aliases: ["plazo de entrega dias", "dias para entregar"],
        type: "number",
    },
    {
        name: "dueDate",
        label: "Fecha límite",
        aliases: ["fecha limite", "fecha de entrega"],
        type: "date",
    },
];

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

function normalizeImportedLabel(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function parseImportedNumber(value) {
    const match = value.match(/-?\d+(?:[.,]\d+)*/);
    if (!match) return null;

    let normalized = match[0];
    if (normalized.includes(",") && normalized.includes(".")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else if (normalized.includes(",")) {
        normalized = normalized.replace(",", ".");
    } else if (/^-?\d{1,3}(?:\.\d{3})+$/.test(normalized)) {
        normalized = normalized.replace(/\./g, "");
    }

    const number = Number(normalized);
    return Number.isFinite(number) && number >= 0 ? String(number) : null;
}

function extractEmailImportProposal(source) {
    const valuesByLabel = new Map();
    for (const line of source.split(/\r?\n/)) {
        const separator = line.search(/[:=]/);
        if (separator < 1) continue;

        const label = normalizeImportedLabel(line.slice(0, separator));
        const value = line.slice(separator + 1).trim();
        if (!value) continue;

        const field = emailImportFields.find((candidate) =>
            candidate.aliases.includes(label)
        );
        if (!field) continue;

        const values = valuesByLabel.get(field.name) || [];
        values.push(value);
        valuesByLabel.set(field.name, values);
    }

    const fields = [];
    const ambiguous = [];
    for (const field of emailImportFields) {
        const values = valuesByLabel.get(field.name);
        if (!values?.length) continue;

        const distinctValues = [...new Set(values)];
        if (distinctValues.length > 1) {
            ambiguous.push(field.label);
            continue;
        }

        let value = distinctValues[0];
        if (field.type === "number") {
            value = parseImportedNumber(value);
            if (value === null) {
                ambiguous.push(field.label);
                continue;
            }
        } else if (field.name === "propertyType") {
            value = normalizePropertyType(value);
            if (!value) {
                ambiguous.push(field.label);
                continue;
            }
        } else if (field.name === "condition") {
            const normalized = normalizeImportedLabel(value);
            const conditionValues = {
                bueno: "bueno",
                regular: "regular",
                "requiere reparaciones": "requiere-reparaciones",
            };
            value = conditionValues[normalized] || "";
            if (!value) {
                ambiguous.push(field.label);
                continue;
            }
        } else if (field.type === "date") {
            const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
            const date = dateParts
                ? new Date(Date.UTC(
                    Number(dateParts[1]),
                    Number(dateParts[2]) - 1,
                    Number(dateParts[3])
                ))
                : null;
            if (
                !dateParts || !date ||
                date.getUTCFullYear() !== Number(dateParts[1]) ||
                date.getUTCMonth() !== Number(dateParts[2]) - 1 ||
                date.getUTCDate() !== Number(dateParts[3])
            ) {
                ambiguous.push(field.label);
                continue;
            }
        }

        fields.push({ ...field, value });
    }

    const foundNames = new Set(fields.map((field) => field.name));
    const ambiguousNames = new Set(ambiguous);
    const requiredFields = emailImportFields.filter((field) =>
        ["propertyType", "region", "commune", "address"].includes(field.name)
    );
    const missingRequired = requiredFields
        .filter((field) =>
            !foundNames.has(field.name) && !ambiguousNames.has(field.label)
        )
        .map((field) => field.label);

    return { fields, ambiguous, missingRequired };
}

function renderEmailImportReview(proposal) {
    emailImportReview.replaceChildren();

    if (proposal.fields.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "helper-text";
        emptyMessage.textContent =
            "No se detectaron campos con etiquetas reconocidas. No se modificó ninguna ficha.";
        emailImportReview.append(emptyMessage);
    } else {
        const heading = document.createElement("h3");
        heading.textContent = "Revisa los valores propuestos";
        emailImportReview.append(heading);

        const fieldsContainer = document.createElement("div");
        fieldsContainer.className = "email-import-fields";
        for (const field of proposal.fields) {
            const row = document.createElement("div");
            row.className = "email-import-field";

            const includeLabel = document.createElement("label");
            includeLabel.className = "email-import-include";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.dataset.emailImportInclude = field.name;
            const includeText = document.createElement("span");
            includeText.textContent = `Incluir ${field.label}`;
            includeLabel.append(checkbox, includeText);

            const controlId = `email-import-${field.name}`;
            const valueLabel = document.createElement("label");
            valueLabel.htmlFor = controlId;
            valueLabel.textContent = field.label;

            let control;
            if (field.type === "textarea") {
                control = document.createElement("textarea");
                control.rows = 3;
            } else if (field.name === "propertyType") {
                control = document.createElement("select");
                for (const [value, label] of propertyTypeOptions) {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = label;
                    control.append(option);
                }
            } else if (field.name === "condition") {
                control = document.createElement("select");
                for (const [value, label] of [
                    ["", "Por evaluar"],
                    ["bueno", "Bueno"],
                    ["regular", "Regular"],
                    ["requiere-reparaciones", "Requiere reparaciones"],
                ]) {
                    const option = document.createElement("option");
                    option.value = value;
                    option.textContent = label;
                    control.append(option);
                }
            } else {
                control = document.createElement("input");
                control.type = field.type === "number" ? "number" : field.type;
                if (field.type === "number") {
                    control.min = "0";
                    control.step = field.name === "bedrooms" || field.name === "bathrooms"
                        ? "1"
                        : field.name === "deadlineDays" ? "1" : "0.01";
                }
            }

            control.id = controlId;
            control.value = field.value;
            row.append(includeLabel, valueLabel, control);
            fieldsContainer.append(row);
        }
        emailImportReview.append(fieldsContainer);

        const applyButton = document.createElement("button");
        applyButton.type = "button";
        applyButton.id = "apply-email-proposal";
        applyButton.textContent = "Aplicar a una nueva ficha";
        applyButton.addEventListener("click", applyEmailImportProposal);
        emailImportReview.append(applyButton);
    }

    if (proposal.ambiguous.length || proposal.missingRequired.length) {
        const warning = document.createElement("p");
        warning.className = "email-import-warning";
        const details = [];
        if (proposal.ambiguous.length) {
            details.push(
                `Revisa manualmente los campos con datos contradictorios o no reconocidos: ${proposal.ambiguous.join(", ")}.`
            );
        }
        if (proposal.missingRequired.length) {
            details.push(
                `No se detectaron los campos obligatorios: ${proposal.missingRequired.join(", ")}.`
            );
        }
        warning.textContent = details.join(" ");
        emailImportReview.append(warning);
    }
}

function analyzeEmailImport() {
    emailImportMessage.textContent = "";
    emailImportReview.replaceChildren();
    emailImportProposal = null;
    const source = emailImportText.value.trim();

    if (!source) {
        emailImportMessage.textContent = "Pega el texto del correo para analizarlo.";
        return;
    }

    emailImportProposal = extractEmailImportProposal(source);
    renderEmailImportReview(emailImportProposal);
    emailImportMessage.textContent = emailImportProposal.fields.length
        ? `Se detectaron ${emailImportProposal.fields.length} campo(s). Revísalos; todavía no se ha creado ni modificado una tasación.`
        : emailImportProposal.ambiguous.length
            ? "No se detectaron valores claros. Revisa los campos indicados."
            : "No se detectaron campos. Revisa las etiquetas del texto.";
}

function applyEmailImportProposal() {
    if (!emailImportProposal?.fields.length) return;

    const selectedFields = Array.from(
        emailImportReview.querySelectorAll("[data-email-import-include]:checked")
    );
    if (selectedFields.length === 0) {
        emailImportMessage.textContent = "Selecciona al menos un campo para aplicarlo.";
        return;
    }

    flushPendingSave();
    startNewAssessment();
    for (const checkbox of selectedFields) {
        const field = emailImportProposal.fields.find(
            (item) => item.name === checkbox.dataset.emailImportInclude
        );
        const valueInput = emailImportReview.querySelector(
            `#email-import-${CSS.escape(field.name)}`
        );
        const formField = form.elements.namedItem(field.name);
        formField.value = valueInput.value;
        formField.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const includedNames = new Set(
        selectedFields.map((checkbox) => checkbox.dataset.emailImportInclude)
    );
    if (includedNames.has("dueDate")) {
        form.elements.namedItem("deadlineMode").value = "manual";
    } else if (includedNames.has("deadlineDays")) {
        form.elements.namedItem("deadlineMode").value = "days";
    }
    updateDeadlineFields();

    setActiveView("editor-view");
    message.textContent =
        "Se aplicaron los campos seleccionados a una nueva ficha. Revisa los datos y completa la tasación.";
    emailImportMessage.textContent =
        "Propuesta aplicada. Puedes volver a esta vista para preparar otro correo.";
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
        } else if (response.status === 403) {
            response.clone().json().then((body) => {
                if (body.detail?.code === "trial_expired") {
                    showExpiredTrial();
                }
            }).catch((error) => {
                console.error("No se pudo interpretar la respuesta de licencia:", error);
            });
        }

        return response;
    });
}

function showExpiredTrial() {
    authPanel.hidden = true;
    appContent.hidden = true;
    trialExpiredPanel.hidden = false;
}

function downloadJsonFile(data, fileName) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    downloadLocalBlob(blob, fileName);
}

async function exportServerData() {
    trialExportMessage.textContent = "";
    exportServerDataButton.disabled = true;
    try {
        const response = await apiFetch(`${API_BASE_URL}/account/export`);
        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        downloadLocalBlob(await response.blob(), "tasador-datos-cuenta.zip");
        trialExportMessage.textContent = "Se descargó la copia de los datos del servidor.";
    } catch (error) {
        console.error("No se pudieron exportar los datos del servidor:", error);
        trialExportMessage.textContent =
            typeof error.message === "string" ? error.message : "No se pudo descargar la copia.";
    } finally {
        exportServerDataButton.disabled = false;
    }
}

async function exportLocalData() {
    trialExportMessage.textContent = "";
    exportLocalDataButton.disabled = true;
    try {
        const userId = currentUser?.id;
        if (!userId) {
            throw new Error("Inicia sesión para exportar los datos de este dispositivo.");
        }
        const keys = [
            STORAGE_KEY,
            REPORTS_KEY,
            REPORT_DELETIONS_KEY,
            PENDING_ASSESSMENT_DELETIONS_KEY,
            PENDING_ASSESSMENT_DELETION_REASONS_KEY,
            PENDING_SYNC_KEY,
            PENDING_ATTACHMENT_DELETIONS_KEY,
        ];
        const localRecords = Object.fromEntries(
            keys.map((key) => [key, getUserItem(key)])
        );
        const files = await window.TasadorFileStore.listAll(userId);
        const attachments = files.map((item) => ({
            id: item.id,
            assessmentId: item.assessmentId,
            name: item.name,
            type: item.type,
            size: item.size,
            serverSynced: item.serverSynced === true,
        }));
        downloadJsonFile({
            exportedAt: new Date().toISOString(),
            account: currentUser.email,
            localRecords,
            localAttachments: attachments,
        }, "tasador-datos-locales.json");
        let downloadedFiles = 0;
        for (const item of files) {
            const name = item.name || "archivo";
            if (item.blob) {
                downloadLocalBlob(item.blob, name);
                downloadedFiles += 1;
            }
            if (item.optimizedBlob) {
                const extensionIndex = name.lastIndexOf(".");
                const optimizedName = extensionIndex > 0
                    ? `${name.slice(0, extensionIndex)}-optimizada${name.slice(extensionIndex)}`
                    : `${name}-optimizada`;
                downloadLocalBlob(item.optimizedBlob, optimizedName);
                downloadedFiles += 1;
            }
        }
        trialExportMessage.textContent =
            `Se exportaron los datos locales y ${downloadedFiles} archivo(s) del navegador.`;
    } catch (error) {
        console.error("No se pudieron exportar los datos locales:", error);
        trialExportMessage.textContent =
            typeof error.message === "string" ? error.message : "No se pudieron exportar los datos locales.";
    } finally {
        exportLocalDataButton.disabled = false;
    }
}


let assessments = [];
let activeId = null;
let currentPlanDraft = { assessmentId: null, roomsText: "", openingsText: "", preview: null };
let comparableRecords = [];
let comparableSuggestions = [];
let comparableSearchConfig = {
    latitude: "",
    longitude: "",
    radiusKm: "5",
    coordinatesSource: "",
    radiusSource: "predeterminado",
};
let editingComparableId = null;
let editingSuggestionId = null;
let isDirty = false;
let saveTimer;

function endSession(messageText = "") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    appContent.hidden = true;
    authPanel.hidden = false;
    trialExpiredPanel.hidden = true;
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
    if (isInstalledApp && !configuredApiBaseUrl) {
        authMessage.textContent = installedAppApiConfigurationMessage;
        return;
    }

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
                    inviteCode: authInviteCodeInput.value.trim(),
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
    trialExpiredPanel.hidden = true;
    currentUserEmail.textContent = currentUser.email;
    currentUserName.textContent =
        [currentUser.firstName, currentUser.middleName, currentUser.lastName, currentUser.secondLastName]
            .filter(Boolean)
            .join(" ");

    try {
        const licenseResponse = await apiFetch(`${API_BASE_URL}/account/license`);
        if (licenseResponse.status === 401) return;
        if (!licenseResponse.ok) {
            throw new Error(`No se pudo consultar la licencia (HTTP ${licenseResponse.status}).`);
        }
        const license = await licenseResponse.json();
        if (license.state === "expired") {
            showExpiredTrial();
            return;
        }
        trialStatusMessage.textContent = license.state === "licensed"
            ? `Licencia activa hasta ${new Date(license.licensedUntil).toLocaleDateString()}.`
            : `Prueba gratuita: ${license.daysRemaining} día(s) restante(s), hasta ${new Date(license.trialExpiresAt).toLocaleDateString()}.`;
    } catch (error) {
        console.error("No se pudo comprobar el periodo de prueba:", error);
        trialStatusMessage.textContent =
            "Sin conexión con el servidor: el trabajo local queda pendiente de sincronización.";
    }

    appContent.hidden = false;
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
    renderComparableSearchLinks();
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
        "email-import-view": "Importar",
        "comparables-view": "Comparables",
        "plans-view": "Planos",
        "reports-view": "Mis informes",
        "settings-view": "Configuración",
    };
    if (viewId !== "editor-view") {
        pageTitle.textContent = viewTitles[viewId] || "Tasador";
    }

    if (viewId === "dashboard-view") {
        refreshDashboard();
    }
    if (viewId === "plans-view") {
        renderPlanAssessmentOptions();
        loadPlanFiles();
    }
    if (viewId === "reports-view") {
        loadReports();
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
    imageMaxDimensionInput.value = String(userSettings.imageMaxDimension);
    imageTargetKbInput.value = String(userSettings.imageTargetKb);
    defaultDeadlineDaysInput.disabled = userSettings.deadlineMode === "manual";
}

async function loadUserSettings() {
    try {
        const response = await apiFetch(`${API_BASE_URL}/settings`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }
        userSettings = { ...userSettings, ...result };
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
            "No se pudo consultar el promedio de los últimos 30 días. Indica un valor manual para calcular montos en pesos.";
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
        imageMaxDimension: Number(imageMaxDimensionInput.value),
        imageTargetKb: Number(imageTargetKbInput.value),
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
    const canOptimize =
        ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
        "createImageBitmap" in window;
    if (!canOptimize) {
        return { blob: file, name: file.name, size: file.size, isImage: false };
    }

    const targetBytes = Math.max(50, Number(userSettings.imageTargetKb) || 500) * 1024;
    let image;
    try {
        image = await createImageBitmap(file);
    } catch (error) {
        console.warn("El navegador no pudo decodificar la imagen; se conservará original:", error);
        return {
            blob: file,
            name: file.name,
            size: file.size,
            isImage: true,
            targetMet: file.size <= targetBytes,
            targetKb: Math.max(50, Number(userSettings.imageTargetKb) || 500),
        };
    }
    let dimension = Math.max(320, Number(userSettings.imageMaxDimension) || 1280);
    let quality = Number(userSettings.imageQuality) || 0.65;
    let compressed = null;
    let canvas;

    for (let attempt = 0; attempt < 36; attempt++) {
        const scale = Math.min(1, dimension / Math.max(image.width, image.height));
        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
            image.close();
            throw new Error("No se pudo preparar el compresor de imágenes.");
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        compressed = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => blob
                    ? resolve(blob)
                    : reject(new Error("El navegador no pudo comprimir esta imagen.")),
                "image/webp",
                quality
            );
        });
        if (compressed.size <= targetBytes) break;
        if (quality > 0.15) {
            quality = Math.max(0.1, quality - 0.15);
        } else if (dimension > 320) {
            dimension = Math.max(320, Math.round(dimension * 0.8));
            quality = Number(userSettings.imageQuality) || 0.65;
        } else {
            break;
        }
    }
    image.close();

    if (!compressed || compressed.size >= file.size) {
        return {
            blob: file,
            name: file.name,
            size: file.size,
            isImage: true,
            targetMet: file.size <= targetBytes,
            targetKb: Math.max(50, Number(userSettings.imageTargetKb) || 500),
        };
    }
    const baseName = file.name.replace(/\.[^.]+$/, "");
    return {
        blob: compressed,
        name: `${baseName}.webp`,
        size: compressed.size,
        isImage: true,
        targetMet: compressed.size <= targetBytes,
        targetKb: Math.max(50, Number(userSettings.imageTargetKb) || 500),
    };
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
            comparableSuggestions: Array.isArray(assessment.comparableSuggestions)
                ? assessment.comparableSuggestions
                : [],
            comparableSearch: assessment.comparableSearch || {},
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
            comparableSuggestions: [],
            comparableSearch: {},
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
        const data = Object.fromEntries(new FormData(form).entries());
        for (const checkbox of form.querySelectorAll(
            'input[type="checkbox"][name]'
        )) {
            data[checkbox.name] = checkbox.checked;
        }
        return data;
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
        renderReferenceRange();
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

        const basePricePerSquareMeter =
            comparable.price / comparable.area;
        const adjustmentPct = Number(comparable.adjustmentPct || 0);
        const pricePerSquareMeter =
            basePricePerSquareMeter * (1 + adjustmentPct / 100);

        title.textContent =
        `${sourceLabels[comparable.source] || "Otra fuente"} · ` +
        formatCurrency(comparable.price);

        location.textContent = comparable.location;

        const measurement = document.createElement("p");
        measurement.textContent =
        `${comparable.area} m² de ${areaDescription} · ` +
        `${formatCurrency(basePricePerSquareMeter)} / m²` +
        (adjustmentPct
            ? ` · Ajustado ${adjustmentPct > 0 ? "+" : ""}${adjustmentPct}% = ${formatCurrency(pricePerSquareMeter)} / m²`
            : ` · ${formatCurrency(pricePerSquareMeter)} / m² ajustado`);
        const weight = Number(comparable.weight ?? 1);
        const criteria = document.createElement("p");
        criteria.textContent =
            `Peso del tasador: ${weight} · Ajuste: ${adjustmentPct}%` +
            (comparable.verified ? "" : " · pendiente de verificación");

        const referenceDate = document.createElement("p");
        referenceDate.textContent =
        `Fecha: ${comparable.date} · ` +
        (comparable.verified
            ? "Verificado por el tasador"
            : "Pendiente de verificar");

        details.append(title, location, measurement, criteria, referenceDate);

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
    }
    renderReferenceRange();
}

function getLocalDateInputValue() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function renderComparableSearchLinks() {
    comparableSearchLinks.replaceChildren();

    const data = getFormData();
    const searchTerms = [
        getPropertyTypeLabel(data.propertyType),
        "venta",
        data.commune,
        data.region,
        data.builtArea && `${data.builtArea} m2`,
        data.landArea && `${data.landArea} m2 terreno`,
        data.bedrooms && `${data.bedrooms} dormitorios`,
        data.bathrooms && `${data.bathrooms} baños`,
    ].filter(Boolean).join(" ");
    const query = searchTerms || "propiedades en venta Chile";
    const sources = [
        { label: "Buscar anuncios en Yapo", query: `site:yapo.cl ${query}` },
        {
            label: "Buscar anuncios en Portal Inmobiliario",
            query: `site:portalinmobiliario.com ${query}`,
        },
        { label: "Buscar en la web", query },
    ];

    for (const source of sources) {
        const link = document.createElement("a");
        const searchUrl = new URL("https://www.google.com/search");
        searchUrl.searchParams.set("q", source.query);
        link.href = searchUrl.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.label;
        comparableSearchLinks.append(link);
    }
}

function parseCoordinate(value, minimum, maximum) {
    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const coordinate = Number(value);
    return Number.isFinite(coordinate) &&
        coordinate >= minimum &&
        coordinate <= maximum
        ? coordinate
        : null;
}

function getComparableDistance(latitude, longitude) {
    const fromLatitude = parseCoordinate(
        comparableSearchConfig.latitude,
        -90,
        90
    );
    const fromLongitude = parseCoordinate(
        comparableSearchConfig.longitude,
        -180,
        180
    );
    const toLatitude = parseCoordinate(latitude, -90, 90);
    const toLongitude = parseCoordinate(longitude, -180, 180);

    if (
        fromLatitude === null ||
        fromLongitude === null ||
        toLatitude === null ||
        toLongitude === null
    ) {
        return null;
    }

    const radians = (degrees) => degrees * Math.PI / 180;
    const latitudeDelta = radians(toLatitude - fromLatitude);
    const longitudeDelta = radians(toLongitude - fromLongitude);
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(fromLatitude)) *
        Math.cos(radians(toLatitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
    const boundedHaversine = Math.min(1, Math.max(0, haversine));

    return 6371 * 2 * Math.atan2(
        Math.sqrt(boundedHaversine),
        Math.sqrt(1 - boundedHaversine)
    );
}

function renderComparableSuggestions() {
    comparableSuggestionsList.replaceChildren();

    if (comparableSuggestions.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "empty-state";
        emptyMessage.textContent = "Todavía no hay propiedades posibles registradas.";
        comparableSuggestionsList.append(emptyMessage);
        return;
    }

    const table = document.createElement("table");
    table.className = "comparable-suggestions-table";
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const label of [
        "Propiedad y fuente",
        "Ubicación",
        "Precio",
        "Superficie",
        "Criterios y estado",
        "Revisada",
        "Incorporar",
    ]) {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = label;
        headerRow.append(th);
    }
    head.append(headerRow);
    table.append(head);
    const body = document.createElement("tbody");

    for (const suggestion of comparableSuggestions) {
        const row = document.createElement("tr");
        const propertyCell = document.createElement("td");
        const heading = document.createElement("strong");
        heading.textContent = suggestion.title || "Propiedad sin título";
        const source = document.createElement("p");
        const sourceName = sourceLabels[suggestion.source] || "Otra fuente";
        source.textContent =
            `${sourceName} · Consultada el ${suggestion.date || "fecha no indicada"}`;
        propertyCell.append(heading, source);
        if (suggestion.url) {
            const link = document.createElement("a");
            link.href = suggestion.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Abrir fuente";
            propertyCell.append(link);
        }

        const locationCell = document.createElement("td");
        const location = document.createElement("span");
        location.textContent = suggestion.location || "Ubicación no informada";
        locationCell.append(location);

        const priceCell = document.createElement("td");
        priceCell.textContent = suggestion.price ? formatCurrency(suggestion.price) : "No informado";
        const areaCell = document.createElement("td");
        areaCell.textContent = suggestion.area
            ? `${suggestion.area} m² ${suggestion.areaType === "terreno" ? "de terreno" : "construidos"}`
            : "No informada";
        const reviewCell = document.createElement("td");
        const targetCommune = normalizeImportedLabel(
            form.elements.namedItem("commune")?.value || ""
        );
        const suggestionLocation = normalizeImportedLabel(suggestion.location || "");
        if (targetCommune && suggestionLocation && !suggestionLocation.includes(targetCommune)) {
            const mismatch = document.createElement("p");
            mismatch.className = "criterion-warning";
            mismatch.textContent = "La comuna de referencia no aparece en la ubicación registrada.";
            reviewCell.append(mismatch);
        }
        const targetAreaType = document.getElementById("value-range-area-type")?.value;
        if (
            suggestion.areaType && targetAreaType &&
            suggestion.areaType !== targetAreaType
        ) {
            const mismatch = document.createElement("p");
            mismatch.className = "criterion-warning";
            mismatch.textContent = "La superficie registrada usa un tipo distinto al seleccionado para la tasación.";
            reviewCell.append(mismatch);
        }
        if (!suggestion.price || !suggestion.area) {
            const missing = document.createElement("p");
            missing.className = "criterion-warning";
            missing.textContent = `Falta ${[
                !suggestion.price ? "precio" : "",
                !suggestion.area ? "superficie" : "",
            ].filter(Boolean).join(" y ")} para incorporarla al análisis.`;
            reviewCell.append(missing);
        }
        const distance = getComparableDistance(
            suggestion.latitude,
            suggestion.longitude
        );
        if (distance !== null) {
            const radius = Number(comparableSearchConfig.radiusKm);
            const outsideRadius = Number.isFinite(radius) && distance > radius;
            const distanceLine = document.createElement("p");
            distanceLine.textContent =
                `Distancia aproximada en línea recta: ${distance.toFixed(1)} km` +
                (outsideRadius ? " · no coincide: fuera del radio de referencia ingresado" : "");
            reviewCell.append(distanceLine);
        }

        const status = document.createElement("p");
        status.className = "suggestion-status";
        status.textContent = {
            pending: "Pendiente de revisión; no se usa en cálculos ni informes.",
            accepted: "Seleccionada por el tasador y agregada al estudio.",
            rejected: "Descartada por el tasador; no se usa en cálculos ni informes.",
        }[suggestion.status] || "Pendiente de revisión.";
        if (suggestion.description) {
            const description = document.createElement("p");
            description.textContent = suggestion.description;
            reviewCell.append(description);
        }
        reviewCell.append(status);
        const actions = document.createElement("div");
        actions.className = "suggestion-row-actions";
        if (suggestion.status === "pending") {
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "secondary";
            editButton.textContent = "Corregir";
            editButton.addEventListener("click", () => editComparableSuggestion(suggestion.id));
            actions.append(editButton);
        }
        if (suggestion.status === "accepted") {
            const withdrawButton = document.createElement("button");
            withdrawButton.type = "button";
            withdrawButton.className = "secondary";
            withdrawButton.textContent = "Retirar del estudio";
            withdrawButton.addEventListener("click", () =>
                setComparableSuggestionIncluded(suggestion.id, false)
            );
            actions.append(withdrawButton);
        } else if (suggestion.status !== "rejected") {
            const rejectButton = document.createElement("button");
            rejectButton.type = "button";
            rejectButton.className = "danger";
            rejectButton.textContent = "Descartar";
            rejectButton.addEventListener("click", () =>
                updateComparableSuggestionStatus(suggestion.id, "rejected")
            );
            actions.append(rejectButton);
        } else {
            const reopenButton = document.createElement("button");
            reopenButton.type = "button";
            reopenButton.className = "secondary";
            reopenButton.textContent = "Reabrir";
            reopenButton.addEventListener("click", () =>
                updateComparableSuggestionStatus(suggestion.id, "pending")
            );
            actions.append(reopenButton);
        }
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger";
        deleteButton.textContent = "Eliminar registro";
        deleteButton.addEventListener("click", () => deleteComparableSuggestion(suggestion.id));
        actions.append(deleteButton);
        reviewCell.append(actions);

        const reviewedCell = document.createElement("td");
        const reviewedLabel = document.createElement("label");
        reviewedLabel.className = "comparable-check-label";
        const reviewed = document.createElement("input");
        reviewed.type = "checkbox";
        reviewed.checked = suggestion.reviewed === true;
        reviewed.addEventListener("change", () =>
            setComparableSuggestionReviewed(suggestion.id, reviewed.checked)
        );
        reviewedLabel.append(reviewed, document.createTextNode(" Revisada"));
        reviewedCell.append(reviewedLabel);

        const includeCell = document.createElement("td");
        const includeLabel = document.createElement("label");
        includeLabel.className = "comparable-check-label";
        const include = document.createElement("input");
        include.type = "checkbox";
        include.checked = suggestion.status === "accepted";
        include.disabled = !suggestion.reviewed && suggestion.status !== "accepted";
        include.setAttribute("aria-label", `Incorporar ${suggestion.title || "propiedad"}`);
        include.addEventListener("change", () =>
            setComparableSuggestionIncluded(suggestion.id, include.checked)
        );
        includeLabel.append(include, document.createTextNode(" Incorporar"));
        includeCell.append(includeLabel);

        row.append(propertyCell, locationCell, priceCell, areaCell, reviewCell, reviewedCell, includeCell);
        body.append(row);
    }
    table.append(body);
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.append(table);
    comparableSuggestionsList.append(wrapper);
}

function clearComparableSuggestionEditor() {
    editingSuggestionId = null;
    suggestionSourceInput.value = "anuncio";
    suggestionDateInput.value = getLocalDateInputValue();
    suggestionTitleInput.value = "";
    suggestionLocationInput.value = "";
    suggestionUrlInput.value = "";
    suggestionPriceInput.value = "";
    suggestionAreaInput.value = "";
    suggestionAreaTypeInput.value = "construida";
    suggestionLatitudeInput.value = "";
    suggestionLongitudeInput.value = "";
    suggestionDescriptionInput.value = "";
    saveSuggestionButton.textContent = "Guardar como pendiente";
    cancelSuggestionEditButton.hidden = true;
}

function saveComparableSuggestion() {
    const urlText = suggestionUrlInput.value.trim();
    let safeUrl = "";

    if (urlText) {
        try {
            const parsedUrl = new URL(urlText);
            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error("Protocolo no permitido");
            }
            safeUrl = parsedUrl.href;
        } catch {
            suggestionMessage.textContent =
                "El enlace debe comenzar con http:// o https://.";
            return;
        }
    }

    const title = suggestionTitleInput.value.trim();
    const location = suggestionLocationInput.value.trim();
    const description = suggestionDescriptionInput.value.trim();
    if (!safeUrl && !title && !description) {
        suggestionMessage.textContent =
            "Agrega un enlace, un título o una descripción para identificar la propiedad.";
        return;
    }

    const priceValue = suggestionPriceInput.value.trim();
    const areaValue = suggestionAreaInput.value.trim().replace(",", ".");
    const price = priceValue ? Number(priceValue) : null;
    const area = areaValue ? Number(areaValue) : null;
    if (priceValue && (!Number.isFinite(price) || price <= 0)) {
        suggestionMessage.textContent = "El precio debe ser mayor que cero.";
        return;
    }
    if (areaValue && (!Number.isFinite(area) || area <= 0)) {
        suggestionMessage.textContent = "La superficie debe ser mayor que cero.";
        return;
    }

    const latitudeText = suggestionLatitudeInput.value.trim();
    const longitudeText = suggestionLongitudeInput.value.trim();
    const latitude = parseCoordinate(latitudeText, -90, 90);
    const longitude = parseCoordinate(longitudeText, -180, 180);
    if (
        (latitudeText || longitudeText) &&
        (latitude === null || longitude === null)
    ) {
        suggestionMessage.textContent =
            "Ingresa una latitud y longitud válidas, o deja ambas coordenadas vacías.";
        return;
    }

    const previous = comparableSuggestions.find(
        (item) => item.id === editingSuggestionId
    );
    const suggestion = {
        id: editingSuggestionId || createId(),
        source: suggestionSourceInput.value,
        date: suggestionDateInput.value || getLocalDateInputValue(),
        title,
        location,
        url: safeUrl,
        price,
        area,
        areaType: suggestionAreaTypeInput.value,
        latitude: latitude === null ? "" : String(latitude),
        longitude: longitude === null ? "" : String(longitude),
        description,
        status: previous?.status || "pending",
        comparableId: previous?.comparableId || null,
        createdAt: previous?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    comparableSuggestions = editingSuggestionId
        ? comparableSuggestions.map((item) =>
            item.id === editingSuggestionId ? suggestion : item
        )
        : [...comparableSuggestions, suggestion];

    clearComparableSuggestionEditor();
    renderComparableSuggestions();
    suggestionMessage.textContent = "Propiedad posible guardada para revisión.";
    scheduleSave();
}

function editComparableSuggestion(id) {
    const suggestion = comparableSuggestions.find((item) => item.id === id);
    if (!suggestion || suggestion.status !== "pending") {
        return;
    }

    editingSuggestionId = id;
    suggestionSourceInput.value = suggestion.source || "anuncio";
    suggestionDateInput.value = suggestion.date || getLocalDateInputValue();
    suggestionTitleInput.value = suggestion.title || "";
    suggestionLocationInput.value = suggestion.location || "";
    suggestionUrlInput.value = suggestion.url || "";
    suggestionPriceInput.value = suggestion.price ?? "";
    suggestionAreaInput.value = suggestion.area ?? "";
    suggestionAreaTypeInput.value = suggestion.areaType || "construida";
    suggestionLatitudeInput.value = suggestion.latitude || "";
    suggestionLongitudeInput.value = suggestion.longitude || "";
    suggestionDescriptionInput.value = suggestion.description || "";
    saveSuggestionButton.textContent = "Guardar cambios";
    cancelSuggestionEditButton.hidden = false;
    suggestionMessage.textContent = "Edita la propuesta antes de agregarla al estudio.";
}

function acceptComparableSuggestion(id) {
    const suggestion = comparableSuggestions.find((item) => item.id === id);
    if (!suggestion || suggestion.status !== "pending") {
        return;
    }
    if (!suggestion.reviewed) {
        suggestionMessage.textContent =
            "Marca la casilla «Revisada» antes de incorporar este comparable.";
        return;
    }

    const price = Number(suggestion.price);
    const area = Number(suggestion.area);
    if (
        !Number.isFinite(price) || price <= 0 ||
        !Number.isFinite(area) || area <= 0 ||
        !suggestion.location
    ) {
        editComparableSuggestion(id);
        suggestionMessage.textContent =
            "Para agregarla al estudio, completa y revisa ubicación, precio y superficie.";
        return;
    }

    const comparableId = createId();
    comparableRecords = [...comparableRecords, {
        id: comparableId,
        source: suggestion.source || "anuncio",
        price,
        date: suggestion.date || getLocalDateInputValue(),
        area,
        areaType: suggestion.areaType || "construida",
        location: suggestion.location,
        notes: [suggestion.title, suggestion.description].filter(Boolean).join("\n"),
        url: suggestion.url || "",
        verified: true,
        weight: 1,
        adjustmentPct: 0,
    }];
    comparableSuggestions = comparableSuggestions.map((item) =>
        item.id === id
            ? { ...item, status: "accepted", comparableId, updatedAt: new Date().toISOString() }
            : item
    );

    renderComparables();
    renderComparableSuggestions();
    suggestionMessage.textContent =
        "Agregada al estudio por decisión del tasador; revisa sus datos antes de usarla.";
    scheduleSave();
}

function setComparableSuggestionReviewed(id, reviewed) {
    const suggestion = comparableSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    if (!reviewed && suggestion.status === "accepted") {
        suggestionMessage.textContent =
            "Retira primero el comparable del estudio antes de desmarcar su revisión.";
        renderComparableSuggestions();
        return;
    }
    comparableSuggestions = comparableSuggestions.map((item) =>
        item.id === id
            ? { ...item, reviewed, updatedAt: new Date().toISOString() }
            : item
    );
    renderComparableSuggestions();
    scheduleSave();
}

function setComparableSuggestionIncluded(id, included) {
    const suggestion = comparableSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    if (included) {
        if (!suggestion.reviewed) {
            suggestionMessage.textContent =
                "Revisa los datos y marca «Revisada» antes de incorporarla.";
            renderComparableSuggestions();
            return;
        }
        if (suggestion.status === "rejected") {
            comparableSuggestions = comparableSuggestions.map((item) =>
                item.id === id ? { ...item, status: "pending" } : item
            );
        }
        acceptComparableSuggestion(id);
        return;
    }
    if (suggestion.status === "accepted") {
        comparableRecords = comparableRecords.filter(
            (item) => item.id !== suggestion.comparableId
        );
        comparableSuggestions = comparableSuggestions.map((item) =>
            item.id === id
                ? { ...item, status: "pending", comparableId: null }
                : item
        );
        renderComparables();
        renderComparableSuggestions();
        scheduleSave();
    }
}

function updateComparableSuggestionStatus(id, status) {
    comparableSuggestions = comparableSuggestions.map((item) =>
        item.id === id
            ? { ...item, status, updatedAt: new Date().toISOString() }
            : item
    );
    renderComparableSuggestions();
    scheduleSave();
}

function deleteComparableSuggestion(id) {
    const suggestion = comparableSuggestions.find((item) => item.id === id);
    if (suggestion?.comparableId) {
        comparableRecords = comparableRecords.filter(
            (item) => item.id !== suggestion.comparableId
        );
        renderComparables();
    }
    comparableSuggestions = comparableSuggestions.filter((item) => item.id !== id);
    if (editingSuggestionId === id) {
        clearComparableSuggestionEditor();
    }
    renderComparableSuggestions();
    scheduleSave();
}

function updateComparableSearchConfig() {
    const latitudeText = assessmentLatitudeInput.value.trim();
    const longitudeText = assessmentLongitudeInput.value.trim();
    const latitude = parseCoordinate(latitudeText, -90, 90);
    const longitude = parseCoordinate(longitudeText, -180, 180);
    const radius = Number(comparableRadiusInput.value);

    if (
        (latitudeText || longitudeText) &&
        (latitude === null || longitude === null)
    ) {
        suggestionMessage.textContent =
            "Las coordenadas del inmueble tasado deben ser válidas o quedar ambas vacías.";
        return;
    }
    if (!Number.isFinite(radius) || radius <= 0 || radius > 500) {
        suggestionMessage.textContent =
            "El radio debe ser un valor mayor que cero y no superar 500 km.";
        return;
    }

    comparableSearchConfig = {
        latitude: latitude === null ? "" : String(latitude),
        longitude: longitude === null ? "" : String(longitude),
        radiusKm: String(radius),
        coordinatesSource:
            latitude === null ? "" : "usuario",
        radiusSource: "usuario",
        updatedAt: new Date().toISOString(),
    };
    suggestionMessage.textContent = latitude === null
        ? "Radio guardado como criterio ingresado por el usuario."
        : "Coordenadas y radio guardados como criterios ingresados por el usuario.";
    renderComparableSuggestions();
    scheduleSave();
}

function loadComparableSearchConfig(config = {}) {
    comparableSearchConfig = {
        latitude: config.latitude || "",
        longitude: config.longitude || "",
        radiusKm: config.radiusKm || "5",
        coordinatesSource: config.coordinatesSource ||
            (config.latitude || config.longitude ? "usuario" : ""),
        radiusSource: config.radiusSource ||
            (config.radiusKm && config.radiusKm !== "5" ? "usuario" : "predeterminado"),
        updatedAt: config.updatedAt || "",
    };
    assessmentLatitudeInput.value = comparableSearchConfig.latitude;
    assessmentLongitudeInput.value = comparableSearchConfig.longitude;
    comparableRadiusInput.value = comparableSearchConfig.radiusKm;
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
    if (currentPlanDraft.assessmentId === assessment.id && currentPlanDraft.preview) {
        data.plan = currentPlanDraft.preview;
    } else if (existing?.data?.plan) {
        data.plan = existing.data.plan;
    }
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
        comparableSuggestions,
        comparableSearch: comparableSearchConfig,
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
    .addEventListener("click", async () => {
        if (
            !includeCommercialInput.checked &&
            !includeFiscalHistoricInput.checked &&
            !includeFiscalCurrentInput.checked
        ) {
            valuationMessage.textContent =
                "Selecciona al menos un resultado comercial o fiscal para incluir en el informe.";
            return;
        }

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
        const includeCommercial = data.includeCommercial !== false;
        const includeFiscalHistoric = data.includeFiscalHistoric === true;
        const includeFiscalCurrent = data.includeFiscalCurrent === true;

        const comparableRows = comparables.map((item) => {
            const basePricePerM2 = Number(item.price) / Number(item.area);
            const adjustmentPct = Number(item.adjustmentPct || 0);
            const adjustedPricePerM2 =
                basePricePerM2 * (1 + adjustmentPct / 100);

            return `
                <tr>
                    <td>${escapeReportHtml(item.source)}</td>
                    <td>${escapeReportHtml(item.location)}</td>
                    <td>${escapeReportHtml(item.date)}</td>
                    <td>${escapeReportHtml(item.area)} m² (${escapeReportHtml(item.areaType)})</td>
                    <td>${formatReportCLP(item.price)}</td>
                    <td>${formatReportCLP(basePricePerM2)} / m²</td>
                    <td>${adjustmentPct}%</td>
                    <td>${formatReportCLP(adjustedPricePerM2)} / m²</td>
                    <td>${escapeReportHtml(item.weight ?? 1)}</td>
                </tr>
            `;
        }).join("");

        const areaType = data.referenceAreaType ||
            document.getElementById("value-range-area-type")?.value ||
            "construida";
        const subjectArea = Number(
            areaType === "construida" ? data.builtArea : data.landArea
        );
        const method = data.commercialMethod || "median";
        const range = calculateReferenceRange(
            comparables,
            subjectArea,
            areaType,
            method
        );

        const methodLabels = {
            median: "Mediana ponderada",
            mean: "Media aritmética",
            weighted_mean: "Media ponderada",
            quartiles: "Cuartiles ponderados",
        };
        const rangeHtml = range
            ? `<p>Q1: ${formatReportCLP(range.low)} · Estimador (${escapeReportHtml(methodLabels[method] || method)}): ${formatReportCLP(range.reference)} · Q3: ${formatReportCLP(range.high)}</p>
               <p>Superficie usada: ${escapeReportHtml(subjectArea)} m² (${escapeReportHtml(areaType)}).</p>
               <p>Los ajustes porcentuales y pesos fueron ingresados por el tasador. El ajuste modifica el precio por m²; el peso se usa en los cuantiles y, para media ponderada, en el estimador central.</p>`
            : "<p>No hay al menos dos comparables compatibles con la superficie elegida; no se calculó un estimador.</p>";
        const commercialReportHtml = includeCommercial
            ? `<h2>Análisis comercial estadístico</h2>
               <p>Método de resumen: ${escapeReportHtml(methodLabels[method] || method)}. Resultado preliminar, no constituye por sí solo un método normativo oficial.</p>
               <table>
                   <thead><tr>
                       <th>Fuente</th><th>Ubicación</th><th>Consulta/ref.</th>
                       <th>Superficie</th><th>Precio</th><th>Precio base/m²</th>
                       <th>Ajuste del tasador</th><th>Precio ajustado/m²</th><th>Peso</th>
                   </tr></thead>
                   <tbody>${comparableRows || "<tr><td colspan='9'>No hay comparables aceptados.</td></tr>"}</tbody>
               </table>
               <h3>Resumen estadístico comercial</h3>${rangeHtml}`
            : "";

        const historicalFiscal = includeFiscalHistoric
            ? calculateHistoricalFiscalValue(data)
            : null;
        if (includeFiscalHistoric && !historicalFiscal) {
            fiscalHistoricPreview.textContent =
                "No fue posible calcular la referencia con esos valores; revisa que sean numéricos y finitos.";
            return;
        }
        const historicalFiscalHtml = includeFiscalHistoric
            ? `<h2>Referencia fiscal con parámetros SII 2022</h2>
               <p>Aplicación referencial de valores y factores del reavalúo general no agrícola vigente desde el 1 de enero de 2022 a los antecedentes ingresados en esta ficha. No reconstruye el avalúo individual original de la propiedad y no es un avalúo vigente ni un valor comercial. Los factores y valores unitarios fueron ingresados y revisados por el tasador.</p>
               <p>Referencia de tabla/comuna/área homogénea: ${escapeReportHtml(data.fiscalHistoricReference)}.</p>
               <p>Terreno: ${formatReportCLP(historicalFiscal.landValue)} · Construcción: ${formatReportCLP(historicalFiscal.constructionValue)} · Total histórico: ${formatReportCLP(historicalFiscal.total)}</p>
               <p>Terreno = valor unitario × superficie × coeficiente guía × coeficiente de terreno.</p>
               <p>Construcción = valor unitario × superficie × factor de conservación × depreciación por edad × factor de localidad × coeficiente comercial.</p>
               <p>Fuentes: <a href="https://www.sii.cl/destacados/reavaluo/2022/guia_calculo_avaluo.pdf">Guía SII 2022</a> · <a href="https://www.sii.cl/normativa_legislacion/resoluciones/2021/reso143.pdf">Resolución Ex. SII N°143</a>.</p>`
            : "";
        const currentFiscalHtml = includeFiscalCurrent
            ? `<h2>Avalúo fiscal vigente informado por el usuario</h2>
               <p>Valor: ${formatReportCLP(data.currentFiscalValue)} · Fecha de consulta: ${escapeReportHtml(data.currentFiscalDate)} · Referencia: ${escapeReportHtml(data.currentFiscalSource)}.</p>
               <p>Este dato fue ingresado por el usuario; la aplicación no lo consultó ni certificó ante el SII.</p>`
            : "";
        const reportPlanRooms = data.plan?.roomsText
            ? parsePlanRooms(data.plan.roomsText)
            : null;
        const reportPlanHtml = reportPlanRooms && !reportPlanRooms.error
            ? `<h2>Plano esquemático medido</h2>
               ${buildPlanSvg(
                    reportPlanRooms.rooms,
                    parsePlanOpenings(data.plan.openingsText || "", reportPlanRooms.rooms).openings
                )}
               <p>Representación generada desde las medidas ingresadas. El profesional debe revisar su correspondencia con el inmueble; no es un plano certificado.</p>`
            : "";

        const reportHtml = `
            <!doctype html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Informe de tasación · ${escapeReportHtml(data.address)}</title>
                <style>
                    :root { color-scheme: light; }
                    * { box-sizing: border-box; }
                    body { font: 10.5pt/1.5 Arial, sans-serif; margin: 24px auto; max-width: 900px; color: #243735; }
                    header { border-bottom: 3px solid #285d56; padding: 0 0 18px; margin-bottom: 24px; }
                    .brand { color: #285d56; text-transform: uppercase; letter-spacing: .12em; font-size: 9pt; font-weight: 700; }
                    h1 { font-size: 24pt; line-height: 1.15; margin: 10px 0; color: #173c38; }
                    h2 { font-size: 15pt; margin: 28px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #b8cbc5; color: #285d56; break-after: avoid; }
                    h3 { font-size: 12pt; margin: 18px 0 6px; color: #285d56; }
                    p { white-space: pre-wrap; margin: 6px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 9pt; break-inside: auto; }
                    svg { display: block; width: 100%; max-height: 180mm; margin: 14px auto; }
                    thead { display: table-header-group; }
                    tr { break-inside: avoid; }
                    th, td { border: 1px solid #b9c9c4; padding: 7px; text-align: left; vertical-align: top; }
                    th { background: #eaf2ef; color: #173c38; }
                    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 16px 0 22px; }
                    .summary div { border: 1px solid #d5e0dc; border-radius: 6px; padding: 9px 11px; }
                    .summary strong { display: block; color: #53716a; font-size: 8.5pt; text-transform: uppercase; }
                    .signature { margin-top: 44px; border: 1px solid #b9c9c4; min-height: 150px; padding: 16px; break-inside: avoid; }
                    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 52px; }
                    .signature-line { border-top: 1px solid #526b65; padding-top: 6px; font-size: 9pt; }
                    footer { margin-top: 28px; border-top: 1px solid #b9c9c4; padding-top: 10px; color: #536a64; font-size: 8.5pt; }
                    @page { size: A4; margin: 18mm; }
                    @media print { body { margin: 0; max-width: none; } }
                    @media screen and (max-width: 650px) { body { margin: 16px; } .summary, .signature-grid { grid-template-columns: 1fr; } table { font-size: 8pt; } }
                </style>
            </head>
            <body>
                <header>
                    <div class="brand">Tasador · Informe profesional</div>
                    <h1>Informe de tasación</h1>
                    <p>Preparado por ${escapeReportHtml([currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") || currentUser.email)}</p>
                    <p>Fecha de elaboración: ${escapeReportHtml(new Date().toLocaleDateString("es-CL"))}</p>
                </header>

                <h2>Identificación de la propiedad</h2>
                <div class="summary">
                    <div><strong>Tipo de propiedad</strong>${escapeReportHtml(getPropertyTypeLabel(data.propertyType))}</div>
                    <div><strong>Dirección</strong>${escapeReportHtml(data.address)}</div>
                    <div><strong>Comuna / región</strong>${escapeReportHtml(data.commune)}, ${escapeReportHtml(data.region)}</div>
                    <div><strong>Superficies</strong>${escapeReportHtml(data.builtArea)} m² construidos · ${escapeReportHtml(data.landArea)} m² terreno</div>
                    <div><strong>Programa</strong>${escapeReportHtml(data.bedrooms)} dormitorios · ${escapeReportHtml(data.bathrooms)} baños</div>
                    <div><strong>Fecha de emisión</strong>${escapeReportHtml(new Date().toLocaleDateString("es-CL"))}</div>
                </div>

                <h2>Inspección</h2>
                <p><strong>Estado de conservación:</strong> ${escapeReportHtml(data.condition)}</p>
                <p><strong>Materiales:</strong> ${escapeReportHtml(data.materials)}</p>
                <p><strong>Distribución:</strong> ${escapeReportHtml(data.distribution)}</p>
                <p><strong>Observaciones:</strong> ${escapeReportHtml(data.observations)}</p>

                ${commercialReportHtml}
                ${historicalFiscalHtml}
                ${currentFiscalHtml}
                ${reportPlanHtml}

                <h2>Alcance y limitaciones</h2>
                <p>Este documento es una base de trabajo generada a partir de los antecedentes registrados en la ficha. El profesional responsable debe revisar la identificación del inmueble, las fuentes, las medidas, los cálculos, las hipótesis y las limitaciones antes de firmar o emitir el informe. Los resultados comerciales y fiscales se presentan por separado y no son intercambiables.</p>
                <section class="signature">
                    <h2>Revisión, firma y visado profesional</h2>
                    <p>Espacio reservado para la validación del profesional responsable. La aplicación no certifica ni visa este documento.</p>
                    <div class="signature-grid">
                        <div class="signature-line">Nombre y firma del profesional tasador</div>
                        <div class="signature-line">RUT / registro profesional</div>
                        <div class="signature-line">Visado / sello profesional</div>
                        <div class="signature-line">Lugar y fecha</div>
                    </div>
                </section>
                <footer>Documento de trabajo sujeto a validación profesional. Se recomienda conservar los antecedentes, fuentes consultadas y anexos utilizados.</footer>
            </body>
            </html>
        `;

        const reportWindow = window.open("", "_blank");
        if (!reportWindow) {
            message.textContent =
                "El navegador bloqueó la ventana del informe. Permite las ventanas emergentes e inténtalo de nuevo.";
            return;
        }

        const report = {
            id: createId(),
            assessmentId: assessment.id,
            title: `Informe · ${data.address || "Tasación"} · ${new Date().toLocaleDateString("es-CL")}`,
            html: reportHtml,
            createdAt: new Date().toISOString(),
        };
        try {
            const result = await saveReportSnapshot(report);
            reportWindow.document.write(reportHtml);
            reportWindow.document.close();
            reportWindow.focus();
            setTimeout(() => reportWindow.print(), 300);
            await loadReports();
            message.textContent = result.serverSaved
                ? "Informe guardado en Mis informes y preparado para imprimir."
                : "Informe guardado en este dispositivo; se sincronizará cuando el servidor esté disponible.";
        } catch (error) {
            reportWindow.close();
            message.textContent =
                `No se emitió el informe porque no pudo guardarse: ${error.message}`;
        }
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
    comparableWeightInput.value = "1";
    comparableAdjustmentInput.value = "0";
    addComparableButton.textContent = "Agregar comparable";
}
 // ...código que prepara una ficha nueva
function startNewAssessment() {
    flushPendingSave();

    activeId = null;
    currentPlanDraft = { assessmentId: null, roomsText: "", openingsText: "", preview: null };
    comparableRecords = [];
    comparableSuggestions = [];
    loadComparableSearchConfig();
    isDirty = false;
    form.reset();
    clearComparableEditor();
    clearComparableSuggestionEditor();
    applySettingsToForm();
    renderComparables();
    renderComparableSuggestions();
    renderComparableSearchLinks();
    updateValuationRequirements();
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
    currentPlanDraft = {
        assessmentId: assessment.id,
        roomsText: assessment.data.plan?.roomsText || "",
        openingsText: assessment.data.plan?.openingsText || "",
        preview: assessment.data.plan || null,
    };
    comparableRecords = assessment.comparables || [];
    comparableSuggestions = Array.isArray(assessment.comparableSuggestions)
        ? assessment.comparableSuggestions
        : [];
    loadComparableSearchConfig(assessment.comparableSearch || {});
    isDirty = false;

    for (const [name, value] of Object.entries(assessment.data)) {
        const field = form.elements.namedItem(name);

        if (field instanceof HTMLInputElement && field.type === "checkbox") {
            field.checked = value === true || value === "true" || value === "on";
        } else if (field && typeof value === "string") {
            field.value = value;
        }
    }

    clearComparableEditor();
    clearComparableSuggestionEditor();
    updateValuationRequirements();
    renderComparables();
    renderComparableSuggestions();
    renderComparableSearchLinks();
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
    const weight = Number(comparableWeightInput.value);
    const adjustmentPct = Number(comparableAdjustmentInput.value);

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

    if (!Number.isFinite(weight) || weight < 0.1 || weight > 10) {
        comparableMessage.textContent =
            "El peso debe estar entre 0,1 y 10.";
        return;
    }

    if (
        !Number.isFinite(adjustmentPct) ||
        adjustmentPct < -90 ||
        adjustmentPct > 100
    ) {
        comparableMessage.textContent =
            "El ajuste del tasador debe estar entre -90 % y 100 %.";
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
        weight,
        adjustmentPct,
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
    comparableWeightInput.value = String(comparable.weight ?? 1);
    comparableAdjustmentInput.value = String(comparable.adjustmentPct ?? 0);
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
    comparableSuggestions = comparableSuggestions.map((item) =>
        item.comparableId === id
            ? {
                ...item,
                status: "pending",
                comparableId: null,
                updatedAt: new Date().toISOString(),
            }
            : item
    );

    if (editingComparableId === id) {
        clearComparableEditor();
    }

    renderComparables();
    renderComparableSuggestions();
    comparableMessage.textContent = "Comparable eliminado.";
    scheduleSave();
}

function calculateReferenceRange(
    comparables,
    subjectAreaM2,
    areaType,
    method = "median"
) {
    const observations = comparables
        .filter((item) => item.areaType === areaType && item.source !== "fiscal")
        .map((item) => ({
            value:
                Number(item.price) / Number(item.area) *
                (1 + Number(item.adjustmentPct || 0) / 100),
            weight: Number(item.weight ?? 1),
        }))
        .filter((item) =>
            Number.isFinite(item.value) && item.value > 0 &&
            Number.isFinite(item.weight) && item.weight >= 0.1 && item.weight <= 10
        )
        .sort((a, b) => a.value - b.value);

    if (
        observations.length < 2 ||
        !Number.isFinite(subjectAreaM2) ||
        subjectAreaM2 <= 0
    ) {
        return null;
    }

    function weightedQuantile(values, probability) {
        const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
        let cumulativeWeight = 0;
        const centers = values.map((item) => {
            const center = (cumulativeWeight + item.weight / 2) / totalWeight;
            cumulativeWeight += item.weight;
            return { probability: center, value: item.value };
        });

        if (probability <= centers[0].probability) {
            return centers[0].value;
        }
        if (probability >= centers[centers.length - 1].probability) {
            return centers[centers.length - 1].value;
        }

        for (let index = 1; index < centers.length; index += 1) {
            const previous = centers[index - 1];
            const next = centers[index];
            if (probability <= next.probability) {
                const fraction =
                    (probability - previous.probability) /
                    (next.probability - previous.probability);
                return previous.value +
                    (next.value - previous.value) * fraction;
            }
        }

        return centers[centers.length - 1].value;
    }

    const totalWeight = observations.reduce(
        (sum, item) => sum + item.weight,
        0
    );
    const arithmeticMean = observations.reduce(
        (sum, item) => sum + item.value,
        0
    ) / observations.length;
    const weightedMean = observations.reduce(
        (sum, item) => sum + item.value * item.weight,
        0
    ) / totalWeight;
    const median = weightedQuantile(observations, 0.5);
    const estimate = method === "mean"
        ? arithmeticMean
        : method === "weighted_mean"
            ? weightedMean
            : median;

    return {
        low: Math.round(weightedQuantile(observations, 0.25) * subjectAreaM2),
        reference: Math.round(estimate * subjectAreaM2),
        high: Math.round(weightedQuantile(observations, 0.75) * subjectAreaM2),
        median: Math.round(median * subjectAreaM2),
        mean: Math.round(arithmeticMean * subjectAreaM2),
        weightedMean: Math.round(weightedMean * subjectAreaM2),
        method,
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
        areaType,
        commercialMethodInput.value
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
            "Ingresa la superficie de la tasación y agrega al menos dos comparables aceptados del mismo tipo de superficie.";
        renderFiscalHistoricPreview();
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
        `${commercialMethodInput.options[commercialMethodInput.selectedIndex].text}: ` +
        `Q1 ${formatCLP(result.low)} · centro ${formatCLP(result.reference)} · ` +
        `Q3 ${formatCLP(result.high)}. Método estadístico preliminar; revisa cada comparable.`;
    renderFiscalHistoricPreview();
}

function getPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
}

function calculateHistoricalFiscalValue(data) {
    const landArea = getPositiveNumber(data.landArea);
    const builtArea = Number(data.builtArea);
    const builtAreaEntered = String(data.builtArea ?? "").trim() !== "";
    const landUnitValue = getPositiveNumber(data.fiscalLandUnitValue);
    const landGuideFactor = getPositiveNumber(data.fiscalLandGuideFactor);
    const landFactor = getPositiveNumber(data.fiscalLandFactor);
    const hasConstruction = Number.isFinite(builtArea) && builtArea > 0;
    const constructionUnitValue = hasConstruction
        ? getPositiveNumber(data.fiscalConstructionUnitValue)
        : 1;
    const conditionFactor = hasConstruction
        ? getPositiveNumber(data.fiscalConditionFactor)
        : 1;
    const ageFactor = hasConstruction
        ? getPositiveNumber(data.fiscalAgeFactor)
        : 1;
    const localityFactor = hasConstruction
        ? getPositiveNumber(data.fiscalLocalityFactor)
        : 1;
    const commercialFactor = hasConstruction
        ? getPositiveNumber(data.fiscalCommercialFactor)
        : 1;

    if (
        !landArea || !builtAreaEntered ||
        !Number.isFinite(builtArea) || builtArea < 0 ||
        !landUnitValue || !landGuideFactor || !landFactor ||
        !constructionUnitValue || !conditionFactor || !ageFactor ||
        !localityFactor || !commercialFactor
    ) {
        return null;
    }

    const landValue = landUnitValue * landArea * landGuideFactor * landFactor;
    const constructionValue = hasConstruction
        ? constructionUnitValue * builtArea * conditionFactor * ageFactor *
            localityFactor * commercialFactor
        : 0;
    const total = landValue + constructionValue;

    if (
        !Number.isFinite(landValue) ||
        !Number.isFinite(constructionValue) ||
        !Number.isFinite(total)
    ) {
        return null;
    }

    return {
        landValue: Math.round(landValue),
        constructionValue: Math.round(constructionValue),
        total: Math.round(total),
    };
}

function renderFiscalHistoricPreview() {
    const result = calculateHistoricalFiscalValue(getFormData());
    if (!result) {
        fiscalHistoricPreview.textContent =
            "Completa las superficies y los factores revisados en la fuente SII 2022 para ver este cálculo referencial.";
        return;
    }

    fiscalHistoricPreview.textContent =
        `Referencia fiscal con parámetros 2022 — terreno: ${formatCurrency(result.landValue)}; ` +
        `construcción: ${formatCurrency(result.constructionValue)}; ` +
        `total: ${formatCurrency(result.total)}. No es un avalúo vigente.`;
}

function updateValuationRequirements() {
    const historicEnabled = includeFiscalHistoricInput.checked;
    const currentEnabled = includeFiscalCurrentInput.checked;
    const historicLandRequiredIds = [
        "fiscal-land-unit-value",
        "fiscal-land-guide-factor",
        "fiscal-land-factor",
    ];
    const historicConstructionRequiredIds = [
        "fiscal-construction-unit-value",
        "fiscal-condition-factor",
        "fiscal-age-factor",
        "fiscal-locality-factor",
        "fiscal-commercial-factor",
    ];
    const builtArea = Number(form.elements.namedItem("builtArea").value);

    for (const id of historicLandRequiredIds) {
        document.getElementById(id).required = historicEnabled;
    }
    form.elements.namedItem("builtArea").required = historicEnabled;
    form.elements.namedItem("landArea").required = historicEnabled;
    for (const id of historicConstructionRequiredIds) {
        document.getElementById(id).required =
            historicEnabled && Number.isFinite(builtArea) && builtArea > 0;
    }
    fiscalHistoricReviewedInput.required = historicEnabled;
    fiscalHistoricReferenceInput.required = historicEnabled;
    currentFiscalValueInput.required = currentEnabled;
    currentFiscalDateInput.required = currentEnabled;
    currentFiscalSourceInput.required = currentEnabled;
    valuationMessage.textContent = historicEnabled
        ? "La referencia con parámetros 2022 solo se incluirá después de confirmar que revisaste la fuente y los factores."
        : "";
    renderFiscalHistoricPreview();
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

function parsePlanNumber(value) {
    const number = Number(String(value).trim().replace(",", "."));
    return Number.isFinite(number) ? number : null;
}

function parsePlanRooms(source) {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return { rooms: [], error: "Añade al menos una habitación medida." };

    const rooms = [];
    for (const line of lines) {
        const separator = line.indexOf(":");
        if (separator < 1) {
            return { rooms: [], error: `No se reconoce la habitación «${line}». Usa «Nombre: x,y; x,y; x,y».` };
        }
        const name = line.slice(0, separator).trim();
        const points = line.slice(separator + 1).split(";").map((pair) => {
            const [xText, yText] = pair.split(",");
            if (xText === undefined || yText === undefined) return null;
            const x = parsePlanNumber(xText);
            const y = parsePlanNumber(yText);
            return x === null || y === null ? null : { x, y };
        });
        if (!name || points.length < 3 || points.some((point) => point === null)) {
            return { rooms: [], error: `La habitación «${name || line}» requiere un nombre y al menos tres pares X,Y válidos en metros.` };
        }
        if (rooms.some((room) => room.name.toLowerCase() === name.toLowerCase())) {
            return { rooms: [], error: `El nombre «${name}» está repetido; usa nombres únicos para las habitaciones.` };
        }
        const uniquePoints = new Set(points.map((point) => `${point.x},${point.y}`));
        const area = Math.abs(points.reduce((sum, point, index) => {
            const next = points[(index + 1) % points.length];
            return sum + point.x * next.y - next.x * point.y;
        }, 0)) / 2;
        if (
            uniquePoints.size < 3 || area < 0.001 ||
            points.some((point, index) => {
                const next = points[(index + 1) % points.length];
                return point.x === next.x && point.y === next.y;
            })
        ) {
            return { rooms: [], error: `La habitación «${name}» tiene vértices repetidos o no encierra un área válida.` };
        }
        rooms.push({ name, points });
    }
    return { rooms, error: "" };
}

function parsePlanOpenings(source, rooms) {
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const openings = [];
    const warnings = [];
    for (const line of lines) {
        const [roomName, wallText, typeText, offsetText, widthText] =
            line.split(";").map((part) => part?.trim() || "");
        const room = rooms.find((item) => item.name.toLowerCase() === roomName.toLowerCase());
        const wallIndex = Number(wallText) - 1;
        const offset = parsePlanNumber(offsetText);
        const width = parsePlanNumber(widthText);
        const wallStart = room?.points[wallIndex];
        const wallEnd = room?.points[(wallIndex + 1) % (room?.points.length || 1)];
        const wallLength = wallStart && wallEnd
            ? Math.hypot(wallEnd.x - wallStart.x, wallEnd.y - wallStart.y)
            : 0;
        const type = normalizeImportedLabel(typeText);
        if (
            !room || !wallStart || !wallEnd ||
            !["puerta", "ventana"].includes(type) ||
            offset === null || width === null || offset < 0 || width <= 0 ||
            offset + width > wallLength
        ) {
            warnings.push(`Abertura no válida o ambigua: «${line}».`);
            continue;
        }
        openings.push({ roomName: room.name, wallIndex, type, offset, width });
    }
    return { openings, warnings };
}

function buildPlanSvg(rooms, openings) {
    const allPoints = rooms.flatMap((room) => room.points);
    const minX = Math.min(...allPoints.map((point) => point.x));
    const maxX = Math.max(...allPoints.map((point) => point.x));
    const minY = Math.min(...allPoints.map((point) => point.y));
    const maxY = Math.max(...allPoints.map((point) => point.y));
    const padding = Math.max(0.8, (Math.max(maxX - minX, maxY - minY) || 1) * 0.12);
    const viewBox = `${minX - padding} ${-maxY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
    const lines = rooms.map((room) => {
        const points = room.points.map((point) => `${point.x},${-point.y}`).join(" ");
        const centerX = room.points.reduce((sum, point) => sum + point.x, 0) / room.points.length;
        const centerY = -room.points.reduce((sum, point) => sum + point.y, 0) / room.points.length;
        const dimensions = room.points.map((point, index) => {
            const next = room.points[(index + 1) % room.points.length];
            const length = Math.hypot(next.x - point.x, next.y - point.y);
            const labelX = (point.x + next.x) / 2;
            const labelY = -(point.y + next.y) / 2 - 0.12;
            return `<text class="dimension" x="${labelX}" y="${labelY}">${length.toFixed(2)} m</text>`;
        }).join("");
        return `<g><polygon points="${points}"/><text class="room-label" x="${centerX}" y="${centerY}">${escapeReportHtml(room.name)}</text>${dimensions}</g>`;
    }).join("");
    const openingMarks = openings.map((opening) => {
        const room = rooms.find((item) => item.name === opening.roomName);
        const start = room.points[opening.wallIndex];
        const end = room.points[(opening.wallIndex + 1) % room.points.length];
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const from = opening.offset / length;
        const to = (opening.offset + opening.width) / length;
        const x1 = start.x + (end.x - start.x) * from;
        const y1 = -(start.y + (end.y - start.y) * from);
        const x2 = start.x + (end.x - start.x) * to;
        const y2 = -(start.y + (end.y - start.y) * to);
        const color = opening.type === "puerta" ? "#d97736" : "#268a9b";
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.10" stroke-linecap="round"/>`;
    }).join("");
    const scaleY = -maxY - padding * 0.55;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Plano esquemático medido">
        <style>
            polygon { fill: #edf5f2; stroke: #285d56; stroke-width: .06; }
            .room-label { font: .28px sans-serif; text-anchor: middle; fill: #173c38; }
            .dimension { font: .16px sans-serif; text-anchor: middle; fill: #405b58; }
        </style>
        ${lines}${openingMarks}
        <text x="${minX - padding * 0.55}" y="${-maxY - padding * 0.45}" font-size=".28" fill="#173c38">N ↑</text>
        <line x1="${minX}" y1="${scaleY}" x2="${minX + 1}" y2="${scaleY}" stroke="#173c38" stroke-width=".05"/>
        <text x="${minX + .5}" y="${scaleY - .1}" font-size=".16" text-anchor="middle" fill="#173c38">1 m</text>
    </svg>`;
}

function renderPlanAssessmentOptions() {
    const previousValue = planAssessmentSelect.value || activeId || "";
    planAssessmentSelect.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = assessments.length
        ? "Selecciona una tasación"
        : "Crea primero una tasación";
    planAssessmentSelect.append(placeholder);
    for (const assessment of assessments) {
        const option = document.createElement("option");
        option.value = assessment.id;
        option.textContent = [
            assessment.data.address,
            assessment.data.commune,
            getPropertyTypeLabel(assessment.data.propertyType),
        ].filter(Boolean).join(" · ") || `Tasación ${assessment.id.slice(0, 8)}`;
        planAssessmentSelect.append(option);
    }
    planAssessmentSelect.value = assessments.some((item) => item.id === previousValue)
        ? previousValue
        : "";
    if (planAssessmentSelect.value) {
        loadPlanDraftForAssessment(planAssessmentSelect.value);
    }
}

function loadPlanDraftForAssessment(assessmentId) {
    const assessment = assessments.find((item) => item.id === assessmentId);
    const plan = assessment?.data?.plan;
    currentPlanDraft = {
        assessmentId,
        roomsText: plan?.roomsText || "",
        openingsText: plan?.openingsText || "",
        preview: plan || null,
    };
    planRoomsInput.value = currentPlanDraft.roomsText;
    planOpeningsInput.value = currentPlanDraft.openingsText;
    if (plan?.svg) {
        planPreview.innerHTML = plan.svg;
        planMessage.textContent = "Plano guardado. Revisa las medidas y la distribución antes de usarlo.";
    } else {
        planPreview.replaceChildren();
        planMessage.textContent = "";
    }
}

function generatePlanPreview() {
    const parsed = parsePlanRooms(planRoomsInput.value);
    if (parsed.error) {
        currentPlanDraft.preview = null;
        planPreview.replaceChildren();
        planMessage.textContent = `${parsed.error} No se generó un plano definitivo.`;
        return;
    }
    const parsedOpenings = parsePlanOpenings(planOpeningsInput.value, parsed.rooms);
    const svg = buildPlanSvg(parsed.rooms, parsedOpenings.openings);
    currentPlanDraft = {
        assessmentId: planAssessmentSelect.value || null,
        roomsText: planRoomsInput.value,
        openingsText: planOpeningsInput.value,
        preview: {
            roomsText: planRoomsInput.value,
            openingsText: planOpeningsInput.value,
            rooms: parsed.rooms,
            openings: parsedOpenings.openings,
            warnings: parsedOpenings.warnings,
            svg,
            updatedAt: new Date().toISOString(),
        },
    };
    planPreview.innerHTML = svg;
    planMessage.textContent = parsedOpenings.warnings.length
        ? `Vista previa esquemática; revisa estas aberturas: ${parsedOpenings.warnings.join(" ")}`
        : "Vista previa esquemática generada. Comprueba las medidas, orientación y distribución; no es un plano certificado.";
}

function savePlanToAssessment() {
    const assessmentId = planAssessmentSelect.value;
    if (!assessmentId) {
        planMessage.textContent = "Selecciona una tasación guardada para asociar el plano.";
        return;
    }
    if (!currentPlanDraft.preview) {
        planMessage.textContent = "Genera y revisa una vista previa válida antes de guardarla.";
        return;
    }
    const assessment = assessments.find((item) => item.id === assessmentId);
    if (!assessment) {
        planMessage.textContent = "La tasación seleccionada ya no está disponible.";
        return;
    }
    const planToSave = currentPlanDraft.preview;
    const roomsText = currentPlanDraft.roomsText;
    const openingsText = currentPlanDraft.openingsText;
    if (activeId !== assessmentId) {
        openAssessment(assessmentId);
        setActiveView("plans-view");
    }
    currentPlanDraft = { assessmentId, roomsText, openingsText, preview: planToSave };
    isDirty = true;
    if (!saveActiveAssessment(true)) {
        planMessage.textContent = "No se pudo sincronizar el plano. Revisa la ficha y vuelve a intentarlo.";
        return;
    }
    planMessage.textContent = navigator.onLine
        ? "Plano guardado localmente y enviado para sincronización."
        : "Plano guardado localmente; se sincronizará cuando haya conexión.";
}

async function savePlanFiles() {
    const assessmentId = planAssessmentSelect.value;
    const files = Array.from(document.querySelector("#plan-import-input").files || []);
    if (!assessmentId) {
        planMessage.textContent = "Selecciona una tasación guardada antes de importar archivos.";
        return;
    }
    if (!files.length) {
        planMessage.textContent = "Selecciona uno o más archivos de plano.";
        return;
    }
    const tooLarge = files.find((file) => file.size > 25 * 1024 * 1024);
    if (tooLarge) {
        planMessage.textContent = `«${tooLarge.name}» supera el límite de 25 MB.`;
        return;
    }
    try {
        for (const file of files) {
            await window.TasadorFileStore.save({
                id: createId(),
                assessmentId,
                purpose: "plan",
                name: file.name,
                type: file.type || "application/octet-stream",
                size: file.size,
                createdAt: new Date().toISOString(),
                blob: file,
                optimizedBlob: file,
                optimizedName: file.name,
                optimizedSize: file.size,
                serverSynced: false,
            }, currentUser.id);
        }
        document.querySelector("#plan-import-input").value = "";
        const failures = await syncPendingAttachments();
        await loadPlanFiles();
        planMessage.textContent = failures
            ? "Archivos guardados en este dispositivo; algunos quedan pendientes de sincronización."
            : "Archivos de plano guardados y sincronizados.";
    } catch (error) {
        planMessage.textContent = `No se pudieron guardar los archivos: ${error.message}`;
    }
}

async function loadPlanFiles() {
    planFileList.replaceChildren();
    const assessmentId = planAssessmentSelect.value;
    if (!assessmentId) {
        const item = document.createElement("li");
        item.textContent = "Selecciona una tasación para ver sus planos importados.";
        planFileList.append(item);
        return;
    }
    try {
        const local = (await window.TasadorFileStore.listByAssessment(
            assessmentId,
            currentUser.id
        )).filter((file) => file.purpose === "plan");
        const byId = new Map(local.map((file) => [String(file.id), file]));
        if (navigator.onLine) {
            const response = await apiFetch(
                `${API_BASE_URL}/assessments/${encodeURIComponent(assessmentId)}/plans`
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            for (const file of await response.json()) {
                if (!byId.has(String(file.id))) {
                    byId.set(String(file.id), { ...file, isRemoteOnly: true, serverSynced: true });
                }
            }
        }
        if (!byId.size) {
            const item = document.createElement("li");
            item.textContent = "Todavía no hay archivos de plano importados.";
            planFileList.append(item);
            return;
        }
        for (const file of byId.values()) {
            const item = document.createElement("li");
            item.className = "assessment-card";
            const details = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = file.name;
            const info = document.createElement("p");
            info.textContent = `${file.type || "Formato desconocido"} · ${formatFileSize(file.size)}`;
            details.append(title, info);
            const actions = document.createElement("div");
            actions.className = "assessment-actions";
            const download = document.createElement("button");
            download.type = "button";
            download.textContent = file.isRemoteOnly ? "Descargar" : "Guardar copia";
            download.addEventListener("click", async () => {
                if (file.isRemoteOnly) {
                    await downloadRemoteAttachment(file);
                } else if (file.blob) {
                    downloadLocalBlob(file.blob, file.name);
                } else {
                    planMessage.textContent = "El archivo no está disponible en este dispositivo.";
                }
            });
            actions.append(download);
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "danger";
            remove.textContent = "Eliminar";
            remove.addEventListener("click", async () => {
                await deletePlanFile(file);
                await loadPlanFiles();
            });
            actions.append(remove);
            item.append(details, actions);
            planFileList.append(item);
        }
    } catch (error) {
        const item = document.createElement("li");
        item.textContent = `No se pudieron cargar los planos: ${error.message}`;
        planFileList.append(item);
    }
}

async function deletePlanFile(file) {
    const assessmentId = file.assessmentId || planAssessmentSelect.value;
    try {
        const localFiles = await window.TasadorFileStore.listByAssessment(
            assessmentId,
            currentUser.id
        );
        const localFile = localFiles.find((item) => String(item.id) === String(file.id));
        const mayExistOnServer = file.isRemoteOnly || file.serverSynced ||
            localFile?.serverSynced !== false;
        if (mayExistOnServer) {
            addPendingAttachmentDeletion(assessmentId, file.id);
        }
        if (localFile) {
            await window.TasadorFileStore.remove(file.id, currentUser.id);
        }
        if (mayExistOnServer && navigator.onLine) {
            await syncPendingAttachmentDeletions();
        }
        planMessage.textContent = mayExistOnServer && !navigator.onLine
            ? "Archivo eliminado localmente; el borrado del servidor queda pendiente."
            : "Archivo de plano eliminado.";
    } catch (error) {
        planMessage.textContent = `No se pudo eliminar el plano: ${error.message}`;
    }
}

const REPORT_DELETIONS_KEY = "tasadorMvp.pendingReportDeletions";

function readLocalReports() {
    try {
        const reports = JSON.parse(getUserItem(REPORTS_KEY) || "[]");
        return Array.isArray(reports) ? reports : [];
    } catch (error) {
        console.error("No se pudieron leer los informes locales:", error);
        return [];
    }
}

function writeLocalReports(reports) {
    setUserItem(REPORTS_KEY, JSON.stringify(reports));
}

function getPendingReportDeletions() {
    try {
        const values = JSON.parse(getUserItem(REPORT_DELETIONS_KEY) || "[]");
        return Array.isArray(values) ? values.map(String) : [];
    } catch (error) {
        console.error("No se pudieron leer los borrados pendientes de informes:", error);
        return [];
    }
}

async function saveReportSnapshot(report) {
    let localSaved = false;
    let serverSaved = false;
    let localError = null;
    const reports = readLocalReports().filter((item) => item.id !== report.id);
    reports.unshift({ ...report, serverSynced: false });
    try {
        writeLocalReports(reports);
        localSaved = true;
    } catch (error) {
        localError = error;
    }

    if (navigator.onLine) {
        try {
            const response = await apiFetch(`${API_BASE_URL}/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: report.id,
                    assessmentId: report.assessmentId,
                    title: report.title,
                    html: report.html,
                }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.detail || `HTTP ${response.status}`);
            }
            serverSaved = true;
            if (localSaved) {
                writeLocalReports(
                    readLocalReports().map((item) =>
                        item.id === report.id ? { ...item, serverSynced: true } : item
                    )
                );
            }
        } catch (error) {
            console.error("No se pudo guardar el informe en el servidor:", error);
        }
    }
    if (!localSaved && !serverSaved) {
        throw new Error(localError?.message || "almacenamiento local y servidor no disponibles");
    }
    return { localSaved, serverSaved };
}

function openSavedReport(report, print = false) {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
        reportsMessage.textContent =
            "El navegador bloqueó la ventana. Permite ventanas emergentes para abrir este informe.";
        return;
    }
    reportWindow.document.write(report.html);
    reportWindow.document.close();
    reportWindow.focus();
    if (print) setTimeout(() => reportWindow.print(), 300);
}

function renderReports(reports) {
    reportsList.replaceChildren();
    if (!reports.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Todavía no has guardado informes.";
        reportsList.append(empty);
        return;
    }
    const list = document.createElement("ul");
    list.className = "assessment-list";
    for (const report of reports) {
        const item = document.createElement("li");
        item.className = "assessment-card";
        const details = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = report.title;
        const date = document.createElement("p");
        date.textContent = `Guardado el ${new Date(report.createdAt).toLocaleString("es-CL")}`;
        const state = document.createElement("p");
        state.textContent = report.serverSynced
            ? "Sincronizado con tu cuenta"
            : "Guardado en este dispositivo";
        details.append(title, date, state);
        const actions = document.createElement("div");
        actions.className = "assessment-actions";
        const open = document.createElement("button");
        open.type = "button";
        open.textContent = "Abrir / imprimir";
        open.addEventListener("click", () => openSavedReport(report, true));
        const download = document.createElement("button");
        download.type = "button";
        download.className = "secondary";
        download.textContent = "Descargar HTML";
        download.addEventListener("click", () => {
            const blob = new Blob([report.html], { type: "text/html;charset=utf-8" });
            const safeName = report.title.replace(/[<>:"/\\|?*]+/g, "-").slice(0, 100);
            downloadLocalBlob(blob, `${safeName || "informe"}.html`);
        });
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "danger";
        remove.textContent = "Eliminar";
        remove.addEventListener("click", async () => {
            await deleteSavedReport(report.id);
        });
        actions.append(open, download, remove);
        item.append(details, actions);
        list.append(item);
    }
    reportsList.append(list);
}

async function deleteSavedReport(reportId) {
    if (navigator.onLine) {
        try {
            const response = await apiFetch(
                `${API_BASE_URL}/reports/${encodeURIComponent(reportId)}`,
                { method: "DELETE" }
            );
            if (!response.ok && response.status !== 404) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.detail || `HTTP ${response.status}`);
            }
        } catch (error) {
            reportsMessage.textContent =
                `No se eliminó el informe del servidor: ${error.message}`;
            return;
        }
    } else {
        const deletions = getPendingReportDeletions();
        if (!deletions.includes(reportId)) {
            deletions.push(reportId);
            setUserItem(REPORT_DELETIONS_KEY, JSON.stringify(deletions));
        }
    }
    writeLocalReports(readLocalReports().filter((item) => item.id !== reportId));
    reportsMessage.textContent = navigator.onLine
        ? "Informe eliminado."
        : "Informe eliminado de este dispositivo; se actualizará el servidor al reconectar.";
    await loadReports();
}

async function syncPendingReportDeletions() {
    if (!navigator.onLine || !getAccessToken()) return;
    const pending = getPendingReportDeletions();
    const remaining = [];
    for (const id of pending) {
        try {
            const response = await apiFetch(
                `${API_BASE_URL}/reports/${encodeURIComponent(id)}`,
                { method: "DELETE" }
            );
            if (!response.ok && response.status !== 404) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error(`No se pudo eliminar el informe ${id}:`, error);
            remaining.push(id);
        }
    }
    setUserItem(REPORT_DELETIONS_KEY, JSON.stringify(remaining));
}

async function loadReports() {
    const localReports = readLocalReports();
    let remoteReports = [];
    reportsMessage.textContent = "";
    if (navigator.onLine) {
        for (const report of localReports.filter((item) => !item.serverSynced)) {
            try {
                await saveReportSnapshot(report);
            } catch (error) {
                console.error("No se pudo sincronizar el informe guardado localmente:", error);
            }
        }
        await syncPendingReportDeletions();
        try {
            const response = await apiFetch(`${API_BASE_URL}/reports`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            remoteReports = await response.json();
        } catch (error) {
            reportsMessage.textContent =
                `No se pudo consultar el servidor; se muestran copias locales. ${error.message}`;
        }
    }
    const reportsById = new Map(remoteReports.map((item) => [
        String(item.id),
        { ...item, serverSynced: true },
    ]));
    for (const report of readLocalReports()) {
        if (!reportsById.has(String(report.id))) reportsById.set(String(report.id), report);
    }
    const pending = new Set(getPendingReportDeletions());
    const reports = [...reportsById.values()]
        .filter((report) => !pending.has(String(report.id)))
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    renderReports(reports);
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


async function renderAttachmentsPrevious() {
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
            `Original: ${formatFileSize(attachment.size)}` +
            (attachment.optimizedSize
                ? ` · Copia optimizada: ${formatFileSize(attachment.optimizedSize)}` +
                    (attachment.optimizedTargetMet === undefined
                        ? ""
                        : ` · Objetivo ${attachment.optimizedTargetMet ? "alcanzado" : "no alcanzado"} (${attachment.optimizedTargetKb} KB)`)
                : "");

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
            if (attachment.optimizedBlob) {
                const optimizedDownload = document.createElement("button");
                optimizedDownload.type = "button";
                optimizedDownload.className = "secondary";
                optimizedDownload.textContent = "Descargar copia optimizada";
                optimizedDownload.addEventListener("click", () => {
                    downloadLocalBlob(
                        attachment.optimizedBlob,
                        attachment.optimizedName || attachment.name
                    );
                });
                actions.append(optimizedDownload);

                if (typeof navigator.share === "function") {
                    const shareButton = document.createElement("button");
                    shareButton.type = "button";
                    shareButton.className = "secondary";
                    shareButton.textContent = "Compartir copia optimizada";
                    shareButton.addEventListener("click", async () => {
                        const sharedFile = new File(
                            [attachment.optimizedBlob],
                            attachment.optimizedName || attachment.name,
                            { type: attachment.optimizedBlob.type || attachment.type }
                        );
                        try {
                            await navigator.share({ files: [sharedFile] });
                        } catch (error) {
                            if (error.name !== "AbortError") {
                                attachmentMessage.textContent =
                                    `No se pudo compartir la imagen: ${error.message}`;
                            }
                        }
                    });
                    actions.append(shareButton);
                }
            }
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
            purpose: attachment.purpose || "attachment",
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
        if (
            attachment.purpose === "plan" &&
            planAssessmentSelect.value === attachment.assessmentId
        ) {
            await loadPlanFiles();
        }

        const statusMessage = attachment.purpose === "plan"
            ? planMessage
            : attachmentMessage;
        statusMessage.textContent =
            "Archivo descargado y guardado en este dispositivo.";
    } catch (error) {
        console.error("No se pudo descargar el adjunto:", error);
        attachmentMessage.textContent =
            "No se pudo descargar el archivo del servidor.";
    }
}
function downloadLocalBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || "archivo";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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
            localAttachments
                .filter((attachment) => attachment.purpose !== "plan")
                .map((attachment) => [
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
                `Original: ${formatFileSize(attachment.size)}` +
                (attachment.optimizedSize
                    ? ` · Copia optimizada: ${formatFileSize(attachment.optimizedSize)}` +
                        (attachment.optimizedTargetMet === undefined
                            ? ""
                            : ` · Objetivo ${attachment.optimizedTargetMet ? "alcanzado" : "no alcanzado"} (${attachment.optimizedTargetKb} KB)`)
                    : "");

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

                if (attachment.optimizedBlob) {
                    const originalDownload = document.createElement("button");
                    originalDownload.type = "button";
                    originalDownload.className = "secondary";
                    originalDownload.textContent = "Descargar original";
                    originalDownload.addEventListener("click", () =>
                        downloadLocalBlob(attachment.blob, attachment.name)
                    );
                    actions.append(originalDownload);

                    const optimizedDownload = document.createElement("button");
                    optimizedDownload.type = "button";
                    optimizedDownload.className = "secondary";
                    optimizedDownload.textContent = "Descargar copia optimizada";
                    optimizedDownload.addEventListener("click", () =>
                        downloadLocalBlob(
                            attachment.optimizedBlob,
                            attachment.optimizedName || attachment.name
                        )
                    );
                    actions.append(optimizedDownload);
                    if (typeof navigator.share === "function") {
                        const shareButton = document.createElement("button");
                        shareButton.type = "button";
                        shareButton.className = "secondary";
                        shareButton.textContent = "Compartir copia optimizada";
                        shareButton.addEventListener("click", async () => {
                            const file = new File(
                                [attachment.optimizedBlob],
                                attachment.optimizedName || attachment.name,
                                { type: attachment.optimizedBlob.type || attachment.type }
                            );
                            try {
                                await navigator.share({ files: [file] });
                            } catch (error) {
                                if (error.name !== "AbortError") {
                                    attachmentMessage.textContent =
                                        `No se pudo compartir la imagen: ${error.message}`;
                                }
                            }
                        });
                        actions.append(shareButton);
                    }
                }

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
            const uploadFile = attachment.optimizedBlob
                ? {
                    blob: attachment.optimizedBlob,
                    name: attachment.optimizedName || attachment.name,
                    size: attachment.optimizedSize || attachment.size,
                }
                : await compressImageForUpload(attachment.blob);
            formData.append(
                "file",
                uploadFile.blob,
                uploadFile.name || "archivo"
            );
            formData.append("purpose", attachment.purpose || "attachment");

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
                ...(!attachment.optimizedBlob && uploadFile.isImage ? {
                    optimizedBlob: uploadFile.blob,
                    optimizedName: uploadFile.name,
                    optimizedSize: uploadFile.size,
                    optimizedTargetMet: uploadFile.targetMet,
                    optimizedTargetKb: uploadFile.targetKb,
                } : {}),
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
    const files = [
        ...Array.from(attachmentInput.files || []),
        ...Array.from(cameraInput.files || []),
        ...pendingCameraFiles,
    ];

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
            const optimized = await compressImageForUpload(file);
            await window.TasadorFileStore.save({
                id: createId(),
                assessmentId: activeId,
                name: file.name,
                type: file.type,
                size: file.size,
                ...(optimized.isImage ? {
                    optimizedBlob: optimized.blob,
                    optimizedName: optimized.name,
                    optimizedSize: optimized.size,
                    optimizedTargetMet: optimized.targetMet,
                    optimizedTargetKb: optimized.targetKb,
                } : {}),
                createdAt: new Date().toISOString(),
                blob: file,
                serverSynced: false,
            }, currentUser.id);
        }

        const hasPendingSync =
            !navigator.onLine ||
            (await syncPendingAttachments()) > 0;

        attachmentInput.value = "";
        cameraInput.value = "";
        pendingCameraFiles.length = 0;
        cameraCaptureMessage.textContent = "";
        saveActiveAssessment(true);
        await renderAttachments();

        attachmentMessage.textContent = hasPendingSync
            ? "Archivos guardados en este dispositivo; algunos quedan pendientes de sincronización."
            : "Archivos originales conservados en este dispositivo; copias optimizadas sincronizadas.";
    } catch (error) {
        console.error("Error al guardar o sincronizar los archivos:", error);
        attachmentMessage.textContent =
            "Hubo un error al procesar los archivos. Revisa la consola.";
        await renderAttachments();
    }
}

function queueCapturedPhoto(file) {
    pendingCameraFiles.push(file);
    cameraCaptureMessage.textContent =
        `Foto capturada (${pendingCameraFiles.length} pendiente${pendingCameraFiles.length === 1 ? "" : "s"}). Pulsa "Guardar archivos seleccionados" para añadirla a la tasación.`;
}

async function handleTakePhoto() {
    if (!isNativeCameraAvailable()) {
        cameraInput.click();
        return;
    }

    cameraButton.disabled = true;
    cameraCaptureMessage.textContent = "Abriendo la cámara del dispositivo…";
    try {
        queueCapturedPhoto(await takeNativePhoto());
    } catch (error) {
        if (error?.message?.toLowerCase().includes("cancel")) {
            cameraCaptureMessage.textContent = "Captura cancelada.";
            return;
        }

        console.error("No se pudo capturar la foto con la cámara nativa:", error);
        cameraCaptureMessage.textContent =
            "No se pudo abrir la cámara nativa. Puedes seleccionar una foto del dispositivo.";
        cameraInput.click();
    } finally {
        cameraButton.disabled = false;
    }
}

restoreNativePhotoListener(
    queueCapturedPhoto,
    () => {
        cameraCaptureMessage.textContent =
            "No se pudo recuperar la foto. Vuelve a tomarla antes de cerrar esta pantalla.";
    }
).catch((error) => {
    console.error("No se pudo preparar la recuperación de la cámara:", error);
    cameraCaptureMessage.textContent =
        "No se pudo preparar la recuperación de fotos de la cámara.";
});


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
    if (getAccessToken() && currentUser) {
        await syncPendingAttachments();
        await syncPendingAttachmentDeletions();
        await syncPendingReportDeletions();
        await loadReports();
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
    if (["propertyType", "commune", "region"].includes(event.target.name)) {
        renderComparableSearchLinks();
    }
});

form.addEventListener("change", (event) => {
    if (!comparableEditor.contains(event.target)) {
        scheduleSave();
    }
    if (["propertyType", "commune", "region"].includes(event.target.name)) {
        renderComparableSearchLinks();
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
saveSuggestionButton.addEventListener("click", saveComparableSuggestion);
cancelSuggestionEditButton.addEventListener("click", () => {
    clearComparableSuggestionEditor();
    suggestionMessage.textContent = "";
});
assessmentLatitudeInput.addEventListener("change", updateComparableSearchConfig);
assessmentLongitudeInput.addEventListener("change", updateComparableSearchConfig);
comparableRadiusInput.addEventListener("change", updateComparableSearchConfig);
newAssessmentButton.addEventListener("click", () => {
    assessmentFilter = null;
    startNewAssessment();
    setActiveView("editor-view");
});


saveAttachmentsButton.addEventListener("click", saveSelectedAttachments);
document
    .getElementById("value-range-area-type")
    .addEventListener("change", renderReferenceRange);

commercialMethodInput.addEventListener("change", renderReferenceRange);
includeFiscalHistoricInput.addEventListener("change", updateValuationRequirements);
includeFiscalCurrentInput.addEventListener("change", updateValuationRequirements);
includeCommercialInput.addEventListener("change", () => {
    valuationMessage.textContent = includeCommercialInput.checked
        ? "El informe incluirá el resumen comercial."
        : "El informe no incluirá el análisis comercial.";
});
form.querySelectorAll(
    "[name^='fiscalLand'], [name^='fiscalConstruction'], [name^='fiscalCondition'], [name^='fiscalAge'], [name^='fiscalLocality'], [name^='fiscalCommercial']"
).forEach((input) => {
    input.addEventListener("input", renderFiscalHistoricPreview);
});

form.elements.namedItem("builtArea").addEventListener("input", () => {
    renderReferenceRange();
    updateValuationRequirements();
});

form.elements.namedItem("landArea").addEventListener("input", renderReferenceRange);

form.elements.namedItem("deadlineMode").addEventListener("change", updateDeadlineFields);
document.querySelector("#default-deadline-mode").addEventListener("change", () => {
    document.querySelector("#default-deadline-days").disabled =
        document.querySelector("#default-deadline-mode").value === "manual";
});
imageQualityInput.addEventListener("input", () => {
    imageQualityOutput.value = `${Math.round(Number(imageQualityInput.value) * 100)}%`;
});
cameraButton.addEventListener("click", handleTakePhoto);
cameraInput.addEventListener("change", () => {
    const count = cameraInput.files?.length || 0;
    if (count) {
        cameraCaptureMessage.textContent =
            `${count} foto${count === 1 ? "" : "s"} seleccionada${count === 1 ? "" : "s"}. Pulsa "Guardar archivos seleccionados" para añadirla${count === 1 ? "" : "s"} a la tasación.`;
    }
});
document.querySelector("#copy-assessment-template").addEventListener("click", async () => {
    const text = document.querySelector("#assessment-message-template").textContent;
    try {
        await navigator.clipboard.writeText(text);
        document.querySelector("#template-copy-message").textContent =
            "Modelo copiado. Ya puedes pegarlo en un correo o mensaje.";
    } catch (error) {
        document.querySelector("#template-copy-message").textContent =
            `No se pudo copiar automáticamente: ${error.message}. Selecciona y copia el texto del modelo.`;
    }
});
planAssessmentSelect.addEventListener("change", () => {
    loadPlanDraftForAssessment(planAssessmentSelect.value);
    loadPlanFiles();
});
document.querySelector("#generate-plan-button").addEventListener("click", generatePlanPreview);
document.querySelector("#save-plan-button").addEventListener("click", savePlanToAssessment);
document.querySelector("#import-plan-files").addEventListener("click", savePlanFiles);
document.querySelector("#download-plan-svg").addEventListener("click", () => {
    if (!currentPlanDraft.preview?.svg) {
        planMessage.textContent = "Genera primero una vista previa del plano.";
        return;
    }
    const blob = new Blob([currentPlanDraft.preview.svg], { type: "image/svg+xml;charset=utf-8" });
    downloadLocalBlob(blob, "plano-tasacion.svg");
});
document.querySelector("#print-plan-button").addEventListener("click", () => {
    if (!currentPlanDraft.preview?.svg) {
        planMessage.textContent = "Genera primero una vista previa del plano.";
        return;
    }
    const planWindow = window.open("", "_blank");
    if (!planWindow) {
        planMessage.textContent = "Permite ventanas emergentes para imprimir el plano.";
        return;
    }
    planWindow.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Plano de tasación</title><style>body{font:14px Arial;color:#243735;margin:20mm}svg{width:100%;height:auto;max-height:230mm}h1{color:#285d56}@page{size:A4;margin:18mm}</style><h1>Plano esquemático medido</h1>${currentPlanDraft.preview.svg}<p>Revisar las medidas y la distribución antes de utilizar. No es un plano certificado.</p></html>`);
    planWindow.document.close();
    planWindow.focus();
    setTimeout(() => planWindow.print(), 300);
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

analyzeEmailButton.addEventListener("click", analyzeEmailImport);
clearEmailButton.addEventListener("click", () => {
    emailImportText.value = "";
    emailImportProposal = null;
    emailImportMessage.textContent = "";
    emailImportReview.replaceChildren();
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
        authInviteCodeInput.required = true;
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
    authInviteCodeInput.required = false;
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

exportServerDataButton.addEventListener("click", exportServerData);
exportLocalDataButton.addEventListener("click", exportLocalData);
expiredLogoutButton.addEventListener("click", () => endSession("Has cerrado sesión."));

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