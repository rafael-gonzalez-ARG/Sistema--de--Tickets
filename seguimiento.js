// Variables globales (DEBEN coincidir con la estructura del script de index.html)
let tickets = [];
const tecnicos = ['Sin Asignar', 'Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'];


// -----------------------------------------------------------------------
// Persistencia y Carga de Datos
// -----------------------------------------------------------------------

function guardarTickets() {
    // Para esta página, solo necesitamos cargar la función, no la implementación
    // La persistencia principal se maneja en index.html
}

function cargarTickets() {
    const storedTickets = localStorage.getItem('tickets');
    if (storedTickets) {
        tickets = JSON.parse(storedTickets);
    }
}

// -----------------------------------------------------------------------
// Renderizado y Filtrado
// -----------------------------------------------------------------------

function renderFilteredTickets(emailToFilter) {
    const ticketsList = document.getElementById('filteredTicketsList');
    ticketsList.innerHTML = '';
    
    // Obtener tickets filtrados (si el email está vacío, no muestra nada)
    const filteredTickets = emailToFilter 
        ? tickets.filter(t => t.email.toLowerCase() === emailToFilter.toLowerCase())
        : [];
        
    if (filteredTickets.length === 0 && emailToFilter) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🧐</div>
                <h3>No se encontraron tickets</h3>
                <p>Verifica el correo electrónico ingresado e inténtalo de nuevo.</p>
            </div>
        `;
        return;
    } else if (!emailToFilter) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📧</div>
                <h3>Ingresa tu correo</h3>
                <p>Para ver el historial de tus tickets, ingresa tu dirección de correo electrónico en la barra de arriba.</p>
            </div>
        `;
        return;
    }

    // Mostrar tickets más recientes primero
    [...filteredTickets].reverse().forEach(ticket => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        
        // Renderizar historial de comentarios (idéntico al script.js del index)
        const commentsHtml = ticket.comentarios.map(c => `
            <div class="comment-item ${c.autor === ticket.nombre ? 'comment-user' : 'comment-support'}">
                <strong>${c.autor}</strong>: ${c.texto}
                <div class="comment-time">${c.fecha}</div>
            </div>
        `).join('');

        // Simulación de adjuntos
        const attachmentsHtml = ticket.adjuntos.length > 0 ? 
            `<div class="ticket-attachments">
                <strong>Adjuntos:</strong> ${ticket.adjuntos.join(', ')} 
            </div>` : '';


        li.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">Ticket #${ticket.id} - ${ticket.asunto}</div>
                <div class="ticket-status ${ticket.estado.toLowerCase()}">${ticket.estado}</div>
            </div>
            <div class="ticket-meta">
                👤 ${ticket.nombre} | 📧 ${ticket.email} | 📅 ${ticket.fecha}
                <span class="ticket-assignee">🛠️ Asignado: ${ticket.tecnico}</span>
            </div>
            <div class="ticket-message">${ticket.mensaje}</div>

            ${attachmentsHtml}

            <div class="comments-section" id="comments-${ticket.id}">
                <h4>Comentarios (${ticket.comentarios.length})</h4>
                <div class="comments-history">${commentsHtml}</div>
                
                <form class="comment-form" onsubmit="addComment(event, ${ticket.id})">
                    <textarea placeholder="Escribe un comentario..." required></textarea>
                    <input type="file" class="comment-file" accept=".pdf, image/*">
                    <button type="submit" class="btn-comment">Enviar Comentario</button>
                    <button type="button" class="btn-toggle" onclick="toggleEstado(${ticket.id})">
                        Marcar como ${ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto'}
                    </button>
                </form>
            </div>
        `;
        ticketsList.appendChild(li);
    });
}

// Función que se llama desde el botón "Filtrar"
function filterTicketsByEmail() {
    const email = document.getElementById('filterEmail').value.trim();
    renderFilteredTickets(email);
}


// -----------------------------------------------------------------------
// Lógica de Comentarios y Toggle (copiada de index.html)
// -----------------------------------------------------------------------

function addComment(e, id) {
    e.preventDefault();
    
    const form = e.target;
    const textarea = form.querySelector('textarea');
    const fileInput = form.querySelector('.comment-file');
    const commentText = textarea.value.trim();
    
    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1 || !commentText) return;
    
    // Simular archivo adjunto
    let fileName = '';
    if (fileInput.files.length > 0) {
        fileName = `📄 ${fileInput.files[0].name}`;
        tickets[ticketIndex].adjuntos.push(fileName);
    }

    // Añadir el comentario del usuario
    tickets[ticketIndex].comentarios.push({
        autor: tickets[ticketIndex].nombre, 
        texto: commentText,
        fecha: new Date().toLocaleString('es-ES'),
        tipo: 'usuario',
        email: tickets[ticketIndex].email
    });

    // Guardar en ambos sistemas (tickets regulares y técnicos)
    localStorage.setItem('tickets', JSON.stringify(tickets));
    
    // También guardar en la base de datos técnica
    if (typeof ticketDB !== 'undefined') {
        ticketDB.addUserComment(id, commentText, tickets[ticketIndex].nombre, tickets[ticketIndex].email);
    }
    
    // Para re-renderizar, obtenemos el email actual del filtro
    const currentEmail = document.getElementById('filterEmail').value.trim();
    renderFilteredTickets(currentEmail);
    
    textarea.value = ''; // Limpiar textarea
    fileInput.value = ''; // Limpiar input de archivo
}


function toggleEstado(id) {
    tickets = tickets.map(ticket => {
        if (ticket.id === id) {
            ticket.estado = ticket.estado === 'Abierto' ? 'Cerrado' : 'Abierto';
            ticket.comentarios.push({
                autor: 'Sistema',
                texto: `Estado cambiado a ${ticket.estado}.`,
                fecha: new Date().toLocaleString('es-ES')
            });
        }
        return ticket;
    });
    localStorage.setItem('tickets', JSON.stringify(tickets));
    const currentEmail = document.getElementById('filterEmail').value.trim();
    renderFilteredTickets(currentEmail);
}


// -----------------------------------------------------------------------
// Inicialización
// -----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    cargarTickets();
    // Intenta usar el último email almacenado, o deja la barra vacía.
    const lastEmail = localStorage.getItem('lastUserEmail') || '';
    document.getElementById('filterEmail').value = lastEmail;
    
    // Renderiza la vista inicial (mostrará el mensaje de ingreso de email si no hay lastEmail)
    renderFilteredTickets(lastEmail);
});