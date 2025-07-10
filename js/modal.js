/**
 * Sistema de Modales para Embarcaciones del Guatapé
 * VERSIÓN CON IMPRESIÓN DIRECTA INTEGRADA
 */

class ModalSystem {
  constructor() {
    this.modals = new Map();
    this.isInitialized = false;
    this.currentModal = null;

    this.initializeStyles();
    this.createModalContainer();
    this.setupEventListeners();

    this.isInitialized = true;
    console.log("🎭 Sistema de modales inicializado con impresión directa");
  }

  initializeStyles() {
    const styleId = "modal-system-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            padding: 20px;
            box-sizing: border-box;
        }

        .modal-overlay.show {
            opacity: 1;
            visibility: visible;
        }

        .modal-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 0;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow: hidden;
            transform: scale(0.7) translateY(50px);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: white;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .modal-overlay.show .modal-container {
            transform: scale(1) translateY(0);
        }

        .modal-header {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
            padding: 25px 30px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            position: relative;
        }

        .modal-icon {
            font-size: 3em;
            margin-bottom: 15px;
            display: block;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            animation: modalIconPulse 2s ease-in-out infinite;
        }

        .modal-icon i {
            font-size: inherit;
            color: inherit;
        }

        @keyframes modalIconPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        .modal-title {
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .modal-subtitle {
            font-size: 1em;
            color: rgba(255, 255, 255, 0.8);
            margin: 0;
        }

        .modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 24px;
            cursor: pointer;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            transform: rotate(90deg);
        }

        .modal-body {
            padding: 30px;
            text-align: center;
        }

        .modal-message {
            font-size: 1.1em;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 25px;
        }

        .modal-printer-info {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 15px;
            padding: 15px;
            margin: 15px 0;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .modal-printer-name {
            font-size: 1.1em;
            font-weight: bold;
            color: #a78bfa;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .modal-printer-status {
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.7);
        }

        .modal-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
            flex-wrap: wrap;
        }

        .modal-btn {
            padding: 12px 25px;
            border: none;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            min-width: 140px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .modal-btn i {
            font-size: 1.1em;
        }

        .modal-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .modal-btn:hover::before {
            left: 100%;
        }

        .modal-btn-primary {
            background: linear-gradient(45deg, #8b5cf6, #7c3aed);
            color: white;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .modal-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }

        .modal-btn-secondary {
            background: linear-gradient(45deg, #00ff88, #00cc6a);
            color: white;
            box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }

        .modal-btn-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
        }

        .modal-btn-danger {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }

        .modal-btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }

        .modal-btn-warning {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .modal-btn-warning:hover {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
        }

        .modal-footer {
            background: rgba(0, 0, 0, 0.1);
            padding: 20px 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.6);
        }

        /* Colores especiales para iconos */
        .modal-icon.success-icon {
            color: #00ff88;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }

        .modal-icon.error-icon {
            color: #ff6b6b;
            text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
        }

        .modal-icon.warning-icon {
            color: #f39c12;
            text-shadow: 0 0 20px rgba(243, 156, 18, 0.5);
        }

        .modal-icon.info-icon {
            color: #3498db;
            text-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
        }

        .modal-icon.print-icon {
            color: #9b59b6;
            text-shadow: 0 0 20px rgba(155, 89, 182, 0.5);
        }

        .modal-icon.direct-print-icon {
            color: #8b5cf6;
            text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }

        @media (max-width: 768px) {
            .modal-container {
                margin: 10px;
                max-width: calc(100vw - 20px);
            }

            .modal-header {
                padding: 20px;
            }

            .modal-body {
                padding: 20px;
            }

            .modal-actions {
                flex-direction: column;
            }

            .modal-btn {
                width: 100%;
                font-size: 14px;
                padding: 10px 20px;
                min-width: auto;
            }

            .modal-title {
                font-size: 1.5em;
            }

            .modal-icon {
                font-size: 2.5em;
            }
        }
    `;

    document.head.appendChild(style);
  }

  createModalContainer() {
    this.overlay = document.createElement("div");
    this.overlay.className = "modal-overlay";
    this.overlay.id = "modal-overlay";
    document.body.appendChild(this.overlay);
  }

  setupEventListeners() {
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentModal) {
        this.closeModal();
      }
    });
  }

  /**
   * ===========================
   * 🖨️ MODAL DE OPCIONES DE IMPRESIÓN MEJORADO
   * ===========================
   */
  showPrintOptionsModal() {
    // Verificar si hay un ticket válido
    if (
      typeof ticketGenerated === "undefined" ||
      !ticketGenerated ||
      (typeof ticketCancelled !== "undefined" && ticketCancelled)
    ) {
      this.showErrorModal(
        "Error de impresión",
        "Debe generar un ticket válido antes de imprimir"
      );
      return;
    }

    console.log('🎭 Abriendo modal de opciones de impresión...');

    // Verificar si la impresión directa está disponible
    const directPrintAvailable = typeof printingAvailable !== 'undefined' && printingAvailable;
    const selectedPrinterName = typeof selectedPrinter !== 'undefined' ? selectedPrinter : 'Sin seleccionar';

    let actions = [];

    // Si la impresión directa está disponible, mostrarla como opción principal
    if (directPrintAvailable) {
      actions.push({
        text: '<i class="fas fa-print"></i> Impresión Directa',
        type: "primary",
        action: () => this.handleDirectPrint(),
      });
    }

    // Opciones de PDF
    actions.push({
      text: '<i class="fas fa-file-pdf"></i> Descargar PDF',
      type: "secondary",
      action: () => this.handlePDFDownload(),
    });

    // Impresión web tradicional (si no hay directa disponible)
    if (!directPrintAvailable) {
      actions.push({
        text: '<i class="fas fa-print"></i> Impresora Web',
        type: "warning",
        action: () => this.handleWebPrint(),
      });
    }

    // Cancelar
    actions.push({
      text: '<i class="fas fa-times"></i> Cancelar',
      type: "danger",
      action: () => this.closeModal(),
    });

    const modal = this.createModal("print-options", {
      icon: '<i class="fas fa-print"></i>',
      iconClass: directPrintAvailable ? 'direct-print-icon' : 'print-icon',
      title: "Opciones de Impresión",
      subtitle: directPrintAvailable ? "Impresión directa disponible" : "Seleccione el método de impresión",
      message: directPrintAvailable 
        ? `Elija cómo desea imprimir su ticket de embarcación:` 
        : "Elija cómo desea imprimir su ticket de embarcación:",
      printerInfo: directPrintAvailable ? {
        name: selectedPrinterName,
        status: "Lista para imprimir"
      } : null,
      actions: actions,
      animation: "normal",
    });

    this.showModal(modal);
  }

  /**
   * Manejar impresión directa
   */
  handleDirectPrint() {
    console.log('🖨️ Manejando impresión directa desde modal...');
    this.closeModal();
    
    // Verificar si la función de impresión directa está disponible
    if (typeof directPrintTicket !== 'undefined') {
      directPrintTicket();
    } else if (typeof printFromModal !== 'undefined') {
      printFromModal();
    } else {
      this.showErrorModal("Error", "Función de impresión directa no disponible");
    }
  }

  /**
   * Manejar impresión web tradicional
   */
  handleWebPrint() {
    console.log('🖨️ Manejando impresión web desde modal...');
    this.closeModal();
    
    if (typeof directPrint !== 'undefined') {
      directPrint();
    } else if (typeof printFromModal !== 'undefined') {
      printFromModal();
    } else {
      this.executeWebPrint();
    }
  }

  /**
   * Ejecutar impresión web manual
   */
  executeWebPrint() {
    try {
      if (typeof generatePrintContent !== 'undefined') {
        const printContent = generatePrintContent();
        const printWindow = window.open('', '_blank', 'width=400,height=700');
        
        if (!printWindow) {
          if (typeof showError !== 'undefined') {
            showError('Error de ventana', 'No se pudo abrir la ventana de impresión');
          }
          return;
        }
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.onafterprint = () => {
              printWindow.close();
              if (typeof showSuccess !== 'undefined') {
                showSuccess("¡Ticket impreso!", "Ticket enviado a la impresora exitosamente");
              }
            };
          }, 500);
        };
      } else {
        if (typeof showError !== 'undefined') {
          showError('Error', 'Función de impresión no disponible');
        }
      }
    } catch (error) {
      console.error('Error en impresión web:', error);
      if (typeof showError !== 'undefined') {
        showError('Error de impresión', 'No se pudo completar la impresión');
      }
    }
  }

  /**
   * Manejar descarga de PDF
   */
  handlePDFDownload() {
    console.log('📄 Manejando descarga de PDF...');
    this.showPDFFormatSelectionModal();
  }

  /**
   * Modal para seleccionar formato de PDF (MEJORADO)
   */
  showPDFFormatSelectionModal() {
    const modal = this.createModal("pdf-format", {
      icon: '<i class="fas fa-file-pdf"></i>',
      iconClass: 'info-icon',
      title: "Formato de PDF",
      subtitle: "Seleccione el formato de descarga",
      message: "Elija el formato de PDF que desea descargar:",
      actions: [
        {
          text: '<i class="fas fa-receipt"></i> PDF Térmico (80mm)',
          type: "primary",
          action: () => this.downloadPDF("thermal"),
        },
        {
          text: '<i class="fas fa-file-alt"></i> PDF Estándar (A4)',
          type: "secondary",
          action: () => this.downloadPDF("standard"),
        },
        {
          text: '<i class="fas fa-compress-alt"></i> PDF Compacto (A5)',
          type: "warning",
          action: () => this.downloadPDF("compact"),
        },
        {
          text: '<i class="fas fa-arrow-left"></i> Volver',
          type: "danger",
          action: () => this.showPrintOptionsModal(),
        },
      ],
      animation: "normal",
    });

    this.showModal(modal);
  }

  /**
   * Descargar PDF en formato específico
   */
  async downloadPDF(format) {
    console.log(`📄 Iniciando descarga PDF en formato: ${format}`);
    
    this.closeModal();

    try {
      if (typeof showInfo !== 'undefined') {
        showInfo("Generando PDF...", `Creando archivo en formato ${format}`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      let success = false;

      if (typeof generateTicketPDF !== 'undefined') {
        console.log('📄 Usando generateTicketPDF global');
        success = await generateTicketPDF(format);
      }
      else if (typeof pdfGenerator !== 'undefined' && pdfGenerator.generateTicketPDF) {
        console.log('📄 Usando pdfGenerator object');
        success = await pdfGenerator.generateTicketPDF(format);
      }
      else if (typeof generatePDFFromModal !== 'undefined') {
        console.log('📄 Usando generatePDFFromModal');
        success = await generatePDFFromModal(format);
      }
      else {
        console.log('📄 Intentando crear PDF manualmente...');
        success = await this.createPDFManually(format);
      }

      if (success) {
        if (typeof showPDFMessage !== 'undefined') {
          showPDFMessage("¡PDF generado!", "Archivo descargado exitosamente", true);
        } else if (typeof showSuccess !== 'undefined') {
          showSuccess("¡PDF generado!", "Archivo descargado exitosamente");
        }
        console.log('✅ PDF generado exitosamente');
      } else {
        throw new Error('No se pudo generar el PDF');
      }

    } catch (error) {
      console.error("❌ Error generando PDF:", error);
      
      if (typeof showError !== 'undefined') {
        showError("Error PDF", `No se pudo generar el archivo PDF: ${error.message}`);
      }
    }
  }

  /**
   * Crear PDF manualmente como último recurso
   */
  async createPDFManually(format) {
    try {
      if (typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF no está disponible');
      }

      console.log('📄 Creando PDF manualmente...');
      
      const ticketData = this.getTicketDataFromDOM();
      if (!this.validateTicketData(ticketData)) {
        throw new Error('Datos de ticket incompletos');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('EMBARCACIONES DE GUATAPÉ', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Código: ${ticketData.codigo}`, 20, 40);
      doc.text(`Pasajero: ${ticketData.nombre}`, 20, 50);
      doc.text(`Documento: ${ticketData.documento}`, 20, 60);
      doc.text(`Fecha: ${ticketData.fecha}`, 20, 70);
      doc.text(`Embarcación: ${ticketData.embarcacion}`, 20, 80);
      doc.text(`Total: ${ticketData.total}`, 20, 90);
      
      doc.save(`ticket-${ticketData.codigo}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Error creando PDF manualmente:', error);
      return false;
    }
  }

  /**
   * Obtener datos del ticket desde el DOM
   */
  getTicketDataFromDOM() {
    return {
      codigo: document.getElementById('ticket-codigo')?.textContent || 'N/A',
      nombre: document.getElementById('ticket-nombre')?.textContent || 'N/A',
      documento: document.getElementById('ticket-documento')?.textContent || 'N/A',
      fecha: document.getElementById('ticket-fecha')?.textContent || 'N/A',
      embarcacion: document.getElementById('ticket-embarcacion')?.textContent || 'N/A',
      total: document.getElementById('ticket-total')?.textContent || '$0',
    };
  }

  /**
   * Validar datos del ticket
   */
  validateTicketData(ticketData) {
    const requiredFields = ['codigo', 'nombre', 'documento', 'fecha', 'embarcacion'];
    
    for (const field of requiredFields) {
      if (!ticketData[field] || ticketData[field] === 'N/A' || ticketData[field] === '-') {
        console.warn(`Campo requerido faltante: ${field}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Modal de error personalizado
   */
  showErrorModal(title, message) {
    const modal = this.createModal("error", {
      icon: '<i class="fas fa-exclamation-triangle"></i>',
      iconClass: 'error-icon',
      title: title,
      subtitle: "Error del sistema",
      message: message,
      actions: [
        {
          text: '<i class="fas fa-check"></i> Entendido',
          type: "primary",
          action: () => this.closeModal(),
        },
      ],
      animation: "warning",
    });

    this.showModal(modal);
  }

  /**
   * Crear estructura HTML del modal (ACTUALIZADO PARA IMPRESIÓN DIRECTA)
   */
  createModal(id, options) {
    const {
      icon = '<i class="fas fa-info-circle"></i>',
      iconClass = '',
      title = "Título",
      subtitle = "",
      message = "",
      printerInfo = null,
      actions = [],
      autoClose = null,
      animation = "normal",
      showProgress = false,
    } = options;

    const modalHTML = `
            <div class="modal-container ${
              animation ? `modal-${animation}-animation` : ""
            }">
                <div class="modal-header">
                    <button class="modal-close" onclick="modalSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    <span class="modal-icon ${iconClass}">${icon}</span>
                    <h2 class="modal-title">${title}</h2>
                    ${
                      subtitle
                        ? `<p class="modal-subtitle">${subtitle}</p>`
                        : ""
                    }
                </div>
                
                <div class="modal-body">
                    <div class="modal-message">${message}</div>
                    
                    ${
                      printerInfo
                        ? `
                        <div class="modal-printer-info">
                            <div class="modal-printer-name">
                                <i class="fas fa-print"></i> ${printerInfo.name}
                            </div>
                            <div class="modal-printer-status">
                                <i class="fas fa-circle" style="color: #00ff88;"></i> ${printerInfo.status}
                            </div>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      showProgress
                        ? `
                        <div class="modal-progress">
                            <div class="modal-progress-bar" id="modal-progress-${id}"></div>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      actions.length > 0
                        ? `
                        <div class="modal-actions">
                            ${actions
                              .map(
                                (action, index) => `
                                <button class="modal-btn modal-btn-${action.type}" 
                                        onclick="modalSystem.executeAction('${id}', ${index})">
                                    ${action.text}
                                </button>
                            `
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                </div>
                
                <div class="modal-footer">
                    <i class="fas fa-ship"></i> Embarcaciones del Guatapé - Sistema Seguro
                </div>
            </div>
        `;

    this.modals.set(id, { actions, autoClose, showProgress });
    return { id, html: modalHTML, options };
  }

  showModal(modal) {
    this.currentModal = modal.id;
    this.overlay.innerHTML = modal.html;

    setTimeout(() => {
      this.overlay.classList.add("show");
    }, 50);

    const modalData = this.modals.get(modal.id);
    if (modalData.autoClose) {
      this.setupAutoClose(modal.id, modalData.autoClose);
    }

    if (modalData.showProgress && modalData.autoClose) {
      this.setupProgressBar(modal.id, modalData.autoClose);
    }
  }

  closeModal() {
    if (!this.currentModal) return;

    console.log('🎭 Cerrando modal:', this.currentModal);
    this.overlay.classList.remove("show");

    setTimeout(() => {
      this.overlay.innerHTML = "";
      this.currentModal = null;
      console.log('🎭 Modal cerrado completamente');
    }, 300);
  }

  executeAction(modalId, actionIndex) {
    const modalData = this.modals.get(modalId);
    if (modalData && modalData.actions[actionIndex]) {
      const action = modalData.actions[actionIndex].action;
      if (typeof action === "function") {
        console.log(`🎭 Ejecutando acción ${actionIndex} del modal ${modalId}`);
        action();
      }
    }
  }

  setupAutoClose(modalId, delay) {
    setTimeout(() => {
      if (this.currentModal === modalId) {
        this.closeModal();
      }
    }, delay);
  }

  setupProgressBar(modalId, duration) {
    const progressBar = document.getElementById(`modal-progress-${modalId}`);
    if (!progressBar) return;

    let progress = 0;
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      progress += increment;
      progressBar.style.width = `${Math.min(progress, 100)}%`;

      if (progress >= 100) {
        clearInterval(timer);
      }
    }, interval);
  }

  isModalOpen() {
    return this.currentModal !== null;
  }

  getCurrentModal() {
    return this.currentModal;
  }

  // Funciones heredadas del sistema original
  showWelcomeModal(userEmail) {
    const modal = this.createModal("welcome", {
      icon: '<i class="fas fa-party-horn"></i>',
      iconClass: 'success-icon',
      title: "¡Bienvenido!",
      subtitle: "Inicio de sesión exitoso", 
      message: "Has iniciado sesión correctamente en el sistema de venta de pasajes.",
      userEmail: userEmail,
      autoClose: 3000,
      animation: "success",
    });

    this.showModal(modal);
  }

  showLogoutConfirmModal(userEmail, onConfirm, onCancel) {
    const modal = this.createModal("logout-confirm", {
      icon: '<i class="fas fa-sign-out-alt"></i>',
      iconClass: 'warning-icon',
      title: "Cerrar Sesión",
      subtitle: "Confirmación requerida",
      message: "¿Está seguro que desea cerrar su sesión actual?",
      userEmail: userEmail,
      actions: [
        {
          text: '<i class="fas fa-times"></i> Cancelar',
          type: "warning",
          action: onCancel || (() => this.closeModal()),
        },
        {
          text: '<i class="fas fa-sign-out-alt"></i> Cerrar Sesión',
          type: "danger",
          action: onConfirm || (() => this.closeModal()),
        },
      ],
      animation: "warning",
    });

    this.showModal(modal);
  }

  showGoodbyeModal() {
    const modal = this.createModal("goodbye", {
      icon: '<i class="fas fa-hand-wave"></i>',
      iconClass: 'success-icon',
      title: "Hasta Pronto",
      subtitle: "Sesión cerrada exitosamente",
      message: "Tu sesión ha sido cerrada de forma segura. Gracias por usar nuestro sistema.",
      autoClose: 2500,
      animation: "success",
      showProgress: true,
    });

    this.showModal(modal);
  }
}

// ===========================
// 🚀 INICIALIZACIÓN GLOBAL
// ===========================

const modalSystem = new ModalSystem();

// Exponer funciones globales
window.modalSystem = modalSystem;

window.showWelcomeModal = (userEmail) => {
  modalSystem.showWelcomeModal(userEmail);
};

window.showLogoutConfirmModal = (userEmail, onConfirm, onCancel) => {
  modalSystem.showLogoutConfirmModal(userEmail, onConfirm, onCancel);
};

window.showGoodbyeModal = () => {
  modalSystem.showGoodbyeModal();
};

window.closeModal = () => {
  modalSystem.closeModal();
};

// ===========================
// 📖 DOCUMENTACIÓN ACTUALIZADA
// ===========================

/*
SISTEMA DE MODALES CON IMPRESIÓN DIRECTA INTEGRADA:

NUEVAS CARACTERÍSTICAS:
✅ Detección automática de impresión directa disponible
✅ Modal de opciones priorizando impresión directa
✅ Información de impresora seleccionada en el modal
✅ Fallback a impresión web si directa no disponible
✅ Botones reorganizados según disponibilidad
✅ Iconos específicos para impresión directa

PRIORIDAD DE OPCIONES:
1. Impresión Directa (si está disponible) - Botón principal púrpura
2. Descargar PDF - Botón secundario verde
3. Impresión Web (si directa no disponible) - Botón de advertencia
4. Cancelar - Botón de peligro

ICONOS Y COLORES:
- Impresión Directa: fas fa-print (púrpura #8b5cf6)
- PDF: fas fa-file-pdf (verde #00ff88)
- Impresión Web: fas fa-print (gris)
- Estado impresora: fas fa-circle (verde para activa)

FLUJO DE IMPRESIÓN:
1. Modal detecta si printingAvailable está definido y es true
2. Si disponible: muestra info de impresora y botón principal
3. Si no disponible: muestra opciones tradicionales
4. Ejecuta la función apropiada según selección

COMPATIBILIDAD:
- Totalmente compatible con versión anterior
- Mejora automáticamente si impresión directa disponible
- Fallback completo a funcionalidad existente

El sistema se adapta dinámicamente a las capacidades disponibles
sin romper la funcionalidad existente.
*/