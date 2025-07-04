/**
 * Sistema de Impresión Térmica para Embarcaciones del Guatapé
 * Módulo especializado para impresoras térmicas de tickets
 * 
 * Funcionalidades:
 * - Formateo específico para impresoras térmicas de 80mm
 * - Comandos ESC/POS para control de impresora
 * - Generación automática de layout optimizado
 * - Integración con sistema de alertas
 * - Soporte para QR codes
 * - Backup con impresión estándar del navegador
 * 
 * Compatibilidad:
 * - Impresoras térmicas ESC/POS (80mm)
 * - Navegadores modernos con Web Serial API
 * - Fallback a impresión estándar
 */

class ThermalPrinter {
    constructor() {
        this.port = null;
        this.writer = null;
        this.isConnected = false;
        this.isInitialized = false;
        this.printerCommands = this.initializePrinterCommands();
        
        this.init();
    }

    /**
     * Inicializar el sistema de impresión térmica
     */
    init() {
        this.checkWebSerialSupport();
        this.addPrintStyles();
        this.isInitialized = true;
        
        console.log('🖨️ Módulo de impresión térmica inicializado');
        this.showMessage('info', 'Sistema de impresión', 'Módulo térmico listo para usar');
    }

    /**
     * Verificar soporte para Web Serial API
     */
    checkWebSerialSupport() {
        if ('serial' in navigator) {
            console.log('✅ Web Serial API soportada');
            return true;
        } else {
            console.log('⚠️ Web Serial API no soportada, usando fallback');
            this.showMessage('warning', 'Compatibilidad limitada', 'Usando impresión estándar del navegador');
            return false;
        }
    }

    /**
     * Comandos ESC/POS para impresoras térmicas
     */
    initializePrinterCommands() {
        return {
            // Comandos básicos
            ESC: '\x1B',
            GS: '\x1D',
            
            // Inicialización
            INIT: '\x1B@',
            
            // Texto
            NORMAL: '\x1B!\x00',
            BOLD: '\x1B!\x08',
            DOUBLE_HEIGHT: '\x1B!\x10',
            DOUBLE_WIDTH: '\x1B!\x20',
            LARGE: '\x1B!\x30',
            
            // Alineación
            ALIGN_LEFT: '\x1Ba\x00',
            ALIGN_CENTER: '\x1Ba\x01',
            ALIGN_RIGHT: '\x1Ba\x02',
            
            // Corte de papel
            CUT: '\x1DVA\x03',
            PARTIAL_CUT: '\x1DVB\x03',
            
            // Alimentación de papel
            FEED_LINE: '\n',
            FEED_LINES: (n) => '\x1Bd' + String.fromCharCode(n),
            
            // QR Code
            QR_MODEL: '\x1D(k\x04\x00\x31\x41\x32\x00',
            QR_SIZE: (size) => '\x1D(k\x03\x00\x31\x43' + String.fromCharCode(size),
            QR_ERROR_CORRECTION: '\x1D(k\x03\x00\x31\x45\x30',
            QR_STORE: (data) => {
                const dataLength = data.length + 3;
                const pL = dataLength % 256;
                const pH = Math.floor(dataLength / 256);
                return '\x1D(k' + String.fromCharCode(pL) + String.fromCharCode(pH) + '\x31\x50\x30' + data;
            },
            QR_PRINT: '\x1D(k\x03\x00\x31\x51\x30',
            
            // Código de barras
            BARCODE_HEIGHT: (height) => '\x1Dh' + String.fromCharCode(height),
            BARCODE_WIDTH: (width) => '\x1Dw' + String.fromCharCode(width),
            
            // Separadores
            SEPARATOR: '--------------------------------',
            DOUBLE_SEPARATOR: '================================'
        };
    }

    /**
     * Conectar con impresora térmica vía Web Serial
     */
    async connectThermalPrinter() {
        if (!('serial' in navigator)) {
            this.showMessage('error', 'No compatible', 'Web Serial API no disponible');
            return false;
        }

        try {
            this.showMessage('info', 'Conectando...', 'Seleccione su impresora térmica');
            
            // Solicitar puerto serial
            this.port = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x04b8, usbProductId: 0x0202 }, // Epson
                    { usbVendorId: 0x0483, usbProductId: 0x5740 }, // Generic
                    { usbVendorId: 0x6868, usbProductId: 0x0100 }, // GOOJPRT
                ]
            });

            // Abrir conexión
            await this.port.open({ 
                baudRate: 9600,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            this.writer = this.port.writable.getWriter();
            this.isConnected = true;
            
            // Inicializar impresora
            await this.sendCommand(this.printerCommands.INIT);
            
            this.showMessage('success', '¡Conectado!', 'Impresora térmica lista para usar');
            console.log('🖨️ Impresora térmica conectada');
            
            return true;
            
        } catch (error) {
            console.error('Error conectando impresora:', error);
            this.showMessage('error', 'Error de conexión', 'No se pudo conectar con la impresora térmica');
            return false;
        }
    }

    /**
     * Desconectar impresora térmica
     */
    async disconnectThermalPrinter() {
        try {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            this.showMessage('info', 'Desconectado', 'Impresora térmica desconectada');
            console.log('🖨️ Impresora térmica desconectada');
            
        } catch (error) {
            console.error('Error desconectando impresora:', error);
        }
    }

    /**
     * Enviar comando a la impresora
     */
    async sendCommand(command) {
        if (!this.isConnected || !this.writer) {
            throw new Error('Impresora no conectada');
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(command);
        await this.writer.write(data);
    }

    /**
     * Imprimir ticket en impresora térmica
     */
    async printThermalTicket(ticketData) {
        // Intentar impresión térmica primero
        if (await this.tryThermalPrint(ticketData)) {
            return true;
        }
        
        // Fallback a impresión estándar
        return this.printStandardTicket(ticketData);
    }

    /**
     * Intentar impresión térmica directa
     */
    async tryThermalPrint(ticketData) {
        try {
            if (!this.isConnected) {
                const connected = await this.connectThermalPrinter();
                if (!connected) return false;
            }

            this.showMessage('info', 'Imprimiendo...', 'Enviando ticket a impresora térmica');

            // Generar contenido del ticket
            const ticketContent = this.generateThermalTicketContent(ticketData);
            
            // Enviar a impresora
            await this.sendCommand(ticketContent);
            
            // Cortar papel
            await this.sendCommand(this.printerCommands.FEED_LINES(3));
            await this.sendCommand(this.printerCommands.CUT);
            
            this.showMessage('success', '¡Impreso!', 'Ticket impreso en impresora térmica');
            return true;
            
        } catch (error) {
            console.error('Error en impresión térmica:', error);
            this.showMessage('warning', 'Error térmico', 'Usando impresión estándar');
            return false;
        }
    }

    /**
     * Generar contenido formatado para impresora térmica
     */
    generateThermalTicketContent(ticketData) {
        const cmd = this.printerCommands;
        let content = '';

        // Inicializar impresora
        content += cmd.INIT;
        
        // Encabezado
        content += cmd.ALIGN_CENTER + cmd.BOLD + cmd.DOUBLE_HEIGHT;
        content += '🚢 EMBARCACIONES\n';
        content += 'DEL GUATAPE\n';
        content += cmd.NORMAL + cmd.ALIGN_CENTER;
        content += 'Sistema de Pasajes\n';
        content += cmd.SEPARATOR + '\n';
        
        // Información del ticket
        content += cmd.ALIGN_LEFT + cmd.NORMAL;
        content += `TICKET: ${ticketData.codigo}\n`;
        content += `FECHA: ${new Date().toLocaleDateString()}\n`;
        content += `HORA: ${new Date().toLocaleTimeString()}\n`;
        content += cmd.SEPARATOR + '\n';
        
        // Datos del pasajero
        content += cmd.BOLD + 'PASAJERO:\n' + cmd.NORMAL;
        content += `${ticketData.nombre}\n`;
        content += `DOC: ${ticketData.documento}\n`;
        if (ticketData.telefono) {
            content += `TEL: ${ticketData.telefono}\n`;
        }
        content += cmd.SEPARATOR + '\n';
        
        // Detalles del viaje
        content += cmd.BOLD + 'VIAJE:\n' + cmd.NORMAL;
        content += `FECHA: ${ticketData.fecha}\n`;
        content += `HORA: ${ticketData.hora}\n`;
        content += `EMBARCACION: ${ticketData.embarcacion}\n`;
        content += `PASAJEROS: ${ticketData.adultos}A`;
        if (ticketData.ninos > 0) {
            content += ` + ${ticketData.ninos}N`;
        }
        content += '\n';
        content += cmd.SEPARATOR + '\n';
        
        // Total
        content += cmd.ALIGN_CENTER + cmd.BOLD + cmd.DOUBLE_WIDTH;
        content += 'TOTAL A PAGAR\n';
        content += cmd.LARGE;
        content += `$${ticketData.total}\n`;
        content += cmd.NORMAL + cmd.ALIGN_LEFT;
        content += cmd.SEPARATOR + '\n';
        
        // QR Code (si está disponible)
        if (ticketData.qrData) {
            content += cmd.ALIGN_CENTER;
            content += 'CODIGO QR:\n';
            content += cmd.QR_MODEL;
            content += cmd.QR_SIZE(6);
            content += cmd.QR_ERROR_CORRECTION;
            content += cmd.QR_STORE(JSON.stringify({
                codigo: ticketData.codigo,
                pasajero: ticketData.nombre,
                documento: ticketData.documento,
                fecha: ticketData.fecha,
                hora: ticketData.hora,
                total: ticketData.total
            }));
            content += cmd.QR_PRINT;
            content += '\n';
        }
        
        // Pie de página
        content += cmd.ALIGN_CENTER + cmd.NORMAL;
        content += cmd.SEPARATOR + '\n';
        content += 'CONSERVE ESTE TICKET\n';
        content += 'Embalse del Guatape\n';
        content += 'Antioquia - Colombia\n';
        content += `${new Date().toLocaleString()}\n`;
        content += cmd.DOUBLE_SEPARATOR + '\n';
        
        return content;
    }

    /**
     * Obtener datos del ticket desde el DOM
     */
    getTicketDataFromDOM() {
        return {
            codigo: document.getElementById('ticket-codigo')?.textContent || 'N/A',
            nombre: document.getElementById('ticket-nombre')?.textContent || 'N/A',
            documento: document.getElementById('ticket-documento')?.textContent || 'N/A',
            telefono: document.getElementById('telefono')?.value || '',
            fecha: document.getElementById('ticket-fecha')?.textContent || 'N/A',
            hora: document.getElementById('ticket-hora')?.textContent || 'N/A',
            embarcacion: document.getElementById('ticket-embarcacion')?.textContent || 'N/A',
            adultos: parseInt(document.getElementById('adultos')?.value) || 0,
            ninos: parseInt(document.getElementById('ninos')?.value) || 0,
            total: document.getElementById('ticket-total')?.textContent || '$0',
            qrData: true // Activar QR por defecto
        };
    }

    /**
     * Imprimir usando el sistema estándar del navegador (fallback)
     */
    printStandardTicket(ticketData) {
        try {
            this.showMessage('info', 'Impresión estándar', 'Usando impresora del sistema');
            
            // Crear ventana de impresión optimizada
            const printWindow = window.open('', '_blank', 'width=400,height=600');
            const printContent = this.generateStandardPrintContent(ticketData);
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Esperar a que cargue y imprimir
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    setTimeout(() => {
                        printWindow.close();
                        this.showMessage('success', 'Ticket enviado', 'Revise su impresora');
                    }, 1000);
                }, 500);
            };
            
            return true;
            
        } catch (error) {
            console.error('Error en impresión estándar:', error);
            this.showMessage('error', 'Error de impresión', 'No se pudo imprimir el ticket');
            return false;
        }
    }

    /**
     * Generar contenido HTML optimizado para impresión estándar
     */
    generateStandardPrintContent(ticketData) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Ticket - ${ticketData.codigo}</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        margin: 0;
                        padding: 10mm;
                        width: 80mm;
                        max-width: 80mm;
                        font-size: 12px;
                        line-height: 1.3;
                        color: black;
                        background: white;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px dashed black;
                        padding-bottom: 5mm;
                        margin-bottom: 5mm;
                    }
                    .title {
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 2mm;
                    }
                    .subtitle {
                        font-size: 10px;
                        margin-bottom: 2mm;
                    }
                    .section {
                        margin-bottom: 4mm;
                        padding-bottom: 2mm;
                        border-bottom: 1px dashed #666;
                    }
                    .label {
                        font-weight: bold;
                        display: inline-block;
                        width: 35mm;
                    }
                    .value {
                        display: inline-block;
                    }
                    .total-section {
                        text-align: center;
                        background: #f0f0f0;
                        padding: 3mm;
                        margin: 3mm 0;
                        border: 1px solid black;
                    }
                    .total-amount {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .qr-section {
                        text-align: center;
                        margin: 3mm 0;
                    }
                    .footer {
                        text-align: center;
                        font-size: 8px;
                        margin-top: 5mm;
                        padding-top: 3mm;
                        border-top: 1px dashed black;
                    }
                    .separator {
                        text-align: center;
                        margin: 2mm 0;
                        font-weight: bold;
                    }
                    @media print {
                        body { margin: 0; padding: 5mm; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">🚢 EMBARCACIONES DEL GUATAPÉ</div>
                    <div class="subtitle">Sistema de Pasajes</div>
                </div>

                <div class="section">
                    <div><span class="label">TICKET:</span> <span class="value">${ticketData.codigo}</span></div>
                    <div><span class="label">FECHA:</span> <span class="value">${new Date().toLocaleDateString()}</span></div>
                    <div><span class="label">HORA:</span> <span class="value">${new Date().toLocaleTimeString()}</span></div>
                </div>

                <div class="section">
                    <div class="separator">PASAJERO</div>
                    <div><span class="label">NOMBRE:</span> <span class="value">${ticketData.nombre}</span></div>
                    <div><span class="label">DOCUMENTO:</span> <span class="value">${ticketData.documento}</span></div>
                    ${ticketData.telefono ? `<div><span class="label">TELÉFONO:</span> <span class="value">${ticketData.telefono}</span></div>` : ''}
                </div>

                <div class="section">
                    <div class="separator">DETALLES DEL VIAJE</div>
                    <div><span class="label">FECHA:</span> <span class="value">${ticketData.fecha}</span></div>
                    <div><span class="label">HORA:</span> <span class="value">${ticketData.hora}</span></div>
                    <div><span class="label">EMBARCACIÓN:</span> <span class="value">${ticketData.embarcacion}</span></div>
                    <div><span class="label">PASAJEROS:</span> <span class="value">${ticketData.adultos} adultos${ticketData.ninos > 0 ? `, ${ticketData.ninos} niños` : ''}</span></div>
                </div>

                <div class="total-section">
                    <div>TOTAL A PAGAR</div>
                    <div class="total-amount">${ticketData.total}</div>
                </div>

                <div class="qr-section">
                    <div style="font-size: 10px;">CÓDIGO QR</div>
                    <div style="border: 1px solid #ccc; width: 30mm; height: 30mm; margin: 2mm auto; display: flex; align-items: center; justify-content: center; font-size: 8px;">
                        QR CODE<br>PLACEHOLDER
                    </div>
                </div>

                <div class="footer">
                    <div>CONSERVE ESTE TICKET</div>
                    <div>Embalse del Guatapé</div>
                    <div>Antioquia - Colombia</div>
                    <div>${new Date().toLocaleString()}</div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Función principal para imprimir ticket
     */
    async printTicket() {
        if (!this.isInitialized) {
            this.showMessage('error', 'Sistema no listo', 'El módulo de impresión no está inicializado');
            return false;
        }

        try {
            // Obtener datos del ticket
            const ticketData = this.getTicketDataFromDOM();
            
            // Validar datos mínimos
            if (!this.validateTicketData(ticketData)) {
                this.showMessage('error', 'Datos incompletos', 'Complete la información del ticket');
                return false;
            }

            // Imprimir ticket
            const result = await this.printThermalTicket(ticketData);
            
            if (result) {
                console.log('🎫 Ticket impreso exitosamente');
                return true;
            } else {
                this.showMessage('error', 'Error de impresión', 'No se pudo imprimir el ticket');
                return false;
            }
            
        } catch (error) {
            console.error('Error general de impresión:', error);
            this.showMessage('error', 'Error inesperado', 'Error en el sistema de impresión');
            return false;
        }
    }

    /**
     * Validar datos del ticket
     */
    validateTicketData(ticketData) {
        const requiredFields = ['codigo', 'nombre', 'documento', 'fecha', 'hora', 'embarcacion'];
        
        for (const field of requiredFields) {
            if (!ticketData[field] || ticketData[field] === 'N/A' || ticketData[field] === '-') {
                console.warn(`Campo requerido faltante: ${field}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Agregar estilos CSS para impresión
     */
    addPrintStyles() {
        const styleId = 'thermal-printer-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Estilos adicionales para impresión térmica */
            @media print {
                .thermal-ticket {
                    width: 80mm !important;
                    max-width: 80mm !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 10px !important;
                    line-height: 1.2 !important;
                    color: black !important;
                    background: white !important;
                    margin: 0 !important;
                    padding: 2mm !important;
                }
                
                .thermal-header {
                    text-align: center;
                    font-weight: bold;
                    margin-bottom: 3mm;
                    border-bottom: 1px dashed black;
                    padding-bottom: 2mm;
                }
                
                .thermal-section {
                    margin-bottom: 2mm;
                    padding-bottom: 1mm;
                    border-bottom: 1px dotted #666;
                }
                
                .thermal-total {
                    text-align: center;
                    font-weight: bold;
                    font-size: 12px;
                    margin: 2mm 0;
                    padding: 2mm;
                    border: 1px solid black;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Mostrar mensajes usando el sistema de alertas existente
     */
    showMessage(type, title, message, duration = 3000) {
        if (typeof window !== 'undefined') {
            if (window.alertSystem) {
                window.alertSystem[type](title, message, duration);
            } else if (window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`]) {
                window[`show${type.charAt(0).toUpperCase() + type.slice(1)}`](title, message, duration);
            } else {
                console.log(`${type.toUpperCase()} - ${title}: ${message}`);
            }
        }
    }

    /**
     * Obtener estado de la conexión
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isInitialized: this.isInitialized,
            hasWebSerial: 'serial' in navigator,
            portInfo: this.port ? {
                connected: this.port.readable && this.port.writable
            } : null
        };
    }

    /**
     * Función de prueba para verificar la impresora
     */
    async testPrinter() {
        const testData = {
            codigo: 'TEST-' + Date.now().toString(36).toUpperCase(),
            nombre: 'PRUEBA SISTEMA',
            documento: '12345678',
            telefono: '+57 300 123 4567',
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            embarcacion: 'LANCHA TAXI',
            adultos: 1,
            ninos: 0,
            total: '$25,000',
            qrData: true
        };

        this.showMessage('info', 'Prueba de impresión', 'Enviando ticket de prueba...');
        return await this.printThermalTicket(testData);
    }
}

// ===========================
// 🚀 INICIALIZACIÓN GLOBAL
// ===========================

// Crear instancia global
const thermalPrinter = new ThermalPrinter();

// Exponer funciones globales
window.thermalPrinter = thermalPrinter;

// Funciones de conveniencia globales
window.printThermalTicket = async () => {
    return await thermalPrinter.printTicket();
};

window.connectThermalPrinter = async () => {
    return await thermalPrinter.connectThermalPrinter();
};

window.disconnectThermalPrinter = async () => {
    return await thermalPrinter.disconnectThermalPrinter();
};

window.testThermalPrinter = async () => {
    return await thermalPrinter.testPrinter();
};

window.getThermalPrinterStatus = () => {
    return thermalPrinter.getConnectionStatus();
};

// ===========================
// 📋 INTEGRACIÓN CON EL SISTEMA EXISTENTE
// ===========================

// Reemplazar la función de impresión existente
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖨️ Sistema de impresión térmica cargado');
    console.log('📋 Funciones disponibles:');
    console.log('   - printThermalTicket()');
    console.log('   - connectThermalPrinter()');
    console.log('   - disconnectThermalPrinter()');
    console.log('   - testThermalPrinter()');
    console.log('   - getThermalPrinterStatus()');
    
    // Integrar con el botón de impresión existente
    const originalPrintTicket = window.printTicket;
    window.printTicket = async function() {
        // Intentar impresión térmica primero
        const thermalResult = await thermalPrinter.printTicket();
        
        // Si falla, usar función original como fallback
        if (!thermalResult && originalPrintTicket) {
            originalPrintTicket();
        }
    };
});

// ===========================
// 📖 DOCUMENTACIÓN DE USO
// ===========================

/*
INSTRUCCIONES DE USO:

1. Incluir el módulo en tu HTML:
   <script src="thermal-printer.js"></script>

2. Conectar impresora térmica:
   await connectThermalPrinter();

3. Imprimir ticket:
   await printThermalTicket();

4. Probar impresora:
   await testThermalPrinter();

5. Verificar estado:
   const status = getThermalPrinterStatus();

COMPATIBILIDAD:
- Chrome/Edge con Web Serial API habilitada
- Impresoras térmicas ESC/POS de 80mm
- Fallback automático a impresión estándar

IMPRESORAS COMPATIBLES:
- Epson TM series
- Star Micronics
- Citizen
- GOOJPRT
- Xprinter
- Cualquier impresora ESC/POS

CONFIGURACIÓN:
1. Habilitar Web Serial API en chrome://flags
2. Conectar impresora vía USB o Bluetooth
3. Usar la función connectThermalPrinter()
*/