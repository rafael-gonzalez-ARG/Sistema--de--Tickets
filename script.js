// script.js - VERSIÓN CORREGIDA
let tickets = [];

console.log('🔍 DEBUG: Estado de Firebase al cargar script.js');
console.log('window.firebaseApp:', window.firebaseApp);
console.log('typeof firebase:', typeof firebase);
console.log('¿Firebase inicializado?', window.firebaseApp?.initialized);

async function waitForFirebase() {
    console.log('⏳ Esperando Firebase...');
    
    if (window.firebaseApp && window.firebaseApp.initialized) {
        console.log('✅ Firebase ya está inicializado');
        return true;
    }
    
    // Esperar máximo 10 segundos
    for (let i = 0; i < 100; i++) {
        if (window.firebaseApp && window.firebaseApp.initialized) {
            console.log(`✅ Firebase listo después de ${i * 0.1} segundos`);
            return true;
        }
        
        // Debug cada 2 segundos
        if (i % 20 === 0) {
            console.log(`⏱️ Intento ${i}/100 - firebaseApp:`, window.firebaseApp);
            console.log(`⏱️ Firebase SDK cargado:`, typeof firebase !== 'undefined');
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('❌ Timeout: Firebase no se inicializó después de 10 segundos');
    console.log('Estado final - firebaseApp:', window.firebaseApp);
    console.log('Estado final - Firebase SDK:', typeof firebase);
    return false;
}

// 🔥 CARGAR TICKETS DESDE FIREBASE
async function loadTicketsFromFirebase() {
    const firebaseReady = await waitForFirebase();
    
    if (firebaseReady) {
        try {
            tickets = await window.firebaseApp.getAllTickets();
            console.log('✅ Tickets cargados desde Firebase:', tickets.length);
        } catch (error) {
            console.log('❌ Error cargando de Firebase, usando locales');
            loadTicketsLocal();
        }
    } else {
        console.log('⚠️ Firebase no disponible, usando datos locales');
        loadTicketsLocal();
    }
}

// 🔥 CARGAR TICKETS LOCALES (fallback)
function loadTicketsLocal() {
    const stored = localStorage.getItem('tickets');
    tickets = stored ? JSON.parse(stored) : [];
    
    // Si no hay tickets, crear algunos de ejemplo
    if (tickets.length === 0) {
        tickets = [
            {
                id: 1,
                nombre: "Ejemplo Usuario",
                email: "ejemplo@empresa.com",
                asunto: "Problema de demostración",
                mensaje: "Este es un ticket de ejemplo. Crea tu propio ticket para verlo aquí.",
                estado: "Abierto",
                fecha: new Date().toLocaleString('es-ES'),
                tecnico: "Sin Asignar",
                prioridad: "Media",
                comentarios: [],
                adjuntos: []
            }
        ];
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
}

// 🔥 INICIALIZAR APP
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 Iniciando app...');
    await loadTicketsFromFirebase();
    renderTickets();
    
    const form = document.getElementById('ticketForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleDeleteAll);
    }
});

// 🔥 MANEJAR ENVÍO DE FORMULARIO
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const asunto = document.getElementById('asunto').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();
    
    if (!nombre || !email || !asunto || !mensaje) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    const ticket = {
        nombre,
        email,
        asunto,
        mensaje,
        estado: 'Abierto',
        fecha: new Date().toLocaleString('es-ES'),
        tecnico: 'Sin Asignar',
        prioridad: 'Media',
        comentarios: [{
            autor: 'Sistema',
            texto: 'Ticket creado exitosamente.',
            fecha: new Date().toLocaleString('es-ES')
        }],
        adjuntos: []
    };
    
    // 🔥 USAR FIREBASE SI ESTÁ DISPONIBLE
    const firebaseReady = await waitForFirebase();
    
    if (firebaseReady) {
        try {
            const ticketId = await window.firebaseApp.createTicket(ticket);
            console.log('✅ Ticket guardado en Firebase:', ticketId);
            alert('✅ Ticket creado exitosamente (en nube)');
            
            // Recargar tickets desde Firebase
            await loadTicketsFromFirebase();
            renderTickets();
            
        } catch (error) {
            console.error('❌ Error con Firebase, guardando localmente');
            // Fallback a localStorage
            ticket.id = Date.now();
            tickets.push(ticket);
            localStorage.setItem('tickets', JSON.stringify(tickets));
            alert('✅ Ticket creado (guardado localmente)');
            renderTickets();
        }
    } else {
        // Usar localStorage
        ticket.id = Date.now();
        tickets.push(ticket);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        alert('✅ Ticket creado exitosamente');
        renderTickets();
    }
    
    e.target.reset();
    document.getElementById('mis-tickets').scrollIntoView({behavior: 'smooth'});
}

// 🔥 RENDERIZAR TICKETS
function renderTickets() {
    const ticketsList = document.getElementById('ticketsList');
    const clearBtn = document.getElementById('clearAllBtn');
    
    if (!ticketsList) return;

    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No hay tickets creados</h3>
                <p>Crea tu primer ticket de soporte para comenzar</p>
            </div>
        `;
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    if (clearBtn) clearBtn.style.display = 'inline-block';
    ticketsList.innerHTML = '';
    
    // Mostrar tickets más recientes primero
    [...tickets].reverse().slice(0, 5).forEach(ticket => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        
        // Mostrar fuente de datos
        const fuente = ticket.id && ticket.id.toString().startsWith('local_') 
            ? '🔴 Local' 
            : '🟢 Nube';

        li.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">
                    Ticket #${ticket.id} - ${ticket.asunto}
                    <span style="font-size: 0.7em; color: #666;">${fuente}</span>
                </div>
                <div class="ticket-status ${ticket.estado.toLowerCase()}">${ticket.estado}</div>
            </div>
            <div class="ticket-meta">
                👤 ${ticket.nombre} | 📅 ${ticket.fecha}
                <span class="ticket-assignee">🛠️ Asignado: ${ticket.tecnico || 'Sin Asignar'}</span>
            </div>
            <div class="ticket-message">${ticket.mensaje.substring(0, 100)}${ticket.mensaje.length > 100 ? '...' : ''}</div>
            <div class="ticket-actions">
                <a href="seguimiento.html?ticket=${ticket.id}" class="btn-toggle">Ver Detalles</a>
                <button class="btn-toggle" onclick="toggleEstado('${ticket.id}')">
                    Marcar como ${ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto'}
                </button>
            </div>
        `;
        ticketsList.appendChild(li);
    });
}

// 🔥 TOGGLE ESTADO
async function toggleEstado(ticketId) {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    const nuevoEstado = ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto';
    
    const firebaseReady = await waitForFirebase();
    
    if (firebaseReady && !ticketId.toString().startsWith('local_')) {
        // Actualizar en Firebase
        try {
            await window.firebaseApp.updateTicket(ticketId, {
                estado: nuevoEstado
            });
            console.log('✅ Estado actualizado en Firebase');
        } catch (error) {
            console.error('❌ Error actualizando en Firebase');
        }
    } else {
        // Actualizar localmente
        tickets = tickets.map(t => {
            if (t.id === ticketId) {
                t.estado = nuevoEstado;
                t.comentarios.push({
                    autor: 'Sistema',
                    texto: `Estado cambiado a ${nuevoEstado}.`,
                    fecha: new Date().toLocaleString('es-ES')
                });
            }
            return t;
        });
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
    
    renderTickets();
}

// Las funciones handleDeleteAll y otras permanecen igual
function handleDeleteAll() {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los tickets? Esto no se puede deshacer.')) {
        tickets = [];
        localStorage.setItem('tickets', JSON.stringify(tickets));
        renderTickets();
    }
}

// Función para guardar tickets (mantener compatibilidad)
function guardarTickets() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

function cargarTickets() {
    const storedTickets = localStorage.getItem('tickets');
    if (storedTickets) {
        tickets = JSON.parse(storedTickets);
    }
}