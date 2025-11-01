// Base de datos simple con localStorage para tickets técnicos
class TicketDB {
    constructor() {
        this.tickets = this.loadTickets();
        this.tecnicos = ['Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'];
    }

    addUserComment(ticketId, comentario, usuarioNombre, usuarioEmail) {
    const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        this.tickets[ticketIndex].comentarios.push({
            autor: usuarioNombre,
            texto: comentario,
            fecha: new Date().toLocaleString('es-ES'),
            tipo: 'usuario',
            email: usuarioEmail
        });
        this.saveTickets();
        return true;
    }
    return false;
    }

    // Cargar tickets desde localStorage
    loadTickets() {
        const stored = localStorage.getItem('techTickets');
        if (stored) {
            return JSON.parse(stored);
        }
        
        // Si no hay datos, cargar desde los tickets existentes
        const userTickets = localStorage.getItem('tickets');
        if (userTickets) {
            const tickets = JSON.parse(userTickets);
            // Agregar campos técnicos adicionales
            const techTickets = tickets.map(ticket => ({
                ...ticket,
                tecnico_email: '', // Correo del técnico asignado
                prioridad: 'Media', // Alta, Media, Baja
                categoria: 'General', // Software, Hardware, Redes, etc.
                tiempo_estimado: '', // Tiempo estimado de resolución
                fecha_cierre: '', // Fecha cuando se cierra el ticket
                notas_tecnicas: '' // Notas internas del técnico
            }));
            this.saveTickets(techTickets);
            return techTickets;
        }
        
        return [];
    }

    // Guardar tickets en localStorage
    saveTickets(tickets = this.tickets) {
        localStorage.setItem('techTickets', JSON.stringify(tickets));
        this.tickets = tickets;
    }

    // Obtener todos los tickets
    getAllTickets() {
        return this.tickets;
    }

    // Obtener tickets por técnico (por email)
    getTicketsByTecnico(email) {
        return this.tickets.filter(ticket => ticket.tecnico_email === email);
    }

    // Obtener tickets asignados a un técnico específico
    getTicketsByTecnicoName(nombre) {
        return this.tickets.filter(ticket => ticket.tecnico === nombre);
    }

    // Asignar ticket a técnico
    assignTicket(ticketId, tecnicoNombre, tecnicoEmail) {
        const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            this.tickets[ticketIndex].tecnico = tecnicoNombre;
            this.tickets[ticketIndex].tecnico_email = tecnicoEmail;
            this.tickets[ticketIndex].comentarios.push({
                autor: 'Sistema',
                texto: `Ticket asignado a ${tecnicoNombre} (${tecnicoEmail}).`,
                fecha: new Date().toLocaleString('es-ES')
            });
            this.saveTickets();
            return true;
        }
        return false;
    }

    // Cambiar estado del ticket
    updateTicketStatus(ticketId, nuevoEstado, tecnicoEmail = '') {
        const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            this.tickets[ticketIndex].estado = nuevoEstado;
            
            if (nuevoEstado === 'Cerrado') {
                this.tickets[ticketIndex].fecha_cierre = new Date().toLocaleString('es-ES');
            }
            
            this.tickets[ticketIndex].comentarios.push({
                autor: tecnicoEmail || 'Sistema',
                texto: `Estado cambiado a ${nuevoEstado}.`,
                fecha: new Date().toLocaleString('es-ES')
            });
            this.saveTickets();
            return true;
        }
        return false;
    }

    // Agregar comentario técnico
    addTechComment(ticketId, comentario, tecnicoEmail, esInterno = false) {
    const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        const tipo = esInterno ? '[NOTA INTERNA] ' : '';
        this.tickets[ticketIndex].comentarios.push({
            autor: tecnicoEmail,
            texto: tipo + comentario,
            fecha: new Date().toLocaleString('es-ES'),
            tipo: esInterno ? 'interno' : 'tecnico',
            email: tecnicoEmail
        });
        this.saveTickets();
        return true;
    }
    return false;
    }

    // Actualizar información técnica del ticket
    updateTechInfo(ticketId, updates) {
        const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex !== -1) {
            this.tickets[ticketIndex] = { ...this.tickets[ticketIndex], ...updates };
            this.saveTickets();
            return true;
        }
        return false;
    }

    // Obtener estadísticas
    getStats() {
        const total = this.tickets.length;
        const abiertos = this.tickets.filter(t => t.estado === 'Abierto').length;
        const cerrados = this.tickets.filter(t => t.estado === 'Cerrado').length;
        const enProceso = total - abiertos - cerrados;

        // Estadísticas por técnico
        const statsByTech = {};
        this.tecnicos.forEach(tech => {
            const techTickets = this.getTicketsByTecnicoName(tech);
            statsByTech[tech] = {
                total: techTickets.length,
                abiertos: techTickets.filter(t => t.estado === 'Abierto').length,
                cerrados: techTickets.filter(t => t.estado === 'Cerrado').length
            };
        });

        return {
            total,
            abiertos,
            cerrados,
            enProceso,
            porTecnico: statsByTech
        };
    }

    // Sincronizar con tickets de usuarios (por si hay nuevos tickets)
    syncWithUserTickets() {
        const userTickets = localStorage.getItem('tickets');
        if (userTickets) {
            const nuevosTickets = JSON.parse(userTickets);
            
            nuevosTickets.forEach(nuevoTicket => {
                const existe = this.tickets.find(t => t.id === nuevoTicket.id);
                if (!existe) {
                    // Agregar campos técnicos al nuevo ticket
                    this.tickets.push({
                        ...nuevoTicket,
                        tecnico_email: '',
                        prioridad: 'Media',
                        categoria: 'General',
                        tiempo_estimado: '',
                        fecha_cierre: '',
                        notas_tecnicas: ''
                    });
                }
            });
            
            this.saveTickets();
        }
    }
}

// Instancia global de la base de datos
const ticketDB = new TicketDB();