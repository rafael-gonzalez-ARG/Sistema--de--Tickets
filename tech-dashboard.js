// Dashboard functionality for technicians
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    
    // Sincronizar base de datos al cargar
    ticketDB.syncWithUserTickets();
    
    // Mostrar información del usuario
    const username = localStorage.getItem('techUsername') || 'Técnico';
    document.getElementById('userName').textContent = username;
    document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();
    
    loadDashboardData();
});

function loadDashboardData() {
    // Cargar estadísticas desde la base de datos
    const stats = ticketDB.getStats();
    
    // Mostrar estadísticas generales
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
            <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: bold; color: #1976d2;">${stats.total}</div>
                <div style="font-size: 0.8em;">Total</div>
            </div>
            <div style="background: #fff3e0; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: bold; color: #f57c00;">${stats.abiertos}</div>
                <div style="font-size: 0.8em;">Abiertos</div>
            </div>
            <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: bold; color: #388e3c;">${stats.cerrados}</div>
                <div style="font-size: 0.8em;">Cerrados</div>
            </div>
            <div style="background: #fce4ec; padding: 10px; border-radius: 6px; text-align: center;">
                <div style="font-size: 1.5em; font-weight: bold; color: #c2185b;">${stats.enProceso}</div>
                <div style="font-size: 0.8em;">En Proceso</div>
            </div>
        </div>
        
        ${renderTechStats(stats.porTecnico)}
    `;
    
    // Mostrar tickets recientes
    renderRecentTickets(ticketDB.getAllTickets());
}

function renderTechStats(statsByTech) {
    let html = '<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">';
    html += '<h4 style="margin-bottom: 10px; color: #003366;">Por Técnico:</h4>';
    
    Object.keys(statsByTech).forEach(tech => {
        const stats = statsByTech[tech];
        if (stats.total > 0) {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-weight: 500;">${tech}</span>
                    <span style="font-size: 0.9em;">
                        <span style="color: #f57c00;">${stats.abiertos}A</span> / 
                        <span style="color: #388e3c;">${stats.cerrados}C</span>
                    </span>
                </div>
            `;
        }
    });
    
    html += '</div>';
    return html;
}

function renderRecentTickets(tickets) {
    const ticketsList = document.getElementById('techTicketsList');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No hay tickets en el sistema</h3>
                <p>Los tickets creados por los usuarios aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    ticketsList.innerHTML = '';
    
    // Mostrar los 10 tickets más recientes
    [...tickets].reverse().slice(0, 10).forEach(ticket => {
        const li = document.createElement('li');
        li.className = 'ticket-item';
        
        // Determinar color de prioridad
        const prioridadColor = {
            'Alta': '#dc3545',
            'Media': '#ffc107',
            'Baja': '#28a745'
        }[ticket.prioridad] || '#6c757d';
        
        // Obtener todos los comentarios (ordenados del más antiguo al más reciente)
        const todosComentarios = [...ticket.comentarios];
        const comentariosRecientes = [...ticket.comentarios].slice(-6); // Últimos 6 comentarios
        
        // Contar comentarios no leídos (opcional)
        const comentariosNoLeidos = ticket.comentarios.filter(c => 
            c.tipo === 'usuario' && !c.leido
        ).length;
        
        li.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">
                    Ticket #${ticket.id} - ${ticket.asunto}
                    ${comentariosNoLeidos > 0 ? `<span class="new-comments-indicator">${comentariosNoLeidos}</span>` : ''}
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="background: ${prioridadColor}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.8em;">
                        ${ticket.prioridad}
                    </span>
                    <div class="ticket-status ${ticket.estado.toLowerCase()}">${ticket.estado}</div>
                </div>
            </div>
            <div class="ticket-meta">
                👤 ${ticket.nombre} | 📧 ${ticket.email} | 📅 ${ticket.fecha}
                <span class="ticket-assignee">🛠️ ${ticket.tecnico || 'Sin asignar'}</span>
            </div>
            <div class="ticket-message">${ticket.mensaje.substring(0, 120)}${ticket.mensaje.length > 120 ? '...' : ''}</div>
            
            <!-- Sección de Chat con Scroll -->
            <div class="comments-preview" id="chat-${ticket.id}">
                <strong>💬 Historial de conversación (${ticket.comentarios.length} mensajes):</strong>
                ${todosComentarios.length > 0 ? 
                    todosComentarios.map(comentario => `
                        <div class="comment-preview-item ${getCommentClass(comentario)}">
                            <span class="comment-author">
                                ${getCommentIcon(comentario)} ${comentario.autor}
                                ${comentario.tipo === 'interno' ? ' (Interno)' : ''}
                            </span>
                            <span class="comment-text">${comentario.texto}</span>
                            <span class="comment-time">${formatTime(comentario.fecha)}</span>
                        </div>
                    `).join('') : 
                    '<div class="no-comments">No hay comentarios aún. Sé el primero en escribir.</div>'
                }
            </div>
            
            ${todosComentarios.length > 6 ? `
                <button class="expand-chat-btn" onclick="toggleFullChat(${ticket.id})">
                    📜 Ver conversación completa (${todosComentarios.length} mensajes)
                </button>
            ` : ''}
            
            <!-- Formulario de Comentario Rápido -->
            <div class="quick-comment-form">
                <textarea 
                    id="comment-${ticket.id}" 
                    placeholder="Escribe una respuesta para ${ticket.nombre}..." 
                    rows="2"
                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; font-size: 0.9em;"
                ></textarea>
                <div class="ticket-actions">
                    <button class="btn-toggle" onclick="assignToMe(${ticket.id})">Asignarme</button>
                    <button class="btn-toggle" onclick="quickUpdate(${ticket.id}, '${ticket.estado}')">
                        ${ticket.estado === 'Abierto' ? 'Cerrar' : 'Reabrir'}
                    </button>
                    <button class="btn-comment" onclick="addQuickComment(${ticket.id})">📨 Enviar Respuesta</button>
                    <button class="btn-toggle" onclick="addInternalNote(${ticket.id})" style="background: #6c757d; border-color: #6c757d;">
                        📝 Nota Interna
                    </button>
                </div>
            </div>
        `;
        ticketsList.appendChild(li);
        
        // Auto-scroll al final del chat
        setTimeout(() => {
            const chatContainer = document.getElementById(`chat-${ticket.id}`);
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 100);
    });
}

// Funciones auxiliares para el chat
function getCommentClass(comentario) {
    switch(comentario.tipo) {
        case 'usuario': return 'user-comment';
        case 'tecnico': return 'tech-comment';
        case 'interno': return 'internal-comment';
        default: return comentario.autor === 'Sistema' ? 'internal-comment' : 'user-comment';
    }
}

function getCommentIcon(comentario) {
    switch(comentario.tipo) {
        case 'usuario': return '👤';
        case 'tecnico': return '🛠️';
        case 'interno': return '🔒';
        default: return comentario.autor === 'Sistema' ? '⚙️' : '👤';
    }
}

function formatTime(fechaString) {
    const fecha = new Date(fechaString);
    if (isNaN(fecha.getTime())) {
        return fechaString; // Si no es una fecha válida, devolver el string original
    }
    return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para expandir/contraer chat (modal simple)
function toggleFullChat(ticketId) {
    const ticket = ticketDB.getAllTickets().find(t => t.id === ticketId);
    if (!ticket) return;
    
    const modalHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 600px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                    <h3>💬 Conversación completa - Ticket #${ticket.id}</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
                </div>
                <div style="flex-grow: 1; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 6px; margin-bottom: 15px;">
                    ${ticket.comentarios.map(comentario => `
                        <div class="comment-preview-item ${getCommentClass(comentario)}" style="margin-bottom: 10px;">
                            <span class="comment-author">
                                ${getCommentIcon(comentario)} ${comentario.autor}
                                ${comentario.tipo === 'interno' ? ' (Interno)' : ''}
                            </span>
                            <span class="comment-text">${comentario.texto}</span>
                            <span class="comment-time">${formatTime(comentario.fecha)}</span>
                        </div>
                    `).join('')}
                </div>
                <div>
                    <textarea 
                        id="modal-comment-${ticketId}" 
                        placeholder="Escribe una respuesta..." 
                        rows="3"
                        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px; font-size: 0.9em;"
                    ></textarea>
                    <button onclick="addCommentFromModal(${ticketId})" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">📨 Enviar</button>
                    <button onclick="addInternalNoteFromModal(${ticketId})" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">📝 Nota Interna</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay uno
    const existingModal = document.querySelector('.chat-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'chat-modal';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);
    
    // Auto-scroll al final del chat en el modal
    setTimeout(() => {
        const chatContainer = modal.querySelector('div[style*="overflow-y: auto"]');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, 100);
}

function addCommentFromModal(ticketId) {
    const textarea = document.getElementById(`modal-comment-${ticketId}`);
    const comentario = textarea.value.trim();
    
    if (!comentario) {
        alert('Por favor, escribe un comentario antes de enviar.');
        return;
    }
    
    const username = localStorage.getItem('techUsername') || 'Técnico';
    const userEmail = username.toLowerCase().replace(' ', '.') + '@soporte.com';
    
    if (ticketDB.addTechComment(ticketId, comentario, userEmail, false)) {
        textarea.value = ''; // Limpiar textarea
        // Recargar el dashboard para mostrar los cambios
        loadDashboardData();
        // Cerrar el modal
        document.querySelector('.chat-modal').remove();
    }
}

function addInternalNoteFromModal(ticketId) {
    const textarea = document.getElementById(`modal-comment-${ticketId}`);
    const nota = textarea.value.trim();
    
    if (!nota) {
        alert('Por favor, escribe una nota interna.');
        return;
    }
    
    const username = localStorage.getItem('techUsername') || 'Técnico';
    const userEmail = username.toLowerCase().replace(' ', '.') + '@soporte.com';
    
    if (ticketDB.addTechComment(ticketId, nota, userEmail, true)) {
        textarea.value = ''; // Limpiar textarea
        // Recargar el dashboard para mostrar los cambios
        loadDashboardData();
        // Cerrar el modal
        document.querySelector('.chat-modal').remove();
    }
}

function addQuickComment(ticketId) {
    const textarea = document.getElementById(`comment-${ticketId}`);
    const comentario = textarea.value.trim();
    
    if (!comentario) {
        alert('Por favor, escribe un comentario antes de enviar.');
        return;
    }
    
    const username = localStorage.getItem('techUsername') || 'Técnico';
    const userEmail = username.toLowerCase().replace(' ', '.') + '@soporte.com';
    
    if (ticketDB.addTechComment(ticketId, comentario, userEmail, false)) {
        alert('✅ Comentario enviado al usuario');
        textarea.value = ''; // Limpiar textarea
        loadDashboardData(); // Recargar para mostrar el nuevo comentario
        
        // Auto-scroll al final del chat después de agregar comentario
        setTimeout(() => {
            const chatContainer = document.getElementById(`chat-${ticketId}`);
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }, 200);
    } else {
        alert('❌ Error al enviar el comentario');
    }
}

function addInternalNote(ticketId) {
    const nota = prompt('Escribe una nota interna para el equipo técnico:');
    if (nota && nota.trim()) {
        const username = localStorage.getItem('techUsername') || 'Técnico';
        const userEmail = username.toLowerCase().replace(' ', '.') + '@soporte.com';
        
        if (ticketDB.addTechComment(ticketId, nota, userEmail, true)) {
            alert('✅ Nota interna guardada');
            loadDashboardData();
        }
    }
}

function assignToMe(ticketId) {
    const username = localStorage.getItem('techUsername') || 'Técnico';
    const userEmail = username.toLowerCase().replace(' ', '.') + '@soporte.com';
    
    if (ticketDB.assignTicket(ticketId, username, userEmail)) {
        alert(`✅ Ticket asignado a ${username}`);
        loadDashboardData(); // Recargar datos
    } else {
        alert('❌ Error al asignar el ticket');
    }
}

function quickUpdate(ticketId, estadoActual) {
    const userEmail = localStorage.getItem('techUsername') ? 
        localStorage.getItem('techUsername').toLowerCase().replace(' ', '.') + '@soporte.com' : '';
    
    const nuevoEstado = estadoActual === 'Abierto' ? 'Cerrado' : 'Abierto';
    
    if (ticketDB.updateTicketStatus(ticketId, nuevoEstado, userEmail)) {
        alert(`✅ Ticket ${nuevoEstado.toLowerCase()} exitosamente`);
        loadDashboardData(); // Recargar datos
    } else {
        alert('❌ Error al actualizar el ticket');
    }
}

function viewTicketDetails(ticketId) {
    // Redirigir a página de detalles del ticket
    window.location.href = `tech-ticket-detail.html?id=${ticketId}`;
}