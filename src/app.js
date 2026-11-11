const form = document.querySelector("#inspection-form");
const message = document.querySelector("#form-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  message.textContent =
    "La ficha pasó la validación del navegador. Todavía no se ha guardado.";
});
