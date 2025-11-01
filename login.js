// Credenciales de técnicos
const VALID_USERS = {
    'admin': 'matebit2025'
};

// Verificar si el usuario ya está logueado
function checkAuth() {
    return localStorage.getItem('techLoggedIn') === 'true';
}

// Función de login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    // Verificar credenciales
    if (VALID_USERS[username] && VALID_USERS[username] === password) {
        // Login exitoso
        localStorage.setItem('techLoggedIn', 'true');
        localStorage.setItem('techUsername', username);
        
        alert('✅ Login exitoso. Redirigiendo al dashboard...');
        window.location.href = 'tech-dashboard.html';
    } else {
        alert('❌ Usuario o contraseña incorrectos.');
    }
}

// Función de logout
function handleLogout() {
    localStorage.removeItem('techLoggedIn');
    localStorage.removeItem('techUsername');
    window.location.href = 'login.html';
}

// Proteger páginas de técnicos
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Si estamos en una página de técnicos, verificar autenticación
    if (window.location.pathname.includes('tech-dashboard.html') || 
        window.location.pathname.includes('tech-')) {
        requireAuth();
    }
});