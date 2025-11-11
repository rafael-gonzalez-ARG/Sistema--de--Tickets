// firebase-app.js - VERSIÓN CORREGIDA (sin imports)
console.log('🔄 firebase-app.js cargado');

// 🔥 CONFIGURACIÓN FIREBASE - USA TU CONFIGURACIÓN REAL
const firebaseConfig = {
  apiKey: "AIzaSyD8We7XbbuIacCxUcwukhrAlmPCpsprZ9M",
  authDomain: "soportech-app.firebaseapp.com",
  projectId: "soportech-app",
  storageBucket: "soportech-app.firebasestorage.app",
  messagingSenderId: "864605721554",
  appId: "1:864605721554:web:b1998318a4e5fd3b3e2e0b"
};

console.log('🔧 Configuración Firebase cargada');

class FirebaseApp {
    constructor() {
        console.log('🏗️ Constructor FirebaseApp llamado');
        this.db = null;
        this.initialized = false;
        this.tecnicos = ['Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'];
        this.initFirebase();
    }

    initFirebase() {
        console.log('🔄 Intentando inicializar Firebase...');
        
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK no está cargado');
            return false;
        }
        
        try {
            console.log('✅ Firebase SDK disponible, inicializando...');
            
            // Inicializar Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.initialized = true;
            
            console.log('🎉 Firebase inicializado correctamente');
            return true;
        } catch (error) {
            console.error('💥 Error inicializando Firebase:', error);
            return false;
        }
    }

    // 🔹 CREAR TICKET
    async createTicket(ticketData) {
        console.log('📝 Creando ticket...', ticketData);
        
        if (!this.initialized) {
            console.error('❌ Firebase no inicializado, usando localStorage');
            return this.createTicketLocal(ticketData);
        }

        try {
            const docRef = await this.db.collection('tickets').add({
                ...ticketData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Ticket creado en Firebase:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ Error creando ticket en Firebase:', error);
            return this.createTicketLocal(ticketData);
        }
    }

    // 🔹 OBTENER TODOS LOS TICKETS
    async getAllTickets() {
        console.log('📋 Obteniendo tickets...');
        
        if (!this.initialized) {
            console.log('⚠️ Firebase no disponible, usando datos locales');
            return this.getTicketsLocal();
        }

        try {
            const snapshot = await this.db.collection('tickets')
                .orderBy('createdAt', 'desc')
                .get();
            
            const tickets = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                tickets.push({
                    id: doc.id,
                    ...data,
                    // Asegurar que tenga los campos necesarios
                    comentarios: data.comentarios || [],
                    adjuntos: data.adjuntos || []
                });
            });
            console.log(`✅ ${tickets.length} tickets obtenidos de Firebase`);
            return tickets;
        } catch (error) {
            console.error('❌ Error obteniendo tickets de Firebase:', error);
            return this.getTicketsLocal();
        }
    }

    // 🔹 ACTUALIZAR TICKET
    async updateTicket(ticketId, updates) {
        console.log('✏️ Actualizando ticket:', ticketId, updates);
        
        if (!this.initialized) {
            console.log('⚠️ Actualizando localmente');
            return this.updateTicketLocal(ticketId, updates);
        }

        try {
            await this.db.collection('tickets').doc(ticketId).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Ticket actualizado en Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error actualizando ticket en Firebase:', error);
            return this.updateTicketLocal(ticketId, updates);
        }
    }

    // 🔹 AGREGAR COMENTARIO
    async addComment(ticketId, commentData) {
        console.log('💬 Agregando comentario:', ticketId, commentData);
        
        if (!this.initialized) {
            console.log('⚠️ Agregando comentario localmente');
            return this.addCommentLocal(ticketId, commentData);
        }

        try {
            // Obtener ticket actual
            const ticketDoc = await this.db.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                console.error('❌ Ticket no encontrado');
                return false;
            }

            const ticket = ticketDoc.data();
            const updatedComments = [...(ticket.comentarios || []), commentData];

            await this.db.collection('tickets').doc(ticketId).update({
                comentarios: updatedComments,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Comentario agregado en Firebase');
            return true;
        } catch (error) {
            console.error('❌ Error agregando comentario:', error);
            return this.addCommentLocal(ticketId, commentData);
        }
    }

    // 🔹 MÉTODOS DE FALLBACK (localStorage)
    createTicketLocal(ticketData) {
        console.log('💾 Creando ticket localmente');
        const tickets = this.getTicketsLocal();
        const newTicket = {
            id: 'local_' + Date.now(),
            ...ticketData,
            createdAt: new Date().toISOString()
        };
        tickets.push(newTicket);
        localStorage.setItem('tickets_fallback', JSON.stringify(tickets));
        return newTicket.id;
    }

    getTicketsLocal() {
        const tickets = JSON.parse(localStorage.getItem('tickets_fallback') || '[]');
        console.log(`💾 ${tickets.length} tickets obtenidos localmente`);
        return tickets;
    }

    updateTicketLocal(ticketId, updates) {
        console.log('💾 Actualizando ticket localmente');
        const tickets = this.getTicketsLocal();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            tickets[index] = { ...tickets[index], ...updates };
            localStorage.setItem('tickets_fallback', JSON.stringify(tickets));
            return true;
        }
        return false;
    }

    addCommentLocal(ticketId, commentData) {
        console.log('💾 Agregando comentario localmente');
        const tickets = this.getTicketsLocal();
        const index = tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            if (!tickets[index].comentarios) {
                tickets[index].comentarios = [];
            }
            tickets[index].comentarios.push(commentData);
            localStorage.setItem('tickets_fallback', JSON.stringify(tickets));
            return true;
        }
        return false;
    }
}

// 🔹 INICIALIZAR CUANDO FIREBASE ESTÉ LISTO
function initializeFirebase() {
    console.log('🚀 Inicializando Firebase App...');
    window.firebaseApp = new FirebaseApp();
}

// 🔹 CARGAR FIREBASE SDK
function loadFirebaseSDK() {
    console.log('📥 Cargando Firebase SDK...');
    
    // Solo cargar si no está ya cargado
    if (typeof firebase === 'undefined') {
        console.log('⬇️ Descargando firebase-app.js...');
        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
        script.onload = () => {
            console.log('✅ firebase-app.js cargado');
            
            console.log('⬇️ Descargando firebase-firestore.js...');
            const script2 = document.createElement('script');
            script2.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js';
            script2.onload = () => {
                console.log('✅ firebase-firestore.js cargado');
                initializeFirebase();
            };
            script2.onerror = (e) => {
                console.error('❌ Error cargando firebase-firestore.js:', e);
            };
            document.head.appendChild(script2);
        };
        script.onerror = (e) => {
            console.error('❌ Error cargando firebase-app.js:', e);
        };
        document.head.appendChild(script);
    } else {
        console.log('✅ Firebase SDK ya estaba cargado');
        initializeFirebase();
    }
}

// Iniciar carga cuando el documento esté listo
console.log('📄 Estado del documento:', document.readyState);

if (document.readyState === 'loading') {
    console.log('⏳ Esperando DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', loadFirebaseSDK);
} else {
    console.log('🎯 DOM ya está listo, cargando Firebase...');
    loadFirebaseSDK();
}

console.log('🏁 firebase-app.js terminado de ejecutar');