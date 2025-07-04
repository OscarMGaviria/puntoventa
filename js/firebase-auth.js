/**
 * firebase-auth.js
 * Módulo de Autenticación Firebase
 * Sistema de login para Embarcaciones del Guatapé
 */

class AuthManager {
    constructor() {
        this.auth = null;
        this.user = null;
        this.isInitialized = false;
        
        // Referencias a elementos del DOM
        this.loginScreen = null;
        this.mainSystem = null;
        this.loginForm = null;
        this.errorMessage = null;
        this.loadingSpinner = null;
        this.loginBtn = null;
        this.userEmail = null;
        
        this.init();
    }

    /**
     * Inicializar el sistema de autenticación
     */
    async init() {
        try {
            // Configuración de Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyDdjYoi4BSBFFAuXumLxj-NMQWUVSFdSv4",
                authDomain: "contratos-5e932.firebaseapp.com",
                projectId: "contratos-5e932",
                storageBucket: "contratos-5e932.firebasestorage.app",
                messagingSenderId: "945849105278",
                appId: "1:945849105278:web:f0291a411b8e33327a112f"
            };

            // Importar Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            
            // Almacenar funciones
            this.signInWithEmailAndPassword = signInWithEmailAndPassword;
            this.signOut = signOut;

            // Obtener referencias del DOM
            this.setupDOMReferences();
            
            // Configurar eventos
            this.setupEventListeners();
            


            this.isInitialized = true;
            console.log('🔐 Sistema de autenticación inicializado');
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            this.showError('Error de conexión con el servidor');
        }
        // Limpiar cualquier listener residual
        setTimeout(() => {
            if (this.auth && this.auth.currentUser) {
                this.auth.signOut();
            }
        }, 100);
    }

    /**
     * Configurar referencias del DOM
     */
    setupDOMReferences() {
        this.loginScreen = document.getElementById('loginScreen');
        this.mainSystem = document.getElementById('mainSystem');
        this.loginForm = document.getElementById('loginForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.loginBtn = document.getElementById('loginBtn');
        this.userEmail = document.getElementById('userEmail');
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Formulario de login
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    /**
     * Manejar cambios en el estado de autenticación
     */
    handleAuthStateChange(user) {
        this.user = user;
        
        if (user) {
            // Usuario autenticado
            console.log('Usuario autenticado:', user.email);
            this.showMainSystem();
            if (this.userEmail) {
                this.userEmail.textContent = user.email;
            }
        } else {
            // Usuario no autenticado
            console.log('Usuario no autenticado');
            this.showLoginScreen();
        }
    }

    /**
     * Procesar login
     */
    async handleLogin() {
        if (!this.isInitialized) {
            this.showError('Sistema no está listo. Intente nuevamente.');
            return;
        }

        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;

        // Validaciones
        if (!email || !password) {
            this.showError('Por favor complete todos los campos');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Por favor ingrese un email válido');
            return;
        }

        if (password.length < 6) {
            this.showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            this.showLoading(true);
            this.hideError();

            await this.signInWithEmailAndPassword(this.auth, email, password);
            
            // Llamar manualmente al cambio de estado ya que no hay listener automático
            const user = this.auth.currentUser;
            if (user) {
                this.handleAuthStateChange(user);
            }
            
        } catch (error) {
            console.error('Error en login:', error);
            this.showError(this.getErrorMessage(error.code));
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Cerrar sesión
     */
    async handleLogout() {
        if (!this.auth || !this.user) {
            return;
        }

        try {
            await this.signOut(this.auth);
            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }

    /**
     * Mostrar pantalla de login
     */
    showLoginScreen() {
        if (this.loginScreen && this.mainSystem) {
            this.loginScreen.classList.remove('hidden');
            this.mainSystem.classList.remove('visible');
            document.body.classList.remove('authenticated'); // AGREGAR
        }
    }  

    /**
     * Mostrar sistema principal
     */
    showMainSystem() {
        if (this.loginScreen && this.mainSystem) {
            this.loginScreen.classList.add('hidden');
            this.mainSystem.classList.add('visible');
            document.body.classList.add('authenticated'); // AGREGAR
            
            // Inicializar el sistema de tickets después de mostrar la pantalla
            setTimeout(() => {
                if (typeof updateTicket === 'function') {
                    updateTicket();
                }
                if (typeof updateMainButton === 'function') {
                    updateMainButton();
                }
            }, 100);
        }
    }

    /**
     * Mostrar/ocultar loading
     */
    showLoading(show) {
        if (this.loadingSpinner && this.loginBtn) {
            if (show) {
                this.loadingSpinner.style.display = 'inline-block';
                this.loginBtn.disabled = true;
                document.getElementById('btnText').textContent = 'Iniciando...';
            } else {
                this.loadingSpinner.style.display = 'none';
                this.loginBtn.disabled = false;
                document.getElementById('btnText').textContent = 'Iniciar Sesión';
            }
        }
    }

    /**
     * Mostrar error
     */
    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    /**
     * Ocultar error
     */
    hideError() {
        if (this.errorMessage) {
            this.errorMessage.style.display = 'none';
        }
    }

    /**
     * Validar email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Obtener mensaje de error en español
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No existe una cuenta con este email',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/invalid-email': 'El formato del email no es válido',
            'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
            'auth/too-many-requests': 'Demasiados intentos fallidos. Intente más tarde',
            'auth/network-request-failed': 'Error de conexión. Verifique su internet',
            'auth/invalid-credential': 'Credenciales inválidas. Verifique email y contraseña',
            'auth/missing-password': 'Debe ingresar una contraseña',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/invalid-login-credentials': 'Email o contraseña incorrectos'
        };

        return errorMessages[errorCode] || 'Error desconocido. Intente nuevamente';
    }

    /**
     * Verificar si hay usuario autenticado
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this.user;
    }
}

// Función para alternar visibilidad de contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = '👁️';
        }
    }
}

// Función global para logout (llamada desde el HTML)
function handleLogout() {
    if (window.authManager) {
        window.authManager.handleLogout();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// También inicializar si el DOM ya está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.authManager) {
            window.authManager = new AuthManager();
        }
    });
} else {
    window.authManager = new AuthManager();
}

console.log('Módulo de autenticación cargado - Embarcaciones Guatapé');