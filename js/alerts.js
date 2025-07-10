// ===========================
// 📢 MÓDULO DE ALERTAS LATERALES CORREGIDO
// ===========================

class AlertSystem {
    constructor() {
        this.alerts = [];
        this.container = null;
        this.maxAlerts = 5; // Máximo de alertas simultáneas
        this.init();
    }

    // Inicializar el sistema de alertas
    init() {
        this.createContainer();
        this.addStyles();
    }

    // Crear contenedor de alertas
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'alert-container';
        this.container.className = 'alert-container';
        document.body.appendChild(this.container);
    }

    // Agregar estilos CSS dinámicamente
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .alert-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
            }

            .alert {
                pointer-events: auto;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                position: relative;
                overflow: hidden;
                transform: translateX(100%);
                animation: slideIn 0.4s ease-out forwards;
                min-height: 60px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .alert::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: currentColor;
            }

            .alert-icon {
                font-size: 20px;
                flex-shrink: 0;
                width: 24px;
                text-align: center;
            }

            .alert-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .alert-title {
                font-weight: bold;
                font-size: 15px;
                margin: 0;
            }

            .alert-message {
                margin: 0;
                opacity: 0.9;
                line-height: 1.4;
            }

            .alert-close {
                background: none;
                border: none;
                color: currentColor;
                cursor: pointer;
                font-size: 18px;
                padding: 4px;
                border-radius: 4px;
                opacity: 0.7;
                transition: opacity 0.2s ease;
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .alert-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            .alert-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 12px 12px;
                animation: progress linear;
            }

            /* Tipos de alertas */
            .alert-success {
                background: linear-gradient(135deg, rgba(46, 204, 113, 0.9) 0%, rgba(39, 174, 96, 0.9) 100%);
                color: #ffffff;
            }

            .alert-error {
                background: linear-gradient(135deg, rgba(231, 76, 60, 0.9) 0%, rgba(192, 57, 43, 0.9) 100%);
                color: #ffffff;
            }

            .alert-warning {
                background: linear-gradient(135deg, rgba(243, 156, 18, 0.9) 0%, rgba(211, 84, 0, 0.9) 100%);
                color: #ffffff;
            }

            .alert-info {
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.9) 0%, rgba(41, 128, 185, 0.9) 100%);
                color: #ffffff;
            }

            .alert-primary {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
                color: #ffffff;
            }

            .alert-dark {
                background: linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%);
                color: #ffffff;
            }

            /* Animaciones */
            @keyframes slideIn {
                0% {
                    transform: translateX(100%);
                    opacity: 0;
                }
                100% {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                0% {
                    transform: translateX(0);
                    opacity: 1;
                }
                100% {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            @keyframes progress {
                0% { width: 100%; }
                100% { width: 0%; }
            }

            .alert-hiding {
                animation: slideOut 0.3s ease-in forwards;
            }

            /* Responsive */
            @media (max-width: 480px) {
                .alert-container {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .alert {
                    padding: 14px 16px;
                    font-size: 13px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Mostrar alerta (MEJORADO)
    show(type, title, message, duration = 5000) {
        // Evitar alertas duplicadas
        if (this.isDuplicate(type, title, message)) {
            console.log('🚫 Alerta duplicada evitada:', title);
            return null;
        }

        // Limitar número de alertas simultáneas
        if (this.alerts.length >= this.maxAlerts) {
            this.hideOldest();
        }

        const alertId = 'alert-' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        const alert = {
            id: alertId,
            type: type,
            title: title,
            message: message,
            duration: duration,
            element: null,
            timestamp: Date.now()
        };

        const alertElement = this.createElement(alert);
        alert.element = alertElement;
        
        this.container.appendChild(alertElement);
        this.alerts.push(alert);

        console.log(`📢 Alerta mostrada: [${type.toUpperCase()}] ${title}`);

        // Auto-hide después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                this.hide(alertId);
            }, duration);
        }

        return alertId;
    }

    // Verificar si es una alerta duplicada
    isDuplicate(type, title, message) {
        const now = Date.now();
        const duplicateWindow = 3000; // 3 segundos para considerar duplicado

        return this.alerts.some(alert => 
            alert.type === type && 
            alert.title === title && 
            alert.message === message &&
            (now - alert.timestamp) < duplicateWindow
        );
    }

    // Ocultar la alerta más antigua
    hideOldest() {
        if (this.alerts.length > 0) {
            const oldestAlert = this.alerts[0];
            this.hide(oldestAlert.id);
        }
    }

    // Crear elemento HTML de la alerta
    createElement(alert) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            primary: '★',
            dark: '●'
        };

        const element = document.createElement('div');
        element.id = alert.id;
        element.className = `alert alert-${alert.type}`;
        
        element.innerHTML = `
            <div class="alert-icon">${icons[alert.type] || '●'}</div>
            <div class="alert-content">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
            </div>
            <button class="alert-close" onclick="alertSystem.hide('${alert.id}')">&times;</button>
            ${alert.duration > 0 ? `<div class="alert-progress" style="animation-duration: ${alert.duration}ms;"></div>` : ''}
        `;

        return element;
    }

    // Ocultar alerta específica (MEJORADO)
    hide(alertId) {
        const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
        if (alertIndex === -1) {
            console.log('⚠️ Alerta no encontrada para ocultar:', alertId);
            return;
        }

        const alert = this.alerts[alertIndex];
        
        if (!alert.element || !alert.element.parentNode) {
            // Elemento ya fue removido, solo limpiar array
            this.alerts.splice(alertIndex, 1);
            return;
        }

        console.log(`📢 Ocultando alerta: ${alert.title}`);
        
        alert.element.classList.add('alert-hiding');
        
        setTimeout(() => {
            try {
                if (alert.element && alert.element.parentNode) {
                    alert.element.parentNode.removeChild(alert.element);
                }
            } catch (error) {
                console.warn('Error removiendo elemento de alerta:', error);
            }
            
            // Remover del array
            const currentIndex = this.alerts.findIndex(a => a.id === alertId);
            if (currentIndex !== -1) {
                this.alerts.splice(currentIndex, 1);
            }
        }, 300);
    }

    // Limpiar todas las alertas (MEJORADO)
    clear() {
        console.log('🧹 Limpiando todas las alertas');
        
        // Crear copia del array para evitar problemas de índices
        const alertsToHide = [...this.alerts];
        
        alertsToHide.forEach(alert => {
            if (alert.element && alert.element.parentNode) {
                alert.element.classList.add('alert-hiding');
                setTimeout(() => {
                    try {
                        if (alert.element && alert.element.parentNode) {
                            alert.element.parentNode.removeChild(alert.element);
                        }
                    } catch (error) {
                        console.warn('Error removiendo elemento durante clear:', error);
                    }
                }, 300);
            }
        });
        
        // Limpiar array después de las animaciones
        setTimeout(() => {
            this.alerts = [];
        }, 400);
    }

    // Ocultar alertas de un tipo específico
    hideType(type) {
        const alertsOfType = this.alerts.filter(alert => alert.type === type);
        alertsOfType.forEach(alert => this.hide(alert.id));
    }

    // Ocultar alertas anteriores del mismo tipo al mostrar una nueva
    replaceType(type, title, message, duration = 5000) {
        this.hideType(type);
        
        // Esperar un poco para que se oculten las anteriores
        setTimeout(() => {
            this.show(type, title, message, duration);
        }, 100);
    }

    // Métodos de conveniencia (MEJORADOS)
    success(title, message, duration = 4000) {
        return this.show('success', title, message, duration);
    }

    error(title, message, duration = 7000) {
        return this.show('error', title, message, duration);
    }

    warning(title, message, duration = 6000) {
        return this.show('warning', title, message, duration);
    }

    info(title, message, duration = 4000) {
        return this.show('info', title, message, duration);
    }

    primary(title, message, duration = 5000) {
        return this.show('primary', title, message, duration);
    }

    dark(title, message, duration = 5000) {
        return this.show('dark', title, message, duration);
    }

    // Métodos especiales para evitar duplicados
    successReplace(title, message, duration = 4000) {
        return this.replaceType('success', title, message, duration);
    }

    infoReplace(title, message, duration = 4000) {
        return this.replaceType('info', title, message, duration);
    }

    // Obtener estado del sistema
    getStatus() {
        return {
            totalAlerts: this.alerts.length,
            maxAlerts: this.maxAlerts,
            alerts: this.alerts.map(alert => ({
                id: alert.id,
                type: alert.type,
                title: alert.title,
                timestamp: alert.timestamp
            }))
        };
    }
}

// ===========================
// 🚀 INICIALIZACIÓN
// ===========================

// Crear instancia global
const alertSystem = new AlertSystem();

// ===========================
// 📋 FUNCIONES GLOBALES MEJORADAS
// ===========================

// Funciones básicas
function showAlert(type, title, message, duration) {
    return alertSystem.show(type, title, message, duration);
}

function showSuccess(title, message, duration) {
    return alertSystem.success(title, message, duration);
}

function showError(title, message, duration) {
    return alertSystem.error(title, message, duration);
}

function showWarning(title, message, duration) {
    return alertSystem.warning(title, message, duration);
}

function showInfo(title, message, duration) {
    return alertSystem.info(title, message, duration);
}

function showPrimary(title, message, duration) {
    return alertSystem.primary(title, message, duration);
}

function showDark(title, message, duration) {
    return alertSystem.dark(title, message, duration);
}

// Funciones especiales para evitar duplicados
function showSuccessReplace(title, message, duration) {
    return alertSystem.successReplace(title, message, duration);
}

function showInfoReplace(title, message, duration) {
    return alertSystem.infoReplace(title, message, duration);
}

// Funciones de control
function clearAllAlerts() {
    alertSystem.clear();
}

function hideAlertsOfType(type) {
    alertSystem.hideType(type);
}

// ===========================
// 🧪 FUNCIÓN DE PRUEBA MEJORADA
// ===========================

function testAllAlerts() {
    console.log('🧪 Probando sistema de alertas...');
    
    setTimeout(() => showSuccess('¡Éxito!', 'Operación completada correctamente'), 100);
    setTimeout(() => showError('Error', 'Algo salió mal en el proceso'), 300);
    setTimeout(() => showWarning('Advertencia', 'Revisa los datos ingresados'), 500);
    setTimeout(() => showInfo('Información', 'Proceso iniciado correctamente'), 700);
    setTimeout(() => showPrimary('Importante', 'Mensaje destacado del sistema'), 900);
    setTimeout(() => showDark('Sistema', 'Notificación del administrador'), 1100);
    
    // Probar sistema anti-duplicados
    setTimeout(() => {
        console.log('🧪 Probando anti-duplicados...');
        showSuccess('Test', 'Primer mensaje');
        showSuccess('Test', 'Primer mensaje'); // Debería ser bloqueado
        showSuccess('Test', 'Segundo mensaje diferente'); // Debería mostrarse
    }, 2000);
}

// ===========================
// 🔧 INTEGRACIÓN CON SISTEMA POS
// ===========================

// Función especial para mensajes del sistema POS
function showSystemMessage(message, type = 'info', duration = 3000) {
    return alertSystem.replaceType(type, 'Sistema POS', message, duration);
}

// Función para PDF específicamente
function showPDFMessage(title, message, success = true) {
    if (success) {
        // Ocultar mensajes de "Generando PDF..." antes de mostrar éxito
        alertSystem.hideType('info');
        setTimeout(() => {
            alertSystem.success(title, message, 4000);
        }, 200);
    } else {
        alertSystem.error(title, message, 6000);
    }
}

// ===========================
// 📖 DOCUMENTACIÓN ACTUALIZADA
// ===========================

/*
SISTEMA DE ALERTAS MEJORADO:

NUEVAS CARACTERÍSTICAS:
✅ Anti-duplicados (evita alertas repetidas en 3 segundos)
✅ Límite de alertas simultáneas (máximo 5)
✅ Auto-limpieza de alertas antiguas
✅ Funciones especiales para reemplazar por tipo
✅ Mejor manejo de errores
✅ Logs detallados para debugging
✅ Estado del sistema consultable

FUNCIONES DISPONIBLES:

Básicas:
- showSuccess(title, message, duration)
- showError(title, message, duration)  
- showWarning(title, message, duration)
- showInfo(title, message, duration)

Especiales:
- showSuccessReplace() // Reemplaza alertas de éxito anteriores
- showInfoReplace() // Reemplaza alertas de info anteriores
- clearAllAlerts() // Limpia todas las alertas
- hideAlertsOfType(type) // Oculta alertas de un tipo específico

Sistema POS:
- showSystemMessage(message, type, duration) // Mensajes del sistema
- showPDFMessage(title, message, success) // Específico para PDF

Control:
- alertSystem.getStatus() // Estado del sistema
- testAllAlerts() // Prueba todas las alertas

EJEMPLO DE USO CORRECTO PARA PDF:

// Al iniciar generación
showInfo('Generando PDF...', 'Creando archivo...');

// Al completar (reemplaza la anterior automáticamente)
showPDFMessage('¡PDF generado!', 'Archivo descargado exitosamente', true);

*/