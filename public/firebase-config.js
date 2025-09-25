// Firebase Configuration
// Bu dosya Firebase Hosting'de otomatik olarak güvenli hale gelir
const firebaseConfig = {
    apiKey: "AIzaSyCnjCSzig4QIk6bjWf8lOvkMeuRh3VCpMk",
    authDomain: "fernlethewebsite.firebaseapp.com",
    projectId: "fernlethewebsite",
    storageBucket: "fernlethewebsite.firebasestorage.app",
    messagingSenderId: "731363250447",
    appId: "1:731363250447:web:3365239e454217889e6e7a",
    measurementId: "G-GYHLGKP7R6"
};

// Firebase'i başlat (Compat version)
firebase.initializeApp(firebaseConfig);

// Firestore ve Auth instance'larını al
const db = firebase.firestore();
const auth = firebase.auth();

// Global olarak erişilebilir yap
window.db = db;
window.auth = auth;
