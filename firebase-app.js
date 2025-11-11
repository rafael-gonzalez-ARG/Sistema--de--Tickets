// firebase-app.js - ARCHIVO COMPLETO Y FUNCIONAL
console.log('🎯 firebase-app.js INICIADO');

// 🔥 CONFIGURACIÓN FIREBASE - TUS DATOS REALES
const firebaseConfig = {
  apiKey: "AIzaSyD8We7XbbuIacCxUcwukhrAlmPCpsprZ9M",
  authDomain: "soportech-app.firebaseapp.com",
  projectId: "soportech-app",
  storageBucket: "soportech-app.firebasestorage.app",
  messagingSenderId: "864605721554",
  appId: "1:864605721554:web:b1998318a4e5fd3b3e2e0b"
};

console.log('✅ Configuración Firebase lista');

// SIMULAR FIREBASE PARA PRUEBAS - SI FALLAN LOS SCRIPTS EXTERNOS
function initializeMockFirebase() {
    console.log('🔄 Inicializando Firebase Mock (para pruebas)');
    
    window.firebaseApp = {
        initialized: true,
        db: null,
        tecnicos: ['Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'],
        
        async createTicket(ticketData) {
            console.log('💾 Mock: Creando ticket localmente', ticketData);
            const tickets = this.getTicketsLocal();
            const newTicket = {
                id: 'mock_' + Date.now(),
                ...ticketData,
                createdAt: new Date().toISOString()
            };
            tickets.push(newTicket);
            localStorage.setItem('tickets_mock', JSON.stringify(tickets));
            return newTicket.id;
        },
        
        async getAllTickets() {
            console.log('💾 Mock: Obteniendo tickets locales');
            return this.getTicketsLocal();
        },
        
        async updateTicket(ticketId, updates) {
            console.log('💾 Mock: Actualizando ticket', ticketId, updates);
            const tickets = this.getTicketsLocal();
            const index = tickets.findIndex(t => t.id === ticketId);
            if (index !== -1) {
                tickets[index] = { ...tickets[index], ...updates };
                localStorage.setItem('tickets_mock', JSON.stringify(tickets));
                return true;
            }
            return false;
        },
        
        getTicketsLocal() {
            return JSON.parse(localStorage.getItem('tickets_mock') || '[]');
        }
    };
    
    console.log('✅ Firebase Mock inicializado');
}

// 🔥 INTENTAR CARGAR FIREBASE REAL
function loadRealFirebase() {
    console.log('⬇️ Intentando cargar Firebase SDK...');
    
    const script1 = document.createElement('script');
    script1.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js';
    
    script1.onload = function() {
        console.log('✅ firebase-app.js cargado');
        
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js';
        
        script2.onload = function() {
            console.log('✅ firebase-firestore.js cargado');
            initializeRealFirebase();
        };
        
        script2.onerror = function(e) {
            console.error('❌ Error cargando firebase-firestore.js:', e);
            initializeMockFirebase();
        };
        
        document.head.appendChild(script2);
    };
    
    script1.onerror = function(e) {
        console.error('❌ Error cargando firebase-app.js:', e);
        initializeMockFirebase();
    };
    
    document.head.appendChild(script1);
}

// 🔥 INICIALIZAR FIREBASE REAL
function initializeRealFirebase() {
    console.log('🚀 Inicializando Firebase Real...');
    
    try {
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está definido');
        }
        
        // Inicializar Firebase
        const app = firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        window.firebaseApp = {
            initialized: true,
            db: db,
            tecnicos: ['Emmanuel Pilco', 'Rodrigo Tapia', 'Naobi Fernandez', 'Rafael Gonzalez'],
            
            async createTicket(ticketData) {
                try {
                    const docRef = await this.db.collection('tickets').add({
                        ...ticketData,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Ticket creado en Firebase REAL:', docRef.id);
                    return docRef.id;
                } catch (error) {
                    console.error('❌ Error con Firebase real, usando mock:', error);
                    return this.createTicketMock(ticketData);
                }
            },
            
            async getAllTickets() {
                try {
                    const snapshot = await this.db.collection('tickets')
                        .orderBy('createdAt', 'desc')
                        .get();
                    
                    const tickets = [];
                    snapshot.forEach(doc => {
                        tickets.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log(`✅ ${tickets.length} tickets de Firebase REAL`);
                    return tickets;
                } catch (error) {
                    console.error('❌ Error obteniendo de Firebase real, usando mock:', error);
                    return this.getTicketsMock();
                }
            },
            
            async updateTicket(ticketId, updates) {
                try {
                    await this.db.collection('tickets').doc(ticketId).update({
                        ...updates,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Ticket actualizado en Firebase REAL');
                    return true;
                } catch (error) {
                    console.error('❌ Error actualizando en Firebase real, usando mock:', error);
                    return this.updateTicketMock(ticketId, updates);
                }
            },
            
            // Métodos mock como fallback
            createTicketMock(ticketData) {
                const tickets = this.getTicketsMock();
                const newTicket = {
                    id: 'mock_' + Date.now(),
                    ...ticketData,
                    createdAt: new Date().toISOString()
                };
                tickets.push(newTicket);
                localStorage.setItem('tickets_mock', JSON.stringify(tickets));
                return newTicket.id;
            },
            
            getTicketsMock() {
                return JSON.parse(localStorage.getItem('tickets_mock') || '[]');
            },
            
            updateTicketMock(ticketId, updates) {
                const tickets = this.getTicketsMock();
                const index = tickets.findIndex(t => t.id === ticketId);
                if (index !== -1) {
                    tickets[index] = { ...tickets[index], ...updates };
                    localStorage.setItem('tickets_mock', JSON.stringify(tickets));
                    return true;
                }
                return false;
            }
        };
        
        console.log('🎉 Firebase REAL inicializado correctamente');
        
    } catch (error) {
        console.error('💥 Error inicializando Firebase real:', error);
        initializeMockFirebase();
    }
}

// 🔥 INICIAR CARGA
console.log('🎬 Iniciando carga de Firebase...');

// Esperar a que el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM listo, cargando Firebase...');
        loadRealFirebase();
    });
} else {
    console.log('📄 DOM ya está listo, cargando Firebase...');
    loadRealFirebase();
}

// Inicializar mock inmediatamente como fallback seguro
setTimeout(() => {
    if (!window.firebaseApp) {
        console.log('🔄 Inicializando fallback seguro...');
        initializeMockFirebase();
    }
}, 1000);

console.log('🏁 firebase-app.js terminado de ejecutar');