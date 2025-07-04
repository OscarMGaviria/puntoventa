//app.js
// Variables globales del sistema
let selectedVessel = null;
let vesselPrice = 0;
let ticketGenerated = false;
let currentUser = null;

// Elementos del DOM - Sistema Principal
const mainActionBtn = document.getElementById("mainActionBtn");
const btnActionText = document.getElementById("btnActionText");

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
  initializeSystem();
});

function initializeSystem() {
  // Establecer fecha mínima como hoy
  document.getElementById("fecha").min = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").value = new Date()
    .toISOString()
    .split("T")[0];

  // Configurar event listeners
  setupEventListeners();

  console.log("🚢 Sistema de tickets inicializado");
}

function setupEventListeners() {
  // Sistema principal - listeners para actualizar botón
  document.getElementById("nombre").addEventListener("input", handleFormChange);
  document
    .getElementById("documento")
    .addEventListener("input", handleFormChange);
}

function handleFormChange() {
  updateTicket();
  updateMainButton();
  // Reset ticket generated state when form changes
  if (ticketGenerated) {
    ticketGenerated = false;
    updateMainButton();
  }
}

function clearTicketForm() {
  document.getElementById("nombre").value = "";
  document.getElementById("documento").value = "";
  document.getElementById("telefono").value = "";
  document.getElementById("emailCliente").value = "";
  document.getElementById("adultos").value = "1";
  document.getElementById("ninos").value = "0";
  document.getElementById("hora").value = "";

  // Deseleccionar embarcación
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });
  selectedVessel = null;
  vesselPrice = 0;

  updateTicket();
  updateMainButton();
}

// FUNCIONES DEL SISTEMA DE TICKETS
function selectVessel(element) {
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  element.classList.add("selected");
  selectedVessel = element.dataset.type;
  
  // MODIFICAR: Verificar si está en modo reserva
  const switchElement = document.getElementById('reservationSwitch');
  if (switchElement && switchElement.checked) {
    vesselPrice = 10000;
  } else {
    vesselPrice = parseInt(element.dataset.price);
  }

  updateTicket();
  updateMainButton();
}

function toggleReservation() {
  const switchElement = document.getElementById('reservationSwitch');
  const tipoServicio = document.getElementById('ticket-tipo-servicio');
  
  if (switchElement.checked) {
    tipoServicio.textContent = 'Con Reserva';
    // AGREGAR: Aplicar descuento de reserva
    vesselPrice = 10000;
  } else {
    tipoServicio.textContent = 'Nuevo Pasaje';
    // AGREGAR: Restaurar precio original si hay embarcación seleccionada
    const selectedCard = document.querySelector('.vessel-card.selected');
    if (selectedCard) {
      vesselPrice = parseInt(selectedCard.dataset.price);
    }
  }
  
  updateTicket();
}

function incrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const maxValue = parseInt(input.max);

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
    updateTicket();
    updateMainButton();
  }
}

function decrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const minValue = parseInt(input.min);

  if (currentValue > minValue) {
    input.value = currentValue - 1;
    updateTicket();
    updateMainButton();
  }
}

function updateMainButton() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const btn = mainActionBtn;
  const btnTextEl = btnActionText;
  const btnIcon = document.querySelector(".btn-icon");

  const isFormComplete = nombre && documento && selectedVessel;

  if (!isFormComplete) {
    btn.className = "action-btn disabled";
    btnTextEl.textContent = "Complete los datos";
    btnIcon.textContent = "⚠️";
    btn.onclick = () => {
      showWarning('Campos incompletos', 'Complete nombre, documento y seleccione embarcación');
    };
  } else if (!ticketGenerated) {
    btn.className = "action-btn generate";
    btnTextEl.textContent = "Generar Ticket";
    btnIcon.textContent = "🎫";
    btn.onclick = generateTicket;
  } else {
    btn.className = "action-btn print";
    btnTextEl.textContent = "Imprimir Ticket";
    btnIcon.textContent = "🖨️";
    btn.onclick = printTicket;
  }
}

function handleMainAction() {
  // Esta función será reemplazada por updateMainButton()
}

function updateTicket() {
  const nombre = document.getElementById("nombre").value || "-";
  const documento = document.getElementById("documento").value || "-";
  const fecha = document.getElementById("fecha").value || "-";
  const hora = document.getElementById("hora").value || "-";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;

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

  const total = selectedVessel
    ? adultos * vesselPrice + ninos * vesselPrice * 0.5
    : 0;
  document.getElementById(
    "ticket-total"
  ).textContent = `$${total.toLocaleString()}`;

  const codigo =
    "TKT-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 3).toUpperCase();
  document.getElementById("ticket-codigo").textContent = codigo;

  if (nombre && documento && selectedVessel) {
    generateQRCode();
  }
}

function generateQRCode() {
  const nombre = document.getElementById("nombre").value || "Sin nombre";
  const documento =
    document.getElementById("documento").value || "Sin documento";
  const fecha = document.getElementById("fecha").value || "Sin fecha";
  const hora = document.getElementById("hora").value || "Sin hora";
  const embarcacion = selectedVessel || "Sin embarcación";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;
  const codigo = document.getElementById("ticket-codigo").textContent;
  const total = document.getElementById("ticket-total").textContent;

  const qrData = {
    codigo: codigo,
    pasajero: nombre,
    documento: documento,
    fecha: fecha,
    hora: hora,
    embarcacion: embarcacion,
    adultos: adultos,
    ninos: ninos,
    total: total,
    timestamp: new Date().toISOString(),
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
    qrString
  )}`;

  const qrContainer = document.getElementById("qr-container");
  qrContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code" class="qr-code-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    <div class="qr-placeholder" style="display:none;">Error al generar QR</div>`;
}

function generateTicket() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;

  if (!nombre || !documento || !selectedVessel) {
    showError('Error', 'Complete campos obligatorios');
    return;
  }

  const now = new Date();
  document.getElementById(
    "ticket-timestamp"
  ).textContent = `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

  generateQRCode();
  ticketGenerated = true;
  updateMainButton();

  showSuccess("¡Ticket generado!", "El ticket se ha creado exitosamente");

  const ticket = document.getElementById("ticketPreview");
  ticket.classList.add("animate-fade");

  setTimeout(() => {
    showSuccess(
      "Ticket listo",
      "Ahora puede imprimir el ticket usando el botón verde"
    );
  }, 2500);
}

// ===========================
// FUNCIONES DE IMPRESIÓN
// ===========================

async function printTicket() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;

  if (!nombre || !documento || !selectedVessel) {
    showError("Error", "Datos incompletos para imprimir");
    return;
  }

  if (!ticketGenerated) {
    showWarning("Advertencia", "Debe generar el ticket antes de imprimir");
    return;
  }

  try {
    // Mostrar opciones de impresión con iconos mejorados
    const printOption = await showPrintOptionsModalWithIcons();
    
    if (printOption === 'cancel') {
      return;
    }

    // Generar QR actualizado antes de cualquier impresión
    generateQRCode();

    switch (printOption) {
      case 'thermal':
        await handleThermalPrint();
        break;
      case 'pdf-thermal':
        await generateTicketPDF('thermal');
        break;
      case 'pdf-standard':
        await generateTicketPDF('standard');
        break;
      case 'pdf-compact':
        await generateTicketPDF('compact');
        break;
      case 'preview-pdf':
        await previewTicketPDF('standard');
        break;
      case 'standard':
      default:
        await handleStandardPrint();
        break;
    }

  } catch (error) {
    console.error("Error en impresión:", error);
    showError("Error de impresión", "No se pudo completar la operación. Intente nuevamente.");
  }
}

// Función para mostrar modal de opciones con iconos SVG mejorados
async function showPrintOptionsModalWithIcons() {
  return new Promise((resolve) => {
    const modalHTML = `
      <div id="print-options-modal" style="
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000; font-family: 'Segoe UI', sans-serif;
        animation: modalFadeIn 0.3s ease-out;
      ">
        <div style="
          background: rgba(255,255,255,0.1); backdrop-filter: blur(20px);
          border-radius: 20px; padding: 25px; max-width: 520px; width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.2);
          color: white; text-align: center;
          animation: modalSlideIn 0.4s ease-out;
        ">
          <h2 style="margin: 0 0 20px 0; color: #ffd700; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 1.5em;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="3" width="16" height="10" rx="1"/>
              <rect x="2" y="13" width="20" height="6" rx="1"/>
            </svg>
            Opciones de Impresión
          </h2>
          <p style="margin: 0 0 25px 0; opacity: 0.9;">Seleccione cómo desea imprimir su ticket:</p>
          
          <div style="display: grid; gap: 12px; margin-bottom: 20px;">
            
            <!-- Impresión Térmica -->
            <button onclick="selectPrintOption('thermal')" style="
              background: linear-gradient(45deg, #27ae60, #2ecc71); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(39, 174, 96, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(39, 174, 96, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="12" rx="2"/>
                <rect x="5" y="6" width="14" height="2" fill="white" opacity="0.9"/>
                <rect x="6" y="17" width="12" height="3" rx="1"/>
                <circle cx="8" cy="18.5" r="0.5" fill="white"/>
                <circle cx="16" cy="18.5" r="0.5" fill="white"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">Impresora Térmica</div>
                <div style="font-size: 12px; opacity: 0.9;">Impresión directa en impresora térmica (80mm)</div>
              </div>
            </button>

            <!-- PDF Térmico -->
            <button onclick="selectPrintOption('pdf-thermal')" style="
              background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(231, 76, 60, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(231, 76, 60, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="2" width="12" height="16" rx="1"/>
                <path d="M14 2 L14 6 L18 6 L16 2 Z" opacity="0.8"/>
                <rect x="6" y="5" width="6" height="1" fill="white" opacity="0.9"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">PDF Térmico (80mm)</div>
                <div style="font-size: 12px; opacity: 0.9;">Descargar PDF optimizado para impresoras térmicas</div>
              </div>
            </button>

            <!-- PDF Estándar -->
            <button onclick="selectPrintOption('pdf-standard')" style="
              background: linear-gradient(45deg, #3498db, #2980b9); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(52, 152, 219, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(52, 152, 219, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="2" width="14" height="18" rx="1"/>
                <path d="M15 2 L15 7 L20 7 L17 2 Z" opacity="0.8"/>
                <rect x="5" y="5" width="8" height="1.5" fill="white" opacity="0.9"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">PDF Estándar (A4)</div>
                <div style="font-size: 12px; opacity: 0.9;">PDF profesional tamaño carta con diseño completo</div>
              </div>
            </button>

            <!-- PDF Compacto -->
            <button onclick="selectPrintOption('pdf-compact')" style="
              background: linear-gradient(45deg, #9b59b6, #8e44ad); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(155, 89, 182, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(155, 89, 182, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="6" width="18" height="12" rx="1"/>
                <path d="M18 6 L18 10 L22 10 L20 6 Z" opacity="0.8"/>
                <rect x="4" y="8" width="10" height="1" fill="white" opacity="0.9"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">PDF Compacto (A5)</div>
                <div style="font-size: 12px; opacity: 0.9;">Formato horizontal compacto, ideal para archivos</div>
              </div>
            </button>

            <!-- Vista Previa -->
            <button onclick="selectPrintOption('preview-pdf')" style="
              background: linear-gradient(45deg, #f39c12, #e67e22); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(243, 156, 18, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(243, 156, 18, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="8" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">Vista Previa PDF</div>
                <div style="font-size: 12px; opacity: 0.9;">Ver PDF en nueva ventana antes de decidir</div>
              </div>
            </button>

            <!-- Impresión Estándar -->
            <button onclick="selectPrintOption('standard')" style="
              background: linear-gradient(45deg, #95a5a6, #7f8c8d); color: white; border: none;
              padding: 16px 20px; border-radius: 12px; font-size: 14px; cursor: pointer;
              transition: all 0.3s ease; text-align: left; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 15px rgba(149, 165, 166, 0.3);
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(149, 165, 166, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(149, 165, 166, 0.3)'">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="3" width="16" height="10" rx="1"/>
                <rect x="2" y="13" width="20" height="6" rx="1"/>
              </svg>
              <div>
                <div style="font-weight: bold; margin-bottom: 2px;">Impresión Estándar</div>
                <div style="font-size: 12px; opacity: 0.9;">Usar impresora predeterminada del sistema</div>
              </div>
            </button>
          </div>

          <button onclick="selectPrintOption('cancel')" style="
            background: rgba(255,255,255,0.1); color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 12px 25px; border-radius: 20px; font-size: 14px;
            cursor: pointer; transition: all 0.3s ease;
            display: flex; align-items: center; gap: 8px; margin: 0 auto;
          ">Cancelar</button>
        </div>
      </div>

      <style>
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      </style>
    `;

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Función global para manejar selección
    window.selectPrintOption = (option) => {
      const modal = document.getElementById('print-options-modal');
      if (modal) modal.remove();
      delete window.selectPrintOption;
      resolve(option);
    };

    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('print-options-modal');
        if (modal) modal.remove();
        document.removeEventListener('keydown', handleEsc);
        delete window.selectPrintOption;
        resolve('cancel');
      }
    };
    document.addEventListener('keydown', handleEsc);
  });
}

// Función para manejar impresión térmica
async function handleThermalPrint() {
  showInfo("Impresión térmica", "Enviando a impresora térmica...");
  
  if (window.thermalPrinter) {
    const thermalResult = await window.thermalPrinter.printTicket();
    
    if (thermalResult) {
      showSuccess("¡Impreso!", "Ticket enviado a impresora térmica exitosamente");
      
      if (confirm("¿Desea limpiar el formulario para un nuevo ticket?")) {
        clearTicketForm();
      }
      return;
    }
  }
  
  // Fallback a impresión estándar
  showWarning("Térmica no disponible", "Usando impresión estándar como alternativa");
  await handleStandardPrint();
}

// Función para manejar impresión estándar
async function handleStandardPrint() {
  showInfo("Impresión estándar", "Usando impresora del sistema...");
  
  const printContent = generateOptimizedPrintContent();
  const printWindow = window.open('', '_blank', 'width=400,height=700');
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        showSuccess("Ticket enviado", "Revise su impresora");
        if (confirm("¿Desea crear un nuevo ticket?")) {
          clearTicketForm();
        }
      };
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
          showInfo("Ventana cerrada", "Impresión cancelada o completada");
        }
      }, 30000);
    }, 500);
  };
}

// Función para agregar botones de control mejorados
function addPrinterControlButtons() {
  if (document.getElementById('printer-controls')) return;

  const header = document.querySelector('.header');
  if (!header) return;

  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'printer-controls';
  controlsContainer.style.cssText = `
    position: absolute; top: 15px; left: 20px;
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  `;

  controlsContainer.innerHTML = `
    <button onclick="connectThermalPrinter()" style="
      background: linear-gradient(45deg, #27ae60, #2ecc71); color: white; border: none;
      padding: 6px 12px; border-radius: 15px; font-size: 11px; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.3s ease;
    ">🔌 Conectar Térmica</button>
    
    <button onclick="testThermalPrinter()" style="
      background: linear-gradient(45deg, #3498db, #2980b9); color: white; border: none;
      padding: 6px 12px; border-radius: 15px; font-size: 11px; cursor: pointer;
      display: flex; align-items: center; gap: 6px; transition: all 0.3s ease;
    ">🧪 Probar</button>
    
    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.3); margin: 0 5px;"></div>
    
    <select id="pdf-format-select" style="
      background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.3);
      padding: 4px 8px; border-radius: 10px; font-size: 10px; cursor: pointer;
    ">
      <option value="thermal">PDF Térmico</option>
      <option value="standard">PDF Estándar</option>
      <option value="compact">PDF Compacto</option>
    </select>

    <button onclick="previewSelectedPDF()" style="
      background: linear-gradient(45deg, #f39c12, #e67e22); color: white; border: none;
      padding: 6px 10px; border-radius: 12px; font-size: 10px; cursor: pointer;
    ">👁️ Vista</button>

    <button onclick="downloadSelectedPDF()" style="
      background: linear-gradient(45deg, #e74c3c, #c0392b); color: white; border: none;
      padding: 6px 10px; border-radius: 12px; font-size: 10px; cursor: pointer;
    ">📄 PDF</button>

    <div id="printer-status" style="
      background: rgba(0,0,0,0.2); padding: 3px 8px; border-radius: 10px;
      font-size: 9px; color: #ccc; margin-left: 5px;
    ">Desconectada</div>
  `;

  header.appendChild(controlsContainer);
}

// Función para vista previa del formato seleccionado
window.previewSelectedPDF = async () => {
  const formatSelect = document.getElementById('pdf-format-select');
  const format = formatSelect ? formatSelect.value : 'thermal';
  return await previewTicketPDF(format);
};

// Función para descargar el formato seleccionado
window.downloadSelectedPDF = async () => {
  const formatSelect = document.getElementById('pdf-format-select');
  const format = formatSelect ? formatSelect.value : 'thermal';
  return await generateTicketPDF(format);
};

// Función para generar contenido optimizado para impresión
function generateOptimizedPrintContent() {
  const nombre = document.getElementById("ticket-nombre").textContent;
  const documento = document.getElementById("ticket-documento").textContent;
  const fecha = document.getElementById("ticket-fecha").textContent;
  const hora = document.getElementById("ticket-hora").textContent;
  const embarcacion = document.getElementById("ticket-embarcacion").textContent;
  const pasajeros = document.getElementById("ticket-pasajeros").textContent;
  const total = document.getElementById("ticket-total").textContent;
  const codigo = document.getElementById("ticket-codigo").textContent;
  const tipoServicio = document.getElementById("ticket-tipo-servicio").textContent;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket - ${codigo}</title>
      <style>
        @page { margin: 10mm; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          line-height: 1.3;
          width: 100%;
          background: white;
        }
        .ticket-container { 
          width: 100%; 
          padding: 8px; 
          border: 1px solid #000;
          background: white;
        }
        .header { 
          text-align: center; 
          border-bottom: 1px solid #000; 
          padding-bottom: 8px; 
          margin-bottom: 8px; 
        }
        .title { 
          font-size: 14px; 
          font-weight: bold; 
          margin-bottom: 2px; 
        }
        .subtitle { 
          font-size: 10px; 
        }
        .field { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 3px; 
          border-bottom: 1px dotted #ccc;
          padding-bottom: 2px;
        }
        .label { 
          font-weight: bold; 
          width: 40%;
        }
        .value { 
          width: 60%; 
          text-align: right; 
        }
        .total-section { 
          margin-top: 8px; 
          padding-top: 8px; 
          border-top: 2px solid #000; 
          text-align: center; 
        }
        .total-label { 
          font-size: 12px; 
          font-weight: bold; 
        }
        .total-amount { 
          font-size: 16px; 
          font-weight: bold; 
          margin-top: 2px; 
        }
        .footer { 
          margin-top: 8px; 
          padding-top: 8px; 
          border-top: 1px solid #000; 
          text-align: center; 
          font-size: 8px; 
        }
        .qr-section {
          text-align: center;
          margin: 8px 0;
          padding: 4px;
          border: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="header">
          <div class="title">🚢 EMBARCACIONES GUATAPÉ</div>
          <div class="subtitle">Nautica Guatapé S.A.S</div>
          <div class="subtitle">Embalse de Guatapé</div>
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
        
        <div class="total-section">
          <div class="total-label">TOTAL A PAGAR</div>
          <div class="total-amount">${total}</div>
        </div>
        
        <div class="qr-section">
          <div style="font-size: 10px; margin-bottom: 4px;">Código: ${codigo}</div>
          <div style="font-size: 8px;">Generado: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="footer">
          <div>¡Gracias por viajar con nosotros!</div>
          <div>www.embarcacionesguatape.com</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Inicializar controles al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    addPrinterControlButtons();
    
    // Actualizar estado cada 5 segundos
    setInterval(() => {
      const statusElement = document.getElementById('printer-status');
      if (statusElement && window.thermalPrinter) {
        const status = window.thermalPrinter.getConnectionStatus();
        if (status.isConnected) {
          statusElement.textContent = '🟢 Conectada';
          statusElement.style.color = '#00ff88';
        } else if (status.hasWebSerial) {
          statusElement.textContent = '🟡 Disponible';
          statusElement.style.color = '#ffd700';
        } else {
          statusElement.textContent = '🔴 No compatible';
          statusElement.style.color = '#ff6b6b';
        }
      }
    }, 5000);
  }, 1000);
});