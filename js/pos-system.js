/**
 * Sistema POS - Embarcaciones de Guatapé
 * Script JavaScript Principal
 * Archivo: pos-system.js
 * Versión: 2.0
 * Fecha: 2025
 */


// ===========================
// INICIALIZACIÓN DEL SISTEMA
// ===========================
document.addEventListener("DOMContentLoaded", function () {
  initializeSystem();
});

function initializeSystem() {
  // Establecer fecha mínima como hoy
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = today;

  // Configurar event listeners
  setupEventListeners();

  // Inicializar estado de botones
  updateButtonStates();
  updateTicketStatus(TICKET_STATES.DRAFT);
  updateTicket();

  console.log("🚢 Sistema POS inicializado correctamente");
}

function setupEventListeners() {
  // Event listeners para campos de entrada
  const inputs = [
    "nombre",
    "documento",
    "telefono",
    "emailCliente",
    "fecha",
    "hora",
  ];
  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", handleFormChange);
      element.addEventListener("change", handleFormChange);
    }
  });
}

function handleFormChange() {
  updateTicket();
  updateButtonStates();

  // Si el ticket ya fue generado y se cambian datos, marcar como borrador
  if (ticketGenerated && !ticketCancelled) {
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    showMessage(
      "warning",
      "Cambios detectados",
      "Debe generar el ticket nuevamente"
    );
  }
}

function resetTicketState() {
  ticketGenerated = false;
  ticketPrinted = false;
  currentTicketCode = null;
  updateButtonStates();
}

// ===========================
// FUNCIONES DE EMBARCACIONES
// ===========================
function selectVessel(element) {
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  element.classList.add("selected");
  selectedVessel = element.dataset.type;
  originalVesselPrice = parseInt(element.dataset.price);

  // Aplicar precio según configuración actual
  const customPriceInput = document.getElementById("precioPersonalizado");
  if (customPriceInput.value) {
    vesselPrice = parseInt(customPriceInput.value);
  } else if (reservationMode) {
    vesselPrice = 10000;
  } else {
    vesselPrice = originalVesselPrice;
  }

  updateTicket();
  updateButtonStates();
  handleFormChange();
}

function toggleReservation() {
  const toggle = document.getElementById("reservationToggle");
  const tipoServicio = document.getElementById("ticket-tipo-servicio");

  reservationMode = !reservationMode;
  toggle.classList.toggle("active");

  if (reservationMode) {
    tipoServicio.textContent = "Con Reserva";
    const customPriceInput = document.getElementById("precioPersonalizado");
    if (!customPriceInput.value && selectedVessel) {
      vesselPrice = 10000;
    }
  } else {
    tipoServicio.textContent = "Nuevo Pasaje";
    const customPriceInput = document.getElementById("precioPersonalizado");
    if (!customPriceInput.value && selectedVessel) {
      vesselPrice = originalVesselPrice;
    }
  }

  updateTicket();
  handleFormChange();
}

// ===========================
// FUNCIONES DE PRECIO PERSONALIZADO
// ===========================
function applyCustomPrice() {
  const customPriceInput = document.getElementById("precioPersonalizado");
  const value = parseInt(customPriceInput.value);

  if (value && value > 0) {
    customPrice = value;
    vesselPrice = value;
    customPriceInput.style.borderColor = "#10b981";
    showMessage(
      "success",
      "Precio aplicado",
      `Precio personalizado: ${value.toLocaleString()}`
    );
  } else {
    resetPrice();
  }

  updateTicket();
  handleFormChange();
}

function resetPrice() {
  const customPriceInput = document.getElementById("precioPersonalizado");
  customPriceInput.value = "";
  customPriceInput.style.borderColor = "";
  customPrice = 0;

  // Restaurar precio según el estado actual
  if (reservationMode) {
    vesselPrice = 10000;
  } else if (selectedVessel) {
    vesselPrice = originalVesselPrice;
  }

  updateTicket();
  handleFormChange();
  showMessage("info", "Precio restaurado", "Precio original aplicado");
}

// ===========================
// FUNCIONES DE CONTADORES
// ===========================
function incrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const maxValue = fieldId === "adultos" ? 20 : 10;

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
    updateTicket();
    handleFormChange();
  }
}

function decrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const minValue = fieldId === "adultos" ? 1 : 0;

  if (currentValue > minValue) {
    input.value = currentValue - 1;
    updateTicket();
    handleFormChange();
  }
}

// ===========================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DEL TICKET
// ===========================
function updateTicket() {
  const nombre = document.getElementById("nombre").value || "-";
  const documento = document.getElementById("documento").value || "-";
  const fecha = document.getElementById("fecha").value || "-";
  const hora = document.getElementById("hora").value || "-";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;

  // Actualizar campos del ticket
  document.getElementById("ticket-nombre").textContent = nombre;
  document.getElementById("ticket-documento").textContent = documento;
  document.getElementById("ticket-fecha").textContent = fecha;
  document.getElementById("ticket-hora").textContent = hora;
  document.getElementById("ticket-embarcacion").textContent = selectedVessel
    ? selectedVessel.charAt(0).toUpperCase() + selectedVessel.slice(1)
    : "-";

  const totalPasajeros = adultos + ninos;
  document.getElementById("ticket-pasajeros").textContent =
    totalPasajeros > 0 ? `${adultos} adultos, ${ninos} niños` : "-";

  // Calcular total
  const total = selectedVessel
    ? adultos * vesselPrice + ninos * vesselPrice * 0.5
    : 0;
  document.getElementById(
    "ticket-total"
  ).textContent = `${total.toLocaleString()}`;

  // Actualizar código si no existe
  if (!currentTicketCode) {
    currentTicketCode =
      "TKT-" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  document.getElementById("ticket-codigo").textContent = currentTicketCode;
}

// ===========================
// FUNCIONES DE BOTONES
// ===========================
function updateButtonStates() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  const generateBtn = document.getElementById("generateBtn");
  const printBtn = document.getElementById("printBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const isFormComplete = nombre && documento && selectedVessel && fecha && hora;

  // Botón Generar
  if (ticketCancelled) {
    generateBtn.classList.add("disabled");
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-ban"></i> Anulado';
  } else if (!isFormComplete) {
    generateBtn.classList.add("disabled");
    generateBtn.disabled = true;
    generateBtn.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i> Complete';
  } else if (ticketGenerated) {
    generateBtn.classList.remove("disabled");
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-redo"></i> Regenerar';
  } else {
    generateBtn.classList.remove("disabled");
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Generar';
  }

  // Botón Imprimir
  if (ticketGenerated && !ticketCancelled) {
    printBtn.classList.remove("disabled");
    printBtn.disabled = false;
    if (ticketPrinted) {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Reimprimir';
    } else {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
    }
  } else {
    printBtn.classList.add("disabled");
    printBtn.disabled = true;
    printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
  }

  // Botón Anular
  if (ticketGenerated && !ticketCancelled) {
    cancelBtn.classList.remove("disabled");
    cancelBtn.disabled = false;
  } else {
    cancelBtn.classList.add("disabled");
    cancelBtn.disabled = true;
  }
}

// ===========================
// FUNCIONES PRINCIPALES DE TICKET
// ===========================
function generateTicket() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!nombre || !documento || !selectedVessel || !fecha || !hora) {
    showMessage("error", "Error", "Complete todos los campos obligatorios");
    return;
  }

  if (ticketCancelled) {
    showMessage("error", "Error", "No se puede generar un ticket anulado");
    return;
  }

  try {
    // Generar timestamp
    const now = new Date();
    document.getElementById(
      "ticket-timestamp"
    ).textContent = `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Generar QR Code
    generateQRCode();

    // Actualizar estados
    ticketGenerated = true;
    ticketPrinted = false;

    // Actualizar interfaz
    updateButtonStates();
    updateTicketStatus(TICKET_STATES.GENERATED);

    showMessage(
      "success",
      "¡Ticket generado!",
      "El ticket se ha creado exitosamente"
    );
  } catch (error) {
    console.error("Error generando ticket:", error);
    showMessage("error", "Error", "No se pudo generar el ticket");
  }
}

async function printTicket() {
  if (!ticketGenerated || ticketCancelled) {
    showMessage(
      "error",
      "Error",
      "Debe generar un ticket válido antes de imprimir"
    );
    return;
  }

  try {
    showMessage("info", "Imprimiendo...", "Enviando ticket a la impresora");

    // Crear ventana de impresión optimizada
    const printContent = generatePrintContent();
    const printWindow = window.open("", "_blank", "width=400,height=700");

    if (!printWindow) {
      showMessage(
        "error",
        "Error",
        "No se pudo abrir la ventana de impresión. Verifique que no estén bloqueadas las ventanas emergentes."
      );
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Configurar impresión automática
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();

        // Manejar después de imprimir
        printWindow.onafterprint = () => {
          printWindow.close();
          ticketPrinted = true;
          updateButtonStates();
          updateTicketStatus(TICKET_STATES.PRINTED);
          showMessage(
            "success",
            "¡Ticket impreso!",
            "Ticket enviado a la impresora exitosamente"
          );
        };

        // Timeout de seguridad
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
            ticketPrinted = true;
            updateButtonStates();
            updateTicketStatus(TICKET_STATES.PRINTED);
            showMessage(
              "info",
              "Impresión completada",
              "Ventana de impresión cerrada"
            );
          }
        }, 30000);
      }, 500);
    };
  } catch (error) {
    console.error("Error imprimiendo ticket:", error);
    showMessage("error", "Error de impresión", "No se pudo imprimir el ticket");
  }
}

function cancelTicket() {
  if (!ticketGenerated) {
    showMessage("error", "Error", "No hay ticket para anular");
    return;
  }

  if (ticketCancelled) {
    showMessage("warning", "Advertencia", "El ticket ya está anulado");
    return;
  }

  // Mostrar confirmación
  if (
    !confirm(
      "¿Está seguro que desea anular este ticket?\n\nEsta acción no se puede deshacer."
    )
  ) {
    return;
  }

  try {
    // Anular ticket
    ticketCancelled = true;

    // Actualizar interfaz
    updateButtonStates();
    updateTicketStatus(TICKET_STATES.CANCELLED);

    // Agregar marca de anulación al timestamp
    const now = new Date();
    document.getElementById(
      "ticket-timestamp"
    ).textContent = `ANULADO: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    showMessage(
      "success",
      "Ticket anulado",
      "El ticket ha sido anulado exitosamente"
    );
  } catch (error) {
    console.error("Error anulando ticket:", error);
    showMessage("error", "Error", "No se pudo anular el ticket");
  }
}

function newTicket() {
  if (
    confirm("¿Desea crear un nuevo ticket?\n\nSe perderán los datos actuales.")
  ) {
    clearTicketForm();
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    showMessage("info", "Nuevo ticket", "Formulario limpio para nuevo ticket");
  }
}

function clearTicketForm() {
  // Limpiar campos del formulario
  document.getElementById("nombre").value = "";
  document.getElementById("documento").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("emailCliente").value = "";
  document.getElementById("adultos").value = "1";
  document.getElementById("ninos").value = "0";
  document.getElementById("hora").value = "";
  document.getElementById("precioPersonalizado").value = "";

  // Resetear toggle de reserva
  const toggle = document.getElementById("reservationToggle");
  toggle.classList.remove("active");
  reservationMode = false;
  document.getElementById("ticket-tipo-servicio").textContent = "Nuevo Pasaje";

  // Restablecer fecha a hoy
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = today;

  // Deseleccionar embarcación
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  // Resetear variables
  selectedVessel = null;
  vesselPrice = 0;
  originalVesselPrice = 0;
  customPrice = 0;
  currentTicketCode = null;
  ticketGenerated = false;
  ticketPrinted = false;
  ticketCancelled = false;

  // Actualizar interfaz
  updateTicket();
  updateButtonStates();

  // Limpiar QR
  document.getElementById("qr-container").innerHTML =
    "Genere el ticket para ver QR";
  document.getElementById("ticket-timestamp").textContent =
    "Vista previa - Ticket no generado";
}

// ===========================
// FUNCIONES DE ESTADO DEL TICKET
// ===========================
function updateTicketStatus(status) {
  const statusElement = document.getElementById("ticketStatus");
  statusElement.textContent = status;

  // Remover clases anteriores
  statusElement.classList.remove("generated", "printed", "cancelled");

  // Agregar clase según estado
  switch (status) {
    case TICKET_STATES.GENERATED:
      statusElement.classList.add("generated");
      break;
    case TICKET_STATES.PRINTED:
      statusElement.classList.add("printed");
      break;
    case TICKET_STATES.CANCELLED:
      statusElement.classList.add("cancelled");
      break;
    default:
      // Estado DRAFT u otros no necesitan clase especial
      break;
  }
}

// ===========================
// FUNCIÓN DE GENERACIÓN DE QR CODE
// ===========================
function generateQRCode() {
  const nombre = document.getElementById("nombre").value || "Sin nombre";
  const documento =
    document.getElementById("documento").value || "Sin documento";
  const fecha = document.getElementById("fecha").value || "Sin fecha";
  const hora = document.getElementById("hora").value || "Sin hora";
  const embarcacion = selectedVessel || "Sin embarcación";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;
  const total = document.getElementById("ticket-total").textContent;

  const qrData = {
    codigo: currentTicketCode,
    pasajero: nombre,
    documento: documento,
    fecha: fecha,
    hora: hora,
    embarcacion: embarcacion,
    adultos: adultos,
    ninos: ninos,
    total: total,
    timestamp: new Date().toISOString(),
    estado: ticketCancelled ? "ANULADO" : "ACTIVO",
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    qrString
  )}`;

  const qrContainer = document.getElementById("qr-container");
  qrContainer.innerHTML = `
        <img src="${qrUrl}" alt="QR Code" style="width: 64px; height: 64px; border-radius: 6px;" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display:none; font-size: 0.7rem; color: #64748b;">Error al generar QR</div>
    `;
}

// ===========================
// FUNCIÓN DE CONTENIDO PARA IMPRESIÓN
// ===========================
function generatePrintContent() {
  const nombre = document.getElementById("ticket-nombre").textContent;
  const documento = document.getElementById("ticket-documento").textContent;
  const fecha = document.getElementById("ticket-fecha").textContent;
  const hora = document.getElementById("ticket-hora").textContent;
  const embarcacion = document.getElementById("ticket-embarcacion").textContent;
  const pasajeros = document.getElementById("ticket-pasajeros").textContent;
  const total = document.getElementById("ticket-total").textContent;
  const codigo = document.getElementById("ticket-codigo").textContent;
  const tipoServicio = document.getElementById(
    "ticket-tipo-servicio"
  ).textContent;
  const timestamp = document.getElementById("ticket-timestamp").textContent;

  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket - ${codigo}</title>
          <style>
            @page { margin: 5mm; size: 80mm auto; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 11px; 
              line-height: 1.2;
              background: white;
              color: black;
              padding: 3mm;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000; 
              padding-bottom: 3mm; 
              margin-bottom: 3mm; 
            }
            .title { 
              font-size: 13px; 
              font-weight: bold; 
              margin-bottom: 1mm; 
            }
            .subtitle { 
              font-size: 9px; 
            }
            .field { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 1mm; 
              padding-bottom: 1mm;
              border-bottom: 1px dotted #999;
            }
            .label { 
              font-weight: bold; 
              width: 45%;
            }
            .value { 
              width: 55%; 
              text-align: right; 
            }
            .total-section { 
              margin: 3mm 0; 
              padding: 3mm; 
              border: 2px solid #000; 
              text-align: center; 
              background: #f5f5f5;
            }
            .total-label { 
              font-size: 11px; 
              font-weight: bold; 
            }
            .total-amount { 
              font-size: 16px; 
              font-weight: bold; 
              margin-top: 1mm; 
            }
            .footer { 
              margin-top: 3mm; 
              padding-top: 3mm; 
              border-top: 1px dashed #000; 
              text-align: center; 
              font-size: 8px; 
            }
            .status {
              text-align: center;
              font-weight: bold;
              padding: 2mm;
              margin: 2mm 0;
              border: 1px solid #000;
              ${
                ticketCancelled
                  ? "background: #ffebee; color: #c62828;"
                  : "background: #e8f5e8; color: #2e7d32;"
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">⚓ EMBARCACIONES DE GUATAPÉ</div>
            <div class="subtitle">Nautica Guatapé S.A.S</div>
            <div class="subtitle">Embalse de Guatapé</div>
          </div>
          
          ${
            ticketCancelled
              ? '<div class="status">*** TICKET ANULADO ***</div>'
              : '<div class="status">TICKET VÁLIDO</div>'
          }
          
          <div class="field">
            <span class="label">Código:</span>
            <span class="value">${codigo}</span>
          </div>
          
          <div class="field">
            <span class="label">Tipo:</span>
            <span class="value">${tipoServicio}</span>
          </div>
          
          <div class="field">
            <span class="label">Pasajero:</span>
            <span class="value">${nombre}</span>
          </div>
          
          <div class="field">
            <span class="label">Documento:</span>
            <span class="value">${documento}</span>
          </div>
          
          <div class="field">
            <span class="label">Fecha:</span>
            <span class="value">${fecha}</span>
          </div>
          
          <div class="field">
            <span class="label">Hora:</span>
            <span class="value">${hora}</span>
          </div>
          
          <div class="field">
            <span class="label">Embarcación:</span>
            <span class="value">${embarcacion}</span>
          </div>
          
          <div class="field">
            <span class="label">Pasajeros:</span>
            <span class="value">${pasajeros}</span>
          </div>
          
          ${
            !ticketCancelled
              ? `
          <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">${total}</div>
          </div>
          `
              : `
          <div class="total-section" style="background: #ffebee;">
            <div class="total-label">TICKET ANULADO</div>
            <div class="total-amount" style="color: #c62828;">SIN VALOR</div>
          </div>
          `
          }
          
          <div class="footer">
            <div>${
              ticketCancelled
                ? "*** TICKET ANULADO ***"
                : "CONSERVE ESTE TICKET"
            }</div>
            <div>Embalse del Guatapé - Antioquia</div>
            <div>${timestamp}</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.close();
              }, 30000);
            };
          </script>
        </body>
        </html>
    `;
}

// ===========================
// SISTEMA DE NOTIFICACIONES INTEGRADO
// ===========================

function showMessage(type, title, message, duration = 3000) {
  // Prioridad 1: Sistema de alertas avanzado
  if (typeof window.alertSystem !== "undefined" && window.alertSystem) {
    window.alertSystem[type](title, message, duration);
    return;
  }

  // Prioridad 2: Funciones globales de alertas
  if (
    typeof window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] ===
    "function"
  ) {
    window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`](
      title,
      message,
      duration
    );
    return;
  }

  // Prioridad 3: Notificaciones básicas integradas
  showBasicNotification(type, title, message, duration);
}

function showBasicNotification(type, title, message, duration = 3000) {
  // Crear una notificación temporal elegante
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : type === "warning"
            ? "#f59e0b"
            : "#06b6d4"
        };
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 13px;
        max-width: 300px;
        animation: slideInRight 0.4s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;

  const iconMap = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>',
  };

  notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 16px;">${iconMap[type] || iconMap.info}</div>
            <div>
                <div style="font-weight: bold; margin-bottom: 2px;">${title}</div>
                <div style="opacity: 0.9; font-size: 12px; line-height: 1.3;">${message}</div>
            </div>
        </div>
    `;

  // Agregar animación CSS si no existe
  if (!document.head.querySelector("[data-notification-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-notification-styles", "");
    style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after specified duration
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.4s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, duration);

  // Click to dismiss
  notification.addEventListener("click", () => {
    notification.style.animation = "slideOutRight 0.3s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
}

null;
let vesselPrice = 0;
let originalVesselPrice = 0;
let customPrice = 0;
let ticketGenerated = false;
let ticketPrinted = false;
let ticketCancelled = false;
let currentTicketCode = null;
let reservationMode = false;

// Estados del ticket
const TICKET_STATES = {
  DRAFT: "BORRADOR",
  GENERATED: "GENERADO",
  PRINTED: "IMPRESO",
  CANCELLED: "ANULADO",
};

// ===========================
// INICIALIZACIÓN DEL SISTEMA
// ===========================
document.addEventListener("DOMContentLoaded", function () {
  initializeSystem();
});

function initializeSystem() {
  // Establecer fecha mínima como hoy
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = today;

  // Configurar event listeners
  setupEventListeners();

  // Inicializar estado de botones
  updateButtonStates();
  updateTicketStatus(TICKET_STATES.DRAFT);
  updateTicket();

  console.log("🚢 Sistema POS inicializado correctamente");
}

function setupEventListeners() {
  // Event listeners para campos de entrada
  const inputs = [
    "nombre",
    "documento",
    "telefono",
    "emailCliente",
    "fecha",
    "hora",
  ];
  inputs.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("input", handleFormChange);
      element.addEventListener("change", handleFormChange);
    }
  });
}

function handleFormChange() {
  updateTicket();
  updateButtonStates();

  // Si el ticket ya fue generado y se cambian datos, marcar como borrador
  if (ticketGenerated && !ticketCancelled) {
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    showMessage(
      "warning",
      "Cambios detectados",
      "Debe generar el ticket nuevamente"
    );
  }
}

function resetTicketState() {
  ticketGenerated = false;
  ticketPrinted = false;
  currentTicketCode = null;
  updateButtonStates();
}

// ===========================
// FUNCIONES DE EMBARCACIONES
// ===========================
function selectVessel(element) {
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  element.classList.add("selected");
  selectedVessel = element.dataset.type;
  originalVesselPrice = parseInt(element.dataset.price);

  // Aplicar precio según configuración actual
  const customPriceInput = document.getElementById("precioPersonalizado");
  if (customPriceInput.value) {
    vesselPrice = parseInt(customPriceInput.value);
  } else if (reservationMode) {
    vesselPrice = 10000;
  } else {
    vesselPrice = originalVesselPrice;
  }

  updateTicket();
  updateButtonStates();
  handleFormChange();
}

function toggleReservation() {
  const toggle = document.getElementById("reservationToggle");
  const tipoServicio = document.getElementById("ticket-tipo-servicio");

  reservationMode = !reservationMode;
  toggle.classList.toggle("active");

  if (reservationMode) {
    tipoServicio.textContent = "Con Reserva";
    const customPriceInput = document.getElementById("precioPersonalizado");
    if (!customPriceInput.value && selectedVessel) {
      vesselPrice = 10000;
    }
  } else {
    tipoServicio.textContent = "Nuevo Pasaje";
    const customPriceInput = document.getElementById("precioPersonalizado");
    if (!customPriceInput.value && selectedVessel) {
      vesselPrice = originalVesselPrice;
    }
  }

  updateTicket();
  handleFormChange();
}

// ===========================
// FUNCIONES DE PRECIO PERSONALIZADO
// ===========================
function applyCustomPrice() {
  const customPriceInput = document.getElementById("precioPersonalizado");
  const value = parseInt(customPriceInput.value);

  if (value && value > 0) {
    customPrice = value;
    vesselPrice = value;
    customPriceInput.style.borderColor = "#10b981";
    showMessage(
      "success",
      "Precio aplicado",
      `Precio personalizado: ${value.toLocaleString()}`
    );
  } else {
    resetPrice();
  }

  updateTicket();
  handleFormChange();
}

function resetPrice() {
  const customPriceInput = document.getElementById("precioPersonalizado");
  customPriceInput.value = "";
  customPriceInput.style.borderColor = "";
  customPrice = 0;

  // Restaurar precio según el estado actual
  if (reservationMode) {
    vesselPrice = 10000;
  } else if (selectedVessel) {
    vesselPrice = originalVesselPrice;
  }

  updateTicket();
  handleFormChange();
  showMessage("info", "Precio restaurado", "Precio original aplicado");
}

// ===========================
// FUNCIONES DE CONTADORES
// ===========================
function incrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const maxValue = fieldId === "adultos" ? 20 : 10;

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
    updateTicket();
    handleFormChange();
  }
}

function decrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const minValue = fieldId === "adultos" ? 1 : 0;

  if (currentValue > minValue) {
    input.value = currentValue - 1;
    updateTicket();
    handleFormChange();
  }
}

// ===========================
// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DEL TICKET
// ===========================
function updateTicket() {
  const nombre = document.getElementById("nombre").value || "-";
  const documento = document.getElementById("documento").value || "-";
  const fecha = document.getElementById("fecha").value || "-";
  const hora = document.getElementById("hora").value || "-";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;

  // Actualizar campos del ticket
  document.getElementById("ticket-nombre").textContent = nombre;
  document.getElementById("ticket-documento").textContent = documento;
  document.getElementById("ticket-fecha").textContent = fecha;
  document.getElementById("ticket-hora").textContent = hora;
  document.getElementById("ticket-embarcacion").textContent = selectedVessel
    ? selectedVessel.charAt(0).toUpperCase() + selectedVessel.slice(1)
    : "-";

  const totalPasajeros = adultos + ninos;
  document.getElementById("ticket-pasajeros").textContent =
    totalPasajeros > 0 ? `${adultos} adultos, ${ninos} niños` : "-";

  // Calcular total
  const total = selectedVessel
    ? adultos * vesselPrice + ninos * vesselPrice * 0.5
    : 0;
  document.getElementById(
    "ticket-total"
  ).textContent = `$${total.toLocaleString()}`;

  // Actualizar código si no existe
  if (!currentTicketCode) {
    currentTicketCode =
      "TKT-" +
      Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  document.getElementById("ticket-codigo").textContent = currentTicketCode;
}

// ===========================
// FUNCIONES DE BOTONES
// ===========================
function updateButtonStates() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  const generateBtn = document.getElementById("generateBtn");
  const printBtn = document.getElementById("printBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const isFormComplete = nombre && documento && selectedVessel && fecha && hora;

  // Botón Generar
  if (ticketCancelled) {
    generateBtn.classList.add("disabled");
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-ban"></i> Anulado';
  } else if (!isFormComplete) {
    generateBtn.classList.add("disabled");
    generateBtn.disabled = true;
    generateBtn.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i> Complete';
  } else if (ticketGenerated) {
    generateBtn.classList.remove("disabled");
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-redo"></i> Regenerar';
  } else {
    generateBtn.classList.remove("disabled");
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Generar';
  }

  // Botón Imprimir
  if (ticketGenerated && !ticketCancelled) {
    printBtn.classList.remove("disabled");
    printBtn.disabled = false;
    if (ticketPrinted) {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Reimprimir';
    } else {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
    }
  } else {
    printBtn.classList.add("disabled");
    printBtn.disabled = true;
    printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
  }

  // Botón Anular
  if (ticketGenerated && !ticketCancelled) {
    cancelBtn.classList.remove("disabled");
    cancelBtn.disabled = false;
  } else {
    cancelBtn.classList.add("disabled");
    cancelBtn.disabled = true;
  }
}

// ===========================
// FUNCIONES PRINCIPALES DE TICKET
// ===========================
function generateTicket() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  if (!nombre || !documento || !selectedVessel || !fecha || !hora) {
    showMessage("error", "Error", "Complete todos los campos obligatorios");
    return;
  }

  if (ticketCancelled) {
    showMessage("error", "Error", "No se puede generar un ticket anulado");
    return;
  }

  try {
    // Generar timestamp
    const now = new Date();
    document.getElementById(
      "ticket-timestamp"
    ).textContent = `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    // Generar QR Code
    generateQRCode();

    // Actualizar estados
    ticketGenerated = true;
    ticketPrinted = false;

    // Actualizar interfaz
    updateButtonStates();
    updateTicketStatus(TICKET_STATES.GENERATED);

    showMessage(
      "success",
      "¡Ticket generado!",
      "El ticket se ha creado exitosamente"
    );
  } catch (error) {
    console.error("Error generando ticket:", error);
    showMessage("error", "Error", "No se pudo generar el ticket");
  }
}

async function printTicket() {
  if (!ticketGenerated || ticketCancelled) {
    showMessage(
      "error",
      "Error",
      "Debe generar un ticket válido antes de imprimir"
    );
    return;
  }

  try {
    showMessage("info", "Imprimiendo...", "Enviando ticket a la impresora");

    // Crear ventana de impresión optimizada
    const printContent = generatePrintContent();
    const printWindow = window.open("", "_blank", "width=400,height=700");

    if (!printWindow) {
      showMessage(
        "error",
        "Error",
        "No se pudo abrir la ventana de impresión. Verifique que no estén bloqueadas las ventanas emergentes."
      );
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Configurar impresión automática
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();

        // Manejar después de imprimir
        printWindow.onafterprint = () => {
          printWindow.close();
          ticketPrinted = true;
          updateButtonStates();
          updateTicketStatus(TICKET_STATES.PRINTED);
          showMessage(
            "success",
            "¡Ticket impreso!",
            "Ticket enviado a la impresora exitosamente"
          );
        };

        // Timeout de seguridad
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close();
            ticketPrinted = true;
            updateButtonStates();
            updateTicketStatus(TICKET_STATES.PRINTED);
            showMessage(
              "info",
              "Impresión completada",
              "Ventana de impresión cerrada"
            );
          }
        }, 30000);
      }, 500);
    };
  } catch (error) {
    console.error("Error imprimiendo ticket:", error);
    showMessage("error", "Error de impresión", "No se pudo imprimir el ticket");
  }
}

function cancelTicket() {
  if (!ticketGenerated) {
    showMessage("error", "Error", "No hay ticket para anular");
    return;
  }

  if (ticketCancelled) {
    showMessage("warning", "Advertencia", "El ticket ya está anulado");
    return;
  }

  // Mostrar confirmación
  if (
    !confirm(
      "¿Está seguro que desea anular este ticket?\n\nEsta acción no se puede deshacer."
    )
  ) {
    return;
  }

  try {
    // Anular ticket
    ticketCancelled = true;

    // Actualizar interfaz
    updateButtonStates();
    updateTicketStatus(TICKET_STATES.CANCELLED);

    // Agregar marca de anulación al timestamp
    const now = new Date();
    document.getElementById(
      "ticket-timestamp"
    ).textContent = `ANULADO: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    showMessage(
      "success",
      "Ticket anulado",
      "El ticket ha sido anulado exitosamente"
    );
  } catch (error) {
    console.error("Error anulando ticket:", error);
    showMessage("error", "Error", "No se pudo anular el ticket");
  }
}

function newTicket() {
  if (
    confirm("¿Desea crear un nuevo ticket?\n\nSe perderán los datos actuales.")
  ) {
    clearTicketForm();
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    showMessage("info", "Nuevo ticket", "Formulario limpio para nuevo ticket");
  }
}

function clearTicketForm() {
  // Limpiar campos del formulario
  document.getElementById("nombre").value = "";
  document.getElementById("documento").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("emailCliente").value = "";
  document.getElementById("adultos").value = "1";
  document.getElementById("ninos").value = "0";
  document.getElementById("hora").value = "";
  document.getElementById("precioPersonalizado").value = "";

  // Resetear toggle de reserva
  const toggle = document.getElementById("reservationToggle");
  toggle.classList.remove("active");
  reservationMode = false;
  document.getElementById("ticket-tipo-servicio").textContent = "Nuevo Pasaje";

  // Restablecer fecha a hoy
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = today;

  // Deseleccionar embarcación
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  // Resetear variables
  selectedVessel = null;
  vesselPrice = 0;
  originalVesselPrice = 0;
  customPrice = 0;
  currentTicketCode = null;
  ticketGenerated = false;
  ticketPrinted = false;
  ticketCancelled = false;

  // Actualizar interfaz
  updateTicket();
  updateButtonStates();

  // Limpiar QR
  document.getElementById("qr-container").innerHTML =
    "Genere el ticket para ver QR";
  document.getElementById("ticket-timestamp").textContent =
    "Vista previa - Ticket no generado";
}

// ===========================
// FUNCIONES DE ESTADO DEL TICKET
// ===========================
function updateTicketStatus(status) {
  const statusElement = document.getElementById("ticketStatus");
  statusElement.textContent = status;

  // Remover clases anteriores
  statusElement.classList.remove("generated", "printed", "cancelled");

  // Agregar clase según estado
  switch (status) {
    case TICKET_STATES.GENERATED:
      statusElement.classList.add("generated");
      break;
    case TICKET_STATES.PRINTED:
      statusElement.classList.add("printed");
      break;
    case TICKET_STATES.CANCELLED:
      statusElement.classList.add("cancelled");
      break;
    default:
      // Estado DRAFT u otros no necesitan clase especial
      break;
  }
}

// ===========================
// FUNCIÓN DE GENERACIÓN DE QR CODE
// ===========================
function generateQRCode() {
  const nombre = document.getElementById("nombre").value || "Sin nombre";
  const documento =
    document.getElementById("documento").value || "Sin documento";
  const fecha = document.getElementById("fecha").value || "Sin fecha";
  const hora = document.getElementById("hora").value || "Sin hora";
  const embarcacion = selectedVessel || "Sin embarcación";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;
  const total = document.getElementById("ticket-total").textContent;

  const qrData = {
    codigo: currentTicketCode,
    pasajero: nombre,
    documento: documento,
    fecha: fecha,
    hora: hora,
    embarcacion: embarcacion,
    adultos: adultos,
    ninos: ninos,
    total: total,
    timestamp: new Date().toISOString(),
    estado: ticketCancelled ? "ANULADO" : "ACTIVO",
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
    qrString
  )}`;

  const qrContainer = document.getElementById("qr-container");
  qrContainer.innerHTML = `
        <img src="${qrUrl}" alt="QR Code" style="width: 64px; height: 64px; border-radius: 6px;" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <div style="display:none; font-size: 0.7rem; color: #64748b;">Error al generar QR</div>
    `;
}

// ===========================
// FUNCIÓN DE CONTENIDO PARA IMPRESIÓN
// ===========================
function generatePrintContent() {
  const nombre = document.getElementById("ticket-nombre").textContent;
  const documento = document.getElementById("ticket-documento").textContent;
  const fecha = document.getElementById("ticket-fecha").textContent;
  const hora = document.getElementById("ticket-hora").textContent;
  const embarcacion = document.getElementById("ticket-embarcacion").textContent;
  const pasajeros = document.getElementById("ticket-pasajeros").textContent;
  const total = document.getElementById("ticket-total").textContent;
  const codigo = document.getElementById("ticket-codigo").textContent;
  const tipoServicio = document.getElementById(
    "ticket-tipo-servicio"
  ).textContent;
  const timestamp = document.getElementById("ticket-timestamp").textContent;

  return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket - ${codigo}</title>
          <style>
            @page { margin: 5mm; size: 80mm auto; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 11px; 
              line-height: 1.2;
              background: white;
              color: black;
              padding: 3mm;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000; 
              padding-bottom: 3mm; 
              margin-bottom: 3mm; 
            }
            .title { 
              font-size: 13px; 
              font-weight: bold; 
              margin-bottom: 1mm; 
            }
            .subtitle { 
              font-size: 9px; 
            }
            .field { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 1mm; 
              padding-bottom: 1mm;
              border-bottom: 1px dotted #999;
            }
            .label { 
              font-weight: bold; 
              width: 45%;
            }
            .value { 
              width: 55%; 
              text-align: right; 
            }
            .total-section { 
              margin: 3mm 0; 
              padding: 3mm; 
              border: 2px solid #000; 
              text-align: center; 
              background: #f5f5f5;
            }
            .total-label { 
              font-size: 11px; 
              font-weight: bold; 
            }
            .total-amount { 
              font-size: 16px; 
              font-weight: bold; 
              margin-top: 1mm; 
            }
            .footer { 
              margin-top: 3mm; 
              padding-top: 3mm; 
              border-top: 1px dashed #000; 
              text-align: center; 
              font-size: 8px; 
            }
            .status {
              text-align: center;
              font-weight: bold;
              padding: 2mm;
              margin: 2mm 0;
              border: 1px solid #000;
              ${
                ticketCancelled
                  ? "background: #ffebee; color: #c62828;"
                  : "background: #e8f5e8; color: #2e7d32;"
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">⚓ EMBARCACIONES DE GUATAPÉ</div>
            <div class="subtitle">Nautica Guatapé S.A.S</div>
            <div class="subtitle">Embalse de Guatapé</div>
          </div>
          
          ${
            ticketCancelled
              ? '<div class="status">*** TICKET ANULADO ***</div>'
              : '<div class="status">TICKET VÁLIDO</div>'
          }
          
          <div class="field">
            <span class="label">Código:</span>
            <span class="value">${codigo}</span>
          </div>
          
          <div class="field">
            <span class="label">Tipo:</span>
            <span class="value">${tipoServicio}</span>
          </div>
          
          <div class="field">
            <span class="label">Pasajero:</span>
            <span class="value">${nombre}</span>
          </div>
          
          <div class="field">
            <span class="label">Documento:</span>
            <span class="value">${documento}</span>
          </div>
          
          <div class="field">
            <span class="label">Fecha:</span>
            <span class="value">${fecha}</span>
          </div>
          
          <div class="field">
            <span class="label">Hora:</span>
            <span class="value">${hora}</span>
          </div>
          
          <div class="field">
            <span class="label">Embarcación:</span>
            <span class="value">${embarcacion}</span>
          </div>
          
          <div class="field">
            <span class="label">Pasajeros:</span>
            <span class="value">${pasajeros}</span>
          </div>
          
          ${
            !ticketCancelled
              ? `
          <div class="total-section">
            <div class="total-label">TOTAL A PAGAR</div>
            <div class="total-amount">${total}</div>
          </div>
          `
              : `
          <div class="total-section" style="background: #ffebee;">
            <div class="total-label">TICKET ANULADO</div>
            <div class="total-amount" style="color: #c62828;">SIN VALOR</div>
          </div>
          `
          }
          
          <div class="footer">
            <div>${
              ticketCancelled
                ? "*** TICKET ANULADO ***"
                : "CONSERVE ESTE TICKET"
            }</div>
            <div>Embalse del Guatapé - Antioquia</div>
            <div>${timestamp}</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.close();
              }, 30000);
            };
          </script>
        </body>
        </html>
    `;
}

// ===========================
// SISTEMA DE NOTIFICACIONES INTEGRADO
// ===========================

function showMessage(type, title, message, duration = 3000) {
  // Prioridad 1: Sistema de alertas avanzado
  if (typeof window.alertSystem !== "undefined" && window.alertSystem) {
    window.alertSystem[type](title, message, duration);
    return;
  }

  // Prioridad 2: Funciones globales de alertas
  if (
    typeof window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] ===
    "function"
  ) {
    window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`](
      title,
      message,
      duration
    );
    return;
  }

  // Prioridad 3: Notificaciones básicas integradas
  showBasicNotification(type, title, message, duration);
}

function showBasicNotification(type, title, message, duration = 3000) {
  // Crear una notificación temporal elegante
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : type === "warning"
            ? "#f59e0b"
            : "#06b6d4"
        };
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 15px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        font-size: 13px;
        max-width: 300px;
        animation: slideInRight 0.4s ease-out;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;

  const iconMap = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>',
  };

  notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 16px;">${iconMap[type] || iconMap.info}</div>
            <div>
                <div style="font-weight: bold; margin-bottom: 2px;">${title}</div>
                <div style="opacity: 0.9; font-size: 12px; line-height: 1.3;">${message}</div>
            </div>
        </div>
    `;

  // Agregar animación CSS si no existe
  if (!document.head.querySelector("[data-notification-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-notification-styles", "");
    style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after specified duration
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.4s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 400);
  }, duration);

  // Click to dismiss
  notification.addEventListener("click", () => {
    notification.style.animation = "slideOutRight 0.3s ease-in forwards";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  });
}

// Funciones de conveniencia para compatibilidad
function showSuccess(title, message, duration) {
  showMessage("success", title, message, duration);
}

function showError(title, message, duration) {
  showMessage("error", title, message, duration);
}

function showWarning(title, message, duration) {
  showMessage("warning", title, message, duration);
}

function showInfo(title, message, duration) {
  showMessage("info", title, message, duration);
}

// ===========================
// FUNCIONES DE UTILIDAD
// ===========================
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// ===========================
// FUNCIONES DE VALIDACIÓN
// ===========================
function validateForm() {
  const nombre = document.getElementById("nombre").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  const errors = [];

  if (!nombre) errors.push("Nombre es requerido");
  if (!documento) errors.push("Documento es requerido");
  if (!selectedVessel) errors.push("Debe seleccionar una embarcación");
  if (!fecha) errors.push("Fecha es requerida");
  if (!hora) errors.push("Hora es requerida");

  const today = new Date().toISOString().split("T")[0];
  if (fecha < today) errors.push("La fecha no puede ser anterior a hoy");

  if (documento.length < 6)
    errors.push("Documento debe tener al menos 6 caracteres");

  const email = document.getElementById("emailCliente").value;
  if (email && !validateEmail(email)) errors.push("Email no válido");

  const phone = document.getElementById("telefono").value;
  if (phone && !validatePhone(phone)) errors.push("Teléfono no válido");

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// ===========================
// ATAJOS DE TECLADO
// ===========================
document.addEventListener("keydown", function (event) {
  // Ctrl/Cmd + G = Generar ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "g") {
    event.preventDefault();
    if (!document.getElementById("generateBtn").disabled) {
      generateTicket();
    }
  }

  // Ctrl/Cmd + P = Imprimir ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "p") {
    event.preventDefault();
    if (!document.getElementById("printBtn").disabled) {
      printTicket();
    }
  }

  // Ctrl/Cmd + N = Nuevo ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault();
    newTicket();
  }

  // Esc = Cancelar/Nuevo ticket
  if (event.key === "Escape") {
    if (ticketGenerated) {
      newTicket();
    }
  }
});

// ===========================
// INICIALIZACIÓN FINAL
// ===========================

// Log de inicialización
console.log("🎫 Sistema POS de Embarcaciones de Guatapé cargado exitosamente");
console.log("📋 Atajos de teclado disponibles:");
console.log("   - Ctrl/Cmd + G: Generar ticket");
console.log("   - Ctrl/Cmd + P: Imprimir ticket");
console.log("   - Ctrl/Cmd + N: Nuevo ticket");
console.log("   - Esc: Cancelar operación actual");

// ===========================
// INTEGRACIÓN CON MÓDULOS EXTERNOS
// ===========================

// Cargar módulos adicionales de forma asíncrona
function loadExternalModules() {
  // Verificar y cargar módulos si están disponibles
  setTimeout(() => {
    if (typeof window.alertSystem !== "undefined") {
      console.log("✅ Sistema de alertas avanzado cargado");
    }

    if (typeof window.modalSystem !== "undefined") {
      console.log("✅ Sistema de modales cargado");
    }

    if (typeof window.pdfGenerator !== "undefined") {
      console.log("✅ Generador de PDF cargado");
    }

    if (typeof window.thermalPrinter !== "undefined") {
      console.log("✅ Impresora térmica cargada");
    }

    if (typeof window.authManager !== "undefined") {
      console.log("✅ Sistema de autenticación cargado");
    }
  }, 1000);
}

// Llamar carga de módulos después de la inicialización
setTimeout(loadExternalModules, 500);

// ===========================
// FUNCIONES DE COMPATIBILIDAD CON MÓDULOS
// ===========================

// Función para integrar con el sistema de PDF si está disponible
window.generatePDF = function (format = "thermal") {
  if (typeof window.generateTicketPDF === "function") {
    return window.generateTicketPDF(format);
  } else {
    showMessage(
      "warning",
      "PDF no disponible",
      "El módulo de PDF no está cargado"
    );
    return false;
  }
};

// Función para integrar con la impresora térmica si está disponible
window.printThermal = function () {
  if (typeof window.printThermalTicket === "function") {
    return window.printThermalTicket();
  } else {
    // Usar impresión estándar como fallback
    return printTicket();
  }
};

// Función para mostrar modal de bienvenida si está disponible
window.showWelcome = function (userEmail) {
  if (typeof window.showWelcomeModal === "function") {
    window.showWelcomeModal(userEmail);
  } else {
    showMessage("success", "¡Bienvenido!", `Sesión iniciada: ${userEmail}`);
  }
};

// ===========================
// EXPOSICIÓN GLOBAL DE FUNCIONES
// ===========================

// Exponer funciones principales globalmente para compatibilidad
window.posSystem = {
  // Funciones principales
  generateTicket,
  printTicket,
  cancelTicket,
  newTicket,
  updateTicket,

  // Funciones de embarcaciones
  selectVessel,
  toggleReservation,

  // Funciones de precios
  applyCustomPrice,
  resetPrice,

  // Funciones de contadores
  incrementCounter,
  decrementCounter,

  // Utilidades
  showMessage,
  validateForm,
  formatCurrency,
  validateEmail,
  validatePhone,

  // Obtener datos del ticket
  getTicketData: () => ({
    codigo: currentTicketCode,
    nombre: document.getElementById("nombre").value,
    documento: document.getElementById("documento").value,
    telefono: document.getElementById("telefono").value,
    email: document.getElementById("emailCliente").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    embarcacion: selectedVessel,
    adultos: parseInt(document.getElementById("adultos").value),
    ninos: parseInt(document.getElementById("ninos").value),
    total: document.getElementById("ticket-total").textContent,
    estado: ticketCancelled
      ? "ANULADO"
      : ticketGenerated
      ? "GENERADO"
      : "BORRADOR",
    reserva: reservationMode,
    precioPersonalizado: customPrice > 0,
  }),

  // Obtener estado del sistema
  getSystemStatus: () => ({
    ticketGenerated,
    ticketPrinted,
    ticketCancelled,
    reservationMode,
    selectedVessel,
    vesselPrice,
    customPrice,
  }),

  // Funciones de estado
  resetSystem: () => {
    clearTicketForm();
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
  },

  // Estados disponibles
  TICKET_STATES,
};

// ===========================
// FUNCIONES ADICIONALES DE UTILIDAD
// ===========================

// Función para exportar datos del ticket en formato JSON
window.exportTicketData = function () {
  const ticketData = window.posSystem.getTicketData();
  const systemStatus = window.posSystem.getSystemStatus();

  const exportData = {
    ticket: ticketData,
    system: systemStatus,
    timestamp: new Date().toISOString(),
    version: "2.0",
  };

  return JSON.stringify(exportData, null, 2);
};

// Función para generar reporte simple
window.generateSimpleReport = function () {
  const data = window.posSystem.getTicketData();

  if (!data.codigo || data.codigo === null) {
    showMessage("warning", "Sin datos", "No hay ticket para generar reporte");
    return null;
  }

  const report = {
    fecha_reporte: new Date().toISOString(),
    ticket_codigo: data.codigo,
    pasajero: data.nombre,
    documento: data.documento,
    embarcacion: data.embarcacion,
    fecha_viaje: data.fecha,
    hora_viaje: data.hora,
    pasajeros_total: data.adultos + data.ninos,
    total_pago: data.total,
    estado: data.estado,
    tipo_servicio: data.reserva ? "Con Reserva" : "Nuevo Pasaje",
  };

  console.log("📊 Reporte generado:", report);
  return report;
};

// Función para limpiar el sistema completamente
window.resetCompleteSystem = function () {
  if (
    confirm(
      "¿Está seguro que desea resetear completamente el sistema?\n\nEsto limpiará todos los datos y estados."
    )
  ) {
    window.posSystem.resetSystem();

    // Limpiar variables globales adicionales
    selectedVessel = null;
    vesselPrice = 0;
    originalVesselPrice = 0;
    customPrice = 0;
    ticketGenerated = false;
    ticketPrinted = false;
    ticketCancelled = false;
    currentTicketCode = null;
    reservationMode = false;

    showMessage(
      "success",
      "Sistema reseteado",
      "Todos los datos han sido limpiados"
    );
    console.log("🔄 Sistema completamente reseteado");
  }
};

// ===========================
// FINALIZACIÓN E INFORMACIÓN DEL SISTEMA
// ===========================

console.log("🔧 Sistema POS completamente inicializado y listo para usar");
console.log("📦 Funciones disponibles en window.posSystem:");
console.log(
  "   - generateTicket(), printTicket(), cancelTicket(), newTicket()"
);
console.log(
  "   - selectVessel(), toggleReservation(), applyCustomPrice(), resetPrice()"
);
console.log(
  "   - incrementCounter(), decrementCounter(), showMessage(), validateForm()"
);
console.log("   - getTicketData(), getSystemStatus(), resetSystem()");
console.log("🌐 Funciones globales adicionales:");
console.log(
  "   - exportTicketData(), generateSimpleReport(), resetCompleteSystem()"
);
console.log("   - generatePDF(), printThermal(), showWelcome()");

// Marcar el script como completamente cargado
window.posSystemReady = true;
window.posSystemVersion = "2.0";
window.posSystemLoadTime = new Date().toISOString();

// Evento personalizado para notificar que el sistema está listo
if (typeof window.CustomEvent === "function") {
  const readyEvent = new CustomEvent("posSystemReady", {
    detail: {
      version: window.posSystemVersion,
      loadTime: window.posSystemLoadTime,
      functions: Object.keys(window.posSystem),
    },
  });
  window.dispatchEvent(readyEvent);
}

/**
 * ===========================
 * DOCUMENTACIÓN DE USO
 * ===========================
 *
 * Para usar este script en tu HTML:
 *
 * 1. Incluir el script:
 *    <script src="pos-system.js"></script>
 *
 * 2. Usar las funciones:
 *    window.posSystem.generateTicket();
 *    window.posSystem.getTicketData();
 *
 * 3. Escuchar el evento de carga:
 *    window.addEventListener('posSystemReady', function(event) {
 *        console.log('Sistema POS listo:', event.detail);
 *    });
 *
 * 4. Integrar con módulos adicionales:
 *    - alerts.js: Sistema de alertas avanzado
 *    - modal.js: Modales de bienvenida/despedida
 *    - pdf-generator.js: Generación de PDF
 *    - thermal-printer.js: Impresión térmica
 *    - firebase-auth.js: Autenticación
 *
 * ===========================
 */

// ===========================
// FUNCIONES DE UTILIDAD
// ===========================
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

// ===========================
// FUNCIONES DE VALIDACIÓN
// ===========================
function validateForm() {
  const nombre = document.getElementById("nombre").value.trim();
  const documento = document.getElementById("documento").value.trim();
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  const errors = [];

  if (!nombre) errors.push("Nombre es requerido");
  if (!documento) errors.push("Documento es requerido");
  if (!selectedVessel) errors.push("Debe seleccionar una embarcación");
  if (!fecha) errors.push("Fecha es requerida");
  if (!hora) errors.push("Hora es requerida");

  const today = new Date().toISOString().split("T")[0];
  if (fecha < today) errors.push("La fecha no puede ser anterior a hoy");

  if (documento.length < 6)
    errors.push("Documento debe tener al menos 6 caracteres");

  const email = document.getElementById("emailCliente").value;
  if (email && !validateEmail(email)) errors.push("Email no válido");

  const phone = document.getElementById("telefono").value;
  if (phone && !validatePhone(phone)) errors.push("Teléfono no válido");

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// ===========================
// ATAJOS DE TECLADO
// ===========================
document.addEventListener("keydown", function (event) {
  // Ctrl/Cmd + G = Generar ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "g") {
    event.preventDefault();
    if (!document.getElementById("generateBtn").disabled) {
      generateTicket();
    }
  }

  // Ctrl/Cmd + P = Imprimir ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "p") {
    event.preventDefault();
    if (!document.getElementById("printBtn").disabled) {
      printTicket();
    }
  }

  // Ctrl/Cmd + N = Nuevo ticket
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault();
    newTicket();
  }

  // Esc = Cancelar/Nuevo ticket
  if (event.key === "Escape") {
    if (ticketGenerated) {
      newTicket();
    }
  }
});

// ===========================
// INICIALIZACIÓN FINAL
// ===========================

// Log de inicialización
console.log("🎫 Sistema POS de Embarcaciones de Guatapé cargado exitosamente");
console.log("📋 Atajos de teclado disponibles:");
console.log("   - Ctrl/Cmd + G: Generar ticket");
console.log("   - Ctrl/Cmd + P: Imprimir ticket");
console.log("   - Ctrl/Cmd + N: Nuevo ticket");
console.log("   - Esc: Cancelar operación actual");

// ===========================
// INTEGRACIÓN CON MÓDULOS EXTERNOS
// ===========================

// Cargar módulos adicionales de forma asíncrona
function loadExternalModules() {
  // Verificar y cargar módulos si están disponibles
  setTimeout(() => {
    if (typeof window.alertSystem !== "undefined") {
      console.log("✅ Sistema de alertas avanzado cargado");
    }

    if (typeof window.modalSystem !== "undefined") {
      console.log("✅ Sistema de modales cargado");
    }

    if (typeof window.pdfGenerator !== "undefined") {
      console.log("✅ Generador de PDF cargado");
    }

    if (typeof window.thermalPrinter !== "undefined") {
      console.log("✅ Impresora térmica cargada");
    }

    if (typeof window.authManager !== "undefined") {
      console.log("✅ Sistema de autenticación cargado");
    }
  }, 1000);
}

// Llamar carga de módulos después de la inicialización
setTimeout(loadExternalModules, 500);

// ===========================
// FUNCIONES DE COMPATIBILIDAD CON MÓDULOS
// ===========================

// Función para integrar con el sistema de PDF si está disponible
window.generatePDF = function (format = "thermal") {
  if (typeof window.generateTicketPDF === "function") {
    return window.generateTicketPDF(format);
  } else {
    showMessage(
      "warning",
      "PDF no disponible",
      "El módulo de PDF no está cargado"
    );
    return false;
  }
};

// Función para integrar con la impresora térmica si está disponible
window.printThermal = function () {
  if (typeof window.printThermalTicket === "function") {
    return window.printThermalTicket();
  } else {
    // Usar impresión estándar como fallback
    return printTicket();
  }
};

// Función para mostrar modal de bienvenida si está disponible
window.showWelcome = function (userEmail) {
  if (typeof window.showWelcomeModal === "function") {
    window.showWelcomeModal(userEmail);
  } else {
    showMessage("success", "¡Bienvenido!", `Sesión iniciada: ${userEmail}`);
  }
};

// ===========================
// EXPOSICIÓN GLOBAL DE FUNCIONES
// ===========================

// Exponer funciones principales globalmente para compatibilidad
window.posSystem = {
  // Funciones principales
  generateTicket,
  printTicket,
  cancelTicket,
  newTicket,
  updateTicket,

  // Funciones de embarcaciones
  selectVessel,
  toggleReservation,

  // Funciones de precios
  applyCustomPrice,
  resetPrice,

  // Funciones de contadores
  incrementCounter,
  decrementCounter,

  // Utilidades
  showMessage,
  validateForm,
  formatCurrency,
  validateEmail,
  validatePhone,

  // Obtener datos del ticket
  getTicketData: () => ({
    codigo: currentTicketCode,
    nombre: document.getElementById("nombre").value,
    documento: document.getElementById("documento").value,
    telefono: document.getElementById("telefono").value,
    email: document.getElementById("emailCliente").value,
    fecha: document.getElementById("fecha").value,
    hora: document.getElementById("hora").value,
    embarcacion: selectedVessel,
    adultos: parseInt(document.getElementById("adultos").value),
    ninos: parseInt(document.getElementById("ninos").value),
    total: document.getElementById("ticket-total").textContent,
    estado: ticketCancelled
      ? "ANULADO"
      : ticketGenerated
      ? "GENERADO"
      : "BORRADOR",
    reserva: reservationMode,
    precioPersonalizado: customPrice > 0,
  }),

  // Obtener estado del sistema
  getSystemStatus: () => ({
    ticketGenerated,
    ticketPrinted,
    ticketCancelled,
    reservationMode,
    selectedVessel,
    vesselPrice,
    customPrice,
  }),

  // Funciones de estado
  resetSystem: () => {
    clearTicketForm();
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
  },

  // Estados disponibles
  TICKET_STATES,
};

// ===========================
// FUNCIONES ADICIONALES DE UTILIDAD
// ===========================

// Función para exportar datos del ticket en formato JSON
window.exportTicketData = function () {
  const ticketData = window.posSystem.getTicketData();
  const systemStatus = window.posSystem.getSystemStatus();

  const exportData = {
    ticket: ticketData,
    system: systemStatus,
    timestamp: new Date().toISOString(),
    version: "2.0",
  };

  return JSON.stringify(exportData, null, 2);
};

// Función para generar reporte simple
window.generateSimpleReport = function () {
  const data = window.posSystem.getTicketData();

  if (!data.codigo || data.codigo === null) {
    showMessage("warning", "Sin datos", "No hay ticket para generar reporte");
    return null;
  }

  const report = {
    fecha_reporte: new Date().toISOString(),
    ticket_codigo: data.codigo,
    pasajero: data.nombre,
    documento: data.documento,
    embarcacion: data.embarcacion,
    fecha_viaje: data.fecha,
    hora_viaje: data.hora,
    pasajeros_total: data.adultos + data.ninos,
    total_pago: data.total,
    estado: data.estado,
    tipo_servicio: data.reserva ? "Con Reserva" : "Nuevo Pasaje",
  };

  console.log("📊 Reporte generado:", report);
  return report;
};

// Función para limpiar el sistema completamente
window.resetCompleteSystem = function () {
  if (
    confirm(
      "¿Está seguro que desea resetear completamente el sistema?\n\nEsto limpiará todos los datos y estados."
    )
  ) {
    window.posSystem.resetSystem();

    // Limpiar variables globales adicionales
    selectedVessel = null;
    vesselPrice = 0;
    originalVesselPrice = 0;
    customPrice = 0;
    ticketGenerated = false;
    ticketPrinted = false;
    ticketCancelled = false;
    currentTicketCode = null;
    reservationMode = false;

    showMessage(
      "success",
      "Sistema reseteado",
      "Todos los datos han sido limpiados"
    );
    console.log("🔄 Sistema completamente reseteado");
  }
};

// ===========================
// FINALIZACIÓN E INFORMACIÓN DEL SISTEMA
// ===========================

console.log("🔧 Sistema POS completamente inicializado y listo para usar");
console.log("📦 Funciones disponibles en window.posSystem:");
console.log(
  "   - generateTicket(), printTicket(), cancelTicket(), newTicket()"
);
console.log(
  "   - selectVessel(), toggleReservation(), applyCustomPrice(), resetPrice()"
);
console.log(
  "   - incrementCounter(), decrementCounter(), showMessage(), validateForm()"
);
console.log("   - getTicketData(), getSystemStatus(), resetSystem()");
console.log("🌐 Funciones globales adicionales:");
console.log(
  "   - exportTicketData(), generateSimpleReport(), resetCompleteSystem()"
);
console.log("   - generatePDF(), printThermal(), showWelcome()");

// Marcar el script como completamente cargado
window.posSystemReady = true;
window.posSystemVersion = "2.0";
window.posSystemLoadTime = new Date().toISOString();

// Evento personalizado para notificar que el sistema está listo
if (typeof window.CustomEvent === "function") {
  const readyEvent = new CustomEvent("posSystemReady", {
    detail: {
      version: window.posSystemVersion,
      loadTime: window.posSystemLoadTime,
      functions: Object.keys(window.posSystem),
    },
  });
  window.dispatchEvent(readyEvent);
}

/**
 * ===========================
 * DOCUMENTACIÓN DE USO
 * ===========================
 *
 * Para usar este script en tu HTML:
 *
 * 1. Incluir el script:
 *    <script src="pos-system.js"></script>
 *
 * 2. Usar las funciones:
 *    window.posSystem.generateTicket();
 *    window.posSystem.getTicketData();
 *
 * 3. Escuchar el evento de carga:
 *    window.addEventListener('posSystemReady', function(event) {
 *        console.log('Sistema POS listo:', event.detail);
 *    });
 *
 * 4. Integrar con módulos adicionales:
 *    - alerts.js: Sistema de alertas avanzado
 *    - modal.js: Modales de bienvenida/despedida
 *    - pdf-generator.js: Generación de PDF
 *    - thermal-printer.js: Impresión térmica
 *    - firebase-auth.js: Autenticación
 *
 * ===========================
 */
