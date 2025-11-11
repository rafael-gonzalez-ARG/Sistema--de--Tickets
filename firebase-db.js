
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where, 
    orderBy,
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABC...",
    authDomain: "soportech-app.firebaseapp.com",
    projectId: "soportech-app",
    storageBucket: "soportech-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123..."
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class FirebaseDB {
    constructor() {
        this.tecnicos = ['Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'];
    }

    // 🔹 CREAR TICKET
    async createTicket(ticketData) {
        try {
            const ticketWithTimestamp = {
                ...ticketData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            const docRef = await addDoc(collection(db, "tickets"), ticketWithTimestamp);
            console.log("Ticket creado con ID: ", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creando ticket: ", error);
            throw error;
        }
    }

    // 🔹 OBTENER TODOS LOS TICKETS
    async getAllTickets() {
        try {
            const querySnapshot = await getDocs(collection(db, "tickets"));
            const tickets = [];
            querySnapshot.forEach((doc) => {
                tickets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return tickets;
        } catch (error) {
            console.error("Error obteniendo tickets: ", error);
            return [];
        }
    }

    // 🔹 ESCUCHAR CAMBIOS EN TIEMPO REAL
    onTicketsChange(callback) {
        const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (querySnapshot) => {
            const tickets = [];
            querySnapshot.forEach((doc) => {
                tickets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            callback(tickets);
        });
    }

    // 🔹 ACTUALIZAR TICKET
    async updateTicket(ticketId, updates) {
        try {
            const ticketRef = doc(db, "tickets", ticketId);
            await updateDoc(ticketRef, {
                ...updates,
                updatedAt: new Date()
            });
            console.log("Ticket actualizado: ", ticketId);
            return true;
        } catch (error) {
            console.error("Error actualizando ticket: ", error);
            return false;
        }
    }

    // 🔹 AGREGAR COMENTARIO
    async addComment(ticketId, commentData) {
        try {
            const commentWithTimestamp = {
                ticketId: ticketId,
                ...commentData,
                createdAt: new Date()
            };
            
            await addDoc(collection(db, "comments"), commentWithTimestamp);
            
            // También agregar el comentario al ticket para fácil acceso
            const ticketRef = doc(db, "tickets", ticketId);
            const ticket = await this.getTicket(ticketId);
            const updatedComments = [...(ticket.comentarios || []), commentData];
            
            await updateDoc(ticketRef, {
                comentarios: updatedComments,
                updatedAt: new Date()
            });
            
            return true;
        } catch (error) {
            console.error("Error agregando comentario: ", error);
            return false;
        }
    }

    // 🔹 OBTENER TICKET ESPECÍFICO
    async getTicket(ticketId) {
        // Implementar si necesitas obtener un ticket específico
        const tickets = await this.getAllTickets();
        return tickets.find(t => t.id === ticketId);
    }

    // 🔹 OBTENER ESTADÍSTICAS
    async getStats() {
        const tickets = await this.getAllTickets();
        const total = tickets.length;
        const abiertos = tickets.filter(t => t.estado === 'Abierto').length;
        const cerrados = tickets.filter(t => t.estado === 'Cerrado').length;
        const enProceso = total - abiertos - cerrados;

        return { total, abiertos, cerrados, enProceso };
    }
}

// Crear instancia global
const firebaseDB = new FirebaseDB();