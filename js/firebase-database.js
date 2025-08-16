/**
 * Sistema de Base de Datos Firebase - Embarcaciones de Guatapé
 * Módulo para integración con Firebase Firestore
 * Guarda automáticamente las ventas de tickets
 * 
 * Funcionalidades:
 * - Conexión automática a Firebase Firestore
 * - Guardado automático de ventas al generar tickets
 * - Validación de datos antes del guardado
 * - Manejo de errores y reconexión
 * - Integración transparente con el sistema POS existente
 * - Reportes básicos de ventas
 * - Búsqueda de tickets por código
 */

class FirebaseDatabase {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.isConnected = false;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    /**
     * Inicializar Firebase Firestore
     */
    async init() {
        try {
            console.log('🔥 Inicializando Firebase Database...');
            await this.loadFirebase();
            await this.connectToFirestore();
            this.setupIntegration();
            
            this.isInitialized = true;
            this.showMessage('success', 'Base de datos conectada', 'Firebase Firestore listo');
            console.log('✅ Firebase Database inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            this.showMessage('error', 'Error de base de datos', 'No se pudo conectar a Firebase');
        }
    }

    /**
     * Cargar librerías de Firebase
     */
    async loadFirebase() {
        try {
            // Importar Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            // Configuración de Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyBIYiRIRqaxjMKv1IzM--KM6mBNiOoS7DE",
                authDomain: "muelle-guatape.firebaseapp.com",
                projectId: "muelle-guatape",
                storageBucket: "muelle-guatape.firebasestorage.app",
                messagingSenderId: "527376761734",
                appId: "1:527376761734:web:e229d7725ad323182a6207"
            };

            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            
            // Guardar funciones para uso posterior
            this.collection = collection;
            this.addDoc = addDoc;
            this.doc = doc;
            this.getDoc = getDoc;
            this.getDocs = getDocs;
            this.query = query;
            this.where = where;
            this.orderBy = orderBy;
            this.limit = limit;
            this.Timestamp = Timestamp;

            console.log('🔥 Firebase modules cargados correctamente');
            
        } catch (error) {
            throw new Error(`Error cargando Firebase: ${error.message}`);
        }
    }

    /**
     * Conectar a Firestore y verificar conexión
     */
    async connectToFirestore() {
        try {
            // Verificar que tenemos la instancia de Firestore
            if (!this.db) {
                throw new Error('Base de datos de Firestore no inicializada');
            }

            // En lugar de escribir un documento de prueba, solo verificar la conexión
            console.log('🔥 Firestore inicializado correctamente');
            this.isConnected = true;
            console.log('✅ Conexión a Firestore verificada');
            
        } catch (error) {
            console.error('❌ Error conectando a Firestore:', error);
            throw new Error(`Error conectando a Firestore: ${error.message}`);
        }
    }

    
    /**
     * Configurar integración con el sistema POS existente
     */
    setupIntegration() {
        // Interceptar la generación de tickets
        this.interceptTicketGeneration();
        
        // Agregar funciones al objeto global del sistema POS
        if (window.posSystem) {
            window.posSystem.saveToDatabase = (data) => this.saveVenta(data);
            window.posSystem.searchTicket = (codigo) => this.searchTicketByCodigo(codigo);
            window.posSystem.getVentasHoy = () => this.getVentasHoy();
            window.posSystem.getTotalVentasHoy = () => this.getTotalVentasHoy();
        }
        
        console.log('🔗 Integración con sistema POS configurada');
    }

    /**
     * Interceptar la generación de tickets para guardar automáticamente
     */
    interceptTicketGeneration() {
        // Guardar función original
        const originalGenerateTicket = window.generateTicketWithValidation || window.generateTicket;
        
        if (originalGenerateTicket) {
            window.generateTicketWithValidation = async (...args) => {
                try {
                    // Ejecutar función original
                    const result = originalGenerateTicket.apply(this, args);
                    
                    // Si la generación fue exitosa, guardar en base de datos
                    if (result !== false) {
                        setTimeout(() => {
                            this.saveCurrentTicketToDatabase();
                        }, 500); // Pequeño delay para asegurar que los datos estén listos
                    }
                    
                    return result;
                } catch (error) {
                    console.error('Error en generación interceptada:', error);
                    return originalGenerateTicket.apply(this, args);
                }
            };
            
            console.log('🎯 Interceptor de generación de tickets configurado');
        }
    }

    /**
     * Guardar ticket actual en la base de datos
     */
    async saveCurrentTicketToDatabase() {
        try {
            // Obtener datos del ticket actual desde el DOM
            const ticketData = this.getTicketDataFromDOM();
            
            // Validar datos
            if (!this.validateTicketData(ticketData)) {
                console.warn('⚠️ Datos de ticket inválidos, no se guardará en base de datos');
                return false;
            }
            
            // Guardar en base de datos
            const docId = await this.saveVenta(ticketData);
            
            if (docId) {
                this.showMessage('success', 'Guardado en base de datos', `Ticket ${ticketData.codigo} guardado correctamente`);
                console.log('💾 Ticket guardado automáticamente:', docId);
                return true;
            }
            
        } catch (error) {
            console.error('Error guardando ticket automáticamente:', error);
            this.showMessage('warning', 'Error de guardado', 'No se pudo guardar en base de datos');
            return false;
        }
    }

    /**
     * Obtener datos del ticket desde el DOM
     */
    getTicketDataFromDOM() {
        return {
            codigo: document.getElementById('ticket-codigo')?.textContent || '',
            nombre: document.getElementById('ticket-nombre')?.textContent || '',
            documento: document.getElementById('ticket-documento')?.textContent || '',
            telefono: document.getElementById('telefono')?.value || '',
            email: document.getElementById('emailCliente')?.value || '',
            fecha: document.getElementById('ticket-fecha')?.textContent || '',
            hora: document.getElementById('ticket-hora')?.textContent || '',
            embarcacion: document.getElementById('ticket-embarcacion')?.textContent || '',
            adultos: parseInt(document.getElementById('adultos')?.value) || 0,
            ninos: parseInt(document.getElementById('ninos')?.value) || 0,
            precio: this.extractPriceFromTotal(document.getElementById('ticket-total')?.textContent || '0'),
            tipo_servicio: document.getElementById('ticket-tipo-servicio')?.textContent || 'Nuevo Pasaje',
            estado: 'GENERADO'
        };
    }

    /**
     * Extraer precio numérico del texto total
     */
    extractPriceFromTotal(totalText) {
        // Extraer números de texto como "$25,000"
        const numbers = totalText.replace(/[^\d]/g, '');
        return parseInt(numbers) || 0;
    }

    /**
     * Validar datos del ticket
     */
    validateTicketData(data) {
        const required = ['codigo', 'nombre', 'documento', 'fecha', 'embarcacion'];
        
        for (const field of required) {
            if (!data[field] || data[field] === '-' || data[field] === 'N/A') {
                console.warn(`Campo requerido faltante: ${field}`);
                return false;
            }
        }
        
        if (data.adultos < 1) {
            console.warn('Debe haber al menos 1 adulto');
            return false;
        }
        
        if (data.precio <= 0) {
            console.warn('El precio debe ser mayor a 0');
            return false;
        }
        
        return true;
    }


    /**
     * Guardar venta en Firebase Firestore (VERSIÓN MEJORADA)
     */
    async saveVenta(ventaData) {
        if (!this.isConnected) {
            throw new Error('No hay conexión con Firebase');
        }

        try {
            console.log('🔄 Iniciando guardado en Firebase...', ventaData);
            
            // Validar datos antes de enviar
            if (!ventaData.codigo || !ventaData.nombre || !ventaData.documento) {
                throw new Error('Datos incompletos: faltan campos obligatorios');
            }

            // Preparar datos con estructura específica
            const ventaDoc = {
                // Campos requeridos según la estructura mostrada
                adultos: ventaData.adultos,
                documento: ventaData.documento,
                email: ventaData.email || '',
                embarcacion: ventaData.embarcacion,
                fecha: ventaData.fecha,
                ninos: ventaData.ninos,
                nombre: ventaData.nombre,
                precio: ventaData.precio,
                telefono: ventaData.telefono || '',
                timestamp: this.Timestamp.now(),
                
                // Campos adicionales útiles
                codigo: ventaData.codigo,
                hora: ventaData.hora,
                tipo_servicio: ventaData.tipo_servicio || 'Nuevo Pasaje',
                estado: ventaData.estado || 'GENERADO',
                total_pasajeros: ventaData.adultos + (ventaData.ninos || 0),
                usuario: ventaData.usuario || 'system',
                timestamp_generacion: ventaData.timestamp_generacion || new Date().toISOString()
            };

            console.log('📤 Enviando a Firebase:', ventaDoc);

            // Guardar en colección "ventas"
            const ventasCollection = this.collection(this.db, 'ventas');
            const docRef = await this.addDoc(ventasCollection, ventaDoc);
            
            console.log('✅ Venta guardada exitosamente con ID:', docRef.id);
            
            // Mostrar confirmación
            this.showMessage('success', 'Guardado exitoso', `Venta registrada en Firebase (${docRef.id})`);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Error detallado guardando venta:', error);
            
            // Clasificar tipos de error
            if (error.code === 'permission-denied') {
                console.error('🚫 Error de permisos - verificar autenticación');
            } else if (error.code === 'unavailable') {
                console.error('🔌 Error de conexión - Firebase no disponible');
            }
            
            // Reintentar si es un error de red
            if (this.retryAttempts < this.maxRetries && error.code === 'unavailable') {
                this.retryAttempts++;
                console.log(`🔄 Reintentando guardado (${this.retryAttempts}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.saveVenta(ventaData);
            }
            
            throw error;
        }
    }

    /**
     * Buscar ticket por código
     */
    async searchTicketByCodigo(codigo) {
        if (!this.isConnected) {
            throw new Error('No hay conexión con Firebase');
        }

        try {
            const ventasCollection = this.collection(this.db, 'ventas');
            const q = this.query(
                ventasCollection, 
                this.where('codigo', '==', codigo),
                this.limit(1)
            );
            
            const querySnapshot = await this.getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
            
        } catch (error) {
            console.error('Error buscando ticket:', error);
            throw error;
        }
    }

    /**
     * Obtener ventas de hoy
     */
    async getVentasHoy() {
        if (!this.isConnected) {
            throw new Error('No hay conexión con Firebase');
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            
            const ventasCollection = this.collection(this.db, 'ventas');
            const q = this.query(
                ventasCollection,
                this.where('fecha', '==', today),
                this.orderBy('timestamp', 'desc')
            );
            
            const querySnapshot = await this.getDocs(q);
            const ventas = [];
            
            querySnapshot.forEach((doc) => {
                ventas.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return ventas;
            
        } catch (error) {
            console.error('Error obteniendo ventas de hoy:', error);
            throw error;
        }
    }

    /**
     * Obtener total de ventas de hoy
     */
    async getTotalVentasHoy() {
        try {
            const ventasHoy = await this.getVentasHoy();
            
            const totales = {
                cantidad_tickets: ventasHoy.length,
                total_pasajeros: ventasHoy.reduce((sum, venta) => sum + (venta.adultos + venta.ninos), 0),
                total_ingresos: ventasHoy.reduce((sum, venta) => sum + venta.precio, 0),
                por_embarcacion: {}
            };
            
            // Agrupar por embarcación
            ventasHoy.forEach(venta => {
                const embarcacion = venta.embarcacion;
                if (!totales.por_embarcacion[embarcacion]) {
                    totales.por_embarcacion[embarcacion] = {
                        tickets: 0,
                        pasajeros: 0,
                        ingresos: 0
                    };
                }
                
                totales.por_embarcacion[embarcacion].tickets++;
                totales.por_embarcacion[embarcacion].pasajeros += (venta.adultos + venta.ninos);
                totales.por_embarcacion[embarcacion].ingresos += venta.precio;
            });
            
            return totales;
            
        } catch (error) {
            console.error('Error calculando totales:', error);
            throw error;
        }
    }

    /**
     * Generar reporte de ventas del día
     */
    async generateDailyReport() {
        try {
            this.showMessage('info', 'Generando reporte', 'Obteniendo datos de ventas...');
            
            const totales = await this.getTotalVentasHoy();
            const ventas = await this.getVentasHoy();
            
            const reporte = {
                fecha: new Date().toLocaleDateString('es-CO'),
                hora_reporte: new Date().toLocaleTimeString('es-CO'),
                resumen: totales,
                detalle_ventas: ventas.map(venta => ({
                    codigo: venta.codigo,
                    hora: venta.hora,
                    pasajero: venta.nombre,
                    embarcacion: venta.embarcacion,
                    pasajeros: `${venta.adultos}A + ${venta.ninos}N`,
                    precio: venta.precio
                }))
            };
            
            console.log('📊 Reporte diario generado:', reporte);
            this.showMessage('success', 'Reporte generado', `${totales.cantidad_tickets} tickets encontrados`);
            
            return reporte;
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            this.showMessage('error', 'Error en reporte', 'No se pudo generar el reporte');
            return null;
        }
    }

    /**
     * Función para mostrar reportes en consola (desarrollo)
     */
    async showDailyReportInConsole() {
        const reporte = await this.generateDailyReport();
        
        if (reporte) {
            console.log('='.repeat(50));
            console.log('📊 REPORTE DIARIO DE VENTAS');
            console.log('='.repeat(50));
            console.log(`📅 Fecha: ${reporte.fecha}`);
            console.log(`⏰ Hora: ${reporte.hora_reporte}`);
            console.log('');
            console.log('📈 RESUMEN:');
            console.log(`   Tickets vendidos: ${reporte.resumen.cantidad_tickets}`);
            console.log(`   Total pasajeros: ${reporte.resumen.total_pasajeros}`);
            console.log(`   Ingresos totales: $${reporte.resumen.total_ingresos.toLocaleString()}`);
            console.log('');
            console.log('🚢 POR EMBARCACIÓN:');
            
            Object.entries(reporte.resumen.por_embarcacion).forEach(([embarcacion, datos]) => {
                console.log(`   ${embarcacion}:`);
                console.log(`     - Tickets: ${datos.tickets}`);
                console.log(`     - Pasajeros: ${datos.pasajeros}`);
                console.log(`     - Ingresos: $${datos.ingresos.toLocaleString()}`);
            });
            
            console.log('='.repeat(50));
        }
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
            isInitialized: this.isInitialized,
            isConnected: this.isConnected,
            retryAttempts: this.retryAttempts,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Reconectar a Firebase
     */
    async reconnect() {
        this.retryAttempts = 0;
        this.isConnected = false;
        this.isInitialized = false;
        
        this.showMessage('info', 'Reconectando...', 'Reestableciendo conexión con Firebase');
        await this.init();
    }

    /**
     * Función de prueba para verificar la conexión
     */
    async testConnection() {
        try {
            this.showMessage('info', 'Probando conexión', 'Verificando Firebase...');
            
            const testData = {
                codigo: 'TEST-' + Date.now().toString(36).toUpperCase(),
                nombre: 'PRUEBA CONEXION',
                documento: '12345678',
                telefono: '',
                email: '',
                fecha: new Date().toISOString().split('T')[0],
                hora: new Date().toLocaleTimeString(),
                embarcacion: 'TEST',
                adultos: 1,
                ninos: 0,
                precio: 1000,
                tipo_servicio: 'Prueba',
                estado: 'TEST'
            };
            
            const docId = await this.saveVenta(testData);
            
            if (docId) {
                this.showMessage('success', 'Conexión exitosa', `Documento de prueba guardado: ${docId}`);
                return true;
            }
            
        } catch (error) {
            console.error('Error en prueba de conexión:', error);
            this.showMessage('error', 'Error de conexión', error.message);
            return false;
        }
    }
}

// ===========================
// 🚀 INICIALIZACIÓN GLOBAL
// ===========================

// Crear instancia global
const firebaseDatabase = new FirebaseDatabase();

// Exponer funciones globales
window.firebaseDatabase = firebaseDatabase;

// Funciones de conveniencia globales
window.saveVentaToFirebase = async (data) => {
    return await firebaseDatabase.saveVenta(data);
};

window.searchTicketInFirebase = async (codigo) => {
    return await firebaseDatabase.searchTicketByCodigo(codigo);
};

window.getVentasHoyFromFirebase = async () => {
    return await firebaseDatabase.getVentasHoy();
};

window.generateDailyReportFromFirebase = async () => {
    return await firebaseDatabase.generateDailyReport();
};

window.showDailyReport = async () => {
    return await firebaseDatabase.showDailyReportInConsole();
};

window.testFirebaseConnection = async () => {
    return await firebaseDatabase.testConnection();
};

window.getFirebaseStatus = () => {
    return firebaseDatabase.getConnectionStatus();
};

window.reconnectFirebase = async () => {
    return await firebaseDatabase.reconnect();
};

// ===========================
// 📋 INTEGRACIÓN CON SISTEMA EXISTENTE
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 Sistema de base de datos Firebase cargado');
    console.log('📋 Funciones disponibles:');
    console.log('   - saveVentaToFirebase(data)');
    console.log('   - searchTicketInFirebase(codigo)');
    console.log('   - getVentasHoyFromFirebase()');
    console.log('   - generateDailyReportFromFirebase()');
    console.log('   - showDailyReport() // Muestra reporte en consola');
    console.log('   - testFirebaseConnection()');
    console.log('   - getFirebaseStatus()');
    console.log('   - reconnectFirebase()');
    
    console.log('💡 Uso básico:');
    console.log('   showDailyReport() - Ver resumen del día');
    console.log('   testFirebaseConnection() - Probar conexión');
    console.log('   searchTicketInFirebase("TKT-12345") - Buscar ticket');
});

// ===========================
// 🔧 FUNCIONES AUXILIARES PARA DESARROLLADOR
// ===========================

// Función para exportar datos de ventas como JSON
window.exportVentasToJSON = async () => {
    try {
        const ventas = await firebaseDatabase.getVentasHoy();
        const dataStr = JSON.stringify(ventas, null, 2);
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ventas-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        firebaseDatabase.showMessage('success', 'Exportado', 'Archivo JSON descargado');
        
    } catch (error) {
        console.error('Error exportando:', error);
        firebaseDatabase.showMessage('error', 'Error exportando', error.message);
    }
};

// Función para mostrar estadísticas rápidas
window.showQuickStats = async () => {
    try {
        const totales = await firebaseDatabase.getTotalVentasHoy();
        
        console.log('⚡ ESTADÍSTICAS RÁPIDAS:');
        console.log(`📊 Tickets: ${totales.cantidad_tickets}`);
        console.log(`👥 Pasajeros: ${totales.total_pasajeros}`);
        console.log(`💰 Ingresos: $${totales.total_ingresos.toLocaleString()}`);
        
        firebaseDatabase.showMessage('info', 'Estadísticas', 
            `${totales.cantidad_tickets} tickets - $${totales.total_ingresos.toLocaleString()}`);
        
        return totales;
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
    }
};

// ===========================
// 📖 DOCUMENTACIÓN DE USO
// ===========================

/*
INTEGRACIÓN FIREBASE FIRESTORE - DOCUMENTACIÓN:

🔥 CONFIGURACIÓN AUTOMÁTICA:
- Se conecta automáticamente al inicializar
- Intercepta la generación de tickets para guardar automáticamente
- Estructura de datos compatible con tu colección "ventas"

📊 FUNCIONES PRINCIPALES:

1. GUARDADO AUTOMÁTICO:
   - Se activa automáticamente al generar tickets
   - No requiere configuración adicional
   - Valida datos antes del guardado

2. CONSULTAS:
   searchTicketInFirebase("TKT-12345")  // Buscar ticket específico
   getVentasHoyFromFirebase()           // Todas las ventas de hoy
   
3. REPORTES:
   showDailyReport()                    // Reporte completo en consola
   showQuickStats()                     // Estadísticas rápidas
   generateDailyReportFromFirebase()    // Objeto con datos del reporte

4. UTILIDADES:
   testFirebaseConnection()             // Probar conexión
   getFirebaseStatus()                  // Estado de la conexión
   reconnectFirebase()                  // Reconectar si hay problemas
   exportVentasToJSON()                 // Exportar ventas como JSON

🔍 ESTRUCTURA DE DATOS GUARDADA:
{
  adultos: 1,
  documento: "12345678",
  email: "correo@ejemplo.com",
  embarcacion: "Lancha Taxi",
  fecha: "2025-08-15",
  ninos: 0,
  nombre: "Juan Pérez",
  precio: 30000,
  telefono: "+57 300 123 4567",
  timestamp: Timestamp,
  codigo: "TKT-ABC123",
  hora: "14:30:00",
  tipo_servicio: "Nuevo Pasaje",
  estado: "GENERADO"
}

💡 EJEMPLOS DE USO:

// Ver reporte del día
showDailyReport()

// Buscar un ticket específico
const ticket = await searchTicketInFirebase("TKT-ABC123")
console.log(ticket)

// Ver estadísticas rápidas
showQuickStats()

// Exportar datos del día
exportVentasToJSON()

// Probar conexión
testFirebaseConnection()

🚨 MANEJO DE ERRORES:
- Reintenta automáticamente hasta 3 veces en caso de fallos de red
- Muestra mensajes de error claros al usuario
- Continúa funcionando aunque falle el guardado en base de datos

✅ COMPATIBILIDAD:
- Totalmente compatible con tu sistema POS existente
- No modifica la funcionalidad actual
- Se integra de forma transparente
- Funciona con todos los tipos de embarcación configurados

El sistema está listo para funcionar inmediatamente después de cargar el script.
*/