/**
 * Sistema de Generación de PDF para Embarcaciones de Guatapé
 * Módulo para crear tickets en formato PDF de alta calidad
 * 
 * Funcionalidades:
 * - Generación de PDF optimizado para tickets
 * - Formato térmico (80mm) y formato estándar (A4)
 * - Códigos QR integrados
 * - Logos y branding personalizado
 * - Descarga automática
 * - Vista previa antes de descargar
 * - Múltiples plantillas de diseño
 */

class PDFGenerator {
    constructor() {
        this.jsPDF = null;
        this.QRCode = null;
        this.isLibrariesLoaded = false;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Inicializar el generador de PDF
     */
    async init() {
        try {
            await this.loadLibraries();
            this.isInitialized = true;
            console.log('📄 Generador de PDF inicializado');
            this.showMessage('success', 'PDF listo', 'Módulo de generación PDF cargado');
        } catch (error) {
            console.error('Error inicializando PDF:', error);
            this.showMessage('error', 'Error PDF', 'No se pudo cargar el generador de PDF');
        }
    }

    /**
     * Cargar librerías necesarias (jsPDF y QR)
     */
    async loadLibraries() {
        return new Promise((resolve, reject) => {
            // Cargar jsPDF
            if (!window.jsPDF) {
                const script1 = document.createElement('script');
                script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script1.onload = () => {
                    // Cargar QRCode generator
                    const script2 = document.createElement('script');
                    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
                    script2.onload = () => {
                        this.jsPDF = window.jspdf.jsPDF;
                        this.isLibrariesLoaded = true;
                        resolve();
                    };
                    script2.onerror = reject;
                    document.head.appendChild(script2);
                };
                script1.onerror = reject;
                document.head.appendChild(script1);
            } else {
                this.jsPDF = window.jspdf.jsPDF;
                this.isLibrariesLoaded = true;
                resolve();
            }
        });
    }

    /**
     * Generar ticket en PDF - Función principal
     */
    async generateTicketPDF(format = 'thermal') {
        if (!this.isInitialized) {
            this.showMessage('error', 'Sistema no listo', 'El generador PDF no está inicializado');
            return false;
        }

        try {
            // Obtener datos de ticket
            const ticketData = this.getTicketDataFromDOM();
            
            // Validar datos
            if (!this.validateTicketData(ticketData)) {
                this.showMessage('error', 'Datos incompletos', 'Complete la información de ticket');
                return false;
            }

            this.showMessage('info', 'Generando PDF...', 'Creando documento PDF');

            let pdfBlob;
            
            // Generar según el formato solicitado
            switch (format) {
                case 'thermal':
                    pdfBlob = await this.generateThermalPDF(ticketData);
                    break;
                case 'standard':
                    pdfBlob = await this.generateStandardPDF(ticketData);
                    break;
                case 'compact':
                    pdfBlob = await this.generateCompactPDF(ticketData);
                    break;
                default:
                    pdfBlob = await this.generateThermalPDF(ticketData);
            }

            // Descargar PDF
            this.downloadPDF(pdfBlob, `ticket-${ticketData.codigo}.pdf`);
            
            this.showMessage('success', '¡PDF generado!', 'Ticket guardado como PDF');
            return true;

        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showMessage('error', 'Error PDF', 'No se pudo generar el archivo PDF');
            return false;
        }
    }

    /**
     * Generar PDF formato térmico (80mm)
     */
    async generateThermalPDF(ticketData) {
        // Crear documento PDF (80mm de ancho)
        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 200] // 80mm ancho, altura variable
        });

        let yPos = 10;
        const pageWidth = 58;
        const margin = 5;
        const contentWidth = pageWidth - (margin * 2);

        // Configurar fuente
        doc.setFont('courier', 'normal');

        // === ENCABEZADO ===
        // Logo emoji (si fuera imagen real, usar doc.addImage)
        doc.setFontSize(20);
        doc.text('🚢', pageWidth/2, yPos, { align: 'center' });
        yPos += 8;

        // Título
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.text('EMBARCACIONES', pageWidth/2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('DE GUATAPÉ', pageWidth/2, yPos, { align: 'center' });
        yPos += 4;

        // Subtítulo
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.text('Sistema de Pasajes', pageWidth/2, yPos, { align: 'center' });
        yPos += 3;
        doc.text('Embalse de Guatapé', pageWidth/2, yPos, { align: 'center' });
        yPos += 5;

        // Línea separadora
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // === INFORMACIÓN DE TICKET ===
        doc.setFontSize(8);
        doc.setFont('courier', 'bold');
        doc.text('INFORMACIÓN DE TICKET', margin, yPos);
        yPos += 4;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        
        const ticketInfo = [
            ['CÓDIGO:', ticketData.codigo],
            ['FECHA EMISIÓN:', new Date().toLocaleDateString()],
            ['HORA EMISIÓN:', new Date().toLocaleTimeString()]
        ];

        ticketInfo.forEach(([label, value]) => {
            doc.text(label, margin, yPos);
            doc.text(value, margin + 25, yPos);
            yPos += 3.5;
        });

        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // === DATOS DEL PASAJERO ===
        doc.setFontSize(9);
        doc.setFont('courier', 'bold');
        doc.text('DATOS DEL PASAJERO', margin, yPos);
        yPos += 4;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);

        const passengerInfo = [
            ['NOMBRE:', ticketData.nombre],
            ['DOCUMENTO:', ticketData.documento]
        ];

        if (ticketData.telefono) {
            passengerInfo.push(['TELÉFONO:', ticketData.telefono]);
        }

        passengerInfo.forEach(([label, value]) => {
            doc.text(label, margin, yPos);
            // Ajustar texto largo
            const maxWidth = contentWidth - 25;
            const splitValue = doc.splitTextToSize(value, maxWidth);
            doc.text(splitValue, margin + 25, yPos);
            yPos += 3.5 * splitValue.length;
        });

        yPos += 2;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        // === DETALLES DEL VIAJE ===
        doc.setFontSize(8);
        doc.setFont('courier', 'bold');
        doc.text('DETALLES DEL VIAJE', margin, yPos);
        yPos += 4;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);

        const tripInfo = [
            ['FECHA VIAJE:', ticketData.fecha],
            ['HORA SALIDA:', ticketData.hora],
            ['EMBARCACIÓN:', ticketData.embarcacion],
            ['PASAJEROS:', `${ticketData.adultos} adultos${ticketData.ninos > 0 ? `, ${ticketData.ninos} niños` : ''}`]
        ];

        tripInfo.forEach(([label, value]) => {
            doc.text(label, margin, yPos);
            const splitValue = doc.splitTextToSize(value, contentWidth - 25);
            doc.text(splitValue, margin + 25, yPos);
            yPos += 3.5 * splitValue.length;
        });

        yPos += 3;

        // === TOTAL ===
        // Fondo del total
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPos - 2, contentWidth, 12, 'F');
        doc.setDrawColor(0);
        doc.rect(margin, yPos - 2, contentWidth, 12);

        doc.setFontSize(9);
        doc.setFont('courier', 'bold');
        doc.text('TOTAL A PAGAR', pageWidth/2, yPos + 2, { align: 'center' });
        
        doc.setFontSize(13);
        doc.text(ticketData.total, pageWidth/2, yPos + 7, { align: 'center' });
        yPos += 15;

        // === CÓDIGO QR ===
        if (ticketData.generateQR !== false) {
            const qrData = JSON.stringify({
                codigo: ticketData.codigo,
                pasajero: ticketData.nombre,
                documento: ticketData.documento,
                fecha: ticketData.fecha,
                hora: ticketData.hora,
                total: ticketData.total,
                timestamp: new Date().toISOString()
            });

            try {
                const qrDataURL = await this.generateQRDataURL(qrData);
                
                doc.setFontSize(7);
                doc.text('CÓDIGO QR', pageWidth/2, yPos, { align: 'center' });
                yPos += 4;
                
                // Agregar QR Code
                const qrSize = 25;
                doc.addImage(qrDataURL, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);
                yPos += qrSize + 3;
                
                doc.setFontSize(6);
                doc.text('Escanee para verificar', pageWidth/2, yPos, { align: 'center' });
                yPos += 5;
            } catch (error) {
                console.error('Error generando QR:', error);
                // QR placeholder
                doc.rect((pageWidth - 25) / 2, yPos, 25, 25);
                doc.setFontSize(5);
                doc.text('QR CODE', pageWidth/2, yPos + 12, { align: 'center' });
                yPos += 30;
            }
        }

        // === PIE DE PÁGINA ===
        yPos += 3;
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4;

        doc.setFontSize(8);
        doc.setFont('courier', 'bold');
        doc.text('CONSERVE ESTE TICKET', pageWidth/2, yPos, { align: 'center' });
        yPos += 4;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.text('Válido únicamente para', pageWidth/2, yPos, { align: 'center' });
        yPos += 3;
        doc.text('la fecha y hora indicadas', pageWidth/2, yPos, { align: 'center' });
        yPos += 4;

        doc.text('Embalse de Guatapé', pageWidth/2, yPos, { align: 'center' });
        yPos += 3;
        doc.text('Antioquia - Colombia', pageWidth/2, yPos, { align: 'center' });
        yPos += 4;

        doc.setFontSize(6);
        doc.text(new Date().toLocaleString(), pageWidth/2, yPos, { align: 'center' });

        // Ajustar altura del documento
        const finalHeight = yPos + 10;
        doc.internal.pageSize.height = finalHeight;

        return doc.output('blob');
    }

    /**
     * Generar PDF formato estándar (A4)
     */
    async generateStandardPDF(ticketData) {
        const doc = new this.jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        let yPos = 30;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // === ENCABEZADO PRINCIPAL ===
        // Fondo del encabezado
        doc.setFillColor(100, 126, 234);
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Logo y título
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('🚢 EMBARCACIONES DE GUATAPÉ', pageWidth/2, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Venta de Pasajes - Embalse de Guatapé', pageWidth/2, 35, { align: 'center' });

        yPos = 70;

        // === INFORMACIÓN DE TICKET ===
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, yPos - 5, contentWidth, 25, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos - 5, contentWidth, 25);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TICKET DE EMBARCACIÓN', margin + 10, yPos + 5);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Código: ${ticketData.codigo}`, margin + 10, yPos + 12);
        doc.text(`Generado: ${new Date().toLocaleString()}`, margin + 10, yPos + 18);

        yPos += 40;

        // === DATOS EN DOS COLUMNAS ===
        // Columna izquierda - Datos del pasajero
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('DATOS DEL PASAJERO', margin, yPos);
        yPos += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const passengerData = [
            ['Nombre:', ticketData.nombre],
            ['Documento:', ticketData.documento],
            ['Teléfono:', ticketData.telefono || 'No especificado'],
            ['Email:', ticketData.email || 'No especificado']
        ];

        passengerData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(value, margin + 30, yPos);
            yPos += 6;
        });

        // Columna derecha - Detalles del viaje
        let rightColumnX = pageWidth / 2 + 10;
        let rightYPos = 118; // Misma altura que "DATOS DEL PASAJERO"

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(52, 73, 94);
        doc.text('DETALLES DEL VIAJE', rightColumnX, rightYPos);
        rightYPos += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        const tripData = [
            ['Fecha del viaje:', ticketData.fecha],
            ['Hora de salida:', ticketData.hora],
            ['Tipo de embarcación:', ticketData.embarcacion],
            ['Número de pasajeros:', `${ticketData.adultos} adultos${ticketData.ninos > 0 ? `, ${ticketData.ninos} niños` : ''}`]
        ];

        tripData.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, rightColumnX, rightYPos);
            doc.setFont('helvetica', 'normal');
            const splitValue = doc.splitTextToSize(value, 58);
            doc.text(splitValue, rightColumnX + 45, rightYPos);
            rightYPos += 6 * splitValue.length;
        });

        yPos = Math.max(yPos, rightYPos) + 20;

        // === TOTAL ===
        doc.setFillColor(46, 204, 113);
        doc.rect(margin, yPos, contentWidth, 30, 'F');
        doc.setDrawColor(39, 174, 96);
        doc.rect(margin, yPos, contentWidth, 30);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL A PAGAR', pageWidth/2, yPos + 12, { align: 'center' });
        
        doc.setFontSize(24);
        doc.text(ticketData.total, pageWidth/2, yPos + 23, { align: 'center' });

        yPos += 50;

        // === CÓDIGO QR ===
        if (ticketData.generateQR !== false) {
            try {
                const qrData = JSON.stringify({
                    codigo: ticketData.codigo,
                    pasajero: ticketData.nombre,
                    documento: ticketData.documento,
                    fecha: ticketData.fecha,
                    hora: ticketData.hora,
                    total: ticketData.total,
                    timestamp: new Date().toISOString()
                });

                const qrDataURL = await this.generateQRDataURL(qrData);
                
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('CÓDIGO QR PARA VERIFICACIÓN', pageWidth/2, yPos, { align: 'center' });
                yPos += 10;
                
                const qrSize = 60;
                doc.addImage(qrDataURL, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);
                yPos += qrSize + 10;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Escanee este código para verificar la autenticidad de ticket', pageWidth/2, yPos, { align: 'center' });
                yPos += 15;
            } catch (error) {
                console.error('Error generando QR:', error);
            }
        }

        // === PIE DE PÁGINA ===
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTRUCCIONES IMPORTANTES', pageWidth/2, yPos, { align: 'center' });
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const instructions = [
            '• Conserve este ticket hasta completar su viaje',
            '• Presente el ticket en el momento del abordaje',
            '• El ticket es válido únicamente para la fecha y hora especificadas',
            '• En caso de cambios climáticos, el horario puede ser modificado',
            '• Para mayor información: contacto@embarcacionesguatape.com'
        ];

        instructions.forEach(instruction => {
            doc.text(instruction, margin, yPos);
            yPos += 5;
        });

        yPos += 10;
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`Documento generado el ${new Date().toLocaleString()} | Embarcaciones de Guatapé - Antioquia, Colombia`, pageWidth/2, yPos, { align: 'center' });

        return doc.output('blob');
    }

    /**
     * Generar PDF formato compacto
     */
    async generateCompactPDF(ticketData) {
        const doc = new this.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a5'
        });

        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;
        const margin = 15;

        // Encabezado compacto
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('🚢 EMBARCACIONES DE GUATAPÉ', pageWidth/2, yPos, { align: 'center' });
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Ticket de Embarque', pageWidth/2, yPos, { align: 'center' });
        yPos += 10;

        // Información en formato tabla
        const tableData = [
            ['Código:', ticketData.codigo, 'Fecha Viaje:', ticketData.fecha],
            ['Pasajero:', ticketData.nombre, 'Hora:', ticketData.hora],
            ['Documento:', ticketData.documento, 'Embarcación:', ticketData.embarcacion],
            ['Pasajeros:', `${ticketData.adultos}A${ticketData.ninos > 0 ? ` + ${ticketData.ninos}N` : ''}`, 'Total:', ticketData.total]
        ];

        doc.setFontSize(9);
        tableData.forEach(row => {
            doc.setFont('helvetica', 'bold');
            doc.text(row[0], margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(row[1], margin + 25, yPos);
            
            doc.setFont('helvetica', 'bold');
            doc.text(row[2], margin + 85, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(row[3], margin + 110, yPos);
            
            yPos += 6;
        });

        // QR Code si está habilitado
        if (ticketData.generateQR !== false) {
            try {
                const qrData = JSON.stringify({
                    codigo: ticketData.codigo,
                    pasajero: ticketData.nombre,
                    total: ticketData.total
                });

                const qrDataURL = await this.generateQRDataURL(qrData);
                const qrSize = 30;
                doc.addImage(qrDataURL, 'PNG', pageWidth - margin - qrSize, 30, qrSize, qrSize);
            } catch (error) {
                console.error('Error generando QR compacto:', error);
            }
        }

        return doc.output('blob');
    }

    /**
     * Generar código QR como Data URL
     */
    async generateQRDataURL(data) {
        return new Promise((resolve, reject) => {
            try {
                // Crear QR usando la librería qrcode-generator
                const qr = qrcode(0, 'M');
                qr.addData(data);
                qr.make();
                
                // Convertir a canvas y luego a data URL
                const canvas = document.createElement('canvas');
                const size = 200;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Fondo blanco
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, size, size);
                
                // Dibujar QR
                const moduleCount = qr.getModuleCount();
                const cellSize = size / moduleCount;
                
                ctx.fillStyle = '#000000';
                for (let row = 0; row < moduleCount; row++) {
                    for (let col = 0; col < moduleCount; col++) {
                        if (qr.isDark(row, col)) {
                            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                        }
                    }
                }
                
                resolve(canvas.toDataURL('image/png'));
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Obtener datos de ticket desde el DOM
     */
    getTicketDataFromDOM() {
        return {
            codigo: document.getElementById('ticket-codigo')?.textContent || 'N/A',
            nombre: document.getElementById('ticket-nombre')?.textContent || 'N/A',
            documento: document.getElementById('ticket-documento')?.textContent || 'N/A',
            telefono: document.getElementById('telefono')?.value || '',
            email: document.getElementById('emailCliente')?.value || '',
            fecha: document.getElementById('ticket-fecha')?.textContent || 'N/A',
            hora: document.getElementById('ticket-hora')?.textContent || 'N/A',
            embarcacion: document.getElementById('ticket-embarcacion')?.textContent || 'N/A',
            adultos: parseInt(document.getElementById('adultos')?.value) || 0,
            ninos: parseInt(document.getElementById('ninos')?.value) || 0,
            total: document.getElementById('ticket-total')?.textContent || '$0',
            generateQR: true
        };
    }

    /**
     * Validar datos de ticket
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
     * Descargar archivo PDF
     */
    downloadPDF(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Vista previa del PDF en nueva ventana
     */
    previewPDF(blob) {
        const url = URL.createObjectURL(blob);
        const previewWindow = window.open(url, '_blank');
        
        if (!previewWindow) {
            this.showMessage('warning', 'Popup bloqueado', 'Active las ventanas emergentes para vista previa');
        }
        
        return previewWindow;
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
     * Obtener estado del generador
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            librariesLoaded: this.isLibrariesLoaded,
            jsPDFAvailable: !!this.jsPDF,
            version: '1.0.0'
        };
    }
}

// ===========================
// 🚀 INICIALIZACIÓN GLOBAL
// ===========================

// Crear instancia global
const pdfGenerator = new PDFGenerator();

// Exponer funciones globales
window.pdfGenerator = pdfGenerator;

// Funciones de conveniencia globales
window.generateTicketPDF = async (format = 'thermal') => {
    return await pdfGenerator.generateTicketPDF(format);
};

window.previewTicketPDF = async (format = 'thermal') => {
    if (!pdfGenerator.isInitialized) {
        pdfGenerator.showMessage('error', 'Sistema no listo', 'El generador PDF no está inicializado');
        return false;
    }

    try {
        const ticketData = pdfGenerator.getTicketDataFromDOM();
        
        if (!pdfGenerator.validateTicketData(ticketData)) {
            pdfGenerator.showMessage('error', 'Datos incompletos', 'Complete la información de ticket');
            return false;
        }

        pdfGenerator.showMessage('info', 'Generando vista previa...', 'Creando PDF para vista previa');

        let pdfBlob;
        switch (format) {
            case 'thermal':
                pdfBlob = await pdfGenerator.generateThermalPDF(ticketData);
                break;
            case 'standard':
                pdfBlob = await pdfGenerator.generateStandardPDF(ticketData);
                break;
            case 'compact':
                pdfBlob = await pdfGenerator.generateCompactPDF(ticketData);
                break;
            default:
                pdfBlob = await pdfGenerator.generateThermalPDF(ticketData);
        }

        pdfGenerator.previewPDF(pdfBlob);
        pdfGenerator.showMessage('success', 'Vista previa lista', 'PDF abierto en nueva ventana');
        return true;

    } catch (error) {
        console.error('Error en vista previa PDF:', error);
        pdfGenerator.showMessage('error', 'Error vista previa', 'No se pudo generar la vista previa');
        return false;
    }
};

window.getPDFGeneratorStatus = () => {
    return pdfGenerator.getStatus();
};

// ===========================
// 📋 INTEGRACIÓN CON EL SISTEMA EXISTENTE
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Sistema de generación PDF cargado');
    console.log('📋 Funciones disponibles:');
    console.log('   - generateTicketPDF(format) // format: "thermal", "standard", "compact"');
    console.log('   - previewTicketPDF(format)');
    console.log('   - getPDFGeneratorStatus()');
    
    // Agregar botones de PDF al sistema después de que se cargue
    setTimeout(() => {
        addPDFControlButtons();
    }, 1000);
});

// Función para agregar controles de PDF
function addPDFControlButtons() {
    // Verificar si ya existen los botones
    if (document.getElementById('pdf-controls')) return;

    // Buscar el contenedor de controles de impresora o crear uno nuevo
    let controlsContainer = document.getElementById('printer-controls');
    
    if (!controlsContainer) {
        const header = document.querySelector('.header');
        if (!header) return;

        controlsContainer = document.createElement('div');
        controlsContainer.id = 'printer-controls';
        controlsContainer.style.cssText = `
            position: absolute;
            top: 15px;
            left: 20px;
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        `;
        header.appendChild(controlsContainer);
    }

    // Crear contenedor específico para PDF
    const pdfControls = document.createElement('div');
    pdfControls.id = 'pdf-controls';
    pdfControls.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
        margin-left: 10px;
        padding-left: 10px;
        border-left: 1px solid rgba(255,255,255,0.3);
    `;

    pdfControls.innerHTML = `
        <!-- Dropdown para formato PDF -->
        <select id="pdf-format-select" style="
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 4px 8px;
            border-radius: 10px;
            font-size: 10px;
            cursor: pointer;
        ">
            <option value="thermal">PDF Térmico</option>
            <option value="standard">PDF Estándar</option>
            <option value="compact">PDF Compacto</option>
        </select>

        <!-- Botón Vista Previa -->
        <button onclick="previewSelectedPDF()" style="
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 12px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        " title="Vista previa del PDF">👁️ Vista</button>

        <!-- Botón Descargar PDF -->
        <button onclick="downloadSelectedPDF()" style="
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 12px;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        " title="Descargar PDF">📄 PDF</button>

        <!-- Indicador de estado PDF -->
        <div id="pdf-status" style="
            background: rgba(0,0,0,0.2);
            padding: 3px 6px;
            border-radius: 8px;
            font-size: 9px;
            color: #ccc;
        ">PDF Listo</div>
    `;

    controlsContainer.appendChild(pdfControls);
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

// Función para actualizar estado del PDF
function updatePDFStatus() {
    const statusElement = document.getElementById('pdf-status');
    if (!statusElement) return;

    const status = pdfGenerator.getStatus();
    
    if (status.isInitialized) {
        statusElement.textContent = '📄 PDF Listo';
        statusElement.style.color = '#00ff88';
    } else {
        statusElement.textContent = '⏳ Cargando...';
        statusElement.style.color = '#ffd700';
    }
}

// Actualizar estado del PDF cada 3 segundos
setInterval(updatePDFStatus, 3000);

// ===========================
// 📖 DOCUMENTACIÓN DE USO
// ===========================

/*
INSTRUCCIONES DE USO DEL GENERADOR PDF:

1. INCLUSIÓN EN EL PROYECTO:
   <script src="./js/pdf-generator.js"></script>

2. FUNCIONES PRINCIPALES:
   
   // Generar y descargar PDF
   await generateTicketPDF('thermal');    // PDF formato térmico (80mm)
   await generateTicketPDF('standard');   // PDF formato A4 completo
   await generateTicketPDF('compact');    // PDF formato A5 horizontal

   // Vista previa en nueva ventana
   await previewTicketPDF('thermal');

   // Verificar estado del sistema
   const status = getPDFGeneratorStatus();

3. FORMATOS DISPONIBLES:

   📱 TÉRMICO (80mm):
   - Optimizado para impresoras térmicas
   - Ancho fijo de 80mm, altura variable
   - Incluye códigos QR
   - Fuente monoespaciada (Courier)
   
   📄 ESTÁNDAR (A4):
   - Formato profesional tamaño carta
   - Diseño a color con branding
   - Layout en dos columnas
   - Códigos QR grandes para fácil escaneado
   
   📋 COMPACTO (A5):
   - Formato horizontal compacto
   - Información esencial en tabla
   - Ideal para impresión rápida
   - QR code en esquina

4. CARACTERÍSTICAS:

   ✅ Códigos QR automáticos con datos de ticket
   ✅ Validación de datos antes de generar
   ✅ Integración con sistema de alertas
   ✅ Vista previa antes de descargar
   ✅ Descarga automática con nombre único
   ✅ Responsive y optimizado para impresión
   ✅ Branding personalizado de Embarcaciones de Guatapé

5. COMPATIBILIDAD:

   - Todos los navegadores modernos
   - No requiere instalación adicional
   - Funciona offline una vez cargado
   - Compatible con dispositivos móviles

6. CONTROLES EN LA INTERFAZ:

   - Selector de formato en el header
   - Botón "Vista" para preview
   - Botón "PDF" para descarga directa
   - Indicador de estado del sistema

EJEMPLO DE USO COMPLETO:

// Verificar que el sistema esté listo
if (getPDFGeneratorStatus().isInitialized) {
    // Generar vista previa
    await previewTicketPDF('standard');
    
    // Descargar PDF después de confirmar
    await generateTicketPDF('standard');
} else {
    console.log('PDF Generator aún no está listo');
}

*/