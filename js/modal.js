/**
 * Sistema de Modales para Embarcaciones del Guatapé
 * Modales elegantes para inicio y cierre de sesión con el estilo del sistema
 * 
 * Funcionalidades:
 * - Modal de bienvenida al iniciar sesión
 * - Modal de confirmación para cerrar sesión
 * - Modal de éxito al cerrar sesión
 * - Animaciones suaves y profesionales
 * - Totalmente responsive
 * - Integración con el sistema existente
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
        console.log('🎭 Sistema de modales inicializado');
    }

    /**
     * Inicializar estilos CSS para los modales
     */
    initializeStyles() {
        const styleId = 'modal-system-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* SISTEMA DE MODALES - ESTILOS */
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

            .modal-user-info {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-user-email {
                font-size: 1.2em;
                font-weight: bold;
                color: #ffd700;
                margin-bottom: 5px;
            }

            .modal-user-time {
                font-size: 0.9em;
                color: rgba(255, 255, 255, 0.7);
            }

            .modal-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 25px;
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
                min-width: 120px;
                position: relative;
                overflow: hidden;
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
                background: linear-gradient(45deg, #00ff88, #00cc6a);
                color: white;
                box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
            }

            .modal-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 255, 136, 0.4);
            }

            .modal-btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .modal-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.5);
                transform: translateY(-2px);
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

            .modal-progress {
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
                margin: 20px 0;
            }

            .modal-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00cc6a);
                border-radius: 2px;
                transition: width 0.3s ease;
                animation: modalProgressShine 2s ease-in-out infinite;
            }

            @keyframes modalProgressShine {
                0% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.3); }
                50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.6); }
                100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.3); }
            }

            .modal-footer {
                background: rgba(0, 0, 0, 0.1);
                padding: 20px 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
                font-size: 0.9em;
                color: rgba(255, 255, 255, 0.6);
            }

            /* Responsive */
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
                }

                .modal-title {
                    font-size: 1.5em;
                }

                .modal-icon {
                    font-size: 2.5em;
                }
            }

            /* Animaciones especiales */
            .modal-success-animation {
                animation: modalSuccessBounce 0.6s ease-out;
            }

            @keyframes modalSuccessBounce {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }

            .modal-warning-animation {
                animation: modalWarningShake 0.5s ease-out;
            }

            @keyframes modalWarningShake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
                20%, 40%, 60%, 80% { transform: translateX(3px); }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Crear contenedor principal de modales
     */
    createModalContainer() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.id = 'modal-overlay';
        document.body.appendChild(this.overlay);
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Cerrar modal al hacer clic fuera
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeModal();
            }
        });

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal) {
                this.closeModal();
            }
        });
    }

    /**
     * Mostrar modal de bienvenida al iniciar sesión
     */
    showWelcomeModal(userEmail) {
        const modal = this.createModal('welcome', {
            icon: '🎉',
            title: '¡Bienvenido!',
            subtitle: 'Inicio de sesión exitoso',
            message: 'Has iniciado sesión correctamente en el sistema de venta de pasajes.',
            userEmail: userEmail,
            autoClose: 3000,
            animation: 'success'
        });

        this.showModal(modal);
    }

    /**
     * Mostrar modal de confirmación para cerrar sesión
     */
    showLogoutConfirmModal(userEmail, onConfirm, onCancel) {
        const modal = this.createModal('logout-confirm', {
            icon: '🚪',
            title: 'Cerrar Sesión',
            subtitle: 'Confirmación requerida',
            message: '¿Está seguro que desea cerrar su sesión actual?',
            userEmail: userEmail,
            actions: [
                {
                    text: 'Cancelar',
                    type: 'secondary',
                    action: onCancel || (() => this.closeModal())
                },
                {
                    text: 'Cerrar Sesión',
                    type: 'danger',
                    action: onConfirm || (() => this.closeModal())
                }
            ],
            animation: 'warning'
        });

        this.showModal(modal);
    }

    /**
     * Mostrar modal de despedida al cerrar sesión
     */
    showGoodbyeModal() {
        const modal = this.createModal('goodbye', {
            icon: '👋',
            title: 'Hasta Pronto',
            subtitle: 'Sesión cerrada exitosamente',
            message: 'Tu sesión ha sido cerrada de forma segura. Gracias por usar nuestro sistema.',
            autoClose: 2500,
            animation: 'success',
            showProgress: true
        });

        this.showModal(modal);
    }

    /**
     * Crear estructura HTML del modal
     */
    createModal(id, options) {
        const {
            icon = '📢',
            title = 'Título',
            subtitle = '',
            message = '',
            userEmail = '',
            actions = [],
            autoClose = null,
            animation = 'normal',
            showProgress = false
        } = options;

        const modalHTML = `
            <div class="modal-container ${animation ? `modal-${animation}-animation` : ''}">
                <div class="modal-header">
                    <button class="modal-close" onclick="modalSystem.closeModal()">×</button>
                    <span class="modal-icon">${icon}</span>
                    <h2 class="modal-title">${title}</h2>
                    ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
                </div>
                
                <div class="modal-body">
                    <div class="modal-message">${message}</div>
                    
                    ${userEmail ? `
                        <div class="modal-user-info">
                            <div class="modal-user-email">${userEmail}</div>
                            <div class="modal-user-time">${new Date().toLocaleString()}</div>
                        </div>
                    ` : ''}
                    
                    ${showProgress ? `
                        <div class="modal-progress">
                            <div class="modal-progress-bar" id="modal-progress-${id}"></div>
                        </div>
                    ` : ''}
                    
                    ${actions.length > 0 ? `
                        <div class="modal-actions">
                            ${actions.map((action, index) => `
                                <button class="modal-btn modal-btn-${action.type}" 
                                        onclick="modalSystem.executeAction('${id}', ${index})">
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="modal-footer">
                    🚢 Embarcaciones del Guatapé - Sistema Seguro
                </div>
            </div>
        `;

        // Almacenar acciones para ejecutar después
        this.modals.set(id, { actions, autoClose, showProgress });

        return { id, html: modalHTML, options };
    }

    /**
     * Mostrar modal en pantalla
     */
    showModal(modal) {
        this.currentModal = modal.id;
        this.overlay.innerHTML = modal.html;
        
        // Mostrar overlay
        setTimeout(() => {
            this.overlay.classList.add('show');
        }, 50);

        // Configurar auto-close si es necesario
        const modalData = this.modals.get(modal.id);
        if (modalData.autoClose) {
            this.setupAutoClose(modal.id, modalData.autoClose);
        }

        // Configurar progress bar si es necesario
        if (modalData.showProgress && modalData.autoClose) {
            this.setupProgressBar(modal.id, modalData.autoClose);
        }
    }

    /**
     * Cerrar modal actual
     */
    closeModal() {
        if (!this.currentModal) return;

        this.overlay.classList.remove('show');
        
        setTimeout(() => {
            this.overlay.innerHTML = '';
            this.currentModal = null;
        }, 300);
    }

    /**
     * Ejecutar acción de botón
     */
    executeAction(modalId, actionIndex) {
        const modalData = this.modals.get(modalId);
        if (modalData && modalData.actions[actionIndex]) {
            const action = modalData.actions[actionIndex].action;
            if (typeof action === 'function') {
                action();
            }
        }
        this.closeModal();
    }

    /**
     * Configurar cierre automático
     */
    setupAutoClose(modalId, delay) {
        setTimeout(() => {
            if (this.currentModal === modalId) {
                this.closeModal();
            }
        }, delay);
    }

    /**
     * Configurar barra de progreso
     */
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

    /**
     * Verificar si hay un modal activo
     */
    isModalOpen() {
        return this.currentModal !== null;
    }

    /**
     * Obtener ID del modal actual
     */
    getCurrentModal() {
        return this.currentModal;
    }
}

// Crear instancia global del sistema de modales
const modalSystem = new ModalSystem();

// Exponer funciones globales para facilitar el uso
window.modalSystem = modalSystem;

// Funciones de conveniencia
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

// Integración con eventos del sistema
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 Sistema de modales listo para usar');
    console.log('📋 Funciones disponibles:');
    console.log('   - showWelcomeModal(email)');
    console.log('   - showLogoutConfirmModal(email, onConfirm, onCancel)');
    console.log('   - showGoodbyeModal()');
    console.log('   - closeModal()');
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalSystem;
}