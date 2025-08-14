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
            
            // Generar solo formato térmico 58mm
            pdfBlob = await this.generateThermalPDF(ticketData);

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
     * Generar PDF formato térmico (58mm)
     */
    async generateThermalPDF(ticketData) {
        // Crear documento PDF (58mm de ancho)
        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [58, 200] // 58mm ancho, altura variable
        });

        let yPos = 15;
        const pageWidth = 50;
        const margin = 3;
        const contentWidth = pageWidth - (margin * 2);

        // Configurar fuente
        doc.setFont('courier', 'normal');

        // === ENCABEZADO ===
        // Logo emoji (si fuera imagen real, usar doc.addImage)
        yPos += 8;

        // Título
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.text('EMBARCADERO', pageWidth/2, yPos, { align: 'center' });
        yPos += 5;
        doc.text('FLOTANTE', pageWidth/2, yPos, { align: 'center' });
        yPos += 4;

        // Subtítulo
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        doc.text('Malecón', pageWidth/2, yPos, { align: 'center' });
        yPos += 3;
        doc.text('San Juan del puerto', pageWidth/2, yPos, { align: 'center' });
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
            if(label==='FECHA EMISIÓN:'){
                doc.setFont('courier', 'bold');
            } else {
                doc.setFont('courier', 'normal');
            }
            doc.text(value, margin + 21, yPos);
            doc.text(label, margin, yPos);
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
            if(label==='NOMBRE:'){
                doc.setFont('courier', 'bold');
            } else {
                doc.setFont('courier', 'normal');
            }
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

        const pdfBlob = await pdfGenerator.generateThermalPDF(ticketData);

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
    console.log('   - generateTicketPDF() // Solo formato térmico 58mm');
    console.log('   - getPDFGeneratorStatus()');
});


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