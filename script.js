// Variables globales
let tickets = [];
// Lista de técnicos (solo se asigna 'Sin Asignar' al crear, la asignación es simulada)
const tecnicos = ['Sin Asignar', 'Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'];


// -----------------------------------------------------------------------
// Persistencia de datos (LocalStorage)
// -----------------------------------------------------------------------

function guardarTickets() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
    // Guardar el último email usado para precargar el filtro en seguimiento.html
    const lastEmail = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    if (lastEmail) {
        localStorage.setItem('lastUserEmail', lastEmail);
    }
}

function cargarTickets() {
    const storedTickets = localStorage.getItem('tickets');
    if (storedTickets) {
        tickets = JSON.parse(storedTickets);
    }
}

// -----------------------------------------------------------------------
// Renderizado
// -----------------------------------------------------------------------

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
        clearBtn.style.display = 'none';
        return;
    }
    
    clearBtn.style.display = 'inline-block';
    ticketsList.innerHTML = '';
    
    // Mostrar tickets más recientes primero (solo mostramos los 5 más recientes en el index)
    [...tickets].reverse().slice(0, 5).forEach(ticket => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        
        // Simulación de asignación simple para la vista del index
        const tecnicoAsignado = ticket.tecnico || tecnicos[0]; 

        li.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">Ticket #${ticket.id} - ${ticket.asunto}</div>
                <div class="ticket-status ${ticket.estado.toLowerCase()}">${ticket.estado}</div>
            </div>
            <div class="ticket-meta">
                👤 ${ticket.nombre} | 📅 ${ticket.fecha}
                <span class="ticket-assignee">🛠️ Asignado: ${tecnicoAsignado}</span>
            </div>
            <div class="ticket-message">${ticket.mensaje.substring(0, 100)}${ticket.mensaje.length > 100 ? '...' : ''}</div>
            <div class="ticket-actions">
                <a href="seguimiento.html" class="btn-toggle">Ver Detalles</a>
                <button class="btn-toggle" onclick="toggleEstado(${ticket.id})">
                    Marcar como ${ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto'}
                </button>
            </div>
        `;
        ticketsList.appendChild(li);
    });
}

// -----------------------------------------------------------------------
// Eventos y Lógica
// -----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    cargarTickets();
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

// Manejar envío del formulario (Creación de Ticket)
function handleFormSubmit(e) {
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
        id: Date.now(),
        nombre,
        email,
        asunto,
        mensaje,
        estado: 'Abierto',
        fecha: new Date().toLocaleString('es-ES'),
        tecnico: tecnicos[0], // Siempre inicia como 'Sin Asignar'
        comentarios: [{
            autor: 'Sistema',
            texto: 'Ticket creado exitosamente.',
            fecha: new Date().toLocaleString('es-ES')
        }],
        adjuntos: [] 
    };
    
    tickets.push(ticket);
    guardarTickets();
    renderTickets();
    
    // Limpiar formulario y scroll
    e.target.reset();
    document.getElementById('mis-tickets').scrollIntoView({behavior: 'smooth'});
    alert('✅ Ticket creado exitosamente. Revisa la sección Mis Tickets.');
};

// Cambiar estado del ticket
function toggleEstado(id) {
    tickets = tickets.map(ticket => {
        if (ticket.id === id) {
            ticket.estado = ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto';
            // Añadir comentario del sistema
            ticket.comentarios.push({
                autor: 'Sistema',
                texto: `Estado cambiado a ${ticket.estado}.`,
                fecha: new Date().toLocaleString('es-ES')
            });
        }
        return ticket;
    });
    guardarTickets();
    renderTickets();
}

// Eliminar todos los tickets
function handleDeleteAll() {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los tickets? Esto no se puede deshacer.')) {
        tickets = [];
        guardarTickets();
        renderTickets();
    }
}