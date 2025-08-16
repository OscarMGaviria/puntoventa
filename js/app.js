//app.js - Versión completa y funcional para POS
// Variables globales del sistema
let selectedVessel = null;
let vesselPrice = 0;
let originalVesselPrice = 0;
let customPrice = 0;
let ticketGenerated = false;
let ticketPrinted = false;
let ticketCancelled = false;
let currentUser = null;
let currentTicketCode = null;
let isReservation = false;

// Estados del ticket
const TICKET_STATES = {
    DRAFT: 'BORRADOR',
    GENERATED: 'GENERADO',
    PRINTED: 'IMPRESO',
    CANCELLED: 'ANULADO'
};

// Inicialización
document.addEventListener("DOMContentLoaded", function () {
  initializeSystem();
});

function initializeSystem() {
  // Establecer fecha mínima como hoy
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fecha").min = today;
  document.getElementById("fecha").value = today;

  // Configurar event listeners
  setupEventListeners();
  setupFieldValidation();
  
  // Inicializar estado de botones
  updateButtonStates();
  updateTicketStatus(TICKET_STATES.DRAFT);
  
  // Inicializar toggle de reserva
  initializeReservationToggle();

  console.log("🚢 Sistema POS inicializado");
  showInfo("Sistema iniciado", "POS de Embarcaciones de Guatapé listo");
}

function initializeReservationToggle() {
  const toggle = document.getElementById("reservationToggle");
  if (toggle) {
    toggle.classList.remove("active");
    isReservation = false;
  }
}

function setupEventListeners() {
  // Listeners para campos principales
  document.getElementById("nombre").addEventListener("input", handleFormChange);
  document.getElementById("documento").addEventListener("input", handleFormChange);
  document.getElementById("telefono").addEventListener("input", handleFormChange);
  document.getElementById("emailCliente").addEventListener("input", handleFormChange);
  document.getElementById("fecha").addEventListener("change", handleFormChange);
  document.getElementById("adultos").addEventListener("input", handleFormChange);
  document.getElementById("ninos").addEventListener("input", handleFormChange);
}

function handleFormChange() {
  updateVesselCardPrices();
  updateTicket();
  updateButtonStates();
  
  // Si el ticket ya fue generado y se cambian datos, marcar como borrador
  if (ticketGenerated && !ticketCancelled) {
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    showWarning('Cambios detectados', 'Debe generar el ticket nuevamente');
  }
}

function resetTicketState() {
  ticketGenerated = false;
  ticketPrinted = false;
  currentTicketCode = null;
  updateButtonStates();
}

// FUNCIONES DE EMBARCACIONES
function selectVessel(element) {
  document.querySelectorAll(".vessel-card").forEach((el) => {
    el.classList.remove("selected");
  });

  element.classList.add("selected");
  selectedVessel = element.dataset.type;
  originalVesselPrice = parseInt(element.dataset.price);
  
  updateTicket();
  updateButtonStates();
  handleFormChange();
}

// FUNCIÓN DE TOGGLE DE RESERVA (ACTUALIZADA)
function toggleReservation() {
  const toggle = document.getElementById('reservationToggle');
  const tipoServicio = document.getElementById('ticket-tipo-servicio');
  
  // Cambiar estado del toggle
  isReservation = !isReservation;
  
  if (isReservation) {
    toggle.classList.add('active');
    tipoServicio.textContent = 'Con Reserva';
  } else {
    toggle.classList.remove('active');
    tipoServicio.textContent = 'Nuevo Pasaje';
  }
  
  // Actualizar ticket con nuevo cálculo
  updateTicket();
  handleFormChange();
}

// FUNCIONES DE PRECIO PERSONALIZADO
function applyCustomPrice() {
  const customPriceInput = document.getElementById('precioPersonalizado');
  const value = parseInt(customPriceInput.value);
  
  if (value && value > 0) {
    customPrice = value;
    customPriceInput.style.borderColor = '#10b981';
  } else {
    resetPrice();
  }
  
  updateTicket();
  handleFormChange();
}

function resetPrice() {
  const customPriceInput = document.getElementById('precioPersonalizado');
  customPriceInput.value = '';
  customPriceInput.style.borderColor = '';
  customPrice = 0;
  
  updateTicket();
  handleFormChange();
}

// FUNCIONES DE CONTADORES
function incrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const maxValue = parseInt(input.max);

  if (currentValue < maxValue) {
    input.value = currentValue + 1;
    updateTicket();
    handleFormChange();
  }
}

function decrementCounter(fieldId) {
  const input = document.getElementById(fieldId);
  const currentValue = parseInt(input.value) || 0;
  const minValue = parseInt(input.min);

  if (currentValue > minValue) {
    input.value = currentValue - 1;
    updateTicket();
    handleFormChange();
  }
}

// FUNCIONES DE BOTONES
function updateButtonStates() {
  const nombre = document.getElementById("nombre").value;
  const documento = document.getElementById("documento").value;
  const fecha = document.getElementById("fecha").value;
  
  const generateBtn = document.getElementById("generateBtn");
  const printBtn = document.getElementById("printBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  
  const isFormComplete = nombre && documento && selectedVessel && fecha;
  
  // Botón Generar
  if (ticketCancelled) {
    generateBtn.classList.add('disabled');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-times-circle"></i> Ticket Anulado';
  } else if (!isFormComplete) {
    generateBtn.classList.add('disabled');
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Complete Datos';
  } else if (ticketGenerated) {
    generateBtn.classList.remove('disabled');
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerar';
  } else {
    generateBtn.classList.remove('disabled');
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Generar';
  }
  
  // Botón Imprimir
  if (ticketGenerated && !ticketCancelled) {
    printBtn.classList.remove('disabled');
    printBtn.disabled = false;
    if (ticketPrinted) {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Reimprimir';
    } else {
      printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
    }
  } else {
    printBtn.classList.add('disabled');
    printBtn.disabled = true;
    printBtn.innerHTML = '<i class="fas fa-print"></i> Imprimir';
  }
  
  // Botón Anular
  if (ticketGenerated && !ticketCancelled) {
    cancelBtn.classList.remove('disabled');
    cancelBtn.disabled = false;
  } else {
    cancelBtn.classList.add('disabled');
    cancelBtn.disabled = true;
  }
}

// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN DEL TICKET
function updateTicket() {
  const nombre = document.getElementById("nombre").value || "-";
  const documento = document.getElementById("documento").value || "-";
  const fecha = document.getElementById("fecha").value || "-";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;

  // Actualizar campos del ticket
  document.getElementById("ticket-nombre").textContent = nombre;
  document.getElementById("ticket-documento").textContent = documento;
  document.getElementById("ticket-fecha").textContent = fecha;
  
  // Generar hora actual
  const now = new Date();
  const hora = now.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  document.getElementById("ticket-hora").textContent = hora;
  
  document.getElementById("ticket-embarcacion").textContent = selectedVessel
    ? selectedVessel.charAt(0).toUpperCase() + selectedVessel.slice(1)
    : "-";

  const totalPasajeros = adultos + ninos;
  document.getElementById("ticket-pasajeros").textContent =
    totalPasajeros > 0 ? `${adultos} adultos, ${ninos} niños` : "-";

  // Calcular total
  let total = 0;
  if (selectedVessel) {
    const totalPersonas = adultos;
    
    // Si está en modo reserva, usar precio fijo
    if (isReservation) {
      total = 10000;
    } else {
      // Calcular según tipo de embarcación
      switch (selectedVessel) {
        case 'lancha': // Lancha Taxi
          total = totalPersonas * 30000;
          break;
          
        case 'deportiva': // Lanchas Deportivas (SIN CAMBIOS)
          if (totalPersonas <= 4) {
            total = 250000;
          } else if (totalPersonas <= 6) {
            total = 300000;
          } else {
            total = totalPersonas * 50000;
          }
          break;
          
        case 'planchon': // Planchones
          total = totalPersonas * 30000;
          break;
          
        case 'barco': // Barcos
          total = totalPersonas * 30000;
          break;
          
        case 'yate': // Yates
          if (totalPersonas <= 10) {
            total = 400000;
          } else {
            total = 400000 + ((totalPersonas - 10) * 30000);
          }
          break;
          
        case 'carguero': // Carguero (SIN CAMBIOS)
          total = Math.ceil(totalPersonas / 6) * 200000;
          break;
          
        default:
          total = 0;

      }
    }
    
    // Aplicar precio personalizado si existe
    const customPriceInput = document.getElementById('precioPersonalizado');
    if (customPriceInput.value && parseInt(customPriceInput.value) > 0) {
      total = parseInt(customPriceInput.value);
    }
  }
  
  document.getElementById("ticket-total").textContent = `$${total.toLocaleString()}`;

  // Actualizar código si no existe
  if (!currentTicketCode) {
    currentTicketCode = "TKT-" + Date.now().toString(36).toUpperCase() + 
                      Math.random().toString(36).substr(2, 3).toUpperCase();
  }
  document.getElementById("ticket-codigo").textContent = currentTicketCode;
}

// ===========================
// 🖨️ FUNCIÓN DE IMPRESIÓN PRINCIPAL (CORREGIDA)
// ===========================

/**
 * Función principal de impresión que muestra el modal de opciones
 * ESTA ES LA ÚNICA FUNCIÓN printTicket() EN TODO EL SISTEMA
 */
function printTicket() {
    // Verificar si el ticket está generado y es válido
    if (!ticketGenerated || ticketCancelled) {
        showError('Error de impresión', 'Debe generar un ticket válido antes de imprimir');
        return;
    }

    // Verificar si el sistema de modales está disponible
    if (typeof modalSystem !== 'undefined' && modalSystem.isInitialized) {
        console.log('🎭 Abriendo modal de opciones de impresión...');
        modalSystem.showPrintOptionsModal();
    } else {
        // Si no hay modal disponible, mostrar opciones básicas
        showWarning('Modal no disponible', 'Sistema de modales no cargado');
        
        // Fallback: preguntar con confirm nativo
        const userChoice = confirm(
            'Seleccione método de impresión:\n\n' +
            'OK = Impresora Directa\n' +
            'Cancelar = Generar PDF'
        );
        
        if (userChoice) {
            // Impresión directa
            directPrint();
        } else {
            // Generar PDF
            if (typeof generateTicketPDF !== 'undefined') {
                generateTicketPDF('thermal');
            } else {
                showError('PDF no disponible', 'Generador de PDF no está cargado');
            }
        }
    }
}

/**
 * Impresión directa sin modal (función auxiliar)
 */
function directPrint() {
    try {
        showInfo('Preparando impresión...', 'Configurando ticket para impresión directa');
        
        const printContent = generatePrintContent();
        const printWindow = window.open('', '_blank', 'width=400,height=700');
        
        if (!printWindow) {
            showError('Error de ventana', 'No se pudo abrir la ventana de impresión. Verifique que no estén bloqueadas las ventanas emergentes.');
            return;
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.onafterprint = () => {
                    printWindow.close();
                    ticketPrinted = true;
                    updateButtonStates();
                    updateTicketStatus(TICKET_STATES.PRINTED);
                    showSuccess("¡Ticket impreso!", "Ticket enviado a la impresora exitosamente");
                };
                
                setTimeout(() => {
                    if (!printWindow.closed) {
                        printWindow.close();
                        ticketPrinted = true;
                        updateButtonStates();
                        updateTicketStatus(TICKET_STATES.PRINTED);
                        showInfo("Impresión completada", "Ventana de impresión cerrada automáticamente");
                    }
                }, 30000);
            }, 500);
        };
        
    } catch (error) {
        console.error('Error imprimiendo ticket:', error);
        showError('Error de impresión', 'No se pudo completar la impresión del ticket');
    }
}

function cancelTicket() {
  if (!ticketGenerated) {
    showError('Error', 'No hay ticket para anular');
    return;
  }

  if (ticketCancelled) {
    showWarning('Advertencia', 'El ticket ya está anulado');
    return;
  }

  // Mostrar confirmación
  if (!confirm('¿Está seguro que desea anular este ticket?\n\nEsta acción no se puede deshacer.')) {
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
    document.getElementById("ticket-timestamp").textContent = 
      `ANULADO: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO')}`;
    
    // Efectos visuales
    const ticketPanel = document.querySelector(".ticket-panel");
    if (ticketPanel) {
      ticketPanel.style.opacity = '0.6';
      ticketPanel.style.filter = 'grayscale(100%)';
    }
    
    showSuccess("Ticket anulado", "El ticket ha sido anulado exitosamente");
    
  } catch (error) {
    console.error('Error anulando ticket:', error);
    showError('Error del sistema', 'No se pudo anular el ticket');
  }
}

function newTicket() {
  if (confirm('¿Desea crear un nuevo ticket?\n\nSe perderán todos los datos actuales.')) {
    clearTicketForm();
    resetTicketState();
    updateTicketStatus(TICKET_STATES.DRAFT);
    
    // Restaurar efectos visuales
    const ticketPanel = document.querySelector(".ticket-panel");
    if (ticketPanel) {
      ticketPanel.style.opacity = '';
      ticketPanel.style.filter = '';
    }
    
    showInfo("Nuevo ticket", "Formulario preparado para nuevo ticket");
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
  document.getElementById("precioPersonalizado").value = "";
  
  // Resetear toggle de reserva
  const toggle = document.getElementById("reservationToggle");
  if (toggle) {
    toggle.classList.remove("active");
    isReservation = false;
    document.getElementById('ticket-tipo-servicio').textContent = 'Nuevo Pasaje';
  }

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
    'Genere el ticket para ver QR';
  document.getElementById("ticket-timestamp").textContent = 
    "Vista previa - Ticket no generado";
}

// FUNCIONES DE ESTADO DEL TICKET
function updateTicketStatus(status) {
  const statusElement = document.getElementById("ticketStatus");
  if (!statusElement) return;
  
  statusElement.textContent = status;
  
  // Remover clases anteriores
  statusElement.classList.remove('generated', 'printed', 'cancelled');
  
  // Agregar clase según estado
  switch (status) {
    case TICKET_STATES.GENERATED:
      statusElement.classList.add('generated');
      break;
    case TICKET_STATES.PRINTED:
      statusElement.classList.add('printed');
      break;
    case TICKET_STATES.CANCELLED:
      statusElement.classList.add('cancelled');
      break;
  }
}

// FUNCIÓN DE GENERACIÓN DE QR CODE
function generateQRCode() {
  const nombre = document.getElementById("nombre").value || "Sin nombre";
  const documento = document.getElementById("documento").value || "Sin documento";
  const fecha = document.getElementById("fecha").value || "Sin fecha";
  const embarcacion = selectedVessel || "Sin embarcación";
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;
  const total = document.getElementById("ticket-total").textContent;

  const qrData = {
    codigo: currentTicketCode,
    pasajero: nombre,
    documento: documento,
    fecha: fecha,
    embarcacion: embarcacion,
    adultos: adultos,
    ninos: ninos,
    total: total,
    reserva: isReservation,
    timestamp: new Date().toISOString(),
    estado: ticketCancelled ? 'ANULADO' : 'ACTIVO'
  };

  const qrString = JSON.stringify(qrData);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrString)}`;

  const qrContainer = document.getElementById("qr-container");
  qrContainer.innerHTML = `
    <img src="${qrUrl}" alt="QR Code" class="qr-code-img" style="width: 64px; height: 64px; border-radius: 6px;"
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
    <div class="qr-placeholder" style="display:none;">Error al generar QR</div>
  `;
}

// FUNCIÓN DE CONTENIDO PARA IMPRESIÓN
function generatePrintContent() {
  const nombre = document.getElementById("ticket-nombre").textContent;
  const documento = document.getElementById("ticket-documento").textContent;
  const fecha = document.getElementById("ticket-fecha").textContent;
  const hora = document.getElementById("ticket-hora").textContent;
  const embarcacion = document.getElementById("ticket-embarcacion").textContent;
  const pasajeros = document.getElementById("ticket-pasajeros").textContent;
  const total = document.getElementById("ticket-total").textContent;
  const codigo = document.getElementById("ticket-codigo").textContent;
  const tipoServicio = document.getElementById("ticket-tipo-servicio").textContent;
  const timestamp = document.getElementById("ticket-timestamp").textContent;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket - ${codigo}</title>
      <style>
        @page { 
          margin: 5mm; 
          size: 80mm auto; 
        }
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 11px; 
          line-height: 1.2;
          width: 100%;
          background: white;
          color: black;
        }
        .ticket-container { 
          width: 100%; 
          padding: 3mm; 
          background: white;
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
          ${ticketCancelled ? 'background: #ffebee; color: #c62828;' : 'background: #e8f5e8; color: #2e7d32;'}
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        <div class="header">
          <div class="title">SISTEMA DE TRANSPORTE FLUVIAL</div>
          <div class="subtitle">Embalse de Guatapé</div>
        </div>
        
        ${ticketCancelled ? '<div class="status">*** TICKET ANULADO ***</div>' : '<div class="status">TICKET VÁLIDO</div>'}
        
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
        
        ${!ticketCancelled ? `
        <div class="total-section">
          <div class="total-label">TOTAL A PAGAR</div>
          <div class="total-amount">${total}</div>
        </div>
        ` : `
        <div class="total-section" style="background: #ffebee;">
          <div class="total-label">TICKET ANULADO</div>
          <div class="total-amount" style="color: #c62828;">SIN VALOR</div>
        </div>
        `}
        
        <div class="footer">
          <div>${ticketCancelled ? '*** TICKET ANULADO ***' : 'CONSERVE ESTE TICKET'}</div>
          <div>Guatapé - Antioquia</div>
          <div>${timestamp}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ===========================
// FUNCIONES DE VALIDACIÓN
// Función para actualizar precios en las cards
// ===========================

function updateVesselCardPrices() {
  const adultos = parseInt(document.getElementById("adultos").value) || 0;
  const ninos = parseInt(document.getElementById("ninos").value) || 0;
  const totalPersonas = adultos + ninos;
  
  if (totalPersonas === 0) return;
  
  // Actualizar cada card
  document.querySelectorAll('.vessel-card').forEach(card => {
    const vesselType = card.dataset.type;
    const priceElement = card.querySelector('.vessel-price');
    let totalPrice = 0;
    let pricePerPerson = 0;
    
    if (isReservation) {
      pricePerPerson = Math.round(10000 / adultos);
      priceElement.textContent = `$${pricePerPerson.toLocaleString()}`;
      return;
    }
    
    switch (vesselType) {
      case 'lancha':
        pricePerPerson = 30000;
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
        
      case 'deportiva':
        if (adultos <= 4) {
          pricePerPerson = Math.round(250000 / adultos);
        } else if (adultos <= 6) {
          pricePerPerson = Math.round(300000 / adultos);
        } else {
          pricePerPerson = 50000;
        }
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
        
      case 'planchon':
        if (adultos <= 10) {
          pricePerPerson = Math.round(350000 / adultos);
        } else if (adultos <= 15) {
          pricePerPerson = Math.round(450000 / adultos);
        } else if (adultos <= 20) {
          pricePerPerson = Math.round(500000 / adultos);
        } else {
          pricePerPerson = 25000;
        }
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
        
      case 'barco':
        if (adultos <= 19) {
          pricePerPerson = 30000;
        } else if (adultos <= 30) {
          pricePerPerson = 25000;
        } else {
          pricePerPerson = 20000;
        }
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
        
      case 'yate':
        if (adultos <= 10) {
          pricePerPerson = Math.round(400000 / adultos);
        } else {
          pricePerPerson = 30000;
        }
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
        
      case 'carguero':
        totalPrice = Math.ceil(adultos / 5) * 200000;
        pricePerPerson = Math.round(totalPrice / adultos);
        priceElement.textContent = `${pricePerPerson.toLocaleString()}`;
        break;
    }
  });
}

// ===========================
// FUNCIONES DE VALIDACIÓN
// ===========================

// Función principal de validación
function validateForm() {
  const errors = [];
  
  // Validar teléfono
  const telefono = document.getElementById("telefono").value;
  if (telefono && !validatePhone(telefono)) {
    errors.push("El teléfono debe tener exactamente 10 dígitos");
  }
  
  // Validar correo
  const email = document.getElementById("emailCliente").value;
  if (email && !validateEmail(email)) {
    errors.push("Ingrese un correo electrónico válido");
  }
  
  // Validar documento
  const documento = document.getElementById("documento").value;
  if (documento && !validateDocument(documento)) {
    errors.push("El documento debe contener solo números");
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// Función para formatear teléfono automáticamente
function formatPhone(value) {
  // Remover todo lo que no sea número
  const numbers = value.replace(/\D/g, '');
  
  // Limitar a 10 dígitos
  const limited = numbers.slice(0, 10);
  
  // Aplicar formato XXX-XXX-XXXX
  if (limited.length >= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else if (limited.length >= 3) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return limited;
  }
}

// Validar teléfono (10 dígitos con o sin guiones)
function validatePhone(phone) {
  // Remover guiones para validar solo números
  const cleanPhone = phone.replace(/-/g, '');
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(cleanPhone);
}

// Validar correo electrónico
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar documento (solo números)
function validateDocument(document) {
  const documentRegex = /^\d+$/;
  return documentRegex.test(document);
}

// Función para mostrar errores de validación
function showValidationErrors(errors) {
  if (errors.length > 0) {
    const errorMessage = errors.join('\n• ');
    showError('Datos incorrectos', `Por favor corrija:\n• ${errorMessage}`);
    return false;
  }
  return true;
}

// Validación en tiempo real para cada campo
function setupFieldValidation() {
  // Validación de teléfono en tiempo real
  document.getElementById("telefono").addEventListener("input", function(e) {
    const value = e.target.value;
    if (value && !validatePhone(value)) {
      e.target.style.borderColor = '#ef4444';
      e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.1)';
    } else {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    }
  });
  
  // Validación de correo en tiempo real
  document.getElementById("emailCliente").addEventListener("input", function(e) {
    const value = e.target.value;
    if (value && !validateEmail(value)) {
      e.target.style.borderColor = '#ef4444';
      e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.1)';
    } else {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    }
  });
  
  // Validación de documento en tiempo real
  document.getElementById("documento").addEventListener("input", function(e) {
    const value = e.target.value;
    if (value && !validateDocument(value)) {
      e.target.style.borderColor = '#ef4444';
      e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.1)';
    } else {
      e.target.style.borderColor = '';
      e.target.style.boxShadow = '';
    }
  });
  
  // Permitir solo números en documento
  document.getElementById("documento").addEventListener("keypress", function(e) {
    if (!/\d/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
  });
  
  // Permitir números y guiones en teléfono
  document.getElementById("telefono").addEventListener("keypress", function(e) {
    if (!/[\d-]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
  });
  
  // Limitar teléfono a máximo 12 caracteres (incluyendo guiones)
  document.getElementById("telefono").addEventListener("input", function(e) {
    if (e.target.value.length > 12) {
      e.target.value = e.target.value.slice(0, 12);
    }
  });
}


function generateTicketWithValidation() {
    // Verificar autenticación primero
    if (typeof window.authManager === 'undefined' || !window.authManager.isUserAuthenticated()) {
        showError('Acceso denegado', 'Debe iniciar sesión para generar tickets');
        return false;
    }

    const nombre = document.getElementById("nombre").value;
    const documento = document.getElementById("documento").value;
    const fecha = document.getElementById("fecha").value;

    // Validar campos obligatorios
    if (!nombre || !documento || !selectedVessel || !fecha) {
        showError('Datos incompletos', 'Complete todos los campos obligatorios: Nombre, Documento, Embarcación y Fecha');
        return false;
    }

    // Validar formato de campos opcionales
    const validation = validateForm();
    if (!validation.isValid) {
        showValidationErrors(validation.errors);
        return false;
    }

    if (ticketCancelled) {
        showError('Error', 'No se puede generar un ticket anulado');
        return false;
    }

    try {
        // Preparar datos del ticket para confirmación
        const ticketData = {
            nombre: nombre,
            documento: documento,
            telefono: document.getElementById("telefono").value || '',
            email: document.getElementById("emailCliente").value || '',
            fecha: fecha,
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }),
            embarcacion: selectedVessel.charAt(0).toUpperCase() + selectedVessel.slice(1),
            adultos: parseInt(document.getElementById("adultos").value) || 0,
            ninos: parseInt(document.getElementById("ninos").value) || 0,
            total: document.getElementById("ticket-total").textContent || '$0',
            tipo_servicio: isReservation ? 'Con Reserva' : 'Nuevo Pasaje'
        };

        // Mostrar modal de confirmación
        if (typeof modalSystem !== 'undefined' && modalSystem.isInitialized) {
            modalSystem.showSaleConfirmationModal(
                ticketData,
                () => processSale(ticketData), // Confirmar
                () => modalSystem.closeModal() // Cancelar
            );
        } else {
            // Fallback sin modal
            if (confirm(`¿Confirmar venta?\n\nPasajero: ${ticketData.nombre}\nTotal: ${ticketData.total}`)) {
                processSale(ticketData);
            }
        }

    } catch (error) {
        console.error('Error preparando venta:', error);
        showError('Error del sistema', 'No se pudo preparar la venta');
        return false;
    }
}


  /**
   * Procesar la venta confirmada con verificaciones mejoradas
   */
  async function processSale(ticketData) {
      let saveAttempted = false;
      let saveSuccessful = false;
      
      try {
          showInfo('Verificando sistema...', 'Comprobando conexiones');

          // VERIFICACIÓN 1: Sistema de autenticación
          if (typeof window.authManager === 'undefined' || !window.authManager.isUserAuthenticated()) {
              throw new Error('Usuario no autenticado');
          }

          // VERIFICACIÓN 2: Sistema de base de datos
          if (typeof window.firebaseDatabase === 'undefined') {
              throw new Error('Sistema de base de datos no cargado');
          }

          // VERIFICACIÓN 3: Estado de conexión
          const dbStatus = window.firebaseDatabase.getConnectionStatus();
          console.log('🔍 Estado de base de datos:', dbStatus);

          if (!dbStatus.isInitialized) {
              showInfo('Inicializando base de datos...', 'Conectando con Firebase');
              
              // Esperar hasta 5 segundos para inicialización
              let waitCount = 0;
              while (!window.firebaseDatabase.isInitialized && waitCount < 50) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                  waitCount++;
              }

              if (!window.firebaseDatabase.isInitialized) {
                  throw new Error('Base de datos no se pudo inicializar');
              }
          }

          if (!dbStatus.isConnected) {
              showInfo('Conectando...', 'Estableciendo conexión con Firebase');
              await window.firebaseDatabase.reconnect();
              
              // Verificar nuevamente
              const newStatus = window.firebaseDatabase.getConnectionStatus();
              if (!newStatus.isConnected) {
                  throw new Error('No se pudo establecer conexión con Firebase');
              }
          }

          showInfo('Procesando venta...', 'Generando ticket y guardando datos');

          // Generar timestamp
          const now = new Date();
          document.getElementById("ticket-timestamp").textContent = 
              `Generado: ${now.toLocaleDateString('es-CO')} ${now.toLocaleTimeString('es-CO')}`;

          // Actualizar campos del ticket en el DOM
          document.getElementById("ticket-hora").textContent = ticketData.hora;

          // Generar QR Code
          generateQRCode();
          
          // INTENTAR GUARDAR EN FIREBASE
          try {
              saveAttempted = true;
              showInfo('Guardando venta...', 'Enviando datos a Firebase');
              
              // Preparar datos para Firebase
              const firebaseData = {
                  codigo: currentTicketCode,
                  nombre: ticketData.nombre,
                  documento: ticketData.documento,
                  telefono: ticketData.telefono,
                  email: ticketData.email,
                  fecha: ticketData.fecha,
                  hora: ticketData.hora,
                  embarcacion: ticketData.embarcacion,
                  adultos: ticketData.adultos,
                  ninos: ticketData.ninos,
                  precio: extractPriceFromTotal(ticketData.total),
                  tipo_servicio: ticketData.tipo_servicio,
                  estado: 'GENERADO',
                  usuario: window.authManager.getCurrentUser()?.email || 'unknown',
                  timestamp_generacion: now.toISOString()
              };

              console.log('📤 Enviando datos a Firebase:', firebaseData);

              // Guardar en Firebase
              const docId = await window.firebaseDatabase.saveVenta(firebaseData);
              
              if (docId) {
                  saveSuccessful = true;
                  console.log('✅ Venta guardada exitosamente con ID:', docId);
                  
                  // MARCAR COMO EXITOSO
                  ticketGenerated = true;
                  updateButtonStates();
                  updateTicketStatus(TICKET_STATES.GENERATED);
                  
                  // Cerrar modal
                  if (typeof modalSystem !== 'undefined') {
                      modalSystem.closeModal();
                  }
                  
                  // Mostrar confirmación con verificación
                  showSuccess(
                      "¡Venta registrada!", 
                      `Ticket ${currentTicketCode} guardado exitosamente (ID: ${docId.substring(0, 8)}...)`
                  );

                  // Verificar que realmente se guardó
                  setTimeout(async () => {
                      try {
                          const verification = await window.firebaseDatabase.searchTicketByCodigo(currentTicketCode);
                          if (verification) {
                              console.log('✅ Verificación exitosa: ticket encontrado en base de datos');
                              showInfo('Verificación exitosa', 'Ticket confirmado en base de datos');
                          } else {
                              console.warn('⚠️ Advertencia: ticket no encontrado en verificación');
                          }
                      } catch (verifyError) {
                          console.warn('⚠️ No se pudo verificar el guardado:', verifyError);
                      }
                  }, 2000);
                  
                  return true;
              } else {
                  throw new Error('No se recibió ID de documento de Firebase');
              }
              
          } catch (firebaseError) {
              console.error('❌ Error guardando en Firebase:', firebaseError);
              throw firebaseError;
          }
          
      } catch (error) {
          console.error('❌ Error procesando venta:', error);
          
          // Determinar tipo de error y mostrar mensaje apropiado
          let errorTitle = 'Error de procesamiento';
          let errorMessage = `No se pudo completar la venta: ${error.message}`;
          
          if (error.message.includes('no cargado')) {
              errorTitle = 'Error del sistema';
              errorMessage = 'El sistema de base de datos no está disponible. Refresque la página y reintente.';
          } else if (error.message.includes('no autenticado')) {
              errorTitle = 'Error de autenticación';
              errorMessage = 'Debe iniciar sesión para realizar ventas';
          } else if (error.message.includes('conexión') || error.message.includes('inicializar')) {
              errorTitle = 'Error de conexión';
              errorMessage = 'No se pudo conectar con la base de datos. Verifique su internet y reintente.';
          } else if (saveAttempted && !saveSuccessful) {
              errorTitle = 'Error de guardado';
              
              if (error.message.includes('permission') || error.message.includes('auth')) {
                  errorMessage = 'Error de permisos. Verifique que esté logueado correctamente.';
              } else if (error.message.includes('network') || error.message.includes('offline')) {
                  errorMessage = 'Error de conexión. Verifique su internet y reintente.';
              }
          }
          
          showError(errorTitle, errorMessage);
          
          // NO marcar el ticket como generado si falló
          ticketGenerated = false;
          updateButtonStates();
          updateTicketStatus(TICKET_STATES.DRAFT);
          
          return false;
      }
  }

  /**
   * Función auxiliar para extraer precio numérico
   */
  function extractPriceFromTotal(totalText) {
      const numbers = totalText.replace(/[^\d]/g, '');
      return parseInt(numbers) || 0;
  }



// ===========================
// 🔗 FUNCIONES DE INTEGRACIÓN CON MODALES
// ===========================

/**
 * Función llamada desde el modal para imprimir directamente
 */
window.printFromModal = function() {
    console.log('🖨️ Imprimiendo desde modal...');
    directPrint();
};

/**
 * Función llamada desde el modal para generar PDF
 */
window.generatePDFFromModal = function(format = 'thermal') {
    console.log('📄 Generando PDF desde modal...', format);
    
    if (typeof generateTicketPDF !== 'undefined') {
        generateTicketPDF(format);
    } else {
        showError('PDF no disponible', 'El generador de PDF no está cargado');
    }
};

/**
 * =====================================================================================================================
 * =====================================================================================================================
 * =====================================================================================================================
 * 🔍 VERIFICACIONES DE GUARDADO
 * ===========================
 */

/**
 * Verificar estado de guardado
 */
async function verifyTicketSaved(ticketCode) {
    if (!ticketCode || typeof window.firebaseDatabase === 'undefined') {
        return false;
    }

    try {
        console.log('🔍 Verificando si el ticket está guardado:', ticketCode);
        const ticket = await window.firebaseDatabase.searchTicketByCodigo(ticketCode);
        
        if (ticket) {
            console.log('✅ Ticket encontrado en base de datos:', ticket);
            return true;
        } else {
            console.log('❌ Ticket NO encontrado en base de datos');
            return false;
        }
    } catch (error) {
        console.error('❌ Error verificando ticket:', error);
        return false;
    }
}

/**
 * Mostrar estado de guardado en tiempo real
 */
function showSaveStatus(success, details = {}) {
    const statusElement = document.getElementById('save-status') || createSaveStatusElement();
    
    if (success) {
        statusElement.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10b981;"></i>
            <span>Guardado en Firebase</span>
            <small>ID: ${details.id || 'N/A'}</small>
        `;
        statusElement.className = 'save-status success';
    } else {
        statusElement.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
            <span>Error de guardado</span>
            <small>${details.error || 'Error desconocido'}</small>
        `;
        statusElement.className = 'save-status error';
    }
    
    // Auto-ocultar después de 5 segundos si es exitoso
    if (success) {
        setTimeout(() => {
            statusElement.style.opacity = '0.5';
        }, 5000);
    }
}

/**
 * Crear elemento de estado de guardado
 */
function createSaveStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'save-status';
    statusElement.className = 'save-status';
    
    // Buscar dónde insertarlo (después del timestamp del ticket)
    const timestampElement = document.getElementById('ticket-timestamp');
    if (timestampElement && timestampElement.parentNode) {
        timestampElement.parentNode.insertBefore(statusElement, timestampElement.nextSibling);
    }
    
    return statusElement;
}

/**
 * ===========================
 * 🔧 FUNCIONES DE DIAGNÓSTICO
 * ===========================
 */

/**
 * Diagnóstico completo del sistema
 */
window.diagnosticSystem = function() {
    console.log('🔍 DIAGNÓSTICO DEL SISTEMA POS');
    console.log('================================');
    
    // Verificar módulos principales
    console.log('📦 MÓDULOS:');
    console.log('  - alertSystem:', typeof window.alertSystem !== 'undefined' ? '✅' : '❌');
    console.log('  - authManager:', typeof window.authManager !== 'undefined' ? '✅' : '❌');
    console.log('  - firebaseDatabase:', typeof window.firebaseDatabase !== 'undefined' ? '✅' : '❌');
    console.log('  - modalSystem:', typeof window.modalSystem !== 'undefined' ? '✅' : '❌');
    console.log('  - pdfGenerator:', typeof window.pdfGenerator !== 'undefined' ? '✅' : '❌');
    
    // Verificar Firebase Database específicamente
    if (typeof window.firebaseDatabase !== 'undefined') {
        const status = window.firebaseDatabase.getConnectionStatus();
        console.log('🔥 FIREBASE DATABASE:');
        console.log('  - Inicializado:', status.isInitialized ? '✅' : '❌');
        console.log('  - Conectado:', status.isConnected ? '✅' : '❌');
        console.log('  - Intentos de reconexión:', status.retryAttempts + '/' + status.maxRetries);
    } else {
        console.log('🔥 FIREBASE DATABASE: ❌ NO DISPONIBLE');
    }
    
    // Verificar autenticación
    if (typeof window.authManager !== 'undefined') {
        console.log('🔐 AUTENTICACIÓN:');
        console.log('  - Usuario logueado:', window.authManager.isUserAuthenticated() ? '✅' : '❌');
        if (window.authManager.getCurrentUser()) {
            console.log('  - Email:', window.authManager.getCurrentUser().email);
        }
    }
    
    console.log('================================');
    
    // Mostrar resultado en pantalla también
    const modules = [
        { name: 'Alertas', available: typeof window.alertSystem !== 'undefined' },
        { name: 'Autenticación', available: typeof window.authManager !== 'undefined' },
        { name: 'Base de datos', available: typeof window.firebaseDatabase !== 'undefined' },
        { name: 'Modales', available: typeof window.modalSystem !== 'undefined' }
    ];
    
    const available = modules.filter(m => m.available).length;
    const total = modules.length;
    
    if (available === total) {
        showSuccess('Sistema completo', `Todos los módulos están disponibles (${available}/${total})`);
    } else {
        showWarning('Sistema incompleto', `Solo ${available}/${total} módulos disponibles`);
    }
};

/**
 * Forzar reconexión de Firebase
 */
window.forceReconnectFirebase = async function() {
    if (typeof window.firebaseDatabase === 'undefined') {
        showError('Error', 'Sistema de base de datos no disponible');
        return;
    }
    
    try {
        showInfo('Reconectando...', 'Reestableciendo conexión con Firebase');
        await window.firebaseDatabase.reconnect();
        
        const status = window.firebaseDatabase.getConnectionStatus();
        if (status.isConnected) {
            showSuccess('Reconectado', 'Conexión con Firebase reestablecida');
        } else {
            showError('Error de reconexión', 'No se pudo reestablecer la conexión');
        }
    } catch (error) {
        showError('Error de reconexión', error.message);
    }
};