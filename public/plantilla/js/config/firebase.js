


// console.log(window.firebase);

let auth;
let firestore;
let storage;
let database;
let analytics;

function cargarTodo() {
    auth = firebase.auth();
    firestore = firebase.firestore();
    storage = firebase.storage();
    database = firebase.database();
    analytics = firebase.analytics();
}

if(!window.firebase) {
    console.log("SE ESTÁ CARGANDO FIREBASE ALTERNO.");

    (async () => {
        await Promise.all([
            import("https://www.gstatic.com/firebasejs/7.18.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/7.18.0/firebase-auth.js"),
            import("https://www.gstatic.com/firebasejs/7.18.0/firebase-analytics.js"),
            import("https://www.gstatic.com/firebasejs/7.18.0/firebase-database.js"),
            import("https://www.gstatic.com/firebasejs/8.2.4/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/8.2.4/firebase-storage.js")
        ]);
        
        const firebaseConfig = {
            apiKey: "AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM",
            authDomain: "hekaapp-23c89.firebaseapp.com",
            databaseURL: "https://hekaapp-23c89.firebaseio.com",
            projectId: "hekaapp-23c89",
            storageBucket: "hekaapp-23c89.appspot.com",
            messagingSenderId: "539740310887",
            appId: "1:539740310887:web:66f9ab535d18addeb173c2",
            measurementId: "G-47CYMPHNRM"
        };
    
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        cargarTodo();
    })()
} else {
    cargarTodo();
}


export { auth, firestore, storage, database, analytics }